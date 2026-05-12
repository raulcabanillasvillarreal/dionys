import { getConversations, getTemplates } from '@/lib/actions/whatsapp'
import { InboxView } from '@/components/hotel/inbox/inbox-view'

export default async function InboxPage() {
  const [conversations, templates] = await Promise.all([getConversations(), getTemplates()])
  return <InboxView initialConversations={conversations as any} templates={templates as any} />
}
