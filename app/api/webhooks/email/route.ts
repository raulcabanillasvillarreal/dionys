import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Called by n8n when an inbound email arrives.
 * n8n reads the mailbox (IMAP), then POSTs here with the parsed message.
 *
 * Expected body:
 * {
 *   from: "John Doe <john@example.com>",
 *   from_email: "john@example.com",
 *   subject: "Consulta de reserva",
 *   text: "...",
 *   html: "...",
 *   message_id: "<unique@msgid>"
 * }
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret')
  if (secret !== process.env.N8N_WEBHOOK_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { from_email, from, subject, text, message_id } = body as {
    from_email: string
    from: string
    subject: string
    text: string
    message_id?: string
  }

  if (!from_email) return NextResponse.json({ error: 'missing from_email' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('slug', 'hotel')
    .single()
  if (!business) return NextResponse.json({ ok: true })

  const { data: conv } = await (supabase as any)
    .from('wa_conversations')
    .upsert(
      {
        business_id: business.id,
        phone: `email:${from_email}`,
        contact_name: from?.replace(/<[^>]+>/, '').trim() || from_email,
        email_from: from_email,
        email_subject: subject,
        channel: 'email',
        last_message: subject,
        last_message_at: new Date().toISOString(),
        status: 'open',
      },
      { onConflict: 'business_id,phone', ignoreDuplicates: false },
    )
    .select('id, lead_id')
    .single()

  if (!conv) return NextResponse.json({ ok: true })

  await (supabase as any).rpc('increment_unread', { conv_id: conv.id })

  await supabase.from('wa_messages').insert({
    conversation_id: conv.id,
    wa_message_id: message_id ?? null,
    direction: 'inbound',
    type: 'text',
    content: text ?? subject,
    status: 'received',
    sent_at: new Date().toISOString(),
  })

  // Auto-create lead
  if (!conv.lead_id) {
    const { data: stage } = await supabase
      .from('pipeline_stages')
      .select('id')
      .eq('business_id', business.id)
      .order('position')
      .limit(1)
      .single()

    if (stage) {
      const { data: lead } = await supabase
        .from('leads')
        .insert({
          business_id: business.id,
          stage_id: stage.id,
          title: subject || `Email de ${from_email}`,
          source: 'email' as any,
          tags: ['Email'],
        })
        .select('id')
        .single()

      if (lead) {
        await supabase.from('wa_conversations').update({ lead_id: lead.id }).eq('id', conv.id)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
