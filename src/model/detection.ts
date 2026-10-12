// Detection probability model (spec §5.2, grounded in survey reach — see spec §0).
//
// For each enabled method m with cost c_m (USD M, so c_m / 1000 = $B-decade), sampled
// survey reach r_m (share of the galaxy its instruments can cover this decade) and sampled
// in-reach sensitivity s_m (per target in reach per $1B-decade):
//
//   p_m   = r_m × (1 − exp(−s_m × c_m_$B))     per target per decade
//   P_m   = 1 − (1 − p_m)^N_target             at least one of N_target
//   P_det = 1 − Π_m (1 − P_m)                  at least one method detects
//
// N_target is the number of detectable civilisations, except for biosignature searches,
// which look for life: their N_target is the number of life-bearing planets. Spend buys
// more looks within reach, never more reach, so p_m ≤ r_m however much is spent.
//
// Reach and sensitivity are sampled log-uniformly per call from the user's bounds; costs are
// user-set point estimates.

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
  /** In-reach sensitivity bounds (log-uniform), per target in reach per $1B-decade. */
  sensMin: number;
  sensMax: number;
  /** Survey-reach bounds (log-uniform): share of the galaxy covered this decade. */
  reachMin: number;
  reachMax: number;
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
      reachMin: cfg.reach.min,
      reachMax: cfg.reach.max,
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
 * Log-uniform draw. Always consumes one uniform, even when the bounds coincide, so a
 * point range and a wide range keep every later draw in step (the tornado compares runs
 * that differ only in one input and relies on that).
 */
function drawLogUniform(rng: Rng, min: number, max: number): number {
  const v = logUniform(rng, min, max);
  return min === max ? min : v;
}

/**
 * Return P(at least one method detects at least one target in the decade), given a sample
 * of N_detectable (civilisations) and N_lifeDetectable (life-bearing planets, used by
 * biosignature searches; defaults to N_detectable).
 */
export function pDetectGivenN(
  rng: Rng,
  methods: DetectionMethodState[],
  N_detectable: number,
  N_lifeDetectable: number = N_detectable,
): number {
  return pDetectPerMethod(rng, methods, N_detectable, N_lifeDetectable).combined;
}

/** Per-method detection probabilities for one sample, useful for diagnostics. */
export interface PerMethodProbabilities {
  byMethod: Record<DetectionMethodId, number>;
  combined: number;
}

/**
 * Numerics: log(1 − P_m) = N × log1p(−p_m), and 1 − exp(x) via −expm1(x), so tiny
 * per-target probabilities (10⁻¹⁵ and below are routine here) keep full precision.
 */
export function pDetectPerMethod(
  rng: Rng,
  methods: DetectionMethodState[],
  N_detectable: number,
  N_lifeDetectable: number = N_detectable,
): PerMethodProbabilities {
  const byMethod: Record<DetectionMethodId, number> = {
    seti: 0,
    tech: 0,
    bio: 0,
    probe: 0,
    retina: 0,
  };
  if (N_detectable <= 0 && N_lifeDetectable <= 0) return { byMethod, combined: 0 };
  let logProdMiss = 0;
  let anyOn = false;
  for (const m of methods) {
    if (!m.on || m.costM <= 0) continue;
    anyOn = true;
    // Probes can't report back within the decade: cost, but no detection chance.
    if (NO_IN_DECADE_DETECTION.includes(m.type)) continue;
    const s = drawLogUniform(rng, m.sensMin, m.sensMax);
    const reach = Math.min(1, drawLogUniform(rng, m.reachMin, m.reachMax));
    const nTarget = m.type === 'biosig' ? N_lifeDetectable : N_detectable;
    if (nTarget <= 0) continue;
    const c_B = m.costM / 1000;
    // Chance per target in reach, times the chance the target is in reach at all.
    const p_m = reach * -Math.expm1(-s * c_B);
    if (p_m <= 0) continue;
    if (p_m >= 1) {
      byMethod[m.id] = 1;
      // Saturated: this method alone gives combined=1.
      return { byMethod, combined: 1 };
    }
    const logProdMissThis = nTarget * Math.log1p(-p_m);
    byMethod[m.id] = -Math.expm1(logProdMissThis); // == 1 - exp(logProdMissThis)
    logProdMiss += logProdMissThis;
  }
  return {
    byMethod,
    // (`+ 0` turns −0, from −expm1(0), into 0.)
    combined: anyOn ? -Math.expm1(logProdMiss) + 0 : 0,
  };
}
