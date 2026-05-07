import { describe, it, expect } from 'vitest';
import { makeRng } from '../../src/lib/rng';
import { logUniform, linearUniform } from '../../src/lib/sampling';

describe('logUniform', () => {
  it('produces values in [min, max]', () => {
    const r = makeRng('lu');
    for (let i = 0; i < 10000; i++) {
      const v = logUniform(r, 1e-3, 1e3);
      expect(v).toBeGreaterThanOrEqual(1e-3);
      expect(v).toBeLessThanOrEqual(1e3);
    }
  });

  it('is uniform in log space (log10 mean ≈ midpoint)', () => {
    const r = makeRng('lu2');
    const samples = Array.from({ length: 5000 }, () => logUniform(r, 1, 1000));
    const logs = samples.map((v) => Math.log10(v));
    const mean = logs.reduce((a, b) => a + b, 0) / logs.length;
    expect(mean).toBeGreaterThan(1.3);
    expect(mean).toBeLessThan(1.7);
  });
});

describe('linearUniform', () => {
  it('produces values in [min, max]', () => {
    const r = makeRng('li');
    for (let i = 0; i < 1000; i++) {
      const v = linearUniform(r, 0.4, 1.0);
      expect(v).toBeGreaterThanOrEqual(0.4);
      expect(v).toBeLessThanOrEqual(1.0);
    }
  });

  it('mean approaches midpoint', () => {
    const r = makeRng('li2');
    const samples = Array.from({ length: 5000 }, () => linearUniform(r, 0, 1));
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    expect(mean).toBeGreaterThan(0.45);
    expect(mean).toBeLessThan(0.55);
  });
});
