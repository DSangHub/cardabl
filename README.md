# Cardabl

Instant local urgent-job matching within 5–10 miles.

## Backend setup

1. Create or choose a Supabase project and apply the SQL files in `supabase/migrations` in filename order.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to Vercel.
3. Add the server-only `SUPABASE_SERVICE_ROLE_KEY`. It is used only after an authenticated business and completed job are verified; never prefix it with `NEXT_PUBLIC_`.
4. Add `STRIPE_SECRET_KEY` for Stripe Connect worker payout onboarding.
5. Optional bank-data linking uses server-only `PLAID_CLIENT_ID`, `PLAID_SECRET`, and `PLAID_ENV` (`sandbox` or `production`). Stripe Connect remains the payout rail.

## Venmo and Zelle payout bridge

- Venmo uses PayPal Payouts. Add `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, and `PAYPAL_ENV=sandbox`. Leave `PAYPAL_PAYOUTS_ENABLED=false` until PayPal approves Payouts and the webhook is verified end to end, then change it to `true`.
- Configure the PayPal webhook URL as `https://cardabl.app/api/paypal/webhook` and subscribe to Payouts item events.
- Zelle is a manual bank flow. The business sends through its participating bank, then records the bank/Zelle confirmation in Cardabl. Cardabl does not represent this as an automated Zelle API transfer.
- A payout can only be created for a claimed job whose status is `completed`; the amount is calculated on the server at $24 per worker hour.

Never expose Supabase secret keys, Stripe secret keys, or Plaid credentials to the browser. Configure Supabase Auth Site URL and redirect URLs for the production domain.
