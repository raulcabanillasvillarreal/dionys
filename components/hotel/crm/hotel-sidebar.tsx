'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid, MessageSquare, Users, CheckSquare,
  Zap, FileText, BarChart2, Settings, ArrowLeft,
  BedDouble, DollarSign, CalendarDays, ShoppingCart,
  UserCog, Calendar, Package,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/hotel', icon: LayoutGrid, label: 'Pipeline', desc: 'Kanban de leads y reservas', exact: true },
  { href: '/hotel/mapa', icon: BedDouble, label: 'Mapa de Habitaciones', desc: '5 pisos · estado en tiempo real' },
  { href: '/hotel/inbox', icon: MessageSquare, label: 'Inbox', desc: 'WhatsApp · Instagram · Email' },
  { href: '/hotel/planning', icon: CalendarDays, label: 'Planning / Gantt', desc: 'Cronograma de habitaciones' },
  { href: '/hotel/caja', icon: DollarSign, label: 'Caja', desc: 'Apertura, movimientos y balance' },
  { href: '/hotel/pos', icon: ShoppingCart, label: 'Punto de Venta', desc: 'Venta de productos y servicios' },
  { href: '/hotel/contactos', icon: Users, label: 'Contactos', desc: 'Directorio de huéspedes' },
  { href: '/hotel/tareas', icon: CheckSquare, label: 'Tareas', desc: 'Pendientes del equipo' },
  { href: '/hotel/automatizaciones', icon: Zap, label: 'Automatizaciones', desc: 'Flujos automáticos con n8n' },
  { href: '/hotel/plantillas', icon: FileText, label: 'Plantillas', desc: 'Mensajes predefinidos WhatsApp' },
]

const BOTTOM = [
  { href: '/hotel/reportes', icon: BarChart2, label: 'Reportes', desc: 'KPIs, gráficas y análisis' },
  { href: '/hotel/trabajadores', icon: UserCog, label: 'Trabajadores', desc: 'Personal, turnos y asistencia' },
  { href: '/hotel/agenda', icon: Calendar, label: 'Agenda', desc: 'Calendario mensual de eventos' },
  { href: '/hotel/inventario', icon: Package, label: 'Inventario', desc: 'Insumos, stock y órdenes' },
  { href: '/hotel/configuracion', icon: Settings, label: 'Configuración', desc: 'APIs e integraciones' },
]

export function HotelSidebar({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname()

  return (
    <aside className="w-14 bg-slate-900 flex flex-col items-center py-3 gap-0.5 shrink-0 overflow-y-auto">
      {/* Logo */}
      <Link href="/hotel" className="w-9 h-9 bg-hotel rounded-xl flex items-center justify-center mb-2 shrink-0 shadow-md">
        <span className="text-white font-extrabold text-sm select-none tracking-tight">HD</span>
      </Link>

      <div className="w-7 h-px bg-white/10 mb-1" />

      {NAV.map(({ href, icon: Icon, label, desc, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        const isInbox = href === '/hotel/inbox'
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'relative w-9 h-9 flex items-center justify-center rounded-xl transition-all group',
              active
                ? 'bg-hotel text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/60',
            )}
          >
            <Icon size={18} strokeWidth={active ? 2.5 : 2} />
            {isInbox && unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold px-0.5">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            <SidebarTooltip label={label} desc={desc} />
          </Link>
        )
      })}

      <div className="flex-1" />

      <div className="w-7 h-px bg-white/10 mb-1" />

      {BOTTOM.map(({ href, icon: Icon, label, desc }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'relative w-9 h-9 flex items-center justify-center rounded-xl transition-all group',
              active ? 'bg-hotel text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/60',
            )}
          >
            <Icon size={18} />
            <SidebarTooltip label={label} desc={desc} />
          </Link>
        )
      })}

      <Link
        href="/"
        className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-700/60 transition-all group mt-1"
      >
        <ArrowLeft size={16} />
        <SidebarTooltip label="Cambiar empresa" desc="Volver al selector de negocios" />
      </Link>
    </aside>
  )
}

function SidebarTooltip({ label, desc }: { label: string; desc?: string }) {
  return (
    <div className="absolute left-full ml-3 px-3 py-2 bg-slate-800 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-[999] shadow-xl border border-slate-700 select-none min-w-[160px]">
      <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-slate-800" />
      <p className="text-xs font-semibold whitespace-nowrap">{label}</p>
      {desc && <p className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">{desc}</p>}
    </div>
  )
}
