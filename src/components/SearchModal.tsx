'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, MessageSquare, Hash, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface SearchResult {
    messages: Array<{
        id: string
        content: string
        createdAt: string
        user: {
            id: string
            name: string
            role: string
        }
        thread: {
            id: string
            title: string
            channel: {
                id: string
                patient: {
                    name: string
                    patientId: string
                }
            }
        }
    }>
    channels: Array<{
        id: string
        patient: {
            id: string
            name: string
            patientId: string
        }
        _count: {
            threads: number
        }
    }>
}

interface SearchModalProps {
    isOpen: boolean
    onClose: () => void
    onSelectMessage?: (channelId: string, threadId: string) => void
    onSelectChannel?: (channelId: string) => void
}

export default function SearchModal({
    isOpen,
    onClose,
    onSelectMessage,
    onSelectChannel
}: SearchModalProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult>({ messages: [], channels: [] })
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'all' | 'messages' | 'channels'>('all')
    const inputRef = useRef<HTMLInputElement>(null)
    const searchTimeoutRef = useRef<NodeJS.Timeout>()

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus()
        } else {
            setQuery('')
            setResults({ messages: [], channels: [] })
        }
    }, [isOpen])

    useEffect(() => {
        if (query.trim().length < 2) {
            setResults({ messages: [], channels: [] })
            return
        }

        // デバウンス検索
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }

        searchTimeoutRef.current = setTimeout(() => {
            performSearch()
        }, 300)

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
            }
        }
    }, [query, activeTab])

    const performSearch = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${activeTab}`)
            const data = await res.json()
            setResults(data)
        } catch (error) {
            console.error('Search failed:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSelectMessage = (message: any) => {
        if (onSelectMessage) {
            onSelectMessage(message.thread.channel.id, message.thread.id)
        }
        onClose()
    }

    const handleSelectChannel = (channel: any) => {
        if (onSelectChannel) {
            onSelectChannel(channel.id)
        }
        onClose()
    }

    const highlightText = (text: string, query: string) => {
        if (!query) return text
        const parts = text.split(new RegExp(`(${query})`, 'gi'))
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase() ? (
                <mark key={i} className="bg-yellow-200">
                    {part}
                </mark>
            ) : (
                part
            )
        )
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col">
                <div className="p-4 border-b">
                    <div className="flex items-center gap-2 mb-3">
                        <Search size={20} className="text-gray-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="メッセージや患者を検索..."
                            className="flex-1 outline-none text-lg"
                        />
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-3 py-1 rounded text-sm ${activeTab === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                        >
                            すべて
                        </button>
                        <button
                            onClick={() => setActiveTab('messages')}
                            className={`px-3 py-1 rounded text-sm ${activeTab === 'messages'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                        >
                            メッセージ
                        </button>
                        <button
                            onClick={() => setActiveTab('channels')}
                            className={`px-3 py-1 rounded text-sm ${activeTab === 'channels'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                        >
                            患者
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">検索中...</div>
                    ) : query.trim().length < 2 ? (
                        <div className="text-center py-8 text-gray-500">
                            2文字以上入力して検索してください
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {(activeTab === 'all' || activeTab === 'channels') &&
                                results.channels.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700 mb-2">
                                            患者 ({results.channels.length})
                                        </h3>
                                        <div className="space-y-2">
                                            {results.channels.map((channel) => (
                                                <button
                                                    key={channel.id}
                                                    onClick={() => handleSelectChannel(channel)}
                                                    className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Hash size={16} className="text-gray-500" />
                                                        <span className="font-medium">
                                                            {highlightText(
                                                                channel.patient.name,
                                                                query
                                                            )}
                                                        </span>
                                                        <span className="text-sm text-gray-500">
                                                            ({channel.patient.patientId})
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {channel._count.threads} スレッド
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            {(activeTab === 'all' || activeTab === 'messages') &&
                                results.messages.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700 mb-2">
                                            メッセージ ({results.messages.length})
                                        </h3>
                                        <div className="space-y-2">
                                            {results.messages.map((message) => (
                                                <button
                                                    key={message.id}
                                                    onClick={() => handleSelectMessage(message)}
                                                    className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg"
                                                >
                                                    <div className="flex items-start gap-2 mb-1">
                                                        <MessageSquare
                                                            size={16}
                                                            className="text-gray-500 mt-1"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-medium">
                                                                {message.user.name}
                                                            </div>
                                                            <div className="text-sm text-gray-700 line-clamp-2">
                                                                {highlightText(
                                                                    message.content,
                                                                    query
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 ml-6">
                                                        <span>
                                                            {message.thread.channel.patient.name}
                                                        </span>
                                                        <span>›</span>
                                                        <span>{message.thread.title}</span>
                                                        <span>›</span>
                                                        <Calendar size={12} />
                                                        <span>
                                                            {format(
                                                                new Date(message.createdAt),
                                                                'M/d HH:mm'
                                                            )}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            {results.messages.length === 0 && results.channels.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    検索結果が見つかりませんでした
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
