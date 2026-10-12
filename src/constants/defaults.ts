// Drake parameter defaults from spec §5.1.

export interface DrakeBound {
  min: number;
  max: number;
}

export type DrakeParamId = 'R' | 'fp' | 'ne' | 'fl' | 'fi' | 'fc' | 'L' | 'fd';

export type DrakeDistribution = 'log-uniform' | 'linear-uniform';

/**
 * How f_l is sampled.
 * - 'log-uniform': between the user's f_l bounds (the tool's original default).
 * - 'sdo-lognormal': Sandberg, Drexler & Ord (2018) §3.1 — f_l = 1 − exp(−λVt), with
 *   log10(λVt) ~ Normal(0, 50): median one abiogenesis event per planet, ~50 orders of
 *   magnitude of spread. Ignores the f_l bounds. Reproduces SDO's P(N<1) ≈ 52%.
 */
export type FlDistribution = 'log-uniform' | 'sdo-lognormal';

/**
 * The site's default f_l distribution: SDO 2018's own model, so the tool's headline
 * P(no other civilisation) lines up with the paper it cites. `runDrakeMC` itself still
 * defaults to 'log-uniform' when no distribution is passed (tests rely on that).
 */
export const DEFAULT_FL_DISTRIBUTION: FlDistribution = 'sdo-lognormal';

/** SDO 2018 abiogenesis-rate parameters: log10(λVt) ~ Normal(mean, sd). */
export const SDO_FL_LOG10_RATE = { mean: 0, sd: 50 } as const;

export interface DrakeParamConfig {
  id: DrakeParamId;
  symbol: string;
  label: string;
  unit: string;
  distribution: DrakeDistribution;
  defaults: DrakeBound;
  /** "Hard floor" — warn if user pulls min below this. Astrophysical params only. */
  floor?: number;
  /** "Hard ceiling" — slider max can't exceed this. For fractions this is 1.0. */
  ceiling?: number;
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
    note: 'Milky Way star formation rate, in stars per year. Measured at ~0.7–1.9 solar masses/yr (Robitaille & Whitney 2010; Licquia & Newman 2015); most new stars are low-mass, so ~6–7 stars/yr.',
  },
  fp: {
    id: 'fp',
    symbol: 'fₚ',
    label: 'Fraction of stars with planets',
    unit: '',
    distribution: 'linear-uniform',
    defaults: { min: 0.4, max: 1.0 },
    floor: 0.4,
    ceiling: 1.0,
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
    note: 'Kepler: ~0.37–0.60 rocky habitable-zone planets per Sun-like star (Bryson et al. 2021); R* counts all stars, most of them M dwarfs.',
  },
  fl: {
    id: 'fl',
    symbol: 'fₗ',
    label: 'Fraction developing life',
    unit: '',
    distribution: 'log-uniform',
    defaults: { min: 1e-30, max: 1.0 },
    ceiling: 1.0,
    note: 'Genuine wide uncertainty. Log-uniform over 1e-30–1 is this tool’s choice, not SDO’s: SDO model f_l = 1 − exp(−λVt) with λVt log-normal (median 1, ~50 OOM spread).',
  },
  fi: {
    id: 'fi',
    symbol: 'fᵢ',
    label: 'Fraction with intelligence',
    unit: '',
    distribution: 'log-uniform',
    defaults: { min: 1e-3, max: 1.0 },
    ceiling: 1.0,
    note: 'Wide.',
  },
  fc: {
    id: 'fc',
    symbol: 'f_c',
    label: 'Fraction communicating',
    unit: '',
    distribution: 'log-uniform',
    defaults: { min: 1e-2, max: 1.0 },
    ceiling: 1.0,
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
    ceiling: 1.0,
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
