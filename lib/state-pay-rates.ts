export type StatePayRate = {
  stateCode: string;
  stateName: string;
  rank: number;
  listedRateCents: 1800 | 2000 | 2500;
  workerRateCents: 1700 | 1900 | 2400;
  businessRateCents: 1900 | 2100 | 2600;
  dataYear: 2025;
};

const STATES_BY_INCOME_RANK = [
  ["CT", "Connecticut"], ["MA", "Massachusetts"], ["NY", "New York"], ["WY", "Wyoming"],
  ["CA", "California"], ["NJ", "New Jersey"], ["WA", "Washington"], ["NH", "New Hampshire"],
  ["CO", "Colorado"], ["MD", "Maryland"], ["VA", "Virginia"], ["AK", "Alaska"],
  ["SD", "South Dakota"], ["IL", "Illinois"], ["FL", "Florida"], ["MN", "Minnesota"],
  ["ND", "North Dakota"], ["HI", "Hawaii"], ["NE", "Nebraska"], ["VT", "Vermont"],
  ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["NV", "Nevada"], ["OR", "Oregon"],
  ["TX", "Texas"], ["MT", "Montana"], ["ME", "Maine"], ["WI", "Wisconsin"],
  ["UT", "Utah"], ["MO", "Missouri"], ["TN", "Tennessee"], ["KS", "Kansas"],
  ["DE", "Delaware"], ["AZ", "Arizona"], ["NC", "North Carolina"], ["OH", "Ohio"],
  ["IA", "Iowa"], ["MI", "Michigan"], ["IN", "Indiana"], ["OK", "Oklahoma"],
  ["GA", "Georgia"], ["ID", "Idaho"], ["LA", "Louisiana"], ["SC", "South Carolina"],
  ["NM", "New Mexico"], ["AR", "Arkansas"], ["KY", "Kentucky"], ["AL", "Alabama"],
  ["WV", "West Virginia"], ["MS", "Mississippi"],
] as const;

export const STATE_PAY_RATES: readonly StatePayRate[] = STATES_BY_INCOME_RANK.map(([stateCode, stateName], index) => {
  const rank = index + 1;
  const listedRateCents = rank <= 10 ? 2500 : rank <= 25 ? 2000 : 1800;
  return {
    stateCode,
    stateName,
    rank,
    listedRateCents,
    workerRateCents: listedRateCents - 100,
    businessRateCents: listedRateCents + 100,
    dataYear: 2025,
  } as StatePayRate;
});

export function getStatePayRate(state: string): StatePayRate | null {
  const normalized = state.trim().toLowerCase();
  return STATE_PAY_RATES.find(
    (rate) => rate.stateCode.toLowerCase() === normalized || rate.stateName.toLowerCase() === normalized,
  ) ?? null;
}

export function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}
