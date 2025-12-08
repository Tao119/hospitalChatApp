'use client'

import { ChannelData } from '@/types'
import { Hash, Archive, UserPlus, Settings, Shield, LogOut, Search, Building2 } from 'lucide-react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import clsx from 'clsx'

interface ChannelSidebarProps {
    channels: ChannelData[]
    selectedChannelId: string | null
    onSelectChannel: (channelId: string) => void
    onCreatePatient?: () => void
    onSearch?: () => void
    currentUser?: { name: string; role: string } | null
    unreadCounts?: Map<string, number>
}

export default function ChannelSidebar({
    channels,
    selectedChannelId,
    onSelectChannel,
    onCreatePatient,
    onSearch,
    currentUser,
    unreadCounts = new Map(),
}: ChannelSidebarProps) {
    const activeChannels = channels.filter(c => !c.isArchived)
    const archivedChannels = channels.filter(c => c.isArchived)

    return (
        <div className="w-64 bg-gray-800 text-white flex flex-col">
            <div className="p-4 border-b border-gray-700">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="font-bold text-lg">院内チャット</h2>
                    <div className="flex gap-1">
                        {onSearch && (
                            <button
                                onClick={onSearch}
                                className="p-1 hover:bg-gray-700 rounded"
                                title="検索 (Ctrl+K)"
                            >
                                <Search size={20} />
                            </button>
                        )}
                        {onCreatePatient && (
                            <button
                                onClick={onCreatePatient}
                                className="p-1 hover:bg-gray-700 rounded"
                                title="新規患者登録"
                            >
                                <UserPlus size={20} />
                            </button>
                        )}
                    </div>
                </div>
                {currentUser && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-300 truncate">{currentUser.name}</span>
                            <div className="flex gap-1">
                                <Link
                                    href="/settings"
                                    className="p-1 hover:bg-gray-700 rounded"
                                    title="設定"
                                >
                                    <Settings size={16} />
                                </Link>
                                {currentUser.role === 'SUPER_ADMIN' && (
                                    <Link
                                        href="/super-admin"
                                        className="p-1 hover:bg-gray-700 rounded"
                                        title="プロバイダー管理"
                                    >
                                        <Building2 size={16} />
                                    </Link>
                                )}
                                {currentUser.role === 'ADMIN' && (
                                    <Link
                                        href="/admin"
                                        className="p-1 hover:bg-gray-700 rounded"
                                        title="管理画面"
                                    >
                                        <Shield size={16} />
                                    </Link>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                        >
                            <LogOut size={16} />
                            <span>ログアウト</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="p-2">
                    <div className="text-xs font-semibold text-gray-400 px-2 mb-2">
                        患者チャンネル
                    </div>
                    {activeChannels.map((channel) => {
                        const unreadCount = unreadCounts.get(channel.id) || 0
                        return (
                            <button
                                key={channel.id}
                                onClick={() => onSelectChannel(channel.id)}
                                className={clsx(
                                    'w-full text-left px-2 py-1.5 rounded flex items-center gap-2 hover:bg-gray-700',
                                    selectedChannelId === channel.id && 'bg-gray-700'
                                )}
                            >
                                <Hash size={16} />
                                <span className="truncate flex-1">{channel.patient.name}</span>
                                <span className="text-xs text-gray-400">
                                    ({channel.patient.patientId})
                                </span>
                                {unreadCount > 0 && (
                                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>

                {archivedChannels.length > 0 && (
                    <div className="p-2 border-t border-gray-700">
                        <div className="text-xs font-semibold text-gray-400 px-2 mb-2 flex items-center gap-1">
                            <Archive size={12} />
                            アーカイブ
                        </div>
                        {archivedChannels.map((channel) => (
                            <button
                                key={channel.id}
                                onClick={() => onSelectChannel(channel.id)}
                                className={clsx(
                                    'w-full text-left px-2 py-1.5 rounded flex items-center gap-2 hover:bg-gray-700 text-gray-400',
                                    selectedChannelId === channel.id && 'bg-gray-700'
                                )}
                            >
                                <Hash size={16} />
                                <span className="truncate">{channel.patient.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
