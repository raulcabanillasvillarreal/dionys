export default function ConfiguracionPage() {
  return (
    <div className="flex flex-col h-full p-6 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-0.5">Integraciones del módulo Hotel Dionys</p>
      </div>

      <div className="max-w-2xl space-y-6">

        {/* WhatsApp */}
        <Section icon="📱" color="bg-green-100" title="WhatsApp Business API" subtitle="Meta Cloud API">
          <EnvBlock vars={[
            ['WA_PHONE_NUMBER_ID', 'tu_phone_number_id'],
            ['WA_ACCESS_TOKEN', 'tu_access_token_permanente'],
            ['WA_VERIFY_TOKEN', 'una_cadena_secreta_cualquiera'],
          ]} />
          <WebhookUrl path="/api/webhooks/whatsapp" label="Webhook WhatsApp (GET + POST)" />
          <Steps steps={[
            'Ve a developers.facebook.com → Crear App → Business',
            'Agrega el producto WhatsApp a tu App',
            'En WhatsApp → Configuración de la API, copia el Phone Number ID',
            'Genera un token de acceso permanente en Graph API Explorer',
            'Configura el webhook con la URL de arriba, campo: messages',
          ]} />
        </Section>

        {/* Instagram */}
        <Section icon="📷" color="bg-purple-100" title="Instagram Direct (DM)" subtitle="Meta Graph API — misma App que WhatsApp">
          <EnvBlock vars={[
            ['WA_VERIFY_TOKEN', '(mismo que WhatsApp)'],
          ]} />
          <WebhookUrl path="/api/webhooks/instagram" label="Webhook Instagram (GET + POST)" />
          <Steps steps={[
            'En la misma App de Meta, agrega el producto Instagram',
            'Ve a Instagram → Configuración → Webhooks',
            'Suscríbete al campo: messages',
            'Apunta el webhook a la URL de arriba con el mismo verify_token',
          ]} />
        </Section>

        {/* Email (Resend) */}
        <Section icon="✉️" color="bg-blue-100" title="Email (Resend)" subtitle="Envío de confirmaciones y recordatorios">
          <EnvBlock vars={[
            ['RESEND_API_KEY', 'tu_api_key_de_resend'],
            ['EMAIL_FROM', 'Hotel Dionys <reservas@tudominio.com>'],
          ]} />
          <div className="text-xs text-gray-600 mt-2 space-y-1">
            <p>Crea una cuenta gratis en <span className="text-blue-600 font-medium">resend.com</span> y verifica tu dominio.</p>
            <p>Los emails se envían automáticamente al crear/completar una reserva.</p>
          </div>
          <WebhookUrl path="/api/webhooks/email" label="Webhook Email entrante (via n8n)" />
          <Steps steps={[
            'En n8n, crea un workflow con trigger IMAP (correo entrante)',
            'Agrega un nodo HTTP Request que POST a la URL de arriba',
            'Body: { from_email, from, subject, text, message_id }',
            'Header: X-Webhook-Secret: tu N8N_WEBHOOK_SECRET',
          ]} />
        </Section>

        {/* n8n */}
        <Section icon="⚡" color="bg-yellow-100" title="n8n Automatizaciones" subtitle="Webhooks salientes desde el CRM">
          <EnvBlock vars={[
            ['N8N_BASE_URL', 'http://localhost:5678/webhook'],
            ['N8N_WEBHOOK_SECRET', 'una_clave_secreta'],
            ['CRON_SECRET', 'clave_para_el_cron_de_vercel'],
          ]} />
          <div className="mt-3 space-y-2">
            <p className="text-xs font-semibold text-gray-700">Webhooks que el CRM llama a n8n:</p>
            <div className="space-y-1">
              {[
                ['POST', '/reserva-creada', 'Al crear una reserva (web o CRM)'],
                ['POST', '/check-in-manana', 'Diario 8am — lista de check-ins del día siguiente'],
                ['POST', '/check-out-completado', 'Al marcar reserva como "completada"'],
              ].map(([method, path, desc]) => (
                <div key={path} className="flex items-start gap-2 text-xs">
                  <span className="bg-hotel text-white px-1.5 py-0.5 rounded font-mono text-[10px] shrink-0">{method}</span>
                  <code className="text-gray-700 shrink-0">{path}</code>
                  <span className="text-gray-400">{desc}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
            <p className="font-semibold text-gray-700 mb-1">Cron diario (Vercel):</p>
            <p>Agrega en <code className="bg-gray-200 px-1 rounded">vercel.json</code>:</p>
            <pre className="mt-1 bg-gray-950 text-green-400 rounded p-2 overflow-x-auto">{`{
  "crons": [{
    "path": "/api/cron/check-in-manana",
    "schedule": "0 13 * * *"
  }]
}`}</pre>
            <p className="mt-1 text-gray-500">13:00 UTC = 8:00am Perú (GMT-5)</p>
          </div>
        </Section>

      </div>
    </div>
  )
}

function Section({ icon, color, title, subtitle, children }: {
  icon: string; color: string; title: string; subtitle: string; children: React.ReactNode
}) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center text-xl`}>{icon}</div>
        <div>
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function EnvBlock({ vars }: { vars: [string, string][] }) {
  return (
    <div className="bg-gray-950 text-green-400 rounded-xl p-4 font-mono text-xs space-y-1 mb-3">
      {vars.map(([k, v]) => (
        <p key={k}>{k}=<span className="text-yellow-400">{v}</span></p>
      ))}
    </div>
  )
}

function WebhookUrl({ path, label }: { path: string; label: string }) {
  return (
    <div className="mb-3">
      <p className="text-xs text-gray-500 mb-1">{label}:</p>
      <div className="bg-gray-100 rounded-lg px-3 py-2 font-mono text-xs text-gray-700 break-all">
        https://tu-dominio.vercel.app{path}
      </div>
    </div>
  )
}

function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className="text-xs text-gray-600 space-y-1.5 list-decimal list-inside mt-2">
      {steps.map((s, i) => <li key={i}>{s}</li>)}
    </ol>
  )
}
