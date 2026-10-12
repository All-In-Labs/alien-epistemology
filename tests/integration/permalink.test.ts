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
    v: 5,
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

/**
 * Methods as v1–v4 links stored them: no reach, and sensitivities on the old scale (per
 * civilisation anywhere in the galaxy). Two methods are customised so the test can check
 * that on/off and cost carry over.
 */
const legacyMethods = () =>
  defaultDetectionState().map(({ reachMin: _r1, reachMax: _r2, ...m }) => {
    void _r1;
    void _r2;
    const old = { ...m, sensMin: 1e-4, sensMax: 1e-1 };
    if (m.id === 'seti') return { ...old, costM: 120 };
    if (m.id === 'tech') return { ...old, on: true };
    return old;
  });

/** What legacyMethods() should migrate to: same on/off and costs, new detection numbers. */
const migratedMethods = () =>
  defaultDetectionState().map((m) => {
    if (m.id === 'seti') return { ...m, costM: 120 };
    if (m.id === 'tech') return { ...m, on: true };
    return m;
  });

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

  it('migrates v=1 hashes to v=5 with astroLocked=false, no value uncertainty, no Grabby fields', () => {
    const v1 = {
      v: 1,
      drakeRanges: defaultDrakeRanges(),
      methods: legacyMethods(),
      channels: defaultChannelState(),
      worldview: legacyWorldview(),
      overrides: {},
      ...LEGACY_GRABBY,
    };
    const decoded = decodeState(encodeRaw(v1));
    expect(decoded.v).toBe(5);
    expect(decoded.methods).toEqual(migratedMethods());
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
      methods: legacyMethods(),
      v: 2,
      astroLocked: true,
      worldview: { ...legacyWorldview(), riskAversion: 'difference-making' },
      ...LEGACY_GRABBY,
    };
    const decoded = decodeState(encodeRaw(v2));
    expect(decoded.v).toBe(5);
    expect(decoded.astroLocked).toBe(true);
    expect(decoded.worldview.riskAversion).toBe('cautious');
    expect(decoded.valueUncertainty).toEqual({ magnitudeOOM: 0, shiftPM: 0 });
  });

  it('migrates v=3 hashes by dropping the removed Grabby mode and keeping everything else', () => {
    const s = defaultState();
    s.flDistribution = 'sdo-lognormal';
    s.astroLocked = true;
    const v3 = {
      ...s,
      v: 3,
      methods: legacyMethods(),
      worldview: legacyWorldview(),
      ...LEGACY_GRABBY,
    };
    const decoded = decodeState(encodeRaw(v3));
    expect(decoded).toEqual({ ...s, methods: migratedMethods() });
  });

  it('migrates v=4 hashes: keeps which methods are funded and at what cost, resets detection numbers to the sourced reach model', () => {
    // v4 sensitivities were per civilisation anywhere in the galaxy, so they don't carry
    // over to the in-reach scale. Like the Grabby removal, this corrects an error rather
    // than adding a feature, so old links get the corrected maths.
    const s = defaultState();
    s.astroLocked = true;
    s.overrides = { overridePNGteOne: 0.3 };
    const v4 = { ...s, v: 4, methods: legacyMethods() };
    const decoded = decodeState(encodeRaw(v4));
    expect(decoded).toEqual({ ...s, methods: migratedMethods() });
  });

  it('round-trips custom reach bounds', () => {
    const s = defaultState();
    s.methods = s.methods.map((m) =>
      m.id === 'seti' ? { ...m, reachMin: 1e-6, reachMax: 1e-4 } : m,
    );
    expect(decodeState(encodeState(s))).toEqual(s);
  });
});
