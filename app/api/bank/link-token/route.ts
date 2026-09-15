import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  if (!clientId || !secret) return Response.json({ error: "Plaid bank linking is not configured yet." }, { status: 503 });
  const environment = process.env.PLAID_ENV === "production" ? "production" : "sandbox";
  const response = await fetch(`https://${environment}.plaid.com/link/token/create`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ client_id: clientId, secret, client_name: "Cardabl", language: "en", country_codes: ["US"], products: ["auth"], user: { client_user_id: user.id } }),
  });
  const data = await response.json();
  return Response.json(data, { status: response.status });
}
