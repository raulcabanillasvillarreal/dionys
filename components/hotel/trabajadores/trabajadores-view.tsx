'use client'

import { useState, useTransition } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  UserCheck,
  UserX,
  Clock,
  Wallet,
  Sun,
  Cloud,
  Moon,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  upsertWorker,
  deleteWorker,
  registerAttendance,
  addAdvance,
} from '@/lib/actions/trabajadores'

interface Worker {
  id: string
  full_name: string
  role: string
  shift: string
  phone: string | null
  email: string | null
  active: boolean
  salary: number | null
  document_number?: string | null
}

interface AttendanceRecord {
  id: string
  worker_id: string
  date: string
  check_in: string | null
  check_out: string | null
  status: string
  worker?: {
    full_name: string
    role: string
    shift: string
  }
}

interface TrabajadoresViewProps {
  initialWorkers: Worker[]
  initialAttendance: AttendanceRecord[]
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  recepcionista: 'bg-blue-100 text-blue-700',
  cajero: 'bg-green-100 text-green-700',
  limpieza: 'bg-orange-100 text-orange-700',
  supervisor: 'bg-indigo-100 text-indigo-700',
  otro: 'bg-gray-100 text-gray-600',
}

const ROLE_OPTIONS = ['admin', 'recepcionista', 'cajero', 'limpieza', 'supervisor', 'otro']
const SHIFT_OPTIONS = [
  { value: 'manana', label: 'Mañana ☀️' },
  { value: 'tarde', label: 'Tarde 🌤️' },
  { value: 'noche', label: 'Noche 🌙' },
  { value: 'rotativo', label: 'Rotativo 🔄' },
]

const STATUS_COLORS: Record<string, string> = {
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  late: 'bg-orange-100 text-orange-700',
  permission: 'bg-blue-100 text-blue-700',
}

const STATUS_LABELS: Record<string, string> = {
  present: 'Presente',
  absent: 'Ausente',
  late: 'Tardanza',
  permission: 'Permiso',
}

function ShiftIcon({ shift }: { shift: string }) {
  if (shift === 'manana') return <Sun className="h-3.5 w-3.5 text-yellow-500" />
  if (shift === 'tarde') return <Cloud className="h-3.5 w-3.5 text-blue-400" />
  if (shift === 'noche') return <Moon className="h-3.5 w-3.5 text-indigo-500" />
  return <RefreshCw className="h-3.5 w-3.5 text-gray-500" />
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-pink-500',
  'bg-indigo-500',
]

