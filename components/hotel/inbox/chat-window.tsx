'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { Send, Paperclip, Smile, CheckCheck, Clock, AlertCircle, ChevronDown, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage } from '@/lib/actions/whatsapp'
import { cn } from '@/lib/utils'

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

interface ChatWindowProps {
  conversationId: string
  contactName: string | null
  phone: string
  channel: 'whatsapp' | 'instagram' | 'email'
  emailSubject?: string | null
  initialMessages: Message[]
  templates: Template[]
}

const CHANNEL_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  email: 'Correo',
}
const CHANNEL_COLOR: Record<string, string> = {
  whatsapp: 'bg-green-100 text-green-700',
  instagram: 'bg-purple-100 text-purple-700',
  email: 'bg-blue-100 text-blue-700',
}

export function ChatWindow({ conversationId, contactName, phone, channel, emailSubject, initialMessages, templates }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages(initialMessages)
  }, [conversationId, initialMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Supabase Realtime
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wa_messages', filter: `conversation_id=eq.${conversationId}` },
        payload => {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev
            return [...prev, payload.new as Message]
          })
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  function handleSend() {
    if (!text.trim()) return
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      conversation_id: conversationId,
      direction: 'outbound',
      type: 'text',
      content: text,
      status: 'sending',
      sent_at: new Date().toISOString(),
      wa_message_id: null,
      template_name: null,
    }
    setMessages(prev => [...prev, optimistic])
    const t = text
    setText('')
    startTransition(async () => {
      await sendMessage(conversationId, t)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#f0f4f8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-full bg-hotel/10 flex items-center justify-center text-hotel font-semibold text-sm">
          {(contactName ?? phone).charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">{contactName ?? phone}</p>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${CHANNEL_COLOR[channel] ?? 'bg-gray-100 text-gray-600'}`}>
              {CHANNEL_LABEL[channel] ?? channel}
            </span>
          </div>
          {emailSubject
            ? <p className="text-xs text-gray-400 truncate">{emailSubject}</p>
            : <p className="text-xs text-gray-400">{phone}</p>
          }
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Templates dropdown */}
      {showTemplates && (
        <div className="bg-white border-t border-gray-200 max-h-48 overflow-y-auto">
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => {
                setText(t.body)
                setShowTemplates(false)
              }}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0"
            >
              <p className="text-xs font-semibold text-gray-700">{t.name}</p>
              <p className="text-xs text-gray-500 truncate">{t.body}</p>
            </button>
          ))}
          {templates.length === 0 && (
            <p className="p-4 text-xs text-gray-400 text-center">Sin plantillas</p>
          )}
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-3 py-2 flex items-end gap-2 shrink-0">
        <button
          onClick={() => setShowTemplates(v => !v)}
          className={cn('p-2 rounded-lg transition-colors', showTemplates ? 'bg-hotel/10 text-hotel' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100')}
          title="Plantillas"
        >
          <FileText size={18} />
        </button>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          rows={1}
          className="flex-1 resize-none bg-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hotel max-h-32"
          style={{ minHeight: '40px' }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || isPending}
          className="p-2 bg-hotel text-white rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0"
        >
          <Send size={17} />
        </button>
      </div>
    </div>
  )
}

function MessageBubble({ msg }: { msg: Message }) {
  const isOut = msg.direction === 'outbound'
  return (
    <div className={cn('flex', isOut ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[72%] rounded-2xl px-3.5 py-2 text-sm shadow-sm',
          isOut ? 'bg-hotel text-white rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm',
        )}
      >
        {msg.content && <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>}
        <div className={cn('flex items-center gap-1 mt-1', isOut ? 'justify-end' : 'justify-start')}>
          <span className={cn('text-[10px]', isOut ? 'text-white/70' : 'text-gray-400')}>
            {new Date(msg.sent_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isOut && <StatusIcon status={msg.status} />}
        </div>
      </div>
    </div>
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'sending') return <Clock size={11} className="text-white/60" />
  if (status === 'failed') return <AlertCircle size={11} className="text-red-300" />
  if (status === 'read') return <CheckCheck size={11} className="text-blue-300" />
  return <CheckCheck size={11} className="text-white/70" />
}
