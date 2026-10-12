import { describe, it, expect } from 'vitest';
import { runDrakeMC } from '../../src/model/monteCarlo';
import { defaultDrakeRanges } from '../../src/model/drake';
import { defaultDetectionState } from '../../src/model/detection';
import { defaultChannelState } from '../../src/model/value';

describe('runDrakeMC', () => {
  it('Poisson partition probabilities sum to 1', () => {
    const out = runDrakeMC({ ranges: defaultDrakeRanges(), n: 10000, seed: 'mc-1' });
    expect(out.pNZero + out.pNExactlyOne + out.pNGtOne).toBeCloseTo(1, 6);
  });

  it('pNGteOne === 1 - pNZero', () => {
    const out = runDrakeMC({ ranges: defaultDrakeRanges(), n: 10000, seed: 'mc-2' });
    expect(out.pNGteOne).toBeCloseTo(1 - out.pNZero, 6);
  });

  it('returns N samples in a Float64Array of expected length', () => {
    const out = runDrakeMC({ ranges: defaultDrakeRanges(), n: 1000, seed: 'mc-3' });
    expect(out.samples).toBeInstanceOf(Float64Array);
    expect(out.samples.length).toBe(1000);
  });

  it('is deterministic for a given seed', () => {
    const a = runDrakeMC({ ranges: defaultDrakeRanges(), n: 500, seed: 'mc-d' });
    const b = runDrakeMC({ ranges: defaultDrakeRanges(), n: 500, seed: 'mc-d' });
    expect(a.pNZero).toBe(b.pNZero);
    expect(Array.from(a.samples)).toEqual(Array.from(b.samples));
  });

  it('also returns N_detectable samples', () => {
    const out = runDrakeMC({ ranges: defaultDrakeRanges(), n: 100, seed: 'mc-4' });
    expect(out.detectableSamples).toBeInstanceOf(Float64Array);
    expect(out.detectableSamples.length).toBe(100);
    for (let i = 0; i < 100; i++) {
      const N = out.samples[i];
      const Nd = out.detectableSamples[i];
      if (N === undefined || Nd === undefined) throw new Error('undefined sample');
      expect(Nd).toBeLessThanOrEqual(N + 1e-9);
    }
  });
});

// Prior overrides (spec §5.5). The detection floor promises P(detection | aliens exist) ≥
// floor, and forcing P(N ≥ 1) should still respect f_d and the Poisson split.
describe('prior overrides', () => {
  const lifeRare = () => {
    const r = defaultDrakeRanges();
    r.fl = { min: 1e-30, max: 1e-25 };
    return r;
  };
  const lifeEverywhere = () => {
    const r = defaultDrakeRanges();
    r.fl = { min: 0.5, max: 1 };
    r.L = { min: 1e8, max: 1e10 };
    r.fd = { min: 0.5, max: 1 };
    return r;
  };

  it('the detection floor does not create detections in worlds with no one to detect', () => {
    const out = runDrakeMC({
      ranges: lifeRare(),
      methods: defaultDetectionState(),
      channels: defaultChannelState(),
      overrides: { detectionFloor: 0.1 },
      n: 20_000,
      seed: 'floor-rare',
    });
    expect(out.pAnyDetection).toBeLessThan(1e-3);
  });

  it('the detection floor holds where civilisations are plentiful', () => {
    const out = runDrakeMC({
      ranges: lifeEverywhere(),
      methods: defaultDetectionState(),
      channels: defaultChannelState(),
      overrides: { detectionFloor: 0.9 },
      n: 20_000,
      seed: 'floor-common',
    });
    expect(out.pAnyDetection).toBeGreaterThan(0.89);
  });

  it('forcing P(N≥1) on a near-empty galaxy gives exactly one civilisation, not "more than one"', () => {
    const out = runDrakeMC({
      ranges: lifeRare(),
      overrides: { overridePNGteOne: 0.5 },
      n: 20_000,
      seed: 'override-one',
    });
    expect(out.pNExactlyOne).toBeGreaterThan(0.48);
    expect(out.pNExactlyOne).toBeLessThan(0.52);
    expect(out.pNGtOne).toBeLessThan(0.01);
  });

  it('a forced civilisation still passes through f_d', () => {
    const ranges = lifeRare();
    ranges.fd = { min: 1e-3, max: 1e-3 };
    const out = runDrakeMC({
      ranges,
      overrides: { overridePNGteOne: 1 },
      n: 2_000,
      seed: 'override-fd',
    });
    for (const nd of out.detectableSamples) {
      expect(nd).toBeGreaterThan(0);
      expect(nd).toBeLessThan(1.01e-3);
    }
  });
});
