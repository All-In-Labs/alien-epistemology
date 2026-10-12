// Detection probability model from spec §5.2.
//
// For each enabled method m with cost c_m (USD M, so c_m / 1000 = $B-decade) and
// sampled sensitivity s_m (per civ per $1B-decade):
//
//   p_m   = 1 - exp(-s_m * c_m_$B / 1)         per civ per decade
//   P_m   = 1 - (1 - p_m)^N_detectable          at least one of N_detectable
//   P_det = 1 - Π_m (1 - P_m)                   at least one method detects
//
// Sensitivities are sampled log-uniformly per call from the user's bounds; costs
// are user-set point estimates.

import type { Rng } from '../lib/rng';
import { logUniform } from '../lib/sampling';
import {
  DETECTION_DEFAULTS,
  DETECTION_METHOD_ORDER,
  NO_IN_DECADE_DETECTION,
  type DetectionMethodId,
  type DetectionType,
} from '../constants/detectionDefaults';

export interface DetectionMethodState {
  id: DetectionMethodId;
  type: DetectionType;
  on: boolean;
  /** Decadal cost in millions USD. */
  costM: number;
  /** Sensitivity bounds (log-uniform). */
  sensMin: number;
  sensMax: number;
}

export function defaultDetectionState(): DetectionMethodState[] {
  return DETECTION_METHOD_ORDER.map((id) => {
    const cfg = DETECTION_DEFAULTS[id];
    return {
      id,
      type: cfg.type,
      on: cfg.defaultOn,
      costM: cfg.costDefault,
      sensMin: cfg.sensitivity.min,
      sensMax: cfg.sensitivity.max,
    };
  });
}

/** Total decadal cost in USD millions of all enabled methods. */
export function totalDecadalCostMillions(methods: DetectionMethodState[]): number {
  let total = 0;
  for (const m of methods) {
    if (m.on) total += m.costM;
  }
  return total;
}

/**
 * Return P(at least one method detects at least one civ in the decade), given
 * a sample of N_detectable. Sensitivities are sampled per call from the user's
 * bounds.
 *
 * Numerics: uses Math.log1p(-p_m) for the log(1-p_m) term — purpose-built for
 * precision near 1, where Math.log(1-p_m) loses several mantissa bits when
 * p_m is small.
 */
export function pDetectGivenN(
  rng: Rng,
  methods: DetectionMethodState[],
  N_detectable: number,
): number {
  if (N_detectable <= 0) return 0;
  let logProdMiss = 0; // accumulate log(1 - P_m) for numerical stability
  let anyOn = false;
  for (const m of methods) {
    if (!m.on) continue;
    if (m.costM <= 0) continue;
    anyOn = true;
    // Probes can't report back within the decade: cost, but no detection chance.
    if (NO_IN_DECADE_DETECTION.includes(m.type)) continue;
    const s = logUniform(rng, m.sensMin, m.sensMax);
    const c_B = m.costM / 1000; // convert M$ to $B-decade
    const p_m = 1 - Math.exp(-s * c_B); // per civ per decade
    if (p_m <= 0) continue;
    if (p_m >= 1) return 1; // saturated — at least one civ guaranteed detected
    // P_m = 1 - (1 - p_m)^N_detectable. log(1 - P_m) = N * log1p(-p_m).
    logProdMiss += N_detectable * Math.log1p(-p_m);
  }
  if (!anyOn) return 0;
  return 1 - Math.exp(logProdMiss);
}

/** Per-method detection probabilities for one sample, useful for diagnostics. */
export interface PerMethodProbabilities {
  byMethod: Record<DetectionMethodId, number>;
  combined: number;
}

export function pDetectPerMethod(
  rng: Rng,
  methods: DetectionMethodState[],
  N_detectable: number,
): PerMethodProbabilities {
  const byMethod: Record<DetectionMethodId, number> = {
    seti: 0,
    tech: 0,
    bio: 0,
    probe: 0,
    retina: 0,
  };
  if (N_detectable <= 0) return { byMethod, combined: 0 };
  let logProdMiss = 0;
  let anyOn = false;
  for (const m of methods) {
    if (!m.on || m.costM <= 0) continue;
    anyOn = true;
    if (NO_IN_DECADE_DETECTION.includes(m.type)) continue;
    const s = logUniform(rng, m.sensMin, m.sensMax);
    const c_B = m.costM / 1000;
    const p_m = 1 - Math.exp(-s * c_B);
    if (p_m <= 0) continue;
    if (p_m >= 1) {
      byMethod[m.id] = 1;
      // Saturated: this method alone gives combined=1.
      return { byMethod, combined: 1 };
    }
    // P_m = 1 - (1 - p_m)^N. Compute via expm1+log1p for full precision.
    const logProdMissThis = N_detectable * Math.log1p(-p_m);
    byMethod[m.id] = -Math.expm1(logProdMissThis); // == 1 - exp(logProdMissThis)
    logProdMiss += logProdMissThis;
  }
  return {
    byMethod,
    combined: anyOn ? -Math.expm1(logProdMiss) : 0,
  };
}
