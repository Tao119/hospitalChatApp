import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 病棟一覧取得
export async function GET() {
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

    const wards = await prisma.ward.findMany({
        where: {
            organizationId: user.organizationId
        },
        include: {
            _count: {
                select: { patients: true }
            }
        },
        orderBy: {
            code: 'asc'
        }
    })

    return NextResponse.json(wards)
}

// 病棟作成
export async function POST(request: Request) {
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

        if (!name || !code) {
            return NextResponse.json(
                { error: 'Name and code are required' },
                { status: 400 }
            )
        }

        // 同じ組織内でコードが重複していないかチェック
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

        const ward = await prisma.ward.create({
            data: {
                organizationId: user.organizationId,
                name,
                code
            }
        })

        return NextResponse.json(ward, { status: 201 })
    } catch (error) {
        console.error('Failed to create ward:', error)
        return NextResponse.json(
            { error: 'Failed to create ward' },
            { status: 500 }
        )
    }
}
