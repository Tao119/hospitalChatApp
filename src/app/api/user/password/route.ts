import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PUT(request: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
        return NextResponse.json(
            { error: '現在のパスワードと新しいパスワードを入力してください' },
            { status: 400 }
        )
    }

    if (newPassword.length < 6) {
        return NextResponse.json(
            { error: '新しいパスワードは6文字以上にしてください' },
            { status: 400 }
        )
    }

    const user = await prisma.user.findUnique({
        where: { id: userId }
    })

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 現在のパスワードを確認
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)

    if (!isPasswordValid) {
        return NextResponse.json(
            { error: '現在のパスワードが正しくありません' },
            { status: 400 }
        )
    }

    // 新しいパスワードをハッシュ化して保存
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
    })

    return NextResponse.json({ success: true })
}
