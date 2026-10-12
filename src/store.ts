import { create } from 'zustand';
import { defaultDrakeRanges, type DrakeRanges } from './model/drake';
import {
  defaultDetectionState,
  type DetectionMethodState,
} from './model/detection';
import {
  defaultChannelState,
  defaultValueUncertainty,
  type ChannelsState,
  type ValueUncertainty,
} from './model/value';
import { defaultWorldview, type WorldviewDials } from './model/worldview';
import { applyPreset, PRESETS, type PresetId } from './presets/worldviews';
import type {
  DrakeMCOutput,
  PriorOverrides,
} from './model/monteCarlo';
import type { SerializedState } from './lib/permalink';
import {
  DEFAULT_FL_DISTRIBUTION,
  type DrakeBound,
  type DrakeParamId,
  type FlDistribution,
} from './constants/defaults';
import type { DetectionMethodId } from './constants/detectionDefaults';
import type { ValueChannelId } from './constants/valueDefaults';

interface AppState {
  drakeRanges: DrakeRanges;
  methods: DetectionMethodState[];
  channels: ChannelsState;
  worldview: WorldviewDials;
  overrides: PriorOverrides;
  /** Per-sample uncertainty on value magnitudes and Channel B shifts. */
  valueUncertainty: ValueUncertainty;
  /** How f_l is sampled: log-uniform between its bounds, or SDO 2018's log-normal rate. */
  flDistribution: FlDistribution;
  activePreset: PresetId | null;
  /** When true, the R*, fp, ne sliders are disabled (locked at default values).
   *  Lets users isolate the speculative-parameter sensitivity per spec §6.3. */
  astroLocked: boolean;
  /** 'deterministic' = MC seed derived from state hash → identical results when
   *  revisiting a config. 'rotating' = fresh seed per re-run → small visible
   *  noise that helps users feel MC variance. Default deterministic so the talk
   *  demo is stable. */
  seedMode: 'deterministic' | 'rotating';
  drakeOutput: DrakeMCOutput | null;
  setDrakeRange: (id: DrakeParamId, bound: DrakeBound) => void;
  setMethodOn: (id: DetectionMethodId, on: boolean) => void;
  setMethodCost: (id: DetectionMethodId, costM: number) => void;
  setMethodSensitivity: (id: DetectionMethodId, sensMin: number, sensMax: number) => void;
  setChannelOn: (id: ValueChannelId, on: boolean) => void;
  patchChannelA: (patch: Partial<ChannelsState['A']>) => void;
  patchChannelB: (patch: Partial<ChannelsState['B']>) => void;
  patchChannelC: (patch: Partial<ChannelsState['C']>) => void;
  patchChannelD: (patch: Partial<ChannelsState['D']>) => void;
  patchWorldview: (patch: Partial<WorldviewDials>) => void;
  patchOverrides: (patch: Partial<PriorOverrides>) => void;
  patchValueUncertainty: (patch: Partial<ValueUncertainty>) => void;
  setFlDistribution: (d: FlDistribution) => void;
  loadPreset: (id: PresetId) => void;
  setDrakeOutput: (out: DrakeMCOutput) => void;
  resetDrakeRanges: () => void;
  resetMethods: () => void;
  resetChannels: () => void;
  resetWorldview: () => void;
  resetAll: () => void;
  toggleAstroLock: () => void;
  setSeedMode: (m: 'deterministic' | 'rotating') => void;
}

