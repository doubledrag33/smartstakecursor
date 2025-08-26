-- USERS
create table public.users (
  id uuid primary key default auth.uid(),
  email text unique,
  name text,
  cap text,
  fulfillment_pref text check (fulfillment_pref in ('in_negozio','consegna')) default 'in_negozio',
  consent_geoloc boolean default false,
  created_at timestamptz default now()
);

-- STORE
create table public.store (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  chain text,
  address text,
  cap text,
  lat double precision,
  lon double precision,
  hours_json jsonb,
  has_everli boolean default false,
  everli_deeplink text,
  is_partner boolean default false,
  created_at timestamptz default now()
);

-- PRODUCT
create table public.product (
  id uuid primary key default gen_random_uuid(),
  ean text,
  alt_codes jsonb,
  brand text,
  name text not null,
  qty_value numeric,
  qty_unit text,
  category text,
  img_url text
);

-- SKU
create table public.sku (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.product(id) on delete cascade,
  store_id uuid references public.store(id) on delete cascade,
  is_private_label boolean default false
);

-- PRICE
create table public.price (
  id uuid primary key default gen_random_uuid(),
  sku_id uuid references public.sku(id) on delete cascade,
  price numeric not null,
  unit_price numeric,
  source_type text check (source_type in ('volantino','online','scontrino')),
  source_ref text,
  captured_at timestamptz default now(),
  valid_from date,
  valid_to date,
  confidence int
);
create index on public.price(sku_id, captured_at desc);

-- OFFER
create table public.offer (
  id uuid primary key default gen_random_uuid(),
  sku_id uuid references public.sku(id) on delete cascade,
  promo_price numeric not null,
  mechanics text,
  start date,
  end date,
  notes text
);
create index on public.offer(sku_id, start, end);

-- CART
create table public.cart (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  status text check (status in ('open','submitted')) default 'open',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CART ITEM
create table public.cart_item (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid references public.cart(id) on delete cascade,
  product_id uuid references public.product(id),
  quantity numeric default 1,
  preferred_store_id uuid references public.store(id),
  notes text
);
create index on public.cart_item(cart_id);

-- PLAN
create table public.plan (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid references public.cart(id) on delete cascade,
  kind text check (kind in ('economico','equilibrato','un_solo_negozio')),
  total numeric,
  stores_used int,
  km_est numeric,
  details_json jsonb,
  created_at timestamptz default now()
);

-- RESERVATION
create table public.reservation (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid references public.cart(id) on delete cascade,
  store_id uuid references public.store(id) on delete cascade,
  status text check (status in ('sent','preparazione','pronto','ritirato','annullato')) default 'sent',
  pickup_code text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RECEIPT
create table public.receipt (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  store_id uuid references public.store(id),
  img_url text,
  ocr_json jsonb,
  parsed_at timestamptz,
  status text check (status in ('uploaded','parsed','error')) default 'uploaded'
);

-- FAVORITES
create table public.user_favorite (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  product_id uuid references public.product(id) on delete cascade,
  rank int,
  notes text,
  created_at timestamptz default now(),
  unique (user_id, product_id)
);

-- STORE USER
create table public.store_user (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.store(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  role text check (role in ('merchant','admin')) not null
);

-- INDEXES
create index on public.store(cap);
create index on public.product(ean);
create index on public.product using gin(alt_codes);