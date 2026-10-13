import { sampleDrake, type DrakeRanges } from './drake';
import {
  pDetectPerMethod,
  totalDecadalCostMillions,
  type DetectionMethodState,
} from './detection';
import {
  valueForTypeSet,
  logUniformFactorMean,
  NO_VALUE_UNCERTAINTY,
  type ChannelsState,
  type ValueUncertainty,
} from './value';
import { applyWorldview, defaultWorldview, type WorldviewDials } from './worldview';
import type { FlDistribution } from '../constants/defaults';
import { makeRng } from '../lib/rng';
import type { DetectionType } from '../constants/detectionDefaults';
import { B_FIRES } from '../constants/valueDefaults';

export interface PriorOverrides {
  /** When set, P(N≥1) is replaced by this value, bypassing Drake for the partition stat.
   *  Each sample is "alive" with this probability; alive samples take the Drake count
   *  conditioned on at least one (zero-truncated Poisson), still scaled by f_d. */
  overridePNGteOne?: number | undefined;
  /** When set, P(detection | aliens exist) is floored at this value (for users who think
   *  alien presence is already evident in some form). Scaled per sample by the chance
   *  there is at least one detectable civilisation. */
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
  /** Optional Bayesian-shortcut prior overrides per spec §5.5. */
  overrides?: PriorOverrides;
  /** Per-sample uncertainty on value magnitudes and Channel B shifts. Default: none. */
  valueUncertainty?: ValueUncertainty;
  /** How f_l is sampled. Default 'log-uniform' between the f_l bounds. */
  flDistribution?: FlDistribution;
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
  /** P(multiplier < −1× GiveWell): harm at least as large, per dollar, as the good a
   *  GiveWell top charity does. The verdict's "serious harm" group; the mirror image of
   *  pAboveGiveWell, so tiny negative values don't count as harm. */
  pHarmBeyondGiveWell: number;
  /** Cost-effectiveness multiplier samples in × GiveWell-bar units. May be negative. */
  multiplierSamples: Float64Array;
  /** Median × GiveWell of multiplier samples (excluding non-finite). */
  medianMultiplier: number;
  /** Geometric mean of strictly-positive multipliers (a more stable headline than the
   *  unconditional median when the zero-mass dominates). */
  gmeanPositiveMultiplier: number;
  /** Mean multiplier across all samples, signed — the 'average' summary. */
  meanMultiplier: number;
  /** Monte Carlo standard error of `meanMultiplier`. */
  meanMultiplierSE: number;
  /** 25th-percentile multiplier — the 'cautious' summary. */
  p25Multiplier: number;
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
  overrides,
  valueUncertainty = NO_VALUE_UNCERTAINTY,
  flDistribution = 'log-uniform',
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

  // Pre-compute worldview-transformed per-channel values for every non-empty subset of
  // detection types (31 subsets of 5 types, keyed by bitmask). Channel B is stored per
  // UNIT of net evidence shift so the shift can be sampled per sample; applyWorldview is
  // linear in each channel, so scaling afterwards is exact.
  const wv = worldview ?? defaultWorldview();
  const TYPE_ORDER: readonly DetectionType[] = [
    'radio',
    'technosig',
    'biosig',
    'probe',
    'passive_radar',
  ];
  const nMasks = 1 << TYPE_ORDER.length;
  // D is channel D's near-term part; DE is its endowment loss, kept apart so it can share
  // channel B's magnitude draw (both are V_cosmic_endowment).
  const comps: {
    A: Float64Array;
    B: Float64Array;
    C: Float64Array;
    D: Float64Array;
    DE: Float64Array;
  } | null =
    channels
      ? (() => {
          const out = {
            A: new Float64Array(nMasks),
            B: new Float64Array(nMasks),
            C: new Float64Array(nMasks),
            D: new Float64Array(nMasks),
            DE: new Float64Array(nMasks),
          };
          for (let mask = 1; mask < nMasks; mask++) {
            const types: DetectionType[] = [];
            for (let i = 0; i < TYPE_ORDER.length; i++) {
              const t = TYPE_ORDER[i];
              if (t !== undefined && (mask & (1 << i)) !== 0) types.push(t);
            }
            const c = channelValueComponentsForTypeSet(types, channels);
            const w = applyWorldview({ ...c, DEndowment: 0 }, wv);
            out.A[mask] = w.A;
            out.B[mask] = w.B;
            out.C[mask] = w.C;
            out.D[mask] = w.D;
            out.DE[mask] = applyWorldview(
              { A: 0, B: 0, C: 0, D: 0, DEndowment: c.DEndowment },
              wv,
            ).D;
          }
          return out;
        })()
      : null;
  const netShiftPoint = channels
    ? channels.B.techViabilityShift + channels.B.lightconeClaimShift
    : 0;
  const magOOM = Math.max(0, valueUncertainty.magnitudeOOM);
  const magNorm = logUniformFactorMean(magOOM);
  const shiftPM = Math.max(0, valueUncertainty.shiftPM);
  /** Log-uniform factor over ±magOOM orders of magnitude, normalised to mean 1. */
  const magFactor = (): number =>
    magOOM > 0 ? Math.pow(10, (2 * rng() - 1) * magOOM) / magNorm : 1;

