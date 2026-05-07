import { describe, it, expect } from 'vitest';
import { binLog10 } from '../../src/lib/binning';

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
