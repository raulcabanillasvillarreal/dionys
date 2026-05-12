'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type UserBusiness = {
  id: string
  name: string
  slug: string
  role: string
}

export async function getUserBusinesses(): Promise<UserBusiness[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const admin = createAdminClient()

  const { data: roles } = await admin
    .from('user_business_roles')
    .select('role, business:businesses(id, name, slug)')
    .eq('user_id', user.id)

  // Bootstrap: si el usuario no tiene roles asignados, devuelve todas las empresas
  // Esto permite que el primer usuario (owner) vea todo sin configuración manual
  if (!roles || roles.length === 0) {
    const { data: all } = await admin
      .from('businesses')
      .select('id, name, slug')
      .order('name')
    return (all ?? []).map(b => ({ ...b, role: 'admin' }))
  }

  return roles
    .filter(r => r.business)
    .map(r => {
      const biz = r.business as { id: string; name: string; slug: string }
      return { id: biz.id, name: biz.name, slug: biz.slug, role: r.role }
    })
}

export async function hasBusinessAccess(slug: string): Promise<boolean> {
  const businesses = await getUserBusinesses()
  return businesses.some(b => b.slug === slug)
}
