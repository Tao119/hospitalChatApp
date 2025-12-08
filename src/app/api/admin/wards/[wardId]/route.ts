import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 病棟更新
export async function PUT(
    request: Request,
    { params }: { params: { wardId: string } }
) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // ユーザーの組織IDを取得
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true, role: true }
    })

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 管理者権限チェック
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { name, code } = body

        // 病棟が自分の組織に属しているか確認
        const ward = await prisma.ward.findUnique({
            where: { id: params.wardId }
        })

        if (!ward) {
            return NextResponse.json({ error: 'Ward not found' }, { status: 404 })
        }

        if (ward.organizationId !== user.organizationId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // コードが変更される場合、重複チェック
        if (code && code !== ward.code) {
            const existingWard = await prisma.ward.findUnique({
                where: {
                    organizationId_code: {
                        organizationId: user.organizationId,
                        code
                    }
                }
            })

            if (existingWard) {
                return NextResponse.json(
                    { error: 'Ward code already exists' },
                    { status: 409 }
                )
            }
        }

        const updatedWard = await prisma.ward.update({
            where: { id: params.wardId },
            data: {
                name: name || ward.name,
                code: code || ward.code
            }
        })

        return NextResponse.json(updatedWard)
    } catch (error) {
        console.error('Failed to update ward:', error)
        return NextResponse.json(
            { error: 'Failed to update ward' },
            { status: 500 }
        )
    }
}

// 病棟削除
export async function DELETE(
    request: Request,
    { params }: { params: { wardId: string } }
) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // ユーザーの組織IDを取得
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true, role: true }
    })

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 管理者権限チェック
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        // 病棟が自分の組織に属しているか確認
        const ward = await prisma.ward.findUnique({
            where: { id: params.wardId },
            include: {
                _count: {
                    select: { patients: true }
                }
            }
        })

        if (!ward) {
            return NextResponse.json({ error: 'Ward not found' }, { status: 404 })
        }

        if (ward.organizationId !== user.organizationId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // 患者が紐づいている場合は削除できない
        if (ward._count.patients > 0) {
            return NextResponse.json(
                { error: 'Cannot delete ward with patients' },
                { status: 400 }
            )
        }

        await prisma.ward.delete({
            where: { id: params.wardId }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete ward:', error)
        return NextResponse.json(
            { error: 'Failed to delete ward' },
            { status: 500 }
        )
    }
}
