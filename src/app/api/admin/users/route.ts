import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
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

    // 同じ組織のユーザーのみ取得
    const users = await prisma.user.findMany({
        where: {
            organizationId: currentUser.organizationId
        },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            updatedAt: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    return NextResponse.json(users)
}

export async function POST(request: Request) {
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
    const { email, name, password, role } = body

    if (!email || !name || !password || !role) {
        return NextResponse.json(
            { error: 'All fields are required' },
            { status: 400 }
        )
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                organizationId: currentUser.organizationId,
                email,
                name,
                password: hashedPassword,
                role
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        })

        return NextResponse.json(user, { status: 201 })
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'このメールアドレスは既に登録されています' },
                { status: 400 }
            )
        }
        throw error
    }
}
