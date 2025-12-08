'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Priority } from '@/types'

interface ThreadModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (data: ThreadFormData) => Promise<void>
    channelId: string
    initialData?: {
        id?: string
        title: string
        priority: Priority
        tags: string[]
    }
}

export interface ThreadFormData {
    title: string
    priority: Priority
    tags: string[]
}

export default function ThreadModal({
    isOpen,
    onClose,
    onSave,
    channelId,
    initialData
}: ThreadModalProps) {
    const [title, setTitle] = useState('')
    const [priority, setPriority] = useState<Priority>('NORMAL')
    const [tagInput, setTagInput] = useState('')
    const [tags, setTags] = useState<string[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title)
            setPriority(initialData.priority)
            setTags(initialData.tags)
        } else {
            setTitle('')
            setPriority('NORMAL')
            setTags([])
        }
    }, [initialData, isOpen])

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()])
            setTagInput('')
        }
    }

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return

        setLoading(true)
        try {
            await onSave({ title: title.trim(), priority, tags })
            onClose()
        } catch (error) {
            console.error('Failed to save thread:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">
                        {initialData?.id ? 'スレッドを編集' : '新規スレッド作成'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            タイトル <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="例: 入院時対応"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">優先度</label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as Priority)}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="LOW">低</option>
                            <option value="NORMAL">通常</option>
                            <option value="HIGH">高</option>
                            <option value="URGENT">緊急</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">タグ</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        handleAddTag()
                                    }
                                }}
                                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="タグを入力してEnter"
                            />
                            <button
                                type="button"
                                onClick={handleAddTag}
                                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                            >
                                追加
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag, i) => (
                                <span
                                    key={i}
                                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                                >
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTag(tag)}
                                        className="hover:text-blue-600"
                                    >
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
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
                            disabled={loading || !title.trim()}
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
