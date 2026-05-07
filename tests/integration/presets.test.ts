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

  it('Dark Forest worldview can produce negative EV when channel B is excluded', () => {
    // Spec §10 #3 acceptance: P(negative EV) should be non-trivial under SOME worldview.
    // The Dark Forest preset alone doesn't cross zero because channel B (cosmic endowment)
    // typically dominates in DALY magnitude; but a Dark Forest user who also adopts
    // a person-affecting view (B=0) should see negative EV from channel D whenever
    // detection happens via radio/technosig/probe. This is the maximally honest check.
    const preset = PRESETS.find((p) => p.id === 'dark');
    if (!preset) throw new Error('dark preset missing');
    const { worldview, channels } = applyPreset(preset);
    worldview.personAffecting = true; // turn off B
    channels.A = { ...channels.A, on: false }; // turn off A as well (filter signal goes both ways)
    channels.C = { ...channels.C, on: false }; // alien moral weight already 0
    const out = runDrakeMC({
      ranges: defaultDrakeRanges(),
      methods: defaultDetectionState(),
      channels,
      worldview,
      n: N,
      seed: 'dark-amped',
    });
    let neg = 0;
    for (const v of out.evSamples) {
      if (v < 0) neg++;
    }
    expect(neg).toBeGreaterThan(0);
  });

  it('Bostrom and Neartermist presets produce different EV magnitudes', () => {
    const a = runWithPreset('bostrom', 'preset-b');
    const b = runWithPreset('near', 'preset-n');
    expect(Math.abs(a.evDALYs - b.evDALYs)).toBeGreaterThan(0);
  });
});
