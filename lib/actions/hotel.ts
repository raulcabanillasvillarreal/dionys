'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyReservaCreada, notifyCheckOutCompletado } from '@/lib/services/n8n'
import { sendReservaConfirmacion } from '@/lib/services/email'
import type { RoomInsert, GuestInsert, ReservationInsert, RoomStatus, ReservationStatus } from '@/types/hotel'

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

export async function getHotelStats() {
  const supabase = createAdminClient()
  const businessId = await getHotelId()
  const today = new Date().toISOString().split('T')[0]
  const monthStart = today.slice(0, 7) + '-01'

  const [roomsRes, activeRes, revenueRes] = await Promise.all([
    supabase.from('rooms').select('status').eq('business_id', businessId),
    supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('status', 'confirmada')
      .lte('check_in', today)
      .gte('check_out', today),
    supabase
      .from('reservations')
      .select('total_amount')
      .eq('business_id', businessId)
      .eq('status', 'completada')
      .gte('check_out', monthStart),
  ])

  const rooms = roomsRes.data ?? []
  return {
    totalRooms: rooms.length,
    disponibles: rooms.filter(r => r.status === 'disponible').length,
    ocupadas: rooms.filter(r => r.status === 'ocupada').length,
    activeReservations: activeRes.count ?? 0,
    monthRevenue: (revenueRes.data ?? []).reduce((s, r) => s + (r.total_amount ?? 0), 0),
  }
}

// ── Rooms ────────────────────────────────────────────────────────────────────

export async function getRooms() {
  const supabase = createAdminClient()
  const businessId = await getHotelId()
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('business_id', businessId)
    .order('number')
  if (error) throw error
  return data
}

export async function getAvailableRooms() {
  const supabase = createAdminClient()
  const businessId = await getHotelId()
  const { data, error } = await supabase
    .from('rooms')
    .select('id, number, type, price_per_night')
    .eq('business_id', businessId)
    .eq('status', 'disponible')
    .order('number')
  if (error) throw error
  return data ?? []
}

export async function upsertRoom(formData: FormData) {
  const supabase = createAdminClient()
  const businessId = await getHotelId()
  const id = formData.get('id') as string | null

  const room: RoomInsert = {
    business_id: businessId,
    number: (formData.get('number') as string).trim(),
    type: formData.get('type') as string,
    capacity: parseInt(formData.get('capacity') as string, 10),
    price_per_night: parseFloat(formData.get('price_per_night') as string),
    status: (formData.get('status') as RoomStatus) ?? 'disponible',
  }

  const { error } = id
    ? await supabase.from('rooms').update(room).eq('id', id)
    : await supabase.from('rooms').insert(room)

  if (error) return { error: error.message }
  revalidatePath('/hotel/habitaciones')
  revalidatePath('/hotel')
  return { ok: true }
}

export async function deleteRoom(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('rooms').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/hotel/habitaciones')
  revalidatePath('/hotel')
  return { ok: true }
}

// ── Reservations ─────────────────────────────────────────────────────────────

export async function getReservations() {
  const supabase = createAdminClient()
  const businessId = await getHotelId()
  const { data, error } = await supabase
    .from('reservations')
    .select('*, guest:guests(full_name, email, phone), room:rooms(number, type, price_per_night)')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data
}

