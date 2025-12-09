import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: Request) {
    try {
        // 本番環境では特別なシークレットキーが必要
        if (process.env.NODE_ENV === 'production') {
            const { secret } = await request.json()
            if (secret !== process.env.SEED_SECRET) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
        }

        console.log('Starting multi-tenant seed...')

        // 既存データをクリア
        await prisma.message.deleteMany()
        await prisma.thread.deleteMany()
        await prisma.channelMember.deleteMany()
        await prisma.channel.deleteMany()
        await prisma.patient.deleteMany()
        await prisma.ward.deleteMany()
        await prisma.user.deleteMany()
        await prisma.organization.deleteMany()

        // プロバイダー組織を作成
        const providerOrg = await prisma.organization.create({
            data: {
                name: 'システムプロバイダー',
                code: 'PROVIDER001',
            },
        })

        // スーパー管理者を作成
        const hashedPassword = await bcrypt.hash('password123', 10)
        const superAdmin = await prisma.user.create({
            data: {
                email: 'super@example.com',
                name: 'スーパー管理者',
                password: hashedPassword,
                role: 'SUPER_ADMIN',
                organizationId: providerOrg.id,
            },
        })

        console.log('Super admin created:', superAdmin.email)

        // 病院1を作成
        const hospital1 = await prisma.organization.create({
            data: {
                name: '総合病院A',
                code: 'HOSP001',
            },
        })

        // 病院1の病棟を作成
        const ward1 = await prisma.ward.create({
            data: {
                name: '内科病棟',
                code: 'WARD001',
                organizationId: hospital1.id,
            },
        })

        const ward2 = await prisma.ward.create({
            data: {
                name: '外科病棟',
                code: 'WARD002',
                organizationId: hospital1.id,
            },
        })

        // 病院1のユーザーを作成
        const admin1 = await prisma.user.create({
            data: {
                email: 'admin@hospital1.com',
                name: '管理者 太郎',
                password: hashedPassword,
                role: 'ADMIN',
                organizationId: hospital1.id,
            },
        })

        const nurse1 = await prisma.user.create({
            data: {
                email: 'nurse1@hospital1.com',
                name: '看護師 花子',
                password: hashedPassword,
                role: 'NURSE',
                organizationId: hospital1.id,
            },
        })

        const nurse2 = await prisma.user.create({
            data: {
                email: 'nurse2@hospital1.com',
                name: '看護師 次郎',
                password: hashedPassword,
                role: 'NURSE',
                organizationId: hospital1.id,
            },
        })

        const doctor1 = await prisma.user.create({
            data: {
                email: 'doctor1@hospital1.com',
                name: '医師 三郎',
                password: hashedPassword,
                role: 'DOCTOR',
                organizationId: hospital1.id,
            },
        })

        console.log('Hospital 1 users created')

        // 患者を作成
        const patient1 = await prisma.patient.create({
            data: {
                patientId: 'P001',
                name: '患者 一郎',
                organizationId: hospital1.id,
                wardId: ward1.id,
            },
        })

        const patient2 = await prisma.patient.create({
            data: {
                patientId: 'P002',
                name: '患者 二郎',
                organizationId: hospital1.id,
                wardId: ward1.id,
            },
        })

        console.log('Hospital 1 patients created')

        // チャンネルを作成（患者ごとに1つ）
        const channel1 = await prisma.channel.create({
            data: {
                patientId: patient1.id,
            },
        })

        const channel2 = await prisma.channel.create({
            data: {
                patientId: patient2.id,
            },
        })

        // チャンネルメンバーを追加
        await prisma.channelMember.createMany({
            data: [
                { channelId: channel1.id, userId: admin1.id },
                { channelId: channel1.id, userId: nurse1.id },
                { channelId: channel1.id, userId: nurse2.id },
                { channelId: channel1.id, userId: doctor1.id },
                { channelId: channel2.id, userId: nurse1.id },
                { channelId: channel2.id, userId: nurse2.id },
                { channelId: channel2.id, userId: doctor1.id },
            ],
        })

        console.log('Channels and members created')

        // スレッドとメッセージを作成
        const thread1 = await prisma.thread.create({
            data: {
                channelId: channel1.id,
                title: '申し送り事項',
            },
        })

        await prisma.message.create({
            data: {
                content: '本日の申し送り事項です。患者様の状態は安定しています。',
                threadId: thread1.id,
                userId: nurse1.id,
            },
        })

        await prisma.message.create({
            data: {
                content: '了解しました。引き続き観察を続けます。',
                threadId: thread1.id,
                userId: nurse2.id,
            },
        })

        const thread2 = await prisma.thread.create({
            data: {
                channelId: channel2.id,
                title: 'バイタルサイン記録',
            },
        })

        await prisma.message.create({
            data: {
                content: '体温37.2度、血圧120/80、脈拍72回/分',
                threadId: thread2.id,
                userId: nurse1.id,
            },
        })

        console.log('Threads and messages created')

        // 病院2を作成
        const hospital2 = await prisma.organization.create({
            data: {
                name: '総合病院B',
                code: 'HOSP002',
            },
        })

        const admin2 = await prisma.user.create({
            data: {
                email: 'admin@hospital2.com',
                name: '管理者 四郎',
                password: hashedPassword,
                role: 'ADMIN',
                organizationId: hospital2.id,
            },
        })

        console.log('Hospital 2 created')

        return NextResponse.json({
            success: true,
            message: 'Multi-tenant seed completed successfully!',
            data: {
                organizations: 3,
                users: 6,
                wards: 2,
                patients: 2,
                channels: 2,
                threads: 2,
                messages: 3,
            },
        })
    } catch (error) {
        console.error('Seed error:', error)
        return NextResponse.json(
            { error: 'Failed to seed database', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
