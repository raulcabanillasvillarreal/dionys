'use client'

import { useState, useCallback } from 'react'
import { DndContext, DragEndEvent, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { Plus, Search, SlidersHorizontal } from 'lucide-react'
import { KanbanColumn } from './kanban-column'
import { LeadCard } from './lead-card'
import { LeadDetail } from './lead-detail'
import { AddLeadDialog } from './add-lead-dialog'
import { moveLeadToStage } from '@/lib/actions/hotel-crm'
import type { Lead, StageWithLeads } from '@/types/hotel-crm'

interface Template { id: string; name: string; body: string; variables: string[] }

interface KanbanBoardProps {
  initialStages: StageWithLeads[]
  availableRooms: { id: string; number: string; type: string; price_per_night: number }[]
  templates: Template[]
}

export function KanbanBoard({ initialStages, availableRooms, templates }: KanbanBoardProps) {
  const [stages, setStages] = useState<StageWithLeads[]>(initialStages)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [activeDrag, setActiveDrag] = useState<Lead | null>(null)
  const [addDialog, setAddDialog] = useState<{ open: boolean; stageId?: string }>({ open: false })
  const [search, setSearch] = useState('')

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  const allLeads = stages.flatMap(s => s.leads)

  const filteredStages: StageWithLeads[] = search.trim()
    ? stages.map(s => ({
        ...s,
        leads: s.leads.filter(l =>
          l.guest?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
          l.guest?.phone?.includes(search) ||
          l.title.toLowerCase().includes(search.toLowerCase()),
        ),
      }))
    : stages

  function handleDragStart({ active }: { active: { id: string | number } }) {
    const lead = allLeads.find(l => l.id === String(active.id))
    setActiveDrag(lead ?? null)
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveDrag(null)
    if (!over) return
    const leadId = active.id as string
    const toStageId = over.id as string
    const fromStage = stages.find(s => s.leads.some(l => l.id === leadId))
    if (!fromStage || fromStage.id === toStageId) return
    const toStage = stages.find(s => s.id === toStageId)
    if (!toStage) return

    setStages(prev => prev.map(s => {
      if (s.id === fromStage.id) return { ...s, leads: s.leads.filter(l => l.id !== leadId) }
      if (s.id === toStageId) {
        const lead = fromStage.leads.find(l => l.id === leadId)!
        return { ...s, leads: [...s.leads, { ...lead, stage_id: toStageId }] }
      }
      return s
    }))

    if (selectedLead?.id === leadId) {
      setSelectedLead(prev => prev ? { ...prev, stage_id: toStageId } : null)
    }

    const result = await moveLeadToStage(leadId, toStageId, fromStage.name, toStage.name)
    if (result?.error) setStages(initialStages)
  }

  const handleStageChange = useCallback(async (leadId: string, stageId: string) => {
    const fromStage = stages.find(s => s.leads.some(l => l.id === leadId))
    const toStage = stages.find(s => s.id === stageId)
    if (!fromStage || !toStage || fromStage.id === stageId) return

    setStages(prev => prev.map(s => {
      if (s.id === fromStage.id) return { ...s, leads: s.leads.filter(l => l.id !== leadId) }
      if (s.id === stageId) {
        const lead = fromStage.leads.find(l => l.id === leadId)!
        return { ...s, leads: [...s.leads, { ...lead, stage_id: stageId }] }
      }
      return s
    }))
    if (selectedLead?.id === leadId) {
      setSelectedLead(prev => prev ? { ...prev, stage_id: stageId } : null)
    }
    await moveLeadToStage(leadId, stageId, fromStage.name, toStage.name)
  }, [stages, selectedLead])

  const totalLeads = allLeads.length
  const totalRevenue = allLeads.reduce((s, l) => s + (l.amount ?? 0), 0)

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar lead..."
            className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-hotel w-52 shadow-sm"
          />
        </div>
        <div className="text-sm text-gray-400 hidden sm:flex items-center gap-2">
          <span className="font-bold text-gray-700">{totalLeads}</span> leads ·{' '}
          <span className="font-bold text-hotel">
            S/ {totalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setAddDialog({ open: true })}
          className="flex items-center gap-2 px-4 py-2 bg-hotel text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm shrink-0"
        >
          <Plus size={15} />
          Nueva consulta
        </button>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto pb-4">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 h-full min-h-0">
            {filteredStages.map(stage => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                onAddLead={stageId => setAddDialog({ open: true, stageId })}
                onSelectLead={setSelectedLead}
              />
            ))}
          </div>

          <DragOverlay>
            {activeDrag && (
              <div className="rotate-2 opacity-90 scale-105">
                <LeadCard
                  lead={activeDrag}
                  stageColor={stages.find(s => s.id === activeDrag.stage_id)?.color ?? '#6B7280'}
                  onClick={() => {}}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Full-screen lead detail */}
      {selectedLead && (
        <LeadDetail
          lead={selectedLead}
          stages={stages}
          templates={templates}
          onClose={() => setSelectedLead(null)}
          onStageChange={handleStageChange}
          onDelete={() => {
            setStages(prev => prev.map(s => ({ ...s, leads: s.leads.filter(l => l.id !== selectedLead.id) })))
            setSelectedLead(null)
          }}
        />
      )}

      <AddLeadDialog
        open={addDialog.open}
        onClose={() => setAddDialog({ open: false })}
        onLeadCreated={lead => {
          setStages(prev => prev.map(s =>
            s.id === lead.stage_id ? { ...s, leads: [...s.leads, lead] } : s
          ))
          setAddDialog({ open: false })
        }}
        stages={stages}
        defaultStageId={addDialog.stageId}
        availableRooms={availableRooms}
      />
    </div>
  )
}
