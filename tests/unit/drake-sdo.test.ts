// SDO 2018's own f_l distribution (§3.1): f_l = 1 − exp(−λVt), log10(λVt) ~ Normal(0, 50).

import { describe, it, expect } from 'vitest';
import { makeRng } from '../../src/lib/rng';
import { standardNormal } from '../../src/lib/sampling';
import { sampleFlSDO, defaultDrakeRanges } from '../../src/model/drake';
import { runDrakeMC } from '../../src/model/monteCarlo';

describe('standardNormal', () => {
  it('has mean ≈ 0 and sd ≈ 1', () => {
    const r = makeRng('normal');
    const xs = Array.from({ length: 50_000 }, () => standardNormal(r));
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length);
    expect(Math.abs(mean)).toBeLessThan(0.02);
    expect(Math.abs(sd - 1)).toBeLessThan(0.02);
  });
});

describe('sampleFlSDO', () => {
  it('stays in [0, 1] and puts f_l near 1 about half the time (median rate = 1 event/planet)', () => {
    const r = makeRng('fl-sdo');
    const xs = Array.from({ length: 50_000 }, () => sampleFlSDO(r));
    for (const x of xs) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(1);
    }
    const aboveHalf = xs.filter((x) => x > 0.5).length / xs.length;
    expect(aboveHalf).toBeGreaterThan(0.47);
    expect(aboveHalf).toBeLessThan(0.53);
  });
});

describe('literature anchor: SDO f_l mode reproduces SDO 2018 Table 1', () => {
  it('gives P(no civ) ≈ 52% when fed SDO’s Table 1 ranges', () => {
    const ranges = defaultDrakeRanges();
    ranges.R = { min: 1, max: 100 };
    ranges.fp = { min: 0.1, max: 1 }; // SDO use log-uniform; ours is linear — small effect
    const out = runDrakeMC({
      ranges,
      flDistribution: 'sdo-lognormal',
      n: 100_000,
      seed: 'sdo-fl-anchor',
    });
    expect(out.pNZero).toBeGreaterThan(0.47);
    expect(out.pNZero).toBeLessThan(0.57);
  });

  it('at the tool’s other default bounds, SDO f_l lowers P(no civ) well below the log-uniform default', () => {
    const lu = runDrakeMC({ ranges: defaultDrakeRanges(), n: 50_000, seed: 'fl-compare' });
    const sdo = runDrakeMC({
      ranges: defaultDrakeRanges(),
      flDistribution: 'sdo-lognormal',
      n: 50_000,
      seed: 'fl-compare',
    });
    expect(lu.pNZero).toBeGreaterThan(0.8);
    expect(sdo.pNZero).toBeLessThan(lu.pNZero - 0.2);
  });
});
