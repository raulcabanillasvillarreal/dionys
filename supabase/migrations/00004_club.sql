create type member_status as enum ('activo', 'suspendido', 'vencido', 'baja');
create type membership_plan as enum ('basico', 'premium', 'vip');

create table members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  full_name text not null,
  email text,
  phone text,
  document_number text,
  membership_type membership_plan default 'basico',
  status member_status not null default 'activo',
  photo_url text,
  created_at timestamptz default now()
);

create table memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  member_id uuid not null references members(id),
  plan membership_plan not null,
  start_date date not null,
  end_date date not null,
  amount numeric(10,2) not null,
  auto_renew boolean default false,
  paid_at timestamptz,
  created_at timestamptz default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  name text not null,
  description text,
  date timestamptz not null,
  capacity int,
  price numeric(10,2) default 0,
  status text default 'activo',
  created_at timestamptz default now()
);

create table event_attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  member_id uuid not null references members(id),
  paid boolean default false,
  attended boolean default false,
  registered_at timestamptz default now()
);

create table access_log (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  member_id uuid references members(id),
  timestamp timestamptz default now(),
  gate text,
  granted boolean not null
);

-- RLS
alter table members enable row level security;
alter table memberships enable row level security;
alter table events enable row level security;
alter table event_attendees enable row level security;
alter table access_log enable row level security;
