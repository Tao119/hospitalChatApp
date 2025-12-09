'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ChannelSidebar from '@/components/ChannelSidebar'
import ThreadList from '@/components/ThreadList'
import ChatArea from '@/components/ChatArea'
import ThreadModal, { ThreadFormData } from '@/components/ThreadModal'
import PatientModal, { PatientFormData } from '@/components/PatientModal'
import SearchModal from '@/components/SearchModal'
import { ChannelData } from '@/types'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useUnreadCount } from '@/hooks/useUnreadCount'

export default function ChatPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [channels, setChannels] = useState<ChannelData[]>([])
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
    const [isThreadModalOpen, setIsThreadModalOpen] = useState(false)
    const [isPatientModalOpen, setIsPatientModalOpen] = useState(false)
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)

    const userId = (session?.user as any)?.id
    const { isConnected, lastMessage, joinChannel, sendMessage, sendTyping } = useWebSocket(userId)
    const { unreadCounts, threadUnreads, markThreadAsRead, incrementUnread } = useUnreadCount()

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        }
    }, [status, router])

    // キーボードショートカット（Ctrl/Cmd + K で検索）
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setIsSearchModalOpen(true)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    useEffect(() => {
        if (status === 'authenticated') {
            loadChannels()
        }
    }, [status])

    useEffect(() => {
        if (selectedChannelId && isConnected) {
            joinChannel(selectedChannelId)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedChannelId, isConnected])

    useEffect(() => {
        if (lastMessage?.type === 'message') {
            console.log('New message:', lastMessage.data)

            // 他のユーザーからのメッセージで、現在選択していないスレッドの場合は未読数を増やす
            if (lastMessage.data.userId !== userId && lastMessage.data.threadId !== selectedThreadId) {
                // メッセージのスレッドからチャンネルIDを取得
                const thread = channels
                    .flatMap(c => c.threads || [])
                    .find(t => t.id === lastMessage.data.threadId)

                if (thread) {
                    const channel = channels.find(c => c.threads?.some(t => t.id === thread.id))
                    if (channel) {
                        incrementUnread(channel.id)
                    }
                }
            }
        }
    }, [lastMessage, userId, selectedThreadId, channels, incrementUnread])

    const loadChannels = async () => {
        try {
            const res = await fetch('/api/channels')
            if (!res.ok) {
                throw new Error(`Failed to fetch channels: ${res.status}`)
            }
            const data = await res.json()

            // データが配列であることを確認
            if (!Array.isArray(data)) {
                console.error('Channels data is not an array:', data)
                setChannels([])
                return
            }

            setChannels(data)

            if (data.length > 0 && !selectedChannelId) {
                setSelectedChannelId(data[0].id)
                if (data[0].threads.length > 0) {
                    setSelectedThreadId(data[0].threads[0].id)
                }
            }
        } catch (error) {
            console.error('Failed to load channels:', error)
        }
    }

    const handleSelectChannel = (channelId: string) => {
        setSelectedChannelId(channelId)
        const channel = channels.find(c => c.id === channelId)
        if (channel?.threads && channel.threads.length > 0) {
            setSelectedThreadId(channel.threads[0].id)
        } else {
            setSelectedThreadId(null)
        }
    }

    const handleSelectThread = async (threadId: string) => {
        setSelectedThreadId(threadId)

        // スレッドを開いたら既読にする
        if (selectedChannelId) {
            await markThreadAsRead(threadId, selectedChannelId)
        }
    }

    const handleSendMessage = async (content: string, mentions: string[], fileUrl?: string) => {
        if (!selectedThreadId || !selectedChannelId) return

        try {
            const messageData: any = { content, mentions }

            // ファイルが添付されている場合
            if (fileUrl) {
                messageData.fileUrl = fileUrl
                // 画像の場合はtypeをIMAGEに
                if (fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                    messageData.type = 'IMAGE'
                } else {
                    messageData.type = 'FILE'
                }
            }

            const res = await fetch(`/api/threads/${selectedThreadId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData),
            })

            const message = await res.json()
            console.log('Message created:', message)

            // WebSocketでブロードキャスト（threadIdを含める）
            const wsMessage = {
                ...message,
                threadId: selectedThreadId
            }
            console.log('Sending via WebSocket to channel:', selectedChannelId, wsMessage)
            sendMessage(selectedChannelId, wsMessage)
        } catch (error) {
            console.error('Failed to send message:', error)
        }
    }

    const handleTyping = (threadId: string) => {
        if (selectedChannelId && session?.user?.name) {
            sendTyping(selectedChannelId, threadId, session.user.name)
        }
    }

    const handleCreateThread = async (data: ThreadFormData) => {
        if (!selectedChannelId) return

        try {
            const res = await fetch('/api/threads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelId: selectedChannelId,
                    ...data
                })
            })

            if (res.ok) {
                // チャンネルリストを再読み込み
                await loadChannels()
            }
        } catch (error) {
            console.error('Failed to create thread:', error)
        }
    }

    const handleCreatePatient = async (data: PatientFormData) => {
        try {
            const res = await fetch('/api/patients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (res.ok) {
                // チャンネルリストを再読み込み
                await loadChannels()
            } else {
                const error = await res.json()
                throw new Error(error.error || '患者の登録に失敗しました')
            }
        } catch (error: any) {
            alert(error.message)
            throw error
        }
    }

    if (status === 'loading') {
        return (
            <div className="h-screen flex items-center justify-center">
                読み込み中...
            </div>
        )
    }

    const selectedChannel = Array.isArray(channels) ? channels.find(c => c.id === selectedChannelId) : undefined

    return (
        <div className="h-screen flex">
            <ChannelSidebar
                channels={channels}
                selectedChannelId={selectedChannelId}
                onSelectChannel={handleSelectChannel}
                onCreatePatient={() => setIsPatientModalOpen(true)}
                onSearch={() => setIsSearchModalOpen(true)}
                currentUser={
                    session?.user
                        ? {
                            name: session.user.name || '',
                            role: (session.user as any).role || ''
                        }
                        : null
                }
                unreadCounts={unreadCounts}
            />
            <PatientModal
                isOpen={isPatientModalOpen}
                onClose={() => setIsPatientModalOpen(false)}
                onSave={handleCreatePatient}
            />
            <SearchModal
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
                onSelectMessage={(channelId, threadId) => {
                    setSelectedChannelId(channelId)
                    setSelectedThreadId(threadId)
                }}
                onSelectChannel={(channelId) => {
                    setSelectedChannelId(channelId)
                    const channel = channels.find(c => c.id === channelId)
                    if (channel?.threads && channel.threads.length > 0) {
                        setSelectedThreadId(channel.threads[0].id)
                    }
                }}
            />

            {selectedChannel && (
                <>
                    <ThreadList
                        threads={selectedChannel.threads}
                        selectedThreadId={selectedThreadId}
                        onSelectThread={handleSelectThread}
                        onCreateThread={() => setIsThreadModalOpen(true)}
                        threadUnreads={threadUnreads}
                    />
                    <ThreadModal
                        isOpen={isThreadModalOpen}
                        onClose={() => setIsThreadModalOpen(false)}
                        onSave={handleCreateThread}
                        channelId={selectedChannel.id}
                    />
                </>
            )}

            {selectedThreadId && userId ? (
                <ChatArea
                    threadId={selectedThreadId}
                    currentUserId={userId}
                    currentUserName={session?.user?.name ?? undefined}
                    channelId={selectedChannelId ?? undefined}
                    channelMembers={selectedChannel?.members.map(m => m.user)}
                    onSendMessage={handleSendMessage}
                    onTyping={handleTyping}
                    lastMessage={lastMessage}
                />
            ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                    スレッドを選択してください
                </div>
            )}
        </div>
    )
}
