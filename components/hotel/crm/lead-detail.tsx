'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import {
  X, Phone, Mail, MessageCircle, BedDouble, Calendar,
  FileText, Plus, Trash2, MapPin, Tag,
  Send, Clock, CheckCheck, AlertCircle,
  Instagram, AtSign,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import {
  addNote, getActivities, createTask, deleteLead, updateLead,
} from '@/lib/actions/hotel-crm'
import {
  getConversationByLeadId, getMessages, sendMessage,
  markAsRead, updateConversationTags,
} from '@/lib/actions/whatsapp'
import type { Lead, Activity, StageWithLeads } from '@/types/hotel-crm'

interface Template { id: string; name: string; body: string; variables: string[] }
interface Message {
  id: string; conversation_id: string; direction: 'inbound' | 'outbound'
  type: string; content: string | null; status: string; sent_at: string
  wa_message_id: string | null; template_name: string | null
}
interface Conversation {
  id: string; phone: string; contact_name: string | null; channel: string
  last_message: string | null; tags: string[]; status: string
}

interface LeadDetailProps {
  lead: Lead
  stages: StageWithLeads[]
  templates: Template[]
  onClose: () => void
  onStageChange: (leadId: string, stageId: string) => void
  onDelete: () => void
}

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  whatsapp: <MessageCircle size={14} className="text-green-600" />,
  instagram: <Instagram size={14} className="text-purple-600" />,
  email: <AtSign size={14} className="text-blue-600" />,
}
const CHANNEL_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp', instagram: 'Instagram', email: 'Email',
}
const CHANNEL_BG: Record<string, string> = {
  whatsapp: 'bg-green-50 text-green-700 border-green-200',
  instagram: 'bg-purple-50 text-purple-700 border-purple-200',
  email: 'bg-blue-50 text-blue-700 border-blue-200',
}

const QUICK_TAGS = ['VIP', 'Reserva', 'Corporativo', 'Familiar', 'Pareja', 'Solo', 'Internacional', 'WhatsApp', 'Email']

