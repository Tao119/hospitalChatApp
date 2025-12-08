'use client'

import { ThreadData, Priority } from '@/types'
import { MessageSquare, AlertCircle, Plus } from 'lucide-react'
import clsx from 'clsx'

interface ThreadListProps {
    threads: ThreadData[]
    selectedThreadId: string | null
    onSelectThread: (threadId: string) => void
    onCreateThread?: () => void
    threadUnreads?: Map<string, number>
}

const priorityConfig = {
    URGENT: { label: '緊急', color: 'bg-red-500 text-white', icon: 'text-red-500', order: 0 },
    HIGH: { label: '高', color: 'bg-orange-500 text-white', icon: 'text-orange-500', order: 1 },
    NORMAL: { label: '通常', color: 'bg-blue-500 text-white', icon: 'text-blue-500', order: 2 },
    LOW: { label: '低', color: 'bg-gray-400 text-white', icon: 'text-gray-400', order: 3 },
}

export default function ThreadList({
    threads,
    selectedThreadId,
    onSelectThread,
    onCreateThread,
    threadUnreads = new Map(),
}: ThreadListProps) {
    // 優先度と未読数でソート
    const sortedThreads = [...threads].sort((a, b) => {
        const unreadA = threadUnreads.get(a.id) || 0
        const unreadB = threadUnreads.get(b.id) || 0

        // 未読がある場合は優先
        if (unreadA > 0 && unreadB === 0) return -1
        if (unreadA === 0 && unreadB > 0) return 1

        // 両方未読がある場合は優先度でソート
        if (unreadA > 0 && unreadB > 0) {
            const priorityDiff = priorityConfig[a.priority].order - priorityConfig[b.priority].order
            if (priorityDiff !== 0) return priorityDiff
            return unreadB - unreadA // 未読数が多い順
        }

        // 未読がない場合は優先度のみでソート
        return priorityConfig[a.priority].order - priorityConfig[b.priority].order
    })

    return (
        <div className="w-80 bg-gray-100 border-r border-gray-300 flex flex-col">
            <div className="p-4 border-b border-gray-300 flex justify-between items-center">
                <h3 className="font-semibold">スレッド</h3>
                {onCreateThread && (
                    <button
                        onClick={onCreateThread}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="新規スレッド作成"
                    >
                        <Plus size={20} />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto">
                {sortedThreads.map((thread) => {
                    const unreadCount = threadUnreads.get(thread.id) || 0
                    const priority = priorityConfig[thread.priority]
                    return (
                        <button
                            key={thread.id}
                            onClick={() => onSelectThread(thread.id)}
                            className={clsx(
                                'w-full text-left p-3 border-b border-gray-200 hover:bg-gray-200',
                                selectedThreadId === thread.id && 'bg-gray-200',
                                unreadCount > 0 && 'bg-blue-50'
                            )}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare size={16} />
                                        <span className={clsx(
                                            'font-medium truncate',
                                            unreadCount > 0 && 'font-bold'
                                        )}>
                                            {thread.title}
                                        </span>
                                        {unreadCount > 0 && (
                                            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                                {unreadCount > 99 ? '99+' : unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    {thread.tags.length > 0 && (
                                        <div className="flex gap-1 mt-1 flex-wrap">
                                            {thread.tags.map((tag, i) => (
                                                <span
                                                    key={i}
                                                    className="text-xs bg-gray-300 px-2 py-0.5 rounded"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={clsx(
                                        'text-xs px-2 py-0.5 rounded font-semibold',
                                        priority.color
                                    )}>
                                        {priority.label}
                                    </span>
                                    {thread._count && thread._count.messages > 0 && (
                                        <span className="text-xs text-gray-500">
                                            {thread._count.messages}件
                                        </span>
                                    )}
                                </div>
                            </div>
                            {!thread.isActive && (
                                <span className="text-xs text-gray-500 mt-1 block">
                                    非アクティブ
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
