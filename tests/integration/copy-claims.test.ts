// The page makes a few claims about what drives the verdict (Ch.3 channel text, the Ch.4
// filter-prior hint, the Ch.5 row captions and the Assumptions modal). Each test here pins one of them. If a model change breaks one, the
// copy that makes the claim has to change too.

import { describe, it, expect } from 'vitest';
import { runDrakeMC, type DrakeMCInput } from '../../src/model/monteCarlo';
import { defaultDrakeRanges } from '../../src/model/drake';
import { defaultDetectionState } from '../../src/model/detection';
import { defaultChannelState, defaultValueUncertainty } from '../../src/model/value';
import { defaultWorldview } from '../../src/model/worldview';
import { outcomeSplit, type OutcomeSplit } from '../../src/model/summary';
import { DEFAULT_FL_DISTRIBUTION } from '../../src/constants/defaults';

const N = 50_000;

function base(): DrakeMCInput {
  return {
    ranges: defaultDrakeRanges(),
    methods: defaultDetectionState(),
    channels: defaultChannelState(),
    worldview: defaultWorldview(),
    valueUncertainty: defaultValueUncertainty(),
    flDistribution: DEFAULT_FL_DISTRIBUTION,
    n: N,
    seed: 'copy-claims',
  };
}

function split(input: DrakeMCInput): OutcomeSplit {
  const out = runDrakeMC(input);
  return outcomeSplit(out.pAboveGiveWell, out.pHarmBeyondGiveWell);
}

describe('claims the copy makes about what drives the verdict', () => {
  it('channel A cannot change the split at default values, whatever ϕ is', () => {
    const at = (filterPriorBehind: number): OutcomeSplit =>
      split({ ...base(), worldview: { ...defaultWorldview(), filterPriorBehind } });
    expect(at(1)).toEqual(at(0));
  });

  it('with no spread on B\'s shifts, no world beats GiveWell at the defaults', () => {
    const valueUncertainty = { ...defaultValueUncertainty(), shiftPM: 0 };
    expect(split({ ...base(), valueUncertainty }).better).toBe(0);
  });

  it('serious harm comes mostly from channel D, and partly from B\'s claimed-cosmos side', () => {
    const without = (ch: 'B' | 'D'): OutcomeSplit => {
      const channels = defaultChannelState();
      channels[ch].on = false;
      return split({ ...base(), channels });
    };
    const all = split(base());
    const withoutD = without('D');
    expect(withoutD.worse).toBeGreaterThan(0);
    expect(withoutD.worse).toBeLessThan(all.worse);
    expect(without('B').worse).toBeGreaterThan(all.worse);
  });
});
