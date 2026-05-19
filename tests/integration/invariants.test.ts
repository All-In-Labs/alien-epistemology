// Structural-invariant tests for the cost-effectiveness model.
//
// These don't probe specific inputs against published numbers — they probe
// structural properties the model MUST satisfy regardless of inputs. Each
// is a regression net for a class of bug (unit conversion, sign error,
// dead dial, off-by-one in subset enumeration) that the existing
// determinism/convergence tests can't catch.

import { describe, it, expect } from 'vitest';
import { runDrakeMC } from '../../src/model/monteCarlo';
import { defaultDrakeRanges } from '../../src/model/drake';
import { defaultDetectionState } from '../../src/model/detection';
import { defaultChannelState } from '../../src/model/value';
import { defaultWorldview } from '../../src/model/worldview';

const N = 20_000;

describe('invariant: all channels off ⇒ EV is identically zero', () => {
  it('with every channel disabled, evDALYs = 0 and pNegativeEV = 0', () => {
    const channels = defaultChannelState();
    channels.A.on = false;
    channels.B.on = false;
    channels.C.on = false;
    channels.D.on = false;
    const out = runDrakeMC({
      ranges: defaultDrakeRanges(),
      methods: defaultDetectionState(),
      channels,
      worldview: defaultWorldview(),
      n: N,
      seed: 'inv-no-channels',
    });
    expect(out.evDALYs).toBe(0);
    expect(out.pNegativeEV).toBe(0);
    expect(out.pAboveGiveWell).toBe(0);
    expect(out.gmeanPositiveMultiplier).toBe(0);
  });
});

describe('invariant: all methods off ⇒ multiplier is identically zero', () => {
  it('with no enabled methods, cost = 0 and every multiplier summary stat = 0', () => {
    const methods = defaultDetectionState().map((m) => ({ ...m, on: false }));
    const out = runDrakeMC({
      ranges: defaultDrakeRanges(),
      methods,
      channels: defaultChannelState(),
      worldview: defaultWorldview(),
      n: N,
      seed: 'inv-no-methods',
    });
    expect(out.totalCostM).toBe(0);
    expect(out.pAnyDetection).toBe(0);
    expect(out.evDALYs).toBe(0);
    expect(out.medianMultiplier).toBe(0);
    expect(out.p5Multiplier).toBe(0);
    expect(out.p95Multiplier).toBe(0);
  });
});

describe('invariant: EV is linear in channel A value coefficient', () => {
  it('doubling vXriskInfo doubles evDALYs exactly (A-only configuration, same seed)', () => {
    const baseChannels = defaultChannelState();
    baseChannels.B.on = false;
    baseChannels.C.on = false;
    baseChannels.D.on = false;
    const doubled = {
      ...baseChannels,
      A: { ...baseChannels.A, vXriskInfo: baseChannels.A.vXriskInfo * 2 },
    };
    // Channel A is sign-free at the channel layer post-Finding-B; the worldview's
    // filterPriorBehind controls the sign. Use 0.3 (filter-ahead) so A is non-zero.
    const worldview = { ...defaultWorldview(), filterPriorBehind: 0.3 };
    const seed = 'inv-A-linearity';
    const ranges = defaultDrakeRanges();
    const methods = defaultDetectionState();
    const base = runDrakeMC({
      ranges,
      methods,
      channels: baseChannels,
      worldview,
      n: N,
      seed,
    });
    const scaled = runDrakeMC({
      ranges,
      methods,
      channels: doubled,
      worldview,
      n: N,
      seed,
    });
    // Same seed ⇒ identical RNG draws ⇒ V scales by 2 exactly modulo FP noise.
    expect(base.evDALYs).not.toBe(0);
    const ratio = scaled.evDALYs / base.evDALYs;
    expect(Math.abs(ratio - 2)).toBeLessThan(1e-10);
  });
});

describe('invariant: Drake clamped to "alive certainty" ⇒ pNZero collapses to 0', () => {
  it('all rate parameters at unity and L=1e10 ⇒ pNZero = 0 exactly', () => {
    const ranges = defaultDrakeRanges();
    ranges.R = { min: 10, max: 10 };
    ranges.fp = { min: 1, max: 1 };
    ranges.ne = { min: 1, max: 1 };
    ranges.fl = { min: 1, max: 1 };
    ranges.fi = { min: 1, max: 1 };
    ranges.fc = { min: 1, max: 1 };
    ranges.L = { min: 1e10, max: 1e10 };
    ranges.fd = { min: 1, max: 1 };
    const out = runDrakeMC({
      ranges,
      n: 5_000,
      seed: 'inv-drake-certainty',
    });
    // logN ≈ ln(10) + ln(1e10) ≈ 25.3 ⇒ N ≈ 1e11 ⇒ exp(-N) underflows to 0.
    expect(out.pNZero).toBe(0);
    expect(out.pNGteOne).toBe(1);
  });
});

describe('invariant: prior override of P(N≥1) round-trips through the MC', () => {
  it('overridePNGteOne = 0.7 ⇒ measured pNGteOne lands at 0.7 within MC stderr', () => {
    const out = runDrakeMC({
      ranges: defaultDrakeRanges(),
      overrides: { overridePNGteOne: 0.7 },
      n: 50_000,
      seed: 'inv-override-pNGteOne',
    });
    // Stderr ≈ √(0.7×0.3/50000) ≈ 0.002. 5σ tolerance → 0.01.
    expect(Math.abs(out.pNGteOne - 0.7)).toBeLessThan(0.01);
  });
});

describe('invariant: pure-D-only ⇒ no sample has positive multiplier', () => {
  it('only channel D on with hostile certainty ⇒ pAboveGiveWell = 0 and EV < 0', () => {
    const channels = defaultChannelState();
    channels.A.on = false;
    channels.B.on = false;
    channels.C.on = false;
    channels.D = {
      on: true,
      pHostile: 1.0,
      vHostileDisvalue: -1e12,
      fires: ['radio', 'technosig', 'biosig', 'probe', 'passive_radar'],
    };
    const out = runDrakeMC({
      ranges: defaultDrakeRanges(),
      methods: defaultDetectionState(),
      channels,
      worldview: defaultWorldview(),
      n: 30_000,
      seed: 'inv-pure-D',
    });
    expect(out.evDALYs).toBeLessThan(0);
    expect(out.pAboveGiveWell).toBe(0);
    expect(out.pNegativeEV).toBeGreaterThan(0.5);
  });
});
