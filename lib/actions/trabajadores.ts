'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

// New tables (workers, attendance, worker_advances) are not yet in generated
// types/supabase.ts — cast to `any` until types are regenerated.
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

export async function getWorkers() {
  const supabase = db()
  const businessId = await getHotelId()

  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .eq('business_id', businessId)
    .order('full_name')

  if (error) return { error: error.message }
  return data ?? []
}

export async function upsertWorker(formData: FormData) {
  const supabase = db()
  const businessId = await getHotelId()
  const id = formData.get('id') as string | null

  const worker = {
    business_id: businessId,
    full_name: (formData.get('full_name') as string).trim(),
    role: formData.get('role') as string,
    shift: formData.get('shift') as string,
    phone: (formData.get('phone') as string) || null,
    email: (formData.get('email') as string) || null,
    active: formData.get('active') !== 'false',
    salary: formData.get('salary') ? parseFloat(formData.get('salary') as string) : null,
  }

  const { error } = id
    ? await supabase.from('workers').update(worker).eq('id', id)
    : await supabase.from('workers').insert(worker)

  if (error) return { error: error.message }
  revalidatePath('/hotel/trabajadores')
  return { ok: true }
}

export async function deleteWorker(id: string) {
  const supabase = db()

  const { error } = await supabase.from('workers').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/hotel/trabajadores')
  return { ok: true }
}

export async function getAttendance(date?: string) {
  const supabase = db()
  const businessId = await getHotelId()
  const targetDate = date ?? new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('attendance')
    .select('*, worker:workers(full_name, role, shift)')
    .eq('business_id', businessId)
    .eq('date', targetDate)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return data ?? []
}

export async function registerAttendance(workerId: string, type: 'check_in' | 'check_out') {
  const supabase = db()
  const businessId = await getHotelId()
  const today = new Date().toISOString().split('T')[0]
  const now = new Date().toISOString()

  const { data: existing } = await supabase
    .from('attendance')
    .select('id, check_in, check_out')
    .eq('worker_id', workerId)
    .eq('date', today)
    .maybeSingle()

  if (existing) {
    const updateData =
      type === 'check_in'
        ? { check_in: now, status: 'present' }
        : { check_out: now }

    const { error } = await supabase
      .from('attendance')
      .update(updateData)
      .eq('id', existing.id)

    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('attendance').insert({
      worker_id: workerId,
      business_id: businessId,
      date: today,
      check_in: type === 'check_in' ? now : null,
      check_out: type === 'check_out' ? now : null,
      status: 'present',
    })
    if (error) return { error: error.message }
  }

  revalidatePath('/hotel/trabajadores')
  return { ok: true }
}

export async function addAdvance(workerId: string, amount: number, description: string) {
  const supabase = db()
  const businessId = await getHotelId()

  const { error } = await supabase.from('worker_advances').insert({
    worker_id: workerId,
    business_id: businessId,
    amount,
    description,
    date: new Date().toISOString().split('T')[0],
  })

  if (error) return { error: error.message }
  revalidatePath('/hotel/trabajadores')
  return { ok: true }
}

export async function getWorkerStats(workerId: string) {
  const supabase = db()
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split('T')[0]
  const monthEnd = today.toISOString().split('T')[0]

  const [attendanceRes, advancesRes] = await Promise.all([
    supabase
      .from('attendance')
      .select('check_in, check_out, status')
      .eq('worker_id', workerId)
      .gte('date', monthStart)
      .lte('date', monthEnd),
    supabase
      .from('worker_advances')
      .select('amount')
      .eq('worker_id', workerId)
      .gte('date', monthStart)
      .lte('date', monthEnd),
  ])

  const attendance: { check_in: string | null; check_out: string | null; status: string }[] =
    attendanceRes.data ?? []
  const advances: { amount: number }[] = advancesRes.data ?? []

  let totalHoursThisMonth = 0
  for (const record of attendance) {
    if (record.check_in && record.check_out) {
      const ms = new Date(record.check_out).getTime() - new Date(record.check_in).getTime()
      totalHoursThisMonth += ms / 3_600_000
    }
  }

  const totalAdvancesThisMonth = advances.reduce((sum, a) => sum + (a.amount ?? 0), 0)

  const presentDays = attendance.filter(
    a => a.status === 'present' || a.status === 'late'
  ).length
  const attendanceRate =
    attendance.length > 0 ? Math.round((presentDays / attendance.length) * 100) : 0

  return {
    totalHoursThisMonth: Math.round(totalHoursThisMonth * 10) / 10,
    totalAdvancesThisMonth,
    attendanceRate,
  }
}
