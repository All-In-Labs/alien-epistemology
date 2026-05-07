// Permalink encoding/decoding per spec §6.5.
// State is serialised to JSON, deflate-compressed via pako, then base64url-encoded
// and placed in the URL hash. v=1; future schema changes get migrations.

import pako from 'pako';

import type { DrakeRanges } from '../model/drake';
import type { DetectionMethodState } from '../model/detection';
import type { ChannelsState } from '../model/value';
import type { WorldviewDials } from '../model/worldview';
import type { GrabbyState } from '../model/grabby';
import type { CosmologyMode, PriorOverrides } from '../model/monteCarlo';

export interface SerializedState {
  v: 1;
  drakeRanges: DrakeRanges;
  methods: DetectionMethodState[];
  channels: ChannelsState;
  worldview: WorldviewDials;
  cosmology: CosmologyMode;
  grabby: GrabbyState;
  overrides: PriorOverrides;
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

export function decodeState(s: string): SerializedState {
  const compressed = base64urlDecode(s);
  const json = pako.inflate(compressed, { to: 'string' });
  const obj = JSON.parse(json) as { v?: number };
  if (obj.v !== 1) {
    throw new Error(`Unknown permalink version: ${String(obj.v)}`);
  }
  return obj as unknown as SerializedState;
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
