'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Users, Building2, Edit, Save, X } from 'lucide-react'
import Link from 'next/link'

interface Organization {
    id: string
    name: string
    code: string
    isActive: boolean
    createdAt: string
    _count: {
        users: number
        wards: number
    }
}

interface User {
    id: string
    email: string
    name: string
    role: string
}

interface Ward {
    id: string
    name: string
    code: string
}

export default function OrganizationDetailPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const params = useParams()
    const orgId = params.orgId as string

    const [organization, setOrganization] = useState<Organization | null>(null)
    const [users, setUsers] = useState<User[]>([])
    const [wards, setWards] = useState<Ward[]>([])
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({ name: '', code: '', isActive: true })

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        } else if (status === 'authenticated') {
            loadOrganization()
            loadUsers()
            loadWards()
        }
    }, [status, router, orgId])

    const loadOrganization = async () => {
        try {
            const res = await fetch(`/api/super-admin/organizations/${orgId}`)
            if (res.status === 403) {
                alert('スーパー管理者権限が必要です')
                router.push('/chat')
                return
            }
            if (res.status === 404) {
                alert('組織が見つかりません')
                router.push('/super-admin')
                return
            }
            const data = await res.json()
            setOrganization(data)
            setEditForm({
                name: data.name,
                code: data.code,
                isActive: data.isActive
            })
        } catch (error) {
            console.error('Failed to load organization:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadUsers = async () => {
        try {
            const res = await fetch(`/api/super-admin/organizations/${orgId}/users`)
            if (res.ok) {
                const data = await res.json()
                setUsers(data)
            }
        } catch (error) {
            console.error('Failed to load users:', error)
        }
    }

    const loadWards = async () => {
        try {
            const res = await fetch(`/api/super-admin/organizations/${orgId}/wards`)
            if (res.ok) {
                const data = await res.json()
                setWards(data)
            }
        } catch (error) {
            console.error('Failed to load wards:', error)
        }
    }

    const handleSave = async () => {
        try {
            const res = await fetch(`/api/super-admin/organizations/${orgId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            })

            if (res.ok) {
                await loadOrganization()
                setIsEditing(false)
            } else {
                const error = await res.json()
                alert(error.error || '更新に失敗しました')
            }
        } catch (error) {
            console.error('Failed to update organization:', error)
            alert('更新に失敗しました')
        }
    }

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            SUPER_ADMIN: 'スーパー管理者',
            ADMIN: '管理者',
            DOCTOR: '医師',
            NURSE: '看護師',
            PHARMACIST: '薬剤師',
            CARE_MANAGER: 'ケアマネージャー'
        }
        return labels[role] || role
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                読み込み中...
            </div>
        )
    }

    if (!organization) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                組織が見つかりません
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-6xl mx-auto p-6">
                {/* ヘッダー */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <Link href="/super-admin" className="text-blue-600 hover:text-blue-800">
                            <ArrowLeft size={24} />
                        </Link>
                        <h1 className="text-2xl font-bold">組織詳細</h1>
                    </div>
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            <Edit size={20} />
                            編集
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setIsEditing(false)
                                    setEditForm({
                                        name: organization.name,
                                        code: organization.code,
                                        isActive: organization.isActive
                                    })
                                }}
                                className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50"
                            >
                                <X size={20} />
                                キャンセル
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                <Save size={20} />
                                保存
                            </button>
                        </div>
                    )}
                </div>

                {/* 組織情報 */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">基本情報</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                組織名
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md"
                                />
                            ) : (
                                <p className="text-lg">{organization.name}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                組織コード
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editForm.code}
                                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md"
                                    disabled
                                />
                            ) : (
                                <p className="text-lg">{organization.code}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ステータス
                            </label>
                            {isEditing ? (
                                <select
                                    value={editForm.isActive ? 'active' : 'inactive'}
                                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'active' })}
                                    className="w-full px-3 py-2 border rounded-md"
                                >
                                    <option value="active">有効</option>
                                    <option value="inactive">無効</option>
                                </select>
                            ) : (
                                <span className={`px-2 py-1 text-sm rounded-full ${organization.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}>
                                    {organization.isActive ? '有効' : '無効'}
                                </span>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                登録日
                            </label>
                            <p className="text-lg">
                                {new Date(organization.createdAt).toLocaleDateString('ja-JP')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 統計情報 */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="text-blue-600" size={24} />
                            <h3 className="font-semibold">ユーザー数</h3>
                        </div>
                        <p className="text-3xl font-bold">{organization._count.users}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Building2 className="text-green-600" size={24} />
                            <h3 className="font-semibold">病棟数</h3>
                        </div>
                        <p className="text-3xl font-bold">{organization._count.wards}</p>
                    </div>
                </div>

                {/* ユーザー一覧 */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">ユーザー一覧</h2>
                    {users.length === 0 ? (
                        <p className="text-gray-500">ユーザーがいません</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">名前</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">メールアドレス</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">役割</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">{user.name}</td>
                                            <td className="px-4 py-3">{user.email}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                                    {getRoleLabel(user.role)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* 病棟一覧 */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">病棟一覧</h2>
                    {wards.length === 0 ? (
                        <p className="text-gray-500">病棟がありません</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {wards.map((ward) => (
                                <div key={ward.id} className="border rounded-lg p-4">
                                    <h3 className="font-semibold mb-1">{ward.name}</h3>
                                    <p className="text-sm text-gray-500">{ward.code}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
