'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutGrid, BedDouble, MessageSquare, DollarSign, MoreHorizontal,
  CalendarDays, ShoppingCart, Users, CheckSquare, Zap, FileText,
  BarChart2, UserCog, Calendar, Package, Settings, X, ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const MAIN = [
  { href: '/hotel', icon: LayoutGrid, label: 'Pipeline', exact: true },
  { href: '/hotel/mapa', icon: BedDouble, label: 'Mapa' },
  { href: '/hotel/inbox', icon: MessageSquare, label: 'Inbox' },
  { href: '/hotel/caja', icon: DollarSign, label: 'Caja' },
]

const MORE = [
  { href: '/hotel/planning', icon: CalendarDays, label: 'Planning' },
  { href: '/hotel/pos', icon: ShoppingCart, label: 'POS' },
  { href: '/hotel/contactos', icon: Users, label: 'Contactos' },
  { href: '/hotel/tareas', icon: CheckSquare, label: 'Tareas' },
  { href: '/hotel/automatizaciones', icon: Zap, label: 'Automatizaciones' },
  { href: '/hotel/plantillas', icon: FileText, label: 'Plantillas' },
  { href: '/hotel/reportes', icon: BarChart2, label: 'Reportes' },
  { href: '/hotel/trabajadores', icon: UserCog, label: 'Trabajadores' },
  { href: '/hotel/agenda', icon: Calendar, label: 'Agenda' },
  { href: '/hotel/inventario', icon: Package, label: 'Inventario' },
  { href: '/hotel/configuracion', icon: Settings, label: 'Config.' },
]

export function MobileNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isMoreActive = MORE.some(item => pathname.startsWith(item.href))

  return (
    <>
      {/* More drawer */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute bottom-16 inset-x-0 bg-white rounded-t-2xl px-4 pt-4 pb-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-gray-800">Más módulos</span>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {MORE.map(({ href, icon: Icon, label }) => {
                const active = pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors',
                      active ? 'bg-hotel/10 text-hotel' : 'bg-gray-50 text-gray-600 active:bg-gray-100'
                    )}
                  >
                    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                    <span className="text-[10px] font-medium text-center leading-tight">{label}</span>
                  </Link>
                )
              })}
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 text-gray-400 active:bg-gray-100"
              >
                <ArrowLeft size={20} strokeWidth={2} />
                <span className="text-[10px] font-medium text-center leading-tight">Salir</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-slate-900 border-t border-slate-800 md:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-1">
          {MAIN.map(({ href, icon: Icon, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            const isInbox = href === '/hotel/inbox'
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors min-w-0',
                  active ? 'text-white' : 'text-slate-400 active:text-white'
                )}
              >
                {active && (
                  <span className="absolute inset-0 bg-hotel/30 rounded-xl" />
                )}
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-medium relative z-10">{label}</span>
                {isInbox && unreadCount > 0 && (
                  <span className="absolute top-1.5 right-2.5 min-w-[14px] h-3.5 bg-red-500 rounded-full text-white text-[8px] flex items-center justify-center font-bold px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )
          })}

          {/* More button */}
          <button
            onClick={() => setOpen(true)}
            className={cn(
              'relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors min-w-0',
              isMoreActive ? 'text-white' : 'text-slate-400 active:text-white'
            )}
          >
            {isMoreActive && (
              <span className="absolute inset-0 bg-hotel/30 rounded-xl" />
            )}
            <MoreHorizontal size={20} strokeWidth={2} />
            <span className="text-[10px] font-medium relative z-10">Más</span>
          </button>
        </div>
      </nav>
    </>
  )
}
