'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import type { LeadSource, StageWithLeads, Lead, Task, Activity } from '@/types/hotel-crm'

async function getHotelId() {
  const supabase = createAdminClient()
  const { data } = await supabase.from('businesses').select('id').eq('slug', 'hotel').single()
  if (!data) throw new Error('Hotel not found')
  return data.id
}

const LEAD_SELECT = `
  id, stage_id, title, amount, check_in, check_out, source, tags, notes, position, created_at, updated_at,
  guest:guests(id, full_name, email, phone, document_number, nationality),
  room:rooms(id, number, type, price_per_night)
`

// ── Pipeline ────────────────────────────────────────────────────────────────

export async function getStagesWithLeads(): Promise<StageWithLeads[]> {
  const supabase = createAdminClient()
  const businessId = await getHotelId()

  const [{ data: stages }, { data: leads }] = await Promise.all([
    supabase
      .from('pipeline_stages')
      .select('*')
      .eq('business_id', businessId)
      .order('position'),
    supabase
      .from('leads')
      .select(LEAD_SELECT)
      .eq('business_id', businessId)
      .order('position'),
  ])

  return (stages ?? []).map(stage => ({
    id: stage.id,
    name: stage.name,
    color: stage.color,
    position: stage.position,
    is_won: stage.is_won ?? false,
    is_lost: stage.is_lost ?? false,
    leads: (leads ?? []).filter(l => l.stage_id === stage.id) as Lead[],
  }))
}

export async function createLead(formData: FormData) {
  const supabase = createAdminClient()
  const businessId = await getHotelId()

  const stageId = formData.get('stage_id') as string
  const guestName = (formData.get('guest_name') as string).trim()
  const email = (formData.get('email') as string) || null
  const phone = (formData.get('phone') as string) || null

  // Crear o buscar huésped
  let guestId: string | null = null
  if (guestName) {
    const { data: guest } = await supabase
      .from('guests')
      .insert({ business_id: businessId, full_name: guestName, email, phone })
      .select('id')
      .single()
    guestId = guest?.id ?? null
  }

  const checkIn = (formData.get('check_in') as string) || null
  const checkOut = (formData.get('check_out') as string) || null
  const roomId = (formData.get('room_id') as string) || null
  const amountStr = formData.get('amount') as string
  const amount = amountStr ? parseFloat(amountStr) : null

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      business_id: businessId,
      stage_id: stageId,
      guest_id: guestId,
      room_id: roomId || null,
      title: guestName || 'Nueva consulta',
      amount,
      check_in: checkIn,
      check_out: checkOut,
      source: (formData.get('source') as LeadSource) || 'otro',
      tags: [],
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  // Parse tags from form
  const tagsRaw = (formData.get('tags') as string) || ''
  const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
  if (tags.length) {
    await supabase.from('leads').update({ tags }).eq('id', lead.id)
  }

  await supabase.from('activities').insert({
    business_id: businessId,
    lead_id: lead.id,
    guest_id: guestId,
    type: 'sistema',
    content: 'Lead creado',
  })

  // Return full lead with joins so client can update state immediately (no page reload)
  const { data: fullLead } = await supabase
    .from('leads')
    .select(LEAD_SELECT)
    .eq('id', lead.id)
    .single()

  revalidatePath('/hotel')
  return { ok: true, lead: fullLead }
}

export async function moveLeadToStage(leadId: string, stageId: string, fromStageName?: string, toStageName?: string) {
  const supabase = createAdminClient()
  const businessId = await getHotelId()

  const { error } = await supabase
    .from('leads')
    .update({ stage_id: stageId })
    .eq('id', leadId)

  if (error) return { error: error.message }

  if (fromStageName && toStageName) {
    await supabase.from('activities').insert({
      business_id: businessId,
      lead_id: leadId,
      type: 'cambio_etapa',
      content: `Movido de "${fromStageName}" a "${toStageName}"`,
    })
  }

  revalidatePath('/hotel')
  return { ok: true }
}

