import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET — Meta webhook verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WA_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

// POST — Incoming messages
export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = createAdminClient()

  const entry = body?.entry?.[0]
  const changes = entry?.changes?.[0]?.value
  if (!changes) return NextResponse.json({ ok: true })

  // Get business id
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('slug', 'hotel')
    .single()
  if (!business) return NextResponse.json({ ok: true })

  const messages: WaMessage[] = changes.messages ?? []
  const contacts: WaContact[] = changes.contacts ?? []

  for (const msg of messages) {
    const phone = msg.from
    const contact = contacts.find(c => c.wa_id === phone)
    const contactName = contact?.profile?.name ?? null

    // Upsert conversation
    const { data: conv, error: convErr } = await supabase
      .from('wa_conversations')
      .upsert(
        {
          business_id: business.id,
          phone,
          contact_name: contactName,
          last_message: extractText(msg),
          last_message_at: new Date(Number(msg.timestamp) * 1000).toISOString(),
          unread_count: 1,
          status: 'open',
        },
        {
          onConflict: 'business_id,phone',
          ignoreDuplicates: false,
        },
      )
      .select('id, unread_count, lead_id')
      .single()

    if (convErr || !conv) continue

    // Increment unread if already existed
    await (supabase as any).rpc('increment_unread', { conv_id: conv.id })

    // Insert message
    const { data: savedMsg } = await supabase
      .from('wa_messages')
      .insert({
        conversation_id: conv.id,
        wa_message_id: msg.id,
        direction: 'inbound',
        type: msg.type,
        content: extractText(msg),
        media_url: extractMediaUrl(msg),
        status: 'received',
        sent_at: new Date(Number(msg.timestamp) * 1000).toISOString(),
      })
      .select('id')
      .single()

    // Auto-create lead if no lead linked yet
    if (!conv.lead_id) {
      await autoCreateLead(supabase, business.id, conv.id, phone, contactName)
    }

    // Run automations
    await runAutomations(supabase, business.id, conv.id, conv.lead_id, msg, savedMsg?.id)
  }

  // Handle status updates
  const statuses: WaStatus[] = changes.statuses ?? []
  for (const s of statuses) {
    await supabase
      .from('wa_messages')
      .update({ status: s.status })
      .eq('wa_message_id', s.id)
  }

  return NextResponse.json({ ok: true })
}

// ---- helpers ----

function extractText(msg: WaMessage): string {
  if (msg.type === 'text') return msg.text?.body ?? ''
  if (msg.type === 'image') return '[Imagen]'
  if (msg.type === 'audio') return '[Audio]'
  if (msg.type === 'video') return '[Video]'
  if (msg.type === 'document') return '[Documento]'
  if (msg.type === 'location') return '[Ubicación]'
  if (msg.type === 'sticker') return '[Sticker]'
  return `[${msg.type}]`
}

function extractMediaUrl(msg: WaMessage): string | null {
  return msg.image?.id ?? msg.audio?.id ?? msg.video?.id ?? msg.document?.id ?? null
}

async function autoCreateLead(
  supabase: ReturnType<typeof createAdminClient>,
  businessId: string,
  convId: string,
  phone: string,
  name: string | null,
) {
  // Find first pipeline stage
  const { data: stage } = await supabase
    .from('pipeline_stages')
    .select('id')
    .eq('business_id', businessId)
    .order('position')
    .limit(1)
    .single()
  if (!stage) return

  // Upsert guest
  const { data: guest } = await supabase
    .from('guests')
    .upsert(
      { business_id: businessId, full_name: name ?? phone, phone },
      { onConflict: 'business_id,phone', ignoreDuplicates: false },
    )
    .select('id')
    .single()

  // Create lead
  const { data: lead } = await supabase
    .from('leads')
    .insert({
      business_id: businessId,
      stage_id: stage.id,
      guest_id: guest?.id ?? null,
      title: name ? `Consulta de ${name}` : `Consulta de ${phone}`,
      source: 'whatsapp',
      tags: ['WhatsApp'],
    })
    .select('id')
    .single()

  if (lead) {
    await supabase
      .from('wa_conversations')
      .update({ lead_id: lead.id, contact_name: name })
      .eq('id', convId)
  }
}

async function runAutomations(
  supabase: ReturnType<typeof createAdminClient>,
  businessId: string,
  convId: string,
  leadId: string | null,
  msg: WaMessage,
  msgId?: string,
) {
  const { data: automations } = await supabase
    .from('automations')
    .select('*')
    .eq('business_id', businessId)
    .eq('active', true)
    .in('trigger_type', ['new_whatsapp', 'first_whatsapp'])

  if (!automations) return

  for (const auto of automations) {
    if (auto.trigger_type === 'new_whatsapp') {
      await executeActions(supabase, businessId, convId, leadId, auto.actions as unknown as AutoAction[])
    }
  }
}

async function executeActions(
  supabase: ReturnType<typeof createAdminClient>,
  businessId: string,
  convId: string,
  leadId: string | null,
  actions: AutoAction[],
) {
  for (const action of actions) {
    if (action.type === 'add_tag' && leadId) {
      const { data: lead } = await supabase.from('leads').select('tags').eq('id', leadId).single()
      const tags = [...new Set([...(lead?.tags ?? []), action.tag].filter(Boolean) as string[])]
      await supabase.from('leads').update({ tags }).eq('id', leadId)
    }
  }
}

// ---- types ----
interface WaMessage {
  id: string
  from: string
  timestamp: string
  type: string
  text?: { body: string }
  image?: { id: string }
  audio?: { id: string }
  video?: { id: string }
  document?: { id: string }
}
interface WaContact { wa_id: string; profile?: { name?: string } }
interface WaStatus { id: string; status: string }
interface AutoAction { type: string; tag?: string; template_name?: string; stage_name?: string }
