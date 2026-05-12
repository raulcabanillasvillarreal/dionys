import { getPosCategories, getPosProducts } from '@/lib/actions/pos'
import { createAdminClient } from '@/lib/supabase/admin'
import { POSView } from '@/components/hotel/pos/pos-view'

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

export default async function POSPage() {
  const businessId = await getHotelId()
  const supabase = createAdminClient()

  const today = new Date().toISOString().split('T')[0]

  const [categories, products, { data: activeRooms }] = await Promise.all([
    getPosCategories(),
    getPosProducts(),
    supabase
      .from('reservations')
      .select('room_id, room:rooms(id, number)')
      .eq('business_id', businessId)
      .eq('status', 'confirmada')
      .lte('check_in', today)
      .gte('check_out', today),
  ])

  const rooms = (activeRooms ?? [])
    .map((r: { room_id: string; room: { id: string; number: string } | null }) => r.room)
    .filter(Boolean) as { id: string; number: string }[]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <POSView
        categories={Array.isArray(categories) ? categories : []}
        products={Array.isArray(products) ? products : []}
        activeRooms={rooms}
      />
    </div>
  )
}
