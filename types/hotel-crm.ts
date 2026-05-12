export type PipelineStage = {
  id: string
  name: string
  color: string
  position: number
  is_won: boolean
  is_lost: boolean
}

export type LeadSource = 'web' | 'telefono' | 'whatsapp' | 'email' | 'referido' | 'directo' | 'otro'
export type ActivityType = 'nota' | 'llamada' | 'email' | 'whatsapp' | 'cambio_etapa' | 'tarea' | 'sistema'

export type Lead = {
  id: string
  stage_id: string
  title: string
  amount: number | null
  check_in: string | null
  check_out: string | null
  source: LeadSource
  tags: string[]
  notes: string | null
  position: number
  created_at: string
  updated_at: string
  guest: {
    id: string
    full_name: string
    email: string | null
    phone: string | null
    document_number: string | null
    nationality: string | null
  } | null
  room: {
    id: string
    number: string
    type: string
    price_per_night: number
  } | null
}

export type StageWithLeads = PipelineStage & { leads: Lead[] }

export type Task = {
  id: string
  lead_id: string | null
  guest_id: string | null
  title: string
  description: string | null
  due_at: string | null
  completed: boolean
  completed_at: string | null
  created_at: string
  lead: { title: string; stage_id: string } | null
  guest: { full_name: string } | null
}

export type Activity = {
  id: string
  lead_id: string | null
  type: ActivityType
  content: string | null
  metadata: Record<string, unknown>
  created_at: string
}
