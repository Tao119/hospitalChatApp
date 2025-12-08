export type UserRole = 'DOCTOR' | 'NURSE' | 'PHARMACIST' | 'CARE_MANAGER' | 'ADMIN'
export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
export type MessageType = 'TEXT' | 'FILE' | 'IMAGE' | 'TODO' | 'PAGE'

export interface User {
    id: string
    email: string
    name: string
    role: UserRole
}

export interface Patient {
    id: string
    patientId: string
    name: string
    isActive: boolean
}

export interface Channel {
    id: string
    patientId: string
    patient: Patient
    isArchived: boolean
    members: ChannelMember[]
    threads: Thread[]
    createdAt: string
    updatedAt: string
}

export interface ChannelMember {
    id: string
    channelId: string
    userId: string
    user: User
    joinedAt: string
}

export interface Thread {
    id: string
    channelId: string
    title: string
    isActive: boolean
    priority: Priority
    tags: string[]
    createdAt: string
    updatedAt: string
    _count?: {
        messages: number
    }
}

export interface Message {
    id: string
    threadId: string
    userId: string
    user: User
    content: string
    type: MessageType
    fileUrl?: string
    isEdited: boolean
    isDeleted: boolean
    createdAt: string
    updatedAt: string
    mentions?: Mention[]
}

export interface Mention {
    id: string
    messageId: string
    userId: string
    user: User
    isRead: boolean
    createdAt: string
}

// エイリアス
export type ChannelData = Channel
export type ThreadData = Thread
export type ChatMessage = Message

export interface WSMessage {
    type: 'join_channel' | 'leave_channel' | 'message' | 'mention' | 'read' | 'typing'
    channelId?: string
    threadId?: string
    mentionedUserId?: string
    data?: any
}

export interface WSResponse {
    type: 'message' | 'mention' | 'read' | 'typing'
    data: any
}
