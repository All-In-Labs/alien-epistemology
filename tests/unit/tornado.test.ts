import { describe, it, expect } from 'vitest';
import { fmtNet, runTornado } from '../../src/model/tornado';
import { defaultDrakeRanges } from '../../src/model/drake';
import { defaultDetectionState } from '../../src/model/detection';
import { defaultChannelState, defaultValueUncertainty } from '../../src/model/value';
import { defaultWorldview } from '../../src/model/worldview';

describe('tornado: fmtNet', () => {
  it('labels a change in net worlds, rounding to whole worlds', () => {
    expect(fmtNet(12.4)).toBe('+12');
    expect(fmtNet(-3.6)).toBe('−4');
    expect(fmtNet(0.3)).toBe('±0');
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

  it('moves net worlds the expected way when detection is better or worse news', () => {
    const items = runTornado({
      drakeRanges: defaultDrakeRanges(),
      methods: defaultDetectionState(),
      channels: defaultChannelState(),
      worldview: defaultWorldview(),
      overrides: {},
      valueUncertainty: defaultValueUncertainty(),
      flDistribution: 'sdo-lognormal',
    });
    const b = items.find((it) => it.symbol === 'Δ_B');
    expect(b).toBeDefined();
    expect(b?.low ?? 0).toBeLessThan(-5);
    expect(b?.high ?? 0).toBeGreaterThan(5);
  });
});
