'use server'

import { createAdminClient } from '@/lib/supabase/admin'

// New tables and columns (cash_movements, pos_orders, pos_order_items,
// folio_total) are not yet in generated types/supabase.ts —
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

export async function getKPIs() {
  const supabase = db()
  const businessId = await getHotelId()
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0]
  const monthStart = today.slice(0, 7) + '-01'

  const [roomsRes, activeRes, ingresoHoyRes, ingresoMesRes, proximasSalidasRes, deudasRes] =
    await Promise.all([
      supabase
        .from('rooms')
        .select('id, status')
        .eq('business_id', businessId),

      supabase
        .from('reservations')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('status', 'confirmada')
        .lte('check_in', today)
        .gte('check_out', today),

      supabase
        .from('cash_movements')
        .select('amount')
        .eq('business_id', businessId)
        .eq('type', 'ingreso')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`),

      supabase
        .from('cash_movements')
        .select('amount')
        .eq('business_id', businessId)
        .eq('type', 'ingreso')
        .gte('created_at', `${monthStart}T00:00:00`),

      supabase
        .from('reservations')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('check_out', tomorrow)
        .eq('status', 'confirmada'),

      supabase
        .from('reservations')
        .select('folio_total')
        .eq('business_id', businessId)
        .eq('status', 'confirmada')
        .gt('folio_total', 0),
    ])

  const rooms: { id: string; status: string }[] = roomsRes.data ?? []
  const totalRooms = rooms.length
  const habitaciones_disponibles = rooms.filter(r => r.status === 'disponible').length
  const huespedes_activos: number = activeRes.count ?? 0
  const ocupacionPct =
    totalRooms > 0 ? Math.round((huespedes_activos / totalRooms) * 100) : 0

  const ingresoHoy: number = (ingresoHoyRes.data ?? []).reduce(
    (sum: number, m: { amount: number }) => sum + (m.amount ?? 0),
    0
  )
  const ingresoMes: number = (ingresoMesRes.data ?? []).reduce(
    (sum: number, m: { amount: number }) => sum + (m.amount ?? 0),
    0
  )

  const proximas_salidas: number = proximasSalidasRes.count ?? 0

  const deudas_pendientes: number = (deudasRes.data ?? []).reduce(
    (sum: number, r: { folio_total: number }) => sum + (r.folio_total ?? 0),
    0
  )

  return {
    ocupacionPct,
    ingresoHoy,
    ingresoMes,
    huespedes_activos,
    proximas_salidas,
    deudas_pendientes,
    habitaciones_disponibles,
  }
}

export async function getOcupacionPorPeriodo(days: number) {
  const supabase = db()
  const businessId = await getHotelId()

  const { data: rooms } = await supabase
    .from('rooms')
    .select('id')
    .eq('business_id', businessId)

  const totalRooms: number = rooms?.length ?? 1

  const dates: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    dates.push(new Date(Date.now() - i * 86_400_000).toISOString().split('T')[0])
  }

  const startDate = dates[0]
  const endDate = dates[dates.length - 1]

  const { data: reservations } = await supabase
    .from('reservations')
    .select('check_in, check_out')
    .eq('business_id', businessId)
    .in('status', ['confirmada', 'completada'])
    .lte('check_in', endDate)
    .gte('check_out', startDate)

  return dates.map(date => {
    const ocupadas: number = (reservations ?? []).filter(
      (r: { check_in: string; check_out: string }) =>
        r.check_in <= date && r.check_out >= date
    ).length

    return {
      date,
      ocupadas,
      disponibles: Math.max(0, totalRooms - ocupadas),
    }
  })
}

export async function getIngresosPorCanal() {
  const supabase = db()
  const businessId = await getHotelId()

  const [movementsRes, reservationsRes] = await Promise.all([
    supabase
      .from('cash_movements')
      .select('category, amount')
      .eq('business_id', businessId)
      .eq('type', 'ingreso'),

    // Include reservations from pipeline (all non-cancelled) by booking channel
    supabase
      .from('reservations')
      .select('booking_channel, total_amount')
      .eq('business_id', businessId)
      .in('status', ['confirmada', 'pendiente', 'completada'])
      .not('total_amount', 'is', null),
  ])

  const channelMap = new Map<string, number>()

  // Cash movements grouped by category
  for (const m of movementsRes.data ?? []) {
    const channel: string = (m.category as string) || 'Caja'
    channelMap.set(channel, (channelMap.get(channel) ?? 0) + ((m.amount as number) ?? 0))
  }

  // Reservations (pipeline + direct) grouped by booking channel
  for (const r of reservationsRes.data ?? []) {
    const channel: string = (r.booking_channel as string) || 'Directo'
    const label = channel.charAt(0).toUpperCase() + channel.slice(1)
    channelMap.set(label, (channelMap.get(label) ?? 0) + ((r.total_amount as number) ?? 0))
  }

  return Array.from(channelMap.entries())
    .map(([channel, total]) => ({ channel, total }))
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total)
}

export async function getCashFlowSemanal() {
  const supabase = db()
  const businessId = await getHotelId()

  const dates: string[] = []
  for (let i = 6; i >= 0; i--) {
    dates.push(new Date(Date.now() - i * 86_400_000).toISOString().split('T')[0])
  }

  const startDate = dates[0]
  const endDate = dates[dates.length - 1]

  const { data: movements, error } = await supabase
    .from('cash_movements')
    .select('type, amount, created_at')
    .eq('business_id', businessId)
    .gte('created_at', `${startDate}T00:00:00`)
    .lte('created_at', `${endDate}T23:59:59`)

  if (error) return { error: error.message }

  return dates.map(date => {
    const dayMovements = (movements ?? []).filter(
      (m: { created_at: string }) => (m.created_at as string)?.startsWith(date)
    )
    const ingresos: number = dayMovements
      .filter((m: { type: string }) => m.type === 'ingreso')
      .reduce((sum: number, m: { amount: number }) => sum + (m.amount ?? 0), 0)
    const egresos: number = dayMovements
      .filter((m: { type: string }) => m.type === 'egreso')
      .reduce((sum: number, m: { amount: number }) => sum + (m.amount ?? 0), 0)

    return { date, ingresos, egresos }
  })
}

export async function getProductosTopVentas(limit = 10) {
  const supabase = db()
  const businessId = await getHotelId()

  const { data: orders } = await supabase
    .from('pos_orders')
    .select('id')
    .eq('business_id', businessId)
    .neq('status', 'cancelled')

  if (!orders?.length) return []

  const orderIds: string[] = (orders as { id: string }[]).map(o => o.id)

  const { data: items, error } = await supabase
    .from('pos_order_items')
    .select('product_id, product_name, quantity')
    .in('order_id', orderIds)

  if (error) return { error: error.message }

  const productMap = new Map<string, { product_name: string; total_quantity: number }>()
  for (const item of items ?? []) {
    const key: string = item.product_id
    const existing = productMap.get(key)
    if (existing) {
      existing.total_quantity += (item.quantity as number) ?? 0
    } else {
      productMap.set(key, {
        product_name: item.product_name as string,
        total_quantity: (item.quantity as number) ?? 0,
      })
    }
  }

  return Array.from(productMap.values())
    .sort((a, b) => b.total_quantity - a.total_quantity)
    .slice(0, limit)
}
