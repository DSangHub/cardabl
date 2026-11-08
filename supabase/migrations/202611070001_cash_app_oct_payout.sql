-- Cash App OCT / debit-push payout support (MVP)
-- Stores $Cashtag and optional last-4 for display only. Full card numbers are never stored.
-- Actual OCT or Visa Direct push requires a connected payment processor partner.

alter table public.profiles add column if not exists cash_app_cashtag text;
alter table public.profiles add column if not exists cash_app_card_last4 text;

alter table public.profiles drop constraint if exists profiles_payout_method_check;
alter table public.profiles add constraint profiles_payout_method_check
  check (payout_method in ('bank', 'debit_card', 'venmo', 'zelle', 'cash_app'));

alter table public.payouts drop constraint if exists payouts_payment_method_check;
alter table public.payouts add constraint payouts_payment_method_check
  check (payment_method in ('venmo', 'zelle', 'cash_app'));

alter table public.payouts drop constraint if exists payouts_provider_check;
alter table public.payouts add constraint payouts_provider_check
  check (provider in ('paypal_venmo', 'zelle_manual', 'cash_app_oct'));
