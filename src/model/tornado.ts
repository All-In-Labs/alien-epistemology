// Ch.6 tornado: rerun the Monte Carlo with one input at a time pushed to each end of its
// plausible range, and report how many of the 100 worlds move. The metric is the headline
// itself: worlds better than GiveWell minus worlds of serious harm. (It used to be the
// mean multiplier, but the mean is a difference of two heavy tails and at the defaults it
// is within sampling noise of zero, so ratios to it were meaningless.)
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

/** What kind of input a sweep varies: a fact about nature, a value-model guess, or a philosophical stance. */
export type SweepKind = 'nature' | 'value' | 'philosophy';

export interface TornadoItem {
  symbol: string;
  label: string;
  kind: SweepKind;
  /** True when the swept range comes from published sources rather than judgement. */
  sourced: boolean;
  /** Change in net worlds (better − serious harm, out of 100) at the sweep's low end. */
  low: number;
  /** Change in net worlds at the high end. */
  high: number;
  lowLabel: string;
  highLabel: string;
}

interface SweepDef {
  symbol: string;
  label: string;
  kind: SweepKind;
  sourced: boolean;
  /** Mutate a cloned state to the LOW endpoint. */
  setLow: (s: TornadoState) => void;
  setHigh: (s: TornadoState) => void;
}

export const SWEEP_N = 10_000;

/** Net worlds (better − serious harm, out of 100) for one state, unrounded. */
function netWorlds(state: TornadoState, seed: string): number {
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
  return (out.pAboveGiveWell - out.pHarmBeyondGiveWell) * 100;
}

export const SWEEPS: SweepDef[] = [
  {
    symbol: 'Δ_B',
    kind: 'value',
    sourced: false,
    label: 'Is a detection good news? (channel B net shift)',
    // ±0.1 around the default net shift of +0.05: the expected evidence that interstellar
    // technology works, minus the evidence that the cosmos is already claimed.
    setLow: (s) => {
      s.channels.B.lightconeClaimShift -= 0.1;
    },
    setHigh: (s) => {
      s.channels.B.techViabilityShift += 0.1;
    },
  },
  {
    symbol: 'σ_B',
    kind: 'value',
    sourced: false,
    label: 'Spread of that shift between worlds',
    // Not 0: a zero spread skips random draws, which would break the shared-draws
    // comparison with the baseline.
    setLow: (s) => {
      s.valueUncertainty.shiftPM = 0.01;
    },
    setHigh: (s) => {
      s.valueUncertainty.shiftPM = 0.2;
    },
  },
  {
    symbol: 'h',
    kind: 'philosophy',
    sourced: false,
    label: 'Hingeyness (do our actions steer the future?)',
    setLow: (s) => {
      s.worldview.hingeyness = 0.01;
    },
    setHigh: (s) => {
      s.worldview.hingeyness = 1;
    },
  },
  {
    symbol: 'r_seti',
    kind: 'nature',
    sourced: true,
    label: 'How much of the galaxy SETI covers',
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
    kind: 'nature',
    sourced: false,
    label: 'How sensitive SETI is within that',
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
    kind: 'value',
    sourced: false,
    label: 'Chance a detection draws hostile attention',
    setLow: (s) => {
      s.channels.D.pHostile = 0;
    },
    setHigh: (s) => {
      s.channels.D.pHostile = 0.5;
    },
  },
  {
    symbol: 'α_L',
    kind: 'philosophy',
    sourced: false,
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
    kind: 'value',
    sourced: false,
    label: 'Size of the cosmic future at stake',
    setLow: (s) => {
      s.channels.B.vCosmicEndowment = 1e12;
    },
    setHigh: (s) => {
      s.channels.B.vCosmicEndowment = 1e20;
    },
  },
  {
    symbol: 'V_A',
    kind: 'value',
    sourced: false,
    label: 'Value of news about the Great Filter',
    setLow: (s) => {
      s.channels.A.vXriskInfo = 1e6;
    },
    setHigh: (s) => {
      s.channels.A.vXriskInfo = 1e14;
    },
  },
  {
    symbol: 'V_D',
    kind: 'value',
    sourced: false,
    label: 'Harm hostile contact does to people now',
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
    kind: 'nature',
    sourced: false,
    label: 'Share of civilisations we could detect',
    setLow: (s) => {
      s.drakeRanges.fd = { min: 1e-6, max: 1e-3 };
    },
    setHigh: (s) => {
      s.drakeRanges.fd = { min: 0.5, max: 1.0 };
    },
  },
  {
    symbol: 'L',
    kind: 'nature',
    sourced: true,
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
    kind: 'philosophy',
    sourced: false,
    label: 'Belief the Great Filter is behind us',
    setLow: (s) => {
      s.worldview.filterPriorBehind = 0;
    },
    setHigh: (s) => {
      s.worldview.filterPriorBehind = 1;
    },
  },
  {
    symbol: 'r',
    kind: 'philosophy',
    sourced: false,
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
    kind: 'philosophy',
    sourced: false,
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
    kind: 'nature',
    sourced: true,
    label: 'How often life arises (rare vs common)',
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
    kind: 'nature',
    sourced: true,
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

/** A change in net worlds as a short label, e.g. "+12", "−3", "±0". */
export function fmtNet(d: number): string {
  const r = Math.round(d);
  if (r === 0) return '±0';
  return `${r > 0 ? '+' : '−'}${String(Math.abs(r))}`;
}

/**
 * Run every sweep. Low, high and baseline share one seed, and the model consumes the same
 * random draws whatever the inputs, so Monte Carlo noise cancels and only the input's
 * effect remains. Sorted by total spread, largest first.
 */
export function runTornado(state: TornadoState): TornadoItem[] {
  const seed = 'tornado-baseline';
  const baseline = netWorlds(state, seed);
  const items: TornadoItem[] = [];
  for (const sweep of SWEEPS) {
    const lowState = structuredClone(state);
    sweep.setLow(lowState);
    const low = netWorlds(lowState, seed) - baseline;
    const highState = structuredClone(state);
    sweep.setHigh(highState);
    const high = netWorlds(highState, seed) - baseline;
    items.push({
      symbol: sweep.symbol,
      label: sweep.label,
      kind: sweep.kind,
      sourced: sweep.sourced,
      low,
      high,
      lowLabel: fmtNet(low),
      highLabel: fmtNet(high),
    });
  }
  items.sort((a, b) => Math.abs(b.high - b.low) - Math.abs(a.high - a.low));
  return items;
}
