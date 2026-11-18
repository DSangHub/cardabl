import { getPayPalAccessToken } from "@/lib/paypal";

export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  if (process.env.VERCEL_ENV !== "preview") return new Response(null, { status: 404, headers });
  if (process.env.PAYPAL_ENV !== "sandbox") return Response.json({ sandbox: false, authenticated: false }, { status: 503, headers });
  try {
    const { api, token } = await getPayPalAccessToken();
    const authenticated = api === "https://api-m.sandbox.paypal.com" && Boolean(token);
    return Response.json({ sandbox: true, authenticated }, { status: authenticated ? 200 : 502, headers });
  } catch {
    return Response.json({ sandbox: true, authenticated: false }, { status: 502, headers });
  }
}
