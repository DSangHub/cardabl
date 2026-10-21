import { createAdminClient } from "@/lib/supabase/admin";
import { getPayPalAccessToken } from "@/lib/paypal";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId || !process.env.SUPABASE_SERVICE_ROLE_KEY) return Response.json({ error: "PayPal webhook is not configured." }, { status: 503 });
  const event = await request.json() as { event_type?: string; resource?: { payout_item?: { sender_item_id?: string }; transaction_status?: string; errors?: { message?: string } } };
  const { token, api } = await getPayPalAccessToken();
  const verification = await fetch(`${api}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_algo: request.headers.get("paypal-auth-algo"),
      cert_url: request.headers.get("paypal-cert-url"),
      transmission_id: request.headers.get("paypal-transmission-id"),
      transmission_sig: request.headers.get("paypal-transmission-sig"),
      transmission_time: request.headers.get("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: event,
    }),
    cache: "no-store",
  });
  const verificationBody = await verification.json() as { verification_status?: string };
  if (!verification.ok || verificationBody.verification_status !== "SUCCESS") return Response.json({ error: "Invalid PayPal signature." }, { status: 401 });

  const senderItemId = event.resource?.payout_item?.sender_item_id || "";
  const payoutId = senderItemId.startsWith("payout-") ? senderItemId.slice(7) : "";
  if (!UUID.test(payoutId)) return Response.json({ received: true });
  const eventType = event.event_type || "";
  const paid = eventType === "PAYMENT.PAYOUTS-ITEM.SUCCEEDED";
  const failed = ["PAYMENT.PAYOUTS-ITEM.FAILED", "PAYMENT.PAYOUTS-ITEM.BLOCKED", "PAYMENT.PAYOUTS-ITEM.RETURNED", "PAYMENT.PAYOUTS-ITEM.UNCLAIMED"].includes(eventType);
  if (!paid && !failed) return Response.json({ received: true });
  const now = new Date().toISOString();
  await createAdminClient().from("payouts").update({
    status: paid ? "paid" : "failed",
    provider_status: event.resource?.transaction_status || eventType,
    failure_message: failed ? event.resource?.errors?.message?.slice(0, 300) || "PayPal did not complete the payout." : null,
    paid_at: paid ? now : null,
    updated_at: now,
  }).eq("id", payoutId).eq("payment_method", "venmo");
  return Response.json({ received: true });
}

