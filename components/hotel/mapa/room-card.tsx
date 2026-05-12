'use client'

import { cn } from '@/lib/utils'
import { Wrench, Sparkles, AlertCircle, Users } from 'lucide-react'

export type RoomStatus = 'available' | 'occupied' | 'dirty' | 'cleaning' | 'maintenance'

export interface RoomWithStatus {
  id: string
  number: string
  type: string
  category: string | null
  status: string
  dirty_status: string | null
  booking_channel: string | null
  price_per_night: number | null
  capacity: number | null
  checklist: Record<string, boolean> | null
  is_occupied: boolean
  active_reservation: {
    id: string
    room_id: string
    check_in: string
    check_out: string
    status: string
    folio_total: number | null
    guest: { id: string; full_name: string; phone: string | null; email: string | null } | null
  } | null
}

export const CATEGORY_CONFIG: Record<string, {
  label: string
  color: string
  bg: string
  border: string
  badge: string
  dot: string
  checklist: { key: string; label: string }[]
}> = {
  suite_romantica: {
    label: 'Suite Romántica',
    color: '#BE185D',
    bg: 'bg-pink-50',
    border: 'border-pink-400',
    badge: 'bg-pink-100 text-pink-700',
    dot: 'bg-pink-400',
    checklist: [
      { key: 'espejo_techo', label: 'Espejo en techo verificado' },
      { key: 'ambientacion', label: 'Ambientación especial lista' },
      { key: 'banera', label: 'Bañera limpia y lista' },
      { key: 'frigobar', label: 'Frigobar abastecido' },
      { key: 'decoracion', label: 'Velas y decoración colocadas' },
      { key: 'wifi', label: 'WiFi funcionando' },
      { key: 'agua_caliente', label: 'Agua caliente verificada' },
    ],
  },
  suite_queen: {
    label: 'Suite Queen',
    color: '#7C3AED',
    bg: 'bg-violet-50',
    border: 'border-violet-400',
    badge: 'bg-violet-100 text-violet-700',
    dot: 'bg-violet-400',
    checklist: [
      { key: 'cama_queen', label: 'Cama Queen tendida' },
      { key: 'banera', label: 'Bañera limpia y lista' },
      { key: 'frigobar', label: 'Frigobar abastecido' },
      { key: 'escritorio', label: 'Escritorio limpio' },
      { key: 'plancha', label: 'Plancha disponible' },
      { key: 'wifi', label: 'WiFi funcionando' },
      { key: 'agua_caliente', label: 'Agua caliente verificada' },
    ],
  },
  suite_doble: {
    label: 'Suite Doble',
    color: '#1a4e8a',
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
    checklist: [
      { key: 'camas', label: 'Camas tendidas' },
      { key: 'banera', label: 'Bañera limpia y lista' },
      { key: 'frigobar', label: 'Frigobar abastecido' },
      { key: 'escritorio', label: 'Escritorio limpio' },
      { key: 'wifi', label: 'WiFi funcionando' },
      { key: 'agua_caliente', label: 'Agua caliente verificada' },
    ],
  },
  ejecutiva: {
    label: 'Ejecutiva',
    color: '#0369A1',
    bg: 'bg-sky-50',
    border: 'border-sky-400',
    badge: 'bg-sky-100 text-sky-700',
    dot: 'bg-sky-400',
    checklist: [
      { key: 'wifi_velocidad', label: 'WiFi alta velocidad verificado' },
      { key: 'escritorio', label: 'Escritorio amplio despejado' },
      { key: 'menu_hab', label: 'Menú de servicio a la habitación' },
      { key: 'agua_caliente', label: 'Agua caliente verificada' },
    ],
  },
  familiar_doble: {
    label: 'Familiar Doble',
    color: '#B45309',
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-400',
    checklist: [
      { key: 'camas', label: 'Camas tendidas (2-3)' },
      { key: 'tv_cable', label: 'TV cable funcionando' },
      { key: 'comoda', label: 'Cómoda libre y limpia' },
      { key: 'wifi', label: 'WiFi funcionando' },
      { key: 'agua_caliente', label: 'Agua caliente verificada' },
    ],
  },
  familiar_triple: {
    label: 'Familiar Triple',
    color: '#047857',
    bg: 'bg-emerald-50',
    border: 'border-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-400',
    checklist: [
      { key: 'camas', label: 'Camas tendidas (3+)' },
      { key: 'tv_cable', label: 'TV cable funcionando' },
      { key: 'comoda', label: 'Cómoda libre y limpia' },
      { key: 'wifi', label: 'WiFi funcionando' },
      { key: 'agua_caliente', label: 'Agua caliente verificada' },
    ],
  },
  estandar: {
    label: 'Estándar',
    color: '#4B5563',
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    badge: 'bg-gray-100 text-gray-600',
    dot: 'bg-gray-400',
    checklist: [
      { key: 'cama', label: 'Cama tendida' },
      { key: 'wifi', label: 'WiFi funcionando' },
      { key: 'agua_caliente', label: 'Agua caliente verificada' },
    ],
  },
}

