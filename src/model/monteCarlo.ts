import { sampleDrake, type DrakeRanges } from './drake';
import {
  pDetectPerMethod,
  totalDecadalCostMillions,
  type DetectionMethodState,
} from './detection';
import { channelValues, type ChannelsState } from './value';
import { applyWorldview, defaultWorldview, type WorldviewDials } from './worldview';
import { makeRng } from '../lib/rng';
import type { DetectionType } from '../constants/detectionDefaults';

export interface DrakeMCInput {
  ranges: DrakeRanges;
  /** Optional detection methods. When provided, MC also computes pAnyDetection. */
  methods?: DetectionMethodState[];
  /** Optional value channels. When provided, MC also computes EV in DALYs. */
  channels?: ChannelsState;
  /** Optional worldview transforms. When provided, channel-values are transformed before EV is summed. */
  worldview?: WorldviewDials;
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
  for (let i = 0; i < n; i++) {
    const s = sampleDrake(rng, ranges);
    samples[i] = s.N;
    detectableSamples[i] = s.N_detectable;
    if (s.N < 1) zero++;
    else if (s.N < 2) one++;
    else gtOne++;
    if (methods !== undefined) {
      const per = pDetectPerMethod(rng, methods, s.N_detectable);
      detectionProbSamples[i] = per.combined;
      detectionSum += per.combined;
      if (vByType) {
        // Expected value contribution per detection-type, weighted by per-method P that
        // *that* method specifically detects. Approximation: a method is the unique
        // detector with probability proportional to P_m / Σ P_m.
        let totalP = 0;
        for (const m of methods) {
          if (m.on) totalP += per.byMethod[m.id];
        }
        let v = 0;
        if (totalP > 0) {
          for (const m of methods) {
            if (!m.on) continue;
            const pm = per.byMethod[m.id];
            if (pm <= 0) continue;
            const weight = pm / totalP;
            v += weight * vByType[m.type];
          }
        }
        const ev = per.combined * v;
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
