import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: Request,
    { params }: { params: { threadId: string } }
) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const [messages, total] = await Promise.all([
        prisma.message.findMany({
            where: {
                threadId: params.threadId,
                isDeleted: false
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    }
                },
                mentions: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            },
            skip,
            take: limit
        }),
        prisma.message.count({
            where: {
                threadId: params.threadId,
                isDeleted: false
            }
        })
    ])

    return NextResponse.json({ messages, total, page, limit })
}

export async function POST(
    request: Request,
    { params }: { params: { threadId: string } }
) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { content, mentions } = body

    if (!content || content.trim() === '') {
        return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const message = await prisma.message.create({
        data: {
            threadId: params.threadId,
            userId,
            content,
            mentions: mentions ? {
                create: mentions.map((mentionedUserId: string) => ({
                    userId: mentionedUserId
                }))
            } : undefined
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    role: true,
                }
            },
            mentions: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                        }
                    }
                }
            }
        }
    })

    return NextResponse.json(message, { status: 201 })
}
