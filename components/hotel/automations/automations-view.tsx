'use client'

import { useState, useTransition } from 'react'
import { Plus, Zap, Trash2, Pencil, X, ToggleLeft, ToggleRight } from 'lucide-react'
import { upsertAutomation, deleteAutomation, toggleAutomation } from '@/lib/actions/whatsapp'
import { useRouter } from 'next/navigation'

interface Automation {
  id: string
  name: string
  description: string | null
  active: boolean
  trigger_type: string
  executions_count: number
  last_executed_at: string | null
}

const TRIGGER_LABELS: Record<string, string> = {
  new_whatsapp: 'Nuevo mensaje de WhatsApp',
  first_whatsapp: 'Primer mensaje de contacto nuevo',
  no_reply: 'Sin respuesta (tiempo definido)',
  lead_created: 'Lead creado',
  lead_moved: 'Lead movido de etapa',
  task_due: 'Tarea vencida',
}

export function AutomationsView({ initialAutomations }: { initialAutomations: Automation[] }) {
  const [automations, setAutomations] = useState<Automation[]>(initialAutomations)
  const [editing, setEditing] = useState<Automation | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleToggle(auto: Automation) {
    setAutomations(prev => prev.map(a => a.id === auto.id ? { ...a, active: !a.active } : a))
    startTransition(() => toggleAutomation(auto.id, !auto.active))
  }

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta automatización?')) return
    setAutomations(prev => prev.filter(a => a.id !== id))
    startTransition(() => deleteAutomation(id))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await upsertAutomation(formData)
      if (!res?.error) {
        setShowForm(false)
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-col h-full p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Automatizaciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">Reglas automáticas para tu CRM y WhatsApp</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-hotel text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={15} />
          Nueva automatización
        </button>
      </div>

      {/* List */}
      <div className="space-y-3 flex-1 overflow-y-auto">
        {automations.map(auto => (
          <div key={auto.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${auto.active ? 'bg-hotel/10' : 'bg-gray-100'}`}>
              <Zap size={18} className={auto.active ? 'text-hotel' : 'text-gray-400'} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{auto.name}</p>
                  {auto.description && <p className="text-xs text-gray-500 mt-0.5">{auto.description}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => { setEditing(auto); setShowForm(true) }} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(auto.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[10px] bg-gray-100 text-gray-600 rounded px-2 py-1">
                  {TRIGGER_LABELS[auto.trigger_type] ?? auto.trigger_type}
                </span>
                <span className="text-[10px] text-gray-400">
                  {auto.executions_count} ejecuciones
                </span>
              </div>
            </div>
            <button onClick={() => handleToggle(auto)} className="shrink-0 mt-0.5">
              {auto.active
                ? <ToggleRight size={28} className="text-hotel" />
                : <ToggleLeft size={28} className="text-gray-300" />}
            </button>
          </div>
        ))}
        {automations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Zap size={40} strokeWidth={1.5} className="mb-3" />
            <p className="text-sm font-medium">Sin automatizaciones</p>
            <p className="text-xs mt-1">Crea reglas para automatizar tu flujo de trabajo</p>
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">{editing ? 'Editar automatización' : 'Nueva automatización'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {editing && <input type="hidden" name="id" value={editing.id} />}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Nombre</label>
                <input
                  name="name"
                  defaultValue={editing?.name}
                  required
                  placeholder="Ej: Bienvenida automática"
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-hotel"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Descripción</label>
                <input
                  name="description"
                  defaultValue={editing?.description ?? ''}
                  placeholder="¿Qué hace esta automatización?"
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-hotel"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Disparador</label>
                <select
                  name="trigger_type"
                  defaultValue={editing?.trigger_type ?? 'new_whatsapp'}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-hotel"
                >
                  {Object.entries(TRIGGER_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Acciones <span className="text-gray-400 font-normal">(JSON)</span>
                </label>
                <textarea
                  name="actions"
                  defaultValue={JSON.stringify([], null, 2)}
                  rows={4}
                  className="w-full text-xs font-mono px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-hotel resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="px-4 py-2 text-sm bg-hotel text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity">
                  {isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
