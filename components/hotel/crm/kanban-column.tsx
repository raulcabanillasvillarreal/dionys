'use client'

import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { LeadCard } from './lead-card'
import { formatCurrency, cn } from '@/lib/utils'
import type { StageWithLeads, Lead } from '@/types/hotel-crm'

interface KanbanColumnProps {
  stage: StageWithLeads
  onAddLead: (stageId: string) => void
  onSelectLead: (lead: Lead) => void
}

export function KanbanColumn({ stage, onAddLead, onSelectLead }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  const total = stage.leads.reduce((s, l) => s + (l.amount ?? 0), 0)

  return (
    <div className="flex flex-col w-64 shrink-0">
      {/* Column header */}
      <div
        className="flex items-center justify-between mb-3 px-3 py-2.5 rounded-2xl"
        style={{ backgroundColor: `${stage.color}15` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: stage.color }} />
          <span className="text-sm font-bold text-gray-800 truncate">{stage.name}</span>
          <span
            className="text-[11px] font-bold rounded-full px-1.5 py-0.5 shrink-0 text-white"
            style={{ backgroundColor: stage.color }}
          >
            {stage.leads.length}
          </span>
        </div>
        <button
          onClick={() => onAddLead(stage.id)}
          className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors hover:bg-white/60 text-gray-500 hover:text-gray-700 shrink-0"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Revenue */}
      {total > 0 && (
        <p className="text-xs font-semibold px-1 mb-2.5" style={{ color: stage.color }}>
          {formatCurrency(total)}
        </p>
      )}

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-col gap-2.5 flex-1 min-h-[200px] rounded-2xl p-2.5 transition-all duration-200',
          isOver
            ? 'ring-2 ring-offset-1 bg-blue-50/80'
            : 'bg-gray-100/50',
        )}
        style={{}}
      >
        {stage.leads.map(lead => (
          <LeadCard
            key={lead.id}
            lead={lead}
            stageColor={stage.color}
            onClick={() => onSelectLead(lead)}
          />
        ))}

        {stage.leads.length === 0 && (
          <button
            onClick={() => onAddLead(stage.id)}
            className="flex flex-col items-center justify-center gap-1.5 h-20 text-gray-300 hover:text-gray-400 hover:bg-white/70 rounded-xl border-2 border-dashed border-gray-200 transition-all w-full"
          >
            <Plus size={16} />
            <span className="text-xs font-medium">Agregar lead</span>
          </button>
        )}
      </div>
    </div>
  )
}
