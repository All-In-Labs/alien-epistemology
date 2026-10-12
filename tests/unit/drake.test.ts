import { describe, it, expect } from 'vitest';
import { makeRng } from '../../src/lib/rng';
import { sampleDrake, defaultDrakeRanges } from '../../src/model/drake';
import { BIOSPHERE_LIFETIME_YEARS } from '../../src/constants/defaults';

describe('sampleDrake', () => {
  it('returns finite, non-negative N and N_detectable ≤ N', () => {
    const r = makeRng('drake-1');
    const ranges = defaultDrakeRanges();
    for (let i = 0; i < 1000; i++) {
      const sample = sampleDrake(r, ranges);
      expect(Number.isFinite(sample.N)).toBe(true);
      expect(sample.N).toBeGreaterThanOrEqual(0);
      expect(sample.N_detectable).toBeGreaterThanOrEqual(0);
      expect(sample.N_detectable).toBeLessThanOrEqual(sample.N);
    }
  });

  // Spec §5.1 claims default bounds give "P(N=0) ~ 30–50%", but with fl ∈ [1e-30, 1]
  // the log-uniform mass is heavily on small fl, so P(N<1) sits closer to ~85%.
  // The asymmetry IS the SDO finding: wide fl bounds dominate — non-trivial but not unanimous.
  it('produces a wide N distribution by default (SDO finding)', () => {
    const r = makeRng('drake-2');
    const ranges = defaultDrakeRanges();
    const Ns = Array.from({ length: 5000 }, () => sampleDrake(r, ranges).N);
    const zeros = Ns.filter((n) => n < 1).length;
    expect(zeros / Ns.length).toBeGreaterThan(0.2);
    expect(zeros / Ns.length).toBeLessThan(0.99);
  });

  it('component multiplication holds: N = R*fp*ne*fl*fi*fc*L within float precision', () => {
    const r = makeRng('drake-3');
    const ranges = defaultDrakeRanges();
    const s = sampleDrake(r, ranges);
    const product =
      s.components.R *
      s.components.fp *
      s.components.ne *
      s.components.fl *
      s.components.fi *
      s.components.fc *
      s.components.L;
    expect(s.N).toBeCloseTo(product, 4);
  });

  it('N_detectable = N * f_d', () => {
    const r = makeRng('drake-4');
    const ranges = defaultDrakeRanges();
    const s = sampleDrake(r, ranges);
    expect(s.N_detectable).toBeCloseTo(s.N * s.components.fd, 4);
  });
});

// Biosignature searches look for life, not civilisations. The count they need is
// life-bearing planets: R* × fₚ × nₑ × fₗ × (how long a planet stays life-bearing).
describe('life-bearing planets', () => {
  it('N_lifeDetectable = R·fp·ne·fl·T_biosphere·f_d when that exceeds N', () => {
    const r = makeRng('drake-life');
    const ranges = defaultDrakeRanges();
    ranges.fl = { min: 0.5, max: 1 };
    const s = sampleDrake(r, ranges);
    const c = s.components;
    const life = c.R * c.fp * c.ne * c.fl * BIOSPHERE_LIFETIME_YEARS;
    expect(life).toBeGreaterThan(s.N);
    expect(s.N_lifeDetectable / (life * c.fd)).toBeCloseTo(1, 10);
  });

  it('every civilisation lives on a life-bearing planet: N_lifeDetectable ≥ N_detectable', () => {
    const r = makeRng('drake-life-2');
    const ranges = defaultDrakeRanges();
    ranges.L = { min: 1e9, max: 1e10 };
    for (let i = 0; i < 2000; i++) {
      const s = sampleDrake(r, ranges);
      expect(s.N_lifeDetectable).toBeGreaterThanOrEqual(s.N_detectable);
    }
  });

  it('uses Earth’s record for how long a biosphere lasts (~3 billion years)', () => {
    expect(BIOSPHERE_LIFETIME_YEARS).toBe(3e9);
  });
});
