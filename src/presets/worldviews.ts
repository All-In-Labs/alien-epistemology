// Six worldview presets from spec §6.4. Each preset populates ALL relevant dials.
//
// Per the spec's neutrality requirement (§10 #5), no preset is privileged in the UI.

import type { WorldviewDials } from '../model/worldview';
import type { ChannelsState } from '../model/value';
import { defaultChannelState } from '../model/value';
import { defaultDrakeRanges, type DrakeRanges } from '../model/drake';
import {
  defaultDetectionState,
  type DetectionMethodState,
} from '../model/detection';
import type { PriorOverrides } from '../model/monteCarlo';
import { DETECTION_DEFAULTS, type DetectionMethodId } from '../constants/detectionDefaults';

/** Demo presets: a method pinned at the top of its sourced reach and in-reach sensitivity. */
function demoMethod(id: DetectionMethodId, on: boolean, costM: number): DetectionMethodState {
  const cfg = DETECTION_DEFAULTS[id];
  return {
    id,
    type: cfg.type,
    on,
    costM,
    sensMin: cfg.sensitivity.max,
    sensMax: cfg.sensitivity.max,
    reachMin: cfg.reach.max,
    reachMax: cfg.reach.max,
  };
}

export type PresetId =
  | 'bostrom'
  | 'hanson'
  | 'ord'
  | 'near'
  | 'dark'
  | 'astro'
  | 'max-aliens'
  | 'min-aliens';

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
  /** Optional full-state overrides — used by demo presets that load a complete
   *  configuration in one shot (Drake bounds, methods, overrides).
   *  Each is applied as a full replacement of the corresponding state slice. */
  drakeRanges?: DrakeRanges;
  methods?: DetectionMethodState[];
  overrides?: PriorOverrides;
}

