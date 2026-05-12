import {
  getKPIs,
  getOcupacionPorPeriodo,
  getIngresosPorCanal,
  getCashFlowSemanal,
  getProductosTopVentas,
} from '@/lib/actions/reportes'
import ReportesView from '@/components/hotel/reportes/reportes-view'

export default async function ReportesPage() {
  const [kpis, ocupacion, canales, cashflow, topProductos] = await Promise.all([
    getKPIs(),
    getOcupacionPorPeriodo(14),
    getIngresosPorCanal(),
    getCashFlowSemanal(),
    getProductosTopVentas(8),
  ])

  return (
    <div className="h-full overflow-y-auto">
      <ReportesView
        kpis={kpis}
        ocupacion={Array.isArray(ocupacion) ? ocupacion : []}
        canales={Array.isArray(canales) ? canales : []}
        cashflow={Array.isArray(cashflow) ? cashflow : []}
        topProductos={Array.isArray(topProductos) ? topProductos : []}
      />
    </div>
  )
}
