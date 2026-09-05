const BUSINESS_RATE_CENTS = 2600;
const WORKER_PAYOUT_CENTS = 2400;

export async function POST(request: Request) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const connectedAccount = process.env.STRIPE_CONNECTED_ACCOUNT_ID;
  if (!stripeSecret || !connectedAccount) return Response.json({ error: "Stripe Connect is not configured." }, { status: 503 });
  try {
    const { jobId, title, durationHours } = await request.json() as { jobId?: string; title?: string; durationHours?: number };
    if (!jobId || !title || !Number.isInteger(durationHours) || !durationHours || durationHours < 1 || durationHours > 12) return Response.json({ error: "Valid job details are required." }, { status: 400 });
    const origin = new URL(request.url).origin;
    const chargeAmount = BUSINESS_RATE_CENTS * durationHours;
    const workerAmount = WORKER_PAYOUT_CENTS * durationHours;
    const params = new URLSearchParams({
      mode: "payment",
      success_url: `${origin}/?payment=success`,
      cancel_url: `${origin}/?payment=cancelled`,
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][product_data][name]": `${title} — ${durationHours} hours`,
      "line_items[0][price_data][unit_amount]": String(chargeAmount),
      "line_items[0][quantity]": "1",
      "payment_intent_data[application_fee_amount]": String(chargeAmount - workerAmount),
      "payment_intent_data[transfer_data][destination]": connectedAccount,
      "metadata[job_id]": jobId,
    });
    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { Authorization: `Bearer ${stripeSecret}`, "Content-Type": "application/x-www-form-urlencoded", "Idempotency-Key": `cardabl-job-${jobId}` }, body: params });
    const session = await stripeResponse.json() as { url?: string; error?: { message?: string } };
    if (!stripeResponse.ok || !session.url) return Response.json({ error: session.error?.message ?? "Stripe could not create checkout." }, { status: 502 });
    return Response.json({ url: session.url });
  } catch { return Response.json({ error: "Checkout could not be started." }, { status: 500 }); }
}
