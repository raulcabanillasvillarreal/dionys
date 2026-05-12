'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, Users, CheckSquare, BedDouble, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/hotel', label: 'Pipeline', icon: LayoutGrid, exact: true },
  { href: '/hotel/contactos', label: 'Contactos', icon: Users },
  { href: '/hotel/tareas', label: 'Tareas', icon: CheckSquare },
  { href: '/hotel/habitaciones', label: 'Habitaciones', icon: BedDouble },
  { href: '/hotel/reportes', label: 'Reportes', icon: BarChart2 },
]

export function HotelNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-0.5 border-b border-gray-200 mt-3">
      {tabs.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              active
                ? 'border-hotel text-hotel'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300',
            )}
          >
            <Icon size={14} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
