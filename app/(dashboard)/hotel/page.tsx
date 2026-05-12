import { getStagesWithLeads } from '@/lib/actions/hotel-crm'
import { getAvailableRooms } from '@/lib/actions/hotel'
import { getTemplates } from '@/lib/actions/whatsapp'
import KanbanBoardWrapper from '@/components/hotel/crm/kanban-board-wrapper'

export default async function HotelPipelinePage() {
  const [stages, availableRooms, templates] = await Promise.all([
    getStagesWithLeads(),
    getAvailableRooms(),
    getTemplates(),
  ])

  return (
    <div className="h-full flex flex-col p-4">
      <KanbanBoardWrapper
        initialStages={stages}
        availableRooms={availableRooms}
        templates={templates as any}
      />
    </div>
  )
}
