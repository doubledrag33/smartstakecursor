alter table public.store enable row level security;
alter table public.product enable row level security;
alter table public.sku enable row level security;
alter table public.price enable row level security;
alter table public.offer enable row level security;
alter table public.cart enable row level security;
alter table public.cart_item enable row level security;
alter table public.plan enable row level security;
alter table public.reservation enable row level security;
alter table public.receipt enable row level security;
alter table public.user_favorite enable row level security;
alter table public.store_user enable row level security;

-- Public read access
create policy "public read store" on public.store for select using (true);
create policy "public read product" on public.product for select using (true);
create policy "public read sku" on public.sku for select using (true);
create policy "public read price" on public.price for select using (true);
create policy "public read offer" on public.offer for select using (true);

-- User-owned tables
create policy "user carts" on public.cart for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "user cart items" on public.cart_item for all using (
  cart_id in (select id from public.cart where user_id = auth.uid())
) with check (
  cart_id in (select id from public.cart where user_id = auth.uid())
);
create policy "user receipts" on public.receipt for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "user favorites" on public.user_favorite for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "user reservations read" on public.reservation for select using (
  cart_id in (select id from public.cart where user_id = auth.uid())
);
create policy "user reservations write" on public.reservation for insert with check (
  cart_id in (select id from public.cart where user_id = auth.uid())
);

-- store_user visibility: only admins or users tied to store
create policy "store_user self" on public.store_user for select using (
  user_id = auth.uid() or exists (
    select 1 from public.store_user su
    where su.user_id = auth.uid() and su.role = 'admin'
  )
);