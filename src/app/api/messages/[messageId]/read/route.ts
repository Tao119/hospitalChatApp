import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
    request: Request,
    { params }: { params: { messageId: string } }
) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // 既読レシートを作成（既に存在する場合は無視）
    const readReceipt = await prisma.readReceipt.upsert({
        where: {
            messageId_userId: {
                messageId: params.messageId,
                userId
            }
        },
        update: {},
        create: {
            messageId: params.messageId,
            userId
        }
    })

    return NextResponse.json(readReceipt)
}
