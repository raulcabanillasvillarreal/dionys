'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, Package, Users, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserBusiness } from '@/lib/actions/user'

const ICONS: Record<string, React.ElementType> = {
  hotel: Building2,
  importaciones: Package,
  club: Users,
}

const COLORS: Record<string, string> = {
  hotel: 'text-hotel',
  importaciones: 'text-importaciones',
  club: 'text-club',
}

export function Sidebar({ businesses }: { businesses: UserBusiness[] }) {
  const pathname = usePathname()

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="px-5 py-4 border-b border-gray-200">
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-bold text-gray-900 hover:text-gray-600 transition-colors"
        >
          <LayoutGrid size={18} className="text-gray-400" />
          Dionys CRM
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {businesses.map(({ slug, name }) => {
          const Icon = ICONS[slug] ?? LayoutGrid
          const color = COLORS[slug] ?? 'text-gray-500'
          const href = `/${slug}`
          const active = pathname.startsWith(href)

          return (
            <Link
              key={slug}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              <Icon size={18} className={active ? color : 'text-gray-400'} />
              {name}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <p className="text-xs text-gray-400 px-3">
          {businesses.length} empresa{businesses.length !== 1 ? 's' : ''} asignada{businesses.length !== 1 ? 's' : ''}
        </p>
      </div>
    </aside>
  )
}