export async function updateLead(leadId: string, data: Partial<{
  title: string
  amount: number | null
  check_in: string | null
  check_out: string | null
  room_id: string | null
  source: LeadSource
  tags: string[]
  notes: string | null
}>) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('leads').update(data).eq('id', leadId)
  if (error) return { error: error.message }
  revalidatePath('/hotel')
  return { ok: true }
}

export async function deleteLead(leadId: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('leads').delete().eq('id', leadId)
  if (error) return { error: error.message }
  revalidatePath('/hotel')
  return { ok: true }
}

// ── Contacts ─────────────────────────────────────────────────────────────────

export async function getContacts() {
  const supabase = createAdminClient()
  const businessId = await getHotelId()

  const { data, error } = await supabase
    .from('guests')
    .select('*, leads(id, stage_id, amount, created_at)')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function getTasks(filter?: 'pending' | 'completed') {
  const supabase = createAdminClient()
  const businessId = await getHotelId()

  let query = supabase
    .from('tasks')
    .select('*, lead:leads(title, stage_id), guest:guests(full_name)')
    .eq('business_id', businessId)
    .order('due_at', { ascending: true, nullsFirst: false })

  if (filter === 'pending') query = query.eq('completed', false)
  if (filter === 'completed') query = query.eq('completed', true)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Task[]
}

export async function createTask(formData: FormData) {
  const supabase = createAdminClient()
  const businessId = await getHotelId()

  const { error } = await supabase.from('tasks').insert({
    business_id: businessId,
    lead_id: (formData.get('lead_id') as string) || null,
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    due_at: (formData.get('due_at') as string) || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/hotel/tareas')
  return { ok: true }
}

export async function toggleTask(id: string, completed: boolean) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('tasks')
    .update({ completed, completed_at: completed ? new Date().toISOString() : null })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/hotel/tareas')
  return { ok: true }
}

// ── Activities ────────────────────────────────────────────────────────────────

export async function getActivities(leadId: string): Promise<Activity[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Activity[]
}

export async function addNote(leadId: string, content: string) {
  const supabase = createAdminClient()
  const businessId = await getHotelId()

  const { error } = await supabase.from('activities').insert({
    business_id: businessId,
    lead_id: leadId,
    type: 'nota',
    content,
  })

  if (error) return { error: error.message }
  return { ok: true }
}

// ── Reports ───────────────────────────────────────────────────────────────────

export async function getReportData() {
  const supabase = createAdminClient()
  const businessId = await getHotelId()

  const [stages, leads] = await Promise.all([
    supabase.from('pipeline_stages').select('id, name, color').eq('business_id', businessId).order('position'),
    supabase.from('leads').select('stage_id, amount, created_at, check_in').eq('business_id', businessId),
  ])

  const stagesData = stages.data ?? []
  const leadsData = leads.data ?? []

  // Leads by stage
  const byStage = stagesData.map(s => ({
    name: s.name,
    color: s.color,
    count: leadsData.filter(l => l.stage_id === s.id).length,
    amount: leadsData.filter(l => l.stage_id === s.id).reduce((sum, l) => sum + (l.amount ?? 0), 0),
  }))

  // Revenue by month (last 6 months)
  const now = new Date()
  const byMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const month = d.toLocaleString('es-PE', { month: 'short', year: '2-digit' })
    const monthLeads = leadsData.filter(l => {
      if (!l.created_at) return false
      const ld = new Date(l.created_at)
      return ld.getMonth() === d.getMonth() && ld.getFullYear() === d.getFullYear()
    })
    return {
      month,
      leads: monthLeads.length,
      revenue: monthLeads.reduce((sum, l) => sum + (l.amount ?? 0), 0),
    }
  })

  return { byStage, byMonth, total: leadsData.length, totalRevenue: leadsData.reduce((s, l) => s + (l.amount ?? 0), 0) }
}
