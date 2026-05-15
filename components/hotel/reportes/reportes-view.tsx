'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  DollarSign,
  BarChart2,
  Users,
  LogOut,
  BedDouble,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface KPIData {
  ocupacionPct: number
  ingresoHoy: number
  ingresoMes: number
  huespedes_activos: number
  proximas_salidas: number
  habitaciones_disponibles: number
  deudas_pendientes: number
}

interface OcupacionDia {
  date: string
  ocupadas: number
  disponibles: number
}

interface CanalIngreso {
  channel: string
  total: number
}

interface CashFlowDia {
  date: string
  ingresos: number
  egresos: number
}

interface ProductoTop {
  product_name: string
  total_quantity: number
}

interface ReportesViewProps {
  kpis: KPIData
  ocupacion: OcupacionDia[]
  canales: CanalIngreso[]
  cashflow: CashFlowDia[]
  topProductos: ProductoTop[]
}

const PIE_COLORS = ['#1a4e8a', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#10B981', '#6B7280']

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })
}

export default function ReportesView({
  kpis,
  ocupacion,
  canales,
  cashflow,
  topProductos,
}: ReportesViewProps) {
  const ocupacionData = ocupacion.map(d => ({
    ...d,
    label: formatShortDate(d.date),
  }))

  const cashflowData = cashflow.map(d => ({
    ...d,
    label: formatShortDate(d.date),
  }))

  const topProductosData = topProductos
    .map(p => ({ name: p.product_name, cantidad: p.total_quantity }))
    .slice(0, 8)

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6 pb-10 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Reportes</h1>
        <p className="text-sm text-gray-400 mt-0.5">Análisis y métricas del Hotel Dionys</p>
      </div>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        <KPICard
          icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
          label="Ocupación"
          value={`${kpis.ocupacionPct}%`}
          bgColor="bg-purple-50"
          trend={kpis.ocupacionPct > 70 ? 'up' : kpis.ocupacionPct < 40 ? 'down' : 'neutral'}
        />
        <KPICard
          icon={<DollarSign className="h-5 w-5 text-green-500" />}
          label="Ingreso hoy"
          value={formatCurrency(kpis.ingresoHoy)}
          bgColor="bg-green-50"
        />
        <KPICard
          icon={<BarChart2 className="h-5 w-5 text-blue-500" />}
          label="Ingreso mes"
          value={formatCurrency(kpis.ingresoMes)}
          bgColor="bg-blue-50"
        />
        <KPICard
          icon={<Users className="h-5 w-5 text-orange-500" />}
          label="Huéspedes activos"
          value={kpis.huespedes_activos}
          bgColor="bg-orange-50"
        />
        <KPICard
          icon={<LogOut className="h-5 w-5 text-red-500" />}
          label="Próx. salidas"
          value={kpis.proximas_salidas}
          bgColor="bg-red-50"
        />
        <KPICard
          icon={<BedDouble className="h-5 w-5 text-teal-500" />}
          label="Disponibles"
          value={kpis.habitaciones_disponibles}
          bgColor="bg-teal-50"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ocupación últimos 14 días */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">
            Ocupación últimos 14 días
          </h3>
          {ocupacionData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ocupacionData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={1} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => [
                    value,
                    name === 'ocupadas' ? 'Ocupadas' : 'Disponibles',
                  ]}
                />
                <Legend formatter={v => (v === 'ocupadas' ? 'Ocupadas' : 'Disponibles')} />
                <Bar dataKey="ocupadas" stackId="a" fill="#1a4e8a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="disponibles" stackId="a" fill="#93C5FD" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Ingresos por canal */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">
            Ingresos por canal
          </h3>
          {canales.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={canales.map(c => ({ ...c, name: c.channel }))}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label={({ name, percent }: { name?: string; percent?: number }) =>
                    `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {canales.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={(v: any) => formatCurrency(v as number)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flujo de caja semanal */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">
            Flujo de caja semanal
          </h3>
          {cashflowData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={cashflowData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={(v: any) => formatCurrency(v as number)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ingresos"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Ingresos"
                />
                <Line
                  type="monotone"
                  dataKey="egresos"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Egresos"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top productos vendidos */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">
            Top productos vendidos
          </h3>
          {topProductosData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                layout="vertical"
                data={topProductosData}
                margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  width={110}
                />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#8B5CF6" radius={[0, 4, 4, 0]} name="Unidades" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[260px] text-gray-400 text-sm">
      Sin datos disponibles
    </div>
  )
}

interface KPICardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  bgColor: string
  trend?: 'up' | 'down' | 'neutral'
}

function KPICard({ icon, label, value, bgColor, trend }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`${bgColor} rounded-lg p-2`}>{icon}</div>
        {trend && (
          <span
            className={`text-xs font-medium px-1.5 py-0.5 rounded ${
              trend === 'up'
                ? 'text-green-700 bg-green-100'
                : trend === 'down'
                ? 'text-red-700 bg-red-100'
                : 'text-gray-600 bg-gray-100'
            }`}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—'}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}
