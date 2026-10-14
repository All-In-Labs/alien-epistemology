// A preset is a complete starting point: loading one gives the same state whatever was
// loaded or edited before (previously the demo presets' Drake bounds and overrides leaked
// into whichever preset came next).
import { describe, it, expect } from 'vitest';
import {
  useStore,
  configurationLabel,
  getSerializedState,
  applySerializedState,
} from '../../src/store';
import type { PresetId } from '../../src/presets/worldviews';

function snapshot() {
  const s = useStore.getState();
  return {
    drakeRanges: s.drakeRanges,
    methods: s.methods,
    channels: s.channels,
    worldview: s.worldview,
    overrides: s.overrides,
    valueUncertainty: s.valueUncertainty,
    flDistribution: s.flDistribution,
  };
}

function fresh(id: PresetId) {
  useStore.getState().resetAll();
  useStore.getState().loadPreset(id);
  return snapshot();
}

describe('store: presets', () => {
  it('a worldview preset loaded after a demo preset matches the same preset loaded fresh', () => {
    const expected = fresh('bostrom');
    useStore.getState().resetAll();
    useStore.getState().loadPreset('max-aliens');
    useStore.getState().loadPreset('bostrom');
    expect(snapshot()).toEqual(expected);
  });

  it('a preset clears earlier manual edits to Drake bounds, methods and overrides', () => {
    const expected = fresh('near');
    const s = useStore.getState();
    s.resetAll();
    s.setDrakeRange('L', { min: 1e9, max: 1e10 });
    s.setMethodCost('seti', 400);
    s.patchOverrides({ detectionFloor: 0.5 });
    s.loadPreset('near');
    expect(snapshot()).toEqual(expected);
  });

  it('demo presets use their own f_l bounds rather than SDO’s model', () => {
    useStore.getState().resetAll();
    useStore.getState().loadPreset('max-aliens');
    expect(useStore.getState().flDistribution).toBe('log-uniform');
    useStore.getState().loadPreset('ord');
    expect(useStore.getState().flDistribution).toBe('sdo-lognormal');
  });
});

describe('store: configuration label', () => {
  it('reads "Default settings" when nothing has been changed', () => {
    useStore.getState().resetAll();
    expect(configurationLabel(useStore.getState())).toBe('Default settings');
  });

  it('flipping the risk dial alone still counts as the defaults (it only picks a summary number)', () => {
    useStore.getState().resetAll();
    useStore.getState().patchWorldview({ riskAversion: 'average' });
    expect(configurationLabel(useStore.getState())).toBe('Default settings');
  });

  it('names the preset, until anything is edited', () => {
    const s = useStore.getState();
    s.resetAll();
    s.loadPreset('ord');
    expect(configurationLabel(useStore.getState())).toBe('Moderate longtermist preset');
    useStore.getState().setMethodCost('seti', 120);
    expect(configurationLabel(useStore.getState())).toBe('Your settings');
  });

  it('survives a permalink round trip', () => {
    const s = useStore.getState();
    s.resetAll();
    s.loadPreset('near');
    const serialized = getSerializedState();
    useStore.getState().resetAll();
    applySerializedState(serialized);
    expect(configurationLabel(useStore.getState())).toBe('Neartermist preset');
  });

  it('a link naming a removed preset loads its dials, labelled as the reader\'s own settings', () => {
    useStore.getState().resetAll();
    useStore.getState().patchWorldview({ filterPriorBehind: 0.2 });
    // 'hanson' was the Filter pessimist preset; links shared before it was removed carry it.
    const old = { ...getSerializedState(), preset: 'hanson' as PresetId };
    useStore.getState().resetAll();
    applySerializedState(old);
    expect(useStore.getState().worldview.filterPriorBehind).toBe(0.2);
    expect(useStore.getState().activePreset).toBeNull();
    expect(configurationLabel(useStore.getState())).toBe('Your settings');
  });
});
