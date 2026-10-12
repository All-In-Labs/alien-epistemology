import { describe, it, expect } from 'vitest';
import { logShift, fmtRatio, runTornado, NEGLIGIBLE_MULTIPLIER } from '../../src/model/tornado';
import { defaultDrakeRanges } from '../../src/model/drake';
import { defaultDetectionState } from '../../src/model/detection';
import { defaultChannelState, defaultValueUncertainty } from '../../src/model/value';
import { defaultWorldview } from '../../src/model/worldview';

describe('tornado: logShift', () => {
  it('measures a positive answer growing or shrinking in orders of magnitude', () => {
    expect(logShift(100, 1000)).toBeCloseTo(1, 10);
    expect(logShift(100, 10)).toBeCloseTo(-1, 10);
  });

  it('treats a negative answer growing as worse', () => {
    expect(logShift(-100, -1000)).toBeCloseTo(-1, 10);
  });

  it('adds 2 orders of magnitude for a sign flip', () => {
    expect(logShift(100, -100)).toBeCloseTo(-2, 10);
  });

  it('floors an answer of ≈ 0 at a millionth of GiveWell instead of a meaningless 10⁻³⁰', () => {
    expect(logShift(1e5, 0)).toBeCloseTo(Math.log10(NEGLIGIBLE_MULTIPLIER / 1e5), 10);
    expect(logShift(1e5, 1e-40)).toBeCloseTo(-11, 10);
    expect(logShift(0, 1e-12)).toBe(0);
  });
});

describe('tornado: fmtRatio', () => {
  it('labels an answer of ≈ 0 as such rather than as a huge ratio', () => {
    expect(fmtRatio(1e-20, 5e5)).toBe('≈ 0');
    expect(fmtRatio(5e6, 5e5)).toBe('×10');
  });
});

describe('tornado: runTornado', () => {
  it('reports no change for every input when no programme is switched on', () => {
    const items = runTornado({
      drakeRanges: defaultDrakeRanges(),
      methods: defaultDetectionState().map((m) => ({ ...m, on: false })),
      channels: defaultChannelState(),
      worldview: defaultWorldview(),
      overrides: {},
      valueUncertainty: defaultValueUncertainty(),
      flDistribution: 'sdo-lognormal',
    });
    expect(items.length).toBeGreaterThan(10);
    for (const it of items) {
      expect(it.low).toBe(0);
      expect(it.high).toBe(0);
    }
  });
});
