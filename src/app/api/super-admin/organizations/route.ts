import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
        where: { id: (session.user as any).id }
    })

    if (currentUser?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const organizations = await prisma.organization.findMany({
        include: {
            _count: {
                select: {
                    users: true,
                    wards: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    return NextResponse.json(organizations)
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
        where: { id: (session.user as any).id }
    })

    if (currentUser?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, code, isActive, adminEmail, adminName, adminPassword } = body

    if (!name || !code || !adminEmail || !adminName || !adminPassword) {
        return NextResponse.json(
            { error: 'All fields are required' },
            { status: 400 }
        )
    }

    try {
        // 病院と管理者を同時に作成
        const hashedPassword = await bcrypt.hash(adminPassword, 10)

        const organization = await prisma.organization.create({
            data: {
                name,
                code,
                isActive: isActive ?? true,
                users: {
                    create: {
                        email: adminEmail,
                        name: adminName,
                        password: hashedPassword,
                        role: 'ADMIN'
                    }
                }
            },
            include: {
                _count: {
                    select: {
                        users: true,
                        patients: true,
                        wards: true
                    }
                }
            }
        })

        return NextResponse.json(organization, { status: 201 })
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'この病院コードまたはメールアドレスは既に使用されています' },
                { status: 400 }
            )
        }
        throw error
    }
}
