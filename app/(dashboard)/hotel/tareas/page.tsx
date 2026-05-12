'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Circle, Plus, Clock } from 'lucide-react'
import { getTasks, toggleTask, createTask } from '@/lib/actions/hotel-crm'
import { cn, formatDate } from '@/lib/utils'
import type { Task } from '@/types/hotel-crm'

export default function TareasPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<'pending' | 'completed'>('pending')
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(true)

  async function reload() {
    setLoading(true)
    const data = await getTasks(filter)
    setTasks(data)
    setLoading(false)
  }

  useEffect(() => { reload() }, [filter])

  async function handleToggle(task: Task) {
    await toggleTask(task.id, !task.completed)
    await reload()
  }

  async function handleAddTask() {
    if (!newTask.trim()) return
    const fd = new FormData()
    fd.set('title', newTask.trim())
    await createTask(fd)
    setNewTask('')
    await reload()
  }

  return (
    <div className="max-w-2xl space-y-4">
      {/* Add task */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-2">
        <input
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddTask()}
          placeholder="Agregar tarea..."
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-hotel"
        />
        <button
          onClick={handleAddTask}
          disabled={!newTask.trim()}
          className="px-3 py-2 bg-hotel text-white rounded-lg text-sm disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center gap-1"
        >
          <Plus size={15} /> Agregar
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(['pending', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {f === 'pending' ? 'Pendientes' : 'Completadas'}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
        {loading ? (
          <p className="text-center text-gray-400 py-10 text-sm">Cargando...</p>
        ) : tasks.length === 0 ? (
          <div className="text-center py-14">
            <CheckCircle2 size={36} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-400 text-sm">
              {filter === 'pending' ? 'No hay tareas pendientes.' : 'No hay tareas completadas.'}
            </p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50/60">
              <button
                onClick={() => handleToggle(task)}
                className="mt-0.5 text-gray-300 hover:text-hotel transition-colors shrink-0"
              >
                {task.completed
                  ? <CheckCircle2 size={20} className="text-hotel" />
                  : <Circle size={20} />
                }
              </button>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm text-gray-900', task.completed && 'line-through text-gray-400')}>
                  {task.title}
                </p>
                {task.lead && (
                  <p className="text-xs text-gray-400 mt-0.5">Lead: {task.lead.title}</p>
                )}
                {task.due_at && (
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <Clock size={11} />
                    {formatDate(task.due_at)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
