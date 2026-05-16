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
  { href: '/hotel/pipeline', icon: LayoutGrid, label: 'Pipeline' },
  { href: '/hotel/mapa', icon: BedDouble, label: 'Mapa' },
  { href: '/hotel/inbox', icon: MessageSquare, label: 'Inbox' },
  { href: '/hotel/caja', icon: DollarSign, label: 'Caja' },
]

const MORE = [
  { href: '/hotel', icon: LayoutGrid, label: 'Inicio' },
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
      {/* Drawer backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute bottom-16 inset-x-0 bg-white rounded-t-3xl px-4 pt-4 pb-6 shadow-2xl animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-gray-900">Más módulos</span>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {MORE.map(({ href, icon: Icon, label }) => {
                const active = pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-95',
                      active
                        ? 'bg-hotel text-white shadow-md shadow-hotel/25'
                        : 'bg-gray-50 text-gray-600 active:bg-gray-100'
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
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-gray-50 text-gray-400 active:bg-gray-100 active:scale-95 transition-all"
              >
                <ArrowLeft size={20} strokeWidth={2} />
                <span className="text-[10px] font-medium text-center leading-tight">Salir</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-gradient-to-t from-slate-950 to-slate-900 border-t border-white/5 md:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-1">
          {MAIN.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href)
            const isInbox = href === '/hotel/inbox'
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-all active:scale-90 min-w-0',
                  active ? 'text-white' : 'text-slate-500 active:text-white'
                )}
              >
                {active && (
                  <span className="absolute inset-0 bg-hotel/25 rounded-2xl animate-scale-in" />
                )}
                <div className={cn(
                  'relative transition-transform duration-150',
                  active && 'scale-110'
                )}>
                  <Icon size={21} strokeWidth={active ? 2.5 : 2} />
                  {isInbox && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 bg-red-500 rounded-full text-white text-[8px] flex items-center justify-center font-bold px-0.5 shadow-sm animate-bounce-in">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className={cn(
                  'text-[10px] font-semibold relative z-10 transition-all duration-150',
                  active ? 'text-white' : 'text-slate-500'
                )}>
                  {label}
                </span>
              </Link>
            )
          })}

          {/* More button */}
          <button
            onClick={() => setOpen(v => !v)}
            className={cn(
              'relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-all active:scale-90 min-w-0',
              isMoreActive ? 'text-white' : 'text-slate-500 active:text-white'
            )}
          >
            {isMoreActive && (
              <span className="absolute inset-0 bg-hotel/25 rounded-2xl animate-scale-in" />
            )}
            <MoreHorizontal size={21} strokeWidth={open ? 2.5 : 2} className="relative transition-transform duration-200" style={{ transform: open ? 'rotate(90deg)' : 'none' }} />
            <span className={cn(
              'text-[10px] font-semibold relative z-10 transition-all duration-150',
              isMoreActive ? 'text-white' : 'text-slate-500'
            )}>
              Más
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}
