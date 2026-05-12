'use client'

import { useState, useTransition } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  Search,
  ShoppingCart,
} from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import {
  upsertItem,
  deleteItem,
  addMovement,
  getMovements,
  createPurchaseOrder,
} from '@/lib/actions/inventario'

interface InventoryItem {
  id: string
  name: string
  category: string | null
  unit: string | null
  stock: number
  min_stock: number
  cost_price: number | null
  supplier: string | null
}

interface Movement {
  id: string
  item_id: string
  type: 'entrada' | 'salida' | 'ajuste'
  quantity: number
  unit_cost: number | null
  reason: string | null
  created_at: string
  item?: { name: string; unit: string | null }
}

interface PurchaseOrderItem {
  item_id: string
  item_name: string
  quantity: number
  unit_price: number
}

interface InventarioViewProps {
  initialItems: InventoryItem[]
  initialMovements: Movement[]
  lowStockCount: number
}

const MOVEMENT_COLORS = {
  entrada: 'bg-green-100 text-green-700',
  salida: 'bg-red-100 text-red-700',
  ajuste: 'bg-blue-100 text-blue-700',
}

const MOVEMENT_LABELS = {
  entrada: 'Entrada',
  salida: 'Salida',
  ajuste: 'Ajuste',
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-600',
  enviado: 'bg-blue-100 text-blue-700',
  aprobado: 'bg-purple-100 text-purple-700',
  recibido: 'bg-green-100 text-green-700',
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  enviado: 'Enviado',
  aprobado: 'Aprobado',
  recibido: 'Recibido',
}

const CATEGORIES = ['Limpieza', 'Alimentos', 'Bebidas', 'Amenities', 'Papelería', 'Mantenimiento', 'Lencería', 'Otro']
const UNITS = ['unidad', 'kg', 'litro', 'caja', 'rollo', 'paquete', 'docena', 'metro']

