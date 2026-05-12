'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { X, Plus, User, Phone, Mail, BedDouble, Calendar, Tag, Zap } from 'lucide-react'
import { createLead } from '@/lib/actions/hotel-crm'
import type { StageWithLeads, Lead } from '@/types/hotel-crm'

interface AddLeadDialogProps {
  open: boolean
  onClose: () => void
  onLeadCreated: (lead: Lead) => void
  stages: StageWithLeads[]
  defaultStageId?: string
  availableRooms: { id: string; number: string; type: string; price_per_night: number }[]
}

const SOURCES = ['whatsapp', 'telefono', 'email', 'web', 'referido', 'directo', 'instagram', 'otro'] as const
const QUICK_TAGS = ['VIP', 'Reserva', 'Corporativo', 'Familiar', 'Pareja', 'Solo', 'Internacional']

export function AddLeadDialog({ open, onClose, onLeadCreated, stages, defaultStageId, availableRooms }: AddLeadDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  function addTag(tag: string) {
    const t = tag.trim()
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput('')
  }

  function removeTag(tag: string) {
    setTags(prev => prev.filter(t => t !== tag))
  }

  function handleTagKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === 'Backspace' && !tagInput && tags.length) {
      setTags(prev => prev.slice(0, -1))
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('tags', tags.join(','))
    const result = await createLead(fd)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.lead) {
      setTags([])
      setTagInput('')
      formRef.current?.reset()
      onLeadCreated(result.lead as Lead)
      onClose()
    } else {
      // Fallback: close anyway
      onClose()
    }
    setLoading(false)
  }

  function handleClose() {
    setTags([])
    setTagInput('')
    setError(null)
    onClose()
  }

  const activeStages = stages.filter(s => !s.is_lost)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Nueva consulta</h2>
            <p className="text-xs text-gray-400 mt-0.5">Agrega un nuevo lead al pipeline</p>
          </div>
          <button onClick={handleClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

            {/* Guest info */}
            <fieldset>
              <legend className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                <User size={12} /> Huésped
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={lbl}>Nombre completo *</label>
                  <input name="guest_name" required placeholder="Juan Pérez" className={inp} autoFocus />
                </div>
                <div>
                  <label className={lbl}>
                    <Phone size={11} className="inline mr-1 text-gray-400" />Teléfono
                  </label>
                  <input name="phone" placeholder="+51 999 000 000" className={inp} />
                </div>
                <div>
                  <label className={lbl}>
                    <Mail size={11} className="inline mr-1 text-gray-400" />Email
                  </label>
                  <input name="email" type="email" placeholder="juan@email.com" className={inp} />
                </div>
              </div>
            </fieldset>

            {/* Pipeline */}
            <fieldset>
              <legend className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                <Zap size={12} /> Pipeline
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Etapa</label>
                  <select name="stage_id" defaultValue={defaultStageId ?? activeStages[0]?.id} className={inp}>
                    {activeStages.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Canal de origen</label>
                  <select name="source" className={inp}>
                    {SOURCES.map(s => (
                      <option key={s} value={s} className="capitalize">{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </fieldset>

            {/* Stay info */}
            <fieldset>
              <legend className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                <BedDouble size={12} /> Estadía
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>
                    <Calendar size={11} className="inline mr-1 text-gray-400" />Check-in
                  </label>
                  <input name="check_in" type="date" className={inp} />
                </div>
                <div>
                  <label className={lbl}>
                    <Calendar size={11} className="inline mr-1 text-gray-400" />Check-out
                  </label>
                  <input name="check_out" type="date" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Habitación</label>
                  <select name="room_id" className={inp}>
                    <option value="">— Sin asignar —</option>
                    {availableRooms.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.number} · {r.type} · S/{r.price_per_night}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Monto estimado (S/)</label>
                  <input name="amount" type="number" step="0.01" min="0" placeholder="0.00" className={inp} />
                </div>
              </div>
            </fieldset>

            {/* Tags */}
            <fieldset>
              <legend className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                <Tag size={12} /> Etiquetas
              </legend>

              {/* Quick tags */}
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {QUICK_TAGS.map(qt => (
                  <button
                    key={qt}
                    type="button"
                    onClick={() => tags.includes(qt) ? removeTag(qt) : addTag(qt)}
                    className={`text-[11px] px-2.5 py-1 rounded-full font-semibold transition-colors border ${
                      tags.includes(qt)
                        ? 'bg-hotel text-white border-hotel'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-hotel hover:text-hotel'
                    }`}
                  >
                    {qt}
                  </button>
                ))}
              </div>

              {/* Custom tag input */}
              <div className="flex flex-wrap gap-1.5 p-2.5 border border-gray-200 rounded-xl bg-gray-50 min-h-[42px] focus-within:ring-2 focus-within:ring-hotel focus-within:border-transparent">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 text-xs bg-hotel/10 text-hotel px-2 py-0.5 rounded-full font-medium">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:opacity-60">
                      <X size={11} />
                    </button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKey}
                  onBlur={() => tagInput && addTag(tagInput)}
                  placeholder={tags.length ? '' : 'Escribe y presiona Enter...'}
                  className="flex-1 min-w-[120px] bg-transparent text-xs text-gray-700 placeholder-gray-400 focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Presiona Enter o coma para agregar</p>
            </fieldset>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <span className="font-medium">Error:</span> {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-400">* Campo obligatorio</p>
            <div className="flex gap-2">
              <button type="button" onClick={handleClose} className={btnCancel}>Cancelar</button>
              <button type="submit" disabled={loading} className={btnPrimary}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creando...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Plus size={14} />
                    Crear lead
                  </span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

const lbl = 'block text-xs font-semibold text-gray-600 mb-1.5'
const inp = 'w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-hotel focus:border-transparent bg-white transition-shadow placeholder-gray-400'
const btnPrimary = 'flex items-center gap-1.5 px-4 py-2 bg-hotel text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-sm'
const btnCancel = 'px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors'
