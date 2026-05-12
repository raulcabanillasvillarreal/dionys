import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret')

  if (secret !== process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { event, business, payload } = body

  // TODO: dispatch por business + event
  console.log(`[n8n webhook] business=${business} event=${event}`, payload)

  return NextResponse.json({ ok: true })
}
