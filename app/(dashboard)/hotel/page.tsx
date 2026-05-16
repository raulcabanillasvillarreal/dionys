import Link from 'next/link'
import {
  LayoutGrid, MessageSquare, Users, CheckSquare, Zap, FileText,
  BedDouble, DollarSign, CalendarDays, ShoppingCart, Package,
  BarChart2, UserCog, Calendar, ArrowRight,
} from 'lucide-react'

const CRM_MODULES = [
  { icon: LayoutGrid, label: 'Pipeline Kanban' },
  { icon: MessageSquare, label: 'Inbox Omnicanal' },
  { icon: Users, label: 'Contactos' },
  { icon: CheckSquare, label: 'Tareas' },
  { icon: Zap, label: 'Automatizaciones' },
  { icon: FileText, label: 'Plantillas' },
]

const ERP_MODULES = [
  { icon: BedDouble, label: 'Mapa de Habitaciones' },
  { icon: CalendarDays, label: 'Planning / Gantt' },
  { icon: DollarSign, label: 'Caja' },
  { icon: ShoppingCart, label: 'Punto de Venta' },
  { icon: Package, label: 'Inventario' },
  { icon: BarChart2, label: 'Reportes' },
  { icon: UserCog, label: 'Trabajadores' },
  { icon: Calendar, label: 'Agenda' },
]

export default function HotelSelectorPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 animate-fade-in">

      {/* Logo + title */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-gradient-to-br from-hotel to-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-hotel/25">
          <span className="text-white font-extrabold text-xl tracking-tight select-none">HD</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Hotel Dionys</h1>
        <p className="text-sm text-gray-400 mt-1.5">Selecciona el módulo con el que deseas trabajar</p>
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">

        {/* CRM */}
        <Link
          href="/hotel/pipeline"
          className="group relative bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-hotel/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden p-6"
        >
          {/* Background accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-hotel to-blue-400" />
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-hotel/5 rounded-full group-hover:scale-150 transition-transform duration-500" />

          <div className="relative">
            {/* Badge */}
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-hotel bg-hotel/10 px-2.5 py-1 rounded-full mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-hotel" />
              CRM
            </span>

            <h2 className="text-lg font-bold text-gray-900 mb-1">Gestión Comercial</h2>
            <p className="text-xs text-gray-400 mb-5 leading-relaxed">
              Leads, comunicaciones con clientes y seguimiento de ventas.
            </p>

            {/* Module list */}
            <div className="space-y-1.5 mb-6">
              {CRM_MODULES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-gray-500">
                  <Icon size={13} className="text-hotel/70 shrink-0" />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-hotel group-hover:gap-3 transition-all duration-200">
              <span>Abrir CRM</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </Link>

        {/* ERP */}
        <Link
          href="/hotel/mapa"
          className="group relative bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-teal-500/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden p-6"
        >
          {/* Background accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-600 to-emerald-400" />
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-teal-500/5 rounded-full group-hover:scale-150 transition-transform duration-500" />

          <div className="relative">
            {/* Badge */}
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
              ERP
            </span>

            <h2 className="text-lg font-bold text-gray-900 mb-1">Operaciones del Hotel</h2>
            <p className="text-xs text-gray-400 mb-5 leading-relaxed">
              Habitaciones, caja, inventario y gestión operativa diaria.
            </p>

            {/* Module list */}
            <div className="space-y-1.5 mb-6">
              {ERP_MODULES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-gray-500">
                  <Icon size={13} className="text-teal-600/70 shrink-0" />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 group-hover:gap-3 transition-all duration-200">
              <span>Abrir ERP</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </Link>
      </div>

      {/* Footer hint */}
      <p className="text-[11px] text-gray-300 mt-8">
        Puedes cambiar entre módulos desde la barra lateral en cualquier momento
      </p>
    </div>
  )
}
