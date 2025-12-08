'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Lock, LogOut } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    if (status === 'unauthenticated') {
        router.push('/login')
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: '新しいパスワードが一致しません' })
            return
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'パスワードは6文字以上にしてください' })
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/user/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            })

            if (res.ok) {
                setMessage({ type: 'success', text: 'パスワードを変更しました' })
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
            } else {
                const error = await res.json()
                setMessage({ type: 'error', text: error.error || 'パスワードの変更に失敗しました' })
            }
        } catch (error) {
            console.error('Failed to change password:', error)
            setMessage({ type: 'error', text: 'パスワードの変更に失敗しました' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-2xl mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <Link href="/chat" className="text-blue-600 hover:text-blue-800">
                            <ArrowLeft size={24} />
                        </Link>
                        <h1 className="text-2xl font-bold">ユーザー設定</h1>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        <LogOut size={20} />
                        ログアウト
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">プロフィール</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm text-gray-600">名前</label>
                            <p className="font-medium">{session?.user?.name}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">メールアドレス</label>
                            <p className="font-medium">{session?.user?.email}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">役割</label>
                            <p className="font-medium">
                                {getRoleLabel((session?.user as any)?.role)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Lock size={20} />
                        <h2 className="text-lg font-semibold">パスワード変更</h2>
                    </div>

                    {message && (
                        <div
                            className={`mb-4 p-3 rounded ${message.type === 'success'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}
                        >
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                現在のパスワード <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                新しいパスワード <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                minLength={6}
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">6文字以上で入力してください</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                新しいパスワード（確認） <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                minLength={6}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? '変更中...' : 'パスワードを変更'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

function getRoleLabel(role: string) {
    const labels: Record<string, string> = {
        ADMIN: '管理者',
        DOCTOR: '医師',
        NURSE: '看護師',
        PHARMACIST: '薬剤師',
        CARE_MANAGER: 'ケアマネージャー'
    }
    return labels[role] || role
}
