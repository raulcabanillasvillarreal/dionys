'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

export interface PosCategory {
  id: string
  name: string
  color: string | null
  position: number
}

export interface PosProduct {
  id: string
  name: string
  price: number
  stock: number | null
  category_id: string | null
  category: { name: string; color: string | null } | null
}

interface ProductGridProps {
  categories: PosCategory[]
  products: PosProduct[]
  onAddToCart: (product: PosProduct) => void
}

export function ProductGrid({ categories, products, onAddToCart }: ProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = products.filter((p) => {
    const matchCat = selectedCategory === null || p.category_id === selectedCategory
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="flex flex-col h-full">
      {/* Category tabs */}
      <div className="flex items-center gap-2 flex-wrap px-4 pt-4 pb-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
            selectedCategory === null
              ? 'bg-hotel text-white border-hotel'
              : 'bg-white text-gray-600 border-gray-200 hover:border-hotel hover:text-hotel'
          )}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
              selectedCategory === cat.id
                ? 'bg-hotel text-white border-hotel'
                : 'bg-white text-gray-600 border-gray-200 hover:border-hotel hover:text-hotel'
            )}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: cat.color ?? '#1a4e8a' }}
            />
            {cat.name}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotel"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={onAddToCart} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400 text-sm">
              Sin productos disponibles
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProductCard({ product, onAdd }: { product: PosProduct; onAdd: (p: PosProduct) => void }) {
  const firstLetter = product.name.charAt(0).toUpperCase()
  const color = product.category?.color ?? '#1a4e8a'
  const isLowStock = product.stock !== null && product.stock <= 5
  const isOutOfStock = product.stock !== null && product.stock <= 0

  return (
    <button
      onClick={() => !isOutOfStock && onAdd(product)}
      disabled={isOutOfStock}
      className={cn(
        'flex flex-col bg-white border border-gray-200 rounded-xl p-3 text-left hover:shadow-md hover:border-hotel/40 transition-all',
        isOutOfStock && 'opacity-50 cursor-not-allowed'
      )}
    >
      {/* Image placeholder */}
      <div
        className="w-full aspect-square rounded-lg flex items-center justify-center mb-2 text-white text-2xl font-bold"
        style={{ backgroundColor: color }}
      >
        {firstLetter}
      </div>

      <p className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2">{product.name}</p>
      <p className="text-sm font-bold text-hotel mt-1">{formatCurrency(product.price)}</p>

      {product.stock !== null && (
        <span className={cn(
          'mt-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
          isOutOfStock
            ? 'bg-gray-100 text-gray-500'
            : isLowStock
            ? 'bg-orange-100 text-orange-600'
            : 'bg-green-100 text-green-600'
        )}>
          {isOutOfStock ? 'Sin stock' : isLowStock ? `Stock: ${product.stock}` : `${product.stock} uds`}
        </span>
      )}
    </button>
  )
}
