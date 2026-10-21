import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return Response.json({ error: "The payout bridge is not configured yet." }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  const { payoutId, confirmation } = await request.json() as { payoutId?: string; confirmation?: string };
  const reference = String(confirmation || "").trim();
  if (!payoutId || reference.length < 4 || reference.length > 100) return Response.json({ error: "Enter the bank or Zelle confirmation reference." }, { status: 400 });
  const { data: owned } = await supabase.from("payouts").select("id, business_id, payment_method, status").eq("id", payoutId).eq("business_id", user.id).maybeSingle();
  if (!owned || owned.payment_method !== "zelle" || owned.status !== "manual_confirmation_required") return Response.json({ error: "This Zelle payout cannot be confirmed." }, { status: 409 });
  const now = new Date().toISOString();
  const { data, error } = await createAdminClient().from("payouts").update({ status: "paid", provider_reference: reference, provider_status: "BUSINESS_CONFIRMED", paid_at: now, updated_at: now }).eq("id", payoutId).eq("business_id", user.id).eq("payment_method", "zelle").eq("status", "manual_confirmation_required").select("id, status, paid_at").maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (!data) return Response.json({ error: "This Zelle payout cannot be confirmed." }, { status: 409 });
  return Response.json({ payout: data });
}