  // Map detection-method id → bit position in the type mask.
  const typeBit = (type: DetectionType): number => {
    const i = TYPE_ORDER.indexOf(type);
    return i < 0 ? 0 : 1 << i;
  };

  for (let i = 0; i < n; i++) {
    const s = sampleDrake(rng, ranges, flDistribution);
    let N = s.N;
    let N_detectable = s.N_detectable;
    let N_lifeDetectable = s.N_lifeDetectable;
    let overrideAlive: boolean | undefined = undefined;
    /** P(exactly one | at least one) for this sample, when the override forces N ≥ 1. */
    let pOneGivenAlive = 0;
    if (overrides?.overridePNGteOne !== undefined) {
      overrideAlive = rng() < overrides.overridePNGteOne;
      if (overrideAlive) {
        // Condition the Poisson count on "at least one". Its mean is N / (1 − e^−N): ~1
        // when the Drake rate is tiny, ~N when it is large. P(exactly one | ≥ 1) is
        // N / (e^N − 1): ~1 for tiny N, ~0 for large. The forced civilisations still pass
        // through f_d like any others.
        const rate = s.N;
        N = rate > 0 ? rate / -Math.expm1(-rate) : 1;
        pOneGivenAlive = rate > 0 ? rate / Math.expm1(rate) : 1;
        N_detectable = N * s.components.fd;
      } else {
        N = 0;
        N_detectable = 0;
      }
      // The override is about civilisations; simple life is left as sampled, but every
      // civilisation still lives on a life-bearing planet.
      N_lifeDetectable = Math.max(N_lifeDetectable, N_detectable);
    }
    samples[i] = N;
    detectableSamples[i] = N_detectable;

    // Partition contributions.
    if (overrideAlive !== undefined) {
      // Bayesian-shortcut override directly sets P(N≥1), so the user-set value
      // round-trips through the headline pNGteOne stat. Within "at least one", the split
      // between exactly one and more than one follows the zero-truncated Poisson.
      if (overrideAlive) {
        pNOneSum += pOneGivenAlive;
        pNGtOneSum += 1 - pOneGivenAlive;
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
      const m = methods;
      const per = pDetectPerMethod(rng, m, N_detectable, N_lifeDetectable);
      // The floor promises P(detection | aliens exist) ≥ floor. N is an expected count,
      // so scale by the chance there is at least one detectable civilisation; otherwise
      // the floor would conjure detections in worlds with no one there.
      const floorHere =
        overrides?.detectionFloor !== undefined
          ? overrides.detectionFloor * -Math.expm1(-N_detectable)
          : 0;
      const pCombined = Math.max(per.combined, floorHere);
      detectionProbSamples[i] = pCombined;
      detectionSum += pCombined;

      if (comps) {
        // Per-sample value uncertainty. Draws are skipped entirely when the spreads are
        // zero, so the zero-uncertainty model reproduces the original RNG stream exactly.
        const kA = magFactor();
        const kB = magFactor();
        const kC = magFactor();
        const kD = magFactor();
        let net = netShiftPoint;
        if (shiftPM > 0 && channels) {
          net =
            channels.B.techViabilityShift +
            (2 * rng() - 1) * shiftPM +
            channels.B.lightconeClaimShift +
            (2 * rng() - 1) * shiftPM;
        }
        const vOf = (mask: number): number =>
          kA * (comps.A[mask] ?? 0) +
          kB * net * (comps.B[mask] ?? 0) +
          kB * (comps.DE[mask] ?? 0) +
          kC * (comps.C[mask] ?? 0) +
          kD * (comps.D[mask] ?? 0);
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
          ev += prob * vOf(typeMask);
        }
        // Apply detection-floor as a value-weighted blend if it's set: floor the implied
        // detection probability up to the floor by treating the missing mass as an
        // "average-type detection" over the FUNDED methods' types. (Funded, not just
        // detecting: with only probes funded nothing detects this decade, but the floor
        // still says aliens are evident, and that news has value.)
        if (per.combined < floorHere) {
          const missing = floorHere - per.combined;
          let sumV = 0;
          let count = 0;
          for (const mm of m) {
            if (!mm.on || mm.costM <= 0) continue;
            sumV += vOf(typeBit(mm.type));
            count++;
          }
          if (count > 0) ev += (missing * sumV) / count;
        }
        evSamples[i] = ev;
        evSum += ev;
      }
    }
  }

