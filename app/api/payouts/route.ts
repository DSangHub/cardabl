import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  const { data, error } = await supabase.from("payouts").select("id, job_id, amount_cents, currency, payment_method, status, provider_reference, provider_status, failure_message, paid_at, created_at").order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ payouts: data });
}

export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return Response.json({ error: "The payout bridge is not configured yet." }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  const { jobId } = await request.json() as { jobId?: string };
  if (!jobId) return Response.json({ error: "A completed job is required." }, { status: 400 });

  const { data: job, error: jobError } = await supabase.from("jobs").select("id, business_id, claimed_by, duration_hours, hourly_rate_cents, worker_payout_cents, status").eq("id", jobId).eq("business_id", user.id).maybeSingle();
  if (jobError || !job || job.status !== "completed" || !job.claimed_by) return Response.json({ error: "Only a completed, claimed job can be paid." }, { status: 400 });

  const admin = createAdminClient();
  const { data: worker } = await admin.from("profiles").select("payout_method, venmo_recipient, zelle_recipient").eq("id", job.claimed_by).maybeSingle();
  if (!worker || !["venmo", "zelle"].includes(worker.payout_method)) return Response.json({ error: "This worker must choose Venmo or Zelle first." }, { status: 409 });
  if (worker.payout_method === "venmo" && !worker.venmo_recipient) return Response.json({ error: "The worker's Venmo destination is incomplete." }, { status: 409 });
  if (worker.payout_method === "zelle" && !worker.zelle_recipient) return Response.json({ error: "The worker's Zelle destination is incomplete." }, { status: 409 });

  const record = {
    job_id: job.id,
    business_id: user.id,
    worker_id: job.claimed_by,
    amount_cents: job.duration_hours * (job.worker_payout_cents ?? job.hourly_rate_cents - 100),
    payment_method: worker.payout_method,
    provider: worker.payout_method === "venmo" ? "paypal_venmo" : "zelle_manual",
    status: worker.payout_method === "venmo" ? "ready" : "manual_confirmation_required",
  };
  const { data, error } = await admin.from("payouts").insert(record).select().single();
  if (error?.code === "23505") return Response.json({ error: "A payout already exists for this job." }, { status: 409 });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ payout: data }, { status: 201 });
}

