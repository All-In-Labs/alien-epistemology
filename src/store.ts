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
  setMethodReach: (id: DetectionMethodId, reachMin: number, reachMax: number) => void;
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
  // Every edit below clears activePreset, so the verdict never calls an edited
  // configuration by a preset's name. (Only loadPreset sets it.)
  setDrakeRange: (id, bound) => {
    // Setting f_l bounds means the user wants their own range rather than SDO's model.
    set((s) => ({
      activePreset: null,
      drakeRanges: { ...s.drakeRanges, [id]: bound },
      ...(id === 'fl' ? { flDistribution: 'log-uniform' as const } : {}),
    }));
  },
  setMethodOn: (id, on) => {
    set((s) => ({
      activePreset: null,
      methods: s.methods.map((m) => (m.id === id ? { ...m, on } : m)),
    }));
  },
  setMethodCost: (id, costM) => {
    set((s) => ({
      activePreset: null,
      methods: s.methods.map((m) => (m.id === id ? { ...m, costM } : m)),
    }));
  },
  setMethodSensitivity: (id, sensMin, sensMax) => {
    set((s) => ({
      activePreset: null,
      methods: s.methods.map((m) => (m.id === id ? { ...m, sensMin, sensMax } : m)),
    }));
  },
  setMethodReach: (id, reachMin, reachMax) => {
    set((s) => ({
      activePreset: null,
      methods: s.methods.map((m) => (m.id === id ? { ...m, reachMin, reachMax } : m)),
    }));
  },
  setDrakeOutput: (out) => {
    set({ drakeOutput: out });
  },
  resetDrakeRanges: () => {
    set({ activePreset: null, drakeRanges: defaultDrakeRanges(), flDistribution: DEFAULT_FL_DISTRIBUTION });
  },
  resetMethods: () => {
    set({ activePreset: null, methods: defaultDetectionState() });
  },
  setChannelOn: (id, on) => {
    set((s) => ({
      activePreset: null, channels: { ...s.channels, [id]: { ...s.channels[id], on } } }));
  },
  patchChannelA: (patch) => {
    set((s) => ({
      activePreset: null, channels: { ...s.channels, A: { ...s.channels.A, ...patch } } }));
  },
  patchChannelB: (patch) => {
    set((s) => ({
      activePreset: null, channels: { ...s.channels, B: { ...s.channels.B, ...patch } } }));
  },
  patchChannelC: (patch) => {
    set((s) => ({
      activePreset: null, channels: { ...s.channels, C: { ...s.channels.C, ...patch } } }));
  },
  patchChannelD: (patch) => {
    set((s) => ({
      activePreset: null, channels: { ...s.channels, D: { ...s.channels.D, ...patch } } }));
  },
  resetChannels: () => {
    set({ activePreset: null, channels: defaultChannelState() });
  },
  patchWorldview: (patch) => {
    // The risk dial only picks which summary number to show, so it keeps the preset name.
    const dialOnly = Object.keys(patch).every((k) => k === 'riskAversion');
    set((s) => ({
      worldview: { ...s.worldview, ...patch },
      activePreset: dialOnly ? s.activePreset : null,
    }));
  },
  loadPreset: (id) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    const applied = applyPreset(preset);
    // A preset is a complete starting point: anything it doesn't set goes back to the
    // defaults, so the result never depends on what was loaded or edited before. (The
    // demo presets set Drake bounds, methods and overrides; these used to leak into
    // whichever preset came next.) Demo presets pin f_l, so they use their own bounds.
    set({
      worldview: applied.worldview,
      channels: applied.channels,
      drakeRanges: applied.drakeRanges ?? defaultDrakeRanges(),
      methods: applied.methods ?? defaultDetectionState(),
      overrides: applied.overrides ?? {},
      valueUncertainty: defaultValueUncertainty(),
      flDistribution: applied.drakeRanges ? 'log-uniform' : DEFAULT_FL_DISTRIBUTION,
      activePreset: id,
    });
  },
  resetWorldview: () => {
    set({ worldview: defaultWorldview(), activePreset: null });
  },
  patchOverrides: (patch) => {
    set((s) => ({
      activePreset: null, overrides: { ...s.overrides, ...patch } }));
  },
  patchValueUncertainty: (patch) => {
    set((s) => ({
      activePreset: null, valueUncertainty: { ...s.valueUncertainty, ...patch } }));
  },
  setFlDistribution: (d) => {
    set({ activePreset: null, flDistribution: d });
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
          activePreset: null,
          astroLocked: true,
          drakeRanges: {
            ...s.drakeRanges,
            R: { ...defaultDrakeRanges().R },
            fp: { ...defaultDrakeRanges().fp },
            ne: { ...defaultDrakeRanges().ne },
          },
        };
      }
      return { astroLocked: false, activePreset: null };
    });
  },
  setSeedMode: (m) => {
    set({ seedMode: m });
  },
}));

export function getSerializedState(): SerializedState {
  const s = useStore.getState();
  return {
    v: 5,
    drakeRanges: s.drakeRanges,
    methods: s.methods,
    channels: s.channels,
    worldview: s.worldview,
    overrides: s.overrides,
    valueUncertainty: s.valueUncertainty,
    flDistribution: s.flDistribution,
    astroLocked: s.astroLocked,
    ...(s.activePreset !== null ? { preset: s.activePreset } : {}),
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
    activePreset: state.preset ?? null,
  });
}

type ConfigSlices = Pick<
  AppState,
  | 'drakeRanges'
  | 'methods'
  | 'channels'
  | 'worldview'
  | 'overrides'
  | 'valueUncertainty'
  | 'flDistribution'
  | 'activePreset'
>;

/** Everything that affects the model, minus the risk dial (it only picks a summary number). */
function modelSlices(s: ConfigSlices): string {
  return JSON.stringify({
    drakeRanges: s.drakeRanges,
    methods: s.methods,
    channels: s.channels,
    worldview: { ...s.worldview, riskAversion: undefined },
    overrides: s.overrides,
    valueUncertainty: s.valueUncertainty,
    flDistribution: s.flDistribution,
  });
}

const DEFAULT_MODEL_SLICES = modelSlices({
  drakeRanges: defaultDrakeRanges(),
  methods: defaultDetectionState(),
  channels: defaultChannelState(),
  worldview: defaultWorldview(),
  overrides: {},
  valueUncertainty: defaultValueUncertainty(),
  flDistribution: DEFAULT_FL_DISTRIBUTION,
  activePreset: null,
});

/**
 * What the current configuration is, in words: the preset's name (until anything is
 * edited), "Default settings", or "Your settings".
 */
export function configurationLabel(s: ConfigSlices): string {
  if (s.activePreset !== null) {
    const name = PRESETS.find((p) => p.id === s.activePreset)?.name;
    if (name !== undefined) return `${name} preset`;
  }
  return modelSlices(s) === DEFAULT_MODEL_SLICES ? 'Default settings' : 'Your settings';
}
