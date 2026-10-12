-- Commerce catalog and auditable royalty ledger foundation.
-- Product listing metadata is separated from the canonical story record.
create table if not exists public.commerce_products (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 140),
  description text not null default '' check (char_length(description) <= 5000),
  product_type text not null check (product_type in ('digital_book', 'comic', 'photo', 'audio_video', 'design_asset', 'model_3d', 'license')),
  currency text not null default 'IDR' check (currency ~ '^[A-Z]{3}$'),
  price_amount_minor bigint not null default 0 check (price_amount_minor >= 0),
  rights_license text not null default 'All rights reserved',
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commerce_products_id_book_unique unique (id, book_id)
);
create index if not exists commerce_products_seller_updated_idx on public.commerce_products (seller_id, updated_at desc);
create index if not exists commerce_products_book_id_idx on public.commerce_products (book_id);
create index if not exists commerce_products_active_idx on public.commerce_products (status, updated_at desc) where status = 'active';

create table if not exists public.commerce_orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'pending_payment' check (status in ('pending_payment', 'paid', 'cancelled', 'failed', 'refunded', 'partially_refunded')),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  subtotal_amount_minor bigint not null check (subtotal_amount_minor >= 0),
  platform_fee_amount_minor bigint not null default 0 check (platform_fee_amount_minor >= 0),
  total_amount_minor bigint not null check (total_amount_minor >= 0),
  payment_provider text,
  provider_order_id text,
  provider_payment_id text,
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (buyer_id, idempotency_key)
);
create index if not exists commerce_orders_buyer_created_idx on public.commerce_orders (buyer_id, created_at desc);
create index if not exists commerce_orders_status_created_idx on public.commerce_orders (status, created_at desc);
create unique index if not exists commerce_orders_provider_order_unique
  on public.commerce_orders (payment_provider, provider_order_id)
  where payment_provider is not null and provider_order_id is not null;

create table if not exists public.commerce_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.commerce_orders(id) on delete cascade,
  product_id uuid references public.commerce_products(id) on delete set null,
  seller_id uuid not null references auth.users(id) on delete restrict,
  title_snapshot text not null,
  quantity integer not null default 1 check (quantity > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  unit_price_amount_minor bigint not null check (unit_price_amount_minor >= 0),
  gross_amount_minor bigint not null check (gross_amount_minor >= 0),
  platform_fee_amount_minor bigint not null default 0 check (platform_fee_amount_minor >= 0),
  creator_royalty_amount_minor bigint not null default 0 check (creator_royalty_amount_minor >= 0),
  rights_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists commerce_order_items_order_id_idx on public.commerce_order_items (order_id);
create index if not exists commerce_order_items_product_id_idx on public.commerce_order_items (product_id);
create index if not exists commerce_order_items_seller_created_idx on public.commerce_order_items (seller_id, created_at desc);

create table if not exists public.royalty_ledger (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null unique references public.commerce_order_items(id) on delete restrict,
  creator_id uuid not null references auth.users(id) on delete restrict,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  amount_minor bigint not null check (amount_minor >= 0),
  status text not null default 'pending' check (status in ('pending', 'available', 'paid', 'reversed')),
  payout_reference text,
  created_at timestamptz not null default now(),
  available_at timestamptz,
  paid_at timestamptz
);
create index if not exists royalty_ledger_creator_created_idx on public.royalty_ledger (creator_id, created_at desc);
create index if not exists royalty_ledger_status_created_idx on public.royalty_ledger (status, created_at desc);

-- Fix foreign-key indexing findings from the first admin schema migration.
create index if not exists content_reports_reporter_user_id_idx on public.content_reports (reporter_user_id);
create index if not exists content_reports_reviewed_by_idx on public.content_reports (reviewed_by);
create index if not exists platform_admin_roles_granted_by_idx on public.platform_admin_roles (granted_by);

alter table public.commerce_products enable row level security;
alter table public.commerce_orders enable row level security;
alter table public.commerce_order_items enable row level security;
alter table public.royalty_ledger enable row level security;

-- Product rows can be read publicly only when the product and its source book are published/active.
drop policy if exists commerce_products_read_active_or_owner on public.commerce_products;
create policy commerce_products_read_active_or_owner on public.commerce_products
  for select to anon, authenticated
  using (
    seller_id = (select auth.uid())
    or (
      status = 'active'
      and exists (
        select 1 from public.books b
        where b.id = commerce_products.book_id and b.status = 'published'
      )
    )
  );
drop policy if exists commerce_products_insert_owner on public.commerce_products;
create policy commerce_products_insert_owner on public.commerce_products
  for insert to authenticated
  with check (
    seller_id = (select auth.uid())
    and exists (select 1 from public.books b where b.id = commerce_products.book_id and b.owner_id = (select auth.uid()))
  );
drop policy if exists commerce_products_update_owner on public.commerce_products;
create policy commerce_products_update_owner on public.commerce_products
  for update to authenticated
  using (
    seller_id = (select auth.uid())
    and exists (select 1 from public.books b where b.id = commerce_products.book_id and b.owner_id = (select auth.uid()))
  )
  with check (
    seller_id = (select auth.uid())
    and exists (select 1 from public.books b where b.id = commerce_products.book_id and b.owner_id = (select auth.uid()))
  );
drop policy if exists commerce_products_delete_owner on public.commerce_products;
create policy commerce_products_delete_owner on public.commerce_products
  for delete to authenticated
  using (
    seller_id = (select auth.uid())
    and exists (select 1 from public.books b where b.id = commerce_products.book_id and b.owner_id = (select auth.uid()))
  );

drop policy if exists commerce_orders_read_buyer on public.commerce_orders;
create policy commerce_orders_read_buyer on public.commerce_orders
  for select to authenticated using (buyer_id = (select auth.uid()));
drop policy if exists commerce_order_items_read_buyer_or_seller on public.commerce_order_items;
create policy commerce_order_items_read_buyer_or_seller on public.commerce_order_items
  for select to authenticated using (
    seller_id = (select auth.uid())
    or exists (select 1 from public.commerce_orders o where o.id = commerce_order_items.order_id and o.buyer_id = (select auth.uid()))
  );
drop policy if exists royalty_ledger_read_creator on public.royalty_ledger;
create policy royalty_ledger_read_creator on public.royalty_ledger
  for select to authenticated using (creator_id = (select auth.uid()));

revoke all on table public.commerce_products from anon, authenticated, public;
grant select on table public.commerce_products to anon, authenticated;
grant insert, update, delete on table public.commerce_products to authenticated;
grant all on table public.commerce_products to service_role;

revoke all on table public.commerce_orders from anon, authenticated, public;
grant select on table public.commerce_orders to authenticated;
grant all on table public.commerce_orders to service_role;

revoke all on table public.commerce_order_items from anon, authenticated, public;
grant select on table public.commerce_order_items to authenticated;
grant all on table public.commerce_order_items to service_role;

revoke all on table public.royalty_ledger from anon, authenticated, public;
grant select on table public.royalty_ledger to authenticated;
grant all on table public.royalty_ledger to service_role;

comment on table public.commerce_products is 'Creator-owned product/listing metadata. Active listing visibility requires the source book to be published.';
comment on table public.commerce_orders is 'Server-created orders only. Payment confirmation must come from a verified provider webhook.';
comment on table public.commerce_order_items is 'Immutable purchase snapshots used for reconciliation and royalty calculation.';
comment on table public.royalty_ledger is 'Server-managed royalty ledger. Browser clients can read only their own creator rows; only trusted server workflows may write.';
