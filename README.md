# Cardabl

Instant local urgent-job matching within 5–10 miles.

## Backend setup

1. Create or choose a Supabase project and apply `supabase/migrations/202609150001_cardabl_accounts_jobs.sql`.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to Vercel.
3. Add `STRIPE_SECRET_KEY` for Stripe Connect worker payout onboarding.
4. Optional bank-data linking uses server-only `PLAID_CLIENT_ID`, `PLAID_SECRET`, and `PLAID_ENV` (`sandbox` or `production`). Stripe Connect remains the payout rail.

Never expose Supabase secret keys, Stripe secret keys, or Plaid credentials to the browser. Configure Supabase Auth Site URL and redirect URLs for the production domain.
