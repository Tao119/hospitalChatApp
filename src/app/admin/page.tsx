'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { UserPlus, Edit, Trash2, ArrowLeft, LogOut, Building2 } from 'lucide-react'
import Link from 'next/link'

interface User {
    id: string
    email: string
    name: string
    role: string
    createdAt: string
}

export default function AdminPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        } else if (status === 'authenticated') {
            loadUsers()
        }
    }, [status, router])

    const loadUsers = async () => {
        try {
            const res = await fetch('/api/admin/users')
            if (res.status === 403) {
                alert('管理者権限が必要です')
                router.push('/chat')
                return
            }
            const data = await res.json()
            setUsers(data)
        } catch (error) {
            console.error('Failed to load users:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (userId: string) => {
        if (!confirm('このユーザーを削除してもよろしいですか？')) return

        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                await loadUsers()
            } else {
                const error = await res.json()
                alert(error.error || '削除に失敗しました')
            }
        } catch (error) {
            console.error('Failed to delete user:', error)
            alert('削除に失敗しました')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                読み込み中...
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-6xl mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <Link href="/chat" className="text-blue-600 hover:text-blue-800">
                            <ArrowLeft size={24} />
                        </Link>
                        <h1 className="text-2xl font-bold">管理画面</h1>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href="/admin/wards"
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            <Building2 size={20} />
                            病棟管理
                        </Link>
                        <button
                            onClick={() => {
                                setEditingUser(null)
                                setIsModalOpen(true)
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            <UserPlus size={20} />
                            新規ユーザー
                        </button>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            <LogOut size={20} />
                            ログアウト
                        </button>
                    </div>
                </div>

                <h2 className="text-xl font-semibold mb-4">ユーザー管理</h2>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    名前
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    メールアドレス
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    役割
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    登録日
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    操作
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                            {getRoleLabel(user.role)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => {
                                                setEditingUser(user)
                                                setIsModalOpen(true)
                                            }}
                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <UserModal
                    user={editingUser}
                    onClose={() => {
                        setIsModalOpen(false)
                        setEditingUser(null)
                    }}
                    onSave={async () => {
                        await loadUsers()
                        setIsModalOpen(false)
                        setEditingUser(null)
                    }}
                />
            )}
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

function UserModal({
    user,
    onClose,
    onSave
}: {
    user: User | null
    onClose: () => void
    onSave: () => void
}) {
    const [email, setEmail] = useState(user?.email || '')
    const [name, setName] = useState(user?.name || '')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState(user?.role || 'NURSE')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!user && !password) {
            alert('パスワードを入力してください')
            return
        }

        setLoading(true)
        try {
            const url = user ? `/api/admin/users/${user.id}` : '/api/admin/users'
            const method = user ? 'PUT' : 'POST'

            const body: any = { email, name, role }
            if (password) body.password = password

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                onSave()
            } else {
                const error = await res.json()
                alert(error.error || '保存に失敗しました')
            }
        } catch (error) {
            console.error('Failed to save user:', error)
            alert('保存に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">
                    {user ? 'ユーザー編集' : '新規ユーザー作成'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            名前 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            メールアドレス <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            パスワード {!user && <span className="text-red-500">*</span>}
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder={user ? '変更する場合のみ入力' : ''}
                            required={!user}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            役割 <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                            required
                        >
                            <option value="NURSE">看護師</option>
                            <option value="DOCTOR">医師</option>
                            <option value="PHARMACIST">薬剤師</option>
                            <option value="CARE_MANAGER">ケアマネージャー</option>
                            <option value="ADMIN">管理者</option>
                        </select>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? '保存中...' : '保存'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
