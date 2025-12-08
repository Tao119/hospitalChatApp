import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: Request,
    { params }: { params: { messageId: string } }
) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const readReceipts = await prisma.readReceipt.findMany({
        where: {
            messageId: params.messageId
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    role: true
                }
            }
        },
        orderBy: {
            readAt: 'asc'
        }
    })

    return NextResponse.json(readReceipts)
}
