'use client'

import { useState } from 'react'
import { Plus, ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ReservationDialog } from '@/components/hotel/reservation-dialog'
import { updateReservationStatus } from '@/lib/actions/hotel'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ReservationWithDetails, ReservationStatus } from '@/types/hotel'

const STATUS_TRANSITIONS: Record<ReservationStatus, { label: string; next: ReservationStatus }[]> = {
  pendiente: [
    { label: 'Confirmar', next: 'confirmada' },
    { label: 'Cancelar', next: 'cancelada' },
  ],
  confirmada: [
    { label: 'Marcar completada', next: 'completada' },
    { label: 'Cancelar', next: 'cancelada' },
  ],
  completada: [],
  cancelada: [],
}

interface AvailableRoom {
  id: string
  number: string
  type: string
  price_per_night: number
}

export function ReservationsTable({
  reservations,
  availableRooms,
}: {
  reservations: ReservationWithDetails[]
  availableRooms: AvailableRoom[]
}) {
  const [dialogOpen, setDialogOpen] = useState(false)

  async function handleStatusChange(id: string, status: ReservationStatus) {
    const result = await updateReservationStatus(id, status)
    if (result?.error) alert(result.error)
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">
            Reservas <span className="text-gray-400 font-normal ml-1">{reservations.length}</span>
          </h2>
          <button onClick={() => setDialogOpen(true)} className={btnPrimary}>
            <Plus size={15} />
            Nueva reserva
          </button>
        </div>

        {reservations.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">No hay reservas registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  {['Huésped', 'Habitación', 'Check-in', 'Check-out', 'Estado', 'Total', 'Acciones'].map(h => (
                    <th key={h} className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reservations.map(res => {
                  const transitions = STATUS_TRANSITIONS[res.status as ReservationStatus] ?? []
                  return (
                    <tr key={res.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{res.guest?.full_name ?? '—'}</p>
                        {res.guest?.phone && (
                          <p className="text-xs text-gray-400">{res.guest.phone}</p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {res.room ? `${res.room.number} · ${res.room.type}` : '—'}
                      </td>
                      <td className="px-5 py-3 text-gray-600">{formatDate(res.check_in)}</td>
                      <td className="px-5 py-3 text-gray-600">{formatDate(res.check_out)}</td>
                      <td className="px-5 py-3">
                        <Badge value={res.status ?? 'pendiente'} />
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-900">
                        {res.total_amount ? formatCurrency(res.total_amount) : '—'}
                      </td>
                      <td className="px-5 py-3">
                        {transitions.length > 0 && (
                          <div className="relative group inline-block">
                            <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-2 py-1 hover:bg-gray-50">
                              Acción <ChevronDown size={12} />
                            </button>
                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg hidden group-hover:block z-10 min-w-max">
                              {transitions.map(({ label, next }) => (
                                <button
                                  key={next}
                                  onClick={() => handleStatusChange(res.id, next)}
                                  className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ReservationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        availableRooms={availableRooms}
      />
    </>
  )
}

const btnPrimary = 'flex items-center gap-1.5 px-3 py-1.5 bg-hotel text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity'
