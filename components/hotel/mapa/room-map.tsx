'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getRoomsWithStatus } from '@/lib/actions/mapa'
import { RoomCard, deriveStatus, CATEGORY_CONFIG, type RoomWithStatus } from './room-card'
import { RoomModal } from './room-modal'
import { cn } from '@/lib/utils'
import { Building2 } from 'lucide-react'

type FloorKey = 'all' | '1' | '2' | '3' | '4' | '5'

const FLOOR_LABELS: Record<FloorKey, string> = {
  all: 'Todos',
  '1': '1° Piso — Suites',
  '2': '2° Piso',
  '3': '3° Piso',
  '4': '4° Piso',
  '5': '5° Piso',
}

const STATUS_LEGEND = [
  { label: 'Disponible', bar: 'bg-green-400', text: 'text-green-700' },
  { label: 'Ocupada', bar: 'bg-red-400', text: 'text-red-700' },
  { label: 'Sucia', bar: 'bg-orange-400', text: 'text-orange-700' },
  { label: 'Limpiando', bar: 'bg-blue-400', text: 'text-blue-700' },
  { label: 'Mantenimiento', bar: 'bg-gray-400', text: 'text-gray-600' },
]

function getFloor(room: RoomWithStatus): string {
  const n = parseInt(room.number, 10)
  if (n >= 100 && n < 200) return '1'
  if (n >= 200 && n < 300) return '2'
  if (n >= 300 && n < 400) return '3'
  if (n >= 400 && n < 500) return '4'
  if (n >= 500 && n < 600) return '5'
  return 'other'
}

interface FloorStats {
  total: number
  available: number
  occupied: number
  dirty: number
}

function computeFloorStats(rooms: RoomWithStatus[]): FloorStats {
  return {
    total: rooms.length,
    available: rooms.filter(r => deriveStatus(r) === 'available').length,
    occupied: rooms.filter(r => deriveStatus(r) === 'occupied').length,
    dirty: rooms.filter(r => ['dirty', 'cleaning', 'maintenance'].includes(deriveStatus(r))).length,
  }
}

interface RoomMapProps {
  initialRooms: RoomWithStatus[]
}

