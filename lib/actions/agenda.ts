'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

// New table (calendar_events) is not yet in generated types/supabase.ts —
// cast to `any` until types are regenerated.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => createAdminClient() as any

async function getHotelId(): Promise<string> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('businesses')
    .select('id')
    .eq('slug', 'hotel')
    .single()
  if (error || !data) throw new Error('Hotel business not found')
  return data.id
}

export async function getEvents(start: string, end: string) {
  const supabase = db()
  const businessId = await getHotelId()

  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('business_id', businessId)
    .or(`start_at.lte.${end},end_at.gte.${start}`)
    .order('start_at')

  if (error) return { error: error.message }
  return data ?? []
}

export async function createEvent(formData: FormData) {
  const supabase = db()
  const businessId = await getHotelId()

  const allDay = formData.get('all_day') === 'true'

  const { error } = await supabase.from('calendar_events').insert({
    business_id: businessId,
    title: (formData.get('title') as string).trim(),
    description: (formData.get('description') as string) || null,
    type: (formData.get('type') as string) || 'otro',
    start_at: formData.get('start_at') as string,
    end_at: (formData.get('end_at') as string) || null,
    all_day: allDay,
    color: (formData.get('color') as string) || null,
    location: (formData.get('location') as string) || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/hotel/agenda')
  return { ok: true }
}

export async function updateEvent(
  id: string,
  data: {
    title?: string
    description?: string | null
    type?: string
    start_at?: string
    end_at?: string | null
    all_day?: boolean
    color?: string | null
    location?: string | null
  }
) {
  const supabase = db()

  const { error } = await supabase
    .from('calendar_events')
    .update(data)
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/hotel/agenda')
  return { ok: true }
}

export async function deleteEvent(id: string) {
  const supabase = db()

  const { error } = await supabase.from('calendar_events').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/hotel/agenda')
  return { ok: true }
}
