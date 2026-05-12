import { getReservations, getAvailableRooms } from '@/lib/actions/hotel'
import { ReservationsTable } from '@/components/hotel/reservations-table'
import type { ReservationWithDetails } from '@/types/hotel'

export default async function ReservasPage() {
  const [reservations, availableRooms] = await Promise.all([
    getReservations(),
    getAvailableRooms(),
  ])

  return (
    <ReservationsTable
      reservations={reservations as ReservationWithDetails[]}
      availableRooms={availableRooms}
    />
  )
}
