'use client'

import { logout } from '@/lib/actions/auth'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
      >
        <LogOut size={16} />
        Salir
      </button>
    </form>
  )
}
