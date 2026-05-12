import { Resend } from 'resend'

const FROM = process.env.EMAIL_FROM ?? 'Hotel Dionys <noreply@hoteldionyss.com>'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

export async function sendReservaConfirmacion(to: string, reserva: {
  guest_name: string
  room_number: string
  room_type: string
  check_in: string
  check_out: string
  total_amount: number
  nights: number
}) {
  const resend = getResend()
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set, skipping email')
    return null
  }

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `✅ Confirmación de reserva — Hotel Dionys`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="color:#1a4e8a;margin-bottom:4px">Hotel Dionys</h2>
        <p style="color:#6b7280;font-size:13px;margin-top:0">Confirmación de reserva</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
        <p>Hola <strong>${reserva.guest_name}</strong> 👋</p>
        <p>Tu reserva está <strong>confirmada</strong>. Aquí el resumen:</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
          <tr><td style="padding:8px 0;color:#6b7280">Habitación</td><td><strong>${reserva.room_number} — ${reserva.room_type}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Check-in</td><td><strong>${reserva.check_in}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Check-out</td><td><strong>${reserva.check_out}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Noches</td><td><strong>${reserva.nights}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Total</td><td><strong style="color:#1a4e8a">S/ ${reserva.total_amount.toFixed(2)}</strong></td></tr>
        </table>
        <p style="font-size:13px;color:#6b7280">Horario de recepción: 14:00 – 23:00 hrs. Para consultas, responde este correo.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
        <p style="font-size:12px;color:#9ca3af">Hotel Dionys · Perú</p>
      </div>
    `,
  })
  if (error) console.error('[email] Error enviando confirmación:', error)
  return data
}

export async function sendRecordatorioCheckIn(to: string, guestName: string, checkIn: string) {
  const resend = getResend()
  if (!resend) return null
  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `📅 Recordatorio de check-in mañana — Hotel Dionys`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="color:#1a4e8a">Hotel Dionys</h2>
        <p>Hola <strong>${guestName}</strong>,</p>
        <p>Te recordamos que tu check-in es <strong>mañana ${checkIn}</strong>.</p>
        <p>Horario de recepción: <strong>14:00 – 23:00 hrs</strong>.</p>
        <p>¡Te esperamos! 🏨</p>
        <p style="font-size:12px;color:#9ca3af;margin-top:24px">Hotel Dionys · Perú</p>
      </div>
    `,
  })
  if (error) console.error('[email] Error enviando recordatorio:', error)
  return data
}

export async function sendFollowupEmail(to: string, guestName: string) {
  const resend = getResend()
  if (!resend) return null
  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `⭐ ¿Cómo fue tu estadía? — Hotel Dionys`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="color:#1a4e8a">Hotel Dionys</h2>
        <p>Hola <strong>${guestName}</strong>,</p>
        <p>Esperamos que tu estadía haya sido excelente. Tu opinión nos ayuda a mejorar.</p>
        <p>¿Nos dejas una reseña? Tu feedback es muy valioso para nosotros. 🙏</p>
        <p style="font-size:12px;color:#9ca3af;margin-top:24px">Hotel Dionys · Perú</p>
      </div>
    `,
  })
  if (error) console.error('[email] Error enviando follow-up:', error)
  return data
}
