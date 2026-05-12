import { getRooms } from '@/lib/actions/hotel'
import { RoomsTable } from '@/components/hotel/rooms-table'

export default async function HabitacionesPage() {
  const rooms = await getRooms()
  return <RoomsTable rooms={rooms} />
}