function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function TrabajadoresView({
  initialWorkers,
  initialAttendance,
}: TrabajadoresViewProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'asistencia'>('personal')
  const [workers, setWorkers] = useState<Worker[]>(initialWorkers)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialAttendance)
  const [showWorkerModal, setShowWorkerModal] = useState(false)
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showAdvanceModal, setShowAdvanceModal] = useState(false)
  const [advanceWorkerId, setAdvanceWorkerId] = useState('')
  const [advanceAmount, setAdvanceAmount] = useState('')
  const [advanceDescription, setAdvanceDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const today = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  function handleEdit(worker: Worker) {
    setEditingWorker(worker)
    setShowWorkerModal(true)
  }

  function handleNew() {
    setEditingWorker(null)
    setShowWorkerModal(true)
  }

  async function handleWorkerSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const fd = new FormData(form)
    startTransition(async () => {
      const result = await upsertWorker(fd)
      if ('error' in result && result.error) {
        setError(result.error)
        return
      }
      // Refresh by re-reading from the form
      const id = fd.get('id') as string | null
      const updatedWorker: Worker = {
        id: id ?? crypto.randomUUID(),
        full_name: fd.get('full_name') as string,
        role: fd.get('role') as string,
        shift: fd.get('shift') as string,
        phone: (fd.get('phone') as string) || null,
        email: (fd.get('email') as string) || null,
        active: fd.get('active') !== 'false',
        salary: fd.get('salary') ? parseFloat(fd.get('salary') as string) : null,
        document_number: (fd.get('document_number') as string) || null,
      }
      if (id) {
        setWorkers(prev => prev.map(w => (w.id === id ? updatedWorker : w)))
      } else {
        setWorkers(prev => [...prev, updatedWorker])
      }
      setShowWorkerModal(false)
    })
  }

  async function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteWorker(id)
      if ('error' in result && result.error) {
        setError(result.error)
        return
      }
      setWorkers(prev => prev.filter(w => w.id !== id))
      setShowDeleteConfirm(null)
    })
  }

  async function handleCheckIn(workerId: string) {
    startTransition(async () => {
      const result = await registerAttendance(workerId, 'check_in')
      if ('error' in result && result.error) { setError(result.error); return }
      const now = new Date().toISOString()
      setAttendance(prev => {
        const existing = prev.find(a => a.worker_id === workerId)
        if (existing) return prev.map(a => a.worker_id === workerId ? { ...a, check_in: now, status: 'present' } : a)
        const worker = workers.find(w => w.id === workerId)
        return [...prev, { id: crypto.randomUUID(), worker_id: workerId, date: now.split('T')[0], check_in: now, check_out: null, status: 'present', worker: worker ? { full_name: worker.full_name, role: worker.role, shift: worker.shift } : undefined }]
      })
    })
  }

  async function handleCheckOut(workerId: string) {
    startTransition(async () => {
      const result = await registerAttendance(workerId, 'check_out')
      if ('error' in result && result.error) { setError(result.error); return }
      const now = new Date().toISOString()
      setAttendance(prev => prev.map(a => a.worker_id === workerId ? { ...a, check_out: now } : a))
    })
  }

  async function handleAdvanceSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!advanceWorkerId || !advanceAmount) return
    startTransition(async () => {
      const result = await addAdvance(advanceWorkerId, parseFloat(advanceAmount), advanceDescription)
      if ('error' in result && result.error) { setError(result.error); return }
      setShowAdvanceModal(false)
      setAdvanceWorkerId('')
      setAdvanceAmount('')
      setAdvanceDescription('')
    })
  }

  // Build attendance map for quick lookup
  const attendanceMap = new Map(attendance.map(a => [a.worker_id, a]))

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['personal', 'asistencia'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            {tab === 'personal' ? 'Personal' : 'Asistencia hoy'}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* TAB: Personal */}
      {activeTab === 'personal' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Personal ({workers.length})
            </h2>
            <button
              onClick={handleNew}
              className="flex items-center gap-2 bg-hotel text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              Nuevo trabajador
            </button>
          </div>

          {workers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No hay trabajadores registrados</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {workers.map(worker => (
                <WorkerCard
                  key={worker.id}
                  worker={worker}
                  onEdit={() => handleEdit(worker)}
                  onDelete={() => setShowDeleteConfirm(worker.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: Asistencia */}
      {activeTab === 'asistencia' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Asistencia</h2>
              <p className="text-xs text-gray-500 capitalize">{today}</p>
            </div>
            <button
              onClick={() => setShowAdvanceModal(true)}
              className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
            >
              <Wallet className="h-4 w-4" />
              Adelanto
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Trabajador</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Rol</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Check-in</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Check-out</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {workers.map(worker => {
                    const att = attendanceMap.get(worker.id)
                    const status = att?.status ?? 'absent'
                    return (
                      <tr key={worker.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0', avatarColor(worker.full_name))}>
                              {getInitials(worker.full_name)}
                            </div>
                            <span className="font-medium text-gray-800">{worker.full_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', ROLE_COLORS[worker.role] ?? ROLE_COLORS.otro)}>
                            {worker.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{formatTime(att?.check_in ?? null)}</td>
                        <td className="px-4 py-3 text-gray-700">{formatTime(att?.check_out ?? null)}</td>
                        <td className="px-4 py-3">
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[status] ?? STATUS_COLORS.absent)}>
                            {STATUS_LABELS[status] ?? status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {!att?.check_in ? (
                              <button
                                onClick={() => handleCheckIn(worker.id)}
                                disabled={isPending}
                                className="flex items-center gap-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2.5 py-1 rounded-md font-medium transition-colors disabled:opacity-50"
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                                Check-in
                              </button>
                            ) : !att?.check_out ? (
                              <button
                                onClick={() => handleCheckOut(worker.id)}
                                disabled={isPending}
                                className="flex items-center gap-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 px-2.5 py-1 rounded-md font-medium transition-colors disabled:opacity-50"
                              >
                                <UserX className="h-3.5 w-3.5" />
                                Check-out
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                Completado
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Worker Modal */}
      {showWorkerModal && (
        <WorkerModal
          worker={editingWorker}
          onClose={() => setShowWorkerModal(false)}
          onSubmit={handleWorkerSubmit}
          isPending={isPending}
        />
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-2">¿Eliminar trabajador?</h3>
            <p className="text-sm text-gray-500 mb-4">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={isPending}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advance Modal */}
      {showAdvanceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Registrar adelanto</h3>
              <button onClick={() => setShowAdvanceModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleAdvanceSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trabajador</label>
                <select
                  value={advanceWorkerId}
                  onChange={e => setAdvanceWorkerId(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel"
                >
                  <option value="">Seleccionar...</option>
                  {workers.map(w => <option key={w.id} value={w.id}>{w.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto (S/)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={advanceAmount}
                  onChange={e => setAdvanceAmount(e.target.value)}
                  required
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input
                  type="text"
                  value={advanceDescription}
                  onChange={e => setAdvanceDescription(e.target.value)}
                  placeholder="Motivo del adelanto..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdvanceModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="flex-1 bg-amber-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50">
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function WorkerCard({
  worker,
  onEdit,
  onDelete,
}: {
  worker: Worker
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className={cn('bg-white rounded-xl border p-4 space-y-3', worker.active ? 'border-gray-200' : 'border-gray-100 opacity-60')}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0', avatarColor(worker.full_name))}>
            {getInitials(worker.full_name)}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm leading-tight">{worker.full_name}</p>
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', ROLE_COLORS[worker.role] ?? ROLE_COLORS.otro)}>
              {worker.role}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <ShiftIcon shift={worker.shift} />
          {SHIFT_OPTIONS.find(s => s.value === worker.shift)?.label ?? worker.shift}
        </span>
        {worker.phone && <span>📞 {worker.phone}</span>}
      </div>
      <div className="flex items-center justify-between">
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', worker.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
          {worker.active ? 'Activo' : 'Inactivo'}
        </span>
        {worker.salary && (
          <span className="text-xs text-gray-500">S/ {worker.salary.toLocaleString('es-PE')}/mes</span>
        )}
      </div>
    </div>
  )
}

function WorkerModal({
  worker,
  onClose,
  onSubmit,
  isPending,
}: {
  worker: Worker | null
  onClose: () => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isPending: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="font-semibold text-gray-900">
            {worker ? 'Editar trabajador' : 'Nuevo trabajador'}
          </h3>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          {worker && <input type="hidden" name="id" value={worker.id} />}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
              <input name="full_name" required defaultValue={worker?.full_name ?? ''} placeholder="Juan Pérez" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
              <select name="role" required defaultValue={worker?.role ?? 'recepcionista'} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel">
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Turno *</label>
              <select name="shift" required defaultValue={worker?.shift ?? 'manana'} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel">
                {SHIFT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input name="phone" defaultValue={worker?.phone ?? ''} placeholder="999 999 999" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" type="email" defaultValue={worker?.email ?? ''} placeholder="correo@ejemplo.com" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salario (S/)</label>
              <input name="salary" type="number" step="0.01" min="0" defaultValue={worker?.salary ?? ''} placeholder="1200.00" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° Documento</label>
              <input name="document_number" defaultValue={worker?.document_number ?? ''} placeholder="DNI / RUC" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel" />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="hidden" name="active" value="false" />
              <input
                type="checkbox"
                name="active"
                id="active"
                value="true"
                defaultChecked={worker?.active ?? true}
                className="rounded"
              />
              <label htmlFor="active" className="text-sm text-gray-700">Trabajador activo</label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className="flex-1 bg-hotel text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {isPending ? 'Guardando...' : worker ? 'Guardar cambios' : 'Crear trabajador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
