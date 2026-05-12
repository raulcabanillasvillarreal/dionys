'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyCheckOutCompletado } from '@/lib/services/n8n'

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

export async function getRoomsWithStatus() {
  const supabase = db()
  const businessId = await getHotelId()
  const today = new Date().toISOString().split('T')[0]

  const { data: rooms, error } = await supabase
    .from('rooms')
    .select('id, number, type, category, status, dirty_status, booking_channel, price_per_night, capacity, checklist')
    .eq('business_id', businessId)
    .order('number')

  if (error) return { error: error.message }

  const { data: activeReservations } = await supabase
    .from('reservations')
    .select('id, room_id, check_in, check_out, status, folio_total, guest:guests(id, full_name, phone, email)')
    .eq('business_id', businessId)
    .eq('status', 'confirmada')
    .lte('check_in', today)
    .gte('check_out', today)

  const reservationsByRoom = new Map(
    (activeReservations ?? []).map((r: { room_id: string }) => [r.room_id, r])
  )

  return (rooms ?? []).map((room: { id: string }) => ({
    ...room,
    is_occupied: reservationsByRoom.has(room.id),
    active_reservation: reservationsByRoom.get(room.id) ?? null,
  }))
}

export async function updateRoomDirtyStatus(
  roomId: string,
  status: 'clean' | 'dirty' | 'cleaning' | 'maintenance'
) {
  const supabase = db()
  const { error } = await supabase
    .from('rooms')
    .update({ dirty_status: status })
    .eq('id', roomId)

  if (error) return { error: error.message }
  revalidatePath('/hotel/mapa')
  return { ok: true }
}

export async function updateRoomCategory(roomId: string, category: string) {
  const supabase = db()
  const { error } = await supabase
    .from('rooms')
    .update({ category, checklist: {} })
    .eq('id', roomId)

  if (error) return { error: error.message }
  revalidatePath('/hotel/mapa')
  return { ok: true }
}

export async function updateRoomChecklist(roomId: string, checklist: Record<string, boolean>) {
  const supabase = db()
  const { error } = await supabase
    .from('rooms')
    .update({ checklist })
    .eq('id', roomId)

  if (error) return { error: error.message }
  revalidatePath('/hotel/mapa')
  return { ok: true }
}

export async function updateGuestNotes(
  guestId: string,
  preferences: string,
  internalNotes: string
) {
  const supabase = db()
  const { error } = await supabase
    .from('guests')
    .update({ preferences, internal_notes: internalNotes })
    .eq('id', guestId)

  if (error) return { error: error.message }
  return { ok: true }
}

export async function getActiveReservationForRoom(roomId: string) {
  const supabase = db()
  const today = new Date().toISOString().split('T')[0]

  const { data: reservation, error } = await supabase
    .from('reservations')
    .select('*, guest:guests(id, full_name, email, phone, document_type, document_number, preferences, internal_notes), room:rooms(number, type, category)')
    .eq('room_id', roomId)
    .eq('status', 'confirmada')
    .lte('check_in', today)
    .gte('check_out', today)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!reservation) return null

  const { data: charges } = await supabase
    .from('room_charges')
    .select('*')
    .eq('reservation_id', reservation.id)
    .order('created_at', { ascending: false })

  return { ...reservation, charges: charges ?? [] }
}

export async function getGuestHistory(guestId: string) {
  const supabase = db()

  const { data, error } = await supabase
    .from('reservations')
    .select('id, check_in, check_out, status, total_amount, folio_total, notes, room:rooms(number, category)')
    .eq('guest_id', guestId)
    .order('check_in', { ascending: false })
    .limit(20)

  if (error) return []
  return data ?? []
}

export async function addRoomCharge(
  reservationId: string,
  _businessId: string,
  description: string,
  amount: number,
  paymentMethod: string
) {
  const supabase = db()

  const { data: reservation, error: resError } = await supabase
    .from('reservations')
    .select('business_id, folio_total')
    .eq('id', reservationId)
    .single()

  if (resError || !reservation) return { error: resError?.message ?? 'Reserva no encontrada' }

  const { error: chargeError } = await supabase.from('room_charges').insert({
    reservation_id: reservationId,
    business_id: reservation.business_id,
    description,
    amount,
    payment_method: paymentMethod,
  })

  if (chargeError) return { error: chargeError.message }

  const { error: updateError } = await supabase
    .from('reservations')
    .update({ folio_total: (reservation.folio_total ?? 0) + amount })
    .eq('id', reservationId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/hotel/mapa')
  revalidatePath('/hotel/reservas')
  return { ok: true }
}

export async function checkInRoom(reservationId: string) {
  const supabase = db()

  const { data: reservation, error: fetchError } = await supabase
    .from('reservations')
    .select('room_id')
    .eq('id', reservationId)
    .single()

  if (fetchError || !reservation) {
    return { error: fetchError?.message ?? 'Reserva no encontrada' }
  }

  const { error: resError } = await supabase
    .from('reservations')
    .update({ status: 'confirmada' })
    .eq('id', reservationId)

  if (resError) return { error: resError.message }

  const { error: roomError } = await supabase
    .from('rooms')
    .update({ status: 'ocupada' })
    .eq('id', reservation.room_id)

  if (roomError) return { error: roomError.message }

  revalidatePath('/hotel/mapa')
  revalidatePath('/hotel/reservas')
  return { ok: true }
}

export async function checkOutRoom(reservationId: string) {
  const supabase = db()

  const { data: reservation, error: fetchError } = await supabase
    .from('reservations')
    .select('room_id, check_out, guest:guests(full_name, email, phone), room:rooms(number)')
    .eq('id', reservationId)
    .single()

  if (fetchError || !reservation) {
    return { error: fetchError?.message ?? 'Reserva no encontrada' }
  }

  const { error: resError } = await supabase
    .from('reservations')
    .update({ status: 'completada' })
    .eq('id', reservationId)

  if (resError) return { error: resError.message }

  const { error: roomError } = await supabase
    .from('rooms')
    .update({ status: 'disponible', dirty_status: 'dirty' })
    .eq('id', reservation.room_id)

  if (roomError) return { error: roomError.message }

  const guest = reservation.guest as { full_name: string; email?: string | null; phone?: string | null } | null
  const room = reservation.room as { number: string } | null

  if (guest) {
    notifyCheckOutCompletado({
      id: reservationId,
      full_name: guest.full_name,
      email: guest.email,
      phone: guest.phone,
      room_number: room?.number,
      check_out: reservation.check_out,
    }).catch((err: unknown) => console.error('[checkOutRoom] n8n notify error:', err))
  }

  revalidatePath('/hotel/mapa')
  revalidatePath('/hotel/reservas')
  revalidatePath('/hotel')
  return { ok: true }
}
