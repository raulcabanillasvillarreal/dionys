import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET — Meta webhook verification (same as WhatsApp)
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

// POST — Instagram DM messages
export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = createAdminClient()

  const entry = body?.entry?.[0]
  const messaging = entry?.messaging ?? []

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('slug', 'hotel')
    .single()
  if (!business) return NextResponse.json({ ok: true })

  for (const event of messaging) {
    if (!event.message) continue
    const senderId = event.sender?.id as string
    const text = event.message?.text as string | undefined
    const timestamp = event.timestamp as number

    const { data: conv } = await (supabase as any)
      .from('wa_conversations')
      .upsert(
        {
          business_id: business.id,
          phone: `ig:${senderId}`,
          instagram_user_id: senderId,
          channel: 'instagram',
          last_message: text ?? '[Media]',
          last_message_at: new Date(timestamp * 1000).toISOString(),
          status: 'open',
        },
        { onConflict: 'business_id,phone', ignoreDuplicates: false },
      )
      .select('id, lead_id')
      .single()

    if (!conv) continue

    await (supabase as any).rpc('increment_unread', { conv_id: conv.id })

    await supabase.from('wa_messages').insert({
      conversation_id: conv.id,
      wa_message_id: event.message.mid,
      direction: 'inbound',
      type: event.message.attachments ? 'image' : 'text',
      content: text ?? '[Media]',
      status: 'received',
      sent_at: new Date(timestamp * 1000).toISOString(),
    })

    // Auto-create lead if none linked
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
            title: `DM Instagram — ${senderId}`,
            source: 'instagram' as any,
            tags: ['Instagram'],
          })
          .select('id')
          .single()

        if (lead) {
          await supabase
            .from('wa_conversations')
            .update({ lead_id: lead.id })
            .eq('id', conv.id)
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}
