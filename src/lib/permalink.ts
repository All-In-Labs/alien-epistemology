// Permalink encoding/decoding per spec §6.5.
// State is serialised to JSON, deflate-compressed via pako, then base64url-encoded
// and placed in the URL hash. Schema is versioned; older hashes flow through migrations
// before being applied.

import pako from 'pako';

import type { DrakeRanges } from '../model/drake';
import { defaultDetectionState, type DetectionMethodState } from '../model/detection';
import { NO_VALUE_UNCERTAINTY, type ChannelsState, type ValueUncertainty } from '../model/value';
import type { FlDistribution } from '../constants/defaults';
import { normalizeRiskAversion, type WorldviewDials } from '../model/worldview';
import type { PriorOverrides } from '../model/monteCarlo';
import type { PresetId } from '../presets/worldviews';

/**
 * A detection method as v1–v4 links stored it: no survey reach, and sensitivities on the
 * old scale (per civilisation anywhere in the galaxy).
 */
type LegacyMethod = Omit<DetectionMethodState, 'reachMin' | 'reachMax'> & {
  reachMin?: unknown;
  reachMax?: unknown;
};

/**
 * Fields common to v1–v3. Those versions also carried `cosmology` and `grabby` (the
 * removed Grabby Aliens mode); they are read loosely here and dropped on migration.
 */
interface LegacyCommon {
  drakeRanges: DrakeRanges;
  methods: LegacyMethod[];
  channels: ChannelsState;
  worldview: WorldviewDials & { grabbyCredence?: unknown };
  cosmology?: unknown;
  grabby?: unknown;
  overrides: PriorOverrides;
}

/** v=1: original shape (no astroLocked). */
type SerializedStateV1 = LegacyCommon & { v: 1 };
/** v=2: adds astroLocked. */
type SerializedStateV2 = LegacyCommon & { v: 2; astroLocked: boolean };
/** v=3: adds valueUncertainty and flDistribution. */
type SerializedStateV3 = LegacyCommon & {
  v: 3;
  astroLocked: boolean;
  valueUncertainty: ValueUncertainty;
  flDistribution: FlDistribution;
};

/** v=4: drops the Grabby Aliens mode (cosmology, grabby, worldview.grabbyCredence). */
interface SerializedStateV4 {
  v: 4;
  drakeRanges: DrakeRanges;
  methods: LegacyMethod[];
  channels: ChannelsState;
  worldview: WorldviewDials;
  overrides: PriorOverrides;
  valueUncertainty: ValueUncertainty;
  flDistribution: FlDistribution;
  astroLocked: boolean;
}

/** v=5: detection methods gain survey reach; sensitivities become per target in reach.
 *  `preset` (optional, added later in v5) names the preset the state came from, so a
 *  shared link says "Moderate longtermist preset" rather than "Your settings". */
export interface SerializedState {
  v: 5;
  preset?: PresetId | undefined;
  drakeRanges: DrakeRanges;
  methods: DetectionMethodState[];
  channels: ChannelsState;
  worldview: WorldviewDials;
  overrides: PriorOverrides;
  valueUncertainty: ValueUncertainty;
  flDistribution: FlDistribution;
  astroLocked: boolean;
}

/**
 * Links made before v3 had no value uncertainty and log-uniform f_l. Migrating them to
 * exactly that keeps an old link as close as possible to what its author saw.
 */
function migrateV2(v2: SerializedStateV2): SerializedStateV3 {
  return {
    ...v2,
    v: 3,
    valueUncertainty: { ...NO_VALUE_UNCERTAINTY },
    flDistribution: 'log-uniform',
  };
}

/**
 * v3 → v4: drop the Grabby Aliens fields. A link that was in Grabby or Hybrid mode now
 * opens in the standard (SDO) model; its other settings carry over unchanged.
 */
function migrateV3(v3: SerializedStateV3): SerializedStateV4 {
  const { cosmology: _c, grabby: _g, worldview, ...rest } = v3;
  void _c;
  void _g;
  const { grabbyCredence: _gc, ...wv } = worldview;
  void _gc;
  return { ...rest, worldview: wv, v: 4 };
}

/**
 * v4 → v5: detection gains survey reach. Old sensitivities were per civilisation anywhere
 * in the galaxy, so they mean nothing on the new in-reach scale. Like the Grabby removal
 * this corrects an error, so old links get the corrected maths: each method keeps whether
 * it is funded and at what cost, and takes the current sensitivity and reach defaults.
 */
function migrateV4(v4: SerializedStateV4): SerializedState {
  const legacy = new Map(v4.methods.map((m) => [m.id, m]));
  const methods = defaultDetectionState().map((m) => {
    const old = legacy.get(m.id);
    return old ? { ...m, on: old.on, costM: old.costM } : m;
  });
  return { ...v4, methods, v: 5 };
}

function base64urlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(s: string): Uint8Array {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function encodeState(state: SerializedState): string {
  const json = JSON.stringify(state);
  const compressed = pako.deflate(json);
  return base64urlEncode(compressed);
}

/**
 * Decode and migrate a permalink payload. Older versions are upgraded to the
 * current shape; future versions throw.
 */
export function decodeState(s: string): SerializedState {
  const state = decodeAnyVersion(s);
  // Older links store the risk dial under its old technical names.
  return {
    ...state,
    worldview: {
      ...state.worldview,
      riskAversion: normalizeRiskAversion(state.worldview.riskAversion),
    },
  };
}

function decodeAnyVersion(s: string): SerializedState {
  const compressed = base64urlDecode(s);
  const json = pako.inflate(compressed, { to: 'string' });
  const obj = JSON.parse(json) as { v?: number };
  if (obj.v === 1) {
    const v1 = obj as unknown as SerializedStateV1;
    return migrateV4(migrateV3(migrateV2({ ...v1, v: 2, astroLocked: false })));
  }
  if (obj.v === 2) {
    return migrateV4(migrateV3(migrateV2(obj as unknown as SerializedStateV2)));
  }
  if (obj.v === 3) {
    return migrateV4(migrateV3(obj as unknown as SerializedStateV3));
  }
  if (obj.v === 4) {
    return migrateV4(obj as unknown as SerializedStateV4);
  }
  if (obj.v === 5) {
    return obj as unknown as SerializedState;
  }
  throw new Error(`Unknown permalink version: ${String(obj.v)}`);
}

export function buildHash(state: SerializedState): string {
  return `#s=${encodeState(state)}`;
}

export function readHashState(hash: string): SerializedState | null {
  if (!hash.startsWith('#s=')) return null;
  try {
    return decodeState(hash.slice(3));
  } catch {
    return null;
  }
}
