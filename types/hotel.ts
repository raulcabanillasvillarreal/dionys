import type { Database } from './supabase'

export type Room = Database['public']['Tables']['rooms']['Row']
export type RoomInsert = Database['public']['Tables']['rooms']['Insert']
export type RoomStatus = Database['public']['Enums']['room_status']

export type Guest = Database['public']['Tables']['guests']['Row']
export type GuestInsert = Database['public']['Tables']['guests']['Insert']

export type Reservation = Database['public']['Tables']['reservations']['Row']
export type ReservationInsert = Database['public']['Tables']['reservations']['Insert']
export type ReservationStatus = Database['public']['Enums']['reservation_status']

export type ReservationWithDetails = Reservation & {
  guest: Pick<Guest, 'full_name' | 'email' | 'phone'> | null
  room: Pick<Room, 'number' | 'type' | 'price_per_night'> | null
}

export type HotelStats = {
  totalRooms: number
  disponibles: number
  ocupadas: number
  activeReservations: number
  monthRevenue: number
}
