import { describe, it, expect } from 'vitest';
import { headlineFor } from '../../src/model/summary';

const out = {
  meanMultiplier: 1000,
  gmeanMultiplier: 0.01,
  p25Multiplier: 0.001,
  pNegativeEV: 0,
};

describe('headlineFor — risk-aversion dial picks the headline statistic', () => {
  it('EV-max → mean', () => {
    const h = headlineFor(out, 'EV-max');
    expect(h.value).toBe(1000);
    expect(h.label).toContain('mean');
  });

  it('log-utility → geometric mean', () => {
    const h = headlineFor(out, 'log-utility');
    expect(h.value).toBe(0.01);
    expect(h.label).toContain('geometric mean');
  });

  it('difference-making → 25th percentile', () => {
    const h = headlineFor(out, 'difference-making');
    expect(h.value).toBe(0.001);
    expect(h.label).toContain('25th percentile');
  });

  it('log-utility is undefined (null, with a reason) when some outcomes are losses', () => {
    const h = headlineFor({ ...out, gmeanMultiplier: null, pNegativeEV: 0.28 }, 'log-utility');
    expect(h.value).toBeNull();
    expect(h.note).toContain('28%');
  });

  it('the three settings give different answers on a skewed distribution', () => {
    const values = (['EV-max', 'log-utility', 'difference-making'] as const).map(
      (r) => headlineFor(out, r).value,
    );
    expect(new Set(values).size).toBe(3);
  });
});
