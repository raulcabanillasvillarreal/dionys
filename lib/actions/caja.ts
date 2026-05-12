'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

// New tables (cash_registers, cash_movements) are not yet in the generated
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

export async function getCajaActual() {
  const supabase = db()
  const businessId = await getHotelId()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('cash_registers')
    .select('*')
    .eq('business_id', businessId)
    .eq('status', 'open')
    .gte('opened_at', `${today}T00:00:00`)
    .lte('opened_at', `${today}T23:59:59`)
    .maybeSingle()

  if (error) return { error: error.message }
  return data
}

export async function abrirCaja(initialAmount: number) {
  const supabase = db()
  const businessId = await getHotelId()

  const { data, error } = await supabase
    .from('cash_registers')
    .insert({
      business_id: businessId,
      initial_amount: initialAmount,
      status: 'open',
      opened_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/hotel/caja')
  return { ok: true, id: data.id }
}

export async function cerrarCaja(registerId: string, closingAmount: number, notes?: string) {
  const supabase = db()

  const { error } = await supabase
    .from('cash_registers')
    .update({
      status: 'closed',
      closing_amount: closingAmount,
      closed_at: new Date().toISOString(),
      notes: notes ?? null,
    })
    .eq('id', registerId)

  if (error) return { error: error.message }
  revalidatePath('/hotel/caja')
  return { ok: true }
}

export async function getMovimientos(registerId: string) {
  const supabase = db()

  const { data, error } = await supabase
    .from('cash_movements')
    .select('*')
    .eq('register_id', registerId)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return data ?? []
}

export async function addMovimiento(data: {
  registerId: string
  type: 'ingreso' | 'egreso'
  category: string
  description: string
  amount: number
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia' | 'yape' | 'plin' | 'otro'
  reservationId?: string
  roomId?: string
}) {
  const supabase = db()
  const businessId = await getHotelId()

  const { error } = await supabase.from('cash_movements').insert({
    register_id: data.registerId,
    business_id: businessId,
    type: data.type,
    category: data.category,
    description: data.description,
    amount: data.amount,
    payment_method: data.paymentMethod,
    reservation_id: data.reservationId ?? null,
    room_id: data.roomId ?? null,
  })

  if (error) return { error: error.message }
  revalidatePath('/hotel/caja')
  return { ok: true }
}

export async function getBalanceCaja(registerId: string) {
  const supabase = db()

  const { data: register, error: regError } = await supabase
    .from('cash_registers')
    .select('initial_amount')
    .eq('id', registerId)
    .single()

  if (regError) return { error: regError.message }

  const { data: movements, error: movError } = await supabase
    .from('cash_movements')
    .select('type, amount')
    .eq('register_id', registerId)

  if (movError) return { error: movError.message }

  const ingresos = (movements ?? [])
    .filter((m: { type: string; amount: number }) => m.type === 'ingreso')
    .reduce((sum: number, m: { amount: number }) => sum + (m.amount ?? 0), 0)

  const egresos = (movements ?? [])
    .filter((m: { type: string; amount: number }) => m.type === 'egreso')
    .reduce((sum: number, m: { amount: number }) => sum + (m.amount ?? 0), 0)

  const initialAmount = register?.initial_amount ?? 0
  const saldo = initialAmount + ingresos - egresos

  return { ingresos, egresos, saldo, initial_amount: initialAmount }
}
