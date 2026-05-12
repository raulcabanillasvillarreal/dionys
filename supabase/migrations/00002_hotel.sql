create type room_status as enum ('disponible', 'ocupada', 'mantenimiento', 'reservada');
create type reservation_status as enum ('confirmada', 'pendiente', 'cancelada', 'completada');

create table rooms (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  number text not null,
  type text not null,
  capacity int not null default 2,
  price_per_night numeric(10,2) not null,
  status room_status not null default 'disponible',
  amenities jsonb default '[]',
  created_at timestamptz default now(),
  unique (business_id, number)
);

create table guests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  full_name text not null,
  email text,
  phone text,
  document_type text,
  document_number text,
  nationality text,
  created_at timestamptz default now()
);

create table reservations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  guest_id uuid not null references guests(id),
  room_id uuid not null references rooms(id),
  check_in date not null,
  check_out date not null,
  status reservation_status not null default 'pendiente',
  total_amount numeric(10,2),
  notes text,
  created_at timestamptz default now(),
  check (check_out > check_in)
);

create table invoices_hotel (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  reservation_id uuid not null references reservations(id),
  amount numeric(10,2) not null,
  tax numeric(10,2) default 0,
  payment_method text,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- RLS
alter table rooms enable row level security;
alter table guests enable row level security;
alter table reservations enable row level security;
alter table invoices_hotel enable row level security;

create policy "hotel staff access"
  on rooms for all
  using (
    exists (
      select 1 from user_business_roles ubr
      join businesses b on b.id = ubr.business_id
      where ubr.user_id = auth.uid()
        and b.slug = 'hotel'
        and rooms.business_id = b.id
    )
  );
