import { getEvents } from '@/lib/actions/agenda'
import AgendaView from '@/components/hotel/agenda/agenda-view'

export default async function AgendaPage() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

  const events = await getEvents(start, end)

  return <AgendaView initialEvents={Array.isArray(events) ? events : []} />
}
