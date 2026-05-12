-- ═══════════════════════════════════════════════════
-- MODULE 1: Room Map extensions
-- ═══════════════════════════════════════════════════
alter table rooms
  add column if not exists dirty_status text default 'clean'
    check (dirty_status in ('clean','dirty','cleaning','maintenance')),
  add column if not exists booking_channel text default 'directo';

alter table reservations
  add column if not exists booking_channel text default 'directo',
  add column if not exists folio_total numeric(10,2) default 0;

-- Room charges (folio)
create table if not exists room_charges (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references reservations(id) on delete cascade,
  business_id uuid not null references businesses(id),
  description text not null,
  amount numeric(10,2) not null,
  payment_method text default 'pendiente',
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════
-- MODULE 2: Caja (Cash Register)
-- ═══════════════════════════════════════════════════
create table if not exists cash_registers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  opened_by uuid references profiles(id),
  opened_at timestamptz default now(),
  closed_at timestamptz,
  initial_amount numeric(10,2) default 0,
  closing_amount numeric(10,2),
  status text default 'open' check (status in ('open','closed')),
  notes text,
  created_at timestamptz default now()
);

create table if not exists cash_movements (
  id uuid primary key default gen_random_uuid(),
  register_id uuid references cash_registers(id) on delete cascade,
  business_id uuid not null references businesses(id),
  type text not null check (type in ('ingreso','egreso')),
  category text default 'general',
  description text not null,
  amount numeric(10,2) not null,
  payment_method text default 'efectivo'
    check (payment_method in ('efectivo','tarjeta','transferencia','yape','plin','otro')),
  reservation_id uuid references reservations(id),
  room_id uuid references rooms(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════
-- MODULE 4: POS (Point of Sale)
-- ═══════════════════════════════════════════════════
create table if not exists pos_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  name text not null,
  color text default '#6B7280',
  icon text,
  position int default 0
);

create table if not exists pos_products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  category_id uuid references pos_categories(id),
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  cost numeric(10,2) default 0,
  stock int default 0,
  min_stock int default 5,
  unit text default 'unidad',
  barcode text,
  active boolean default true,
  image_url text,
  created_at timestamptz default now()
);

create table if not exists pos_orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  room_id uuid references rooms(id),
  reservation_id uuid references reservations(id),
  cashier_id uuid references profiles(id),
  status text default 'pending' check (status in ('pending','paid','cancelled')),
  subtotal numeric(10,2) default 0,
  discount numeric(10,2) default 0,
  total numeric(10,2) default 0,
  payment_method text default 'efectivo',
  notes text,
  created_at timestamptz default now()
);

create table if not exists pos_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references pos_orders(id) on delete cascade,
  product_id uuid references pos_products(id),
  product_name text not null,
  quantity int not null default 1,
  unit_price numeric(10,2) not null,
  discount numeric(10,2) default 0,
  subtotal numeric(10,2) not null
);

-- ═══════════════════════════════════════════════════
-- MODULE 6: Workers
-- ═══════════════════════════════════════════════════
create table if not exists workers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  full_name text not null,
  role text not null check (role in ('admin','recepcionista','cajero','limpieza','supervisor','otro')),
  shift text default 'mañana' check (shift in ('mañana','tarde','noche','rotativo')),
  phone text,
  email text,
  document_number text,
  hire_date date,
  salary numeric(10,2) default 0,
  active boolean default true,
  photo_url text,
  created_at timestamptz default now()
);

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers(id) on delete cascade,
  business_id uuid not null references businesses(id),
  date date not null default current_date,
  check_in timestamptz,
  check_out timestamptz,
  status text default 'present' check (status in ('present','absent','late','permission')),
  notes text,
  created_at timestamptz default now(),
  unique(worker_id, date)
);

