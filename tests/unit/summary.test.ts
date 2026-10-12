import { describe, it, expect } from 'vitest';
import { summaryFor, outcomeSplit, plainGloss, plainNumber } from '../../src/model/summary';
import { normalizeRiskAversion } from '../../src/model/worldview';

const out = { meanMultiplier: 1000, medianMultiplier: 0.01, p25Multiplier: 0.001 };

describe('summaryFor — the risk dial picks the secondary GiveWell number', () => {
  it('average → mean', () => {
    expect(summaryFor(out, 'average').value).toBe(1000);
  });
  it('typical → median', () => {
    expect(summaryFor(out, 'typical').value).toBe(0.01);
  });
  it('cautious → 25th percentile', () => {
    expect(summaryFor(out, 'cautious').value).toBe(0.001);
  });
  it('is always defined, even when some outcomes are losses', () => {
    const lossy = { meanMultiplier: -5, medianMultiplier: -1e-9, p25Multiplier: -0.2 };
    for (const r of ['average', 'typical', 'cautious'] as const) {
      expect(Number.isFinite(summaryFor(lossy, r).value)).toBe(true);
    }
  });
});

describe('normalizeRiskAversion — old permalinks keep working', () => {
  it('maps the old technical names onto the plain ones', () => {
    expect(normalizeRiskAversion('EV-max')).toBe('average');
    expect(normalizeRiskAversion('log-utility')).toBe('typical');
    expect(normalizeRiskAversion('difference-making')).toBe('cautious');
  });
  it('passes plain names through and falls back to average', () => {
    expect(normalizeRiskAversion('typical')).toBe('typical');
    expect(normalizeRiskAversion(undefined)).toBe('average');
  });
});

describe('outcomeSplit — "out of 100 worlds"', () => {
  it('always sums to 100', () => {
    for (const [b, w] of [
      [0.118, 0.291],
      [0.333, 0.333],
      [0, 1],
      [0.005, 0.004],
      [0.999, 0],
    ] as const) {
      const s = outcomeSplit(b, w);
      expect(s.better + s.less + s.worse).toBe(100);
    }
  });

  it('rounds to the nearest whole world', () => {
    const s = outcomeSplit(0.118, 0.291);
    expect(s).toMatchObject({ better: 12, less: 59, worse: 29 });
  });

  it('flags a non-zero share that rounds to zero, so a real chance is never shown as none', () => {
    const s = outcomeSplit(0.003, 0.2);
    expect(s.better).toBe(0);
    expect(s.betterUnderOne).toBe(true);
    expect(outcomeSplit(0, 0.2).betterUnderOne).toBe(false);
  });
});

describe('plainGloss — words for a GiveWell multiple', () => {
  it('describes each range in plain language', () => {
    expect(plainGloss(-3)).toBe('more harm than GiveWell does good');
    expect(plainGloss(-0.2)).toBe('slightly worse than doing nothing');
    expect(plainGloss(-1e-12)).toBe('about nothing');
    expect(plainGloss(1e-9)).toBe('about nothing');
    expect(plainGloss(0.2)).toBe('less than GiveWell');
    expect(plainGloss(1.1)).toBe('about as good as GiveWell');
    expect(plainGloss(30)).toBe('better than GiveWell');
    expect(plainGloss(2e5)).toBe('far better than GiveWell');
  });
});

describe('plainNumber — no scientific notation for lay readers', () => {
  it('formats across the range', () => {
    expect(plainNumber(1e-10)).toBe('≈ 0');
    expect(plainNumber(0.55)).toBe('0.55');
    expect(plainNumber(3.2)).toBe('3.2');
    expect(plainNumber(219947)).toBe('219,947');
    expect(plainNumber(1.7e6)).toBe('1.7 million');
    expect(plainNumber(-4e6)).toBe('−4 million');
    expect(plainNumber(2.5e9)).toBe('2.5 billion');
    expect(plainNumber(3e17)).toBe('10¹⁷');
  });
});
