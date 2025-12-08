'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface PatientModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (data: PatientFormData) => Promise<void>
}

export interface PatientFormData {
    patientId: string
    name: string
}

export default function PatientModal({ isOpen, onClose, onSave }: PatientModalProps) {
    const [patientId, setPatientId] = useState('')
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!isOpen) {
            setPatientId('')
            setName('')
        }
    }, [isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!patientId.trim() || !name.trim()) return

        setLoading(true)
        try {
            await onSave({
                patientId: patientId.trim(),
                name: name.trim()
            })
            onClose()
        } catch (error) {
            console.error('Failed to create patient:', error)
            alert('患者の登録に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">新規患者登録</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            患者ID <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={patientId}
                            onChange={(e) => setPatientId(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="例: P001"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            患者名 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="例: 田中太郎"
                            required
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
                            disabled={loading || !patientId.trim() || !name.trim()}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? '登録中...' : '登録'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
