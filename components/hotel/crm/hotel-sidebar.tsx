'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid, MessageSquare, Users, CheckSquare, Zap, FileText,
  BedDouble, DollarSign, CalendarDays, ShoppingCart, UserCog,
  Calendar, Package, BarChart2, Settings, ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── CRM ────────────────────────────────────────────────────────────
const CRM_NAV = [
  { href: '/hotel/pipeline', icon: LayoutGrid,   label: 'Pipeline',         desc: 'Kanban de leads y reservas' },
  { href: '/hotel/inbox',    icon: MessageSquare, label: 'Inbox',            desc: 'WhatsApp · Instagram · Facebook · Email', isInbox: true },
  { href: '/hotel/contactos',icon: Users,         label: 'Contactos',        desc: 'Directorio de huéspedes' },
  { href: '/hotel/tareas',   icon: CheckSquare,   label: 'Tareas',           desc: 'Pendientes del equipo' },
  { href: '/hotel/automatizaciones', icon: Zap,   label: 'Automatizaciones', desc: 'Flujos automáticos con n8n' },
  { href: '/hotel/plantillas', icon: FileText,    label: 'Plantillas',       desc: 'Mensajes predefinidos WhatsApp' },
]

// ─── ERP ────────────────────────────────────────────────────────────
const ERP_NAV = [
  { href: '/hotel/mapa',      icon: BedDouble,    label: 'Habitaciones',  desc: 'Mapa · 5 pisos · tiempo real' },
  { href: '/hotel/reservas',  icon: CalendarDays, label: 'Reservas',      desc: 'Check-in, check-out y estados' },
  { href: '/hotel/planning',  icon: CalendarDays, label: 'Planning',      desc: 'Gantt de habitaciones' },
  { href: '/hotel/caja',      icon: DollarSign,   label: 'Caja',          desc: 'Apertura, movimientos y balance' },
  { href: '/hotel/pos',       icon: ShoppingCart, label: 'Punto de Venta',desc: 'Venta de productos y servicios' },
  { href: '/hotel/inventario',icon: Package,      label: 'Inventario',    desc: 'Insumos, stock y órdenes' },
  { href: '/hotel/reportes',  icon: BarChart2,    label: 'Reportes',      desc: 'KPIs, gráficas y análisis' },
  { href: '/hotel/trabajadores', icon: UserCog,   label: 'Trabajadores',  desc: 'Personal, turnos y asistencia' },
  { href: '/hotel/agenda',    icon: Calendar,     label: 'Agenda',        desc: 'Calendario mensual de eventos' },
  { href: '/hotel/configuracion', icon: Settings, label: 'Configuración', desc: 'APIs e integraciones' },
]

const CRM_PATHS = CRM_NAV.map(n => n.href)
const ERP_PATHS = ERP_NAV.map(n => n.href)

function detectMode(pathname: string): 'crm' | 'erp' | null {
  if (CRM_PATHS.some(p => pathname.startsWith(p))) return 'crm'
  if (ERP_PATHS.some(p => pathname.startsWith(p))) return 'erp'
  return null
}

export function HotelSidebar({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname()
  const mode = detectMode(pathname)

  const nav = mode === 'crm' ? CRM_NAV : mode === 'erp' ? ERP_NAV : []

  return (
    <aside className="w-14 bg-gradient-to-b from-slate-950 to-slate-900 flex flex-col items-center py-3 gap-0.5 shrink-0 overflow-y-auto scrollbar-hide border-r border-white/5">

      {/* Logo */}
      <Link
        href="/hotel"
        className="w-9 h-9 bg-gradient-to-br from-hotel to-blue-400 rounded-xl flex items-center justify-center mb-1 shrink-0 shadow-lg hover:shadow-hotel/40 hover:scale-105 transition-all duration-200"
        title="Selector de módulos"
      >
        <span className="text-white font-extrabold text-sm select-none tracking-tight">HD</span>
      </Link>

      {/* Mode switcher */}
      <div className="flex flex-col gap-0.5 w-10 mb-1">
        <Link
          href="/hotel/pipeline"
          title="CRM — Gestión Comercial"
          className={cn(
            'w-full py-1 rounded-lg text-[9px] font-bold text-center tracking-wider transition-all duration-200',
            mode === 'crm'
              ? 'bg-hotel text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-200 hover:bg-white/10',
          )}
        >
          CRM
        </Link>
        <Link
          href="/hotel/mapa"
          title="ERP — Operaciones del Hotel"
          className={cn(
            'w-full py-1 rounded-lg text-[9px] font-bold text-center tracking-wider transition-all duration-200',
            mode === 'erp'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-200 hover:bg-white/10',
          )}
        >
          ERP
        </Link>
      </div>

      {/* Divider */}
      <div className="w-6 h-px bg-white/10 mb-0.5" />

      {/* Nav items — changes based on mode */}
      {mode === null ? (
        <div className="flex flex-col items-center gap-1 mt-2 px-1">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
        </div>
      ) : (
        nav.map(({ href, icon: Icon, label, desc, isInbox }) => {
          const active = pathname.startsWith(href)
          return (
            <NavItem
              key={href}
              href={href}
              icon={Icon}
              label={label}
              desc={desc}
              active={active}
              mode={mode}
              badge={isInbox && unreadCount > 0 ? (unreadCount > 9 ? '9+' : String(unreadCount)) : undefined}
            />
          )
        })
      )}

      <div className="flex-1" />

      {/* Back to selector */}
      <div className="w-6 h-px bg-white/10 mb-0.5" />
      <Link
        href="/hotel"
        className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/10 active:scale-90 transition-all duration-150 group"
        title="Cambiar módulo"
      >
        <ArrowLeft size={16} />
        <SidebarTooltip label="Selector de módulos" desc="Volver a CRM / ERP" />
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
  mode: 'crm' | 'erp'
  badge?: string
}

function NavItem({ href, icon: Icon, label, desc, active, mode, badge }: NavItemProps) {
  const activeBg = mode === 'crm' ? 'bg-hotel shadow-hotel/30' : 'bg-teal-600 shadow-teal-600/30'

  return (
    <Link
      href={href}
      className={cn(
        'relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 group',
        active
          ? `${activeBg} text-white shadow-lg scale-105`
          : 'text-slate-400 hover:text-white hover:bg-white/10 active:scale-90',
      )}
    >
      {active && (
        <span className="absolute -left-[11px] top-1/2 -translate-y-1/2 w-1 h-5 bg-white/80 rounded-r-full" />
      )}

      <Icon
        size={18}
        strokeWidth={active ? 2.5 : 1.8}
        className={cn('transition-transform duration-150', !active && 'group-hover:scale-110')}
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
      opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0
      pointer-events-none z-[999] shadow-2xl border border-white/10
      transition-all duration-200 ease-out select-none min-w-[170px]">
      <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-slate-900" />
      <p className="text-xs font-semibold whitespace-nowrap leading-tight">{label}</p>
      {desc && <p className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap leading-tight">{desc}</p>}
    </div>
  )
}
