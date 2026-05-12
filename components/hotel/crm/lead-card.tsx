'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Phone, Mail, MessageCircle, Calendar, BedDouble, GripVertical } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Lead } from '@/types/hotel-crm'

const SOURCE_COLORS: Record<string, string> = {
  whatsapp: 'bg-green-100 text-green-700',
  instagram: 'bg-purple-100 text-purple-700',
  telefono: 'bg-blue-100 text-blue-700',
  email: 'bg-indigo-100 text-indigo-700',
  web: 'bg-gray-100 text-gray-600',
  referido: 'bg-orange-100 text-orange-700',
}

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  whatsapp: <MessageCircle size={11} />,
  instagram: <span className="text-[10px] font-black">IG</span>,
  telefono: <Phone size={11} />,
  email: <Mail size={11} />,
}

const TAG_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
]

interface LeadCardProps {
  lead: Lead
  stageColor: string
  onClick: () => void
}

export function LeadCard({ lead, stageColor, onClick }: LeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { stageId: lead.stage_id },
  })

  const nights =
    lead.check_in && lead.check_out
      ? Math.ceil((new Date(lead.check_out).getTime() - new Date(lead.check_in).getTime()) / 86_400_000)
      : null

  const initials = (lead.guest?.full_name ?? lead.title)
    .split(' ')
    .slice(0, 2)
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase()

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0 : 1 }}
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer group overflow-hidden"
    >
      {/* Color accent top bar */}
      <div className="h-0.5 w-full" style={{ backgroundColor: stageColor }} />

      <div className="p-3.5">
        {/* Top row: avatar + name + drag handle */}
        <div className="flex items-start gap-2.5 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
            style={{ backgroundColor: stageColor }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate leading-tight">
              {lead.guest?.full_name ?? lead.title}
            </p>
            {lead.guest?.phone && (
              <p className="text-xs text-gray-400 truncate mt-0.5">{lead.guest.phone}</p>
            )}
          </div>
          <div
            {...attributes}
            {...listeners}
            onClick={e => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-0.5 text-gray-400 shrink-0"
          >
            <GripVertical size={14} />
          </div>
        </div>

        {/* Room + nights chip */}
        {(lead.room || nights) && (
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5">
            <BedDouble size={11} className="text-hotel shrink-0" />
            <span className="truncate flex-1">
              {lead.room ? `${lead.room.type} · Hab. ${lead.room.number}` : 'Sin habitación'}
            </span>
            {nights && <span className="text-gray-400 shrink-0 font-medium">{nights}n</span>}
          </div>
        )}

        {/* Dates */}
        {lead.check_in && (
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-2.5">
            <Calendar size={11} className="shrink-0" />
            <span>{formatDate(lead.check_in)}{lead.check_out ? ` → ${formatDate(lead.check_out)}` : ''}</span>
          </div>
        )}

        {/* Tags */}
        {lead.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {lead.tags.slice(0, 3).map((tag, i) => (
              <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${TAG_COLORS[i % TAG_COLORS.length]}`}>
                {tag}
              </span>
            ))}
            {lead.tags.length > 3 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold">
                +{lead.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Bottom: source badge + amount */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          {lead.source ? (
            <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${SOURCE_COLORS[lead.source] ?? 'bg-gray-100 text-gray-500'}`}>
              {SOURCE_ICONS[lead.source]}
              {lead.source}
            </span>
          ) : <span />}
          {lead.amount != null && (
            <span className="text-sm font-extrabold text-gray-900">
              {formatCurrency(lead.amount)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