export function LeadDetail({ lead, stages, templates, onClose, onStageChange, onDelete }: LeadDetailProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [note, setNote] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [templateSearch, setTemplateSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'actividad' | 'tareas'>('actividad')
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Tags state (editable)
  const [tags, setTags] = useState<string[]>(lead.tags ?? [])
  const [tagInput, setTagInput] = useState('')

  function addLeadTag(tag: string) {
    const t = tag.trim()
    if (!t || tags.includes(t)) return
    const next = [...tags, t]
    setTags(next)
    setTagInput('')
    startTransition(async () => { await updateLead(lead.id, { tags: next }) })
  }

  function removeLeadTag(tag: string) {
    const next = tags.filter(t => t !== tag)
    setTags(next)
    startTransition(async () => { await updateLead(lead.id, { tags: next }) })
  }

  function handleTagKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addLeadTag(tagInput) }
    else if (e.key === 'Backspace' && !tagInput && tags.length) removeLeadTag(tags[tags.length - 1])
  }

  const currentStage = stages.find(s => s.id === lead.stage_id)
  const nights =
    lead.check_in && lead.check_out
      ? Math.ceil((new Date(lead.check_out).getTime() - new Date(lead.check_in).getTime()) / 86_400_000)
      : null

  // Load activities + conversation
  useEffect(() => {
    getActivities(lead.id).then(setActivities)
    getConversationByLeadId(lead.id).then(async conv => {
      if (!conv) return
      setConversation(conv as unknown as Conversation)
      const msgs = await getMessages(conv.id)
      setMessages(msgs as Message[])
      markAsRead(conv.id)
    })
  }, [lead.id])

  // Realtime messages
  useEffect(() => {
    if (!conversation) return
    const supabase = createClient()
    const chan = supabase
      .channel(`lead-detail-${conversation.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'wa_messages',
        filter: `conversation_id=eq.${conversation.id}`,
      }, payload => {
        setMessages(prev => prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new as Message])
      })
      .subscribe()
    return () => { supabase.removeChannel(chan) }
  }, [conversation])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    if (!text.trim() || !conversation) return
    const optimistic: Message = {
      id: `opt-${Date.now()}`, conversation_id: conversation.id,
      direction: 'outbound', type: 'text', content: text,
      status: 'sending', sent_at: new Date().toISOString(),
      wa_message_id: null, template_name: null,
    }
    setMessages(prev => [...prev, optimistic])
    const t = text; setText(''); setShowTemplates(false)
    startTransition(async () => { await sendMessage(conversation.id, t) })
  }

  async function handleAddNote() {
    if (!note.trim()) return
    await addNote(lead.id, note.trim())
    setNote('')
    setActivities(await getActivities(lead.id))
  }

  async function handleAddTask() {
    if (!taskTitle.trim()) return
    const fd = new FormData(); fd.set('lead_id', lead.id); fd.set('title', taskTitle.trim())
    await createTask(fd); setTaskTitle('')
    setActivities(await getActivities(lead.id))
  }

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
    t.body.toLowerCase().includes(templateSearch.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-stretch p-0 md:p-4">
      <div className="relative flex w-full md:max-w-[1140px] md:mx-auto bg-white md:rounded-2xl overflow-hidden shadow-2xl">

        {/* ── LEFT PANEL (42%) ── */}
        <div className="w-[42%] shrink-0 flex flex-col border-r border-gray-100 bg-white">

          {/* Header — gradient */}
          <div className="relative px-5 pt-5 pb-4 border-b border-gray-100 overflow-hidden">
            {/* Subtle gradient accent */}
            <div className="absolute inset-0 bg-gradient-to-br from-hotel/5 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-start justify-between gap-2 mb-4">
                {/* Avatar + name */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-hotel flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md">
                    {(lead.guest?.full_name ?? lead.title).split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()}
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <h2 className="text-base font-bold text-gray-900 leading-tight truncate">
                      {lead.guest?.full_name ?? lead.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {lead.amount != null && (
                        <span className="text-hotel font-extrabold text-sm">{formatCurrency(lead.amount)}</span>
                      )}
                      {lead.source && (
                        <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">{lead.source}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={async () => { if (!confirm('¿Eliminar este lead?')) return; await deleteLead(lead.id); onDelete() }}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                    <Trash2 size={14} />
                  </button>
                  <button onClick={onClose} className="p-2 text-gray-300 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Stage selector styled */}
              <div className="mb-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Etapa del pipeline</label>
                <div className="relative">
                  <select
                    value={lead.stage_id}
                    onChange={e => onStageChange(lead.id, e.target.value)}
                    className="w-full text-sm font-semibold border-2 rounded-xl px-3 py-2.5 pr-8 focus:outline-none appearance-none bg-white cursor-pointer"
                    style={{ color: currentStage?.color, borderColor: `${currentStage?.color}40` }}
                  >
                    {stages.map(s => (
                      <option key={s.id} value={s.id} style={{ color: s.color }}>{s.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Quick action buttons */}
              <div className="flex gap-1.5 flex-wrap">
                {lead.guest?.phone && (
                  <a href={`tel:${lead.guest.phone}`}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors font-semibold border border-blue-100">
                    <Phone size={11} /> Llamar
                  </a>
                )}
                {lead.guest?.phone && (
                  <a href={`https://wa.me/${lead.guest.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors font-semibold border border-green-100">
                    <MessageCircle size={11} /> WhatsApp
                  </a>
                )}
                {lead.guest?.email && (
                  <a href={`mailto:${lead.guest.email}`}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-violet-50 text-violet-700 rounded-xl hover:bg-violet-100 transition-colors font-semibold border border-violet-100">
                    <Mail size={11} /> Email
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">

            {/* Contact */}
            <DetailCard title="Contacto" icon={<Phone size={13} />}>
              {lead.guest?.email && <InfoRow icon={<Mail size={13} className="text-purple-500" />} label="Email" value={lead.guest.email} />}
              {lead.guest?.phone && <InfoRow icon={<Phone size={13} className="text-blue-500" />} label="Teléfono" value={lead.guest.phone} />}
              {lead.guest?.document_number && <InfoRow icon={<FileText size={13} className="text-gray-400" />} label="Documento" value={lead.guest.document_number} />}
              {lead.guest?.nationality && <InfoRow icon={<MapPin size={13} className="text-orange-500" />} label="Nacionalidad" value={lead.guest.nationality} />}
              {!lead.guest?.email && !lead.guest?.phone && <p className="text-xs text-gray-400">Sin datos de contacto</p>}
            </DetailCard>

            {/* Estadía */}
            {(lead.room || lead.check_in) && (
              <DetailCard title="Estadía" icon={<BedDouble size={13} />}>
                {lead.room && <InfoRow icon={<BedDouble size={13} className="text-hotel" />} label="Habitación" value={`${lead.room.type} · Hab. ${lead.room.number}`} />}
                {lead.check_in && <InfoRow icon={<Calendar size={13} className="text-hotel" />} label="Check-in" value={formatDate(lead.check_in)} />}
                {lead.check_out && <InfoRow icon={<Calendar size={13} className="text-gray-400" />} label="Check-out" value={`${formatDate(lead.check_out)} ${nights ? `(${nights} noches)` : ''}`} />}
                {lead.room?.price_per_night && <InfoRow icon={<FileText size={13} className="text-gray-400" />} label="Tarifa" value={`S/ ${lead.room.price_per_night}/noche`} />}
              </DetailCard>
            )}

            {/* Tags — editable */}
            <DetailCard title="Etiquetas" icon={<Tag size={13} />}>
              {/* Quick picks */}
              <div className="flex flex-wrap gap-1 mb-2">
                {QUICK_TAGS.map(qt => (
                  <button key={qt} type="button"
                    onClick={() => tags.includes(qt) ? removeLeadTag(qt) : addLeadTag(qt)}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-all border ${
                      tags.includes(qt)
                        ? 'bg-hotel text-white border-hotel'
                        : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-hotel hover:text-hotel'
                    }`}>
                    {qt}
                  </button>
                ))}
              </div>
              {/* Chip input */}
              <div className="flex flex-wrap gap-1.5 p-2 border border-gray-200 rounded-xl bg-gray-50 min-h-[36px] focus-within:ring-2 focus-within:ring-hotel focus-within:border-transparent">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 text-[10px] bg-hotel/10 text-hotel px-2 py-0.5 rounded-full font-semibold">
                    {tag}
                    <button type="button" onClick={() => removeLeadTag(tag)} className="hover:opacity-60 transition-opacity"><X size={10} /></button>
                  </span>
                ))}
                <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKey}
                  onBlur={() => tagInput && addLeadTag(tagInput)}
                  placeholder={tags.length ? '' : 'Agregar etiqueta...'}
                  className="flex-1 min-w-[80px] bg-transparent text-[11px] text-gray-600 placeholder-gray-300 focus:outline-none" />
              </div>
            </DetailCard>

            {/* Notes + activities tabs */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex border-b border-gray-100">
                {(['actividad', 'tareas'] as const).map(t => (
                  <button key={t} onClick={() => setActiveTab(t)}
                    className={cn('flex-1 py-2.5 text-xs font-semibold transition-colors',
                      activeTab === t ? 'text-hotel bg-hotel/5 border-b-2 border-hotel' : 'text-gray-400 hover:text-gray-600')}>
                    {t === 'actividad' ? 'Actividad' : 'Tareas'}
                  </button>
                ))}
              </div>

              {activeTab === 'actividad' && (
                <div className="p-3 space-y-3">
                  <div className="space-y-1.5">
                    <textarea value={note} onChange={e => setNote(e.target.value)}
                      placeholder="Agregar nota..." rows={2}
                      className="w-full text-xs text-gray-700 placeholder-gray-300 resize-none focus:outline-none border-0 p-0" />
                    {note.trim() && (
                      <button onClick={handleAddNote}
                        className="text-xs px-3 py-1.5 bg-hotel text-white rounded-lg hover:opacity-90 transition-opacity">
                        Guardar nota
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {activities.map(act => (
                      <div key={act.id} className="flex gap-2 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-hotel/40 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-gray-700">{act.content}</p>
                          <p className="text-gray-300 mt-0.5">
                            {new Date(act.created_at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {activities.length === 0 && <p className="text-xs text-gray-300 text-center py-2">Sin actividad</p>}
                  </div>
                </div>
              )}

              {activeTab === 'tareas' && (
                <div className="p-3 space-y-2">
                  <div className="flex gap-1.5">
                    <input value={taskTitle} onChange={e => setTaskTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                      placeholder="Nueva tarea..."
                      className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-hotel" />
                    <button onClick={handleAddTask} disabled={!taskTitle.trim()}
                      className="px-2 py-1.5 bg-hotel text-white rounded-lg text-xs disabled:opacity-40 hover:opacity-90">
                      <Plus size={13} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-300 text-center py-2">Gestiona las tareas en la sección Tareas</p>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── RIGHT PANEL (58%) — Chat ── */}
        <div className="flex-1 flex flex-col bg-[#f7f8fc] min-w-0">

          {/* Chat header */}
          <div className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center gap-3 shrink-0">
            {conversation ? (
              <>
                <div className="w-9 h-9 rounded-full bg-hotel/10 flex items-center justify-center text-hotel font-bold text-sm shrink-0">
                  {(conversation.contact_name ?? conversation.phone).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900">{conversation.contact_name ?? conversation.phone}</p>
                    <span className={cn('flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border', CHANNEL_BG[conversation.channel] ?? 'bg-gray-100 text-gray-500 border-gray-200')}>
                      {CHANNEL_ICON[conversation.channel]}
                      {CHANNEL_LABEL[conversation.channel] ?? conversation.channel}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">{conversation.phone}</p>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-gray-400">
                <MessageCircle size={18} />
                <p className="text-sm">Sin conversación vinculada</p>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
            {!conversation && (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-300">
                <MessageCircle size={48} strokeWidth={1} className="mb-3" />
                <p className="text-sm font-medium">Sin conversación</p>
                <p className="text-xs mt-1">Cuando el lead escriba por WhatsApp,<br/>Instagram o Email aparecerá aquí</p>
              </div>
            )}
            {messages.map(msg => <Bubble key={msg.id} msg={msg} />)}
            <div ref={bottomRef} />
          </div>

          {/* Template picker */}
          {showTemplates && (
            <div className="bg-white border-t border-gray-200 shadow-lg">
              <div className="px-3 pt-2.5 pb-1">
                <input value={templateSearch} onChange={e => setTemplateSearch(e.target.value)}
                  placeholder="Buscar plantilla..."
                  className="w-full text-xs px-3 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-hotel" />
              </div>
              <div className="max-h-52 overflow-y-auto divide-y divide-gray-100">
                {filteredTemplates.length === 0 && (
                  <p className="px-4 py-3 text-xs text-gray-400 text-center">Sin resultados</p>
                )}
                {filteredTemplates.map(t => (
                  <button key={t.id} onClick={() => { setText(t.body); setShowTemplates(false); setTemplateSearch('') }}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors group">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-xs font-semibold text-gray-800 group-hover:text-hotel">{t.name}</p>
                      {t.variables.length > 0 && (
                        <span className="text-[10px] text-gray-400">{t.variables.length} variable{t.variables.length > 1 ? 's' : ''}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{t.body}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          {conversation && (
            <div className="bg-white border-t border-gray-100 px-4 py-3 flex items-end gap-2.5 shrink-0">
              <button onClick={() => setShowTemplates(v => !v)}
                className={cn('p-2 rounded-xl transition-colors shrink-0',
                  showTemplates ? 'bg-hotel text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}
                title="Plantillas predefinidas">
                <FileText size={17} />
              </button>
              <textarea value={text} onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="Escribe un mensaje... (Enter para enviar)"
                rows={1}
                className="flex-1 resize-none bg-gray-100 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hotel max-h-32 leading-relaxed"
                style={{ minHeight: '42px' }} />
              <button onClick={handleSend} disabled={!text.trim() || isPending}
                className="p-2.5 bg-hotel text-white rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0">
                <Send size={16} />
              </button>
            </div>
          )}
          {!conversation && (
            <div className="bg-white border-t border-gray-100 px-4 py-3 shrink-0">
              <p className="text-xs text-gray-400 text-center">Cuando el contacto escriba, podrás responder aquí</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function Bubble({ msg }: { msg: Message }) {
  const isOut = msg.direction === 'outbound'
  return (
    <div className={cn('flex', isOut ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm',
        isOut ? 'bg-hotel text-white rounded-br-md' : 'bg-white text-gray-800 rounded-bl-md border border-gray-100',
      )}>
        {msg.content && <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>}
        <div className={cn('flex items-center gap-1 mt-1', isOut ? 'justify-end' : 'justify-start')}>
          <span className={cn('text-[10px]', isOut ? 'text-white/60' : 'text-gray-300')}>
            {new Date(msg.sent_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isOut && <StatusIcon status={msg.status} />}
        </div>
      </div>
    </div>
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'sending') return <Clock size={10} className="text-white/50" />
  if (status === 'failed') return <AlertCircle size={10} className="text-red-300" />
  if (status === 'read') return <CheckCheck size={10} className="text-blue-300" />
  return <CheckCheck size={10} className="text-white/60" />
}

function DetailCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-gray-400">{icon}</span>
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0">{icon}</span>
      <span className="text-[10px] text-gray-400 w-16 shrink-0">{label}</span>
      <span className="text-xs text-gray-800 font-medium truncate">{value}</span>
    </div>
  )
}
