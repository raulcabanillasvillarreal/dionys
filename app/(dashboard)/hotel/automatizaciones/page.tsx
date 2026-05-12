import { getAutomations } from '@/lib/actions/whatsapp'
import { AutomationsView } from '@/components/hotel/automations/automations-view'

export default async function AutomatizacionesPage() {
  const automations = await getAutomations()
  return <AutomationsView initialAutomations={automations as any} />
}
