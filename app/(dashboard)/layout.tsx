import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserBusinesses } from '@/lib/actions/user'
import { Sidebar } from '@/components/shared/sidebar'
import { LogoutButton } from '@/components/shared/logout-button'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const businesses = await getUserBusinesses()

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar businesses={businesses} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-500">{user.email}</span>
          <LogoutButton />
        </header>

        <main className="flex-1 overflow-hidden p-6 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  )
}
