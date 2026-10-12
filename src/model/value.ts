// Value-on-detection model from spec §5.3.
// Four channels (A: Filter info; B: Astro waste; C: Direct contact; D: Dark Forest).
// Each channel has an on/off toggle and tuneable dials.

import { B_FIRES, VALUE_DEFAULTS } from '../constants/valueDefaults';
import type { DetectionType } from '../constants/detectionDefaults';

export interface ChannelAState {
  on: boolean;
  /**
   * @deprecated Channel A now reads `WorldviewDials.filterPriorBehind` (the single source of
   * truth). This field is retained for permalink back-compat only — it is initialised by
   * `defaultChannelState()` but no model code reads it.
   */
  filterPriorBehind: number;
  delta: {
    biosig: number;
    technosig: number;
    radio: number;
    passive_radar: number;
    probe: number;
  };
  vXriskInfo: number;
}

export interface ChannelBState {
  on: boolean;
  techViabilityShift: number;
  lightconeClaimShift: number;
  vCosmicEndowment: number;
}

export interface ChannelCState {
  on: boolean;
  pFriendly: number;
  vContactFriendly: number;
  fires: DetectionType[];
}

export interface ChannelDState {
  on: boolean;
  pHostile: number;
  vHostileDisvalue: number;
  fires: DetectionType[];
}

export interface ChannelsState {
  A: ChannelAState;
  B: ChannelBState;
  C: ChannelCState;
  D: ChannelDState;
}

/**
 * Per-sample uncertainty on the value model. Without it, the value of a detection is a
 * single number per configuration, so every sample shares its sign and P(EV < 0) can only
 * be 0% or 100%.
 */
export interface ValueUncertainty {
  /**
   * Each channel's value magnitude (V_xrisk_info, V_cosmic_endowment, V_contact_friendly,
   * V_hostile_disvalue) is scaled per sample by an independent log-uniform factor spanning
   * ± this many orders of magnitude, normalised so the factor's mean is 1 (the dial values
   * stay the expected values).
   */
  magnitudeOOM: number;
  /**
   * Channel B's two evidence shifts are each sampled uniformly within ± this amount of
   * their dial value. Symmetric, so the expected net shift is unchanged.
   */
  shiftPM: number;
}

export function defaultValueUncertainty(): ValueUncertainty {
  return { magnitudeOOM: 1, shiftPM: 0.1 };
}

/** No per-sample uncertainty: reproduces the original point-value model exactly. */
export const NO_VALUE_UNCERTAINTY: ValueUncertainty = { magnitudeOOM: 0, shiftPM: 0 };

/** Mean of 10^U for U ~ Uniform(−w, w), used to normalise magnitude factors to mean 1. */
export function logUniformFactorMean(w: number): number {
  if (w <= 0) return 1;
  return (Math.pow(10, w) - Math.pow(10, -w)) / (2 * w * Math.LN10);
}

export function defaultChannelState(): ChannelsState {
  return {
    A: { on: true, ...VALUE_DEFAULTS.A, delta: { ...VALUE_DEFAULTS.A.delta } },
    B: { on: true, ...VALUE_DEFAULTS.B },
    C: { on: true, ...VALUE_DEFAULTS.C, fires: [...VALUE_DEFAULTS.C.fires] },
    D: { on: true, ...VALUE_DEFAULTS.D, fires: [...VALUE_DEFAULTS.D.fires] },
  };
}

function deltaFor(a: ChannelAState, t: DetectionType): number {
  switch (t) {
    case 'biosig':
      return a.delta.biosig;
    case 'technosig':
      return a.delta.technosig;
    case 'radio':
      return a.delta.radio;
    case 'passive_radar':
      return a.delta.passive_radar;
    case 'probe':
      return a.delta.probe;
  }
}

/** Per-channel value contributions for one detection-type. */
export function channelValues(
  detectionType: DetectionType,
  ch: ChannelsState,
): { A: number; B: number; C: number; D: number } {
  // Channel A returns the UNSIGNED magnitude Δ × V_xrisk_info. applyWorldview() scales it
  // by the filter prior ϕ = P(filter behind us) and makes it negative: detection moves
  // a fraction Δ of that prior mass to "filter ahead", which is bad news (Hanson 1998).
  let A = 0;
  if (ch.A.on) {
    const delta = deltaFor(ch.A, detectionType);
    A = delta * ch.A.vXriskInfo;
  }
  // Channel B: net evidence shift (tech-viability + lightcone-claim) × cosmic endowment.
  // Needs a technosignature (see B_FIRES).
  let B = 0;
  if (ch.B.on && B_FIRES.includes(detectionType)) {
    const net = ch.B.techViabilityShift + ch.B.lightconeClaimShift;
    B = net * ch.B.vCosmicEndowment;
  }
  // Channel C: only fires for receiving-info types.
  let C = 0;
  if (ch.C.on && ch.C.fires.includes(detectionType)) {
    C = ch.C.pFriendly * ch.C.vContactFriendly;
  }
  // Channel D: only fires for types that alert hostile alien attention.
  let D = 0;
  if (ch.D.on && ch.D.fires.includes(detectionType)) {
    D = ch.D.pHostile * ch.D.vHostileDisvalue;
  }
  return { A, B, C, D };
}

export function valueOnDetection(detectionType: DetectionType, ch: ChannelsState): number {
  const v = channelValues(detectionType, ch);
  return v.A + v.B + v.C + v.D;
}

/**
 * Per-channel value contributions when MULTIPLE methods detected and produced
 * a SET of detection types. Used by the subset-enumeration EV calc.
 *
 * Channel A: each fired type contributes its Δ as independent evidence about
 *   the Filter. Independent updates combine probabilistically (1 - Π(1-Δ_i));
 *   for small Δ that ≈ Σ Δ_i. We use the probabilistic-union form so the total
 *   is naturally bounded in [0, 1].
 * Channel B: fires once if any technosignature-type detection happens (the
 *   cosmic-endowment update doesn't double-count; biosignatures alone don't fire it).
 * Channel C/D: fire boolean-style if any eligible type is in the set.
 */
export function channelValuesForTypeSet(
  types: readonly DetectionType[],
  ch: ChannelsState,
): { A: number; B: number; C: number; D: number } {
  let A = 0;
  if (ch.A.on && types.length > 0) {
    // Probabilistic union of Δs from each fired type. Returned UNSIGNED; applyWorldview()
    // scales by the filter prior and applies the (negative) sign.
    let prodMiss = 1;
    for (const t of types) prodMiss *= 1 - deltaFor(ch.A, t);
    const totalDelta = 1 - prodMiss;
    A = totalDelta * ch.A.vXriskInfo;
  }
  let B = 0;
  if (ch.B.on && types.some((t) => B_FIRES.includes(t))) {
    const net = ch.B.techViabilityShift + ch.B.lightconeClaimShift;
    B = net * ch.B.vCosmicEndowment;
  }
  let C = 0;
  if (ch.C.on && types.some((t) => ch.C.fires.includes(t))) {
    C = ch.C.pFriendly * ch.C.vContactFriendly;
  }
  let D = 0;
  if (ch.D.on && types.some((t) => ch.D.fires.includes(t))) {
    D = ch.D.pHostile * ch.D.vHostileDisvalue;
  }
  return { A, B, C, D };
}

export function valueForTypeSet(
  types: readonly DetectionType[],
  ch: ChannelsState,
): number {
  const v = channelValuesForTypeSet(types, ch);
  return v.A + v.B + v.C + v.D;
}
