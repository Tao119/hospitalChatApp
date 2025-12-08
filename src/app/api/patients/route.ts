import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
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

    // スーパー管理者は患者登録不可（患者データにアクセスできない）
    if (user.role === 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { patientId, name, wardId } = body

        if (!patientId || !name) {
            return NextResponse.json(
                { error: 'Patient ID and name are required' },
                { status: 400 }
            )
        }

        // 同じ組織内で患者IDが重複していないかチェック
        const existingPatient = await prisma.patient.findUnique({
            where: {
                organizationId_patientId: {
                    organizationId: user.organizationId,
                    patientId
                }
            }
        })

        if (existingPatient) {
            return NextResponse.json(
                { error: 'Patient ID already exists' },
                { status: 409 }
            )
        }

        // 患者を作成
        const patient = await prisma.patient.create({
            data: {
                organizationId: user.organizationId,
                patientId,
                name,
                wardId: wardId || null,
                isActive: true
            }
        })

        // チャンネルを作成
        const channel = await prisma.channel.create({
            data: {
                patientId: patient.id,
                isArchived: false
            }
        })

        // 作成者を自動的にメンバーに追加
        await prisma.channelMember.create({
            data: {
                channelId: channel.id,
                userId
            }
        })

        // デフォルトスレッドを作成
        await prisma.thread.create({
            data: {
                channelId: channel.id,
                title: '一般',
                priority: 'NORMAL',
                tags: []
            }
        })

        return NextResponse.json({
            patient,
            channel
        }, { status: 201 })
    } catch (error) {
        console.error('Failed to create patient:', error)
        return NextResponse.json(
            { error: 'Failed to create patient' },
            { status: 500 }
        )
    }
}
