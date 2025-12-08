'use client'

import { useEffect, useState } from 'react'
import { X, Check, CheckCheck } from 'lucide-react'
import { format } from 'date-fns'

interface ReadReceipt {
    id: string
    user: {
        id: string
        name: string
        role: string
    }
    readAt: string
}

interface ReadReceiptModalProps {
    isOpen: boolean
    onClose: () => void
    messageId: string
    channelMembers: Array<{ id: string; name: string; role: string }>
}

export default function ReadReceiptModal({
    isOpen,
    onClose,
    messageId,
    channelMembers
}: ReadReceiptModalProps) {
    const [readReceipts, setReadReceipts] = useState<ReadReceipt[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen && messageId) {
            loadReadReceipts()
        }
    }, [isOpen, messageId])

    const loadReadReceipts = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/messages/${messageId}/receipts`)
            const data = await res.json()
            setReadReceipts(data)
        } catch (error) {
            console.error('Failed to load read receipts:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    const readUserIds = new Set(readReceipts.map(r => r.user.id))
    const unreadMembers = channelMembers.filter(m => !readUserIds.has(m.id))

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">既読状況</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-4">読み込み中...</div>
                ) : (
                    <div className="space-y-4">
                        {readReceipts.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
                                    <CheckCheck size={16} className="text-blue-600" />
                                    <span>既読 ({readReceipts.length})</span>
                                </div>
                                <div className="space-y-2">
                                    {readReceipts.map((receipt) => (
                                        <div
                                            key={receipt.id}
                                            className="flex items-center justify-between p-2 bg-blue-50 rounded"
                                        >
                                            <div>
                                                <div className="font-medium">{receipt.user.name}</div>
                                                <div className="text-xs text-gray-500">
                                                    {getRoleLabel(receipt.user.role)}
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {format(new Date(receipt.readAt), 'M/d HH:mm')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {unreadMembers.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
                                    <Check size={16} className="text-gray-400" />
                                    <span>未読 ({unreadMembers.length})</span>
                                </div>
                                <div className="space-y-2">
                                    {unreadMembers.map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                        >
                                            <div>
                                                <div className="font-medium text-gray-600">
                                                    {member.name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {getRoleLabel(member.role)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
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
