import { describe, it, expect } from 'vitest';
import { encodeState, decodeState, buildHash, readHashState } from '../../src/lib/permalink';
import { defaultDrakeRanges } from '../../src/model/drake';
import { defaultDetectionState } from '../../src/model/detection';
import { defaultChannelState } from '../../src/model/value';
import { defaultWorldview } from '../../src/model/worldview';
import { defaultGrabbyState } from '../../src/model/grabby';
import type { SerializedState } from '../../src/lib/permalink';

function defaultState(): SerializedState {
  return {
    v: 1,
    drakeRanges: defaultDrakeRanges(),
    methods: defaultDetectionState(),
    channels: defaultChannelState(),
    worldview: defaultWorldview(),
    cosmology: 'sdo',
    grabby: defaultGrabbyState(),
    overrides: {},
  };
}

describe('permalink encode / decode', () => {
  it('round-trips default state', () => {
    const s = defaultState();
    const enc = encodeState(s);
    const dec = decodeState(enc);
    expect(dec).toEqual(s);
  });

  it('round-trips a non-default state', () => {
    const s = defaultState();
    s.drakeRanges.fl = { min: 1e-10, max: 0.5 };
    s.cosmology = 'hybrid';
    s.overrides = { overridePNGteOne: 0.7 };
    const enc = encodeState(s);
    const dec = decodeState(enc);
    expect(dec).toEqual(s);
  });

  it('buildHash and readHashState round-trip', () => {
    const s = defaultState();
    const hash = buildHash(s);
    expect(hash.startsWith('#s=')).toBe(true);
    const decoded = readHashState(hash);
    expect(decoded).toEqual(s);
  });

  it('readHashState returns null for invalid hash', () => {
    expect(readHashState('')).toBeNull();
    expect(readHashState('#foo')).toBeNull();
    expect(readHashState('#s=invalid!@#')).toBeNull();
  });

  it('produces a hash short enough to share (<2000 chars for default state)', () => {
    const hash = buildHash(defaultState());
    expect(hash.length).toBeLessThan(2000);
  });
});
