import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PUT(
    request: Request,
    { params }: { params: { userId: string } }
) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
        where: { id: (session.user as any).id }
    })

    if (currentUser?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { email, name, role, password } = body

    const updateData: any = {}
    if (email) updateData.email = email
    if (name) updateData.name = name
    if (role) updateData.role = role
    if (password) {
        updateData.password = await bcrypt.hash(password, 10)
    }

    try {
        const user = await prisma.user.update({
            where: { id: params.userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        })

        return NextResponse.json(user)
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'このメールアドレスは既に使用されています' },
                { status: 400 }
            )
        }
        throw error
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { userId: string } }
) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
        where: { id: (session.user as any).id }
    })

    if (currentUser?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 自分自身は削除できない
    if (params.userId === currentUser.id) {
        return NextResponse.json(
            { error: '自分自身を削除することはできません' },
            { status: 400 }
        )
    }

    await prisma.user.delete({
        where: { id: params.userId }
    })

    return NextResponse.json({ success: true })
}
