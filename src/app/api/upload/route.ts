import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // ファイルサイズチェック (10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'ファイルサイズは10MB以下にしてください' },
                { status: 400 }
            )
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // アップロードディレクトリを作成
        const uploadDir = join(process.cwd(), 'public', 'uploads')
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true })
        }

        // ファイル名を生成（タイムスタンプ + オリジナル名）
        const timestamp = Date.now()
        const filename = `${timestamp}-${file.name}`
        const filepath = join(uploadDir, filename)

        await writeFile(filepath, buffer)

        // 公開URLを返す
        const fileUrl = `/uploads/${filename}`

        return NextResponse.json({
            url: fileUrl,
            filename: file.name,
            size: file.size,
            type: file.type
        })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json(
            { error: 'ファイルのアップロードに失敗しました' },
            { status: 500 }
        )
    }
}
