'use client'

import { useState } from 'react'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { RoomDialog } from '@/components/hotel/room-dialog'
import { deleteRoom } from '@/lib/actions/hotel'
import { formatCurrency } from '@/lib/utils'
import type { Room } from '@/types/hotel'

export function RoomsTable({ rooms }: { rooms: Room[] }) {
  const [dialog, setDialog] = useState<{ open: boolean; room: Room | null }>({
    open: false,
    room: null,
  })

  function openCreate() { setDialog({ open: true, room: null }) }
  function openEdit(room: Room) { setDialog({ open: true, room }) }
  function closeDialog() { setDialog({ open: false, room: null }) }

  async function handleDelete(room: Room) {
    if (!confirm(`¿Eliminar habitación ${room.number}? Esta acción no se puede deshacer.`)) return
    const result = await deleteRoom(room.id)
    if (result?.error) alert(result.error)
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">
            Habitaciones <span className="text-gray-400 font-normal ml-1">{rooms.length}</span>
          </h2>
          <button onClick={openCreate} className={btnPrimary}>
            <Plus size={15} />
            Nueva habitación
          </button>
        </div>

        {rooms.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">
            No hay habitaciones registradas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  {['Nro.', 'Tipo', 'Cap.', 'Precio / noche', 'Estado', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rooms.map(room => (
                  <tr key={room.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{room.number}</td>
                    <td className="px-5 py-3 text-gray-600">{room.type}</td>
                    <td className="px-5 py-3 text-gray-600">{room.capacity}</td>
                    <td className="px-5 py-3 text-gray-900 font-medium">
                      {formatCurrency(room.price_per_night)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge value={room.status ?? 'disponible'} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => openEdit(room)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(room)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RoomDialog open={dialog.open} onClose={closeDialog} room={dialog.room} />
    </>
  )
}

const btnPrimary = 'flex items-center gap-1.5 px-3 py-1.5 bg-hotel text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity'
