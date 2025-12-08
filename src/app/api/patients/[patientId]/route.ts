import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 患者情報の更新
export async function PUT(
    request: Request,
    { params }: { params: { patientId: string } }
) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // ユーザーの組織IDを取得
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true, role: true }
    })

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // スーパー管理者は患者情報を編集できない
    if (user.role === 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { name, wardId, isActive } = body

        // 患者が自分の組織に属しているか確認
        const patient = await prisma.patient.findUnique({
            where: { id: params.patientId }
        })

        if (!patient) {
            return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
        }

        if (patient.organizationId !== user.organizationId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // 患者情報を更新
        const updatedPatient = await prisma.patient.update({
            where: { id: params.patientId },
            data: {
                ...(name !== undefined && { name }),
                ...(wardId !== undefined && { wardId }),
                ...(isActive !== undefined && { isActive })
            },
            include: {
                ward: true
            }
        })

        // 退院処理（isActive = false）の場合、チャンネルをアーカイブ
        if (isActive === false) {
            await prisma.channel.updateMany({
                where: { patientId: params.patientId },
                data: { isArchived: true }
            })
        }

        return NextResponse.json(updatedPatient)
    } catch (error) {
        console.error('Failed to update patient:', error)
        return NextResponse.json(
            { error: 'Failed to update patient' },
            { status: 500 }
        )
    }
}

// 患者情報の削除
export async function DELETE(
    request: Request,
    { params }: { params: { patientId: string } }
) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // ユーザーの組織IDを取得
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true, role: true }
    })

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 管理者のみ削除可能
    if (user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        // 患者が自分の組織に属しているか確認
        const patient = await prisma.patient.findUnique({
            where: { id: params.patientId }
        })

        if (!patient) {
            return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
        }

        if (patient.organizationId !== user.organizationId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // 患者を削除（カスケード削除でチャンネルも削除される）
        await prisma.patient.delete({
            where: { id: params.patientId }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete patient:', error)
        return NextResponse.json(
            { error: 'Failed to delete patient' },
            { status: 500 }
        )
    }
}
