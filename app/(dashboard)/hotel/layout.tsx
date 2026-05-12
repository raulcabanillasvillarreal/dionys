import { redirect } from 'next/navigation'
import { hasBusinessAccess } from '@/lib/actions/user'
import { HotelSidebar } from '@/components/hotel/crm/hotel-sidebar'
import { getUnreadCount } from '@/lib/actions/whatsapp'

export default async function HotelLayout({ children }: { children: React.ReactNode }) {
  const ok = await hasBusinessAccess('hotel')
  if (!ok) redirect('/')

  const unreadCount = await getUnreadCount()

  return (
    <div className="fixed inset-0 z-40 flex bg-gray-50">
      <HotelSidebar unreadCount={unreadCount} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}
