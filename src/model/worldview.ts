// Worldview transforms from spec §5.4. Acts on per-channel value contributions
// (output of value.ts) before EV is multiplied by P(detect).

export type RiskAversion = 'EV-max' | 'log-utility' | 'difference-making';

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
  /** P(filter behind us) — used inside channel A's value calc, surfaced here for the panel. */
  filterPriorBehind: number;
  /** Determines which summary stat the UI presents (mean / geom-mean / 25th-pctl). */
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
    riskAversion: 'EV-max',
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

  // Channel A sign tracks the user's filter prior. > 0.5 ⇒ detection challenges optimism
  // (negative information value); < 0.5 ⇒ detection confirms pessimism (positive); = 0.5
  // ⇒ neutral (no directional component, magnitude collapses to zero).
  const signA = d.filterPriorBehind > 0.5 ? -1 : d.filterPriorBehind < 0.5 ? 1 : 0;
  const A = v.A * signA * d.longtermismStrength * discountA;
  let B = v.B * d.longtermismStrength * d.hingeyness * discountB;
  if (d.personAffecting) B = 0;
  const C = v.C * d.alienMoralWeight;
  const D = v.D; // Dark Forest disvalue is a near-term cost; not transformed
  return { A, B, C, D, total: A + B + C + D };
}