export const PRESETS: Preset[] = [
  {
    id: 'bostrom',
    // Descriptive names, not people: the dial values below are illustrative and not
    // sourced from any one author's stated views.
    name: 'Strong longtermist',
    short: 'long-term, total-view, no discount',
    worldview: {
      longtermismStrength: 1.0,
      timeDiscount: 0,
      personAffecting: false,
      alienMoralWeight: 0.5,
      hingeyness: 0.5,
      filterPriorBehind: 0.5,
      riskAversion: 'average',
    },
  },
  {
    id: 'hanson',
    name: 'Filter pessimist',
    short: 'Great Filter probably ahead; aliens’ welfare counts little',
    // Differs from the defaults only in what its name and description say: ϕ = 0.2 (the
    // filter is probably ahead). It used to also raise longtermism, hingeyness and drop the
    // discount, unannounced, which made it ~19× kinder to the search than the defaults.
    worldview: {
      longtermismStrength: 0.3,
      timeDiscount: 0.001,
      personAffecting: false,
      alienMoralWeight: 0.1,
      hingeyness: 0.1,
      filterPriorBehind: 0.2,
      riskAversion: 'typical',
    },
  },
  {
    id: 'ord',
    name: 'Moderate longtermist',
    short: 'typical-world view; mild discount',
    worldview: {
      longtermismStrength: 0.5,
      timeDiscount: 0.001,
      personAffecting: false,
      alienMoralWeight: 0.3,
      hingeyness: 0.2,
      filterPriorBehind: 0.5,
      riskAversion: 'typical',
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
      riskAversion: 'average',
    },
  },
  {
    id: 'dark',
    name: 'Dark Forest',
    short: 'cautious view; weight D high',
    worldview: {
      longtermismStrength: 0.5,
      timeDiscount: 0,
      personAffecting: false,
      alienMoralWeight: 0,
      hingeyness: 0.2,
      filterPriorBehind: 0.5,
      riskAversion: 'cautious',
    },
    // Dark Forest premises: detection chiefly tells us the lightcone is claimed (B's
    // tech-viability evidence is faint, lightcone-claim evidence is strong) and that
    // hostile attention is materially likely. With these channel overrides the preset
    // produces non-trivial P(EV<0) per spec §10 #3.
    channels: {
      B: { techViabilityShift: 0.05, lightconeClaimShift: -0.3 },
      D: { pHostile: 0.5 },
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
      riskAversion: 'average',
    },
  },
  // ---- Demo presets — full-state configs that load every slider in one click.
  // These exist for the lightning-talk "upper/lower bound" demonstration: the
  // verdict the tool *can* deliver if every assumption is dialled toward one
  // extreme. They're not endorsements; they're the boundary of the model.
  {
    id: 'max-aliens',
    name: 'Maximum-aliens demo',
    short: 'every dial pushed toward "alien-finding rules"',
    worldview: {
      longtermismStrength: 1.0,
      timeDiscount: 0,
      personAffecting: false,
      alienMoralWeight: 1.0,
      hingeyness: 1.0,
      filterPriorBehind: 0,
      riskAversion: 'average',
    },
    channels: {
      A: {
        on: true,
        delta: { biosig: 0.5, technosig: 0.5, radio: 0.5, passive_radar: 0.5, probe: 0.5 },
        vXriskInfo: 1e12,
      },
      B: {
        on: true,
        techViabilityShift: 0.5,
        lightconeClaimShift: 0.5,
        vCosmicEndowment: 1e20,
      },
      C: {
        on: true,
        pFriendly: 1,
        vContactFriendly: 1e10,
        fires: ['radio', 'technosig', 'passive_radar'],
      },
      D: {
        on: true,
        pHostile: 0,
        vHostileDisvalue: 0,
        fires: ['radio', 'technosig', 'probe'],
      },
    },
    drakeRanges: {
      R: { min: 10, max: 10 },
      fp: { min: 1, max: 1 },
      ne: { min: 1, max: 1 },
      fl: { min: 1, max: 1 },
      fi: { min: 1, max: 1 },
      fc: { min: 1, max: 1 },
      L: { min: 1e10, max: 1e10 },
      fd: { min: 1, max: 1 },
    },
    methods: [
      demoMethod('seti', true, 10),
      demoMethod('tech', false, 50),
      demoMethod('bio', false, 5000),
      demoMethod('probe', false, 500),
      demoMethod('retina', true, 1),
    ],
    overrides: { overridePNGteOne: 1.0, detectionFloor: 1.0 },
  },
  {
    id: 'min-aliens',
    name: 'Minimum-aliens demo',
    short: 'every dial pushed toward "alien-finding is catastrophic"',
    worldview: {
      longtermismStrength: 0,
      timeDiscount: 0.10,
      personAffecting: true,
      alienMoralWeight: 0,
      hingeyness: 0,
      filterPriorBehind: 0.5,
      riskAversion: 'average',
    },
    channels: {
      A: { on: false },
      B: { on: false },
      C: { on: false },
      D: {
        on: true,
        pHostile: 1,
        vHostileDisvalue: -1e20,
        fires: ['radio', 'technosig', 'biosig', 'probe', 'passive_radar'],
      },
    },
    drakeRanges: {
      R: { min: 10, max: 10 },
      fp: { min: 1, max: 1 },
      ne: { min: 1, max: 1 },
      fl: { min: 1, max: 1 },
      fi: { min: 1, max: 1 },
      fc: { min: 1, max: 1 },
      L: { min: 1e10, max: 1e10 },
      fd: { min: 1, max: 1 },
    },
    methods: [
      demoMethod('seti', true, 10),
      demoMethod('tech', false, 50),
      demoMethod('bio', false, 5000),
      demoMethod('probe', false, 500),
      demoMethod('retina', false, 5),
    ],
    overrides: { overridePNGteOne: 1.0, detectionFloor: 1.0 },
  },
];

// Suppress "unused" lint for default helpers — they're imported for future
// preset definitions and to keep the demo presets self-documenting.
void defaultDrakeRanges;
void defaultDetectionState;

export interface AppliedPreset {
  worldview: WorldviewDials;
  channels: ChannelsState;
  drakeRanges?: DrakeRanges | undefined;
  methods?: DetectionMethodState[] | undefined;
  overrides?: PriorOverrides | undefined;
}

export function applyPreset(preset: Preset): AppliedPreset {
  const channels = defaultChannelState();
  if (preset.channels) {
    if (preset.channels.A) channels.A = { ...channels.A, ...preset.channels.A };
    if (preset.channels.B) channels.B = { ...channels.B, ...preset.channels.B };
    if (preset.channels.C) channels.C = { ...channels.C, ...preset.channels.C };
    if (preset.channels.D) channels.D = { ...channels.D, ...preset.channels.D };
  }
  return {
    worldview: { ...preset.worldview },
    channels,
    drakeRanges: preset.drakeRanges,
    methods: preset.methods,
    overrides: preset.overrides,
  };
}
