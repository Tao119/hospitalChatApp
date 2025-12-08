import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
    request: Request,
    { params }: { params: { threadId: string } }
) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // スレッド内の全メッセージを取得
    const messages = await prisma.message.findMany({
        where: {
            threadId: params.threadId,
            isDeleted: false,
            userId: { not: userId } // 自分のメッセージは除外
        },
        select: { id: true }
    })

    // 既読レシートを一括作成
    const readReceipts = await Promise.all(
        messages.map(message =>
            prisma.readReceipt.upsert({
                where: {
                    messageId_userId: {
                        messageId: message.id,
                        userId
                    }
                },
                update: {},
                create: {
                    messageId: message.id,
                    userId
                }
            })
        )
    )

    return NextResponse.json({ count: readReceipts.length })
}
