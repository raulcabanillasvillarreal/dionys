'use client'

import { useState, useTransition } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  BedDouble,
  Users,
  Wrench,
  Star,
  Bell,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getEvents, createEvent, deleteEvent } from '@/lib/actions/agenda'

interface CalendarEvent {
  id: string
  title: string
  type: string
  start_at: string
  end_at: string | null
  all_day: boolean
  color: string | null
  location: string | null
  description: string | null
}

interface AgendaViewProps {
  initialEvents: CalendarEvent[]
}

const EVENT_TYPES = [
  { value: 'reserva', label: 'Reserva', color: '#1a4e8a', Icon: BedDouble },
  { value: 'reunion', label: 'Reunión', color: '#8B5CF6', Icon: Users },
  { value: 'mantenimiento', label: 'Mantenimiento', color: '#F59E0B', Icon: Wrench },
  { value: 'evento', label: 'Evento', color: '#EF4444', Icon: Star },
  { value: 'recordatorio', label: 'Recordatorio', color: '#06B6D4', Icon: Bell },
  { value: 'otro', label: 'Otro', color: '#6B7280', Icon: Calendar },
]

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function getEventColor(event: CalendarEvent): string {
  if (event.color) return event.color
  return EVENT_TYPES.find(t => t.value === event.type)?.color ?? '#6B7280'
}

