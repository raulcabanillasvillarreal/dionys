'use client'

import { useState, useEffect, useTransition } from 'react'
import { ConversationList } from './conversation-list'
import { ChatWindow } from './chat-window'
import { ContactInfoPanel } from './contact-info-panel'
import { getMessages, markAsRead } from '@/lib/actions/whatsapp'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare } from 'lucide-react'

export type Channel = 'all' | 'whatsapp' | 'instagram' | 'email' | 'facebook'

export interface Conversation {
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

export interface Message {
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

export interface Template {
  id: string
  name: string
  body: string
  variables: string[]
}

interface InboxViewProps {
  initialConversations: Conversation[]
  templates: Template[]
}

export const CHANNEL_CONFIG = {
  whatsapp: { label: 'WhatsApp', color: '#25D366', bg: 'bg-green-500', light: 'bg-green-50 text-green-700', dot: 'bg-green-400' },
  instagram: { label: 'Instagram', color: '#E1306C', bg: 'bg-pink-500', light: 'bg-pink-50 text-pink-700', dot: 'bg-pink-400' },
  email: { label: 'Email', color: '#1a4e8a', bg: 'bg-blue-600', light: 'bg-blue-50 text-blue-700', dot: 'bg-blue-400' },
  facebook: { label: 'Facebook', color: '#1877F2', bg: 'bg-blue-500', light: 'bg-blue-50 text-blue-700', dot: 'bg-blue-400' },
} as const

const CHANNEL_TABS: { value: Channel; label: string }[] = [
  { value: 'all', label: 'Todo' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'email', label: 'Email' },
]

export function InboxView({ initialConversations, templates }: InboxViewProps) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [channel, setChannel] = useState<Channel>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [search, setSearch] = useState('')
  const [showChat, setShowChat] = useState(false) // mobile toggle
  const [, startTransition] = useTransition()

  const filtered = conversations
    .filter(c => channel === 'all' || c.channel === channel)
    .filter(c => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        (c.contact_name ?? '').toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.last_message ?? '').toLowerCase().includes(q)
      )
    })

  const selectedConv = conversations.find(c => c.id === selectedId) ?? null

  const unreadByChannel = (ch: Channel) =>
    conversations.filter(c => ch === 'all' || c.channel === ch).reduce((s, c) => s + (c.unread_count ?? 0), 0)

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
              })
          )
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(chan) }
  }, [])

  async function handleSelect(id: string) {
    setSelectedId(id)
    setShowChat(true)
    const msgs = await getMessages(id)
    setMessages(msgs as Message[])
    startTransition(() => { markAsRead(id) })
    setConversations(prev => prev.map(c => (c.id === id ? { ...c, unread_count: 0 } : c)))
  }

  return (
    <div className="flex h-full overflow-hidden bg-gray-100">
      {/* ── Lista de conversaciones ── */}
      <div className={`
        w-full md:w-80 lg:w-96 shrink-0 flex flex-col bg-white border-r border-gray-200
        ${showChat ? 'hidden md:flex' : 'flex'}
      `}>
        {/* Header */}
        <div className="px-4 pt-5 pb-3 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Mensajes</h1>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full font-medium">
              {conversations.filter(c => c.unread_count > 0).length} sin leer
            </span>
          </div>
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-hotel/30 focus:bg-white transition-all placeholder-gray-400"
            />
          </div>
        </div>

        {/* Channel tabs */}
        <div className="flex px-3 gap-1 pb-3 overflow-x-auto scrollbar-hide">
          {CHANNEL_TABS.map(tab => {
            const count = unreadByChannel(tab.value)
            const active = channel === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => setChannel(tab.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-hotel text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.value !== 'all' && (
                  <span className={`w-2 h-2 rounded-full ${CHANNEL_CONFIG[tab.value as keyof typeof CHANNEL_CONFIG]?.dot ?? 'bg-gray-400'}`} />
                )}
                {tab.label}
                {count > 0 && (
                  <span className={`min-w-[16px] h-4 rounded-full text-[9px] flex items-center justify-center font-bold px-0.5 ${
                    active ? 'bg-white/30 text-white' : 'bg-red-500 text-white'
                  }`}>
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

      {/* ── Chat ── */}
      <div className={`flex-1 flex flex-col overflow-hidden ${showChat ? 'flex' : 'hidden md:flex'}`}>
        {selectedConv ? (
          <ChatWindow
            key={selectedConv.id}
            conversationId={selectedConv.id}
            contactName={selectedConv.contact_name}
            phone={selectedConv.phone}
            channel={(selectedConv.channel ?? 'whatsapp') as 'whatsapp' | 'instagram' | 'email' | 'facebook'}
            emailSubject={selectedConv.email_subject}
            initialMessages={messages}
            templates={templates}
            onBack={() => setShowChat(false)}
          />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* ── Panel lateral ── */}
      {selectedConv && (
        <div className="w-72 shrink-0 hidden xl:flex flex-col">
          <ContactInfoPanel conversation={selectedConv} />
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-hotel/10 flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-9 h-9 text-hotel/60" />
        </div>
        <p className="text-base font-semibold text-gray-700">Tus mensajes</p>
        <p className="text-sm text-gray-400 mt-1">Selecciona una conversación para comenzar</p>
        <div className="flex items-center justify-center gap-3 mt-4">
          {(['whatsapp', 'instagram', 'facebook', 'email'] as const).map(ch => (
            <span key={ch} className={`text-xs px-3 py-1.5 rounded-full font-medium ${CHANNEL_CONFIG[ch].light}`}>
              {CHANNEL_CONFIG[ch].label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
