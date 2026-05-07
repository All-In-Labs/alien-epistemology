// Six worldview presets from spec §6.4. Each preset populates ALL relevant dials.
//
// Per the spec's neutrality requirement (§10 #5), no preset is privileged in the UI.

import type { WorldviewDials } from '../model/worldview';
import type { ChannelsState } from '../model/value';
import { defaultChannelState } from '../model/value';

export type PresetId = 'bostrom' | 'hanson' | 'ord' | 'near' | 'dark' | 'astro';

export interface Preset {
  id: PresetId;
  name: string;
  short: string;
  worldview: WorldviewDials;
  /** Optional channel-state overrides — e.g. Dark Forest preset bumps P(hostile). */
  channels?: Partial<{
    A: Partial<ChannelsState['A']>;
    B: Partial<ChannelsState['B']>;
    C: Partial<ChannelsState['C']>;
    D: Partial<ChannelsState['D']>;
  }>;
}

export const PRESETS: Preset[] = [
  {
    id: 'bostrom',
    name: 'Bostrom Longtermist',
    short: 'long-term, total-view, no discount',
    worldview: {
      longtermismStrength: 1.0,
      timeDiscount: 0,
      personAffecting: false,
      alienMoralWeight: 0.5,
      hingeyness: 0.5,
      filterPriorBehind: 0.5,
      riskAversion: 'EV-max',
      grabbyCredence: 0.1,
    },
  },
  {
    id: 'hanson',
    name: 'Hanson Filter Pessimist',
    short: 'filter likely ahead; weight C low',
    worldview: {
      longtermismStrength: 0.7,
      timeDiscount: 0,
      personAffecting: false,
      alienMoralWeight: 0.1,
      hingeyness: 0.3,
      filterPriorBehind: 0.2,
      riskAversion: 'EV-max',
      grabbyCredence: 0.1,
    },
  },
  {
    id: 'ord',
    name: 'Ord Moderate',
    short: 'log-utility risk; mild discount',
    worldview: {
      longtermismStrength: 0.5,
      timeDiscount: 0.001,
      personAffecting: false,
      alienMoralWeight: 0.3,
      hingeyness: 0.2,
      filterPriorBehind: 0.5,
      riskAversion: 'log-utility',
      grabbyCredence: 0.1,
    },
  },
  {
    id: 'near',
    name: 'Neartermist',
    short: 'person-affecting, 3% discount',
    worldview: {
      longtermismStrength: 0,
      timeDiscount: 0.03,
      personAffecting: true,
      alienMoralWeight: 0,
      hingeyness: 0,
      filterPriorBehind: 0.5,
      riskAversion: 'EV-max',
      grabbyCredence: 0,
    },
  },
  {
    id: 'dark',
    name: 'Dark Forest',
    short: 'difference-making; weight D high',
    worldview: {
      longtermismStrength: 0.5,
      timeDiscount: 0,
      personAffecting: false,
      alienMoralWeight: 0,
      hingeyness: 0.2,
      filterPriorBehind: 0.5,
      riskAversion: 'difference-making',
      grabbyCredence: 0.1,
    },
    channels: {
      D: { pHostile: 0.3 },
    },
  },
  {
    id: 'astro',
    name: 'Astronomical Waste max.',
    short: 'channel B dominates everything',
    worldview: {
      longtermismStrength: 1.0,
      timeDiscount: 0,
      personAffecting: false,
      alienMoralWeight: 0,
      hingeyness: 0.8,
      filterPriorBehind: 0.7,
      riskAversion: 'EV-max',
      grabbyCredence: 0.1,
    },
  },
];

export function applyPreset(preset: Preset): {
  worldview: WorldviewDials;
  channels: ChannelsState;
} {
  const channels = defaultChannelState();
  if (preset.channels) {
    if (preset.channels.A) channels.A = { ...channels.A, ...preset.channels.A };
    if (preset.channels.B) channels.B = { ...channels.B, ...preset.channels.B };
    if (preset.channels.C) channels.C = { ...channels.C, ...preset.channels.C };
    if (preset.channels.D) channels.D = { ...channels.D, ...preset.channels.D };
  }
  return { worldview: { ...preset.worldview }, channels };
}
