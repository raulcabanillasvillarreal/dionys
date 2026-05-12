import { getStagesWithLeads } from '@/lib/actions/hotel-crm'
import { getAvailableRooms } from '@/lib/actions/hotel'
import { getTemplates } from '@/lib/actions/whatsapp'
import dynamic from 'next/dynamic'

// SSR desactivado: @dnd-kit genera aria-describedby distintos en servidor vs cliente
const KanbanBoard = dynamic(
  () => import('@/components/hotel/crm/kanban-board').then(m => m.KanbanBoard),
  { ssr: false }
)

export default async function HotelPipelinePage() {
  const [stages, availableRooms, templates] = await Promise.all([
    getStagesWithLeads(),
    getAvailableRooms(),
    getTemplates(),
  ])

  return (
    <div className="h-full flex flex-col p-4">
      <KanbanBoard
        initialStages={stages}
        availableRooms={availableRooms}
        templates={templates as any}
      />
    </div>
  )
}
