'use client'

import { cn, formatCurrency } from '@/lib/utils'
import { Minus, Plus, Trash2, ShoppingCart, Banknote, CreditCard, ArrowUpRight, Home } from 'lucide-react'

export interface CartItem {
  productId: string
  productName: string
  unitPrice: number
  quantity: number
}

type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'yape' | 'plin'

interface ActiveRoom {
  id: string
  number: string
}

interface CartProps {
  items: CartItem[]
  onUpdateQuantity: (productId: string, delta: number) => void
  onRemove: (productId: string) => void
  discount: number
  onDiscountChange: (v: number) => void
  paymentMethod: PaymentMethod
  onPaymentMethodChange: (m: PaymentMethod) => void
  chargeToRoom: boolean
  onChargeToRoomChange: (v: boolean) => void
  selectedRoomId: string | null
  onRoomChange: (roomId: string) => void
  activeRooms: ActiveRoom[]
  onCheckout: () => void
  isLoading: boolean
  successAnim: boolean
  onViewOrders: () => void
}

const PM_CONFIG: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { id: 'efectivo', label: 'Efectivo', icon: <Banknote className="w-4 h-4" /> },
  { id: 'tarjeta', label: 'Tarjeta', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'transferencia', label: 'Transferencia', icon: <ArrowUpRight className="w-4 h-4" /> },
  { id: 'yape', label: 'Yape', icon: <span className="text-xs font-bold text-purple-600">Y</span> },
  { id: 'plin', label: 'Plin', icon: <span className="text-xs font-bold text-green-600">P</span> },
]

export function Cart({
  items,
  onUpdateQuantity,
  onRemove,
  discount,
  onDiscountChange,
  paymentMethod,
  onPaymentMethodChange,
  chargeToRoom,
  onChargeToRoomChange,
  selectedRoomId,
  onRoomChange,
  activeRooms,
  onCheckout,
  isLoading,
  successAnim,
  onViewOrders,
}: CartProps) {
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const discountAmount = subtotal * (discount / 100)
  const total = subtotal - discountAmount

  return (
    <div className="flex flex-col h-full border-l border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-hotel" />
          <h2 className="font-semibold text-gray-800 text-sm">Pedido</h2>
          {items.length > 0 && (
            <span className="bg-hotel text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {items.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </div>
        <button
          onClick={onViewOrders}
          className="text-xs text-hotel hover:text-hotel/80 font-medium"
        >
          Ver historial
        </button>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-2">
            <ShoppingCart className="w-8 h-8 opacity-30" />
            <span>Agrega productos al pedido</span>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.productId} className="flex items-center gap-2 py-2 border-b border-gray-100">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.productName}</p>
                <p className="text-xs text-gray-500">{formatCurrency(item.unitPrice)} c/u</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateQuantity(item.productId, -1)}
                  className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.productId, 1)}
                  className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="text-right min-w-[60px]">
                <p className="text-sm font-bold text-gray-800">{formatCurrency(item.unitPrice * item.quantity)}</p>
              </div>
              <button
                onClick={() => onRemove(item.productId)}
                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Bottom section */}
      <div className="border-t px-4 pt-3 pb-4 space-y-3">
        {/* Subtotal / discount / total */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-600">Descuento (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-hotel"
              value={discount}
              onChange={(e) => onDiscountChange(Math.min(100, Math.max(0, Number(e.target.value))))}
            />
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-red-500">
              <span>- Descuento</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-200 mt-1">
            <span>Total</span>
            <span className="text-hotel">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Payment method */}
        <div>
          <p className="text-xs font-medium text-gray-600 mb-1.5">Método de pago</p>
          <div className="grid grid-cols-5 gap-1">
            {PM_CONFIG.map((pm) => (
              <button
                key={pm.id}
                onClick={() => onPaymentMethodChange(pm.id)}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2 rounded-lg border text-[10px] font-medium transition-colors',
                  paymentMethod === pm.id
                    ? 'bg-hotel text-white border-hotel'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-hotel'
                )}
              >
                {pm.icon}
                {pm.label}
              </button>
            ))}
          </div>
        </div>

        {/* Charge to room toggle */}
        <div>
          <button
            onClick={() => onChargeToRoomChange(!chargeToRoom)}
            className={cn(
              'flex items-center gap-2 w-full px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
              chargeToRoom
                ? 'bg-hotel/10 text-hotel border-hotel'
                : 'bg-white text-gray-600 border-gray-200 hover:border-hotel'
            )}
          >
            <Home className="w-4 h-4" />
            Cargo a habitación
          </button>
          {chargeToRoom && (
            <select
              value={selectedRoomId ?? ''}
              onChange={(e) => onRoomChange(e.target.value)}
              className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel"
            >
              <option value="">Seleccionar habitación...</option>
              {activeRooms.map((r) => (
                <option key={r.id} value={r.id}>Hab. {r.number}</option>
              ))}
            </select>
          )}
        </div>

        {/* Checkout button */}
        <button
          onClick={onCheckout}
          disabled={isLoading || items.length === 0 || (chargeToRoom && !selectedRoomId)}
          className={cn(
            'w-full py-3 rounded-xl font-bold text-sm transition-all',
            successAnim
              ? 'bg-green-500 text-white scale-95'
              : 'bg-hotel text-white hover:bg-hotel/90 disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {successAnim ? 'Cobrado!' : isLoading ? 'Procesando...' : `Cobrar ${formatCurrency(total)}`}
        </button>
      </div>
    </div>
  )
}
