import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserBusinesses } from '@/lib/actions/user'
import { BusinessSelector } from '@/components/shared/business-selector'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const businesses = await getUserBusinesses()

  if (businesses.length === 1) {
    redirect(`/${businesses[0].slug}`)
  }

  return <BusinessSelector businesses={businesses} userEmail={user.email ?? ''} />
}
