'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  X, LogIn, LogOut, Plus, ChevronDown, Clock, Star,
  FileText, History, Settings2, DollarSign, Phone, Mail,
  CheckCircle2, Circle, Save, Calendar,
} from 'lucide-react'
import {
  checkInRoom,
  checkOutRoom,
  updateRoomDirtyStatus,
  updateRoomCategory,
  updateRoomChecklist,
  updateGuestNotes,
  addRoomCharge,
  getActiveReservationForRoom,
  getGuestHistory,
} from '@/lib/actions/mapa'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { CATEGORY_CONFIG, type RoomWithStatus } from './room-card'

type TabId = 'vista' | 'historial' | 'categoria'

interface Charge {
  id: string
  description: string
  amount: number
  payment_method: string
  created_at: string
}

interface FullGuest {
  id: string
  full_name: string
  email?: string | null
  phone?: string | null
  document_type?: string | null
  document_number?: string | null
  preferences?: string | null
  internal_notes?: string | null
}

interface FullReservation {
  id: string
  check_in: string
  check_out: string
  status: string
  folio_total: number | null
  guest: FullGuest | null
  room: { number: string; type: string; category?: string | null } | null
  charges: Charge[]
}

interface HistoryEntry {
  id: string
  check_in: string
  check_out: string
  status: string
  total_amount?: number | null
  folio_total?: number | null
  notes?: string | null
  room?: { number: string; category?: string | null } | null
}

interface RoomModalProps {
  room: RoomWithStatus
  onClose: () => void
  onRefresh: () => void
}

const DIRTY_OPTIONS: { value: 'clean' | 'dirty' | 'cleaning' | 'maintenance'; label: string }[] = [
  { value: 'clean', label: 'Limpia' },
  { value: 'dirty', label: 'Sucia' },
  { value: 'cleaning', label: 'En limpieza' },
  { value: 'maintenance', label: 'Mantenimiento' },
]

const PAYMENT_METHODS = ['efectivo', 'tarjeta', 'transferencia', 'yape', 'plin']

const CATEGORY_KEYS = Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>

const STATUS_COLORS: Record<string, string> = {
  confirmada: 'bg-green-100 text-green-700',
  completada: 'bg-gray-100 text-gray-600',
  pendiente: 'bg-yellow-100 text-yellow-700',
  cancelada: 'bg-red-100 text-red-700',
}

function nights(checkIn: string, checkOut: string): number {
  return Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
}