  const totalCostM = methods !== undefined ? totalDecadalCostMillions(methods) : 0;
  const totalCostUSD = totalCostM * 1e6;
  const multiplierSamples = new Float64Array(n);
  let pNeg = 0;
  let pAbove = 0;
  let pHarm = 0;
  if (totalCostUSD > 0 && channels !== undefined) {
    for (let i = 0; i < n; i++) {
      const ev = evSamples[i] ?? 0;
      const dalysPerDollar = ev / totalCostUSD;
      const multiplier = dalysPerDollar / GIVEWELL_BAR_DALY_PER_DOLLAR;
      multiplierSamples[i] = multiplier;
      if (multiplier < 0) pNeg++;
      if (multiplier > 1) pAbove++;
      if (multiplier < -1) pHarm++;
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

  let logSum = 0;
  let logCount = 0;
  for (const v of multiplierSamples) {
    if (v > 0 && Number.isFinite(v)) {
      logSum += Math.log(v);
      logCount++;
    }
  }
  const gmeanPositive = logCount > 0 ? Math.exp(logSum / logCount) : 0;

  // Mean over ALL samples, signed — the 'average' summary.
  let multSum = 0;
  for (const v of multiplierSamples) multSum += v;
  const meanMultiplier = totalCostUSD > 0 ? multSum / n : 0;
  // Standard error of that mean. The mean is a difference of two heavy tails (cosmic
  // upside vs cosmic loss), so at some settings it is smaller than its own sampling noise
  // and even its sign is undetermined; the UI must say so rather than print a number.
  let sqDev = 0;
  for (const v of multiplierSamples) sqDev += (v - meanMultiplier) ** 2;
  const meanMultiplierSE = totalCostUSD > 0 && n > 1 ? Math.sqrt(sqDev / (n - 1) / n) : 0;

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
    pHarmBeyondGiveWell: totalCostUSD > 0 ? pHarm / n : 0,
    multiplierSamples,
    medianMultiplier: pickPctl(0.5),
    gmeanPositiveMultiplier: gmeanPositive,
    meanMultiplier,
    meanMultiplierSE,
    p25Multiplier: pickPctl(0.25),
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
): { A: number; B: number; C: number; D: number; DEndowment: number } {
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
  // Channel B per UNIT of net evidence shift — the caller multiplies by the (possibly
  // sampled) net shift. Unlike value.ts's channelValuesForTypeSet, which includes it.
  // Needs a technosignature: microbes say nothing about interstellar tech (B_FIRES).
  let B = 0;
  if (ch.B.on && types.some((t) => B_FIRES.includes(t))) {
    B = ch.B.vCosmicEndowment;
  }
  let C = 0;
  if (ch.C.on && types.some((t) => ch.C.fires.includes(t))) {
    C = ch.C.pFriendly * ch.C.vContactFriendly;
  }
  let D = 0;
  let DEndowment = 0;
  if (ch.D.on && types.some((t) => ch.D.fires.includes(t))) {
    D = ch.D.pHostile * ch.D.vHostileDisvalue;
    DEndowment = -ch.D.pHostile * ch.B.vCosmicEndowment;
  }
  return { A, B, C, D, DEndowment };
}

// Re-export so anything still importing valueForTypeSet keeps working
export { valueForTypeSet };
