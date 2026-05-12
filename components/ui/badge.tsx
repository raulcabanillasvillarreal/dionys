import { cn } from '@/lib/utils'

const colors: Record<string, string> = {
  disponible: 'bg-green-100 text-green-700',
  ocupada: 'bg-red-100 text-red-700',
  reservada: 'bg-blue-100 text-blue-700',
  mantenimiento: 'bg-yellow-100 text-yellow-700',
  confirmada: 'bg-blue-100 text-blue-700',
  pendiente: 'bg-yellow-100 text-yellow-700',
  cancelada: 'bg-red-100 text-red-700',
  completada: 'bg-gray-100 text-gray-600',
  activo: 'bg-green-100 text-green-700',
  suspendido: 'bg-red-100 text-red-700',
  vencido: 'bg-orange-100 text-orange-700',
  baja: 'bg-gray-100 text-gray-600',
}

export function Badge({ value }: { value: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize',
        colors[value] ?? 'bg-gray-100 text-gray-600',
      )}
    >
      {value}
    </span>
  )
}
