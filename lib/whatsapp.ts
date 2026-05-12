const GRAPH = 'https://graph.facebook.com/v19.0'

function headers() {
  return {
    Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

function pid() {
  return process.env.WA_PHONE_NUMBER_ID
}

export async function sendText(phone: string, text: string) {
  if (!pid() || !process.env.WA_ACCESS_TOKEN) {
    console.warn('[WhatsApp] Credentials not configured')
    return null
  }
  const res = await fetch(`${GRAPH}/${pid()}/messages`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: text },
    }),
  })
  return res.json() as Promise<{ messages?: [{ id: string }]; error?: object }>
}

export async function sendTemplate(
  phone: string,
  templateName: string,
  language = 'es_PE',
  bodyVars: string[] = [],
) {
  if (!pid() || !process.env.WA_ACCESS_TOKEN) return null

  const components = bodyVars.length
    ? [{ type: 'body', parameters: bodyVars.map(v => ({ type: 'text', text: v })) }]
    : undefined

  const res = await fetch(`${GRAPH}/${pid()}/messages`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: { name: templateName, language: { code: language }, components },
    }),
  })
  return res.json()
}
