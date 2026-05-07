import { describe, it, expect } from 'vitest';
import { runDrakeMC } from '../../src/model/monteCarlo';
import { defaultDrakeRanges } from '../../src/model/drake';

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
