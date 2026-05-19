import { sampleDrake, type DrakeRanges } from './drake';
import {
  pDetectPerMethod,
  totalDecadalCostMillions,
  type DetectionMethodState,
} from './detection';
import { valueForTypeSet, type ChannelsState } from './value';
import { applyWorldview, defaultWorldview, type WorldviewDials } from './worldview';
import {
  sampleGrabbyZoneCredence,
  sensitivityBoostFor,
  type GrabbyState,
} from './grabby';
import { makeRng } from '../lib/rng';
import type { DetectionType } from '../constants/detectionDefaults';

export type CosmologyMode = 'sdo' | 'grabby' | 'hybrid';

export interface PriorOverrides {
  /** When set, P(N≥1) is replaced by this value, bypassing Drake/Grabby for the partition stat.
   *  N_detectable is sampled from a Bernoulli(value) ⇒ N=fixed-large when alive, 0 otherwise.  */
  overridePNGteOne?: number | undefined;
  /** When set, P(detection|aliens) is floored at this value (for users who think
   *  alien presence is already evident in some form). */
  detectionFloor?: number | undefined;
}

export interface DrakeMCInput {
  ranges: DrakeRanges;
  /** Optional detection methods. When provided, MC also computes pAnyDetection. */
  methods?: DetectionMethodState[];
  /** Optional value channels. When provided, MC also computes EV in DALYs. */
  channels?: ChannelsState;
  /** Optional worldview transforms. When provided, channel-values are transformed before EV is summed. */
  worldview?: WorldviewDials;
  /** Cosmological framework. Default 'sdo'. */
  cosmology?: CosmologyMode;
  /** Grabby Aliens state — used when cosmology = grabby or hybrid. */
  grabby?: GrabbyState;
  /** Optional Bayesian-shortcut prior overrides per spec §5.5. */
  overrides?: PriorOverrides;
  n: number;
  seed: string;
}

export interface DrakeMCOutput {
  pNZero: number;
  pNExactlyOne: number;
  pNGtOne: number;
  pNGteOne: number;
  /** Mean P(detect ≥ 1 civ across enabled methods) over MC samples. */
  pAnyDetection: number;
  /** Mean expected value (DALYs) across MC samples — `P(detect) × V_user`. */
  evDALYs: number;
  /** Total decadal cost in M$ for enabled methods (constant per run). */
  totalCostM: number;
  /** P(EV < 0) — non-trivial under hostile-contact channel D. */
  pNegativeEV: number;
  /** P(multiplier > 1× GiveWell). */
  pAboveGiveWell: number;
  /** Cost-effectiveness multiplier samples in × GiveWell-bar units. May be negative. */
  multiplierSamples: Float64Array;
  /** Median × GiveWell of multiplier samples (excluding non-finite). */
  medianMultiplier: number;
  /** Median of multiplier samples conditional on a detection occurring (more honest
   *  when most samples have no detection and the unconditional median collapses on 0). */
  medianMultiplierGivenDetection: number;
  /** Geometric mean of strictly-positive multipliers (a more stable headline than the
   *  unconditional median when the zero-mass dominates). */
  gmeanPositiveMultiplier: number;
  /** 5th and 95th percentile of multiplier samples. */
  p5Multiplier: number;
  p95Multiplier: number;
  samples: Float64Array;
  detectableSamples: Float64Array;
  detectionProbSamples: Float64Array;
  evSamples: Float64Array;
}

/** GiveWell top-charity bar in DALYs per dollar (~$100/DALY averted). */
export const GIVEWELL_BAR_DALY_PER_DOLLAR = 1 / 100;

