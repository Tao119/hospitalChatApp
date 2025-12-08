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

    // ユーザーが参加しているチャンネルを取得
    const channels = await prisma.channel.findMany({
        where: {
            members: {
                some: { userId }
            }
        },
        include: {
            threads: {
                include: {
                    messages: {
                        where: {
                            isDeleted: false,
                            userId: { not: userId } // 自分のメッセージは除外
                        },
                        select: {
                            id: true,
                            readReceipts: {
                                where: { userId },
                                select: { id: true }
                            }
                        }
                    }
                }
            }
        }
    })

    // チャンネルごと・スレッドごとの未読数を計算
    const unreadData = channels.map(channel => {
        let totalUnreadCount = 0
        const threadUnreads: Record<string, number> = {}

        channel.threads.forEach(thread => {
            let threadUnreadCount = 0

            thread.messages.forEach(message => {
                // 既読レシートがない = 未読
                if (message.readReceipts.length === 0) {
                    threadUnreadCount++
                    totalUnreadCount++
                }
            })

            threadUnreads[thread.id] = threadUnreadCount
        })

        return {
            channelId: channel.id,
            unreadCount: totalUnreadCount,
            threadUnreads
        }
    })

    return NextResponse.json(unreadData)
}
