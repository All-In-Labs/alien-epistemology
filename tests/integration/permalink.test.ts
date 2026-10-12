import { describe, it, expect } from 'vitest';
import pako from 'pako';
import { encodeState, decodeState, buildHash, readHashState } from '../../src/lib/permalink';
import { defaultDrakeRanges } from '../../src/model/drake';
import { defaultDetectionState } from '../../src/model/detection';
import { defaultChannelState, defaultValueUncertainty } from '../../src/model/value';
import { defaultWorldview } from '../../src/model/worldview';
import type { SerializedState } from '../../src/lib/permalink';

function defaultState(): SerializedState {
  return {
    v: 4,
    drakeRanges: defaultDrakeRanges(),
    methods: defaultDetectionState(),
    channels: defaultChannelState(),
    worldview: defaultWorldview(),
    overrides: {},
    valueUncertainty: defaultValueUncertainty(),
    flDistribution: 'log-uniform',
    astroLocked: false,
  };
}

/** Encode an arbitrary (e.g. legacy-version) payload the way the app does. */
function encodeRaw(payload: unknown): string {
  const compressed = pako.deflate(JSON.stringify(payload));
  let binary = '';
  for (const b of compressed) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** The legacy Grabby fields that v1–v3 links carried. */
const LEGACY_GRABBY = {
  cosmology: 'hybrid',
  grabby: { zoneCredenceMin: 0.05, zoneCredenceMax: 0.5 },
};
const legacyWorldview = () => ({ ...defaultWorldview(), grabbyCredence: 0.1 });

describe('permalink encode / decode', () => {
  it('round-trips default state', () => {
    const s = defaultState();
    expect(decodeState(encodeState(s))).toEqual(s);
  });

  it('round-trips a non-default state including astroLocked', () => {
    const s = defaultState();
    s.drakeRanges.fl = { min: 1e-10, max: 0.5 };
    s.flDistribution = 'sdo-lognormal';
    s.overrides = { overridePNGteOne: 0.7 };
    s.astroLocked = true;
    expect(decodeState(encodeState(s))).toEqual(s);
  });

  it('buildHash and readHashState round-trip', () => {
    const s = defaultState();
    const hash = buildHash(s);
    expect(hash.startsWith('#s=')).toBe(true);
    expect(readHashState(hash)).toEqual(s);
  });

  it('readHashState returns null for invalid hash', () => {
    expect(readHashState('')).toBeNull();
    expect(readHashState('#foo')).toBeNull();
    expect(readHashState('#s=invalid!@#')).toBeNull();
  });

  it('produces a hash short enough to share (<2000 chars for default state)', () => {
    expect(buildHash(defaultState()).length).toBeLessThan(2000);
  });

  it('migrates v=1 hashes to v=4 with astroLocked=false, no value uncertainty, no Grabby fields', () => {
    const v1 = {
      v: 1,
      drakeRanges: defaultDrakeRanges(),
      methods: defaultDetectionState(),
      channels: defaultChannelState(),
      worldview: legacyWorldview(),
      overrides: {},
      ...LEGACY_GRABBY,
    };
    const decoded = decodeState(encodeRaw(v1));
    expect(decoded.v).toBe(4);
    expect(decoded.astroLocked).toBe(false);
    expect(decoded.valueUncertainty).toEqual({ magnitudeOOM: 0, shiftPM: 0 });
    expect(decoded.flDistribution).toBe('log-uniform');
    expect('cosmology' in decoded).toBe(false);
    expect('grabbyCredence' in decoded.worldview).toBe(false);
  });

  it('migrates v=2 hashes without value uncertainty, mapping old risk-dial names', () => {
    const { valueUncertainty: _vu, flDistribution: _fd, ...rest } = defaultState();
    void _vu;
    void _fd;
    const v2 = {
      ...rest,
      v: 2,
      astroLocked: true,
      worldview: { ...legacyWorldview(), riskAversion: 'difference-making' },
      ...LEGACY_GRABBY,
    };
    const decoded = decodeState(encodeRaw(v2));
    expect(decoded.v).toBe(4);
    expect(decoded.astroLocked).toBe(true);
    expect(decoded.worldview.riskAversion).toBe('cautious');
    expect(decoded.valueUncertainty).toEqual({ magnitudeOOM: 0, shiftPM: 0 });
  });

  it('migrates v=3 hashes by dropping the removed Grabby mode and keeping everything else', () => {
    const s = defaultState();
    s.flDistribution = 'sdo-lognormal';
    s.astroLocked = true;
    const v3 = { ...s, v: 3, worldview: legacyWorldview(), ...LEGACY_GRABBY };
    const decoded = decodeState(encodeRaw(v3));
    expect(decoded).toEqual(s);
  });
});
