import { redirect } from 'next/navigation'
import { hasBusinessAccess } from '@/lib/actions/user'

export default async function ClubLayout({ children }: { children: React.ReactNode }) {
  const ok = await hasBusinessAccess('club')
  if (!ok) redirect('/')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-club">Club Dionys</h1>
      </div>
      {children}
    </div>
  )
}
