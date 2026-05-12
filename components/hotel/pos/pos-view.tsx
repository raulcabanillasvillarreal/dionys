'use client'

import { useState, useTransition, useCallback } from 'react'
import { createOrder, getOrders } from '@/lib/actions/pos'
import { ProductGrid, type PosCategory, type PosProduct } from './product-grid'
import { Cart, type CartItem } from './cart'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { X, ShoppingBag } from 'lucide-react'

interface ActiveRoom {
  id: string
  number: string
}

interface POSViewProps {
  categories: PosCategory[]
  products: PosProduct[]
  activeRooms: ActiveRoom[]
}

interface Order {
  id: string
  total: number
  payment_method: string
  created_at: string
  items: { product_name: string; quantity: number; unit_price: number }[]
}

type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'yape' | 'plin'

export function POSView({ categories, products, activeRooms }: POSViewProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo')
  const [chargeToRoom, setChargeToRoom] = useState(false)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [successAnim, setSuccessAnim] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Order history modal
  const [showOrders, setShowOrders] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  const addToCart = useCallback((product: PosProduct) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: 1,
      }]
    })
  }, [])

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((i) => i.productId === productId ? { ...i, quantity: i.quantity + delta } : i)
        .filter((i) => i.quantity > 0)
    )
  }, [])

  const removeItem = useCallback((productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.productId !== productId))
  }, [])

  const handleCheckout = () => {
    if (cartItems.length === 0) return
    setError(null)

    const subtotal = cartItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
    const discountAmount = subtotal * (discount / 100)

    const orderItems = cartItems.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.unitPrice * item.quantity * (discount / 100) / cartItems.length,
    }))

    const roomId = chargeToRoom && selectedRoomId ? selectedRoomId : undefined

    startTransition(async () => {
      const res = await createOrder(orderItems, paymentMethod, roomId)
      if (res && 'error' in res) {
        setError(res.error)
        return
      }
      setSuccessAnim(true)
      setTimeout(() => {
        setSuccessAnim(false)
        setCartItems([])
        setDiscount(0)
        setChargeToRoom(false)
        setSelectedRoomId(null)
      }, 1200)
    })
  }

  const handleViewOrders = async () => {
    setShowOrders(true)
    setLoadingOrders(true)
    const data = await getOrders()
    setOrders(Array.isArray(data) ? data as Order[] : [])
    setLoadingOrders(false)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: product grid (60%) */}
      <div className="flex-[3] flex flex-col overflow-hidden border-r border-gray-200">
        <div className="px-4 pt-4 pb-0">
          <h1 className="text-xl font-bold text-gray-900">Punto de Venta</h1>
          {error && (
            <div className="mt-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
              {error}
            </div>
          )}
        </div>
        <ProductGrid
          categories={categories}
          products={products}
          onAddToCart={addToCart}
        />
      </div>

      {/* Right: cart (40%) */}
      <div className="flex-[2] flex flex-col overflow-hidden">
        <Cart
          items={cartItems}
          onUpdateQuantity={updateQuantity}
          onRemove={removeItem}
          discount={discount}
          onDiscountChange={setDiscount}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          chargeToRoom={chargeToRoom}
          onChargeToRoomChange={setChargeToRoom}
          selectedRoomId={selectedRoomId}
          onRoomChange={setSelectedRoomId}
          activeRooms={activeRooms}
          onCheckout={handleCheckout}
          isLoading={isPending}
          successAnim={successAnim}
          onViewOrders={handleViewOrders}
        />
      </div>

      {/* Order history modal */}
      {showOrders && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowOrders(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-hotel" />
                <h2 className="font-bold text-gray-900">Órdenes de hoy</h2>
              </div>
              <button onClick={() => setShowOrders(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingOrders ? (
                <div className="text-center text-gray-400 py-8 text-sm animate-pulse">Cargando...</div>
              ) : orders.length === 0 ? (
                <div className="text-center text-gray-400 py-8 text-sm">Sin órdenes hoy</div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-gray-400">
                          {new Date(order.created_at).toLocaleTimeString('es-PE', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <p className="text-xs text-gray-500 capitalize mt-0.5">{order.payment_method}</p>
                      </div>
                      <p className="font-bold text-hotel">{formatCurrency(order.total)}</p>
                    </div>
                    <div className="space-y-1">
                      {(order.items ?? []).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-gray-600">
                          <span>{item.product_name} x{item.quantity}</span>
                          <span>{formatCurrency(item.unit_price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
