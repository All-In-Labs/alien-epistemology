// Worldview transforms from spec §5.4. Acts on per-channel value contributions
// (output of value.ts) before EV is multiplied by P(detect).

/**
 * How the Ch.5 verdict summarises outcomes in GiveWell terms.
 * - 'average': the mean, so long shots count fully (risk-neutral)
 * - 'typical': the median, the outcome in a typical world
 * - 'cautious': the 25th percentile, focusing on the worse cases
 */
export type RiskAversion = 'average' | 'typical' | 'cautious';

/** Map stored values, including the old technical names in older permalinks. */
export function normalizeRiskAversion(x: unknown): RiskAversion {
  switch (x) {
    case 'average':
    case 'typical':
    case 'cautious':
      return x;
    case 'log-utility':
      return 'typical';
    case 'difference-making':
      return 'cautious';
    default:
      return 'average';
  }
}

export interface WorldviewDials {
  /** 0 = neartermist (channels A, B zeroed); 1 = pure total-view longtermism. */
  longtermismStrength: number;
  /** Annual discount rate (0–0.10). Channels A and B get discounted by (1+r)^-T. */
  timeDiscount: number;
  /** When true, channel B (astronomical waste) is zeroed. */
  personAffecting: boolean;
  /** Multiplier on channel C (alien interests). */
  alienMoralWeight: number;
  /** Multiplier on channel B (does our action shift cosmic endowment?). */
  hingeyness: number;
  /** P(filter behind us). Channel A's (negative) value scales with it. */
  filterPriorBehind: number;
  /** Which secondary GiveWell number the verdict shows (mean / median / 25th percentile). */
  riskAversion: RiskAversion;
  /** Grabby Aliens mixing weight for hybrid cosmology (used in phase 5). */
  grabbyCredence: number;
}

export interface ChannelContributions {
  A: number;
  B: number;
  C: number;
  D: number;
}

export interface WorldviewOutput extends ChannelContributions {
  total: number;
}

export function defaultWorldview(): WorldviewDials {
  return {
    longtermismStrength: 0.3,
    timeDiscount: 0.001,
    personAffecting: false,
    alienMoralWeight: 0.1,
    hingeyness: 0.1,
    filterPriorBehind: 0.5,
    riskAversion: 'average',
    grabbyCredence: 0.1,
  };
}

// Time horizons (years) for each channel — used for the (1+r)^-T discount.
// Channel A: information about x-risk pays out roughly in our generation.
// Channel B: cosmic endowment pays out over an astronomical timescale.
const HORIZON_A = 100;
const HORIZON_B = 1000;

export function applyWorldview(
  v: ChannelContributions,
  d: WorldviewDials,
): WorldviewOutput {
  const discountA = Math.pow(1 + d.timeDiscount, -HORIZON_A);
  const discountB = Math.pow(1 + d.timeDiscount, -HORIZON_B);

  // Channel A: news about the Great Filter. Finding life elsewhere is evidence that the
  // steps behind us were easy, which moves credence from "filter behind us" to "filter
  // ahead" — bad news whatever your prior (Hanson 1998). v.A is the unsigned Δ × V; the
  // update can only move credence that exists, so it scales with ϕ = P(filter behind).
  // It is zero only if you already put no weight on the filter being behind us.
  const A = -v.A * d.filterPriorBehind * d.longtermismStrength * discountA;
  let B = v.B * d.longtermismStrength * d.hingeyness * discountB;
  if (d.personAffecting) B = 0;
  const C = v.C * d.alienMoralWeight;
  const D = v.D; // Dark Forest disvalue is a near-term cost; not transformed
  return { A, B, C, D, total: A + B + C + D };
}
