import { createAdminClient } from '@/lib/supabase/admin'

const BASE = process.env.N8N_BASE_URL ?? 'http://localhost:5678/webhook'

async function post(path: string, body: object): Promise<unknown> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET ?? '',
      },
      body: JSON.stringify({ ...body, timestamp: new Date().toISOString() }),
      signal: AbortSignal.timeout(8_000),
    })
    return res.ok ? res.json().catch(() => null) : null
  } catch (err) {
    console.warn('[n8n]', path, err instanceof Error ? err.message : err)
    return null
  }
}

export interface ReservaPayload {
  id?: string
  guest_name: string
  guest_email?: string | null
  guest_phone?: string | null
  room_number?: string
  room_type?: string
  check_in: string
  check_out: string
  total_amount?: number
  notes?: string | null
}

export interface HuespedPayload {
  id?: string
  full_name: string
  email?: string | null
  phone?: string | null
  room_number?: string
  check_out: string
}

/** Dispara cuando se crea una nueva reserva */
export async function notifyReservaCreada(reserva: ReservaPayload) {
  return post('/reserva-creada', { event: 'reserva_creada', data: reserva })
}

/**
 * Busca reservas con check-in mañana y las envía a n8n.
 * Llamada por el cron diario a las 8am.
 */
export async function notifyCheckInManana() {
  const supabase = createAdminClient()
  const manana = new Date()
  manana.setDate(manana.getDate() + 1)
  const fecha = manana.toISOString().split('T')[0]

  const { data: reservas } = await supabase
    .from('reservations')
    .select('id, check_in, check_out, total_amount, notes, guest:guests(full_name, email, phone), room:rooms(number, type)')
    .eq('check_in', fecha)
    .eq('status', 'confirmada')

  if (!reservas?.length) return null
  return post('/check-in-manana', { event: 'check_in_manana', fecha, reservas })
}

/** Dispara cuando el estado de una reserva cambia a "completada" */
export async function notifyCheckOutCompletado(huesped: HuespedPayload) {
  return post('/check-out-completado', { event: 'check_out_completado', data: huesped })
}
