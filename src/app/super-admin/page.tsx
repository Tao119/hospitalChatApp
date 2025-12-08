'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Building2, Plus, Edit, Trash2, Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Organization {
    id: string
    name: string
    code: string
    isActive: boolean
    createdAt: string
    _count: {
        users: number
        patients: number
        wards: number
    }
}

export default function SuperAdminPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        } else if (status === 'authenticated') {
            loadOrganizations()
        }
    }, [status, router])

    const loadOrganizations = async () => {
        try {
            const res = await fetch('/api/super-admin/organizations')
            if (res.status === 403) {
                alert('スーパー管理者権限が必要です')
                router.push('/chat')
                return
            }
            const data = await res.json()
            setOrganizations(data)
        } catch (error) {
            console.error('Failed to load organizations:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (orgId: string) => {
        if (!confirm('この病院を削除してもよろしいですか？すべてのデータが削除されます。')) return

        try {
            const res = await fetch(`/api/super-admin/organizations/${orgId}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                await loadOrganizations()
            } else {
                const error = await res.json()
                alert(error.error || '削除に失敗しました')
            }
        } catch (error) {
            console.error('Failed to delete organization:', error)
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
            <div className="max-w-7xl mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <Link href="/chat" className="text-blue-600 hover:text-blue-800">
                            <ArrowLeft size={24} />
                        </Link>
                        <h1 className="text-2xl font-bold">プロバイダー管理画面</h1>
                    </div>
                    <button
                        onClick={() => {
                            setEditingOrg(null)
                            setIsModalOpen(true)
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        <Plus size={20} />
                        新規病院登録
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {organizations.map((org) => (
                        <div key={org.id} className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Building2 size={24} className="text-blue-600" />
                                    <div>
                                        <h3 className="font-bold text-lg">{org.name}</h3>
                                        <p className="text-sm text-gray-500">{org.code}</p>
                                    </div>
                                </div>
                                <span
                                    className={`px-2 py-1 text-xs rounded ${org.isActive
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                        }`}
                                >
                                    {org.isActive ? '稼働中' : '停止中'}
                                </span>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">ユーザー数</span>
                                    <span className="font-medium">{org._count.users}人</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">病棟数</span>
                                    <span className="font-medium">{org._count.wards}棟</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Link
                                    href={`/super-admin/organizations/${org.id}`}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded hover:bg-gray-50"
                                >
                                    <Users size={16} />
                                    <span className="text-sm">詳細</span>
                                </Link>
                                <button
                                    onClick={() => {
                                        setEditingOrg(org)
                                        setIsModalOpen(true)
                                    }}
                                    className="px-3 py-2 border rounded hover:bg-gray-50"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(org.id)}
                                    className="px-3 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {organizations.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        登録されている病院がありません
                    </div>
                )}
            </div>

            {isModalOpen && (
                <OrganizationModal
                    organization={editingOrg}
                    onClose={() => {
                        setIsModalOpen(false)
                        setEditingOrg(null)
                    }}
                    onSave={async () => {
                        await loadOrganizations()
                        setIsModalOpen(false)
                        setEditingOrg(null)
                    }}
                />
            )}
        </div>
    )
}

function OrganizationModal({
    organization,
    onClose,
    onSave
}: {
    organization: Organization | null
    onClose: () => void
    onSave: () => void
}) {
    const [name, setName] = useState(organization?.name || '')
    const [code, setCode] = useState(organization?.code || '')
    const [isActive, setIsActive] = useState(organization?.isActive ?? true)
    const [adminEmail, setAdminEmail] = useState('')
    const [adminName, setAdminName] = useState('')
    const [adminPassword, setAdminPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        setLoading(true)
        try {
            const url = organization
                ? `/api/super-admin/organizations/${organization.id}`
                : '/api/super-admin/organizations'
            const method = organization ? 'PUT' : 'POST'

            const body: any = { name, code, isActive }
            if (!organization) {
                body.adminEmail = adminEmail
                body.adminName = adminName
                body.adminPassword = adminPassword
            }

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
            console.error('Failed to save organization:', error)
            alert('保存に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">
                    {organization ? '病院情報編集' : '新規病院登録'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            病院名 <span className="text-red-500">*</span>
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
                            病院コード <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="例: TOKYO001"
                            required
                            disabled={!!organization}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            id="isActive"
                        />
                        <label htmlFor="isActive" className="text-sm">
                            稼働中
                        </label>
                    </div>

                    {!organization && (
                        <>
                            <hr />
                            <p className="text-sm text-gray-600">管理者アカウント情報</p>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    管理者名 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={adminName}
                                    onChange={(e) => setAdminName(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    管理者メールアドレス <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={adminEmail}
                                    onChange={(e) => setAdminEmail(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    初期パスワード <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    minLength={6}
                                    required
                                />
                            </div>
                        </>
                    )}

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
