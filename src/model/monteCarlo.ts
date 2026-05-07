import { sampleDrake, type DrakeRanges } from './drake';
import { makeRng } from '../lib/rng';

export interface DrakeMCInput {
  ranges: DrakeRanges;
  n: number;
  seed: string;
}

export interface DrakeMCOutput {
  pNZero: number;
  pNExactlyOne: number;
  pNGtOne: number;
  pNGteOne: number;
  samples: Float64Array;
  detectableSamples: Float64Array;
}

export function runDrakeMC({ ranges, n, seed }: DrakeMCInput): DrakeMCOutput {
  const rng = makeRng(seed);
  const samples = new Float64Array(n);
  const detectableSamples = new Float64Array(n);
  let zero = 0;
  let one = 0;
  let gtOne = 0;
  for (let i = 0; i < n; i++) {
    const s = sampleDrake(rng, ranges);
    samples[i] = s.N;
    detectableSamples[i] = s.N_detectable;
    if (s.N < 1) zero++;
    else if (s.N < 2) one++;
    else gtOne++;
  }
  return {
    pNZero: zero / n,
    pNExactlyOne: one / n,
    pNGtOne: gtOne / n,
    pNGteOne: 1 - zero / n,
    samples,
    detectableSamples,
  };
}
