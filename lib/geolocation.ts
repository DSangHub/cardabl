import "server-only";

import { getStatePayRate, type StatePayRate } from "@/lib/state-pay-rates";

type CensusResponse = {
  result?: { geographies?: { States?: Array<{ STUSAB?: string }> } };
};

export async function getPayRateForCoordinates(latitude: number, longitude: number): Promise<StatePayRate> {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error("VALIDATION");
  }

  const url = new URL("https://geocoding.geo.census.gov/geocoder/geographies/coordinates");
  url.searchParams.set("x", String(longitude));
  url.searchParams.set("y", String(latitude));
  url.searchParams.set("benchmark", "Public_AR_Current");
  url.searchParams.set("vintage", "Current_Current");
  url.searchParams.set("format", "json");

  const response = await fetch(url, {
    headers: { "User-Agent": "Cardabl/1.0 (https://cardabl.com)" },
    next: { revalidate: 86400 },
  });
  if (!response.ok) throw new Error("GEOCODER_UNAVAILABLE");
  const body = await response.json() as CensusResponse;
  const stateCode = body.result?.geographies?.States?.[0]?.STUSAB;
  const rate = stateCode ? getStatePayRate(stateCode) : null;
  if (!rate) throw new Error("OUTSIDE_SUPPORTED_STATES");
  return rate;
}