function EventIcon({ type, className }: { type: string; className?: string }) {
  const et = EVENT_TYPES.find(t => t.value === type)
  if (!et) return <Calendar className={className} />
  const { Icon } = et
  return <Icon className={className} />
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function getCalendarDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1)
  // Monday-based: getDay() returns 0=Sun, 1=Mon, ... so shift
  const startDow = (firstDay.getDay() + 6) % 7 // 0=Mon
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function AgendaView({ initialEvents }: AgendaViewProps) {
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [newEventDate, setNewEventDate] = useState<string>('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDay(null)
    loadEvents(new Date(year, month - 1, 1))
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDay(null)
    loadEvents(new Date(year, month + 1, 1))
  }

  function goToday() {
    const now = new Date()
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelectedDay(null)
    loadEvents(new Date(now.getFullYear(), now.getMonth(), 1))
  }

  function loadEvents(base: Date) {
    const start = new Date(base.getFullYear(), base.getMonth(), 1).toISOString()
    const end = new Date(base.getFullYear(), base.getMonth() + 1, 0).toISOString()
    startTransition(async () => {
      const data = await getEvents(start, end)
      if (Array.isArray(data)) setEvents(data)
    })
  }

  function eventsForDay(day: Date): CalendarEvent[] {
    return events.filter(ev => {
      const start = new Date(ev.start_at)
      const end = ev.end_at ? new Date(ev.end_at) : start
      return day >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
        day <= new Date(end.getFullYear(), end.getMonth(), end.getDate())
    })
  }

  async function handleCreateEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createEvent(fd)
      if (result && 'error' in result) { setError(result.error); return }
      setShowNewModal(false)
      loadEvents(currentDate)
    })
  }

  async function handleDeleteEvent(id: string) {
    startTransition(async () => {
      const result = await deleteEvent(id)
      if (result && 'error' in result) { setError(result.error); return }
      setEvents(prev => prev.filter(ev => ev.id !== id))
      if (selectedDay) {
        const remaining = eventsForDay(selectedDay).filter(ev => ev.id !== id)
        if (remaining.length === 0) setSelectedDay(null)
      }
    })
  }

  const calendarDays = getCalendarDays(year, month)
  const selectedDayEvents = selectedDay ? eventsForDay(selectedDay) : []

  return (
    <div className="flex gap-4 h-full">
      {/* Calendar */}
      <div className={cn('flex-1 space-y-4 min-w-0', selectedDay ? 'lg:flex-[2]' : '')}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-base font-semibold text-gray-900 capitalize w-44 text-center">
              {formatMonthYear(currentDate)}
            </h2>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600">
              <ChevronRight className="h-5 w-5" />
            </button>
            <button onClick={goToday} className="ml-1 text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50">
              Hoy
            </button>
          </div>
          <button
            onClick={() => {
              setNewEventDate('')
              setShowNewModal(true)
            }}
            className="flex items-center gap-2 bg-hotel text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Nuevo evento
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm flex items-center justify-between">
            {error}
            <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* Grid */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {DAY_NAMES.map(d => (
              <div key={d} className="px-2 py-2.5 text-xs font-semibold text-gray-500 text-center">
                {d}
              </div>
            ))}
          </div>
          {/* Rows */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="border-b border-r border-gray-100 min-h-[100px] bg-gray-50/50" />
              const dayEvents = eventsForDay(day)
              const isToday = isSameDay(day, today)
              const isSelected = selectedDay ? isSameDay(day, selectedDay) : false
              const isCurrentMonth = day.getMonth() === month
              const visible = dayEvents.slice(0, 3)
              const overflow = dayEvents.length - 3

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={cn(
                    'border-b border-r border-gray-100 min-h-[100px] p-1.5 cursor-pointer transition-colors',
                    isSelected ? 'bg-blue-50' : 'hover:bg-gray-50',
                    !isCurrentMonth && 'opacity-40'
                  )}
                >
                  <div className="flex justify-end mb-1">
                    <span className={cn(
                      'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                      isToday ? 'bg-hotel text-white font-bold' : 'text-gray-700',
                      isSelected && !isToday ? 'ring-2 ring-hotel' : ''
                    )}>
                      {day.getDate()}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {visible.map(ev => (
                      <div
                        key={ev.id}
                        className="text-xs px-1.5 py-0.5 rounded truncate text-white font-medium leading-tight"
                        style={{ backgroundColor: getEventColor(ev) }}
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {overflow > 0 && (
                      <div className="text-xs text-gray-400 px-1">+{overflow} más</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Side panel */}
      {selectedDay && (
        <div className="w-72 shrink-0 space-y-3">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  {selectedDay.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <p className="text-xs text-gray-400">{selectedDayEvents.length} evento(s)</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setNewEventDate(selectedDay.toISOString().split('T')[0])
                    setShowNewModal(true)
                  }}
                  className="p-1.5 rounded-lg bg-hotel text-white hover:opacity-90"
                  title="Nuevo evento"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button onClick={() => setSelectedDay(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            {selectedDayEvents.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">Sin eventos</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {selectedDayEvents.map(ev => {
                  const color = getEventColor(ev)
                  return (
                    <div key={ev.id} className="p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-sm font-medium text-gray-900 leading-tight">{ev.title}</p>
                            <button onClick={() => handleDeleteEvent(ev.id)} className="text-gray-300 hover:text-red-500 shrink-0">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <EventIcon type={ev.type} className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500 capitalize">{ev.type}</span>
                          </div>
                          {!ev.all_day && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(ev.start_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                              {ev.end_at && ` — ${new Date(ev.end_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`}
                            </p>
                          )}
                          {ev.location && <p className="text-xs text-gray-400 mt-0.5 truncate">📍 {ev.location}</p>}
                          {ev.description && <p className="text-xs text-gray-500 mt-1 leading-snug">{ev.description}</p>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Event Modal */}
      {showNewModal && (
        <NewEventModal
          defaultDate={newEventDate || today.toISOString().split('T')[0]}
          onClose={() => setShowNewModal(false)}
          onSubmit={handleCreateEvent}
          isPending={isPending}
        />
      )}
    </div>
  )
}

function NewEventModal({
  defaultDate,
  onClose,
  onSubmit,
  isPending,
}: {
  defaultDate: string
  onClose: () => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isPending: boolean
}) {
  const [allDay, setAllDay] = useState(false)
  const [selectedColor, setSelectedColor] = useState(EVENT_TYPES[0].color)

  const COLOR_OPTIONS = ['#1a4e8a', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#10B981', '#6B7280', '#EC4899']

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="font-semibold text-gray-900">Nuevo evento</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <input type="hidden" name="color" value={selectedColor} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input name="title" required placeholder="Título del evento" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select name="type" defaultValue="otro" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel">
                {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
              <input name="start_at" type={allDay ? 'date' : 'datetime-local'} required defaultValue={allDay ? defaultDate : `${defaultDate}T09:00`} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="hidden" name="all_day" value={allDay ? 'true' : 'false'} />
            <input type="checkbox" id="all_day_cb" checked={allDay} onChange={e => setAllDay(e.target.checked)} className="rounded" />
            <label htmlFor="all_day_cb" className="text-sm text-gray-700">Todo el día</label>
          </div>
          {!allDay && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
              <input name="end_at" type="datetime-local" defaultValue={`${defaultDate}T10:00`} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
            <input name="location" placeholder="Sala, habitación, etc." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea name="description" rows={2} placeholder="Detalles del evento..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={cn('w-7 h-7 rounded-full transition-transform', selectedColor === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105')}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className="flex-1 bg-hotel text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {isPending ? 'Guardando...' : 'Crear evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
