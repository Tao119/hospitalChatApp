import { WebSocketServer, WebSocket } from 'ws'
import { parse } from 'url'

const PORT = parseInt(process.env.WS_PORT || '3001')

const wss = new WebSocketServer({ port: PORT })

interface Client {
    ws: WebSocket
    userId: string
    channelIds: Set<string>
}

const clients = new Map<string, Client>()

wss.on('connection', (ws, req) => {
    const { query } = parse(req.url || '', true)
    const userId = query.userId as string

    if (!userId) {
        ws.close()
        return
    }

    const client: Client = {
        ws,
        userId,
        channelIds: new Set()
    }

    clients.set(userId, client)

    console.log(`Client connected: ${userId}`)

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString())

            switch (message.type) {
                case 'join_channel':
                    client.channelIds.add(message.channelId)
                    console.log(`User ${userId} joined channel ${message.channelId}`)
                    break

                case 'leave_channel':
                    client.channelIds.delete(message.channelId)
                    console.log(`User ${userId} left channel ${message.channelId}`)
                    break

                case 'message':
                    console.log(`Broadcasting message to channel ${message.channelId}:`, message.data)
                    // 送信者を含めて全員に配信
                    broadcastToChannel(message.channelId, {
                        type: 'message',
                        data: message.data
                    })
                    break

                case 'mention':
                    sendToUser(message.mentionedUserId, {
                        type: 'mention',
                        data: message.data
                    })
                    break

                case 'read':
                    broadcastToChannel(message.channelId, {
                        type: 'read',
                        data: message.data
                    }, userId)
                    break

                case 'typing':
                    console.log(`User ${userId} is typing in thread ${message.threadId}`)
                    broadcastToChannel(message.channelId, {
                        type: 'typing',
                        data: {
                            userId: message.data.userId,
                            userName: message.data.userName,
                            threadId: message.threadId
                        }
                    }, userId)
                    break
            }
        } catch (error) {
            console.error('Error processing message:', error)
        }
    })

    ws.on('close', () => {
        clients.delete(userId)
        console.log(`Client disconnected: ${userId}`)
    })

    ws.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error)
    })
})

function broadcastToChannel(channelId: string, message: any, excludeUserId?: string) {
    let sentCount = 0
    clients.forEach((client, userId) => {
        if (client.channelIds.has(channelId)) {
            // excludeUserIdが指定されている場合のみ除外
            if (excludeUserId && userId === excludeUserId) {
                return
            }
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify(message))
                sentCount++
            }
        }
    })
    console.log(`Broadcast to ${sentCount} clients in channel ${channelId}`)
}

function sendToUser(userId: string, message: any) {
    const client = clients.get(userId)
    if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message))
    }
}

console.log(`WebSocket server running on port ${PORT}`)
