'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'

interface Room {
  id: string
  number: string
  type: string
}

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

interface PlanningViewProps {
  rooms: Room[]
  reservations: PlanningReservation[]
}

type ViewMode = 7 | 14 | 30

const CHANNEL_COLORS: Record<string, string> = {
  booking: 'bg-blue-500',
  airbnb: 'bg-pink-500',
  directo: 'bg-green-500',
  bloqueado: 'bg-gray-400',
}

function getChannelColor(channel: string | null): string {
  if (!channel) return 'bg-hotel'
  return CHANNEL_COLORS[channel.toLowerCase()] ?? 'bg-hotel'
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function dateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000)
}

const DAY_WIDTH = 44 // px per day column
const ROW_HEIGHT = 52

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'confirmada': return 'bg-green-100 text-green-700'
    case 'pendiente': return 'bg-yellow-100 text-yellow-700'
    case 'completada': return 'bg-gray-100 text-gray-600'
    default: return 'bg-blue-100 text-blue-700'
  }
}

interface PopoverState {
  reservationId: string
  x: number
  y: number
}

export function PlanningView({ rooms, reservations }: PlanningViewProps) {
  const [viewStart, setViewStart] = useState<Date>(() => startOfDay(new Date()))
  const [viewMode, setViewMode] = useState<ViewMode>(14)
  const [popover, setPopover] = useState<PopoverState | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const today = startOfDay(new Date())
  const viewEnd = addDays(viewStart, viewMode)

  // Generate array of days in view
  const days: Date[] = []
  for (let i = 0; i < viewMode; i++) {
    days.push(addDays(viewStart, i))
  }

  const navigate = (direction: 'prev' | 'next') => {
    setViewStart((d) => addDays(d, direction === 'next' ? viewMode : -viewMode))
    setPopover(null)
  }

  const goToday = () => {
    setViewStart(startOfDay(new Date()))
    setPopover(null)
  }

  // Close popover on outside click
  useEffect(() => {
    const handler = () => setPopover(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  // Detect conflicts per room: reservations that overlap
  const conflictIds = new Set<string>()
  rooms.forEach((room) => {
    const roomRes = reservations.filter((r) => r.room_id === room.id)
    for (let i = 0; i < roomRes.length; i++) {
      for (let j = i + 1; j < roomRes.length; j++) {
        const a = roomRes[i]
        const b = roomRes[j]
        if (a.check_in < b.check_out && b.check_in < a.check_out) {
          conflictIds.add(a.id)
          conflictIds.add(b.id)
        }
      }
    }
  })

  const popoverReservation = popover
    ? reservations.find((r) => r.id === popover.reservationId) ?? null
    : null

  const viewStartKey = dateKey(viewStart)
  const viewEndKey = dateKey(viewEnd)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b bg-white flex-shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToday}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <CalendarDays className="w-4 h-4" />
            Hoy
          </button>
          <button
            onClick={() => navigate('next')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <h2 className="text-sm font-semibold text-gray-700">
          {formatDate(viewStart)} — {formatDate(addDays(viewEnd, -1))}
        </h2>

        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {([7, 14, 30] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                viewMode === v ? 'bg-hotel text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              )}
            >
              {v} días
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-5 py-2 border-b bg-white flex-shrink-0">
        {[
          { label: 'Booking', color: 'bg-blue-500' },
          { label: 'Airbnb', color: 'bg-pink-500' },
          { label: 'Directo', color: 'bg-green-500' },
          { label: 'Bloqueado', color: 'bg-gray-400' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className={cn('w-3 h-3 rounded-sm', item.color)} />
            <span className="text-xs text-gray-500">{item.label}</span>
          </div>
        ))}
        {conflictIds.size > 0 && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="w-3 h-3 rounded-sm border-2 border-red-500 bg-red-100" />
            <span className="text-xs text-red-600 font-medium">Conflicto</span>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* Fixed left column — room labels */}
        <div className="w-28 flex-shrink-0 border-r bg-white overflow-y-auto overflow-x-hidden">
          {/* Header spacer */}
          <div className="h-10 border-b bg-gray-50" />
          {rooms.map((room) => (
            <div
              key={room.id}
              className="flex flex-col justify-center px-3 border-b"
              style={{ height: ROW_HEIGHT }}
            >
              <span className="text-sm font-bold text-gray-800">#{room.number}</span>
              <span className="text-[10px] text-gray-400 capitalize">{room.type?.replace('_', ' ')}</span>
            </div>
          ))}
        </div>

        {/* Scrollable grid */}
        <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-auto relative">
          <div style={{ width: days.length * DAY_WIDTH, minWidth: '100%' }}>
            {/* Day headers */}
            <div className="flex h-10 border-b bg-gray-50 sticky top-0 z-10">
              {days.map((day) => {
                const isToday = dateKey(day) === dateKey(today)
                const isWeekend = day.getDay() === 0 || day.getDay() === 6
                return (
                  <div
                    key={dateKey(day)}
                    className={cn(
                      'flex flex-col items-center justify-center border-r text-center flex-shrink-0',
                      isToday ? 'bg-blue-50' : isWeekend ? 'bg-gray-50' : 'bg-white'
                    )}
                    style={{ width: DAY_WIDTH }}
                  >
                    <span className={cn('text-[10px] font-medium', isToday ? 'text-blue-600' : 'text-gray-400')}>
                      {day.toLocaleDateString('es-PE', { weekday: 'short' }).toUpperCase()}
                    </span>
                    <span className={cn(
                      'text-xs font-bold',
                      isToday ? 'text-blue-700' : 'text-gray-700'
                    )}>
                      {day.getDate()}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Room rows */}
            {rooms.map((room) => {
              const roomRes = reservations.filter((r) => r.room_id === room.id)

              return (
                <div
                  key={room.id}
                  className="relative border-b flex"
                  style={{ height: ROW_HEIGHT }}
                >
                  {/* Day cell backgrounds */}
                  {days.map((day) => {
                    const isToday = dateKey(day) === dateKey(today)
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6
                    return (
                      <div
                        key={dateKey(day)}
                        className={cn(
                          'border-r h-full flex-shrink-0',
                          isToday ? 'bg-blue-50' : isWeekend ? 'bg-gray-50/50' : 'bg-white'
                        )}
                        style={{ width: DAY_WIDTH }}
                      />
                    )
                  })}

                  {/* Reservation blocks */}
                  {roomRes.map((res) => {
                    const resStart = startOfDay(new Date(res.check_in))
                    const resEnd = startOfDay(new Date(res.check_out))

                    // Only show if overlaps view
                    if (resEnd <= viewStart || resStart >= viewEnd) return null

                    const clampedStart = resStart < viewStart ? viewStart : resStart
                    const clampedEnd = resEnd > viewEnd ? viewEnd : resEnd

                    const offsetDays = daysBetween(viewStart, clampedStart)
                    const spanDays = daysBetween(clampedStart, clampedEnd)

                    if (spanDays <= 0) return null

                    const left = offsetDays * DAY_WIDTH + 2
                    const width = spanDays * DAY_WIDTH - 4
                    const isConflict = conflictIds.has(res.id)
                    const colorClass = getChannelColor(res.booking_channel)
                    const guestName = res.guest?.full_name ?? 'Sin nombre'

                    return (
                      <button
                        key={res.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          const rect = (e.target as HTMLElement).getBoundingClientRect()
                          setPopover({
                            reservationId: res.id,
                            x: rect.left,
                            y: rect.bottom + 4,
                          })
                        }}
                        className={cn(
                          'absolute top-2 bottom-2 rounded-md text-white text-xs font-medium flex items-center px-2 overflow-hidden cursor-pointer transition-opacity hover:opacity-90',
                          colorClass,
                          isConflict && 'border-2 border-red-500'
                        )}
                        style={{ left, width }}
                        title={`${guestName} — ${res.check_in} → ${res.check_out}`}
                      >
                        <span className="truncate">{guestName}</span>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Popover */}
      {popover && popoverReservation && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-64"
          style={{ left: Math.min(popover.x, window.innerWidth - 272), top: popover.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="font-semibold text-gray-900 text-sm">{popoverReservation.guest?.full_name ?? 'Sin nombre'}</p>
          <div className="mt-2 space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span className="text-gray-400">Check-in</span>
              <span>{formatDate(popoverReservation.check_in)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Check-out</span>
              <span>{formatDate(popoverReservation.check_out)}</span>
            </div>
            {popoverReservation.total_amount !== null && (
              <div className="flex justify-between">
                <span className="text-gray-400">Total</span>
                <span className="font-semibold text-hotel">{formatCurrency(popoverReservation.total_amount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center mt-1">
              <span className="text-gray-400">Estado</span>
              <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize', getStatusBadgeClass(popoverReservation.status))}>
                {popoverReservation.status}
              </span>
            </div>
            {popoverReservation.booking_channel && (
              <div className="flex justify-between">
                <span className="text-gray-400">Canal</span>
                <span className="capitalize">{popoverReservation.booking_channel}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
