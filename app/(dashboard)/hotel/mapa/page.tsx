import { getRoomsWithStatus } from '@/lib/actions/mapa'
import { RoomMap } from '@/components/hotel/mapa/room-map'

export default async function MapaPage() {
  const rooms = await getRoomsWithStatus()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <RoomMap initialRooms={Array.isArray(rooms) ? rooms : []} />
    </div>
  )
}
