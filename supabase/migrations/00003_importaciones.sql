create type order_status as enum ('borrador', 'enviado', 'confirmado', 'recibido', 'cancelado');

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  name text not null,
  contact text,
  country text,
  payment_terms text,
  notes text,
  created_at timestamptz default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  sku text not null,
  name text not null,
  description text,
  category text,
  unit_cost numeric(10,2),
  unit_price numeric(10,2),
  stock int not null default 0,
  stock_min int default 0,
  created_at timestamptz default now(),
  unique (business_id, sku)
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  name text not null,
  email text,
  phone text,
  address text,
  credit_limit numeric(10,2) default 0,
  created_at timestamptz default now()
);

create table purchase_orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  supplier_id uuid not null references suppliers(id),
  status order_status not null default 'borrador',
  total numeric(10,2),
  expected_date date,
  notes text,
  created_at timestamptz default now()
);

create table purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references purchase_orders(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity int not null,
  unit_cost numeric(10,2) not null
);

create table sales_orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  customer_id uuid not null references customers(id),
  status order_status not null default 'borrador',
  total numeric(10,2),
  notes text,
  created_at timestamptz default now()
);

create table sales_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references sales_orders(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity int not null,
  unit_price numeric(10,2) not null
);

-- RLS (misma lógica que hotel, adaptada a 'importaciones')
alter table suppliers enable row level security;
alter table products enable row level security;
alter table customers enable row level security;
alter table purchase_orders enable row level security;
alter table purchase_order_items enable row level security;
alter table sales_orders enable row level security;
alter table sales_order_items enable row level security;
