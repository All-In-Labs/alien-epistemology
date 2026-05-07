import { sampleDrake, type DrakeRanges } from './drake';
import { pDetectGivenN, type DetectionMethodState } from './detection';
import { makeRng } from '../lib/rng';

export interface DrakeMCInput {
  ranges: DrakeRanges;
  /** Optional detection methods. When provided, MC also computes pAnyDetection. */
  methods?: DetectionMethodState[];
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
  samples: Float64Array;
  detectableSamples: Float64Array;
  detectionProbSamples: Float64Array;
}

export function runDrakeMC({ ranges, methods, n, seed }: DrakeMCInput): DrakeMCOutput {
  const rng = makeRng(seed);
  const samples = new Float64Array(n);
  const detectableSamples = new Float64Array(n);
  const detectionProbSamples = new Float64Array(n);
  let zero = 0;
  let one = 0;
  let gtOne = 0;
  let detectionSum = 0;
  for (let i = 0; i < n; i++) {
    const s = sampleDrake(rng, ranges);
    samples[i] = s.N;
    detectableSamples[i] = s.N_detectable;
    if (s.N < 1) zero++;
    else if (s.N < 2) one++;
    else gtOne++;
    if (methods !== undefined) {
      const pDet = pDetectGivenN(rng, methods, s.N_detectable);
      detectionProbSamples[i] = pDet;
      detectionSum += pDet;
    }
  }
  return {
    pNZero: zero / n,
    pNExactlyOne: one / n,
    pNGtOne: gtOne / n,
    pNGteOne: 1 - zero / n,
    pAnyDetection: methods !== undefined ? detectionSum / n : 0,
    samples,
    detectableSamples,
    detectionProbSamples,
  };
}
