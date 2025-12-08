import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting seed...')

    // ユーザーを作成
    const hashedPassword = await bcrypt.hash('password123', 10)

    const doctor = await prisma.user.upsert({
        where: { email: 'doctor@hospital.com' },
        update: {},
        create: {
            email: 'doctor@hospital.com',
            name: '山田太郎',
            password: hashedPassword,
            role: 'DOCTOR'
        }
    })

    const nurse = await prisma.user.upsert({
        where: { email: 'nurse@hospital.com' },
        update: {},
        create: {
            email: 'nurse@hospital.com',
            name: '佐藤花子',
            password: hashedPassword,
            role: 'NURSE'
        }
    })

    const pharmacist = await prisma.user.upsert({
        where: { email: 'pharmacist@hospital.com' },
        update: {},
        create: {
            email: 'pharmacist@hospital.com',
            name: '鈴木一郎',
            password: hashedPassword,
            role: 'PHARMACIST'
        }
    })

    const admin = await prisma.user.upsert({
        where: { email: 'admin@hospital.com' },
        update: {},
        create: {
            email: 'admin@hospital.com',
            name: '管理者',
            password: hashedPassword,
            role: 'ADMIN'
        }
    })

    console.log('Users created:', { doctor, nurse, pharmacist, admin })

    // 患者を作成
    const patient1 = await prisma.patient.upsert({
        where: { patientId: 'P001' },
        update: {},
        create: {
            patientId: 'P001',
            name: '田中太郎',
            isActive: true
        }
    })

    const patient2 = await prisma.patient.upsert({
        where: { patientId: 'P002' },
        update: {},
        create: {
            patientId: 'P002',
            name: '佐藤花子',
            isActive: true
        }
    })

    const patient3 = await prisma.patient.upsert({
        where: { patientId: 'P003' },
        update: {},
        create: {
            patientId: 'P003',
            name: '鈴木次郎',
            isActive: true
        }
    })

    console.log('Patients created:', { patient1, patient2, patient3 })

    // チャンネルを作成
    const channel1 = await prisma.channel.upsert({
        where: { patientId: patient1.id },
        update: {},
        create: {
            patientId: patient1.id,
            isArchived: false
        }
    })

    const channel2 = await prisma.channel.upsert({
        where: { patientId: patient2.id },
        update: {},
        create: {
            patientId: patient2.id,
            isArchived: false
        }
    })

    const channel3 = await prisma.channel.upsert({
        where: { patientId: patient3.id },
        update: {},
        create: {
            patientId: patient3.id,
            isArchived: false
        }
    })

    console.log('Channels created:', { channel1, channel2, channel3 })

    // チャンネルメンバーを追加
    await prisma.channelMember.upsert({
        where: {
            channelId_userId: {
                channelId: channel1.id,
                userId: doctor.id
            }
        },
        update: {},
        create: {
            channelId: channel1.id,
            userId: doctor.id
        }
    })

    await prisma.channelMember.upsert({
        where: {
            channelId_userId: {
                channelId: channel1.id,
                userId: nurse.id
            }
        },
        update: {},
        create: {
            channelId: channel1.id,
            userId: nurse.id
        }
    })

    await prisma.channelMember.upsert({
        where: {
            channelId_userId: {
                channelId: channel1.id,
                userId: pharmacist.id
            }
        },
        update: {},
        create: {
            channelId: channel1.id,
            userId: pharmacist.id
        }
    })

    // チャンネル2と3にもメンバーを追加
    for (const channel of [channel2, channel3]) {
        for (const user of [doctor, nurse, pharmacist]) {
            await prisma.channelMember.upsert({
                where: {
                    channelId_userId: {
                        channelId: channel.id,
                        userId: user.id
                    }
                },
                update: {},
                create: {
                    channelId: channel.id,
                    userId: user.id
                }
            })
        }
    }

    console.log('Channel members added')

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

    const thread3 = await prisma.thread.create({
        data: {
            channelId: channel1.id,
            title: '退院準備',
            priority: 'LOW',
            tags: ['退院']
        }
    })

    console.log('Threads created:', { thread1, thread2, thread3 })

    // サンプルメッセージを作成
    await prisma.message.create({
        data: {
            threadId: thread1.id,
            userId: doctor.id,
            content: '田中太郎さんの入院手続きを開始します。'
        }
    })

    await prisma.message.create({
        data: {
            threadId: thread1.id,
            userId: nurse.id,
            content: '了解しました。病室の準備を進めます。'
        }
    })

    await prisma.message.create({
        data: {
            threadId: thread2.id,
            userId: pharmacist.id,
            content: '処方箋を確認しました。薬剤の準備を開始します。'
        }
    })

    console.log('Sample messages created')

    console.log('Seed completed successfully!')
}

main()
    .catch((e) => {
        console.error('Error during seed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