export function RoomModal({ room, onClose, onRefresh }: RoomModalProps) {
  const [tab, setTab] = useState<TabId>(room.is_occupied ? 'vista' : 'categoria')
  const [fullReservation, setFullReservation] = useState<FullReservation | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showChargeForm, setShowChargeForm] = useState(false)
  const [chargeDesc, setChargeDesc] = useState('')
  const [chargeAmount, setChargeAmount] = useState('')
  const [chargeMethod, setChargeMethod] = useState('efectivo')
  const [preferences, setPreferences] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [notesSaved, setNotesSaved] = useState(false)
  const [checklist, setChecklist] = useState<Record<string, boolean>>(room.checklist ?? {})
  const [selectedCategory, setSelectedCategory] = useState(room.category ?? 'estandar')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (room.is_occupied || room.active_reservation) {
      setLoading(true)
      getActiveReservationForRoom(room.id)
        .then(data => {
          if (data && !('error' in data)) {
            const res = data as FullReservation
            setFullReservation(res)
            if (res.guest) {
              setPreferences(res.guest.preferences ?? '')
              setInternalNotes(res.guest.internal_notes ?? '')
            }
          }
        })
        .finally(() => setLoading(false))
    }
  }, [room.id, room.is_occupied, room.active_reservation])

  useEffect(() => {
    if (tab === 'historial' && fullReservation?.guest?.id) {
      getGuestHistory(fullReservation.guest.id).then(data => {
        setHistory(Array.isArray(data) ? data : [])
      })
    }
  }, [tab, fullReservation?.guest?.id])

  const handleCheckIn = () => {
    if (!fullReservation) return
    startTransition(async () => {
      const res = await checkInRoom(fullReservation.id)
      if (res && 'error' in res) { setError(res.error); return }
      onRefresh(); onClose()
    })
  }

  const handleCheckOut = () => {
    if (!fullReservation) return
    startTransition(async () => {
      const res = await checkOutRoom(fullReservation.id)
      if (res && 'error' in res) { setError(res.error); return }
      onRefresh(); onClose()
    })
  }

  const handleStatusChange = (status: 'clean' | 'dirty' | 'cleaning' | 'maintenance') => {
    setShowStatusDropdown(false)
    startTransition(async () => {
      const res = await updateRoomDirtyStatus(room.id, status)
      if (res && 'error' in res) { setError(res.error); return }
      onRefresh()
    })
  }

  const handleAddCharge = () => {
    if (!fullReservation || !chargeDesc || !chargeAmount) return
    const amount = parseFloat(chargeAmount)
    if (isNaN(amount) || amount <= 0) { setError('Monto inválido'); return }
    startTransition(async () => {
      const res = await addRoomCharge(fullReservation.id, '', chargeDesc, amount, chargeMethod)
      if (res && 'error' in res) { setError(res.error); return }
      setChargeDesc(''); setChargeAmount(''); setShowChargeForm(false)
      const updated = await getActiveReservationForRoom(room.id)
      if (updated && !('error' in updated)) setFullReservation(updated as FullReservation)
      onRefresh()
    })
  }

  const handleSaveNotes = () => {
    if (!fullReservation?.guest?.id) return
    startTransition(async () => {
      await updateGuestNotes(fullReservation.guest!.id, preferences, internalNotes)
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 2000)
    })
  }

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat)
    setChecklist({})
    startTransition(async () => {
      await updateRoomCategory(room.id, cat)
      onRefresh()
    })
  }

  const handleChecklistToggle = (key: string) => {
    const next = { ...checklist, [key]: !checklist[key] }
    setChecklist(next)
    startTransition(async () => {
      await updateRoomChecklist(room.id, next)
      onRefresh()
    })
  }

  const cat = CATEGORY_CONFIG[selectedCategory] ?? CATEGORY_CONFIG.estandar
  const catChecklist = cat.checklist
  const completedCount = catChecklist.filter(i => checklist[i.key]).length
  const allDone = completedCount === catChecklist.length

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'vista', label: 'Vista Rápida', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'historial', label: 'Historial', icon: <History className="w-3.5 h-3.5" /> },
    { id: 'categoria', label: 'Categoría', icon: <Settings2 className="w-3.5 h-3.5" /> },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn('flex items-center justify-between px-5 py-4 rounded-t-2xl border-b', cat.bg)}>
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-gray-900">Hab. {room.number}</h2>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', cat.badge)}>
                  {cat.label}
                </span>
              </div>
              {fullReservation?.guest && (
                <p className="text-sm text-gray-600 font-medium mt-0.5">{fullReservation.guest.full_name}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Dirty status dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                disabled={isPending}
                className="flex items-center gap-1.5 border border-gray-200 bg-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Estado <ChevronDown className="w-3 h-3" />
              </button>
              {showStatusDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden min-w-[150px]">
                  {DIRTY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleStatusChange(opt.value)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/60 rounded-lg">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-white shrink-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors border-b-2',
                tab === t.id
                  ? 'border-hotel text-hotel'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content — scrollable */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="mx-5 mt-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">
              {error}
            </div>
          )}

          {/* ── VISTA RÁPIDA ── */}
          {tab === 'vista' && (
            <div className="p-5 space-y-4">
              {loading ? (
                <div className="text-sm text-gray-400 animate-pulse py-4">Cargando reserva...</div>
              ) : fullReservation ? (
                <>
                  {/* Guest card */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800 text-sm">Huésped actual</h3>
                      {fullReservation.guest?.document_number && (
                        <span className="text-[10px] text-gray-400 font-medium">
                          {fullReservation.guest.document_type?.toUpperCase()} {fullReservation.guest.document_number}
                        </span>
                      )}
                    </div>
                    <p className="text-base font-bold text-gray-900">{fullReservation.guest?.full_name}</p>
                    <div className="flex gap-3">
                      {fullReservation.guest?.phone && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="w-3 h-3" /> {fullReservation.guest.phone}
                        </span>
                      )}
                      {fullReservation.guest?.email && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Mail className="w-3 h-3" /> {fullReservation.guest.email}
                        </span>
                      )}
                    </div>
                    {/* Stay dates */}
                    <div className="flex gap-4 pt-1 border-t border-gray-200 mt-2">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Check-in</p>
                        <p className="text-xs font-semibold">{formatDate(fullReservation.check_in)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Check-out</p>
                        <p className="text-xs font-semibold">{formatDate(fullReservation.check_out)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Noches</p>
                        <p className="text-xs font-semibold">{nights(fullReservation.check_in, fullReservation.check_out)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Balance card */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-hotel/5 border border-hotel/20 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Total reserva</p>
                      <p className="text-lg font-bold text-hotel">{formatCurrency(fullReservation.folio_total ?? 0)}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Cargos adicionales</p>
                      <p className="text-lg font-bold text-green-700">
                        {formatCurrency(fullReservation.charges.reduce((s, c) => s + c.amount, 0))}
                      </p>
                    </div>
                  </div>

                  {/* Charges list */}
                  {fullReservation.charges.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        Servicios adquiridos
                      </h3>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {fullReservation.charges.map(charge => (
                          <div
                            key={charge.id}
                            className="flex justify-between items-center text-xs bg-gray-50 px-3 py-2 rounded-lg"
                          >
                            <span className="text-gray-700 flex-1">{charge.description}</span>
                            <span className="text-gray-400 mx-2 capitalize">{charge.payment_method}</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(charge.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add charge */}
                  {showChargeForm ? (
                    <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-gray-800">Agregar servicio / cargo</h3>
                      <input
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel"
                        placeholder="Descripción (ej: Frigobar, Room service...)"
                        value={chargeDesc}
                        onChange={e => setChargeDesc(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel"
                          placeholder="Monto (S/.)"
                          value={chargeAmount}
                          onChange={e => setChargeAmount(e.target.value)}
                        />
                        <select
                          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel"
                          value={chargeMethod}
                          onChange={e => setChargeMethod(e.target.value)}
                        >
                          {PAYMENT_METHODS.map(m => (
                            <option key={m} value={m} className="capitalize">{m}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddCharge}
                          disabled={isPending}
                          className="flex-1 bg-hotel text-white rounded-lg py-2 text-sm font-medium hover:bg-hotel/90 disabled:opacity-50"
                        >
                          Agregar cargo
                        </button>
                        <button
                          onClick={() => setShowChargeForm(false)}
                          className="px-4 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowChargeForm(true)}
                      className="flex items-center gap-2 text-sm text-hotel hover:text-hotel/80 font-medium"
                    >
                      <Plus className="w-4 h-4" /> Agregar servicio / cargo al folio
                    </button>
                  )}

                  {/* Check-in / Check-out actions */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={handleCheckIn}
                      disabled={isPending}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                    >
                      <LogIn className="w-4 h-4" /> Check-in
                    </button>
                    <button
                      onClick={handleCheckOut}
                      disabled={isPending}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                    >
                      <LogOut className="w-4 h-4" /> Check-out
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Sin reserva activa hoy</p>
                  <p className="text-xs mt-1">Esta habitación está disponible</p>
                </div>
              )}
            </div>
          )}

          {/* ── HISTORIAL ── */}
          {tab === 'historial' && (
            <div className="p-5 space-y-4">
              {/* Guest notes & preferences */}
              {fullReservation?.guest && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400" />
                    Perfil del huésped
                  </h3>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Preferencias</label>
                    <textarea
                      rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel resize-none"
                      placeholder="Ej: Prefiere almohadas firmes, alérgico a mariscos..."
                      value={preferences}
                      onChange={e => setPreferences(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Notas internas (no visibles al huésped)</label>
                    <textarea
                      rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel resize-none"
                      placeholder="Notas del personal sobre este huésped..."
                      value={internalNotes}
                      onChange={e => setInternalNotes(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleSaveNotes}
                    disabled={isPending}
                    className={cn(
                      'flex items-center gap-2 text-sm font-medium rounded-lg px-4 py-2 transition-colors',
                      notesSaved
                        ? 'bg-green-100 text-green-700'
                        : 'bg-hotel text-white hover:bg-hotel/90 disabled:opacity-50'
                    )}
                  >
                    <Save className="w-3.5 h-3.5" />
                    {notesSaved ? 'Guardado' : 'Guardar notas'}
                  </button>
                </div>
              )}

              {/* Stay history */}
              <div>
                <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2 mb-3">
                  <History className="w-4 h-4 text-gray-400" />
                  Historial de estancias
                  {history.length > 0 && (
                    <span className="ml-auto text-xs text-gray-400 font-normal">
                      {history.length} visita{history.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </h3>
                {history.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Sin estancias anteriores registradas
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {history.map(entry => {
                      const entryCat = CATEGORY_CONFIG[(entry.room?.category ?? 'estandar') as string] ?? CATEGORY_CONFIG.estandar
                      return (
                        <div key={entry.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold text-gray-800">
                                Hab. {entry.room?.number ?? '—'}
                              </span>
                              <span className={cn('text-[10px] px-1.5 py-0.5 rounded-md font-medium', entryCat.badge)}>
                                {entryCat.label}
                              </span>
                              <span className={cn('text-[10px] px-1.5 py-0.5 rounded-md font-medium capitalize', STATUS_COLORS[entry.status] ?? 'bg-gray-100 text-gray-600')}>
                                {entry.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formatDate(entry.check_in)} → {formatDate(entry.check_out)}
                              {' · '}{nights(entry.check_in, entry.check_out)} noche{nights(entry.check_in, entry.check_out) !== 1 ? 's' : ''}
                            </p>
                            {entry.notes && (
                              <p className="text-xs text-gray-400 mt-1 italic truncate">{entry.notes}</p>
                            )}
                          </div>
                          {(entry.total_amount || entry.folio_total) && (
                            <span className="text-sm font-bold text-gray-800 whitespace-nowrap">
                              {formatCurrency(entry.folio_total ?? entry.total_amount ?? 0)}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {!fullReservation?.guest && (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">Sin huésped activo</p>
                  <p className="text-xs mt-1">El historial aparece al seleccionar una habitación ocupada</p>
                </div>
              )}
            </div>
          )}

          {/* ── CATEGORÍA & CHECKLIST ── */}
          {tab === 'categoria' && (
            <div className="p-5 space-y-5">
              {/* Category picker */}
              <div>
                <h3 className="font-semibold text-gray-800 text-sm mb-3">Categoría de la habitación</h3>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORY_KEYS.map(key => {
                    const cfg = CATEGORY_CONFIG[key]
                    const isSelected = selectedCategory === key
                    return (
                      <button
                        key={key}
                        onClick={() => handleCategoryChange(key)}
                        disabled={isPending}
                        className={cn(
                          'flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all',
                          isSelected ? `${cfg.bg} ${cfg.border} shadow-sm` : 'bg-white border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                        <div className="min-w-0">
                          <p className={cn('text-xs font-semibold truncate', isSelected ? 'text-gray-900' : 'text-gray-700')}>
                            {cfg.label}
                          </p>
                          <p className="text-[10px] text-gray-400">{cfg.checklist.length} ítems</p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 ml-auto shrink-0" style={{ color: cfg.color }} />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Checklist */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 text-sm">
                    Checklist de preparación
                  </h3>
                  <span className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded-full',
                    allDone ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  )}>
                    {completedCount}/{catChecklist.length} {allDone ? '— Lista' : '— Pendiente'}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                  <div
                    className={cn('h-2 rounded-full transition-all', allDone ? 'bg-green-400' : 'bg-amber-400')}
                    style={{ width: `${catChecklist.length > 0 ? (completedCount / catChecklist.length) * 100 : 0}%` }}
                  />
                </div>

                <div className="space-y-2">
                  {catChecklist.map(item => {
                    const done = !!checklist[item.key]
                    return (
                      <button
                        key={item.key}
                        onClick={() => handleChecklistToggle(item.key)}
                        disabled={isPending}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                          done ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-gray-300'
                        )}
                      >
                        {done
                          ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                          : <Circle className="w-4 h-4 text-gray-300 shrink-0" />
                        }
                        <span className={cn('text-sm', done ? 'text-green-700 line-through' : 'text-gray-700')}>
                          {item.label}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {allDone && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                    <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-1" />
                    <p className="text-sm font-semibold text-green-700">Habitación lista para el huésped</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
