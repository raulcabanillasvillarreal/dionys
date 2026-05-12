'use client'

import { useState, useTransition } from 'react'
import { abrirCaja, cerrarCaja, addMovimiento } from '@/lib/actions/caja'
import { cn, formatCurrency } from '@/lib/utils'
import {
  Banknote,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CashRegister {
  id: string
  status: string
  initial_amount: number
  opened_at: string
}

interface Movement {
  id: string
  type: 'ingreso' | 'egreso'
  category: string
  description: string
  amount: number
  payment_method: string
  created_at: string
}

interface Balance {
  ingresos: number
  egresos: number
  saldo: number
  initial_amount: number
}

interface CajaViewProps {
  caja: CashRegister | null
  movimientos: unknown[]
  balance: Balance | null
}

const PAYMENT_METHODS = ['efectivo', 'tarjeta', 'transferencia', 'yape', 'plin', 'otro'] as const
type PaymentMethod = typeof PAYMENT_METHODS[number]

const INGRESO_CATEGORIES = ['habitacion', 'restaurante', 'bar', 'lavanderia', 'otro']
const EGRESO_CATEGORIES = ['insumos', 'mantenimiento', 'servicios', 'personal', 'otro']

const PM_ICONS: Record<string, React.ReactNode> = {
  efectivo: <Banknote className="w-3.5 h-3.5" />,
  tarjeta: <CreditCard className="w-3.5 h-3.5" />,
  transferencia: <ArrowUpRight className="w-3.5 h-3.5" />,
  yape: <span className="text-[10px] font-bold text-purple-600">Y</span>,
  plin: <span className="text-[10px] font-bold text-green-600">P</span>,
  otro: <DollarSign className="w-3.5 h-3.5" />,
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

export function CajaView({ caja, movimientos, balance }: CajaViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Open caja state
  const [initialAmount, setInitialAmount] = useState('')

  // Movement form state
  const [movType, setMovType] = useState<'ingreso' | 'egreso'>('ingreso')
  const [movCategory, setMovCategory] = useState('habitacion')
  const [movDescription, setMovDescription] = useState('')
  const [movAmount, setMovAmount] = useState('')
  const [movMethod, setMovMethod] = useState<PaymentMethod>('efectivo')

  // Close caja state
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [closingAmount, setClosingAmount] = useState('')
  const [closingNotes, setClosingNotes] = useState('')

  const movements = movimientos as Movement[]

  const handleAbrirCaja = () => {
    const amount = parseFloat(initialAmount)
    if (isNaN(amount) || amount < 0) { setError('Ingresa un monto válido'); return }
    setError(null)
    startTransition(async () => {
      const res = await abrirCaja(amount)
      if (res && 'error' in res) { setError(res.error); return }
      router.refresh()
    })
  }

  const handleAddMovimiento = () => {
    const amount = parseFloat(movAmount)
    if (!caja) return
    if (isNaN(amount) || amount <= 0) { setError('Monto inválido'); return }
    if (!movDescription.trim()) { setError('Ingresa una descripción'); return }
    setError(null)
    startTransition(async () => {
      const res = await addMovimiento({
        registerId: caja.id,
        type: movType,
        category: movCategory,
        description: movDescription.trim(),
        amount,
        paymentMethod: movMethod,
      })
      if (res && 'error' in res) { setError(res.error); return }
      setMovDescription('')
      setMovAmount('')
      router.refresh()
    })
  }

  const handleCerrarCaja = () => {
    if (!caja) return
    const amount = parseFloat(closingAmount)
    if (isNaN(amount) || amount < 0) { setError('Ingresa el monto de cierre'); return }
    setError(null)
    startTransition(async () => {
      const res = await cerrarCaja(caja.id, amount, closingNotes || undefined)
      if (res && 'error' in res) { setError(res.error); return }
      setShowCloseModal(false)
      router.refresh()
    })
  }

  // NO open register
  if (!caja) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 w-full max-w-sm text-center space-y-5">
          <div className="w-14 h-14 bg-hotel/10 rounded-full flex items-center justify-center mx-auto">
            <Wallet className="w-7 h-7 text-hotel" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Abrir Caja</h2>
            <p className="text-sm text-gray-500 mt-1">Ingresa el monto inicial en efectivo para comenzar el turno.</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <input
            type="number"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-hotel"
            placeholder="S/. 0.00"
            value={initialAmount}
            onChange={(e) => setInitialAmount(e.target.value)}
          />
          <button
            onClick={handleAbrirCaja}
            disabled={isPending}
            className="w-full bg-hotel text-white rounded-xl py-3 font-semibold text-sm hover:bg-hotel/90 disabled:opacity-50 transition-colors"
          >
            Abrir Caja
          </button>
        </div>
      </div>
    )
  }

  const categories = movType === 'ingreso' ? INGRESO_CATEGORIES : EGRESO_CATEGORIES

  return (
    <div className="flex flex-col h-full p-5 gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Caja</h1>
          <p className="text-sm text-gray-500">
            Abierta a las {formatTime(caja.opened_at)}
          </p>
        </div>
        <button
          onClick={() => setShowCloseModal(true)}
          className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 rounded-xl px-4 py-2 text-sm font-medium hover:bg-red-100 transition-colors"
        >
          <X className="w-4 h-4" /> Cerrar Caja
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <p className="text-xs text-green-700 font-medium">Saldo Actual</p>
          </div>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(balance?.saldo ?? 0)}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-blue-700 font-medium">Total Ingresos</p>
          </div>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(balance?.ingresos ?? 0)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <p className="text-xs text-red-700 font-medium">Total Egresos</p>
          </div>
          <p className="text-2xl font-bold text-red-700">{formatCurrency(balance?.egresos ?? 0)}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Banknote className="w-4 h-4 text-gray-500" />
            <p className="text-xs text-gray-600 font-medium">Efectivo Inicial</p>
          </div>
          <p className="text-2xl font-bold text-gray-700">{formatCurrency(caja.initial_amount)}</p>
        </div>
      </div>

      {/* Main content: form + movements */}
      <div className="flex gap-5 flex-1 min-h-0">
        {/* Add movement form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 w-80 flex-shrink-0 space-y-4 self-start">
          <h2 className="font-semibold text-gray-800">Nuevo Movimiento</h2>

          {/* Type toggle */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200">
            <button
              onClick={() => { setMovType('ingreso'); setMovCategory('habitacion') }}
              className={cn(
                'flex-1 py-2 text-sm font-medium transition-colors',
                movType === 'ingreso' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              )}
            >
              Ingreso
            </button>
            <button
              onClick={() => { setMovType('egreso'); setMovCategory('insumos') }}
              className={cn(
                'flex-1 py-2 text-sm font-medium transition-colors',
                movType === 'egreso' ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              )}
            >
              Egreso
            </button>
          </div>

          <select
            value={movCategory}
            onChange={(e) => setMovCategory(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hotel capitalize"
          >
            {categories.map((c) => (
              <option key={c} value={c} className="capitalize">{c}</option>
            ))}
          </select>

          <input
            type="text"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hotel"
            placeholder="Descripción"
            value={movDescription}
            onChange={(e) => setMovDescription(e.target.value)}
          />

          <input
            type="number"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hotel"
            placeholder="Monto (S/.)"
            value={movAmount}
            onChange={(e) => setMovAmount(e.target.value)}
          />

          <select
            value={movMethod}
            onChange={(e) => setMovMethod(e.target.value as PaymentMethod)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hotel capitalize"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m} className="capitalize">{m}</option>
            ))}
          </select>

          <button
            onClick={handleAddMovimiento}
            disabled={isPending}
            className="w-full bg-hotel text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-hotel/90 disabled:opacity-50 transition-colors"
          >
            Registrar
          </button>
        </div>

        {/* Movements list */}
        <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-5 flex flex-col min-h-0">
          <h2 className="font-semibold text-gray-800 mb-3">Movimientos de hoy</h2>
          <div className="flex-1 overflow-y-auto space-y-2">
            {movements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                Sin movimientos registrados
              </div>
            ) : (
              movements.map((mov) => (
                <div key={mov.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    mov.type === 'ingreso' ? 'bg-green-100' : 'bg-red-100'
                  )}>
                    {mov.type === 'ingreso'
                      ? <ArrowUpRight className="w-4 h-4 text-green-600" />
                      : <ArrowDownLeft className="w-4 h-4 text-red-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{mov.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-400 capitalize bg-gray-100 px-1.5 py-0.5 rounded-full">{mov.category}</span>
                      <span className="flex items-center gap-1 text-[10px] text-gray-400">
                        {PM_ICONS[mov.payment_method] ?? null}
                        <span className="capitalize">{mov.payment_method}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn(
                      'text-sm font-bold',
                      mov.type === 'ingreso' ? 'text-green-600' : 'text-red-600'
                    )}>
                      {mov.type === 'ingreso' ? '+' : '-'}{formatCurrency(mov.amount)}
                    </p>
                    <p className="text-[10px] text-gray-400">{formatTime(mov.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Close caja modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCloseModal(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900">Cerrar Caja</h2>
            <p className="text-sm text-gray-500">
              Saldo esperado: <strong>{formatCurrency(balance?.saldo ?? 0)}</strong>
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Monto en caja (S/.)</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hotel"
                  placeholder="Ingresa el efectivo contado"
                  value={closingAmount}
                  onChange={(e) => setClosingAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Notas (opcional)</label>
                <textarea
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hotel resize-none"
                  rows={2}
                  placeholder="Observaciones del cierre"
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleCerrarCaja}
                disabled={isPending}
                className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                Confirmar Cierre
              </button>
              <button
                onClick={() => setShowCloseModal(false)}
                className="px-4 border border-gray-200 rounded-xl text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
