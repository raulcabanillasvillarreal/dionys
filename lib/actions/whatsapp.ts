'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendText, sendTemplate } from '@/lib/whatsapp'

async function getHotelId() {
  const s = createAdminClient()
  const { data } = await s.from('businesses').select('id').eq('slug', 'hotel').single()
  if (!data) throw new Error('Hotel not found')
  return data.id
}

export async function getConversations() {
  const supabase = createAdminClient()
  const businessId = await getHotelId()
  const { data } = await supabase
    .from('wa_conversations')
    .select('*')
    .eq('business_id', businessId)
    .order('last_message_at', { ascending: false, nullsFirst: false })
  return data ?? []
}

export async function getMessages(conversationId: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('wa_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('sent_at', { ascending: true })
  return data ?? []
}

export async function getUnreadCount() {
  const supabase = createAdminClient()
  const businessId = await getHotelId()
  const { data } = await supabase
    .from('wa_conversations')
    .select('unread_count')
    .eq('business_id', businessId)
    .eq('status', 'open')
  return (data ?? []).reduce((s, c) => s + (c.unread_count ?? 0), 0)
}

export async function sendMessage(conversationId: string, text: string) {
  const supabase = createAdminClient()

  const { data: conv } = await supabase
    .from('wa_conversations')
    .select('phone')
    .eq('id', conversationId)
    .single()

  if (!conv) return { error: 'Conversation not found' }

  const waResult = await sendText(conv.phone, text)

  await supabase.from('wa_messages').insert({
    conversation_id: conversationId,
    wa_message_id: waResult?.messages?.[0]?.id ?? null,
    direction: 'outbound',
    type: 'text',
    content: text,
    status: waResult ? 'sent' : 'failed',
  })

  await supabase
    .from('wa_conversations')
    .update({ last_message: text, last_message_at: new Date().toISOString() })
    .eq('id', conversationId)

  // Auto-reply simulation — always responds "xd"
  await supabase.from('wa_messages').insert({
    conversation_id: conversationId,
    direction: 'inbound',
    type: 'text',
    content: 'xd',
    status: 'delivered',
    sent_at: new Date(Date.now() + 1000).toISOString(),
  })
  await supabase
    .from('wa_conversations')
    .update({ last_message: 'xd', last_message_at: new Date(Date.now() + 1000).toISOString(), unread_count: 1 })
    .eq('id', conversationId)

  revalidatePath('/hotel/inbox')
  return { ok: true }
}

export async function sendTemplateMessage(conversationId: string, templateName: string, vars: string[]) {
  const supabase = createAdminClient()

  const { data: conv } = await supabase
    .from('wa_conversations')
    .select('phone')
    .eq('id', conversationId)
    .single()

  if (!conv) return { error: 'Conversation not found' }

  await sendTemplate(conv.phone, templateName, 'es_PE', vars)

  await supabase.from('wa_messages').insert({
    conversation_id: conversationId,
    direction: 'outbound',
    type: 'template',
    template_name: templateName,
    content: `[Plantilla: ${templateName}]`,
    status: 'sent',
  })

  await supabase
    .from('wa_conversations')
    .update({ last_message: `[Plantilla: ${templateName}]`, last_message_at: new Date().toISOString() })
    .eq('id', conversationId)

  revalidatePath('/hotel/inbox')
  return { ok: true }
}

export async function getConversationByLeadId(leadId: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('wa_conversations')
    .select('*')
    .eq('lead_id', leadId)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()
  return data
}

export async function markAsRead(conversationId: string) {
  const supabase = createAdminClient()
  await supabase
    .from('wa_conversations')
    .update({ unread_count: 0 })
    .eq('id', conversationId)
}

export async function updateConversationTags(conversationId: string, tags: string[]) {
  const supabase = createAdminClient()
  await supabase.from('wa_conversations').update({ tags }).eq('id', conversationId)
  revalidatePath('/hotel/inbox')
  return { ok: true }
}

export async function resolveConversation(conversationId: string) {
  const supabase = createAdminClient()
  await supabase.from('wa_conversations').update({ status: 'resolved' }).eq('id', conversationId)
  revalidatePath('/hotel/inbox')
}

export async function getTemplates() {
  const supabase = createAdminClient()
  const businessId = await getHotelId()
  const { data } = await supabase
    .from('message_templates')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at')
  return data ?? []
}

export async function upsertTemplate(formData: FormData) {
  const supabase = createAdminClient()
  const businessId = await getHotelId()
  const id = formData.get('id') as string | null
  const body = formData.get('body') as string
  const variables = (body.match(/\{\{(\w+)\}\}/g) ?? []).map(v => v.replace(/\{\{|\}\}/g, ''))

  const data = {
    business_id: businessId,
    name: formData.get('name') as string,
    category: (formData.get('category') as string) || 'UTILITY',
    header: (formData.get('header') as string) || null,
    body,
    footer: (formData.get('footer') as string) || null,
    variables,
  }

  const { error } = id
    ? await supabase.from('message_templates').update(data).eq('id', id)
    : await supabase.from('message_templates').insert(data)

  if (error) return { error: error.message }
  revalidatePath('/hotel/plantillas')
  return { ok: true }
}

export async function deleteTemplate(id: string) {
  const supabase = createAdminClient()
  await supabase.from('message_templates').delete().eq('id', id)
  revalidatePath('/hotel/plantillas')
}

export async function getAutomations() {
  const supabase = createAdminClient()
  const businessId = await getHotelId()
  const { data } = await supabase
    .from('automations')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at')
  return data ?? []
}

export async function toggleAutomation(id: string, active: boolean) {
  const supabase = createAdminClient()
  await supabase.from('automations').update({ active }).eq('id', id)
  revalidatePath('/hotel/automatizaciones')
}

export async function upsertAutomation(formData: FormData) {
  const supabase = createAdminClient()
  const businessId = await getHotelId()
  const id = formData.get('id') as string | null

  const data = {
    business_id: businessId,
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || null,
    trigger_type: formData.get('trigger_type') as string,
    trigger_config: {},
    conditions: [],
    actions: JSON.parse((formData.get('actions') as string) || '[]'),
    active: true,
  }

  const { error } = id
    ? await supabase.from('automations').update(data).eq('id', id)
    : await supabase.from('automations').insert(data)

  if (error) return { error: error.message }
  revalidatePath('/hotel/automatizaciones')
  return { ok: true }
}

export async function deleteAutomation(id: string) {
  const supabase = createAdminClient()
  await supabase.from('automations').delete().eq('id', id)
  revalidatePath('/hotel/automatizaciones')
}
