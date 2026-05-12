'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { KanbanBoard as KanbanBoardType } from './kanban-board'

// ssr:false debe estar en un Client Component — no en un Server Component
const KanbanBoard = dynamic(
  () => import('./kanban-board').then(m => m.KanbanBoard),
  { ssr: false, loading: () => <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Cargando pipeline...</div> }
)

export default function KanbanBoardWrapper(props: ComponentProps<typeof KanbanBoardType>) {
  return <KanbanBoard {...props} />
}
