'use client'

import { useState, useEffect, useRef } from 'react'
import { ChatMessage } from '@/types'
import { Send, AtSign, Edit2, Trash2, Paperclip, Image as ImageIcon, File, X, Eye } from 'lucide-react'
import { format, isToday, isYesterday, isThisYear } from 'date-fns'
import { ja } from 'date-fns/locale'
import ReadReceiptModal from './ReadReceiptModal'
import clsx from 'clsx'

interface ChatAreaProps {
    threadId: string
    currentUserId: string
    currentUserName?: string
    channelId?: string
    channelMembers?: Array<{ id: string; name: string; role: string }>
    onSendMessage: (content: string, mentions: string[], fileUrl?: string) => Promise<void>
    onTyping?: (threadId: string) => void
    lastMessage?: any
}

export default function ChatArea({
    threadId,
    currentUserId,
    currentUserName,
    channelId,
    channelMembers = [],
    onSendMessage,
    onTyping,
    lastMessage,
}: ChatAreaProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
    const [editingContent, setEditingContent] = useState('')
    const [uploadingFile, setUploadingFile] = useState(false)
    const [attachedFile, setAttachedFile] = useState<{ url: string; name: string; type: string } | null>(null)
    const [selectedMessageForReceipt, setSelectedMessageForReceipt] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const typingTimeoutRef = useRef<NodeJS.Timeout>()
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        loadMessages()
    }, [threadId])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // リアルタイムメッセージ受信
    useEffect(() => {
        if (lastMessage?.type === 'message' && lastMessage.data.threadId === threadId) {
            setMessages(prev => {
                // 重複チェック
                if (prev.some(msg => msg.id === lastMessage.data.id)) {
                    return prev
                }
                return [...prev, lastMessage.data]
            })
        } else if (lastMessage?.type === 'typing' && lastMessage.data.threadId === threadId) {
            // 入力中表示
            const { userId, userName } = lastMessage.data
            if (userId !== currentUserId) {
                setTypingUsers(prev => new Set(prev).add(userName))

                // 3秒後に入力中表示を消す
                setTimeout(() => {
                    setTypingUsers(prev => {
                        const newSet = new Set(prev)
                        newSet.delete(userName)
                        return newSet
                    })
                }, 3000)
            }
        }
    }, [lastMessage, threadId, currentUserId])

    const loadMessages = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/threads/${threadId}/messages`)
            const data = await res.json()
            setMessages(data.messages || [])
        } catch (error) {
            console.error('Failed to load messages:', error)
        } finally {
            setLoading(false)
        }
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const formatMessageTime = (dateString: string) => {
        const date = new Date(dateString)

        if (isToday(date)) {
            return format(date, 'HH:mm')
        } else if (isYesterday(date)) {
            return `昨日 ${format(date, 'HH:mm')}`
        } else if (isThisYear(date)) {
            return format(date, 'M月d日 HH:mm', { locale: ja })
        } else {
            return format(date, 'yyyy年M月d日 HH:mm', { locale: ja })
        }
    }

    const handleTyping = () => {
        if (onTyping) {
            // タイピングイベントを送信（デバウンス）
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }

            onTyping(threadId)

            typingTimeoutRef.current = setTimeout(() => {
                // 3秒後に入力停止
            }, 3000)
        }
    }

    const handleEditMessage = (message: ChatMessage) => {
        setEditingMessageId(message.id)
        setEditingContent(message.content)
    }

    const handleSaveEdit = async () => {
        if (!editingMessageId || !editingContent.trim()) {
            setEditingMessageId(null)
            return
        }

        try {
            const res = await fetch(`/api/messages/${editingMessageId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editingContent })
            })

            if (res.ok) {
                const updatedMessage = await res.json()
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === editingMessageId
                            ? { ...msg, content: updatedMessage.content, isEdited: true }
                            : msg
                    )
                )
            }
        } catch (error) {
            console.error('Failed to edit message:', error)
        } finally {
            setEditingMessageId(null)
            setEditingContent('')
        }
    }

    const handleDeleteMessage = async (messageId: string) => {
        if (!confirm('このメッセージを削除してもよろしいですか？')) return

        try {
            const res = await fetch(`/api/messages/${messageId}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                setMessages(prev => prev.filter(msg => msg.id !== messageId))
            }
        } catch (error) {
            console.error('Failed to delete message:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() && !attachedFile) return

        // @ユーザー名からユーザーIDを抽出
        const mentions: string[] = []
        const mentionRegex = /@([\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\w]+)/g
        let match
        while ((match = mentionRegex.exec(input)) !== null) {
            const mentionedName = match[1]
            // 名前からユーザーIDを検索
            const user = channelMembers.find(m => m.name === mentionedName)
            if (user) {
                mentions.push(user.id)
            }
        }

        const content = input
        setInput('')

        // ファイルが添付されている場合
        if (attachedFile) {
            await onSendMessage(content || attachedFile.name, mentions, attachedFile.url)
            setAttachedFile(null)
        } else {
            await onSendMessage(content, mentions)
        }
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingFile(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            if (res.ok) {
                const data = await res.json()
                setAttachedFile({
                    url: data.url,
                    name: data.filename,
                    type: data.type
                })
            } else {
                const error = await res.json()
                alert(error.error || 'ファイルのアップロードに失敗しました')
            }
        } catch (error) {
            console.error('Failed to upload file:', error)
            alert('ファイルのアップロードに失敗しました')
        } finally {
            setUploadingFile(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    return (
        <div className="flex-1 flex flex-col bg-white">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="text-center text-gray-500">読み込み中...</div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={clsx(
                                'flex gap-3 group',
                                message.userId === currentUserId && 'flex-row-reverse'
                            )}
                        >
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                                {message.user.name[0]}
                            </div>
                            <div className={clsx(
                                'flex-1 max-w-2xl'
                            )}>
                                <div className={clsx(
                                    'flex items-center gap-2 mb-1',
                                    message.userId === currentUserId && 'justify-end'
                                )}>
                                    <span className="font-semibold text-sm">
                                        {message.user.name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {formatMessageTime(message.createdAt)}
                                    </span>
                                    {message.isEdited && (
                                        <span className="text-xs text-gray-400">(編集済み)</span>
                                    )}
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setSelectedMessageForReceipt(message.id)}
                                            className="text-gray-500 hover:text-blue-600"
                                            title="既読状況"
                                        >
                                            <Eye size={14} />
                                        </button>
                                        {message.userId === currentUserId && (
                                            <>
                                                <button
                                                    onClick={() => handleEditMessage(message)}
                                                    className="text-gray-500 hover:text-blue-600"
                                                    title="編集"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteMessage(message.id)}
                                                    className="text-gray-500 hover:text-red-600"
                                                    title="削除"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className={clsx(
                                    'flex flex-col',
                                    message.userId === currentUserId && 'items-end'
                                )}>
                                    <div className={clsx(
                                        'inline-block px-4 py-2 rounded-lg',
                                        message.userId === currentUserId
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100'
                                    )}>
                                        {message.content}
                                    </div>
                                    {message.fileUrl && (
                                        <div className="mt-2">
                                            {message.type === 'IMAGE' ? (
                                                <img
                                                    src={message.fileUrl}
                                                    alt="添付画像"
                                                    className="max-w-sm rounded-lg cursor-pointer hover:opacity-90"
                                                    onClick={() => window.open(message.fileUrl, '_blank')}
                                                />
                                            ) : (
                                                <a
                                                    href={message.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 w-fit"
                                                >
                                                    <File size={16} />
                                                    <span className="text-sm">ファイルを開く</span>
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {message.mentions && message.mentions.length > 0 && (
                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                        <AtSign size={12} />
                                        {message.mentions.map(m => m.user.name).join(', ')}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />

                {typingUsers.size > 0 && (
                    <div className="text-sm text-gray-500 italic px-4">
                        {Array.from(typingUsers).join(', ')} が入力中...
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
                {attachedFile && (
                    <div className="mb-2 flex items-center gap-2 p-2 bg-gray-100 rounded">
                        {attachedFile.type.startsWith('image/') ? (
                            <ImageIcon size={16} />
                        ) : (
                            <File size={16} />
                        )}
                        <span className="text-sm flex-1 truncate">{attachedFile.name}</span>
                        <button
                            type="button"
                            onClick={() => setAttachedFile(null)}
                            className="text-gray-500 hover:text-red-600"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}
                <div className="flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFile}
                        className="px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        title="ファイルを添付"
                    >
                        <Paperclip size={20} />
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value)
                            handleTyping()
                        }}
                        placeholder="メッセージを入力..."
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        disabled={(!input.trim() && !attachedFile) || uploadingFile}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </form>

            <ReadReceiptModal
                isOpen={!!selectedMessageForReceipt}
                onClose={() => setSelectedMessageForReceipt(null)}
                messageId={selectedMessageForReceipt || ''}
                channelMembers={channelMembers.filter(m => {
                    const selectedMessage = messages.find(msg => msg.id === selectedMessageForReceipt)
                    return m.id !== selectedMessage?.userId
                })}
            />
        </div>
    )
}
