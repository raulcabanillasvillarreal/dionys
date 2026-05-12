import { getItems, getMovements, getLowStockItems } from '@/lib/actions/inventario'
import InventarioView from '@/components/hotel/inventario/inventario-view'

export default async function InventarioPage() {
  const [items, movements, lowStock] = await Promise.all([
    getItems(),
    getMovements(),
    getLowStockItems(),
  ])

  return (
    <InventarioView
      initialItems={Array.isArray(items) ? items : []}
      initialMovements={Array.isArray(movements) ? movements : []}
      lowStockCount={Array.isArray(lowStock) ? lowStock.length : 0}
    />
  )
}