export async function createReservation(formData: FormData) {
  const supabase = createAdminClient()
  const businessId = await getHotelId()

  const guest: GuestInsert = {
    business_id: businessId,
    full_name: (formData.get('guest_name') as string).trim(),
    email: (formData.get('guest_email') as string) || null,
    phone: (formData.get('guest_phone') as string) || null,
    document_type: (formData.get('document_type') as string) || null,
    document_number: (formData.get('document_number') as string) || null,
  }

  const { data: newGuest, error: guestErr } = await supabase
    .from('guests')
    .insert(guest)
    .select('id')
    .single()
  if (guestErr) return { error: guestErr.message }

  const checkIn = formData.get('check_in') as string
  const checkOut = formData.get('check_out') as string
  const roomId = formData.get('room_id') as string
  const pricePerNight = parseFloat(formData.get('price_per_night') as string)
  const nights = Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000
  )

  const reservation: ReservationInsert = {
    business_id: businessId,
    guest_id: newGuest.id,
    room_id: roomId,
    check_in: checkIn,
    check_out: checkOut,
    status: 'confirmada',
    total_amount: pricePerNight * nights,
    notes: (formData.get('notes') as string) || null,
  }

  const { data: newRes, error: resErr } = await supabase
    .from('reservations')
    .insert(reservation)
    .select('id')
    .single()
  if (resErr) return { error: resErr.message }

  // Get room info for downstream use
  const { data: room } = await supabase
    .from('rooms')
    .select('number, type')
    .eq('id', roomId)
    .single()

  await supabase.from('rooms').update({ status: 'reservada' }).eq('id', roomId)

  // Auto-create lead in CRM pipeline
  const { data: firstStage } = await supabase
    .from('pipeline_stages')
    .select('id')
    .eq('business_id', businessId)
    .order('position')
    .limit(1)
    .single()

  if (firstStage) {
    const { data: lead } = await supabase
      .from('leads')
      .insert({
        business_id: businessId,
        stage_id: firstStage.id,
        guest_id: newGuest.id,
        title: `Reserva — ${guest.full_name}`,
        amount: pricePerNight * nights,
        check_in: checkIn,
        check_out: checkOut,
        source: 'web' as any,
        tags: ['Reserva Web'],
      })
      .select('id')
      .single()

    // Create inbox conversation linked to this reservation
    if (lead && newRes) {
      await (supabase as any).from('wa_conversations').upsert(
        {
          business_id: businessId,
          phone: guest.phone ?? `email:${guest.email ?? newGuest.id}`,
          contact_name: guest.full_name,
          channel: 'email',
          lead_id: lead.id,
          reservation_id: newRes.id,
          last_message: `Reserva confirmada — Hab. ${room?.number} · ${checkIn} → ${checkOut}`,
          last_message_at: new Date().toISOString(),
          status: 'open',
          tags: ['Reserva'],
        },
        { onConflict: 'business_id,phone', ignoreDuplicates: false },
      )
    }
  }

  const payload = {
    id: newRes?.id,
    guest_name: guest.full_name,
    guest_email: guest.email,
    guest_phone: guest.phone,
    room_number: room?.number,
    room_type: room?.type,
    check_in: checkIn,
    check_out: checkOut,
    total_amount: pricePerNight * nights,
    notes: reservation.notes,
  }

  // Fire-and-forget: n8n + email (don't block the response)
  Promise.all([
    notifyReservaCreada(payload),
    guest.email
      ? sendReservaConfirmacion(guest.email, {
          guest_name: guest.full_name,
          room_number: room?.number ?? '',
          room_type: room?.type ?? '',
          check_in: checkIn,
          check_out: checkOut,
          total_amount: pricePerNight * nights,
          nights,
        })
      : Promise.resolve(null),
  ]).catch(err => console.error('[createReservation] notification error:', err))

  revalidatePath('/hotel/reservas')
  revalidatePath('/hotel/habitaciones')
  revalidatePath('/hotel/inbox')
  revalidatePath('/hotel')
  return { ok: true }
}

export async function updateReservationStatus(id: string, status: ReservationStatus) {
  const supabase = createAdminClient()
  const { data: res } = await supabase
    .from('reservations')
    .select('room_id, status, check_out, guest:guests(full_name, email, phone), room:rooms(number)')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('reservations')
    .update({ status })
    .eq('id', id)
  if (error) return { error: error.message }

  if (res?.room_id) {
    const roomStatus =
      status === 'confirmada' ? 'reservada'
      : status === 'cancelada' ? 'disponible'
      : status === 'completada' ? 'disponible'
      : undefined
    if (roomStatus) {
      await supabase.from('rooms').update({ status: roomStatus }).eq('id', res.room_id)
    }
  }

  if (status === 'completada' && res) {
    const guest = res.guest as { full_name: string; email: string | null; phone: string | null } | null
    const room = res.room as { number: string } | null
    if (guest) {
      notifyCheckOutCompletado({
        id,
        full_name: guest.full_name,
        email: guest.email,
        phone: guest.phone,
        room_number: room?.number,
        check_out: res.check_out,
      }).catch(() => {})
    }
  }

  revalidatePath('/hotel/reservas')
  revalidatePath('/hotel/habitaciones')
  revalidatePath('/hotel')
  return { ok: true }
}
