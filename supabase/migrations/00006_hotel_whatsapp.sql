-- WhatsApp conversations
create table wa_conversations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  phone text not null,
  contact_name text,
  lead_id uuid references leads(id),
  last_message text,
  last_message_at timestamptz,
  unread_count int default 0,
  status text default 'open',
  assigned_to uuid references profiles(id),
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(business_id, phone)
);

-- WhatsApp messages
create table wa_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references wa_conversations(id) on delete cascade,
  wa_message_id text unique,
  direction text not null check (direction in ('inbound','outbound')),
  type text not null default 'text',
  content text,
  media_url text,
  template_name text,
  status text default 'sent',
  sent_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Message templates
create table message_templates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  category text default 'UTILITY',
  language text default 'es_PE',
  header text,
  body text not null,
  footer text,
  variables text[] default '{}',
  wa_template_id text,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Automations
create table automations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  description text,
  active boolean default true,
  trigger_type text not null,
  trigger_config jsonb default '{}',
  conditions jsonb default '[]',
  actions jsonb default '[]',
  executions_count int default 0,
  last_executed_at timestamptz,
  created_at timestamptz default now()
);

alter table wa_conversations enable row level security;
alter table wa_messages enable row level security;
alter table message_templates enable row level security;
alter table automations enable row level security;

-- Realtime
alter publication supabase_realtime add table wa_messages;
alter publication supabase_realtime add table wa_conversations;

-- Seed templates
insert into message_templates (business_id, name, category, body, variables, status)
select b.id, t.name, t.category, t.body, t.vars, 'draft'
from businesses b
cross join (values
  ('Bienvenida', 'UTILITY', 'Hola {{nombre}}, gracias por contactar Hotel Dionys 🏨 ¿En qué podemos ayudarte?', array['nombre']),
  ('Confirmación de reserva', 'UTILITY', 'Hola {{nombre}} ✅ Tu reserva está confirmada. Habitación {{habitacion}}, del {{check_in}} al {{check_out}}. ¡Te esperamos!', array['nombre','habitacion','check_in','check_out']),
  ('Seguimiento', 'UTILITY', 'Hola {{nombre}}, queríamos saber si pudimos ayudarte con tu consulta. Estamos disponibles 24/7 😊', array['nombre']),
  ('Recordatorio check-in', 'UTILITY', 'Hola {{nombre}} 📅 Mañana es tu check-in en Hotel Dionys. Horario de recepción: 14:00-23:00. ¡Te esperamos!', array['nombre']),
  ('Solicitar reseña', 'MARKETING', 'Hola {{nombre}} ⭐ Esperamos que tu estadía haya sido excelente. ¿Nos dejas una reseña? Tu opinión nos ayuda a mejorar.', array['nombre'])
) as t(name, category, body, vars)
where b.slug = 'hotel';

-- Seed automations
insert into automations (business_id, name, description, trigger_type, trigger_config, actions, active)
select b.id, a.name, a.description, a.trigger_type, a.trigger_config::jsonb, a.actions::jsonb, true
from businesses b
cross join (values
  ('Crear lead desde WhatsApp', 'Cuando llega un mensaje nuevo de WhatsApp, crea automáticamente un lead en Consulta', 'new_whatsapp', '{}', '[{"type":"create_lead","stage_name":"Consulta"},{"type":"add_tag","tag":"WhatsApp"}]'),
  ('Respuesta automática bienvenida', 'Envía mensaje de bienvenida al primer mensaje de un contacto nuevo', 'first_whatsapp', '{}', '[{"type":"send_template","template_name":"Bienvenida"}]'),
  ('Tarea de seguimiento', 'Crea tarea de seguimiento cuando un lead lleva 24h en Cotización sin actividad', 'no_reply', '{"hours":24,"stage":"Cotización"}', '[{"type":"create_task","title":"Seguimiento pendiente","due_hours":2}]')
) as a(name, description, trigger_type, trigger_config, actions)
where b.slug = 'hotel';
