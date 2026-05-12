'use client'

import { useState, useTransition } from 'react'
import { Tag, X, Plus, CheckCircle, ExternalLink, User, Hash } from 'lucide-react'
import { updateConversationTags, resolveConversation } from '@/lib/actions/whatsapp'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const QUICK_TAGS = ['VIP', 'Reserva', 'Pendiente', 'Corporativo', 'Familiar']

const TAG_COLORS: Record<string, string> = {
  VIP: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Reserva: 'bg-blue-100 text-blue-700 border-blue-200',
  Pendiente: 'bg-orange-100 text-orange-700 border-orange-200',
  Resuelto: 'bg-gray-100 text-gray-600 border-gray-200',
  Corporativo: 'bg-purple-100 text-purple-700 border-purple-200',
  Familiar: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  WhatsApp: 'bg-green-100 text-green-700 border-green-200',
}

interface Conversation {
  id: string
  phone: string
  contact_name: string | null
  status: string
  tags: string[]
  lead_id: string | null
  channel?: string
}

export function ContactInfoPanel({ conversation }: { conversation: Conversation }) {
  const [tags, setTags] = useState<string[]>(conversation.tags ?? [])
  const [newTag, setNewTag] = useState('')
  const [showTagInput, setShowTagInput] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function addTag(tag: string) {
    const t = tag.trim()
    if (!t || tags.includes(t)) return
    const next = [...tags, t]
    setTags(next)
    setNewTag('')
    setShowTagInput(false)
    startTransition(async () => { await updateConversationTags(conversation.id, next) })
  }

  function removeTag(tag: string) {
    const next = tags.filter(t => t !== tag)
    setTags(next)
    startTransition(async () => { await updateConversationTags(conversation.id, next) })
  }

  function handleResolve() {
    startTransition(async () => {
      await resolveConversation(conversation.id)
      router.refresh()
    })
  }

  const name = conversation.contact_name ?? 'Sin nombre'
  const initial = name.charAt(0).toUpperCase()

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Profile header */}
      <div className="px-5 py-6 text-center border-b border-gray-100 bg-gradient-to-b from-hotel/5 to-white">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-hotel to-blue-400 flex items-center justify-center text-white font-extrabold text-2xl mx-auto mb-3 shadow-md">
          {initial}
        </div>
        <h3 className="text-sm font-bold text-gray-900">{name}</h3>
        <p className="text-xs text-gray-500 mt-0.5 font-medium">{conversation.phone}</p>

        {/* Status badge */}
        <span className={cn(
          'inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mt-2',
          conversation.status === 'open'
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-500'
        )}>
          <span className={cn('w-1.5 h-1.5 rounded-full', conversation.status === 'open' ? 'bg-green-500' : 'bg-gray-400')} />
          {conversation.status === 'open' ? 'Conversación abierta' : 'Resuelta'}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* Lead link */}
        {conversation.lead_id && (
          <a
            href={`/hotel?lead=${conversation.lead_id}`}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 bg-hotel/5 border border-hotel/20 rounded-xl text-sm text-hotel hover:bg-hotel/10 transition-colors group"
          >
            <ExternalLink size={14} className="shrink-0" />
            <span className="font-medium text-sm">Ver lead en pipeline</span>
          </a>
        )}

        {/* Contact info */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <User size={10} /> Contacto
          </p>
          <div className="bg-gray-50 rounded-xl p-3 space-y-2">
            <div>
              <p className="text-[10px] text-gray-400 font-medium">Teléfono</p>
              <p className="text-xs font-semibold text-gray-800">{conversation.phone}</p>
            </div>
            {conversation.channel && (
              <div>
                <p className="text-[10px] text-gray-400 font-medium">Canal</p>
                <p className="text-xs font-semibold text-gray-800 capitalize">{conversation.channel}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Hash size={10} /> Etiquetas
            </p>
            <button
              onClick={() => setShowTagInput(v => !v)}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-hotel/10 hover:text-hotel transition-colors"
            >
              <Plus size={13} />
            </button>
          </div>

          {/* Quick tags */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {QUICK_TAGS.filter(t => !tags.includes(t)).map(qt => (
              <button
                key={qt}
                onClick={() => addTag(qt)}
                className="text-[10px] px-2 py-0.5 rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-hotel hover:text-hotel transition-colors"
              >
                + {qt}
              </button>
            ))}
          </div>

          {/* Active tags */}
          <div className="flex flex-wrap gap-1.5">
            {tags.map(tag => (
              <span
                key={tag}
                className={cn(
                  'inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-1 font-semibold border',
                  TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-700 border-gray-200'
                )}
              >
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:opacity-70 transition-opacity ml-0.5">
                  <X size={10} />
                </button>
              </span>
            ))}
            {tags.length === 0 && (
              <p className="text-xs text-gray-400 italic">Sin etiquetas</p>
            )}
          </div>

          {showTagInput && (
            <div className="flex gap-1.5 mt-2">
              <input
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag(newTag)}
                placeholder="Escribe y presiona Enter"
                className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-hotel/30 bg-gray-50"
                autoFocus
              />
              <button
                onClick={() => addTag(newTag)}
                className="px-3 py-1 bg-hotel text-white text-xs rounded-xl hover:opacity-90 font-medium"
              >
                OK
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Resolve button */}
      {conversation.status === 'open' && (
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleResolve}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            <CheckCircle size={16} />
            Marcar como resuelta
          </button>
        </div>
      )}
    </div>
  )
}