export const useStore = create<AppState>()((set) => ({
  drakeRanges: defaultDrakeRanges(),
  methods: defaultDetectionState(),
  channels: defaultChannelState(),
  worldview: defaultWorldview(),
  overrides: {},
  valueUncertainty: defaultValueUncertainty(),
  flDistribution: DEFAULT_FL_DISTRIBUTION,
  activePreset: null,
  astroLocked: false,
  seedMode: 'deterministic',
  drakeOutput: null,
  setDrakeRange: (id, bound) => {
    // Setting f_l bounds means the user wants their own range rather than SDO's model.
    set((s) => ({
      drakeRanges: { ...s.drakeRanges, [id]: bound },
      ...(id === 'fl' ? { flDistribution: 'log-uniform' as const } : {}),
    }));
  },
  setMethodOn: (id, on) => {
    set((s) => ({
      methods: s.methods.map((m) => (m.id === id ? { ...m, on } : m)),
    }));
  },
  setMethodCost: (id, costM) => {
    set((s) => ({
      methods: s.methods.map((m) => (m.id === id ? { ...m, costM } : m)),
    }));
  },
  setMethodSensitivity: (id, sensMin, sensMax) => {
    set((s) => ({
      methods: s.methods.map((m) => (m.id === id ? { ...m, sensMin, sensMax } : m)),
    }));
  },
  setDrakeOutput: (out) => {
    set({ drakeOutput: out });
  },
  resetDrakeRanges: () => {
    set({ drakeRanges: defaultDrakeRanges(), flDistribution: DEFAULT_FL_DISTRIBUTION });
  },
  resetMethods: () => {
    set({ methods: defaultDetectionState() });
  },
  setChannelOn: (id, on) => {
    set((s) => ({ channels: { ...s.channels, [id]: { ...s.channels[id], on } } }));
  },
  patchChannelA: (patch) => {
    set((s) => ({ channels: { ...s.channels, A: { ...s.channels.A, ...patch } } }));
  },
  patchChannelB: (patch) => {
    set((s) => ({ channels: { ...s.channels, B: { ...s.channels.B, ...patch } } }));
  },
  patchChannelC: (patch) => {
    set((s) => ({ channels: { ...s.channels, C: { ...s.channels.C, ...patch } } }));
  },
  patchChannelD: (patch) => {
    set((s) => ({ channels: { ...s.channels, D: { ...s.channels.D, ...patch } } }));
  },
  resetChannels: () => {
    set({ channels: defaultChannelState() });
  },
  patchWorldview: (patch) => {
    set((s) => ({ worldview: { ...s.worldview, ...patch }, activePreset: null }));
  },
  loadPreset: (id) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    const applied = applyPreset(preset);
    set((s) => ({
      worldview: applied.worldview,
      channels: applied.channels,
      // Full-state demo presets also reset Drake / methods / overrides.
      drakeRanges: applied.drakeRanges ?? s.drakeRanges,
      methods: applied.methods ?? s.methods,
      overrides: applied.overrides ?? s.overrides,
      activePreset: id,
    }));
  },
  resetWorldview: () => {
    set({ worldview: defaultWorldview(), activePreset: null });
  },
  patchOverrides: (patch) => {
    set((s) => ({ overrides: { ...s.overrides, ...patch } }));
  },
  patchValueUncertainty: (patch) => {
    set((s) => ({ valueUncertainty: { ...s.valueUncertainty, ...patch } }));
  },
  setFlDistribution: (d) => {
    set({ flDistribution: d });
  },
  resetAll: () => {
    set({
      drakeRanges: defaultDrakeRanges(),
      methods: defaultDetectionState(),
      channels: defaultChannelState(),
      worldview: defaultWorldview(),
      overrides: {},
      valueUncertainty: defaultValueUncertainty(),
      flDistribution: DEFAULT_FL_DISTRIBUTION,
      activePreset: null,
      astroLocked: false,
    });
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  },
  toggleAstroLock: () => {
    set((s) => {
      if (!s.astroLocked) {
        return {
          astroLocked: true,
          drakeRanges: {
            ...s.drakeRanges,
            R: { ...defaultDrakeRanges().R },
            fp: { ...defaultDrakeRanges().fp },
            ne: { ...defaultDrakeRanges().ne },
          },
        };
      }
      return { astroLocked: false };
    });
  },
  setSeedMode: (m) => {
    set({ seedMode: m });
  },
}));

export function getSerializedState(): SerializedState {
  const s = useStore.getState();
  return {
    v: 4,
    drakeRanges: s.drakeRanges,
    methods: s.methods,
    channels: s.channels,
    worldview: s.worldview,
    overrides: s.overrides,
    valueUncertainty: s.valueUncertainty,
    flDistribution: s.flDistribution,
    astroLocked: s.astroLocked,
  };
}

export function applySerializedState(state: SerializedState): void {
  useStore.setState({
    drakeRanges: state.drakeRanges,
    methods: state.methods,
    channels: state.channels,
    worldview: state.worldview,
    overrides: state.overrides,
    valueUncertainty: state.valueUncertainty,
    flDistribution: state.flDistribution,
    astroLocked: state.astroLocked,
    activePreset: null,
  });
}
