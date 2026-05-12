import { createAdminClient } from '@/lib/supabase/admin'
import { PlanningView } from '@/components/hotel/planning/planning-view'

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

export default async function PlanningPage() {
  const businessId = await getHotelId()
  const supabase = createAdminClient()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().split('T')[0]

  const [{ data: rooms }, { data: reservations }] = await Promise.all([
    supabase
      .from('rooms')
      .select('id, number, type')
      .eq('business_id', businessId)
      .order('number'),
    supabase
      .from('reservations')
      .select('id, room_id, check_in, check_out, status, total_amount, booking_channel:rooms(booking_channel), guest:guests(full_name)')
      .eq('business_id', businessId)
      .neq('status', 'cancelada')
      .lte('check_in', monthEnd)
      .gte('check_out', monthStart),
  ])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PlanningView
        rooms={(rooms ?? []) as { id: string; number: string; type: string }[]}
        reservations={(reservations ?? []) as unknown as PlanningReservation[]}
      />
    </div>
  )
}

// Type export for use in client component
export interface PlanningReservation {
  id: string
  room_id: string
  check_in: string
  check_out: string
  status: string
  total_amount: number | null
  booking_channel: string | null
  guest: { full_name: string } | null
}
