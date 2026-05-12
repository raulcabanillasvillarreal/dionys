import { redirect } from 'next/navigation'
import { hasBusinessAccess } from '@/lib/actions/user'
import { HotelSidebar } from '@/components/hotel/crm/hotel-sidebar'
import { MobileNav } from '@/components/hotel/crm/mobile-nav'
import { getUnreadCount } from '@/lib/actions/whatsapp'

export default async function HotelLayout({ children }: { children: React.ReactNode }) {
  const ok = await hasBusinessAccess('hotel')
  if (!ok) redirect('/')

  const unreadCount = await getUnreadCount()

  return (
    <div className="fixed inset-0 z-40 flex bg-gray-50">
      {/* Sidebar — oculto en mobile */}
      <div className="hidden md:flex">
        <HotelSidebar unreadCount={unreadCount} />
      </div>

      {/* Contenido principal — padding-bottom en mobile para el bottom nav */}
      <div className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        {children}
      </div>

      {/* Bottom nav — solo en mobile */}
      <MobileNav unreadCount={unreadCount} />
    </div>
  )
}
