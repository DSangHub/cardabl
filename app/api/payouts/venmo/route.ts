import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPayPalAccessToken, paypalPayoutsEnabled } from "@/lib/paypal";

export async function POST(request: Request) {
  if (!paypalPayoutsEnabled()) return Response.json({ error: "Venmo payouts are awaiting PayPal approval and are not active yet." }, { status: 503 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return Response.json({ error: "The payout bridge is not configured yet." }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  const { payoutId } = await request.json() as { payoutId?: string };
  if (!payoutId) return Response.json({ error: "Payout ID is required." }, { status: 400 });

  const { data: payout } = await supabase.from("payouts").select("id, worker_id, amount_cents, currency, status, payment_method").eq("id", payoutId).eq("business_id", user.id).maybeSingle();
  if (!payout || payout.payment_method !== "venmo" || !["ready", "failed"].includes(payout.status)) return Response.json({ error: "This Venmo payout is not ready." }, { status: 409 });
  const admin = createAdminClient();
  const { data: worker } = await admin.from("profiles").select("venmo_recipient_type, venmo_recipient").eq("id", payout.worker_id).maybeSingle();
  if (!worker?.venmo_recipient || !["EMAIL", "PHONE", "USER_HANDLE"].includes(worker.venmo_recipient_type)) return Response.json({ error: "The worker's Venmo destination is incomplete." }, { status: 409 });

  const { data: reserved } = await admin.from("payouts").update({ status: "processing", failure_message: null, updated_at: new Date().toISOString() }).eq("id", payout.id).eq("business_id", user.id).in("status", ["ready", "failed"]).select("id").maybeSingle();
  if (!reserved) return Response.json({ error: "This payout is already being processed." }, { status: 409 });

  try {
    const { token, api } = await getPayPalAccessToken();
    const senderItemId = `payout-${payout.id}`;
    const response = await fetch(`${api}/v1/payments/payouts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender_batch_header: { sender_batch_id: `cardabl-${payout.id}`, email_subject: "Your Cardabl pay is on the way" },
        items: [{
          recipient_type: worker.venmo_recipient_type,
          recipient_wallet: "VENMO",
          receiver: worker.venmo_recipient,
          amount: { value: (payout.amount_cents / 100).toFixed(2), currency: payout.currency },
          note: "Cardabl job payout",
          sender_item_id: senderItemId,
        }],
      }),
      cache: "no-store",
    });
    const body = await response.json() as { batch_header?: { payout_batch_id?: string; batch_status?: string }; message?: string };
    if (!response.ok || !body.batch_header?.payout_batch_id) throw new Error(body.message || "PayPal rejected the payout.");
    await admin.from("payouts").update({ provider_reference: body.batch_header.payout_batch_id, provider_status: body.batch_header.batch_status || "PENDING", updated_at: new Date().toISOString() }).eq("id", payout.id).eq("business_id", user.id);
    return Response.json({ status: "processing", providerReference: body.batch_header.payout_batch_id });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 300) : "Venmo payout failed.";
    await admin.from("payouts").update({ status: "failed", failure_message: message, updated_at: new Date().toISOString() }).eq("id", payout.id).eq("business_id", user.id);
    return Response.json({ error: message }, { status: 502 });
  }
}

