'use client'

import { useState, useTransition } from 'react'
import { Tag, X, Plus, CheckCircle, ExternalLink } from 'lucide-react'
import { updateConversationTags, resolveConversation } from '@/lib/actions/whatsapp'
import { useRouter } from 'next/navigation'

const TAG_COLORS: Record<string, string> = {
  WhatsApp: 'bg-green-100 text-green-700',
  VIP: 'bg-yellow-100 text-yellow-700',
  Reserva: 'bg-blue-100 text-blue-700',
  Pendiente: 'bg-orange-100 text-orange-700',
  Resuelto: 'bg-gray-100 text-gray-600',
}

interface Conversation {
  id: string
  phone: string
  contact_name: string | null
  status: string
  tags: string[]
  lead_id: string | null
}

export function ContactInfoPanel({ conversation }: { conversation: Conversation }) {
  const [tags, setTags] = useState<string[]>(conversation.tags ?? [])
  const [newTag, setNewTag] = useState('')
  const [showTagInput, setShowTagInput] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function addTag() {
    const t = newTag.trim()
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

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="w-14 h-14 rounded-full bg-hotel/10 flex items-center justify-center text-hotel font-bold text-xl mx-auto mb-3">
          {(conversation.contact_name ?? conversation.phone).charAt(0).toUpperCase()}
        </div>
        <h3 className="text-sm font-bold text-gray-900 text-center">{conversation.contact_name ?? 'Sin nombre'}</h3>
        <p className="text-xs text-gray-500 text-center mt-0.5">{conversation.phone}</p>
      </div>

      {/* Info */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Lead link */}
        {conversation.lead_id && (
          <a
            href={`/hotel?lead=${conversation.lead_id}`}
            className="flex items-center gap-2 text-xs text-hotel hover:underline"
          >
            <ExternalLink size={13} />
            Ver lead en pipeline
          </a>
        )}

        {/* Tags */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <Tag size={12} /> Etiquetas
            </span>
            <button
              onClick={() => setShowTagInput(v => !v)}
              className="text-hotel hover:opacity-80 transition-opacity"
            >
              <Plus size={15} />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tags.map(tag => (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-1 font-medium ${TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-700'}`}
              >
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:opacity-70">
                  <X size={11} />
                </button>
              </span>
            ))}
            {tags.length === 0 && <p className="text-xs text-gray-400">Sin etiquetas</p>}
          </div>
          {showTagInput && (
            <div className="flex gap-1.5 mt-2">
              <input
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
                placeholder="Nueva etiqueta..."
                className="flex-1 text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-hotel"
                autoFocus
              />
              <button onClick={addTag} className="px-2 py-1 bg-hotel text-white text-xs rounded-lg hover:opacity-90">
                OK
              </button>
            </div>
          )}
        </div>

        {/* Status */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Estado</p>
          <span className={`text-xs rounded-full px-2.5 py-1 font-medium ${conversation.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {conversation.status === 'open' ? 'Abierta' : 'Resuelta'}
          </span>
        </div>
      </div>

      {/* Actions */}
      {conversation.status === 'open' && (
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleResolve}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <CheckCircle size={15} />
            Marcar como resuelta
          </button>
        </div>
      )}
    </div>
  )
}
