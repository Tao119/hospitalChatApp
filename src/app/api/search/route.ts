import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'all' // all, messages, channels

    if (!query || query.trim().length < 2) {
        return NextResponse.json({ error: 'Search query must be at least 2 characters' }, { status: 400 })
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

    const results: any = {
        messages: [],
        channels: []
    }

    // メッセージ検索
    if (type === 'all' || type === 'messages') {
        const messages = await prisma.message.findMany({
            where: {
                content: {
                    contains: query,
                    mode: 'insensitive'
                },
                isDeleted: false,
                thread: {
                    channel: {
                        members: {
                            some: { userId }
                        }
                    }
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        role: true
                    }
                },
                thread: {
                    select: {
                        id: true,
                        title: true,
                        channel: {
                            select: {
                                id: true,
                                patient: {
                                    select: {
                                        name: true,
                                        patientId: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50
        })

        results.messages = messages
    }

    // チャンネル（患者）検索
    if (type === 'all' || type === 'channels') {
        const channels = await prisma.channel.findMany({
            where: {
                patient: {
                    organizationId: user.organizationId,
                    OR: [
                        {
                            name: {
                                contains: query,
                                mode: 'insensitive'
                            }
                        },
                        {
                            patientId: {
                                contains: query,
                                mode: 'insensitive'
                            }
                        }
                    ]
                },
                members: {
                    some: { userId }
                }
            },
            include: {
                patient: true,
                _count: {
                    select: {
                        threads: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            },
            take: 20
        })

        results.channels = channels
    }

    return NextResponse.json(results)
}
