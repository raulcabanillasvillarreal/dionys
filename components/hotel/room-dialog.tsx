'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { upsertRoom } from '@/lib/actions/hotel'
import type { Room, RoomStatus } from '@/types/hotel'

const TIPOS = ['Simple', 'Doble', 'Triple', 'Suite', 'Suite Junior', 'Suite Presidencial']
const ESTADOS: RoomStatus[] = ['disponible', 'ocupada', 'reservada', 'mantenimiento']

interface RoomDialogProps {
  open: boolean
  onClose: () => void
  room?: Room | null
}

export function RoomDialog({ open, onClose, room }: RoomDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await upsertRoom(new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      onClose()
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={room ? `Editar habitación ${room.number}` : 'Nueva habitación'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {room && <input type="hidden" name="id" value={room.id} />}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Número / Nombre" required>
            <input
              name="number"
              defaultValue={room?.number ?? ''}
              required
              placeholder="101"
              className={inputCls}
            />
          </Field>

          <Field label="Tipo">
            <select name="type" defaultValue={room?.type ?? 'Doble'} className={inputCls}>
              {TIPOS.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>

          <Field label="Capacidad (personas)">
            <input
              name="capacity"
              type="number"
              min={1}
              max={20}
              defaultValue={room?.capacity ?? 2}
              required
              className={inputCls}
            />
          </Field>

          <Field label="Precio por noche (S/)">
            <input
              name="price_per_night"
              type="number"
              min={0}
              step="0.01"
              defaultValue={room?.price_per_night ?? ''}
              required
              placeholder="150.00"
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Estado">
          <select name="status" defaultValue={room?.status ?? 'disponible'} className={inputCls}>
            {ESTADOS.map(s => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </select>
        </Field>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className={cancelCls}>
            Cancelar
          </button>
          <button type="submit" disabled={loading} className={submitCls}>
            {loading ? 'Guardando...' : room ? 'Guardar cambios' : 'Crear habitación'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="col-span-full sm:col-span-1">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hotel focus:border-transparent'
const submitCls = 'px-4 py-2 bg-hotel text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity'
const cancelCls = 'px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