export function runDrakeMC({
  ranges,
  methods,
  channels,
  worldview,
  cosmology = 'sdo',
  grabby,
  overrides,
  n,
  seed,
}: DrakeMCInput): DrakeMCOutput {
  const rng = makeRng(seed);
  const samples = new Float64Array(n);
  const detectableSamples = new Float64Array(n);
  const detectionProbSamples = new Float64Array(n);
  const evSamples = new Float64Array(n);

  // Partition stats — Poisson-correct interpretation. Drake's N is a *rate*
  // (expected count), so P(actual count = 0) = exp(-N), P(=1) = N·exp(-N), etc.
  // We accumulate these analytically rather than thresholding the rate.
  let pNZeroSum = 0;
  let pNOneSum = 0;
  let pNGtOneSum = 0;
  let detectionSum = 0;
  let evSum = 0;

  const grabbyBoosted: DetectionMethodState[] | undefined =
    methods !== undefined && cosmology !== 'sdo'
      ? methods.map((m) => ({
          ...m,
          sensMin: m.sensMin * sensitivityBoostFor(m.type),
          sensMax: m.sensMax * sensitivityBoostFor(m.type),
        }))
      : undefined;

  // Pre-compute V(types) for every non-empty subset of detection types so the
  // per-sample EV calc just looks up the answer. With 5 unique types there are
  // 31 subsets; we key by a bitmask.
  const wv = worldview ?? defaultWorldview();
  const TYPE_ORDER: readonly DetectionType[] = [
    'radio',
    'technosig',
    'biosig',
    'probe',
    'passive_radar',
  ];
  const vByMask: number[] | null = channels
    ? (() => {
        const out = new Array<number>(1 << TYPE_ORDER.length).fill(0);
        for (let mask = 1; mask < 1 << TYPE_ORDER.length; mask++) {
          const types: DetectionType[] = [];
          for (let i = 0; i < TYPE_ORDER.length; i++) {
            const t = TYPE_ORDER[i];
            if (t !== undefined && (mask & (1 << i)) !== 0) types.push(t);
          }
          out[mask] = applyWorldview(
            // valueForTypeSet returns components; we use channelValuesForTypeSet
            // through valueForTypeSet's returned scalar — but applyWorldview
            // needs per-channel components. Build them inline:
            channelValueComponentsForTypeSet(types, channels),
            wv,
          ).total;
        }
        return out;
      })()
    : null;

  // Map detection-method id → bit position in the type mask.
  const typeBit = (type: DetectionType): number => {
    const i = TYPE_ORDER.indexOf(type);
    return i < 0 ? 0 : 1 << i;
  };

  const grabbyWeight = wv.grabbyCredence;

  for (let i = 0; i < n; i++) {
    let useGrabby = false;
    if (cosmology === 'grabby') {
      useGrabby = true;
    } else if (cosmology === 'hybrid') {
      useGrabby = rng() < grabbyWeight;
    }
    let N: number;
    let N_detectable: number;
    if (useGrabby && grabby !== undefined) {
      const zoneP = sampleGrabbyZoneCredence(rng, grabby);
      const inside = rng() < zoneP;
      N = inside ? 1e6 : 0;
      N_detectable = N;
    } else {
      const s = sampleDrake(rng, ranges);
      N = s.N;
      N_detectable = s.N_detectable;
    }
    let overrideAlive: boolean | undefined = undefined;
    if (overrides?.overridePNGteOne !== undefined) {
      overrideAlive = rng() < overrides.overridePNGteOne;
      N = overrideAlive ? Math.max(N, 1) : 0;
      N_detectable = overrideAlive ? Math.max(N_detectable, 1) : 0;
    }
    samples[i] = N;
    detectableSamples[i] = N_detectable;

    // Partition contributions.
    if (overrideAlive !== undefined) {
      // Bayesian-shortcut override directly sets P(N≥1). Bypass the Poisson partition
      // so the user-set value round-trips through the headline pNGteOne stat; otherwise
      // small Drake-derived N values get bumped to 1 by Math.max and exp(-1)=0.37 leaks
      // into pNZero, breaking the UI's promise that the slider controls P(N≥1).
      if (overrideAlive) {
        pNGtOneSum += 1;
      } else {
        pNZeroSum += 1;
      }
    } else if (N <= 0) {
      pNZeroSum += 1;
    } else {
      // Poisson partition: for very large N, exp(-N) underflows to 0 → contributes 0 to
      // pNZero, 0 to pNOne, 1 to pNGtOne. Float64 handles this transition gracefully.
      const expNeg = Math.exp(-N);
      pNZeroSum += expNeg;
      pNOneSum += N * expNeg;
      pNGtOneSum += 1 - expNeg - N * expNeg;
    }

    if (methods !== undefined) {
      const m = useGrabby && grabbyBoosted ? grabbyBoosted : methods;
      const per = pDetectPerMethod(rng, m, N_detectable);
      let pCombined = per.combined;
      if (overrides?.detectionFloor !== undefined && N_detectable > 0) {
        pCombined = Math.max(pCombined, overrides.detectionFloor);
      }
      detectionProbSamples[i] = pCombined;
      detectionSum += pCombined;

      if (vByMask) {
        // Subset enumeration: for each non-empty subset S of enabled methods,
        // P(exactly S detects) = Π_{m∈S} P_m × Π_{m∉S} (1 − P_m). We compute
        // EV = Σ_S P(exactly S) × V(types_in_S).
        //
        // For typical configs only 1–2 methods are enabled, so most subsets
        // contribute zero (Π includes a 0). We optimise by collecting the
        // active methods first.
        const active: { id: DetectionMethodState['id']; type: DetectionType; pm: number }[] = [];
        for (const mm of m) {
          if (!mm.on || mm.costM <= 0) continue;
          const pm = per.byMethod[mm.id];
          if (pm <= 0) continue;
          active.push({ id: mm.id, type: mm.type, pm });
        }
        const k = active.length;
        if (k > 0) {
          let ev = 0;
          for (let s = 1; s < 1 << k; s++) {
            let prob = 1;
            let typeMask = 0;
            for (let j = 0; j < k; j++) {
              const a = active[j];
              if (a === undefined) continue;
              if ((s & (1 << j)) !== 0) {
                prob *= a.pm;
                typeMask |= typeBit(a.type);
              } else {
                prob *= 1 - a.pm;
              }
            }
            const v = vByMask[typeMask] ?? 0;
            ev += prob * v;
          }
          // Apply detection-floor as a value-weighted blend if it's set: floor
          // the implied detection probability up to the floor by treating the
          // missing mass as "average-type detection."
          if (
            overrides?.detectionFloor !== undefined &&
            N_detectable > 0 &&
            per.combined < overrides.detectionFloor
          ) {
            const missing = overrides.detectionFloor - per.combined;
            // Average V across enabled-method type singletons as a fallback.
            let avgSingleV = 0;
            for (const a of active) {
              avgSingleV += vByMask[typeBit(a.type)] ?? 0;
            }
            avgSingleV /= active.length;
            ev += missing * avgSingleV;
          }
          evSamples[i] = ev;
          evSum += ev;
        }
      }
    }
  }

  const totalCostM = methods !== undefined ? totalDecadalCostMillions(methods) : 0;
  const totalCostUSD = totalCostM * 1e6;
  const multiplierSamples = new Float64Array(n);
  let pNeg = 0;
  let pAbove = 0;
  if (totalCostUSD > 0 && channels !== undefined) {
    for (let i = 0; i < n; i++) {
      const ev = evSamples[i] ?? 0;
      const dalysPerDollar = ev / totalCostUSD;
      const multiplier = dalysPerDollar / GIVEWELL_BAR_DALY_PER_DOLLAR;
      multiplierSamples[i] = multiplier;
      if (multiplier < 0) pNeg++;
      if (multiplier > 1) pAbove++;
    }
  }

  const sortedMultipliers =
    totalCostUSD > 0 ? Array.from(multiplierSamples).sort((a, b) => a - b) : [];
  const pickPctl = (p: number): number => {
    if (sortedMultipliers.length === 0) return 0;
    const idx = Math.max(
      0,
      Math.min(sortedMultipliers.length - 1, Math.floor(p * sortedMultipliers.length)),
    );
    return sortedMultipliers[idx] ?? 0;
  };

  const positiveSorted: number[] = [];
  for (const v of sortedMultipliers) {
    if (v !== 0) positiveSorted.push(v);
  }
  const medianGivenDetection =
    positiveSorted.length > 0
      ? (positiveSorted[Math.floor(positiveSorted.length / 2)] ?? 0)
      : 0;

  let logSum = 0;
  let logCount = 0;
  for (const v of multiplierSamples) {
    if (v > 0 && Number.isFinite(v)) {
      logSum += Math.log(v);
      logCount++;
    }
  }
  const gmeanPositive = logCount > 0 ? Math.exp(logSum / logCount) : 0;

  return {
    pNZero: pNZeroSum / n,
    pNExactlyOne: pNOneSum / n,
    pNGtOne: pNGtOneSum / n,
    pNGteOne: 1 - pNZeroSum / n,
    pAnyDetection: methods !== undefined ? detectionSum / n : 0,
    evDALYs: channels !== undefined ? evSum / n : 0,
    totalCostM,
    pNegativeEV: totalCostUSD > 0 ? pNeg / n : 0,
    pAboveGiveWell: totalCostUSD > 0 ? pAbove / n : 0,
    multiplierSamples,
    medianMultiplier: pickPctl(0.5),
    medianMultiplierGivenDetection: medianGivenDetection,
    gmeanPositiveMultiplier: gmeanPositive,
    p5Multiplier: pickPctl(0.05),
    p95Multiplier: pickPctl(0.95),
    samples,
    detectableSamples,
    detectionProbSamples,
    evSamples,
  };
}

// Local helper: compute per-channel components for a type set so we can
// run them through worldview transforms. Avoids a circular import on
// channelValuesForTypeSet's full return.
function channelValueComponentsForTypeSet(
  types: readonly DetectionType[],
  ch: ChannelsState,
): { A: number; B: number; C: number; D: number } {
  // Re-implement here to avoid an import shuffle. The intent matches
  // channelValuesForTypeSet in value.ts but we keep both call sites working.
  // (See value.ts for spec rationale.)
  let A = 0;
  if (ch.A.on && types.length > 0) {
    let prodMiss = 1;
    for (const t of types) {
      const d =
        t === 'biosig'
          ? ch.A.delta.biosig
          : t === 'technosig'
            ? ch.A.delta.technosig
            : t === 'radio'
              ? ch.A.delta.radio
              : t === 'passive_radar'
                ? ch.A.delta.passive_radar
                : ch.A.delta.probe;
      prodMiss *= 1 - d;
    }
    const totalDelta = 1 - prodMiss;
    // Unsigned magnitude; sign is applied later by applyWorldview using the worldview's
    // filterPriorBehind dial.
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

// Re-export so anything still importing valueForTypeSet keeps working
export { valueForTypeSet };
