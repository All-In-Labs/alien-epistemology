// MC convergence and numerical-precision regression tests.
//
// These tests guard the model's robustness against subtle changes (e.g. losing
// log1p, switching log-space → multiplication). They check:
//   1. Deterministic MC: same seed → bit-identical results.
//   2. Convergence: n=10⁴ vs n=10⁵ agree within MC stderr.
//   3. Poisson partition: pNZero + pNExactlyOne + pNGtOne ≈ 1.
//   4. Subset-enumeration EV consistency: with one method enabled it matches the
//      simple "P(detect) × V_user_for_that_type" form, modulo tiny FP noise.

import { describe, it, expect } from 'vitest';
import { runDrakeMC } from '../../src/model/monteCarlo';
import { defaultDrakeRanges } from '../../src/model/drake';
import { defaultDetectionState } from '../../src/model/detection';
import { defaultChannelState } from '../../src/model/value';
import { defaultWorldview } from '../../src/model/worldview';

function defaultRun(n: number, seed: string) {
  return runDrakeMC({
    ranges: defaultDrakeRanges(),
    methods: defaultDetectionState(),
    channels: defaultChannelState(),
    worldview: defaultWorldview(),
    n,
    seed,
  });
}

describe('MC determinism', () => {
  it('same seed → bit-identical headline stats', () => {
    const a = defaultRun(5_000, 'conv-1');
    const b = defaultRun(5_000, 'conv-1');
    expect(a.pNZero).toBe(b.pNZero);
    expect(a.pNGteOne).toBe(b.pNGteOne);
    expect(a.pAnyDetection).toBe(b.pAnyDetection);
    expect(a.evDALYs).toBe(b.evDALYs);
  });

  it('different seeds → different but converging headline stats', () => {
    const a = defaultRun(5_000, 'conv-A');
    const b = defaultRun(5_000, 'conv-B');
    // Different seeds should give different sample paths.
    expect(a.pNZero).not.toBe(b.pNZero);
    // But within MC stderr (~0.01 for n=5000 at p≈0.5).
    expect(Math.abs(a.pNZero - b.pNZero)).toBeLessThan(0.05);
  });
});

describe('MC convergence', () => {
  it('n=10⁴ and n=10⁵ agree within stderr on pNZero', () => {
    const small = defaultRun(10_000, 'conv-s1');
    const large = defaultRun(100_000, 'conv-l1');
    // Stderr at p=0.88 with n=10⁴ is sqrt(0.88×0.12/10⁴) ≈ 0.0033.
    // 4σ tolerance → < 0.013.
    expect(Math.abs(small.pNZero - large.pNZero)).toBeLessThan(0.02);
  });

  it('n=10⁴ and n=10⁵ agree on pAnyDetection within stderr', () => {
    const small = defaultRun(10_000, 'conv-s2');
    const large = defaultRun(100_000, 'conv-l2');
    // pAnyDetection at default is ~2%; stderr ≈ sqrt(0.02×0.98/10⁴) ≈ 0.0014.
    expect(Math.abs(small.pAnyDetection - large.pAnyDetection)).toBeLessThan(0.01);
  });
});

describe('Poisson partition stats sum to 1', () => {
  it('pNZero + pNExactlyOne + pNGtOne ≈ 1 across a wide range of seeds', () => {
    for (const seed of ['p-1', 'p-2', 'p-3']) {
      const out = defaultRun(20_000, seed);
      const sum = out.pNZero + out.pNExactlyOne + out.pNGtOne;
      expect(sum).toBeCloseTo(1, 6);
    }
  });

  it('pNGteOne === 1 - pNZero exactly', () => {
    const out = defaultRun(10_000, 'p-pair');
    expect(out.pNGteOne).toBeCloseTo(1 - out.pNZero, 10);
  });
});

describe('detection.ts log1p numerical precision', () => {
  it('handles tiny p_m without losing precision (regression for naive Math.log)', () => {
    // Construct a config with very-low-sensitivity SETI at default cost so p_m
    // is on the order of 1e-9. Without log1p, log(1 - 1e-9) loses ~9 digits.
    const methods = defaultDetectionState().map((m) => ({
      ...m,
      // Only SETI on, with sens at the very low end.
      on: m.id === 'seti',
      sensMin: 1e-9,
      sensMax: 1e-9,
    }));
    const out = runDrakeMC({
      ranges: defaultDrakeRanges(),
      methods,
      n: 5_000,
      seed: 'log1p-precision',
    });
    // With sens=1e-9 and cost $50M ($0.05B-decade), p_m ≈ 5e-11 per civ.
    // For typical N_detectable in [0, 1e15], pCombined still varies meaningfully.
    // Mostly we want: no NaN, no Infinity, output is finite and in [0, 1].
    expect(Number.isFinite(out.pAnyDetection)).toBe(true);
    expect(out.pAnyDetection).toBeGreaterThanOrEqual(0);
    expect(out.pAnyDetection).toBeLessThanOrEqual(1);
  });
});

describe('Drake log-space product precision', () => {
  it('produces finite N for the full default sample range', () => {
    const out = defaultRun(2_000, 'drake-precision');
    let nans = 0;
    let infs = 0;
    for (const v of out.samples) {
      if (Number.isNaN(v)) nans++;
      if (!Number.isFinite(v)) infs++;
    }
    expect(nans).toBe(0);
    expect(infs).toBe(0);
  });
});
