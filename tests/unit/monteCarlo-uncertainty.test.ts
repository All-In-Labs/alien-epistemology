// Per-sample value uncertainty and the risk-aversion summary statistics.

import { describe, it, expect } from 'vitest';
import { runDrakeMC, type DrakeMCInput } from '../../src/model/monteCarlo';
import { defaultDrakeRanges } from '../../src/model/drake';
import { defaultDetectionState } from '../../src/model/detection';
import {
  defaultChannelState,
  defaultValueUncertainty,
  logUniformFactorMean,
  NO_VALUE_UNCERTAINTY,
} from '../../src/model/value';
import { defaultWorldview } from '../../src/model/worldview';

function base(): Omit<DrakeMCInput, 'n' | 'seed'> {
  return {
    ranges: defaultDrakeRanges(),
    methods: defaultDetectionState(),
    channels: defaultChannelState(),
    worldview: defaultWorldview(),
  };
}

describe('value uncertainty', () => {
  it('logUniformFactorMean normalises a ±1 OOM log-uniform factor (mean of 10^U ≈ 2.15)', () => {
    expect(logUniformFactorMean(0)).toBe(1);
    expect(logUniformFactorMean(1)).toBeCloseTo(2.1497, 3);
  });

  it('zero uncertainty reproduces the point-value model exactly', () => {
    const a = runDrakeMC({ ...base(), n: 20_000, seed: 'vu-zero' });
    const b = runDrakeMC({
      ...base(),
      valueUncertainty: NO_VALUE_UNCERTAINTY,
      n: 20_000,
      seed: 'vu-zero',
    });
    expect(b.evDALYs).toBe(a.evDALYs);
    expect(b.pNegativeEV).toBe(a.pNegativeEV);
  });

  it('without uncertainty, P(EV<0) is all-or-nothing; with it, it is a real probability', () => {
    const point = runDrakeMC({ ...base(), n: 50_000, seed: 'vu-sign' });
    expect([0, 1]).toContain(point.pNegativeEV);
    const uncertain = runDrakeMC({
      ...base(),
      valueUncertainty: defaultValueUncertainty(),
      n: 50_000,
      seed: 'vu-sign',
    });
    expect(uncertain.pNegativeEV).toBeGreaterThan(0.05);
    expect(uncertain.pNegativeEV).toBeLessThan(0.95);
  });

  it('is mean-preserving: expected value is roughly unchanged by adding uncertainty', () => {
    // Heavy-tailed EV, so allow generous MC tolerance; a bias would show up as ~2x. Channel
    // D is off: at the defaults its endowment loss cancels channel B's upside in
    // expectation, leaving a mean too close to zero for a ratio to mean anything.
    const upsideOnly = (): Omit<DrakeMCInput, 'n' | 'seed'> => {
      const b = base();
      const ch = defaultChannelState();
      return { ...b, channels: { ...ch, D: { ...ch.D, on: false } } };
    };
    const point = runDrakeMC({ ...upsideOnly(), n: 200_000, seed: 'vu-mean' });
    const uncertain = runDrakeMC({
      ...upsideOnly(),
      valueUncertainty: defaultValueUncertainty(),
      n: 200_000,
      seed: 'vu-mean',
    });
    const ratio = uncertain.evDALYs / point.evDALYs;
    expect(ratio).toBeGreaterThan(0.7);
    expect(ratio).toBeLessThan(1.4);
  });
});

describe('risk-aversion summary statistics', () => {
  it('meanMultiplier equals the mean EV per dollar in GiveWell-bar units', () => {
    const out = runDrakeMC({ ...base(), n: 20_000, seed: 'stats-mean' });
    expect(out.meanMultiplier).toBeCloseTo((out.evDALYs / (out.totalCostM * 1e6)) * 100, 6);
  });

  it('p25 ≤ median, and the mean sits far above the median on this heavy-tailed output', () => {
    // Upside only (channel D off), so the heavy right tail isn't cancelled by the left.
    const ch = defaultChannelState();
    const out = runDrakeMC({
      ...base(),
      channels: { ...ch, D: { ...ch.D, on: false } },
      n: 20_000,
      seed: 'stats-order',
    });
    expect(out.p25Multiplier).toBeLessThanOrEqual(out.medianMultiplier);
    expect(out.meanMultiplier).toBeGreaterThan(out.medianMultiplier * 1e6);
  });

  it('reports a standard error for the mean, and at the defaults it swamps the mean', () => {
    // Upside and endowment loss cancel in expectation at the defaults, so the sampled mean
    // is noise. The UI relies on meanMultiplierSE to say so instead of printing a number.
    const out = runDrakeMC({
      ...base(),
      valueUncertainty: defaultValueUncertainty(),
      n: 50_000,
      seed: 'stats-se',
    });
    expect(out.meanMultiplierSE).toBeGreaterThan(0);
    expect(Math.abs(out.meanMultiplier)).toBeLessThan(3 * out.meanMultiplierSE);
  });

  it('all three summaries stay finite when some samples are losses', () => {
    const out = runDrakeMC({
      ...base(),
      valueUncertainty: defaultValueUncertainty(),
      n: 20_000,
      seed: 'stats-lossy',
    });
    expect(out.pNegativeEV).toBeGreaterThan(0);
    expect(Number.isFinite(out.meanMultiplier)).toBe(true);
    expect(Number.isFinite(out.medianMultiplier)).toBe(true);
    expect(Number.isFinite(out.p25Multiplier)).toBe(true);
  });
});

describe('serious-harm share (the verdict\'s third group)', () => {
  it('counts only multipliers below −1, so it is at most the share below zero', () => {
    const out = runDrakeMC({
      ...base(),
      valueUncertainty: defaultValueUncertainty(),
      n: 20_000,
      seed: 'harm-share',
    });
    let below = 0;
    for (const v of out.multiplierSamples) if (v < -1) below++;
    expect(out.pHarmBeyondGiveWell).toBeCloseTo(below / out.multiplierSamples.length, 12);
    expect(out.pHarmBeyondGiveWell).toBeLessThanOrEqual(out.pNegativeEV);
    expect(out.pHarmBeyondGiveWell).toBeGreaterThan(0);
  });
});