export function RoomMap({ initialRooms }: RoomMapProps) {
  const [rooms, setRooms] = useState<RoomWithStatus[]>(initialRooms)
  const [activeFloor, setActiveFloor] = useState<FloorKey>('all')
  const [selectedRoom, setSelectedRoom] = useState<RoomWithStatus | null>(null)

  const refreshRooms = useCallback(async () => {
    const data = await getRoomsWithStatus()
    if (Array.isArray(data)) setRooms(data as RoomWithStatus[])
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const ch = supabase
      .channel('mapa-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, refreshRooms)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, refreshRooms)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [refreshRooms])

  const floors: FloorKey[] = ['1', '2', '3', '4', '5']

  const displayedRooms =
    activeFloor === 'all'
      ? rooms
      : rooms.filter(r => getFloor(r) === activeFloor)

  const roomsByFloor: Record<string, RoomWithStatus[]> = {}
  for (const room of displayedRooms) {
    const fl = getFloor(room)
    if (!roomsByFloor[fl]) roomsByFloor[fl] = []
    roomsByFloor[fl].push(room)
  }

  const sortedFloorKeys = Object.keys(roomsByFloor).sort()

  const globalStats = computeFloorStats(rooms)
  const ocupacionPct = rooms.length > 0 ? Math.round((globalStats.occupied / rooms.length) * 100) : 0

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top header */}
      <div className="px-4 md:px-6 pt-4 md:pt-5 pb-3 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-base md:text-xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 md:w-5 md:h-5 text-hotel" />
              Mapa de Habitaciones
            </h1>
            <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">Vista en tiempo real — Hotel Dionys, 5 pisos</p>
          </div>

          {/* Global KPIs */}
          <div className="flex gap-2 text-center">
            <div className="bg-green-50 border border-green-200 rounded-xl px-2 md:px-4 py-1.5 md:py-2">
              <p className="text-base md:text-xl font-bold text-green-700">{globalStats.available}</p>
              <p className="text-[9px] md:text-[10px] text-green-600 font-medium uppercase tracking-wide">Libres</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl px-2 md:px-4 py-1.5 md:py-2">
              <p className="text-base md:text-xl font-bold text-red-700">{globalStats.occupied}</p>
              <p className="text-[9px] md:text-[10px] text-red-600 font-medium uppercase tracking-wide">Ocup.</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-2 md:px-4 py-1.5 md:py-2 hidden sm:block">
              <p className="text-base md:text-xl font-bold text-orange-700">{globalStats.dirty}</p>
              <p className="text-[9px] md:text-[10px] text-orange-600 font-medium uppercase tracking-wide">Atención</p>
            </div>
            <div className="bg-hotel/10 border border-hotel/20 rounded-xl px-2 md:px-4 py-1.5 md:py-2">
              <p className="text-base md:text-xl font-bold text-hotel">{ocupacionPct}%</p>
              <p className="text-[9px] md:text-[10px] text-hotel/70 font-medium uppercase tracking-wide">Ocup%</p>
            </div>
          </div>
        </div>

        {/* Floor tabs */}
        <div className="flex gap-1.5 mt-3 overflow-x-auto pb-0.5 scrollbar-hide">
          <button
            onClick={() => setActiveFloor('all')}
            className={cn(
              'px-3 md:px-4 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap',
              activeFloor === 'all'
                ? 'bg-hotel text-white border-hotel shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-hotel hover:text-hotel'
            )}
          >
            Todos
          </button>
          {floors.map(fl => {
            const flRooms = rooms.filter(r => getFloor(r) === fl)
            const flStats = computeFloorStats(flRooms)
            return (
              <button
                key={fl}
                onClick={() => setActiveFloor(fl)}
                className={cn(
                  'px-3 md:px-4 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap flex items-center gap-1',
                  activeFloor === fl
                    ? 'bg-hotel text-white border-hotel shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-hotel hover:text-hotel'
                )}
              >
                <span>P.{fl}</span>
                {flStats.occupied > 0 && (
                  <span className={cn(
                    'text-[9px] font-bold px-1 py-0.5 rounded-full',
                    activeFloor === fl ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'
                  )}>
                    {flStats.occupied}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend — oculta en mobile, visible en desktop */}
      <div className="hidden md:flex items-center gap-4 px-6 py-2 bg-gray-50 border-b border-gray-100 shrink-0 overflow-x-auto">
        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide whitespace-nowrap">Leyenda:</span>
        {STATUS_LEGEND.map(l => (
          <span key={l.label} className="flex items-center gap-1.5 whitespace-nowrap">
            <span className={cn('w-2 h-2 rounded-full', l.bar)} />
            <span className={cn('text-[10px] font-medium', l.text)}>{l.label}</span>
          </span>
        ))}
        <div className="ml-auto flex items-center gap-3 flex-wrap">
          {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
            <span key={key} className="flex items-center gap-1 whitespace-nowrap">
              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: cfg.color }} />
              <span className="text-[10px] text-gray-500">{cfg.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Room grid scrollable area */}
      <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 space-y-6">
        {sortedFloorKeys.length === 0 && (
          <div className="text-center py-20 text-gray-400 text-sm">
            No hay habitaciones registradas. Ejecuta la migración 00010 para cargar las habitaciones.
          </div>
        )}

        {sortedFloorKeys.map(fl => {
          const flRooms = roomsByFloor[fl]
          const flStats = computeFloorStats(flRooms)
          const flLabel = fl === '1' ? '1° Piso — Suites' : `${fl}° Piso`

          return (
            <div key={fl}>
              {/* Floor header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-800">{flLabel}</span>
                  <span className="text-xs text-gray-400">({flRooms.length} hab.)</span>
                </div>
                <div className="flex-1 h-px bg-gray-200" />
                <div className="flex gap-2 text-xs">
                  <span className="text-green-600 font-medium">{flStats.available} libres</span>
                  {flStats.occupied > 0 && <span className="text-red-600 font-medium">{flStats.occupied} ocupadas</span>}
                  {flStats.dirty > 0 && <span className="text-orange-600 font-medium">{flStats.dirty} atención</span>}
                </div>
              </div>

              {/* Rooms grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-2 md:gap-2">
                {flRooms.map(room => (
                  <RoomCard key={room.id} room={room} onClick={setSelectedRoom} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {selectedRoom && (
        <RoomModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onRefresh={refreshRooms}
        />
      )}
    </div>
  )
}
