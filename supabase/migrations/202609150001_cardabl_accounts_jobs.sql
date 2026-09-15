create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  phone text,
  role text not null default 'worker' check (role in ('worker', 'business')),
  postal_code text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  radius_miles integer not null default 10 check (radius_miles in (5, 10)),
  categories text[] not null default '{}',
  browser_alerts boolean not null default true,
  email_alerts boolean not null default true,
  stripe_account_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  business_name text not null,
  category text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  starts_at timestamptz not null,
  duration_hours integer not null check (duration_hours between 1 and 12),
  hourly_rate_cents integer not null default 2500 check (hourly_rate_cents = 2500),
  status text not null default 'open' check (status in ('open', 'claimed', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;

revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;
grant select on public.jobs to anon, authenticated;
grant insert, update on public.jobs to authenticated;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "jobs_read_open_or_owned" on public.jobs for select to anon, authenticated using (status = 'open' or (select auth.uid()) = business_id);
create policy "jobs_business_insert" on public.jobs for insert to authenticated with check ((select auth.uid()) = business_id and exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role = 'business'));
create policy "jobs_business_update" on public.jobs for update to authenticated using ((select auth.uid()) = business_id) with check ((select auth.uid()) = business_id);

alter publication supabase_realtime add table public.jobs;
