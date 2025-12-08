import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
    request: Request,
    { params }: { params: { messageId: string } }
) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { content } = body

    const message = await prisma.message.findUnique({
        where: { id: params.messageId }
    })

    if (!message) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    if (message.userId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updatedMessage = await prisma.message.update({
        where: { id: params.messageId },
        data: {
            content,
            isEdited: true
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    role: true,
                }
            }
        }
    })

    return NextResponse.json(updatedMessage)
}

export async function DELETE(
    request: Request,
    { params }: { params: { messageId: string } }
) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    const message = await prisma.message.findUnique({
        where: { id: params.messageId }
    })

    if (!message) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    if (message.userId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.message.update({
        where: { id: params.messageId },
        data: { isDeleted: true }
    })

    return NextResponse.json({ success: true })
}
