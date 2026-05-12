import { getCajaActual, getMovimientos, getBalanceCaja } from '@/lib/actions/caja'
import { CajaView } from '@/components/hotel/caja/caja-view'

export default async function CajaPage() {
  const caja = await getCajaActual()

  let movimientos: unknown[] = []
  let balance: { ingresos: number; egresos: number; saldo: number; initial_amount: number } | null = null

  if (caja && !('error' in caja) && caja !== null) {
    const [movData, balData] = await Promise.all([
      getMovimientos(caja.id),
      getBalanceCaja(caja.id),
    ])
    movimientos = Array.isArray(movData) ? movData : []
    balance = balData && !('error' in balData) ? (balData as { ingresos: number; egresos: number; saldo: number; initial_amount: number }) : null
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <CajaView
        caja={caja && !('error' in caja) ? caja : null}
        movimientos={movimientos}
        balance={balance}
      />
    </div>
  )
}
