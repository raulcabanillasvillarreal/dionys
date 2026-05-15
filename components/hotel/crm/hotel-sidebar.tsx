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
  { href: '/hotel/inbox', icon: MessageSquare, label: 'Inbox', desc: 'WhatsApp · Instagram · Email · Facebook' },
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
    <aside className="w-14 bg-gradient-to-b from-slate-950 to-slate-900 flex flex-col items-center py-3 gap-0.5 shrink-0 overflow-y-auto scrollbar-hide border-r border-white/5">
      {/* Logo */}
      <Link
        href="/hotel"
        className="w-9 h-9 bg-gradient-to-br from-hotel to-blue-500 rounded-xl flex items-center justify-center mb-2 shrink-0 shadow-lg hover:shadow-hotel/40 hover:scale-105 transition-all duration-200"
      >
        <span className="text-white font-extrabold text-sm select-none tracking-tight">HD</span>
      </Link>

      <div className="w-6 h-px bg-white/10 mb-1" />

      {NAV.map(({ href, icon: Icon, label, desc, exact }, i) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        const isInbox = href === '/hotel/inbox'
        return (
          <NavItem
            key={href}
            href={href}
            icon={Icon}
            label={label}
            desc={desc}
            active={active}
            index={i}
            badge={isInbox && unreadCount > 0 ? (unreadCount > 9 ? '9+' : String(unreadCount)) : undefined}
          />
        )
      })}

      <div className="flex-1" />

      <div className="w-6 h-px bg-white/10 mb-1" />

      {BOTTOM.map(({ href, icon: Icon, label, desc }, i) => {
        const active = pathname.startsWith(href)
        return (
          <NavItem
            key={href}
            href={href}
            icon={Icon}
            label={label}
            desc={desc}
            active={active}
            index={i}
          />
        )
      })}

      {/* Back to selector */}
      <Link
        href="/"
        className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/10 active:scale-90 transition-all duration-150 group mt-1"
        title="Cambiar empresa"
      >
        <ArrowLeft size={16} />
        <SidebarTooltip label="Cambiar empresa" desc="Volver al selector de negocios" />
      </Link>
    </aside>
  )
}

interface NavItemProps {
  href: string
  icon: React.ElementType
  label: string
  desc?: string
  active: boolean
  index: number
  badge?: string
}

function NavItem({ href, icon: Icon, label, desc, active, badge }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 group',
        active
          ? 'bg-hotel text-white shadow-lg shadow-hotel/30 scale-105'
          : 'text-slate-400 hover:text-white hover:bg-white/10 active:scale-90',
      )}
    >
      {/* Active left accent */}
      {active && (
        <span className="absolute -left-[11px] top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full opacity-80" />
      )}

      <Icon
        size={18}
        strokeWidth={active ? 2.5 : 1.8}
        className={cn(
          'transition-transform duration-150',
          !active && 'group-hover:scale-110',
        )}
      />

      {badge && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold px-0.5 shadow-sm animate-bounce-in">
          {badge}
        </span>
      )}

      <SidebarTooltip label={label} desc={desc} />
    </Link>
  )
}

function SidebarTooltip({ label, desc }: { label: string; desc?: string }) {
  return (
    <div className="absolute left-full ml-3 px-3 py-2.5 bg-slate-900 text-white rounded-xl
      opacity-0 group-hover:opacity-100
      translate-x-1 group-hover:translate-x-0
      pointer-events-none z-[999] shadow-2xl border border-white/10
      transition-all duration-200 ease-out
      select-none min-w-[170px]">
      {/* Arrow */}
      <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-slate-900" />
      <p className="text-xs font-semibold whitespace-nowrap leading-tight">{label}</p>
      {desc && <p className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap leading-tight">{desc}</p>}
    </div>
  )
}
