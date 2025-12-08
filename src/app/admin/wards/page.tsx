'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, ArrowLeft, Users } from 'lucide-react'
import Link from 'next/link'

interface Ward {
    id: string
    name: string
    code: string
    _count: {
        patients: number
    }
}

export default function WardsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [wards, setWards] = useState<Ward[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingWard, setEditingWard] = useState<Ward | null>(null)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        } else if (status === 'authenticated') {
            loadWards()
        }
    }, [status, router])

    const loadWards = async () => {
        try {
            const res = await fetch('/api/admin/wards')
            if (res.status === 403) {
                alert('管理者権限が必要です')
                router.push('/chat')
                return
            }
            const data = await res.json()
            setWards(data)
        } catch (error) {
            console.error('Failed to load wards:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (wardId: string) => {
        if (!confirm('この病棟を削除してもよろしいですか？')) return

        try {
            const res = await fetch(`/api/admin/wards/${wardId}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                await loadWards()
            } else {
                const error = await res.json()
                alert(error.error || '削除に失敗しました')
            }
        } catch (error) {
            console.error('Failed to delete ward:', error)
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
                        <Link href="/admin" className="text-blue-600 hover:text-blue-800">
                            <ArrowLeft size={24} />
                        </Link>
                        <h1 className="text-2xl font-bold">病棟管理</h1>
                    </div>
                    <button
                        onClick={() => {
                            setEditingWard(null)
                            setIsModalOpen(true)
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        <Plus size={20} />
                        新規病棟
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wards.map((ward) => (
                        <div key={ward.id} className="bg-white rounded-lg shadow p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold">{ward.name}</h3>
                                    <p className="text-sm text-gray-500">{ward.code}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => {
                                            setEditingWard(ward)
                                            setIsModalOpen(true)
                                        }}
                                        className="p-1 hover:bg-gray-100 rounded"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(ward.id)}
                                        className="p-1 hover:bg-red-100 text-red-600 rounded"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Users size={16} />
                                <span>{ward._count.patients}人の患者</span>
                            </div>
                        </div>
                    ))}
                </div>

                {wards.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        登録されている病棟がありません
                    </div>
                )}
            </div>

            {isModalOpen && (
                <WardModal
                    ward={editingWard}
                    onClose={() => {
                        setIsModalOpen(false)
                        setEditingWard(null)
                    }}
                    onSave={async () => {
                        await loadWards()
                        setIsModalOpen(false)
                        setEditingWard(null)
                    }}
                />
            )}
        </div>
    )
}

function WardModal({
    ward,
    onClose,
    onSave
}: {
    ward: Ward | null
    onClose: () => void
    onSave: () => void
}) {
    const [name, setName] = useState(ward?.name || '')
    const [code, setCode] = useState(ward?.code || '')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        setLoading(true)
        try {
            const url = ward ? `/api/admin/wards/${ward.id}` : '/api/admin/wards'
            const method = ward ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, code })
            })

            if (res.ok) {
                onSave()
            } else {
                const error = await res.json()
                alert(error.error || '保存に失敗しました')
            }
        } catch (error) {
            console.error('Failed to save ward:', error)
            alert('保存に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">
                    {ward ? '病棟編集' : '新規病棟登録'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            病棟名 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="例: 内科病棟A"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            病棟コード <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="例: WARD-1A"
                            required
                            disabled={!!ward}
                        />
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
