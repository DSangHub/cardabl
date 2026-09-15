import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  const { data, error } = await supabase.from("profiles").select("display_name, phone, role, postal_code, latitude, longitude, radius_miles, categories, browser_alerts, email_alerts, stripe_account_id").eq("id", user.id).maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ profile: data });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  const input = await request.json();
  const role = input.role === "business" ? "business" : "worker";
  const radius = input.radius_miles === 5 ? 5 : 10;
  const record = {
    id: user.id,
    email: user.email,
    display_name: String(input.display_name || "").slice(0, 100),
    phone: String(input.phone || "").slice(0, 30) || null,
    role,
    postal_code: String(input.postal_code || "").slice(0, 10) || null,
    latitude: Number.isFinite(input.latitude) ? input.latitude : null,
    longitude: Number.isFinite(input.longitude) ? input.longitude : null,
    radius_miles: radius,
    categories: Array.isArray(input.categories) ? input.categories.map(String).slice(0, 20) : [],
    browser_alerts: Boolean(input.browser_alerts),
    email_alerts: Boolean(input.email_alerts),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("profiles").upsert(record, { onConflict: "id" }).select().single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ profile: data });
}
