import { useEffect, useRef, useState, useCallback } from 'react'
import { WSMessage, WSResponse } from '@/types'

export function useWebSocket(userId?: string) {
    const [isConnected, setIsConnected] = useState(false)
    const [lastMessage, setLastMessage] = useState<WSResponse | null>(null)
    const wsRef = useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

    const connect = useCallback(() => {
        if (!userId || wsRef.current?.readyState === WebSocket.OPEN) {
            return
        }

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'
        const ws = new WebSocket(`${wsUrl}?userId=${userId}`)

        ws.onopen = () => {
            console.log('WebSocket connected')
            setIsConnected(true)
        }

        ws.onmessage = (event) => {
            try {
                const message: WSResponse = JSON.parse(event.data)
                setLastMessage(message)
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error)
            }
        }

        ws.onclose = () => {
            console.log('WebSocket disconnected')
            setIsConnected(false)
            wsRef.current = null

            // 自動再接続
            reconnectTimeoutRef.current = setTimeout(() => {
                console.log('Attempting to reconnect...')
                connect()
            }, 3000)
        }

        ws.onerror = (error) => {
            console.error('WebSocket error:', error)
        }

        wsRef.current = ws
    }, [userId])

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
        }
        if (wsRef.current) {
            wsRef.current.close()
            wsRef.current = null
        }
    }, [])

    const sendWSMessage = useCallback((message: WSMessage) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message))
        } else {
            console.warn('WebSocket is not connected')
        }
    }, [])

    const joinChannel = useCallback((channelId: string) => {
        sendWSMessage({ type: 'join_channel', channelId })
    }, [sendWSMessage])

    const leaveChannel = useCallback((channelId: string) => {
        sendWSMessage({ type: 'leave_channel', channelId })
    }, [sendWSMessage])

    const sendMessage = useCallback((channelId: string, data: any) => {
        console.log('useWebSocket.sendMessage called:', { channelId, data })
        sendWSMessage({ type: 'message', channelId, data })
    }, [sendWSMessage])

    useEffect(() => {
        if (userId) {
            connect()
        }

        return () => {
            disconnect()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId])

    const sendTyping = useCallback((channelId: string, threadId: string, userName: string) => {
        sendWSMessage({
            type: 'typing',
            channelId,
            threadId,
            data: { userId, userName }
        })
    }, [sendWSMessage, userId])

    return {
        isConnected,
        lastMessage,
        joinChannel,
        leaveChannel,
        sendMessage,
        sendTyping,
        sendWSMessage
    }
}
