import { create } from 'zustand';
import { defaultDrakeRanges, type DrakeRanges } from './model/drake';
import type { DrakeMCOutput } from './model/monteCarlo';
import type { DrakeBound, DrakeParamId } from './constants/defaults';

interface AppState {
  drakeRanges: DrakeRanges;
  drakeOutput: DrakeMCOutput | null;
  setDrakeRange: (id: DrakeParamId, bound: DrakeBound) => void;
  setDrakeOutput: (out: DrakeMCOutput) => void;
  resetDrakeRanges: () => void;
}

export const useStore = create<AppState>()((set) => ({
  drakeRanges: defaultDrakeRanges(),
  drakeOutput: null,
  setDrakeRange: (id, bound) => {
    set((s) => ({ drakeRanges: { ...s.drakeRanges, [id]: bound } }));
  },
  setDrakeOutput: (out) => {
    set({ drakeOutput: out });
  },
  resetDrakeRanges: () => {
    set({ drakeRanges: defaultDrakeRanges() });
  },
}));
