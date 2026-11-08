import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return Response.json({ error: "The payout bridge is not configured yet." }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  const { payoutId } = await request.json() as { payoutId?: string };
  if (!payoutId) return Response.json({ error: "Payout ID is required." }, { status: 400 });

  const { data: payout } = await supabase.from("payouts").select("id, worker_id, amount_cents, currency, status, payment_method").eq("id", payoutId).eq("business_id", user.id).maybeSingle();
  if (!payout || payout.payment_method !== "cash_app" || !["ready", "failed"].includes(payout.status)) return Response.json({ error: "This Cash App payout is not ready." }, { status: 409 });

  const admin = createAdminClient();
  const { data: worker } = await admin.from("profiles").select("cash_app_cashtag, cash_app_card_last4").eq("id", payout.worker_id).maybeSingle();
  if (!worker?.cash_app_cashtag) return Response.json({ error: "The worker's Cash App destination is incomplete." }, { status: 409 });

  const { data: reserved } = await admin.from("payouts").update({
    status: "processing",
    failure_message: null,
    provider_status: "awaiting_oct_partner",
    updated_at: new Date().toISOString(),
  }).eq("id", payout.id).eq("business_id", user.id).in("status", ["ready", "failed"]).select("id").maybeSingle();
  if (!reserved) return Response.json({ error: "This payout is already being processed." }, { status: 409 });

  return Response.json({
    status: "processing",
    message: "Cash App OCT/debit-push payout reserved. Connect a Visa Direct, Cash App Pay Payouts, or equivalent processor partner to complete the push to the worker's $Cashtag / Cash App Card.",
    destination: {
      cashtag: worker.cash_app_cashtag,
      card_last4: worker.cash_app_card_last4 || null,
    },
    amount_cents: payout.amount_cents,
  });
}
