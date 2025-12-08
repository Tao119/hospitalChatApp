import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: Request,
    { params }: { params: { orgId: string } }
) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
        where: { id: (session.user as any).id }
    })

    if (currentUser?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const organization = await prisma.organization.findUnique({
            where: { id: params.orgId },
            include: {
                _count: {
                    select: {
                        users: true,
                        wards: true
                    }
                }
            }
        })

        if (!organization) {
            return NextResponse.json(
                { error: '組織が見つかりません' },
                { status: 404 }
            )
        }

        return NextResponse.json(organization)
    } catch (error) {
        console.error('Failed to fetch organization:', error)
        return NextResponse.json(
            { error: 'Failed to fetch organization' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { orgId: string } }
) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
        where: { id: (session.user as any).id }
    })

    if (currentUser?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, isActive } = body

    try {
        const organization = await prisma.organization.update({
            where: { id: params.orgId },
            data: {
                ...(name !== undefined && { name }),
                ...(isActive !== undefined && { isActive })
            },
            include: {
                _count: {
                    select: {
                        users: true,
                        wards: true
                    }
                }
            }
        })

        return NextResponse.json(organization)
    } catch (error: any) {
        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: '病院が見つかりません' },
                { status: 404 }
            )
        }
        throw error
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { orgId: string } }
) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
        where: { id: (session.user as any).id }
    })

    if (currentUser?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // プロバイダー本部は削除できない
    const org = await prisma.organization.findUnique({
        where: { id: params.orgId }
    })

    if (org?.code === 'PROVIDER') {
        return NextResponse.json(
            { error: 'プロバイダー本部は削除できません' },
            { status: 400 }
        )
    }

    await prisma.organization.delete({
        where: { id: params.orgId }
    })

    return NextResponse.json({ success: true })
}
