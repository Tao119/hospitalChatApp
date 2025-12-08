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

    const thread = await prisma.thread.findUnique({
        where: { id: params.threadId },
        include: {
            channel: {
                include: {
                    patient: true
                }
            },
            _count: {
                select: { messages: true }
            }
        }
    })

    if (!thread) {
        return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    return NextResponse.json(thread)
}

export async function PUT(
    request: Request,
    { params }: { params: { threadId: string } }
) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, priority, tags, isActive } = body

    const thread = await prisma.thread.update({
        where: { id: params.threadId },
        data: {
            ...(title !== undefined && { title }),
            ...(priority !== undefined && { priority }),
            ...(tags !== undefined && { tags }),
            ...(isActive !== undefined && { isActive })
        },
        include: {
            _count: {
                select: { messages: true }
            }
        }
    })

    return NextResponse.json(thread)
}
