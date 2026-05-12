import { getContacts } from '@/lib/actions/hotel-crm'
import { Mail, Phone, User } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function ContactosPage() {
  const contacts = await getContacts()

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">
          Contactos <span className="text-gray-400 font-normal ml-1">{contacts.length}</span>
        </h2>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-16">
          <User size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">Aún no hay contactos registrados.</p>
          <p className="text-gray-400 text-xs mt-1">Los contactos se crean al agregar un lead en el pipeline.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {contacts.map(contact => {
            const leads = (contact.leads as { id: string; amount: number | null; created_at: string }[]) ?? []
            const totalSpent = leads.reduce((s, l) => s + (l.amount ?? 0), 0)

            return (
              <div key={contact.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/60 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-hotel/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-hotel">
                      {contact.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{contact.full_name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-hotel">
                          <Phone size={11} /> {contact.phone}
                        </a>
                      )}
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-hotel">
                          <Mail size={11} /> {contact.email}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {leads.length} lead{leads.length !== 1 ? 's' : ''}
                  </p>
                  {totalSpent > 0 && (
                    <p className="text-xs text-gray-500">
                      S/ {totalSpent.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">{formatDate(contact.created_at ?? '')}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
