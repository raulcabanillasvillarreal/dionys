'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { Send, CheckCheck, Clock, AlertCircle, FileText, ArrowLeft, Phone, MoreVertical, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage } from '@/lib/actions/whatsapp'
import { cn } from '@/lib/utils'
import { CHANNEL_CONFIG } from './inbox-view'
import type { Message, Template } from './inbox-view'

interface ChatWindowProps {
  conversationId: string
  contactName: string | null
  phone: string
  channel: 'whatsapp' | 'instagram' | 'email' | 'facebook'
  emailSubject?: string | null
  initialMessages: Message[]
  templates: Template[]
  onBack?: () => void
}

function groupMessagesByDate(messages: Message[]) {
  const groups: { date: string; messages: Message[] }[] = []
  for (const msg of messages) {
    const d = new Date(msg.sent_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
    const last = groups[groups.length - 1]
    if (last && last.date === d) {
      last.messages.push(msg)
    } else {
      groups.push({ date: d, messages: [msg] })
    }
  }
  return groups
}

export function ChatWindow({
  conversationId, contactName, phone, channel,
  emailSubject, initialMessages, templates, onBack,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [templateSearch, setTemplateSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const channelCfg = CHANNEL_CONFIG[channel]
  const name = contactName ?? phone
  const initial = name.charAt(0).toUpperCase()

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
    t.body.toLowerCase().includes(templateSearch.toLowerCase())
  )

  useEffect(() => { setMessages(initialMessages) }, [conversationId, initialMessages])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    const supabase = createClient()
    const ch = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'wa_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, payload => {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev
          return [...prev, payload.new as Message]
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
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
    textareaRef.current?.focus()
    startTransition(async () => { await sendMessage(conversationId, t) })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const groups = groupMessagesByDate(messages)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0 shadow-sm">
        {/* Back button (mobile) */}
        {onBack && (
          <button onClick={onBack} className="md:hidden p-1.5 -ml-1 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
        )}

        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-hotel to-blue-400 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {initial}
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${channelCfg.bg} border-2 border-white`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{name}</p>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${channelCfg.light}`}>
              {channelCfg.label}
            </span>
            {emailSubject
              ? <p className="text-[11px] text-gray-400 truncate">{emailSubject}</p>
              : <p className="text-[11px] text-gray-400">{phone}</p>
            }
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <Phone size={17} />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <MoreVertical size={17} />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
        style={{ background: 'linear-gradient(180deg, #f0f4f8 0%, #e8edf2 100%)' }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-10">
            <div className={`w-12 h-12 rounded-full ${channelCfg.bg} flex items-center justify-center mb-3 opacity-30`}>
              <span className="text-white text-xl font-bold">{initial}</span>
            </div>
            <p className="text-sm font-medium text-gray-500">Inicia la conversación</p>
            <p className="text-xs mt-1">Los mensajes aparecerán aquí</p>
          </div>
        )}

        {groups.map(group => (
          <div key={group.date}>
            {/* Date separator */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-300/50" />
              <span className="text-[10px] font-semibold text-gray-400 bg-gray-200/60 px-3 py-1 rounded-full">
                {group.date}
              </span>
              <div className="flex-1 h-px bg-gray-300/50" />
            </div>

            {/* Messages */}
            <div className="space-y-1.5">
              {group.messages.map((msg, i) => {
                const prev = group.messages[i - 1]
                const sameSender = prev && prev.direction === msg.direction
                return (
                  <MessageBubble key={msg.id} msg={msg} compact={sameSender} />
                )
              })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Templates popup */}
      {showTemplates && (
        <div className="bg-white border-t border-gray-200 shadow-lg">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            <FileText size={15} className="text-hotel shrink-0" />
            <span className="text-sm font-semibold text-gray-800">Plantillas</span>
            <input
              value={templateSearch}
              onChange={e => setTemplateSearch(e.target.value)}
              placeholder="Buscar plantilla..."
              className="flex-1 text-sm bg-gray-100 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-hotel/30"
              autoFocus
            />
            <button onClick={() => { setShowTemplates(false); setTemplateSearch('') }} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filteredTemplates.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">Sin plantillas que coincidan</p>
            ) : (
              filteredTemplates.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setText(t.body); setShowTemplates(false); setTemplateSearch('') }}
                  className="w-full text-left px-4 py-3 hover:bg-hotel/5 border-b border-gray-100 last:border-0 transition-colors group"
                >
                  <p className="text-xs font-semibold text-gray-800 group-hover:text-hotel transition-colors">{t.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{t.body}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="bg-white border-t border-gray-200 px-3 py-2.5 flex items-end gap-2 shrink-0">
        <button
          onClick={() => setShowTemplates(v => !v)}
          title="Plantillas predefinidas"
          className={cn(
            'p-2.5 rounded-xl transition-all shrink-0',
            showTemplates
              ? 'bg-hotel text-white'
              : 'text-gray-400 hover:text-hotel hover:bg-hotel/10'
          )}
        >
          <FileText size={18} />
        </button>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            rows={1}
            className="w-full resize-none bg-gray-100 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hotel/30 focus:bg-white transition-all max-h-32 placeholder-gray-400"
            style={{ minHeight: '42px' }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!text.trim() || isPending}
          className={cn(
            'p-2.5 rounded-xl transition-all shrink-0',
            text.trim() && !isPending
              ? 'bg-hotel text-white shadow-md hover:bg-hotel/90 hover:shadow-lg active:scale-95'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
        >
          <Send size={18} className={text.trim() ? 'translate-x-0.5 -translate-y-0.5' : ''} />
        </button>
      </div>
    </div>
  )
}

function MessageBubble({ msg, compact }: { msg: Message; compact?: boolean }) {
  const isOut = msg.direction === 'outbound'

  return (
    <div className={cn('flex', isOut ? 'justify-end' : 'justify-start', compact ? 'mt-0.5' : 'mt-3')}>
      <div className={cn(
        'max-w-[78%] md:max-w-[65%] px-3.5 py-2 text-sm shadow-sm relative',
        isOut
          ? 'bg-hotel text-white rounded-2xl rounded-br-sm'
          : 'bg-white text-gray-800 rounded-2xl rounded-bl-sm',
      )}>
        {msg.content && (
          <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
        )}
        {msg.template_name && (
          <p className={cn('text-[10px] mt-0.5 font-medium', isOut ? 'text-white/60' : 'text-gray-400')}>
            Plantilla: {msg.template_name}
          </p>
        )}
        <div className={cn('flex items-center gap-1 mt-1', isOut ? 'justify-end' : 'justify-start')}>
          <span className={cn('text-[10px]', isOut ? 'text-white/60' : 'text-gray-400')}>
            {new Date(msg.sent_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isOut && <StatusIcon status={msg.status} />}
        </div>
      </div>
    </div>
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'sending') return <Clock size={11} className="text-white/50" />
  if (status === 'failed') return <AlertCircle size={11} className="text-red-300" />
  if (status === 'read') return <CheckCheck size={11} className="text-blue-200" />
  return <CheckCheck size={11} className="text-white/60" />
}
