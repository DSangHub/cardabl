import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  const { data, error } = await supabase.from("profiles").select("display_name, phone, role, postal_code, latitude, longitude, radius_miles, categories, browser_alerts, email_alerts, stripe_account_id, payout_method, venmo_recipient_type, venmo_recipient, zelle_recipient").eq("id", user.id).maybeSingle();
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
  const payoutMethod = ["bank", "debit_card", "venmo", "zelle"].includes(input.payout_method) ? input.payout_method : "bank";
  const venmoRecipientType = ["EMAIL", "PHONE", "USER_HANDLE"].includes(input.venmo_recipient_type) ? input.venmo_recipient_type : "USER_HANDLE";
  const rawVenmoRecipient = String(input.venmo_recipient || "").trim().slice(0, 127);
  const venmoRecipient = venmoRecipientType === "USER_HANDLE" ? rawVenmoRecipient.replace(/^@/, "") : rawVenmoRecipient || null;
  const zelleRecipient = String(input.zelle_recipient || "").trim().slice(0, 100) || null;
  if (role === "worker" && payoutMethod === "venmo" && !venmoRecipient) return Response.json({ error: "Add your Venmo handle, phone, or email." }, { status: 400 });
  if (role === "worker" && payoutMethod === "venmo" && venmoRecipientType === "USER_HANDLE" && !/^[-a-zA-Z0-9_]{1,50}$/.test(venmoRecipient || "")) return Response.json({ error: "Enter a valid Venmo username." }, { status: 400 });
  if (role === "worker" && payoutMethod === "venmo" && venmoRecipientType === "EMAIL" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(venmoRecipient || "")) return Response.json({ error: "Enter a valid Venmo email." }, { status: 400 });
  if (role === "worker" && payoutMethod === "venmo" && venmoRecipientType === "PHONE" && !/^\+?[1-9]\d{9,14}$/.test((venmoRecipient || "").replace(/[\s().-]/g, ""))) return Response.json({ error: "Enter a valid Venmo phone number." }, { status: 400 });
  if (role === "worker" && payoutMethod === "zelle" && !zelleRecipient) return Response.json({ error: "Add the phone or email registered with Zelle." }, { status: 400 });
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
    payout_method: role === "worker" ? payoutMethod : "bank",
    venmo_recipient_type: role === "worker" && payoutMethod === "venmo" ? venmoRecipientType : null,
    venmo_recipient: role === "worker" && payoutMethod === "venmo" ? venmoRecipient : null,
    zelle_recipient: role === "worker" && payoutMethod === "zelle" ? zelleRecipient : null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("profiles").upsert(record, { onConflict: "id" }).select().single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ profile: data });
}
