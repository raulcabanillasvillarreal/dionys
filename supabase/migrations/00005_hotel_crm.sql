-- Pipeline stages
create table pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  color text not null default '#6B7280',
  position int not null default 0,
  is_won boolean default false,
  is_lost boolean default false,
  created_at timestamptz default now()
);

-- Lead source
create type lead_source as enum ('web','telefono','whatsapp','email','referido','directo','otro');

-- Leads (deals en el pipeline)
create table leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  stage_id uuid not null references pipeline_stages(id),
  guest_id uuid references guests(id),
  title text not null,
  amount numeric(10,2),
  room_id uuid references rooms(id),
  check_in date,
  check_out date,
  source lead_source default 'otro',
  tags text[] default '{}',
  notes text,
  assigned_to uuid references profiles(id),
  reservation_id uuid references reservations(id),
  position float default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tasks
create table tasks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  guest_id uuid references guests(id),
  title text not null,
  description text,
  due_at timestamptz,
  completed boolean default false,
  completed_at timestamptz,
  assigned_to uuid references profiles(id),
  created_at timestamptz default now()
);

-- Activity timeline
create type activity_type as enum ('nota','llamada','email','whatsapp','cambio_etapa','tarea','sistema');

create table activities (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  guest_id uuid references guests(id),
  type activity_type not null default 'nota',
  content text,
  metadata jsonb default '{}',
  user_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- RLS
alter table pipeline_stages enable row level security;
alter table leads enable row level security;
alter table tasks enable row level security;
alter table activities enable row level security;

-- Trigger: updated_at en leads
create function update_lead_timestamp()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger leads_updated_at
  before update on leads
  for each row execute procedure update_lead_timestamp();

-- Seed: etapas por defecto para Hotel Dionys
insert into pipeline_stages (business_id, name, color, position, is_won, is_lost)
select b.id, s.name, s.color, s.pos, s.is_won, s.is_lost
from businesses b
cross join (values
  ('Consulta',   '#6B7280', 0, false, false),
  ('Cotización', '#3B82F6', 1, false, false),
  ('Confirmada', '#10B981', 2, false, false),
  ('Check-in',   '#F59E0B', 3, false, false),
  ('Check-out',  '#8B5CF6', 4, false, false),
  ('Completada', '#14B8A6', 5, true,  false),
  ('Cancelada',  '#EF4444', 6, false, true)
) as s(name, color, pos, is_won, is_lost)
where b.slug = 'hotel';
