# Dionys CRM/ERP — Contexto del Sistema

## Visión general

Sistema CRM/ERP unificado para tres negocios del grupo Dionys, gestionados desde una sola plataforma web con acceso diferenciado por negocio y rol de usuario.

## Negocios

| Negocio | Slug | Descripción |
|---|---|---|
| Hotel Dionys | `hotel` | Gestión hotelera: reservas, huéspedes, habitaciones, facturación |
| Importaciones Dionys | `importaciones` | Gestión comercial: inventario, proveedores, pedidos, clientes |
| Club Dionys | `club` | Gestión de club: socios, membresías, eventos, control de acceso |

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14 (App Router) |
| Estilos | Tailwind CSS + shadcn/ui |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password + magic link) |
| Automatizaciones | n8n (self-hosted o cloud) |
| Deploy | Vercel |
| Lenguaje | TypeScript estricto |

## Estructura de carpetas

```
dionys/
├── app/
│   ├── (auth)/                  # Rutas públicas (login, registro)
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/             # Rutas protegidas
│   │   ├── layout.tsx           # Sidebar + header compartido
│   │   ├── page.tsx             # Selector de negocio
│   │   ├── hotel/               # Módulo Hotel Dionys
│   │   │   ├── page.tsx
│   │   │   ├── reservas/
│   │   │   ├── huespedes/
│   │   │   ├── habitaciones/
│   │   │   └── facturacion/
│   │   ├── importaciones/       # Módulo Importaciones Dionys
│   │   │   ├── page.tsx
│   │   │   ├── inventario/
│   │   │   ├── proveedores/
│   │   │   ├── pedidos/
│   │   │   └── clientes/
│   │   └── club/                # Módulo Club Dionys
│   │       ├── page.tsx
│   │       ├── socios/
│   │       ├── eventos/
│   │       ├── membresias/
│   │       └── acceso/
│   ├── api/
│   │   └── webhooks/n8n/        # Endpoint receptor de n8n
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                      # Primitivos shadcn/ui
│   ├── shared/                  # Sidebar, Header, DataTable, etc.
│   ├── hotel/                   # Componentes específicos Hotel
│   ├── importaciones/           # Componentes específicos Importaciones
│   └── club/                    # Componentes específicos Club
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # createBrowserClient
│   │   ├── server.ts            # createServerClient (cookies)
│   │   └── middleware.ts        # refreshSession middleware
│   ├── utils.ts                 # cn(), formatters, etc.
│   └── validations/             # Zod schemas por módulo
├── hooks/                       # Custom React hooks por negocio
├── types/                       # TypeScript interfaces
│   ├── hotel.ts
│   ├── importaciones.ts
│   ├── club.ts
│   └── supabase.ts              # Tipos generados por Supabase CLI
├── supabase/
│   ├── migrations/              # SQL migrations versionadas
│   └── config.toml
├── n8n/
│   └── workflows/               # JSON exports de workflows n8n
│       ├── hotel/
│       ├── importaciones/
│       └── club/
├── middleware.ts                 # Auth guard global
└── docs/                        # Documentación por módulo
```

## Arquitectura de base de datos (Supabase)

### Esquema multi-negocio

Todas las tablas principales incluyen `business_id` para aislar datos por negocio. Row Level Security (RLS) en todas las tablas.

### Tablas compartidas

```sql
-- Usuarios del sistema (extiende auth.users)
profiles (id, email, full_name, avatar_url, role, business_ids[], created_at)

-- Negocios
businesses (id, name, slug, settings jsonb, created_at)

-- Roles: 'superadmin' | 'admin' | 'manager' | 'staff' | 'readonly'
user_business_roles (user_id, business_id, role)
```

### Módulo Hotel

```sql
rooms (id, business_id, number, type, capacity, price_per_night, status, amenities jsonb)
guests (id, business_id, full_name, email, phone, document_type, document_number, nationality)
reservations (id, business_id, guest_id, room_id, check_in, check_out, status, total_amount, notes)
invoices_hotel (id, business_id, reservation_id, amount, tax, paid_at, payment_method)
```

### Módulo Importaciones

```sql
suppliers (id, business_id, name, contact, country, payment_terms, notes)
products (id, business_id, sku, name, description, category, unit_cost, unit_price, stock)
purchase_orders (id, business_id, supplier_id, status, total, expected_date, notes)
purchase_order_items (id, order_id, product_id, quantity, unit_cost)
customers (id, business_id, name, email, phone, address, credit_limit)
sales_orders (id, business_id, customer_id, status, total, notes)
sales_order_items (id, order_id, product_id, quantity, unit_price)
```

### Módulo Club

```sql
members (id, business_id, full_name, email, phone, document_number, membership_type, status)
memberships (id, business_id, member_id, plan, start_date, end_date, amount, auto_renew)
events (id, business_id, name, description, date, capacity, price, status)
event_attendees (id, event_id, member_id, paid, attended)
access_log (id, business_id, member_id, timestamp, gate, granted)
```

## Autenticación y autorización

- Supabase Auth maneja sesiones (JWT)
- `middleware.ts` protege todas las rutas `/dashboard/**`
- RLS en PostgreSQL asegura aislamiento de datos por `business_id`
- Los usuarios pueden tener acceso a uno o varios negocios con distintos roles

## Integración n8n

- n8n corre como servicio separado (Docker o n8n.cloud)
- El endpoint `POST /api/webhooks/n8n` recibe triggers y los despacha
- Casos de uso principales:
  - **Hotel**: notificación de check-in/out por email/WhatsApp, recordatorios de reserva
  - **Importaciones**: alertas de stock bajo, notificación de pedido aprobado
  - **Club**: renovación automática de membresías, invitaciones a eventos

## Variables de entorno

Ver `.env.example` para la lista completa. Las críticas son:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
N8N_WEBHOOK_SECRET
```

## Convenciones de código

- **Componentes**: PascalCase, un componente por archivo
- **Funciones/hooks**: camelCase, hooks con prefijo `use`
- **Archivos de ruta**: siempre `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- **Server Components** por defecto; `"use client"` solo cuando sea necesario (interactividad, hooks de browser)
- **Supabase**: usar `createServerClient` en Server Components/Actions, `createBrowserClient` en Client Components
- **Validaciones**: Zod en Server Actions y API routes
- **Sin `any`**: TypeScript estricto en todo el proyecto

## Comandos frecuentes

```bash
# Desarrollo
npm run dev

# Supabase local
npx supabase start
npx supabase db push
npx supabase gen types typescript --local > types/supabase.ts

# Deploy
vercel --prod
```

## Estado del proyecto

- [ ] Estructura base inicializada
- [ ] Configuración Next.js + Tailwind
- [ ] Supabase schema + migraciones
- [ ] Auth flow (login / logout / middleware)
- [ ] Dashboard selector de negocios
- [ ] Módulo Hotel — CRUD básico
- [ ] Módulo Importaciones — CRUD básico
- [ ] Módulo Club — CRUD básico
- [ ] Integración n8n — webhooks
- [ ] Deploy Vercel + dominio

## Contacto / Negocio

- Propietario: Dionys Group
- Desarrollador: rcabanillasv@autonoma.edu.pe
- Repositorio: ~/proyectos/dionys
