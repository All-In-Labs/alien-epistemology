import { describe, it, expect } from 'vitest';
import { runDrakeMC } from '../../src/model/monteCarlo';
import { defaultDrakeRanges } from '../../src/model/drake';
import { defaultDetectionState } from '../../src/model/detection';
import { applyPreset, PRESETS, type PresetId } from '../../src/presets/worldviews';

const N = 20_000;

function runWithPreset(id: PresetId, seed: string) {
  const preset = PRESETS.find((p) => p.id === id);
  if (!preset) throw new Error(`unknown preset ${id}`);
  const { worldview, channels } = applyPreset(preset);
  return runDrakeMC({
    ranges: defaultDrakeRanges(),
    methods: defaultDetectionState(),
    channels,
    worldview,
    n: N,
    seed,
  });
}

describe('preset acceptance — spec §10 #2', () => {
  it('Ord Moderate default must NOT be "obviously top EA cause" (sanity bound)', () => {
    const out = runWithPreset('ord', 'preset-ord');
    expect(Number.isFinite(out.evDALYs)).toBe(true);
    expect(Math.abs(out.evDALYs)).toBeLessThan(1e15);
  });

  it('Dark Forest preset by itself produces non-trivial P(EV<0) (spec §10 #3)', () => {
    // The preset's channel overrides flip channel B net negative (lightcone-claim
    // evidence dominates tech-viability evidence) and bump channel D hostile prob to 0.5.
    // Together that should make negative-EV samples occur with non-trivial frequency.
    const out = runWithPreset('dark', 'preset-dark-fixed');
    let neg = 0;
    for (const v of out.evSamples) {
      if (v < 0) neg++;
    }
    // At least 0.1% of samples should be negative under Dark Forest defaults.
    expect(neg).toBeGreaterThan(N * 0.001);
  });

  it('Bostrom and Neartermist presets produce different EV magnitudes', () => {
    const a = runWithPreset('bostrom', 'preset-b');
    const b = runWithPreset('near', 'preset-n');
    expect(Math.abs(a.evDALYs - b.evDALYs)).toBeGreaterThan(0);
  });
});
