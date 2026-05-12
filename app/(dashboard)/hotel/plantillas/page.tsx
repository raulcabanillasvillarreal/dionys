import { getTemplates } from '@/lib/actions/whatsapp'
import { TemplatesView } from '@/components/hotel/templates/templates-view'

export default async function PlantillasPage() {
  const templates = await getTemplates()
  return <TemplatesView initialTemplates={templates as any} />
}
