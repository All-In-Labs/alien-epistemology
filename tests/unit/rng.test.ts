import { describe, it, expect } from 'vitest';
import { makeRng } from '../../src/lib/rng';

describe('makeRng', () => {
  it('is deterministic for a given seed', () => {
    const a = makeRng('seed-42');
    const b = makeRng('seed-42');
    for (let i = 0; i < 100; i++) {
      expect(a()).toBe(b());
    }
  });

  it('produces different sequences for different seeds', () => {
    const a = makeRng('A');
    const b = makeRng('B');
    const sa = Array.from({ length: 10 }, () => a());
    const sb = Array.from({ length: 10 }, () => b());
    expect(sa).not.toEqual(sb);
  });

  it('returns values in [0, 1)', () => {
    const r = makeRng('x');
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
