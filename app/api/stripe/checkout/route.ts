import { getPayRateForCoordinates } from "@/lib/geolocation";

export async function POST(request: Request) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const connectedAccount = process.env.STRIPE_CONNECTED_ACCOUNT_ID;
  if (!stripeSecret || !connectedAccount) return Response.json({ error: "Stripe Connect is not configured." }, { status: 503 });
  try {
    const { jobId, title, durationHours, latitude, longitude } = await request.json() as {
      jobId?: string;
      title?: string;
      durationHours?: number;
      latitude?: number;
      longitude?: number;
    };
    if (!jobId || !title || !Number.isInteger(durationHours) || !durationHours || durationHours < 1 || durationHours > 12) return Response.json({ error: "Valid job details are required." }, { status: 400 });
    if (typeof latitude !== "number" || typeof longitude !== "number") return Response.json({ error: "Use your location before posting so Cardabl can set the correct state rate." }, { status: 400 });
    const rate = await getPayRateForCoordinates(latitude, longitude);
    const origin = new URL(request.url).origin;
    const chargeAmount = rate.businessRateCents * durationHours;
    const workerAmount = rate.workerRateCents * durationHours;
    const params = new URLSearchParams({
      mode: "payment",
      success_url: `${origin}/?payment=success`,
      cancel_url: `${origin}/?payment=cancelled`,
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][product_data][name]": `${title} — ${durationHours} hours in ${rate.stateName}`,
      "line_items[0][price_data][unit_amount]": String(chargeAmount),
      "line_items[0][quantity]": "1",
      "payment_intent_data[application_fee_amount]": String(chargeAmount - workerAmount),
      "payment_intent_data[transfer_data][destination]": connectedAccount,
      "metadata[job_id]": jobId,
      "metadata[state_code]": rate.stateCode,
      "metadata[income_rank]": String(rate.rank),
      "metadata[listed_rate_cents]": String(rate.listedRateCents),
      "metadata[worker_rate_cents]": String(rate.workerRateCents),
      "metadata[business_rate_cents]": String(rate.businessRateCents),
    });
    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { Authorization: `Bearer ${stripeSecret}`, "Content-Type": "application/x-www-form-urlencoded", "Idempotency-Key": `cardabl-job-${jobId}` }, body: params });
    const session = await stripeResponse.json() as { url?: string; error?: { message?: string } };
    if (!stripeResponse.ok || !session.url) return Response.json({ error: session.error?.message ?? "Stripe could not create checkout." }, { status: 502 });
    return Response.json({ url: session.url });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "VALIDATION" || code === "OUTSIDE_SUPPORTED_STATES") return Response.json({ error: "Cardabl could not set a supported U.S. state rate for this location." }, { status: 422 });
    if (code === "GEOCODER_UNAVAILABLE") return Response.json({ error: "Location verification is temporarily unavailable. Please try again." }, { status: 503 });
    return Response.json({ error: "Checkout could not be started." }, { status: 500 });
  }
}
