import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting multi-tenant seed...')

    const hashedPassword = await bcrypt.hash('password123', 10)

    // スーパー管理者（プロバイダー側）を作成
    const superAdmin = await prisma.user.create({
        data: {
            email: 'super@provider.com',
            name: 'スーパー管理者',
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            organization: {
                create: {
                    name: 'プロバイダー本部',
                    code: 'PROVIDER',
                    isActive: true
                }
            }
        }
    })

    console.log('Super admin created:', superAdmin)

    // 病院1を作成
    const hospital1 = await prisma.organization.create({
        data: {
            name: '東京総合病院',
            code: 'TOKYO001',
            isActive: true
        }
    })

    // 病院1の病棟を作成
    const ward1A = await prisma.ward.create({
        data: {
            organizationId: hospital1.id,
            name: '内科病棟A',
            code: 'WARD-1A'
        }
    })

    const ward1B = await prisma.ward.create({
        data: {
            organizationId: hospital1.id,
            name: '外科病棟B',
            code: 'WARD-1B'
        }
    })

    // 病院1のユーザーを作成
    const admin1 = await prisma.user.create({
        data: {
            organizationId: hospital1.id,
            email: 'admin@tokyo001.com',
            name: '病院管理者',
            password: hashedPassword,
            role: 'ADMIN'
        }
    })

    const doctor1 = await prisma.user.create({
        data: {
            organizationId: hospital1.id,
            email: 'doctor@tokyo001.com',
            name: '山田太郎',
            password: hashedPassword,
            role: 'DOCTOR'
        }
    })

    const nurse1 = await prisma.user.create({
        data: {
            organizationId: hospital1.id,
            email: 'nurse@tokyo001.com',
            name: '佐藤花子',
            password: hashedPassword,
            role: 'NURSE'
        }
    })

    const pharmacist1 = await prisma.user.create({
        data: {
            organizationId: hospital1.id,
            email: 'pharmacist@tokyo001.com',
            name: '鈴木一郎',
            password: hashedPassword,
            role: 'PHARMACIST'
        }
    })

    console.log('Hospital 1 users created')

    // 病院1の患者を作成
    const patient1 = await prisma.patient.create({
        data: {
            organizationId: hospital1.id,
            wardId: ward1A.id,
            patientId: 'P001',
            name: '田中太郎',
            isActive: true
        }
    })

    const patient2 = await prisma.patient.create({
        data: {
            organizationId: hospital1.id,
            wardId: ward1A.id,
            patientId: 'P002',
            name: '佐藤花子',
            isActive: true
        }
    })

    const patient3 = await prisma.patient.create({
        data: {
            organizationId: hospital1.id,
            wardId: ward1B.id,
            patientId: 'P003',
            name: '鈴木次郎',
            isActive: true
        }
    })

    console.log('Hospital 1 patients created')

    // チャンネルを作成
    const channel1 = await prisma.channel.create({
        data: {
            patientId: patient1.id,
            isArchived: false
        }
    })

    const channel2 = await prisma.channel.create({
        data: {
            patientId: patient2.id,
            isArchived: false
        }
    })

    const channel3 = await prisma.channel.create({
        data: {
            patientId: patient3.id,
            isArchived: false
        }
    })

    // チャンネルメンバーを追加
    for (const channel of [channel1, channel2, channel3]) {
        for (const user of [doctor1, nurse1, pharmacist1]) {
            await prisma.channelMember.create({
                data: {
                    channelId: channel.id,
                    userId: user.id
                }
            })
        }
    }

    console.log('Channels and members created')

    // スレッドを作成
    const thread1 = await prisma.thread.create({
        data: {
            channelId: channel1.id,
            title: '入院時対応',
            priority: 'HIGH',
            tags: ['入院', '緊急']
        }
    })

    const thread2 = await prisma.thread.create({
        data: {
            channelId: channel1.id,
            title: '薬剤管理',
            priority: 'NORMAL',
            tags: ['薬剤']
        }
    })

    // サンプルメッセージ
    await prisma.message.create({
        data: {
            threadId: thread1.id,
            userId: doctor1.id,
            content: '田中太郎さんの入院手続きを開始します。'
        }
    })

    await prisma.message.create({
        data: {
            threadId: thread1.id,
            userId: nurse1.id,
            content: '了解しました。病室の準備を進めます。'
        }
    })

    console.log('Threads and messages created')

    // 病院2を作成（デモ用）
    const hospital2 = await prisma.organization.create({
        data: {
            name: '大阪中央病院',
            code: 'OSAKA001',
            isActive: true
        }
    })

    const admin2 = await prisma.user.create({
        data: {
            organizationId: hospital2.id,
            email: 'admin@osaka001.com',
            name: '大阪管理者',
            password: hashedPassword,
            role: 'ADMIN'
        }
    })

    console.log('Hospital 2 created')

    console.log('Multi-tenant seed completed successfully!')
}

main()
    .catch((e) => {
        console.error('Error during seed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
