alter table public.profiles add column if not exists payout_method text not null default 'bank';
alter table public.profiles add column if not exists venmo_recipient_type text;
alter table public.profiles add column if not exists venmo_recipient text;
alter table public.profiles add column if not exists zelle_recipient text;

alter table public.profiles drop constraint if exists profiles_payout_method_check;
alter table public.profiles add constraint profiles_payout_method_check
  check (payout_method in ('bank', 'debit_card', 'venmo', 'zelle'));
alter table public.profiles drop constraint if exists profiles_venmo_recipient_type_check;
alter table public.profiles add constraint profiles_venmo_recipient_type_check
  check (venmo_recipient_type is null or venmo_recipient_type in ('EMAIL', 'PHONE', 'USER_HANDLE'));

alter table public.jobs add column if not exists claimed_by uuid references auth.users(id) on delete set null;
alter table public.jobs add column if not exists completed_at timestamptz;

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references public.jobs(id) on delete restrict,
  business_id uuid not null references auth.users(id) on delete restrict,
  worker_id uuid not null references auth.users(id) on delete restrict,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'USD' check (currency = 'USD'),
  payment_method text not null check (payment_method in ('venmo', 'zelle')),
  status text not null check (status in ('ready', 'manual_confirmation_required', 'processing', 'paid', 'failed')),
  provider text not null check (provider in ('paypal_venmo', 'zelle_manual')),
  provider_reference text,
  provider_status text,
  failure_message text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (business_id <> worker_id)
);

create index if not exists payouts_business_created_idx on public.payouts (business_id, created_at desc);
create index if not exists payouts_worker_created_idx on public.payouts (worker_id, created_at desc);
create unique index if not exists payouts_provider_reference_idx
  on public.payouts (provider, provider_reference)
  where provider_reference is not null;

alter table public.payouts enable row level security;

revoke all on public.payouts from anon;
revoke all on public.payouts from authenticated;
grant select on public.payouts to authenticated;

drop policy if exists payouts_participant_select on public.payouts;

create policy payouts_participant_select on public.payouts
  for select to authenticated
  using ((select auth.uid()) in (business_id, worker_id));

revoke all on public.payouts from public;
grant select, insert, update on public.payouts to service_role;
create index if not exists jobs_claimed_by_idx on public.jobs(claimed_by);