create table if not exists worker_advances (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers(id),
  business_id uuid not null references businesses(id),
  amount numeric(10,2) not null,
  description text,
  date date default current_date,
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════
-- MODULE 7: Calendar / Agenda
-- ═══════════════════════════════════════════════════
create table if not exists calendar_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  title text not null,
  description text,
  type text default 'evento' check (type in ('reserva','reunion','mantenimiento','evento','recordatorio','otro')),
  start_at timestamptz not null,
  end_at timestamptz,
  all_day boolean default false,
  color text default '#1a4e8a',
  location text,
  assigned_to uuid references profiles(id),
  worker_id uuid references workers(id),
  notified boolean default false,
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════
-- MODULE 8: Inventory / Insumos
-- ═══════════════════════════════════════════════════
create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  name text not null,
  category text default 'general',
  unit text default 'unidad',
  stock numeric(10,2) default 0,
  min_stock numeric(10,2) default 5,
  cost_price numeric(10,2) default 0,
  supplier text,
  barcode text,
  location text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists inventory_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references inventory_items(id) on delete cascade,
  business_id uuid not null references businesses(id),
  type text not null check (type in ('entrada','salida','ajuste')),
  quantity numeric(10,2) not null,
  unit_cost numeric(10,2) default 0,
  reason text,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists purchase_orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  supplier text not null,
  status text default 'borrador' check (status in ('borrador','enviado','aprobado','recibido','cancelado')),
  expected_date date,
  notes text,
  total numeric(10,2) default 0,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references purchase_orders(id) on delete cascade,
  item_id uuid references inventory_items(id),
  item_name text not null,
  quantity numeric(10,2) not null,
  unit_price numeric(10,2) not null,
  subtotal numeric(10,2) not null
);

-- RLS
alter table room_charges enable row level security;
alter table cash_registers enable row level security;
alter table cash_movements enable row level security;
alter table pos_categories enable row level security;
alter table pos_products enable row level security;
alter table pos_orders enable row level security;
alter table pos_order_items enable row level security;
alter table workers enable row level security;
alter table attendance enable row level security;
alter table worker_advances enable row level security;
alter table calendar_events enable row level security;
alter table inventory_items enable row level security;
alter table inventory_movements enable row level security;
alter table purchase_orders enable row level security;
alter table purchase_order_items enable row level security;

-- Realtime for room map
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table reservations;
alter publication supabase_realtime add table cash_movements;

-- Seed POS categories for hotel
insert into pos_categories (business_id, name, color, position)
select b.id, c.name, c.color, c.pos
from businesses b
cross join (values
  ('Bar / Bebidas','#3B82F6',1),
  ('Restaurante','#F59E0B',2),
  ('Servicio al cuarto','#8B5CF6',3),
  ('Lavandería','#06B6D4',4),
  ('Otros','#6B7280',5)
) as c(name, color, pos)
where b.slug = 'hotel';

-- Seed POS products for hotel
do $$
declare
  b_id uuid;
  cat_bar uuid; cat_rest uuid; cat_srv uuid; cat_lav uuid;
begin
  select id into b_id from businesses where slug = 'hotel' limit 1;
  if b_id is null then return; end if;
  select id into cat_bar  from pos_categories where business_id = b_id and name = 'Bar / Bebidas' limit 1;
  select id into cat_rest from pos_categories where business_id = b_id and name = 'Restaurante' limit 1;
  select id into cat_srv  from pos_categories where business_id = b_id and name = 'Servicio al cuarto' limit 1;
  select id into cat_lav  from pos_categories where business_id = b_id and name = 'Lavandería' limit 1;
  insert into pos_products (business_id, category_id, name, price, cost, stock, unit) values
    (b_id, cat_bar,  'Agua mineral',         3.00,  1.50, 50, 'botella'),
    (b_id, cat_bar,  'Gaseosa 500ml',         4.00,  2.00, 40, 'botella'),
    (b_id, cat_bar,  'Cerveza',               8.00,  4.00, 30, 'botella'),
    (b_id, cat_bar,  'Café',                  5.00,  1.00,100, 'taza'),
    (b_id, cat_rest, 'Desayuno continental', 25.00, 12.00,  0, 'plato'),
    (b_id, cat_rest, 'Sándwich',             18.00,  8.00,  0, 'unidad'),
    (b_id, cat_srv,  'Amenities extra',       15.00,  8.00, 20, 'kit'),
    (b_id, cat_lav,  'Lavado de ropa',        20.00,  5.00,  0, 'servicio');
end $$;
