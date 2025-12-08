import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { channelId, title, priority, tags } = body

    if (!channelId || !title) {
        return NextResponse.json(
            { error: 'channelId and title are required' },
            { status: 400 }
        )
    }

    const thread = await prisma.thread.create({
        data: {
            channelId,
            title,
            priority: priority || 'NORMAL',
            tags: tags || []
        },
        include: {
            _count: {
                select: { messages: true }
            }
        }
    })

    return NextResponse.json(thread, { status: 201 })
}
