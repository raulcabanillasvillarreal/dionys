import { redirect } from 'next/navigation'
import { hasBusinessAccess } from '@/lib/actions/user'

export default async function ImportacionesLayout({ children }: { children: React.ReactNode }) {
  const ok = await hasBusinessAccess('importaciones')
  if (!ok) redirect('/')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-importaciones">Importaciones Dionys</h1>
      </div>
      {children}
    </div>
  )
}
