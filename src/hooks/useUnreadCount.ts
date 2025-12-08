import { useEffect, useState, useCallback } from 'react'

interface UnreadCount {
    channelId: string
    unreadCount: number
    threadUnreads: Record<string, number>
}

export function useUnreadCount() {
    const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map())
    const [threadUnreads, setThreadUnreads] = useState<Map<string, number>>(new Map())
    const [loading, setLoading] = useState(false)

    const loadUnreadCounts = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/channels/unread')
            const data: UnreadCount[] = await res.json()

            const countsMap = new Map<string, number>()
            const threadsMap = new Map<string, number>()

            data.forEach(item => {
                countsMap.set(item.channelId, item.unreadCount)

                // スレッドごとの未読数を保存
                Object.entries(item.threadUnreads).forEach(([threadId, count]) => {
                    threadsMap.set(threadId, count)
                })
            })

            setUnreadCounts(countsMap)
            setThreadUnreads(threadsMap)
        } catch (error) {
            console.error('Failed to load unread counts:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    const markThreadAsRead = useCallback(async (threadId: string, channelId: string) => {
        try {
            await fetch(`/api/threads/${threadId}/read`, {
                method: 'POST'
            })

            // ローカルの未読数を更新
            await loadUnreadCounts()
        } catch (error) {
            console.error('Failed to mark thread as read:', error)
        }
    }, [loadUnreadCounts])

    const decrementUnread = useCallback((channelId: string, count: number = 1) => {
        setUnreadCounts(prev => {
            const newCounts = new Map(prev)
            const current = newCounts.get(channelId) || 0
            newCounts.set(channelId, Math.max(0, current - count))
            return newCounts
        })
    }, [])

    const incrementUnread = useCallback((channelId: string, count: number = 1) => {
        setUnreadCounts(prev => {
            const newCounts = new Map(prev)
            const current = newCounts.get(channelId) || 0
            newCounts.set(channelId, current + count)
            return newCounts
        })
    }, [])

    useEffect(() => {
        loadUnreadCounts()
    }, [loadUnreadCounts])

    const getThreadUnread = useCallback((threadId: string) => {
        return threadUnreads.get(threadId) || 0
    }, [threadUnreads])

    return {
        unreadCounts,
        threadUnreads,
        loading,
        loadUnreadCounts,
        markThreadAsRead,
        decrementUnread,
        incrementUnread,
        getThreadUnread
    }
}
