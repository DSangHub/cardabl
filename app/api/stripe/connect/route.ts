import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY) return Response.json({ error: "Stripe Connect is not configured yet." }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return Response.json({ error: "Sign in required." }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("stripe_account_id").eq("id", user.id).maybeSingle();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let accountId = profile?.stripe_account_id as string | undefined;
  if (!accountId) {
    const account = await stripe.accounts.create({ type: "express", country: "US", email: user.email, capabilities: { transfers: { requested: true } }, metadata: { cardabl_user_id: user.id } });
    accountId = account.id;
    const { error } = await supabase.from("profiles").update({ stripe_account_id: accountId }).eq("id", user.id);
    if (error) return Response.json({ error: error.message }, { status: 400 });
  }
  const origin = new URL(request.url).origin;
  const link = await stripe.accountLinks.create({ account: accountId, refresh_url: `${origin}/profile?connect=refresh`, return_url: `${origin}/profile?connect=complete`, type: "account_onboarding" });
  return Response.json({ url: link.url });
}
