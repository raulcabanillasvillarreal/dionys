'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { createReservation } from '@/lib/actions/hotel'

interface AvailableRoom {
  id: string
  number: string
  type: string
  price_per_night: number
}

export function ReservationDialog({
  open,
  onClose,
  availableRooms,
}: {
  open: boolean
  onClose: () => void
  availableRooms: AvailableRoom[]
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<AvailableRoom | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await createReservation(new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      onClose()
    }
  }

  function handleRoomChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const room = availableRooms.find(r => r.id === e.target.value) ?? null
    setSelectedRoom(room)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <Modal open={open} onClose={onClose} title="Nueva reserva" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Datos del huésped
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Nombre completo *</label>
              <input name="guest_name" required placeholder="Juan Pérez" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input name="guest_email" type="email" placeholder="juan@email.com" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Teléfono</label>
              <input name="guest_phone" placeholder="+51 999 000 000" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Tipo documento</label>
              <select name="document_type" className={inputCls}>
                <option value="">— Seleccionar —</option>
                <option>DNI</option>
                <option>Pasaporte</option>
                <option>CE</option>
                <option>RUC</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Nro. documento</label>
              <input name="document_number" placeholder="12345678" className={inputCls} />
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Habitación y fechas
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Habitación disponible *</label>
              {availableRooms.length === 0 ? (
                <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  No hay habitaciones disponibles en este momento.
                </p>
              ) : (
                <select
                  name="room_id"
                  required
                  onChange={handleRoomChange}
                  className={inputCls}
                >
                  <option value="">— Seleccionar habitación —</option>
                  {availableRooms.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.number} — {r.type} — S/ {r.price_per_night}/noche
                    </option>
                  ))}
                </select>
              )}
              {selectedRoom && (
                <input type="hidden" name="price_per_night" value={selectedRoom.price_per_night} />
              )}
            </div>
            <div>
              <label className={labelCls}>Check-in *</label>
              <input
                name="check_in"
                type="date"
                required
                min={today}
                defaultValue={today}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Check-out *</label>
              <input
                name="check_out"
                type="date"
                required
                min={today}
                className={inputCls}
              />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Notas</label>
              <textarea
                name="notes"
                rows={2}
                placeholder="Preferencias, requerimientos especiales..."
                className={inputCls}
              />
            </div>
          </div>
        </section>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className={cancelCls}>Cancelar</button>
          <button
            type="submit"
            disabled={loading || availableRooms.length === 0}
            className={submitCls}
          >
            {loading ? 'Creando...' : 'Crear reserva'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

const labelCls = 'block text-sm font-medium text-gray-700 mb-1'
const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hotel focus:border-transparent'
const submitCls = 'px-4 py-2 bg-hotel text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity'
const cancelCls = 'px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
