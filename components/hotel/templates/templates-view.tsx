'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, FileText, X } from 'lucide-react'
import { upsertTemplate, deleteTemplate } from '@/lib/actions/whatsapp'
import { useRouter } from 'next/navigation'

interface Template {
  id: string
  name: string
  category: string
  header: string | null
  body: string
  footer: string | null
  variables: string[]
  status: string
}

const CATEGORY_LABELS: Record<string, string> = {
  UTILITY: 'Utilidad',
  MARKETING: 'Marketing',
  AUTHENTICATION: 'Autenticación',
}

export function TemplatesView({ initialTemplates }: { initialTemplates: Template[] }) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)
  const [editing, setEditing] = useState<Template | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function openNew() {
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(t: Template) {
    setEditing(t)
    setShowForm(true)
  }

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta plantilla?')) return
    setTemplates(prev => prev.filter(t => t.id !== id))
    startTransition(() => deleteTemplate(id))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await upsertTemplate(formData)
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
          <h1 className="text-xl font-bold text-gray-900">Plantillas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Mensajes predefinidos para enviar a tus contactos</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-hotel text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={15} />
          Nueva plantilla
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 flex-1 overflow-y-auto">
        {templates.map(t => (
          <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-hotel/10 flex items-center justify-center">
                  <FileText size={15} className="text-hotel" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <span className="text-[10px] text-gray-400">{CATEGORY_LABELS[t.category] ?? t.category}</span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(t)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <Pencil size={13} />
                </button>
                <button onClick={() => handleDelete(t.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            {t.header && <p className="text-xs text-gray-500 font-medium">{t.header}</p>}
            <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-2.5 flex-1">{t.body}</p>
            {t.footer && <p className="text-xs text-gray-400 italic">{t.footer}</p>}
            {t.variables.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {t.variables.map(v => (
                  <span key={v} className="text-[10px] bg-hotel/10 text-hotel rounded px-1.5 py-0.5 font-mono">
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {templates.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
            <FileText size={40} strokeWidth={1.5} className="mb-3" />
            <p className="text-sm font-medium">Sin plantillas</p>
            <p className="text-xs mt-1">Crea tu primera plantilla para agilizar tus conversaciones</p>
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">{editing ? 'Editar plantilla' : 'Nueva plantilla'}</h2>
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
                  placeholder="Ej: Bienvenida"
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-hotel"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Categoría</label>
                <select
                  name="category"
                  defaultValue={editing?.category ?? 'UTILITY'}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-hotel"
                >
                  <option value="UTILITY">Utilidad</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="AUTHENTICATION">Autenticación</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Encabezado (opcional)</label>
                <input
                  name="header"
                  defaultValue={editing?.header ?? ''}
                  placeholder="Texto del encabezado"
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-hotel"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Cuerpo <span className="text-gray-400 font-normal">· Usa {`{{variable}}`} para variables</span>
                </label>
                <textarea
                  name="body"
                  defaultValue={editing?.body}
                  required
                  rows={4}
                  placeholder="Hola {{nombre}}, ¿en qué podemos ayudarte?"
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-hotel resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Pie de página (opcional)</label>
                <input
                  name="footer"
                  defaultValue={editing?.footer ?? ''}
                  placeholder="Texto del pie"
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-hotel"
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
