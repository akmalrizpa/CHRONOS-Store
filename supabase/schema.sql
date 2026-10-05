-- CHRONOS Store — run this once in the Supabase SQL editor.
-- Without these tables (or without SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)
-- the store falls back to an in-memory store where data disappears on restart.

create table if not exists orders (
  ref text primary key,
  guild_id text not null default '',
  product_value text not null,
  product_label text not null,
  product_price text not null default '',
  price_amount bigint not null default 0,
  duration_days integer not null default 0,
  buyer_discord_id text not null,
  buyer_username text not null default '',
  buyer_avatar text,
  contact text not null default '',
  note text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'review', 'delivered', 'rejected')),
  payment_method text not null default 'qris'
    check (payment_method in ('qris', 'transfer')),
  proof_path text,
  proof_uploaded_at timestamptz,
  delivered_key text,
  delivered_at timestamptz,
  delivered_by text,
  staff_note text,
  events jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_buyer_idx on orders (buyer_discord_id);
create index if not exists orders_status_idx on orders (status);
create index if not exists orders_created_idx on orders (created_at desc);

create table if not exists reviews (
  id text primary key,
  order_ref text not null unique references orders (ref) on delete cascade,
  product_value text not null,
  product_label text not null default '',
  buyer_username text not null default '',
  rating integer not null check (rating between 1 and 5),
  body text not null default '',
  created_at timestamptz not null default now()
);

-- One row per Discord account that has signed in. `role` is what the store's
-- admin area checks: 'customer' sees only their own orders, 'admin' gets the
-- whole /admin area. IDs in STORE_ADMIN_DISCORD_IDS always count as admin too,
-- so an empty table (or a fresh deployment) can never lock you out.
create table if not exists customers (
  discord_id text primary key,
  username text not null default '',
  display_name text not null default '',
  avatar_url text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

create index if not exists customers_role_idx on customers (role);
create index if not exists customers_seen_idx on customers (last_seen desc);

-- Every write that happens in the store: who did what, to which order/product.
-- This is the audit trail the admin area reads at /admin/log.
create table if not exists activity_log (
  id text primary key,
  at timestamptz not null default now(),
  actor_id text not null default '',
  actor_name text not null default '',
  action text not null,
  target text not null default '',
  detail text not null default ''
);

create index if not exists activity_at_idx on activity_log (at desc);
create index if not exists activity_actor_idx on activity_log (actor_id);
create index if not exists activity_action_idx on activity_log (action);

-- Promo badges and the "featured" flag live here because the bot has no promo
-- field: its product shape is label / value / price / category / requiresKey /
-- roleId / days, and the store must not pretend otherwise.
create table if not exists product_meta (
  product_value text primary key,
  promo_label text,
  featured boolean not null default false,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- The service role key (server only) does all the writing, so no write policies
-- are needed. Reviews are the one thing a browser may read directly.
alter table orders enable row level security;
alter table reviews enable row level security;
alter table product_meta enable row level security;
alter table settings enable row level security;
alter table customers enable row level security;
alter table activity_log enable row level security;

drop policy if exists "reviews are readable by everyone" on reviews;
create policy "reviews are readable by everyone" on reviews for select using (true);

-- Private bucket for payment proofs; the app serves them through
-- /api/proofs/<order ref> after checking who is asking.
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', false)
on conflict (id) do nothing;
