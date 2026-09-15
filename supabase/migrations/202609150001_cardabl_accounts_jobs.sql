create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists display_name text not null default '';
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists role text not null default 'worker';
alter table public.profiles add column if not exists postal_code text;
alter table public.profiles add column if not exists latitude double precision;
alter table public.profiles add column if not exists longitude double precision;
alter table public.profiles add column if not exists radius_miles integer not null default 10;
alter table public.profiles add column if not exists categories text[] not null default '{}';
alter table public.profiles add column if not exists browser_alerts boolean not null default true;
alter table public.profiles add column if not exists email_alerts boolean not null default true;
alter table public.profiles add column if not exists stripe_account_id text;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('worker', 'business'));
alter table public.profiles drop constraint if exists profiles_latitude_check;
alter table public.profiles add constraint profiles_latitude_check check (latitude between -90 and 90);
alter table public.profiles drop constraint if exists profiles_longitude_check;
alter table public.profiles add constraint profiles_longitude_check check (longitude between -180 and 180);
alter table public.profiles drop constraint if exists profiles_radius_miles_check;
alter table public.profiles add constraint profiles_radius_miles_check check (radius_miles in (5, 10));

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

create index if not exists jobs_business_id_idx on public.jobs(business_id);
create index if not exists jobs_open_created_idx on public.jobs(created_at desc) where status = 'open';

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;

revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;
grant select on public.jobs to anon, authenticated;
grant insert, update on public.jobs to authenticated;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists jobs_read_open_or_owned on public.jobs;
drop policy if exists jobs_business_insert on public.jobs;
drop policy if exists jobs_business_update on public.jobs;
create policy jobs_read_open_or_owned on public.jobs for select to anon, authenticated using (status = 'open' or (select auth.uid()) = business_id);
create policy jobs_business_insert on public.jobs for insert to authenticated with check ((select auth.uid()) = business_id and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'business'));
create policy jobs_business_update on public.jobs for update to authenticated using ((select auth.uid()) = business_id) with check ((select auth.uid()) = business_id);

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'jobs') then
    alter publication supabase_realtime add table public.jobs;
  end if;
end $$;
