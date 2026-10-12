import { describe, it, expect } from 'vitest';
import { binLog10, percentile, percentiles } from '../../src/lib/binning';

describe('binLog10', () => {
  it('counts samples into log-spaced bins', () => {
    const samples = new Float64Array([0.1, 1, 10, 100, 1000]);
    const bins = binLog10(samples, -1, 3, 4);
    expect(bins.reduce((a, b) => a + b, 0)).toBe(5);
    expect(bins.length).toBe(4);
  });

  it('clamps values below min into the 0th bin', () => {
    const samples = new Float64Array([1e-10, 1]);
    const bins = binLog10(samples, -3, 3, 6);
    expect(bins[0]).toBe(1);
  });

  it('skips zero and negative values', () => {
    const samples = new Float64Array([0, -5, 1, 10]);
    const bins = binLog10(samples, -1, 2, 3);
    expect(bins.reduce((a, b) => a + b, 0)).toBe(2);
  });
});

describe('percentiles', () => {
  it('matches percentile() for each p, from a single sort', () => {
    const xs = Float64Array.from({ length: 1001 }, (_, i) => (i * 7919) % 1001);
    const ps = [0.05, 0.25, 0.5, 0.75, 0.95];
    expect(percentiles(xs, ps)).toEqual(ps.map((p) => percentile(xs, p)));
    expect(percentiles(xs, [0.5])[0]).toBe(500);
  });

  it('sorts numerically, not as strings', () => {
    expect(percentiles(Float64Array.from([10, 9, 100, 2]), [0, 0.99])).toEqual([2, 100]);
  });
});
