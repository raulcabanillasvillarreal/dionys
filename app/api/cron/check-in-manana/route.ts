import { NextRequest, NextResponse } from 'next/server'
import { notifyCheckInManana } from '@/lib/services/n8n'
import { sendRecordatorioCheckIn } from '@/lib/services/email'
import { createAdminClient } from '@/lib/supabase/admin'

// Vercel Cron: runs daily at 8am PE time (13:00 UTC)
// vercel.json: { "crons": [{ "path": "/api/cron/check-in-manana", "schedule": "0 13 * * *" }] }
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const manana = new Date()
  manana.setDate(manana.getDate() + 1)
  const fecha = manana.toISOString().split('T')[0]

  const { data: reservas } = await supabase
    .from('reservations')
    .select('id, check_in, check_out, guest:guests(full_name, email, phone)')
    .eq('check_in', fecha)
    .eq('status', 'confirmada')

  const count = reservas?.length ?? 0

  // Send individual reminder emails + bulk n8n notification in parallel
  await Promise.allSettled([
    notifyCheckInManana(),
    ...(reservas ?? []).map(async r => {
      const guest = r.guest as { full_name: string; email: string | null } | null
      if (guest?.email) {
        await sendRecordatorioCheckIn(guest.email, guest.full_name, r.check_in)
      }
    }),
  ])

  return NextResponse.json({ ok: true, fecha, processed: count })
}
