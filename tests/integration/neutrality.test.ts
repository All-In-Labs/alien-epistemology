// Epistemic-neutrality calibration tests.
//
// The single most important property of this tool is that it does not flatter
// the conclusion. Spec §10 #2/#5 and CLAUDE.md both assert that no preset
// should make alien-finding "obviously a top EA cause," and that across the
// space of reasonable worldviews the tool must produce a *spread* of
// conclusions rather than concentrating on a single answer.
//
// These tests operationalise that property. If a future change accidentally
// biases the model toward "alien-finding good" — by widening sensitivity
// bounds, inflating a value coefficient, or quietly zeroing a sign — at least
// one of these tests should fail.

import { describe, it, expect } from 'vitest';
import { runDrakeMC, type DrakeMCOutput } from '../../src/model/monteCarlo';
import { defaultDrakeRanges } from '../../src/model/drake';
import { defaultDetectionState } from '../../src/model/detection';
import { applyPreset, PRESETS, type PresetId } from '../../src/presets/worldviews';
import { defaultChannelState, defaultValueUncertainty } from '../../src/model/value';
import { defaultWorldview } from '../../src/model/worldview';
import { DEFAULT_FL_DISTRIBUTION } from '../../src/constants/defaults';

const N = 30_000;

interface PresetResult {
  id: PresetId;
  out: DrakeMCOutput;
}

function runAllPresets(): PresetResult[] {
  return PRESETS.map((p) => {
    const { worldview, channels } = applyPreset(p);
    const out = runDrakeMC({
      ranges: defaultDrakeRanges(),
      methods: defaultDetectionState(),
      channels,
      worldview,
      n: N,
      seed: `neutrality-${p.id}`,
    });
    return { id: p.id, out };
  });
}

describe('epistemic-neutrality calibration — spec §10 #5', () => {
  it('headline EV magnitudes span ≥ 1 order of magnitude across the six presets', () => {
    const results = runAllPresets();
    const absEVs = results.map((r) => Math.abs(r.out.evDALYs)).filter((v) => v > 0);
    expect(absEVs.length).toBeGreaterThanOrEqual(2);
    const spread = Math.max(...absEVs) / Math.min(...absEVs);
    expect(spread).toBeGreaterThan(10);
  });

  it('the six presets do not all agree on whether alien-finding clears the GiveWell bar', () => {
    const results = runAllPresets();
    const ps = results.map((r) => r.out.pAboveGiveWell);
    // If every preset agreed (all near 0 or all near 1) the tool would be a
    // recommendation, not an analysis. Require ≥5pp disagreement.
    expect(Math.max(...ps) - Math.min(...ps)).toBeGreaterThan(0.05);
  });

  it('Dark Forest preset produces non-trivial negative-EV mass (spec §10 #3)', () => {
    const results = runAllPresets();
    const dark = results.find((r) => r.id === 'dark');
    if (!dark) throw new Error('dark preset missing from PRESETS');
    expect(dark.out.pNegativeEV).toBeGreaterThan(0.01);
  });

  it('Moderate longtermist is not "obviously a top EA cause" (CLAUDE.md hard rule)', () => {
    const results = runAllPresets();
    const ord = results.find((r) => r.id === 'ord');
    if (!ord) throw new Error('ord preset missing from PRESETS');
    // "Obviously top EA cause" would mean almost all multiplier mass clears the bar.
    // The Moderate longtermist preset (id 'ord') MUST land short of that — the spec's most important
    // honesty check. If this fails, defaults are biased.
    expect(ord.out.pAboveGiveWell).toBeLessThan(0.8);
  });

});

// The same checks at the site's own defaults (SDO f_l, value uncertainty on), i.e.
// what a visitor actually sees, not just the bare model.
describe('epistemic neutrality at the site defaults', () => {
  function runSiteDefaults(): PresetResult[] {
    return PRESETS.slice(0, 6).map((p) => {
      const { worldview, channels } = applyPreset(p);
      const out = runDrakeMC({
        ranges: defaultDrakeRanges(),
        methods: defaultDetectionState(),
        channels,
        worldview,
        flDistribution: DEFAULT_FL_DISTRIBUTION,
        valueUncertainty: defaultValueUncertainty(),
        n: N,
        seed: `site-neutrality-${p.id}`,
      });
      return { id: p.id, out };
    });
  }

  it('no worldview preset puts most worlds above the GiveWell bar', () => {
    for (const r of runSiteDefaults()) {
      expect(r.out.pAboveGiveWell).toBeLessThan(0.5);
    }
  });

  it('presets disagree, and at least one shows a real chance of serious harm', () => {
    const results = runSiteDefaults();
    const above = results.map((r) => r.out.pAboveGiveWell);
    expect(Math.max(...above) - Math.min(...above)).toBeGreaterThan(0.05);
    const worse = results.map((r) => r.out.pHarmBeyondGiveWell);
    expect(worse.some((p) => p > 0.05 && p < 0.95)).toBe(true);
  });

  // These used to check the Moderate longtermist's *median*, which is ≈ 10⁻²² for every
  // non-negative preset (most worlds find nothing), so they could never fail. The split
  // can: a biased default that pushed more worlds over the bar, or hid harm, trips them.
  it('Moderate longtermist: fewer than 40 of 100 worlds beat GiveWell, and at least 5 do serious harm', () => {
    const ord = runSiteDefaults().find((r) => r.id === 'ord');
    if (!ord) throw new Error('ord preset missing');
    expect(ord.out.pAboveGiveWell).toBeLessThan(0.4);
    expect(ord.out.pHarmBeyondGiveWell).toBeGreaterThan(0.05);
  });

  it('the site defaults themselves: fewer than 40 of 100 worlds beat GiveWell, and at least 5 do serious harm', () => {
    const out = runDrakeMC({
      ranges: defaultDrakeRanges(),
      methods: defaultDetectionState(),
      channels: defaultChannelState(),
      worldview: defaultWorldview(),
      flDistribution: DEFAULT_FL_DISTRIBUTION,
      valueUncertainty: defaultValueUncertainty(),
      n: N,
      seed: 'site-neutrality-defaults',
    });
    expect(out.pAboveGiveWell).toBeLessThan(0.4);
    expect(out.pHarmBeyondGiveWell).toBeGreaterThan(0.05);
  });

  it('the default "In GiveWell terms" number is the typical world, not the average', () => {
    // The average is dominated by a few worlds with enormous payoffs; leading with it put
    // "far better than GiveWell" on screen while most worlds find nothing.
    expect(defaultWorldview().riskAversion).toBe('typical');
  });
});
