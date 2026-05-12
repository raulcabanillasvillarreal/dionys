import Link from 'next/link'
import { Building2, Package, Users } from 'lucide-react'
import { LogoutButton } from '@/components/shared/logout-button'
import type { UserBusiness } from '@/lib/actions/user'

const CONFIG: Record<string, {
  icon: React.ElementType
  iconColor: string
  borderHover: string
  bgHover: string
  description: string
}> = {
  hotel: {
    icon: Building2,
    iconColor: 'text-blue-700',
    borderHover: 'hover:border-blue-400',
    bgHover: 'hover:bg-blue-50',
    description: 'Reservas, habitaciones, huéspedes y facturación',
  },
  importaciones: {
    icon: Package,
    iconColor: 'text-green-700',
    borderHover: 'hover:border-green-400',
    bgHover: 'hover:bg-green-50',
    description: 'Inventario, proveedores, pedidos y clientes',
  },
  club: {
    icon: Users,
    iconColor: 'text-purple-700',
    borderHover: 'hover:border-purple-400',
    bgHover: 'hover:bg-purple-50',
    description: 'Socios, membresías, eventos y acceso',
  },
}

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Administrador',
  manager: 'Gerente',
  staff: 'Staff',
  readonly: 'Solo lectura',
}

export function BusinessSelector({
  businesses,
  userEmail,
}: {
  businesses: UserBusiness[]
  userEmail: string
}) {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dionys CRM</h1>
            <p className="text-sm text-gray-500 mt-1">
              Bienvenido, <span className="font-medium">{userEmail}</span>
            </p>
          </div>
          <LogoutButton />
        </div>

        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
          Selecciona una empresa
        </p>

        <div className={`grid gap-4 ${businesses.length === 1 ? 'grid-cols-1 max-w-xs' : businesses.length === 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
          {businesses.map(biz => {
            const cfg = CONFIG[biz.slug]
            if (!cfg) return null
            const Icon = cfg.icon

            return (
              <Link
                key={biz.id}
                href={`/${biz.slug}`}
                className={`block bg-white border-2 border-gray-200 rounded-2xl p-6 transition-all ${cfg.borderHover} ${cfg.bgHover} group`}
              >
                <Icon size={30} className={`mb-4 ${cfg.iconColor}`} />
                <h2 className="text-base font-semibold text-gray-900">{biz.name}</h2>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{cfg.description}</p>
                <span className="inline-flex mt-4 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                  {ROLE_LABELS[biz.role] ?? biz.role}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}
