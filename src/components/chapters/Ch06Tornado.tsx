// Ch.6 Tornado / sensitivity plot.
// Runs the Monte Carlo at each parameter's bounds (others held at active config) and
// reports the log10 OoM shift in median multiplier vs. baseline.

import { useEffect, useRef, useState } from 'react';
import { ChapterShell } from '../ChapterShell';
import { Tornado, type TornadoItem } from '../charts/Tornado';
import { runDrakeMC } from '../../model/monteCarlo';
import { useStore } from '../../store';

const SWEEP_N = 8000;

interface SweepDef {
  symbol: string;
  label: string;
  /** Mutate a serialised state to the LOW endpoint. */
  setLow: (s: ReturnType<typeof captureState>) => void;
  setHigh: (s: ReturnType<typeof captureState>) => void;
}

function captureState() {
  const s = useStore.getState();
  return {
    drakeRanges: structuredClone(s.drakeRanges),
    methods: structuredClone(s.methods),
    channels: structuredClone(s.channels),
    worldview: structuredClone(s.worldview),
    cosmology: s.cosmology,
    grabby: structuredClone(s.grabby),
    overrides: structuredClone(s.overrides),
    valueUncertainty: structuredClone(s.valueUncertainty),
    flDistribution: s.flDistribution,
  };
}

function runSweep(state: ReturnType<typeof captureState>, seed: string): number {
  const out = runDrakeMC({
    ranges: state.drakeRanges,
    methods: state.methods,
    channels: state.channels,
    worldview: state.worldview,
    cosmology: state.cosmology,
    grabby: state.grabby,
    overrides: state.overrides,
    valueUncertainty: state.valueUncertainty,
    flDistribution: state.flDistribution,
    n: SWEEP_N,
    seed,
  });
  // Use the mean multiplier (signed). Earlier we used gmeanPositiveMultiplier, which
  // filtered out negative samples — making the tornado blind to V_D / Channel-D-style
  // shifts that flip the verdict negative. Mean captures sign and magnitude honestly.
  // (Median collapses to 0 when most samples are zero, so that's not an option.)
  if (out.totalCostM <= 0) return 0;
  return (out.evDALYs / (out.totalCostM * 1e6)) * 100;
}

