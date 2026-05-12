'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  X, Phone, Mail, MessageCircle, BedDouble, Calendar,
  MapPin, FileText, Plus, Check, Trash2,
} from 'lucide-react'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { addNote, getActivities, toggleTask, createTask, deleteLead, updateLead } from '@/lib/actions/hotel-crm'
import type { Lead, Activity, StageWithLeads } from '@/types/hotel-crm'

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  nota: <FileText size={13} className="text-gray-500" />,
  llamada: <Phone size={13} className="text-blue-500" />,
  whatsapp: <MessageCircle size={13} className="text-green-500" />,
  email: <Mail size={13} className="text-purple-500" />,
  cambio_etapa: <MapPin size={13} className="text-orange-500" />,
  sistema: <Check size={13} className="text-gray-400" />,
  tarea: <Check size={13} className="text-teal-500" />,
}

interface LeadPanelProps {
  lead: Lead
  stages: StageWithLeads[]
  onClose: () => void
  onStageChange: (leadId: string, stageId: string) => void
}

type Tab = 'info' | 'actividad' | 'tareas'

export function LeadPanel({ lead, stages, onClose, onStageChange }: LeadPanelProps) {
  const [tab, setTab] = useState<Tab>('info')
  const [activities, setActivities] = useState<Activity[]>([])
  const [note, setNote] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [isPending, startTransition] = useTransition()

  const currentStage = stages.find(s => s.id === lead.stage_id)
  const nights =
    lead.check_in && lead.check_out
      ? Math.ceil((new Date(lead.check_out).getTime() - new Date(lead.check_in).getTime()) / 86_400_000)
      : null

  useEffect(() => {
    getActivities(lead.id).then(setActivities)
  }, [lead.id])

  async function handleAddNote() {
    if (!note.trim()) return
    await addNote(lead.id, note.trim())
    setNote('')
    const updated = await getActivities(lead.id)
    setActivities(updated)
  }

  async function handleAddTask() {
    if (!taskTitle.trim()) return
    const fd = new FormData()
    fd.set('lead_id', lead.id)
    fd.set('title', taskTitle.trim())
    await createTask(fd)
    setTaskTitle('')
    const updated = await getActivities(lead.id)
    setActivities(updated)
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar este lead? Esta acción no se puede deshacer.')) return
    await deleteLead(lead.id)
    onClose()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 truncate">
              {lead.guest?.full_name ?? lead.title}
            </h2>
            {lead.amount != null && (
              <p className="text-xl font-bold text-hotel mt-0.5">{formatCurrency(lead.amount)}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleDelete}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={15} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Stage selector */}
        <select
          value={lead.stage_id}
          onChange={e => onStageChange(lead.id, e.target.value)}
          className="w-full text-xs font-medium border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-hotel"
          style={{ color: currentStage?.color }}
        >
          {stages.map(s => (
            <option key={s.id} value={s.id} style={{ color: s.color }}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Quick contact actions */}
        <div className="flex gap-2 mt-3">
          {lead.guest?.phone && (
            <a
              href={`tel:${lead.guest.phone}`}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Phone size={13} /> Llamar
            </a>
          )}
          {lead.guest?.phone && (
            <a
              href={`https://wa.me/${lead.guest.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
            >
              <MessageCircle size={13} /> WhatsApp
            </a>
          )}
          {lead.guest?.email && (
            <a
              href={`mailto:${lead.guest.email}`}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Mail size={13} /> Email
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-5">
        {(['info', 'actividad', 'tareas'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'py-2.5 px-1 mr-4 text-xs font-semibold border-b-2 -mb-px capitalize transition-colors',
              tab === t
                ? 'border-hotel text-hotel'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            {t === 'info' ? 'Información' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {tab === 'info' && (
          <div className="p-5 space-y-4">
            <Section title="Contacto">
              {lead.guest?.email && <InfoRow icon={<Mail size={14} />} value={lead.guest.email} />}
              {lead.guest?.phone && <InfoRow icon={<Phone size={14} />} value={lead.guest.phone} />}
              {lead.guest?.document_number && (
                <InfoRow icon={<FileText size={14} />} value={lead.guest.document_number} />
              )}
              {lead.guest?.nationality && (
                <InfoRow icon={<MapPin size={14} />} value={lead.guest.nationality} />
              )}
            </Section>

            <Section title="Estadía">
              {lead.room && (
                <InfoRow icon={<BedDouble size={14} />} value={`${lead.room.type} · Hab. ${lead.room.number}`} />
              )}
              {lead.check_in && (
                <InfoRow
                  icon={<Calendar size={14} />}
                  value={`${formatDate(lead.check_in)}${lead.check_out ? ` → ${formatDate(lead.check_out)}` : ''} ${nights ? `(${nights} noches)` : ''}`}
                />
              )}
              {lead.room && (
                <InfoRow icon={<FileText size={14} />} value={`S/ ${lead.room.price_per_night}/noche`} />
              )}
            </Section>

            {lead.notes && (
              <Section title="Notas">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{lead.notes}</p>
              </Section>
            )}

            {lead.tags.length > 0 && (
              <Section title="Etiquetas">
                <div className="flex flex-wrap gap-1.5">
                  {lead.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 bg-hotel/10 text-hotel rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}

        {tab === 'actividad' && (
          <div className="p-5 space-y-4">
            {/* Add note */}
            <div className="bg-white rounded-xl border border-gray-200 p-3">
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Agregar una nota..."
                rows={3}
                className="w-full text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleAddNote}
                  disabled={!note.trim()}
                  className="text-xs px-3 py-1.5 bg-hotel text-white rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  Guardar nota
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              {activities.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">Sin actividad registrada</p>
              )}
              {activities.map(act => (
                <div key={act.id} className="flex gap-3 bg-white rounded-xl border border-gray-200 p-3">
                  <span className="mt-0.5 shrink-0">{ACTIVITY_ICONS[act.type] ?? <FileText size={13} />}</span>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700">{act.content}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(act.created_at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'tareas' && (
          <div className="p-5 space-y-3">
            <div className="flex gap-2">
              <input
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                placeholder="Nueva tarea..."
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-hotel bg-white"
              />
              <button
                onClick={handleAddTask}
                disabled={!taskTitle.trim()}
                className="px-3 py-2 bg-hotel text-white rounded-lg text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                <Plus size={15} />
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center py-4">
              Las tareas se gestionan en la sección Tareas
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function InfoRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-700">
      <span className="text-gray-400 shrink-0">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  )
}
