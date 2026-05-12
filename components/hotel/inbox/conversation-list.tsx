'use client'

import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { CHANNEL_CONFIG } from './inbox-view'
import type { Conversation } from './inbox-view'

const AVATAR_GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500',
  'from-rose-500 to-pink-500',
  'from-indigo-500 to-blue-600',
]

function getGradient(name: string) {
  const code = (name ?? 'A').charCodeAt(0)
  return AVATAR_GRADIENTS[code % AVATAR_GRADIENTS.length]
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
  if (diffDays === 0) return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return date.toLocaleDateString('es-PE', { weekday: 'short' })
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-sm font-medium">Sin conversaciones</p>
        <p className="text-xs mt-1">Aquí aparecerán los mensajes</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map(conv => {
        const isSelected = selectedId === conv.id
        const name = conv.contact_name ?? conv.phone
        const channelCfg = CHANNEL_CONFIG[conv.channel as keyof typeof CHANNEL_CONFIG]
        const hasUnread = conv.unread_count > 0

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={cn(
              'w-full text-left px-4 py-3.5 flex items-start gap-3 transition-all relative border-b border-gray-100/80',
              isSelected
                ? 'bg-hotel/5 border-l-[3px] border-l-hotel'
                : 'hover:bg-gray-50/80 border-l-[3px] border-l-transparent'
            )}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${getGradient(name)} flex items-center justify-center text-white font-bold text-base shadow-sm`}>
                {name.charAt(0).toUpperCase()}
              </div>
              {/* Channel dot */}
              {channelCfg && (
                <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ${channelCfg.bg} border-2 border-white flex items-center justify-center`}>
                  <span className="text-[7px]">
                    {conv.channel === 'whatsapp' ? '✓' : conv.channel === 'instagram' ? '❤' : conv.channel === 'facebook' ? 'f' : '✉'}
                  </span>
                </span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className={cn('text-sm truncate', hasUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-800')}>
                  {name}
                </span>
                {conv.last_message_at && (
                  <span className={cn('text-[11px] shrink-0', hasUnread ? 'text-hotel font-semibold' : 'text-gray-400')}>
                    {formatTime(conv.last_message_at)}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <p className={cn('text-xs truncate', hasUnread ? 'text-gray-700 font-medium' : 'text-gray-400')}>
                  {conv.last_message ?? 'Sin mensajes'}
                </p>
                {hasUnread && (
                  <span className="shrink-0 min-w-[20px] h-5 bg-hotel text-white text-[10px] rounded-full flex items-center justify-center font-bold px-1">
                    {conv.unread_count > 99 ? '99+' : conv.unread_count}
                  </span>
                )}
              </div>

              {/* Tags */}
              {conv.tags.length > 0 && (
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {conv.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
