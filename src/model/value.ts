// Value-on-detection model from spec §5.3.
// Four channels (A: Filter info; B: Astro waste; C: Direct contact; D: Dark Forest).
// Each channel has an on/off toggle and tuneable dials.

import { VALUE_DEFAULTS } from '../constants/valueDefaults';
import type { DetectionType } from '../constants/detectionDefaults';

export interface ChannelAState {
  on: boolean;
  /**
   * @deprecated The Channel A sign is now controlled by `WorldviewDials.filterPriorBehind`
   * (the single source of truth). This field is retained for permalink back-compat only —
   * it is initialised by `defaultChannelState()` but no model code reads it.
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
  // Channel A returns the UNSIGNED magnitude Δ × V_xrisk_info. The sign — which depends
  // on whether detection confirms or challenges the user's filter prior — is applied
  // in applyWorldview() using `WorldviewDials.filterPriorBehind`. Centralising the sign
  // there fixes the prior bug where worldview-level presets (e.g. Hanson) couldn't
  // affect Channel A because the sign was being read from a separate channel-level dial.
  let A = 0;
  if (ch.A.on) {
    const delta = deltaFor(ch.A, detectionType);
    A = delta * ch.A.vXriskInfo;
  }
  // Channel B: net evidence shift (tech-viability + lightcone-claim) × cosmic endowment.
  let B = 0;
  if (ch.B.on) {
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
 * Channel B: fires once if any detection happens (the cosmic-endowment update
 *   doesn't double-count).
 * Channel C/D: fire boolean-style if any eligible type is in the set.
 */
export function channelValuesForTypeSet(
  types: readonly DetectionType[],
  ch: ChannelsState,
): { A: number; B: number; C: number; D: number } {
  let A = 0;
  if (ch.A.on && types.length > 0) {
    // Probabilistic union of Δs from each fired type. Returned UNSIGNED; sign is applied
    // in applyWorldview() from the worldview's filter prior.
    let prodMiss = 1;
    for (const t of types) prodMiss *= 1 - deltaFor(ch.A, t);
    const totalDelta = 1 - prodMiss;
    A = totalDelta * ch.A.vXriskInfo;
  }
  let B = 0;
  if (ch.B.on && types.length > 0) {
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
