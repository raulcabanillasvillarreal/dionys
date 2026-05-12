-- Negocios
create table businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug in ('hotel', 'importaciones', 'club')),
  settings jsonb default '{}',
  created_at timestamptz default now()
);

-- Perfiles de usuario (extiende auth.users)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Roles por negocio
create type user_role as enum ('superadmin', 'admin', 'manager', 'staff', 'readonly');

create table user_business_roles (
  user_id uuid references profiles(id) on delete cascade,
  business_id uuid references businesses(id) on delete cascade,
  role user_role not null default 'staff',
  primary key (user_id, business_id)
);

-- RLS
alter table profiles enable row level security;
alter table user_business_roles enable row level security;

create policy "users can read own profile"
  on profiles for select using (auth.uid() = id);

create policy "users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Trigger: crear perfil al registrarse
create function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Seed negocios
insert into businesses (name, slug) values
  ('Hotel Dionys', 'hotel'),
  ('Importaciones Dionys', 'importaciones'),
  ('Club Dionys', 'club');
