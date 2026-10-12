// Ch.6 tornado: rerun the Monte Carlo with one input at a time pushed to each end of its
// plausible range, and report how far the mean cost-effectiveness multiplier moves.
// Pure, so it can run in a web worker (see workers/tornadoWorker.ts) and be tested.

import { runDrakeMC } from './monteCarlo';
import type { DrakeRanges } from './drake';
import type { DetectionMethodState } from './detection';
import type { ChannelsState, ValueUncertainty } from './value';
import type { WorldviewDials } from './worldview';
import type { PriorOverrides } from './monteCarlo';
import type { FlDistribution } from '../constants/defaults';

/** Everything a sweep may change. Sweeps mutate a structuredClone of it. */
export interface TornadoState {
  drakeRanges: DrakeRanges;
  methods: DetectionMethodState[];
  channels: ChannelsState;
  worldview: WorldviewDials;
  overrides: PriorOverrides;
  valueUncertainty: ValueUncertainty;
  flDistribution: FlDistribution;
}

export interface TornadoItem {
  symbol: string;
  label: string;
  /** Signed orders-of-magnitude shift from baseline at the sweep's low end. */
  low: number;
  /** Signed orders-of-magnitude shift at the high end. */
  high: number;
  lowLabel: string;
  highLabel: string;
}

interface SweepDef {
  symbol: string;
  label: string;
  /** Mutate a cloned state to the LOW endpoint. */
  setLow: (s: TornadoState) => void;
  setHigh: (s: TornadoState) => void;
}

export const SWEEP_N = 8000;

/**
 * A multiplier smaller than this (in × GiveWell) counts as "about nothing". Without a
 * floor, a sweep that drives the answer to ~0 (e.g. "life is rare") reports a meaningless
 * 30-orders-of-magnitude shift against a 10⁻³⁰ guard.
 */
export const NEGLIGIBLE_MULTIPLIER = 1e-6;

/** Mean multiplier (signed) for one state. The mean keeps sign and magnitude; the median
 *  collapses to ~0 when most worlds find nothing. */
function meanMultiplier(state: TornadoState, seed: string): number {
  const out = runDrakeMC({
    ranges: state.drakeRanges,
    methods: state.methods,
    channels: state.channels,
    worldview: state.worldview,
    overrides: state.overrides,
    valueUncertainty: state.valueUncertainty,
    flDistribution: state.flDistribution,
    n: SWEEP_N,
    seed,
  });
  if (out.totalCostM <= 0) return 0;
  return (out.evDALYs / (out.totalCostM * 1e6)) * 100;
}

export const SWEEPS: SweepDef[] = [
  {
    symbol: 'r_seti',
    label: 'SETI reach',
    // The two ends of the sourced reach range, each as a single point.
    setLow: (s) => {
      const m = s.methods.find((mm) => mm.id === 'seti');
      if (m) m.reachMax = m.reachMin;
    },
    setHigh: (s) => {
      const m = s.methods.find((mm) => mm.id === 'seti');
      if (m) m.reachMin = m.reachMax;
    },
  },
  {
    symbol: 's_seti',
    label: 'SETI sensitivity in reach',
    // The two ends of the user's range, each as a single point — the same treatment as
    // reach, so the two rows can be compared.
    setLow: (s) => {
      const m = s.methods.find((mm) => mm.id === 'seti');
      if (m) m.sensMax = m.sensMin;
    },
    setHigh: (s) => {
      const m = s.methods.find((mm) => mm.id === 'seti');
      if (m) m.sensMin = m.sensMax;
    },
  },
  {
    symbol: 'P(D)',
    label: 'Channel D — hostile probability',
    setLow: (s) => {
      s.channels.D.pHostile = 0;
    },
    setHigh: (s) => {
      s.channels.D.pHostile = 0.5;
    },
  },
  {
    symbol: 'α_L',
    label: 'Longtermism strength',
    setLow: (s) => {
      s.worldview.longtermismStrength = 0;
    },
    setHigh: (s) => {
      s.worldview.longtermismStrength = 1;
    },
  },
  {
    symbol: 'V_B',
    label: 'Cosmic-endowment value',
    setLow: (s) => {
      s.channels.B.vCosmicEndowment = 1e12;
    },
    setHigh: (s) => {
      s.channels.B.vCosmicEndowment = 1e20;
    },
  },
  {
    symbol: 'V_A',
    label: 'X-risk information value',
    setLow: (s) => {
      s.channels.A.vXriskInfo = 1e6;
    },
    setHigh: (s) => {
      s.channels.A.vXriskInfo = 1e14;
    },
  },
  {
    symbol: 'V_D',
    label: 'Hostile-contact disvalue',
    // "Low" = MORE negative (worst-case Dark Forest); "high" = less negative.
    setLow: (s) => {
      s.channels.D.vHostileDisvalue = -1e16;
    },
    setHigh: (s) => {
      s.channels.D.vHostileDisvalue = -1e8;
    },
  },
  {
    symbol: 'f_d',
    label: 'Detection-readiness multiplier',
    setLow: (s) => {
      s.drakeRanges.fd = { min: 1e-6, max: 1e-3 };
    },
    setHigh: (s) => {
      s.drakeRanges.fd = { min: 0.5, max: 1.0 };
    },
  },
  {
    symbol: 'L',
    label: 'Civilisation lifetime',
    setLow: (s) => {
      s.drakeRanges.L = { min: 100, max: 1000 };
    },
    setHigh: (s) => {
      s.drakeRanges.L = { min: 1e9, max: 1e10 };
    },
  },
  {
    symbol: 'ϕ',
    label: 'Filter-behind prior',
    setLow: (s) => {
      s.worldview.filterPriorBehind = 0;
    },
    setHigh: (s) => {
      s.worldview.filterPriorBehind = 1;
    },
  },
  {
    symbol: 'r',
    label: 'Pure time discount',
    setLow: (s) => {
      s.worldview.timeDiscount = 0;
    },
    setHigh: (s) => {
      s.worldview.timeDiscount = 0.05;
    },
  },
  {
    symbol: 'w_α',
    label: 'Alien moral weight',
    setLow: (s) => {
      s.worldview.alienMoralWeight = 0;
    },
    setHigh: (s) => {
      s.worldview.alienMoralWeight = 1;
    },
  },
  {
    symbol: 'fₗ',
    label: 'Fraction developing life (rare vs common)',
    // "Life is rare" (10⁻³⁰–10⁻¹⁵) vs "life is common" (0.5–1), both sampled log-uniform.
    // Fixed ranges rather than the user's bounds so the row means the same thing whether
    // fₗ is on SDO 2018's model (the default, which ignores the bounds) or a custom range.
    setLow: (s) => {
      s.flDistribution = 'log-uniform';
      s.drakeRanges.fl = { min: 1e-30, max: 1e-15 };
    },
    setHigh: (s) => {
      s.flDistribution = 'log-uniform';
      s.drakeRanges.fl = { min: 0.5, max: 1 };
    },
  },
  {
    symbol: 'R*',
    label: 'Star formation rate',
    // The ends of the sourced default range (~1–3 stars/yr).
    setLow: (s) => {
      s.drakeRanges.R = { min: 1, max: 1.2 };
    },
    setHigh: (s) => {
      s.drakeRanges.R = { min: 2.5, max: 3 };
    },
  },
];