export default function InventarioView({
  initialItems,
  initialMovements,
  lowStockCount: initialLowStockCount,
}: InventarioViewProps) {
  const [activeTab, setActiveTab] = useState<'insumos' | 'movimientos' | 'ordenes'>('insumos')
  const [items, setItems] = useState<InventoryItem[]>(initialItems)
  const [movements, setMovements] = useState<Movement[]>(initialMovements)
  const [lowStockCount, setLowStockCount] = useState(initialLowStockCount)
  const [search, setSearch] = useState('')
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [movementItemId, setMovementItemId] = useState<string>('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [filterItemId, setFilterItemId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Purchase order state
  const [orderSupplier, setOrderSupplier] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [orderExpectedDate, setOrderExpectedDate] = useState('')
  const [orderStatus, setOrderStatus] = useState('borrador')
  const [orderLines, setOrderLines] = useState<PurchaseOrderItem[]>([
    { item_id: '', item_name: '', quantity: 1, unit_price: 0 },
  ])

  // Fake purchase orders list (client-side for MVP)
  const [orders, setOrders] = useState<{
    id: string
    supplier: string
    status: string
    total: number
    notes: string | null
    expected_date: string | null
    item_count: number
    created_at: string
  }[]>([])

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    (item.category ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const filteredMovements = filterItemId
    ? movements.filter(m => m.item_id === filterItemId)
    : movements

  function handleEditItem(item: InventoryItem) {
    setEditingItem(item)
    setShowItemModal(true)
  }

  function handleNewItem() {
    setEditingItem(null)
    setShowItemModal(true)
  }

  async function handleItemSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await upsertItem(fd)
      if (result && 'error' in result) { setError(result.error); return }
      const id = fd.get('id') as string | null
      const updated: InventoryItem = {
        id: id ?? crypto.randomUUID(),
        name: fd.get('name') as string,
        category: (fd.get('category') as string) || null,
        unit: (fd.get('unit') as string) || null,
        stock: parseFloat((fd.get('stock') as string) || '0'),
        min_stock: parseFloat((fd.get('min_stock') as string) || '0'),
        cost_price: fd.get('cost_price') ? parseFloat(fd.get('cost_price') as string) : null,
        supplier: (fd.get('supplier') as string) || null,
      }
      if (id) {
        setItems(prev => prev.map(i => i.id === id ? updated : i))
      } else {
        setItems(prev => [...prev, updated])
      }
      // Recount low stock
      const newItems = id ? items.map(i => i.id === id ? updated : i) : [...items, updated]
      setLowStockCount(newItems.filter(i => (i.stock ?? 0) <= (i.min_stock ?? 0)).length)
      setShowItemModal(false)
    })
  }

  async function handleDeleteItem(id: string) {
    startTransition(async () => {
      const result = await deleteItem(id)
      if (result && 'error' in result) { setError(result.error); return }
      const newItems = items.filter(i => i.id !== id)
      setItems(newItems)
      setLowStockCount(newItems.filter(i => (i.stock ?? 0) <= (i.min_stock ?? 0)).length)
      setShowDeleteConfirm(null)
    })
  }

  async function handleMovementSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const type = fd.get('type') as 'entrada' | 'salida' | 'ajuste'
    const quantity = parseFloat(fd.get('quantity') as string)
    const unitCost = fd.get('unit_cost') ? parseFloat(fd.get('unit_cost') as string) : undefined
    const reason = (fd.get('reason') as string) || undefined
    startTransition(async () => {
      const result = await addMovement(movementItemId, type, quantity, unitCost, reason)
      if (result && 'error' in result) { setError(result.error); return }
      // Update stock locally
      if (result && 'newStock' in result) {
        const ns = result.newStock as number
        setItems(prev => prev.map(i => i.id === movementItemId ? { ...i, stock: ns } : i))
        setLowStockCount(prev => {
          const item = items.find(i => i.id === movementItemId)
          if (!item) return prev
          const wasLow = (item.stock ?? 0) <= (item.min_stock ?? 0)
          const isLow = ns <= (item.min_stock ?? 0)
          if (wasLow && !isLow) return prev - 1
          if (!wasLow && isLow) return prev + 1
          return prev
        })
      }
      // Refresh movements
      const newMovs = await getMovements()
      if (Array.isArray(newMovs)) setMovements(newMovs as Movement[])
      setShowMovementModal(false)
    })
  }

  async function handleOrderSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const validLines = orderLines.filter(l => l.item_name && l.quantity > 0)
    if (!orderSupplier || validLines.length === 0) { setError('Ingresa proveedor y al menos un ítem'); return }
    const fd = new FormData()
    fd.set('supplier', orderSupplier)
    fd.set('status', orderStatus)
    fd.set('notes', orderNotes)
    fd.set('expected_date', orderExpectedDate)
    fd.set('items', JSON.stringify(validLines))
    startTransition(async () => {
      const result = await createPurchaseOrder(fd)
      if (result && 'error' in result) { setError(result.error); return }
      const total = validLines.reduce((s, l) => s + l.quantity * l.unit_price, 0)
      setOrders(prev => [{
        id: (result && 'orderId' in result ? result.orderId : crypto.randomUUID()) as string,
        supplier: orderSupplier,
        status: orderStatus,
        total,
        notes: orderNotes || null,
        expected_date: orderExpectedDate || null,
        item_count: validLines.length,
        created_at: new Date().toISOString(),
      }, ...prev])
      setShowOrderModal(false)
      setOrderSupplier('')
      setOrderNotes('')
      setOrderExpectedDate('')
      setOrderStatus('borrador')
      setOrderLines([{ item_id: '', item_name: '', quantity: 1, unit_price: 0 }])
    })
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['insumos', 'movimientos', 'ordenes'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            {tab === 'insumos' ? 'Insumos' : tab === 'movimientos' ? 'Movimientos' : 'Órdenes de Compra'}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* TAB: Insumos */}
      {activeTab === 'insumos' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar insumos..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hotel"
              />
            </div>
            {lowStockCount > 0 && (
              <button
                onClick={() => setSearch('')}
                className="flex items-center gap-2 text-sm bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-lg font-medium"
              >
                <AlertTriangle className="h-4 w-4" />
                {lowStockCount} bajo stock
              </button>
            )}
            <button
              onClick={handleNewItem}
              className="flex items-center gap-2 bg-hotel text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Nuevo insumo
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Categoría</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Unidad</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Stock</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Mín.</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Costo</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Proveedor</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-gray-400">
                        {search ? 'Sin resultados para tu búsqueda' : 'No hay insumos registrados'}
                      </td>
                    </tr>
                  ) : filteredItems.map(item => {
                    const isLow = (item.stock ?? 0) <= (item.min_stock ?? 0)
                    return (
                      <tr key={item.id} className={cn('hover:bg-gray-50 transition-colors', isLow && 'bg-red-50 hover:bg-red-100')}>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <div className="flex items-center gap-1.5">
                            {isLow && <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                            {item.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{item.category ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{item.unit ?? '—'}</td>
                        <td className={cn('px-4 py-3 text-right font-semibold', isLow ? 'text-red-600' : 'text-gray-800')}>
                          {item.stock}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">{item.min_stock}</td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {item.cost_price != null ? formatCurrency(item.cost_price) : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate">{item.supplier ?? '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => { setMovementItemId(item.id); setShowMovementModal(true) }}
                              title="Agregar movimiento"
                              className="p-1.5 text-gray-400 hover:text-hotel hover:bg-blue-50 rounded-md transition-colors"
                            >
                              <SlidersHorizontal className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleEditItem(item)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setShowDeleteConfirm(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Movimientos */}
      {activeTab === 'movimientos' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={filterItemId}
              onChange={e => setFilterItemId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel"
            >
              <option value="">Todos los insumos</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Insumo</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Cantidad</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Costo unit.</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-400">
                        Sin movimientos registrados
                      </td>
                    </tr>
                  ) : filteredMovements.map(mov => (
                    <tr key={mov.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {formatDate(mov.created_at)}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {mov.item?.name ?? mov.item_id}
                        {mov.item?.unit && <span className="text-gray-400 text-xs ml-1">({mov.item.unit})</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {mov.type === 'entrada' && <ArrowDownToLine className="h-3.5 w-3.5 text-green-600" />}
                          {mov.type === 'salida' && <ArrowUpFromLine className="h-3.5 w-3.5 text-red-600" />}
                          {mov.type === 'ajuste' && <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600" />}
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', MOVEMENT_COLORS[mov.type])}>
                            {MOVEMENT_LABELS[mov.type]}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">{mov.quantity}</td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {mov.unit_cost != null ? formatCurrency(mov.unit_cost) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">{mov.reason ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Órdenes de Compra */}
      {activeTab === 'ordenes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Órdenes de compra ({orders.length})
            </h2>
            <button
              onClick={() => setShowOrderModal(true)}
              className="flex items-center gap-2 bg-hotel text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Nueva orden
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
              <ShoppingCart className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No hay órdenes de compra</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{order.supplier}</p>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', ORDER_STATUS_COLORS[order.status] ?? ORDER_STATUS_COLORS.borrador)}>
                          {ORDER_STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{order.item_count} ítem(s)</span>
                        {order.expected_date && <span>Esperado: {formatDate(order.expected_date)}</span>}
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                      {order.notes && <p className="text-xs text-gray-400">{order.notes}</p>}
                    </div>
                    <p className="text-lg font-bold text-gray-900 shrink-0">{formatCurrency(order.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <ItemModal
          item={editingItem}
          onClose={() => setShowItemModal(false)}
          onSubmit={handleItemSubmit}
          isPending={isPending}
        />
      )}

      {/* Movement Modal */}
      {showMovementModal && (
        <MovementModal
          itemName={items.find(i => i.id === movementItemId)?.name ?? ''}
          onClose={() => setShowMovementModal(false)}
          onSubmit={handleMovementSubmit}
          isPending={isPending}
        />
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-2">¿Eliminar insumo?</h3>
            <p className="text-sm text-gray-500 mb-4">Esta acción eliminará el insumo y no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={() => handleDeleteItem(showDeleteConfirm)} disabled={isPending} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="font-semibold text-gray-900">Nueva orden de compra</h3>
              <button onClick={() => setShowOrderModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleOrderSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label>
                  <input value={orderSupplier} onChange={e => setOrderSupplier(e.target.value)} required placeholder="Nombre del proveedor" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select value={orderStatus} onChange={e => setOrderStatus(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel">
                    {Object.entries(ORDER_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha esperada</label>
                  <input type="date" value={orderExpectedDate} onChange={e => setOrderExpectedDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <textarea value={orderNotes} onChange={e => setOrderNotes(e.target.value)} rows={2} placeholder="Observaciones..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel resize-none" />
                </div>
              </div>

              {/* Order lines */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Ítems</label>
                  <button
                    type="button"
                    onClick={() => setOrderLines(prev => [...prev, { item_id: '', item_name: '', quantity: 1, unit_price: 0 }])}
                    className="text-xs text-hotel hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Agregar ítem
                  </button>
                </div>
                <div className="space-y-2">
                  {orderLines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <select
                          value={line.item_id}
                          onChange={e => {
                            const item = items.find(i => i.id === e.target.value)
                            setOrderLines(prev => prev.map((l, i) => i === idx ? { ...l, item_id: e.target.value, item_name: item?.name ?? '' } : l))
                          }}
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-hotel"
                        >
                          <option value="">Seleccionar insumo</option>
                          {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={e => setOrderLines(prev => prev.map((l, i) => i === idx ? { ...l, quantity: parseFloat(e.target.value) || 1 } : l))}
                          placeholder="Cant."
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-hotel"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.unit_price}
                          onChange={e => setOrderLines(prev => prev.map((l, i) => i === idx ? { ...l, unit_price: parseFloat(e.target.value) || 0 } : l))}
                          placeholder="Precio"
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-hotel"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        {orderLines.length > 1 && (
                          <button type="button" onClick={() => setOrderLines(prev => prev.filter((_, i) => i !== idx))} className="text-gray-300 hover:text-red-500">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-right text-sm font-semibold text-gray-800 mt-2">
                  Total: {formatCurrency(orderLines.reduce((s, l) => s + l.quantity * l.unit_price, 0))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowOrderModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="flex-1 bg-hotel text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
                  {isPending ? 'Guardando...' : 'Crear orden'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function ItemModal({
  item,
  onClose,
  onSubmit,
  isPending,
}: {
  item: InventoryItem | null
  onClose: () => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isPending: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="font-semibold text-gray-900">{item ? 'Editar insumo' : 'Nuevo insumo'}</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          {item && <input type="hidden" name="id" value={item.id} />}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input name="name" required defaultValue={item?.name ?? ''} placeholder="Ej: Jabón de manos" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select name="category" defaultValue={item?.category ?? ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel">
                <option value="">Sin categoría</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
              <select name="unit" defaultValue={item?.unit ?? ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel">
                <option value="">Sin unidad</option>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock actual</label>
              <input name="stock" type="number" min="0" step="0.01" defaultValue={item?.stock ?? 0} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo</label>
              <input name="min_stock" type="number" min="0" step="0.01" defaultValue={item?.min_stock ?? 0} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio costo (S/)</label>
              <input name="cost_price" type="number" min="0" step="0.01" defaultValue={item?.cost_price ?? ''} placeholder="0.00" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
              <input name="supplier" defaultValue={item?.supplier ?? ''} placeholder="Nombre del proveedor" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className="flex-1 bg-hotel text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {isPending ? 'Guardando...' : item ? 'Guardar cambios' : 'Crear insumo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MovementModal({
  itemName,
  onClose,
  onSubmit,
  isPending,
}: {
  itemName: string
  onClose: () => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isPending: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h3 className="font-semibold text-gray-900">Agregar movimiento</h3>
            <p className="text-xs text-gray-500 mt-0.5">{itemName}</p>
          </div>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <select name="type" required defaultValue="entrada" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel">
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
              <option value="ajuste">Ajuste (fijar cantidad)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
              <input name="quantity" type="number" min="0.01" step="0.01" required placeholder="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo unitario</label>
              <input name="unit_cost" type="number" min="0" step="0.01" placeholder="0.00" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <input name="reason" placeholder="Ej: Compra mensual, consumo..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className="flex-1 bg-hotel text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {isPending ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
