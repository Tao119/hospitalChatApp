import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // ユーザーの組織IDを取得
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true }
    })

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const channels = await prisma.channel.findMany({
        where: {
            patient: {
                organizationId: user.organizationId
            },
            members: {
                some: {
                    userId
                }
            }
        },
        include: {
            patient: true,
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            role: true,
                        }
                    }
                }
            },
            threads: {
                include: {
                    _count: {
                        select: { messages: true }
                    }
                },
                orderBy: {
                    updatedAt: 'desc'
                }
            }
        },
        orderBy: {
            updatedAt: 'desc'
        }
    })

    return NextResponse.json(channels)
}
