-- SONIQ commerce foundation: user-scoped credits and Stripe payment ledger.
-- Apply in Supabase SQL Editor or with the Supabase CLI.
-- This migration does NOT migrate legacy JSON/server memory data.

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  avatar_url text,
  plan text not null default 'Free Creator',
  credits_remaining integer not null default 0 check (credits_remaining >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount <> 0),
  transaction_type text not null check (transaction_type in ('purchase','usage','daily_bonus','refund','adjustment')),
  description text not null default '',
  balance_after integer not null check (balance_after >= 0),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

-- Existing tables may already exist in installations created from the in-app schema.
alter table public.songs add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.playlists add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists songs_user_id_created_at_idx on public.songs(user_id, created_at desc);
create index if not exists playlists_user_id_updated_at_idx on public.playlists(user_id, updated_at desc);
create index if not exists credit_transactions_user_id_created_at_idx on public.credit_transactions(user_id, created_at desc);

alter table public.user_profiles enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.stripe_webhook_events enable row level security;
alter table public.songs enable row level security;
alter table public.playlists enable row level security;

-- Drop/recreate named policies so this migration can safely be re-run.
drop policy if exists "Users can read own profile" on public.user_profiles;
create policy "Users can read own profile" on public.user_profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.user_profiles;
create policy "Users can update own profile" on public.user_profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can read own credit transactions" on public.credit_transactions;
create policy "Users can read own credit transactions" on public.credit_transactions
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can read own songs" on public.songs;
create policy "Users can read own songs" on public.songs
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own songs" on public.songs;
create policy "Users can insert own songs" on public.songs
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update own songs" on public.songs;
create policy "Users can update own songs" on public.songs
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own songs" on public.songs;
create policy "Users can delete own songs" on public.songs
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can read own playlists" on public.playlists;
create policy "Users can read own playlists" on public.playlists
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own playlists" on public.playlists;
create policy "Users can insert own playlists" on public.playlists
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update own playlists" on public.playlists;
create policy "Users can update own playlists" on public.playlists
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own playlists" on public.playlists;
create policy "Users can delete own playlists" on public.playlists
  for delete to authenticated using (auth.uid() = user_id);

-- Profile creation is automatic after Supabase Auth signup.
create or replace function public.handle_new_soniq_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_soniq on auth.users;
create trigger on_auth_user_created_soniq
  after insert on auth.users
  for each row execute procedure public.handle_new_soniq_user();

-- This function must only be called by the trusted server after verifying a Stripe webhook.
-- Checkout session id is unique, making repeated webhook deliveries idempotent.
create or replace function public.soniq_apply_paid_credit_purchase(
  p_user_id uuid,
  p_credits integer,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_description text,
  p_metadata jsonb default '{}'::jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance integer;
begin
  if p_credits is null or p_credits <= 0 then
    raise exception 'credits must be positive';
  end if;
  if p_checkout_session_id is null or length(trim(p_checkout_session_id)) = 0 then
    raise exception 'checkout session id is required';
  end if;

  -- A duplicate session means the event was already applied.
  if exists (
    select 1 from public.credit_transactions
    where stripe_checkout_session_id = p_checkout_session_id
  ) then
    select credits_remaining into v_balance
    from public.user_profiles where id = p_user_id;
    return coalesce(v_balance, 0);
  end if;

  insert into public.user_profiles (id, credits_remaining)
  values (p_user_id, 0)
  on conflict (id) do nothing;

  update public.user_profiles
  set credits_remaining = credits_remaining + p_credits,
      updated_at = now()
  where id = p_user_id
  returning credits_remaining into v_balance;

  insert into public.credit_transactions (
    user_id, amount, transaction_type, description, balance_after,
    stripe_checkout_session_id, stripe_payment_intent_id, metadata
  ) values (
    p_user_id, p_credits, 'purchase', coalesce(p_description, 'Stripe credit purchase'),
    v_balance, p_checkout_session_id, p_payment_intent_id, coalesce(p_metadata, '{}'::jsonb)
  );

  return v_balance;
end;
$$;

revoke all on function public.soniq_apply_paid_credit_purchase(uuid, integer, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.soniq_apply_paid_credit_purchase(uuid, integer, text, text, text, jsonb) to service_role;

-- Never expose webhook event bookkeeping to browser sessions.
revoke all on public.stripe_webhook_events from anon, authenticated;
