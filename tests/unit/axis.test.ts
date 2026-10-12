import { describe, it, expect } from 'vitest';
import { logTicks, logFraction } from '../../src/lib/axis';

describe('logTicks', () => {
  it('returns every power of ten on a short axis', () => {
    expect(logTicks(-3, 3)).toEqual([-3, -2, -1, 0, 1, 2, 3]);
  });

  it('keeps 1× as a tick on a long axis and stays inside the range', () => {
    const ticks = logTicks(-12, 9);
    expect(ticks).toContain(0);
    expect(ticks.length).toBeLessThanOrEqual(8);
    for (const t of ticks) {
      expect(t).toBeGreaterThanOrEqual(-12);
      expect(t).toBeLessThanOrEqual(9);
    }
  });

  it('handles an empty range', () => {
    expect(logTicks(2, 2)).toEqual([]);
  });
});

describe('logFraction', () => {
  it('places a tick by its value, not by its index', () => {
    // The old histogram spread labels evenly, so the last label sat at the right edge
    // whatever its value. 10⁰ on a −12…+8 axis sits 60% of the way along.
    expect(logFraction(0, -12, 8)).toBeCloseTo(0.6, 10);
  });
});