const STATUS_OVERLAY: Record<RoomStatus, { bar: string; icon: React.ReactNode; label: string } | null> = {
  available: null,
  occupied: null,
  dirty: { bar: 'bg-orange-400', icon: <AlertCircle className="w-3 h-3" />, label: 'Sucia' },
  cleaning: { bar: 'bg-blue-400', icon: <Sparkles className="w-3 h-3" />, label: 'Limpiando' },
  maintenance: { bar: 'bg-gray-400', icon: <Wrench className="w-3 h-3" />, label: 'Mantenimiento' },
}

export function deriveStatus(room: RoomWithStatus): RoomStatus {
  if (room.dirty_status === 'maintenance') return 'maintenance'
  if (room.dirty_status === 'cleaning') return 'cleaning'
  if (room.dirty_status === 'dirty') return 'dirty'
  if (room.is_occupied) return 'occupied'
  return 'available'
}

interface RoomCardProps {
  room: RoomWithStatus
  onClick: (room: RoomWithStatus) => void
}

export function RoomCard({ room, onClick }: RoomCardProps) {
  const status = deriveStatus(room)
  const cat = CATEGORY_CONFIG[room.category ?? 'estandar'] ?? CATEGORY_CONFIG.estandar
  const overlay = STATUS_OVERLAY[status]
  const guest = room.active_reservation?.guest
  const isAvailable = status === 'available'
  const isOccupied = status === 'occupied'

  const checklistItems = cat.checklist
  const checklist = room.checklist ?? {}
  const completedCount = checklistItems.filter(i => checklist[i.key]).length
  const checklistPct = checklistItems.length > 0 ? Math.round((completedCount / checklistItems.length) * 100) : 100

  return (
    <button
      onClick={() => onClick(room)}
      className={cn(
        'relative flex flex-col gap-1.5 p-3 rounded-xl border-2 text-left transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer overflow-hidden',
        isAvailable ? cn('bg-white', cat.border) :
        isOccupied ? 'bg-gray-50 border-gray-400' :
        cn(cat.bg, cat.border)
      )}
    >
      {/* Status color strip at top */}
      {isOccupied && (
        <div className="absolute inset-x-0 top-0 h-1 bg-red-400 rounded-t-xl" />
      )}
      {isAvailable && (
        <div className="absolute inset-x-0 top-0 h-1 bg-green-400 rounded-t-xl" />
      )}
      {overlay && (
        <div className={cn('absolute inset-x-0 top-0 h-1 rounded-t-xl', overlay.bar)} />
      )}

      {/* Room number + status */}
      <div className="flex items-start justify-between pt-0.5">
        <span className="text-xl font-extrabold text-gray-900 leading-none">{room.number}</span>
        <span className={cn(
          'flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide',
          isOccupied ? 'bg-red-100 text-red-700' :
          isAvailable ? 'bg-green-100 text-green-700' :
          overlay ? `${overlay.bar.replace('bg-', 'bg-').replace('-400', '-100')} text-gray-600` : ''
        )}>
          {overlay?.icon}
          {isOccupied ? 'Ocupada' : isAvailable ? 'Libre' : overlay?.label}
        </span>
      </div>

      {/* Category */}
      <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-md self-start', cat.badge)}>
        {cat.label}
      </span>

      {/* Guest name or capacity */}
      {guest ? (
        <span className="text-xs font-medium text-gray-800 truncate leading-tight">
          {guest.full_name}
        </span>
      ) : (
        <span className="flex items-center gap-1 text-[10px] text-gray-400">
          <Users className="w-3 h-3" />
          {room.capacity ?? 2} pers.
        </span>
      )}

      {/* Checklist progress (only when available) */}
      {isAvailable && checklistItems.length > 0 && (
        <div className="mt-0.5">
          <div className="w-full bg-gray-100 rounded-full h-1">
            <div
              className={cn('h-1 rounded-full transition-all', checklistPct === 100 ? 'bg-green-400' : 'bg-amber-400')}
              style={{ width: `${checklistPct}%` }}
            />
          </div>
          <span className="text-[9px] text-gray-400 mt-0.5">
            {checklistPct === 100 ? 'Lista' : `${completedCount}/${checklistItems.length} checklist`}
          </span>
        </div>
      )}
    </button>
  )
}
