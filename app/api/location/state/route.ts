import { getPayRateForCoordinates } from "@/lib/geolocation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const latitudeValue = url.searchParams.get("latitude");
  const longitudeValue = url.searchParams.get("longitude");
  if (latitudeValue === null || longitudeValue === null) return Response.json({ error: "Valid coordinates are required." }, { status: 400 });
  const latitude = Number(latitudeValue);
  const longitude = Number(longitudeValue);

  try {
    const rate = await getPayRateForCoordinates(latitude, longitude);
    return Response.json(rate, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "VALIDATION") return Response.json({ error: "Valid coordinates are required." }, { status: 400 });
    if (code === "OUTSIDE_SUPPORTED_STATES") return Response.json({ error: "Cardabl currently supports locations in the 50 U.S. states." }, { status: 422 });
    return Response.json({ error: "Your state could not be identified right now. Please try again." }, { status: 502 });
  }
}
