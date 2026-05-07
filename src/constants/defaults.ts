// Drake parameter defaults from spec §5.1.

export interface DrakeBound {
  min: number;
  max: number;
}

export type DrakeParamId = 'R' | 'fp' | 'ne' | 'fl' | 'fi' | 'fc' | 'L' | 'fd';

export type DrakeDistribution = 'log-uniform' | 'linear-uniform';

export interface DrakeParamConfig {
  id: DrakeParamId;
  symbol: string;
  label: string;
  unit: string;
  distribution: DrakeDistribution;
  defaults: DrakeBound;
  /** "Hard floor" — warn if user pulls min below this. Astrophysical params only. */
  floor?: number;
  /** Tooltip note from spec §5.1 table. */
  note: string;
}

export const DRAKE_DEFAULTS: Record<DrakeParamId, DrakeParamConfig> = {
  R: {
    id: 'R',
    symbol: 'R*',
    label: 'Star formation rate',
    unit: ' /yr',
    distribution: 'log-uniform',
    defaults: { min: 1.5, max: 10 },
    floor: 1.0,
    note: 'Milky Way star formation rate; modern observations centre ~1.5–3.',
  },
  fp: {
    id: 'fp',
    symbol: 'fₚ',
    label: 'Fraction of stars with planets',
    unit: '',
    distribution: 'linear-uniform',
    defaults: { min: 0.4, max: 1.0 },
    floor: 0.4,
    note: 'Kepler + microlensing strongly suggest most stars host planets.',
  },
  ne: {
    id: 'ne',
    symbol: 'nₑ',
    label: 'Habitable planets per system',
    unit: '',
    distribution: 'log-uniform',
    defaults: { min: 0.1, max: 1.0 },
    floor: 0.01,
    note: 'Kepler implies fₚ × nₑ ≈ 0.4 for sun-like stars.',
  },
  fl: {
    id: 'fl',
    symbol: 'fₗ',
    label: 'Fraction developing life',
    unit: '',
    distribution: 'log-uniform',
    defaults: { min: 1e-30, max: 1.0 },
    note: 'Genuine wide uncertainty; SDO’s headline range.',
  },
  fi: {
    id: 'fi',
    symbol: 'fᵢ',
    label: 'Fraction with intelligence',
    unit: '',
    distribution: 'log-uniform',
    defaults: { min: 1e-3, max: 1.0 },
    note: 'Wide.',
  },
  fc: {
    id: 'fc',
    symbol: 'f_c',
    label: 'Fraction communicating',
    unit: '',
    distribution: 'log-uniform',
    defaults: { min: 1e-2, max: 1.0 },
    note: 'Wide.',
  },
  L: {
    id: 'L',
    symbol: 'L',
    label: 'Civilisation lifetime',
    unit: ' yr',
    distribution: 'log-uniform',
    defaults: { min: 100, max: 1e10 },
    note: 'From short-lived to galactic-timescale.',
  },
  fd: {
    id: 'fd',
    symbol: 'f_d',
    label: 'Detection-readiness multiplier',
    unit: '',
    distribution: 'log-uniform',
    defaults: { min: 1e-3, max: 1.0 },
    note: 'Fraction of existing civs whose signals/biosignatures are detectable in principle by current human technology. N_detectable = N × f_d.',
  },
};

export const DRAKE_PARAM_ORDER: DrakeParamId[] = [
  'R',
  'fp',
  'ne',
  'fl',
  'fi',
  'fc',
  'L',
  'fd',
];
