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

    const userId = (session.user as any).id

    // スーパー管理者権限チェック
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
    })

    if (!user || user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const wards = await prisma.ward.findMany({
            where: {
                organizationId: params.orgId
            },
            select: {
                id: true,
                name: true,
                code: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: {
                code: 'asc'
            }
        })

        return NextResponse.json(wards)
    } catch (error) {
        console.error('Failed to fetch wards:', error)
        return NextResponse.json(
            { error: 'Failed to fetch wards' },
            { status: 500 }
        )
    }
}
