import { sampleDrake, type DrakeRanges } from './drake';
import {
  pDetectPerMethod,
  totalDecadalCostMillions,
  type DetectionMethodState,
} from './detection';
import { channelValues, type ChannelsState } from './value';
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
  samples: Float64Array;
  detectableSamples: Float64Array;
  detectionProbSamples: Float64Array;
  evSamples: Float64Array;
}

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
  let zero = 0;
  let one = 0;
  let gtOne = 0;
  let detectionSum = 0;
  let evSum = 0;

  // Cosmology branch: in 'grabby' mode every sample uses the grabby zone credence
  // as a Bernoulli for "we're inside a grabby zone"; in 'hybrid' mode each sample
  // is drawn from one branch in proportion to worldview.grabbyCredence.
  const grabbyBoosted: DetectionMethodState[] | undefined =
    methods !== undefined && cosmology !== 'sdo'
      ? methods.map((m) => ({
          ...m,
          sensMin: m.sensMin * sensitivityBoostFor(m.type),
          sensMax: m.sensMax * sensitivityBoostFor(m.type),
        }))
      : undefined;
  // Pre-compute per-detection-type V_user (worldview-transformed channel sum).
  // Channels and worldview are constants for the run, so we can do this once.
  const wv = worldview ?? defaultWorldview();
  const vByType: Record<DetectionType, number> | null = channels
    ? {
        radio: applyWorldview(channelValues('radio', channels), wv).total,
        technosig: applyWorldview(channelValues('technosig', channels), wv).total,
        biosig: applyWorldview(channelValues('biosig', channels), wv).total,
        probe: applyWorldview(channelValues('probe', channels), wv).total,
        passive_radar: applyWorldview(channelValues('passive_radar', channels), wv).total,
      }
    : null;
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
      // Bernoulli(zoneP) → either 0 or a "saturated" N standing for ubiquitous probes.
      const inside = rng() < zoneP;
      N = inside ? 1e6 : 0;
      N_detectable = N; // grabby aliens are detectable by construction in this simplification
    } else {
      const s = sampleDrake(rng, ranges);
      N = s.N;
      N_detectable = s.N_detectable;
    }
    // Apply Bayesian-shortcut override on P(N≥1) if set.
    if (overrides?.overridePNGteOne !== undefined) {
      const alive = rng() < overrides.overridePNGteOne;
      N = alive ? Math.max(N, 1) : 0;
      N_detectable = alive ? Math.max(N_detectable, 1) : 0;
    }
    samples[i] = N;
    detectableSamples[i] = N_detectable;
    if (N < 1) zero++;
    else if (N < 2) one++;
    else gtOne++;

    if (methods !== undefined) {
      const m = useGrabby && grabbyBoosted ? grabbyBoosted : methods;
      const per = pDetectPerMethod(rng, m, N_detectable);
      let pCombined = per.combined;
      if (overrides?.detectionFloor !== undefined && N_detectable > 0) {
        pCombined = Math.max(pCombined, overrides.detectionFloor);
      }
      detectionProbSamples[i] = pCombined;
      detectionSum += pCombined;
      if (vByType) {
        let totalP = 0;
        for (const mm of m) {
          if (mm.on) totalP += per.byMethod[mm.id];
        }
        let v = 0;
        if (totalP > 0) {
          for (const mm of m) {
            if (!mm.on) continue;
            const pm = per.byMethod[mm.id];
            if (pm <= 0) continue;
            const weight = pm / totalP;
            v += weight * vByType[mm.type];
          }
        }
        const ev = pCombined * v;
        evSamples[i] = ev;
        evSum += ev;
      }
    }
  }
  return {
    pNZero: zero / n,
    pNExactlyOne: one / n,
    pNGtOne: gtOne / n,
    pNGteOne: 1 - zero / n,
    pAnyDetection: methods !== undefined ? detectionSum / n : 0,
    evDALYs: channels !== undefined ? evSum / n : 0,
    totalCostM: methods !== undefined ? totalDecadalCostMillions(methods) : 0,
    samples,
    detectableSamples,
    detectionProbSamples,
    evSamples,
  };
}
