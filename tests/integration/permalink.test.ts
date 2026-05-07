import { describe, it, expect } from 'vitest';
import pako from 'pako';
import { encodeState, decodeState, buildHash, readHashState } from '../../src/lib/permalink';
import { defaultDrakeRanges } from '../../src/model/drake';
import { defaultDetectionState } from '../../src/model/detection';
import { defaultChannelState } from '../../src/model/value';
import { defaultWorldview } from '../../src/model/worldview';
import { defaultGrabbyState } from '../../src/model/grabby';
import type { SerializedState } from '../../src/lib/permalink';

function defaultState(): SerializedState {
  return {
    v: 2,
    drakeRanges: defaultDrakeRanges(),
    methods: defaultDetectionState(),
    channels: defaultChannelState(),
    worldview: defaultWorldview(),
    cosmology: 'sdo',
    grabby: defaultGrabbyState(),
    overrides: {},
    astroLocked: false,
  };
}

describe('permalink encode / decode', () => {
  it('round-trips default state', () => {
    const s = defaultState();
    const enc = encodeState(s);
    const dec = decodeState(enc);
    expect(dec).toEqual(s);
  });

  it('round-trips a non-default state including astroLocked', () => {
    const s = defaultState();
    s.drakeRanges.fl = { min: 1e-10, max: 0.5 };
    s.cosmology = 'hybrid';
    s.overrides = { overridePNGteOne: 0.7 };
    s.astroLocked = true;
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

  it('migrates v=1 hashes to v=2 with astroLocked=false', () => {
    // Build a v=1 payload by hand (the SerializedState type is now v=2 only).
    const v1 = {
      v: 1 as const,
      drakeRanges: defaultDrakeRanges(),
      methods: defaultDetectionState(),
      channels: defaultChannelState(),
      worldview: defaultWorldview(),
      cosmology: 'sdo',
      grabby: defaultGrabbyState(),
      overrides: {},
    };
    const json = JSON.stringify(v1);
    const compressed = pako.deflate(json);
    let binary = '';
    for (const b of compressed) binary += String.fromCharCode(b);
    const b64 = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const decoded = decodeState(b64);
    expect(decoded.v).toBe(2);
    expect(decoded.astroLocked).toBe(false);
  });
});
