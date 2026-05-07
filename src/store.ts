import { create } from 'zustand';
import { defaultDrakeRanges, type DrakeRanges } from './model/drake';
import {
  defaultDetectionState,
  type DetectionMethodState,
} from './model/detection';
import { defaultChannelState, type ChannelsState } from './model/value';
import { defaultWorldview, type WorldviewDials } from './model/worldview';
import { applyPreset, PRESETS, type PresetId } from './presets/worldviews';
import type { DrakeMCOutput } from './model/monteCarlo';
import type { DrakeBound, DrakeParamId } from './constants/defaults';
import type { DetectionMethodId } from './constants/detectionDefaults';
import type { ValueChannelId } from './constants/valueDefaults';

interface AppState {
  drakeRanges: DrakeRanges;
  methods: DetectionMethodState[];
  channels: ChannelsState;
  worldview: WorldviewDials;
  activePreset: PresetId | null;
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
  loadPreset: (id: PresetId) => void;
  setDrakeOutput: (out: DrakeMCOutput) => void;
  resetDrakeRanges: () => void;
  resetMethods: () => void;
  resetChannels: () => void;
  resetWorldview: () => void;
}

export const useStore = create<AppState>()((set) => ({
  drakeRanges: defaultDrakeRanges(),
  methods: defaultDetectionState(),
  channels: defaultChannelState(),
  worldview: defaultWorldview(),
  activePreset: null,
  drakeOutput: null,
  setDrakeRange: (id, bound) => {
    set((s) => ({ drakeRanges: { ...s.drakeRanges, [id]: bound } }));
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
    set({ drakeRanges: defaultDrakeRanges() });
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
    const { worldview, channels } = applyPreset(preset);
    set({ worldview, channels, activePreset: id });
  },
  resetWorldview: () => {
    set({ worldview: defaultWorldview(), activePreset: null });
  },
}));