const SWEEPS: SweepDef[] = [
  {
    symbol: 's_seti',
    label: 'SETI sensitivity',
    setLow: (s) => {
      const m = s.methods.find((mm) => mm.id === 'seti');
      if (m) {
        m.sensMin = m.sensMin / 100;
        m.sensMax = m.sensMin;
      }
    },
    setHigh: (s) => {
      const m = s.methods.find((mm) => mm.id === 'seti');
      if (m) {
        m.sensMax = m.sensMax * 100;
        m.sensMin = m.sensMax;
      }
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
    setLow: (s) => {
      s.drakeRanges.R = { min: 1.0, max: 1.5 };
    },
    setHigh: (s) => {
      s.drakeRanges.R = { min: 8, max: 20 };
    },
  },
];

function spreadOf(items: TornadoItem[], symbol: string): string {
  const it = items.find((x) => x.symbol === symbol);
  return it ? Math.abs(it.high - it.low).toFixed(1) : '—';
}

/** Captions computed from the sweep results, so they can't contradict the chart. */
function captionsFor(items: TornadoItem[]): { h: string; b: string }[] {
  const top = items[0];
  return [
    {
      h: top ? `${top.label.replace(/\s*\(.*\)$/, '')} moves the answer most.` : 'Computing…',
      b: top
        ? `At your current settings its row spans about ${Math.abs(top.high - top.low).toFixed(1)} orders of magnitude on the chart. The ranking changes as you move other dials, so this caption is computed from the chart, not written in advance.`
        : '',
    },
    {
      h: 'Philosophy is a lever too.',
      b: 'Longtermism strength, time discount and the size of the cosmic endowment are parameters of philosophy, not nature. Reasonable people set them differently.',
    },
    {
      h: 'What we can measure matters least.',
      b: `R*, the best-measured input, spans ${spreadOf(items, 'R*')} orders of magnitude; fₗ, the least-measured, spans ${spreadOf(items, 'fₗ')}. SETI sensitivity spans ${spreadOf(items, 's_seti')} — and its default range is a placeholder guess, not a community estimate.`,
    },
  ];
}

function logShift(reference: number, sweep: number): number {
  // Sign-aware log10 OoM shift. Bar position represents the direction and magnitude
  // of the metric's movement, even when the metric flips sign (e.g. V_D extreme low
  // pushes mean multiplier from + to −).
  if (!Number.isFinite(reference) || !Number.isFinite(sweep)) return 0;
  const absRef = Math.max(Math.abs(reference), 1e-30);
  const absSweep = Math.max(Math.abs(sweep), 1e-30);
  const logRatio = Math.log10(absSweep / absRef);
  const sameSign = reference === 0 || sweep === 0 || reference * sweep > 0;
  if (sameSign) {
    // Direction follows the sweep's sign × the sign of the magnitude change.
    // Reference > 0 case: sweep > ref ⇒ shift right; sweep < ref ⇒ shift left.
    // Reference < 0 case: more-negative sweep is "worse" ⇒ shift left.
    return Math.sign(reference || sweep || 1) * logRatio;
  }
  // Sign flip — represents a regime change. Bar goes in sweep's direction with
  // magnitude reflecting both the OoM change and the flip itself (+2 OoM "penalty"
  // so visible flips don't collapse to 0 when |sweep| ≈ |reference|).
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
function fmtRatio(sweep: number, baseline: number): string {
  if (!Number.isFinite(sweep) || !Number.isFinite(baseline)) return '—';
  if (baseline === 0) return '—';
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

export function Ch06Tornado() {
  const drakeRanges = useStore((s) => s.drakeRanges);
  const methods = useStore((s) => s.methods);
  const channels = useStore((s) => s.channels);
  const worldview = useStore((s) => s.worldview);
  const cosmology = useStore((s) => s.cosmology);
  const grabby = useStore((s) => s.grabby);
  const overrides = useStore((s) => s.overrides);
  const valueUncertainty = useStore((s) => s.valueUncertainty);
  const flDistribution = useStore((s) => s.flDistribution);

  const [items, setItems] = useState<TornadoItem[] | null>(null);
  const generationRef = useRef(0);

  useEffect(() => {
    // Each input change bumps the generation token. In-flight sweeps check it
    // before scheduling the next chunk; if a newer change has happened, they
    // bail out so we don't waste work or stomp on fresher results.
    const myGeneration = ++generationRef.current;
    const baselineState = captureState();
    const baseline = runSweep(baselineState, 'tornado-baseline');
    const out: TornadoItem[] = [];

    let i = 0;
    const isStale = (): boolean => myGeneration !== generationRef.current;
    const runOne = (): void => {
      if (isStale()) return;
      if (i >= SWEEPS.length) {
        out.sort((a, b) => Math.abs(b.high - b.low) - Math.abs(a.high - a.low));
        if (!isStale()) setItems(out);
        return;
      }
      const sweep = SWEEPS[i];
      i++;
      if (!sweep) {
        runOne();
        return;
      }
      // Use the SAME seed for low, high, and baseline so MC noise cancels and
      // only the parameter effect remains. Otherwise small-effect endpoints can
      // come out the "wrong side" of baseline simply because their independent
      // MC run rolled a different sample path — e.g. V_D high should be
      // slightly *above* baseline (less hostile cost) but with independent
      // seeds it can land below by pure chance.
      const lowState = captureState();
      sweep.setLow(lowState);
      const lowMed = runSweep(lowState, 'tornado-baseline');
      const highState = captureState();
      sweep.setHigh(highState);
      const highMed = runSweep(highState, 'tornado-baseline');
      out.push({
        symbol: sweep.symbol,
        label: sweep.label,
        low: logShift(baseline, lowMed),
        high: logShift(baseline, highMed),
        lowLabel: fmtRatio(lowMed, baseline),
        highLabel: fmtRatio(highMed, baseline),
      });
      // Yield to the main thread between sweeps so input/scroll/repaint stay
      // responsive even though MC is running synchronously.
      window.setTimeout(runOne, 0);
    };
    // Yield once before the very first sweep so the React commit can flush.
    window.setTimeout(runOne, 0);

    const myGen = myGeneration;
    return () => {
      // Mark this run stale so any pending callbacks bail. Reading `current`
      // here is intentional — we want to know if this run is still the latest,
      // and if so, advance the token. The exhaustive-deps rule's concern about
      // stale refs in cleanup doesn't apply: we use the captured `myGen` to
      // gate the increment, not to read DOM state.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (generationRef.current === myGen) generationRef.current++;
    };
  }, [
    drakeRanges,
    methods,
    channels,
    worldview,
    cosmology,
    grabby,
    overrides,
    valueUncertainty,
    flDistribution,
  ]);

  return (
    <ChapterShell
      num="06"
      eyebrow="What changes the answer most?"
      title="The tornado plot."
      kicker="Each row shows how the mean cost-effectiveness multiplier shifts (as a ratio to baseline) when one input is swept to the bottom or top of its plausible range. Dark bars on the left = that endpoint pushes the verdict below baseline (worse); green bars on the right = above baseline (better) — independent of whether it came from the low or high sweep, so inversely-correlated inputs (e.g. time discount) read consistently. Endpoints marked “neg” flip the sign of the verdict (each flip adds 2 to the bar length). Order is by total spread."
    >
      <div className="bg-paper border border-ink px-4 sm:px-7 py-7">
        {items ? (
          // On narrow viewports the SVG would compress to <30% scale, making
          // every label unreadable and visually overlapping. Let it keep its
          // designed minimum width and scroll horizontally instead.
          <div className="overflow-x-auto -mx-4 sm:-mx-7 px-4 sm:px-7 lg:mx-0 lg:px-0">
            <div className="min-w-[900px] lg:min-w-0">
              <Tornado items={items} />
            </div>
          </div>
        ) : (
          <div className="font-mono text-[11px] text-muted py-12 text-center">
            Computing sensitivity sweeps…
          </div>
        )}
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6 pt-5"
          style={{ borderTop: '1px dashed #d8d3c8' }}
        >
          {(items ? captionsFor(items) : []).map((card, i) => (
            <div key={i}>
              <div
                className="font-subhead text-lg text-ink"
                style={{ fontWeight: 600, letterSpacing: '-0.01em' }}
              >
                {card.h}
              </div>
              <p className="font-serif text-[13.5px] leading-[1.55] text-muted mt-1.5">
                {card.b}
              </p>
            </div>
          ))}
        </div>
      </div>
    </ChapterShell>
  );
}
