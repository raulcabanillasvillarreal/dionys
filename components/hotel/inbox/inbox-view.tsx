'use client'

import { useState, useEffect, useTransition } from 'react'
import { ConversationList } from './conversation-list'
import { ChatWindow } from './chat-window'
import { ContactInfoPanel } from './contact-info-panel'
import { getMessages, markAsRead } from '@/lib/actions/whatsapp'
import { createClient } from '@/lib/supabase/client'

type Channel = 'all' | 'whatsapp' | 'instagram' | 'email'

interface Conversation {
  id: string
  phone: string
  contact_name: string | null
  last_message: string | null
  last_message_at: string | null
  unread_count: number
  status: string
  tags: string[]
  lead_id: string | null
  channel: string
  email_subject: string | null
}

interface Message {
  id: string
  conversation_id: string
  direction: 'inbound' | 'outbound'
  type: string
  content: string | null
  status: string
  sent_at: string
  wa_message_id: string | null
  template_name: string | null
}

interface Template {
  id: string
  name: string
  body: string
  variables: string[]
}

interface InboxViewProps {
  initialConversations: Conversation[]
  templates: Template[]
}

const CHANNEL_TABS: { value: Channel; label: string; icon: string }[] = [
  { value: 'all', label: 'Todo', icon: '💬' },
  { value: 'whatsapp', label: 'WhatsApp', icon: '📱' },
  { value: 'instagram', label: 'Instagram', icon: '📷' },
  { value: 'email', label: 'Email', icon: '✉️' },
]

export function InboxView({ initialConversations, templates }: InboxViewProps) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [channel, setChannel] = useState<Channel>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [, startTransition] = useTransition()

  const filtered = channel === 'all' ? conversations : conversations.filter(c => c.channel === channel)
  const selectedConv = conversations.find(c => c.id === selectedId) ?? null

  const unreadByChannel = (ch: Channel) =>
    conversations
      .filter(c => ch === 'all' || c.channel === ch)
      .reduce((s, c) => s + (c.unread_count ?? 0), 0)

  useEffect(() => {
    const supabase = createClient()
    const chan = supabase
      .channel('inbox-conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wa_conversations' }, payload => {
        if (payload.eventType === 'INSERT') {
          setConversations(prev => [payload.new as Conversation, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setConversations(prev =>
            prev
              .map(c => (c.id === payload.new.id ? { ...c, ...payload.new } : c))
              .sort((a, b) => {
                if (!a.last_message_at) return 1
                if (!b.last_message_at) return -1
                return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
              }),
          )
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(chan) }
  }, [])

  async function handleSelect(id: string) {
    setSelectedId(id)
    const msgs = await getMessages(id)
    setMessages(msgs as Message[])
    startTransition(() => { markAsRead(id) })
    setConversations(prev => prev.map(c => (c.id === id ? { ...c, unread_count: 0 } : c)))
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel */}
      <div className="w-72 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">Inbox</h2>
        </div>

        {/* Channel tabs */}
        <div className="flex border-b border-gray-100 px-2 pt-1 gap-0.5 shrink-0">
          {CHANNEL_TABS.map(tab => {
            const count = unreadByChannel(tab.value)
            return (
              <button
                key={tab.value}
                onClick={() => setChannel(tab.value)}
                className={`flex items-center gap-1 px-2.5 py-2 text-xs font-medium rounded-t-lg transition-colors relative ${
                  channel === tab.value
                    ? 'text-hotel border-b-2 border-hotel bg-hotel/5'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {count > 0 && (
                  <span className="ml-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold px-0.5">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <ConversationList
          conversations={filtered}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedConv ? (
          <ChatWindow
            key={selectedConv.id}
            conversationId={selectedConv.id}
            contactName={selectedConv.contact_name}
            phone={selectedConv.phone}
            channel={(selectedConv.channel ?? 'whatsapp') as 'whatsapp' | 'instagram' | 'email'}
            emailSubject={selectedConv.email_subject}
            initialMessages={messages}
            templates={templates}
          />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Contact info */}
      {selectedConv && (
        <div className="w-64 shrink-0 hidden lg:flex flex-col">
          <ContactInfoPanel conversation={selectedConv} />
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-400">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-500">Selecciona una conversación</p>
        <p className="text-xs text-gray-400 mt-1">WhatsApp · Instagram · Email</p>
      </div>
    </div>
  )
}
