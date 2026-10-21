create table if not exists public.state_pay_rates (
  state_code text primary key check (state_code ~ '^[A-Z]{2}$'),
  state_name text not null unique,
  income_rank integer not null unique check (income_rank between 1 and 50),
  listed_rate_cents integer not null check (listed_rate_cents in (1800, 2000, 2500)),
  data_year integer not null default 2025 check (data_year >= 2025),
  source_url text not null,
  updated_at timestamptz not null default now()
);

insert into public.state_pay_rates (state_code, state_name, income_rank, listed_rate_cents, data_year, source_url) values
  ('CT','Connecticut',1,2500,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('MA','Massachusetts',2,2500,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('NY','New York',3,2500,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('WY','Wyoming',4,2500,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('CA','California',5,2500,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('NJ','New Jersey',6,2500,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('WA','Washington',7,2500,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('NH','New Hampshire',8,2500,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('CO','Colorado',9,2500,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('MD','Maryland',10,2500,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('VA','Virginia',11,2000,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('AK','Alaska',12,2000,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('SD','South Dakota',13,2000,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('IL','Illinois',14,2000,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('FL','Florida',15,2000,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('MN','Minnesota',16,2000,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('ND','North Dakota',17,2000,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('HI','Hawaii',18,2000,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('NE','Nebraska',19,2000,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('VT','Vermont',20,2000,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('PA','Pennsylvania',21,2000,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('RI','Rhode Island',22,2000,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('NV','Nevada',23,2000,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('OR','Oregon',24,2000,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('TX','Texas',25,2000,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('MT','Montana',26,1800,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('ME','Maine',27,1800,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('WI','Wisconsin',28,1800,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('UT','Utah',29,1800,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('MO','Missouri',30,1800,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('TN','Tennessee',31,1800,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('KS','Kansas',32,1800,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('DE','Delaware',33,1800,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('AZ','Arizona',34,1800,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('NC','North Carolina',35,1800,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('OH','Ohio',36,1800,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('IA','Iowa',37,1800,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('MI','Michigan',38,1800,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('IN','Indiana',39,1800,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('OK','Oklahoma',40,1800,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('GA','Georgia',41,1800,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('ID','Idaho',42,1800,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('LA','Louisiana',43,1800,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('SC','South Carolina',44,1800,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('NM','New Mexico',45,1800,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('AR','Arkansas',46,1800,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('KY','Kentucky',47,1800,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('AL','Alabama',48,1800,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('WV','West Virginia',49,1800,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1'),
  ('MS','Mississippi',50,1800,2025,'https://www.statsamerica.org/sip/rank_list.aspx?rank_label=pcpi1')
on conflict (state_code) do update set
  state_name = excluded.state_name,
  income_rank = excluded.income_rank,
  listed_rate_cents = excluded.listed_rate_cents,
  data_year = excluded.data_year,
  source_url = excluded.source_url,
  updated_at = now();

alter table public.state_pay_rates enable row level security;
revoke all on public.state_pay_rates from public, anon, authenticated;
grant select on public.state_pay_rates to anon, authenticated;
drop policy if exists state_pay_rates_public_read on public.state_pay_rates;
create policy state_pay_rates_public_read on public.state_pay_rates for select to anon, authenticated using (true);

alter table public.jobs drop constraint if exists jobs_hourly_rate_cents_check;
alter table public.jobs alter column hourly_rate_cents set default 1800;
alter table public.jobs add column if not exists state_code text references public.state_pay_rates(state_code);
alter table public.jobs add column if not exists income_rank integer;
alter table public.jobs add column if not exists worker_payout_cents integer;
alter table public.jobs add column if not exists business_charge_cents integer;
alter table public.jobs drop constraint if exists jobs_state_income_rank_check;
alter table public.jobs add constraint jobs_state_income_rank_check check (income_rank is null or income_rank between 1 and 50);
alter table public.jobs drop constraint if exists jobs_state_hourly_rate_check;
alter table public.jobs add constraint jobs_state_hourly_rate_check check (hourly_rate_cents in (1800, 2000, 2500));
alter table public.jobs drop constraint if exists jobs_worker_payout_check;
alter table public.jobs add constraint jobs_worker_payout_check check (worker_payout_cents is null or worker_payout_cents = hourly_rate_cents - 100);
alter table public.jobs drop constraint if exists jobs_business_charge_check;
alter table public.jobs add constraint jobs_business_charge_check check (business_charge_cents is null or business_charge_cents = hourly_rate_cents + 100);

create or replace function public.set_job_state_rate_snapshot()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare selected_rate public.state_pay_rates%rowtype;
begin
  if new.state_code is null then
    if tg_op = 'INSERT' then raise exception 'state_code is required for new jobs'; end if;
    return new;
  end if;
  select * into selected_rate from public.state_pay_rates where state_code = upper(new.state_code);
  if not found then raise exception 'unsupported state_code'; end if;
  new.state_code := selected_rate.state_code;
  new.income_rank := selected_rate.income_rank;
  new.hourly_rate_cents := selected_rate.listed_rate_cents;
  new.worker_payout_cents := selected_rate.listed_rate_cents - 100;
  new.business_charge_cents := selected_rate.listed_rate_cents + 100;
  return new;
end;
$$;

drop trigger if exists jobs_set_state_rate_snapshot on public.jobs;
create trigger jobs_set_state_rate_snapshot before insert or update of state_code on public.jobs
for each row execute function public.set_job_state_rate_snapshot();

create index if not exists jobs_state_code_idx on public.jobs(state_code);