/**
 * Signed log10 shift from reference to sweep. Positive = better than baseline. Values
 * below NEGLIGIBLE_MULTIPLIER count as zero. A sign flip adds 2 orders of magnitude so a
 * flip never looks like "no change".
 */
export function logShift(reference: number, sweep: number): number {
  if (!Number.isFinite(reference) || !Number.isFinite(sweep)) return 0;
  const refZero = Math.abs(reference) < NEGLIGIBLE_MULTIPLIER;
  const sweepZero = Math.abs(sweep) < NEGLIGIBLE_MULTIPLIER;
  if (refZero && sweepZero) return 0;
  const absRef = Math.max(Math.abs(reference), NEGLIGIBLE_MULTIPLIER);
  const absSweep = Math.max(Math.abs(sweep), NEGLIGIBLE_MULTIPLIER);
  const logRatio = Math.log10(absSweep / absRef);
  if (refZero || sweepZero || reference * sweep > 0) {
    // Same sign (or one side ≈ 0): growing a positive answer is better; growing a
    // negative one is worse.
    const sign = refZero ? Math.sign(sweep) : Math.sign(reference);
    return sign * logRatio;
  }
  return Math.sign(sweep) * (Math.abs(logRatio) + 2);
}

function fmtNum(n: number): string {
  if (n < 10) return n.toFixed(1);
  if (n < 1000) return Math.round(n).toLocaleString();
  if (n < 1e6) return `${(n / 1000).toFixed(1)}K`;
  if (n < 1e9) return `${(n / 1e6).toFixed(1)}M`;
  if (n < 1e12) return `${(n / 1e9).toFixed(1)}B`;
  return n.toExponential(1);
}

/**
 * Format an endpoint metric as a ratio-to-baseline label. Compact form so labels
 * don't overflow the chart area: the chart header already says "RATIO TO
 * BASELINE", so we drop that suffix. Sign-flips get a short "neg" marker.
 */
export function fmtRatio(sweep: number, baseline: number): string {
  if (!Number.isFinite(sweep) || !Number.isFinite(baseline)) return '—';
  if (Math.abs(baseline) < NEGLIGIBLE_MULTIPLIER) return '—';
  if (Math.abs(sweep) < NEGLIGIBLE_MULTIPLIER) return '≈ 0';
  const r = sweep / baseline;
  const flip = r < 0;
  const ar = Math.abs(r);
  // Widened "essentially baseline" band: ratios within (0.5, 2) — i.e. less
  // than 0.3 OoM either side of baseline — collapse to "≈ 1×" so the reader's
  // attention stays on the inputs that actually move the verdict.
  if (!flip && ar > 0.5 && ar < 2) return '≈ 1×';
  const body = ar >= 1 ? `×${fmtNum(ar)}` : `÷${fmtNum(1 / ar)}`;
  return flip ? `${body} neg` : body;
}

/**
 * Run every sweep. Low, high and baseline share one seed, and the model consumes the same
 * random draws whatever the inputs, so Monte Carlo noise cancels and only the input's
 * effect remains. Sorted by total spread, largest first.
 */
export function runTornado(state: TornadoState): TornadoItem[] {
  const seed = 'tornado-baseline';
  const baseline = meanMultiplier(state, seed);
  const items: TornadoItem[] = [];
  for (const sweep of SWEEPS) {
    const lowState = structuredClone(state);
    sweep.setLow(lowState);
    const lowV = meanMultiplier(lowState, seed);
    const highState = structuredClone(state);
    sweep.setHigh(highState);
    const highV = meanMultiplier(highState, seed);
    items.push({
      symbol: sweep.symbol,
      label: sweep.label,
      low: logShift(baseline, lowV),
      high: logShift(baseline, highV),
      lowLabel: fmtRatio(lowV, baseline),
      highLabel: fmtRatio(highV, baseline),
    });
  }
  items.sort((a, b) => Math.abs(b.high - b.low) - Math.abs(a.high - a.low));
  return items;
}
