'use client'

import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface Conversation {
  id: string
  phone: string
  contact_name: string | null
  last_message: string | null
  last_message_at: string | null
  unread_count: number
  status: string
  tags: string[]
  channel?: string
}

const CHANNEL_ICON: Record<string, string> = {
  whatsapp: '📱',
  instagram: '📷',
  email: '✉️',
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-100 shrink-0">
        <input
          placeholder="Buscar conversación..."
          className="w-full px-3 py-2 text-sm bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-hotel"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 && (
          <div className="p-6 text-center text-sm text-gray-400">Sin conversaciones</div>
        )}
        {conversations.map(conv => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={cn(
              'w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors',
              selectedId === conv.id && 'bg-blue-50 border-l-2 border-l-hotel',
            )}
          >
            <div className="flex items-start gap-3">
              <div className="relative w-10 h-10 shrink-0">
                <div className="w-10 h-10 rounded-full bg-hotel/10 flex items-center justify-center text-hotel font-semibold text-sm">
                  {(conv.contact_name ?? conv.phone).charAt(0).toUpperCase()}
                </div>
                {conv.channel && conv.channel !== 'whatsapp' && (
                  <span className="absolute -bottom-0.5 -right-0.5 text-[11px] bg-white rounded-full w-4 h-4 flex items-center justify-center shadow-sm border border-gray-100">
                    {CHANNEL_ICON[conv.channel] ?? '💬'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {conv.contact_name ?? conv.phone}
                  </span>
                  {conv.last_message_at && (
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false, locale: es })}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-gray-500 truncate">{conv.last_message ?? ''}</p>
                  {conv.unread_count > 0 && (
                    <span className="ml-2 min-w-[18px] h-[18px] bg-hotel text-white text-[10px] rounded-full flex items-center justify-center font-bold px-1 shrink-0">
                      {conv.unread_count > 9 ? '9+' : conv.unread_count}
                    </span>
                  )}
                </div>
                {conv.tags.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {conv.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
