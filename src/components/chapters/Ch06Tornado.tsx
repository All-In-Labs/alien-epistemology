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
    n: SWEEP_N,
    seed,
  });
  // Use the geometric mean of positive multipliers as the aggregate. The unconditional
  // median collapses to 0 whenever P(N=0) > 0.5, which is most of the parameter space —
  // making the tornado uninformative if we used it. Geometric mean is the natural
  // log-axis aggregate and stays meaningful as long as ≥1 sample produced detection.
  return out.gmeanPositiveMultiplier;
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

function logShift(reference: number, sweep: number): number {
  if (reference <= 0 || sweep <= 0) return 0;
  return Math.log10(sweep / reference);
}

function fmtMultiplier(v: number): string {
  if (!Number.isFinite(v)) return '—';
  if (v === 0) return '0×';
  if (v < 0.001) return v.toExponential(1);
  if (v < 100) return `${v.toFixed(2)}×`;
  return `${v.toFixed(0)}×`;
}

export function Ch06Tornado() {
  const drakeRanges = useStore((s) => s.drakeRanges);
  const methods = useStore((s) => s.methods);
  const channels = useStore((s) => s.channels);
  const worldview = useStore((s) => s.worldview);
  const cosmology = useStore((s) => s.cosmology);
  const grabby = useStore((s) => s.grabby);
  const overrides = useStore((s) => s.overrides);

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
      const lowState = captureState();
      sweep.setLow(lowState);
      const lowMed = runSweep(lowState, `tornado-${sweep.symbol}-low`);
      const highState = captureState();
      sweep.setHigh(highState);
      const highMed = runSweep(highState, `tornado-${sweep.symbol}-high`);
      out.push({
        symbol: sweep.symbol,
        label: sweep.label,
        low: logShift(baseline, lowMed),
        high: logShift(baseline, highMed),
        lowLabel: fmtMultiplier(lowMed),
        highLabel: fmtMultiplier(highMed),
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
  }, [drakeRanges, methods, channels, worldview, cosmology, grabby, overrides]);

  return (
    <ChapterShell
      num="06"
      eyebrow="What changes the answer most?"
      title="The tornado plot."
      kicker="Each bar shows how the geometric mean of positive cost-effectiveness multipliers shifts when a single input is moved to the bottom or top of its plausible range, with all others held at the active configuration. (Geom. mean is used because the unconditional median collapses to 0 whenever P(N=0) > 0.5.) Order is by total spread."
    >
      <div className="bg-paper border border-ink px-7 py-7">
        {items ? (
          <Tornado items={items} />
        ) : (
          <div className="font-mono text-[11px] text-muted py-12 text-center">
            Computing sensitivity sweeps…
          </div>
        )}
        <div
          className="grid grid-cols-3 gap-6 mt-6 pt-5"
          style={{ borderTop: '1px dashed #d8d3c8' }}
        >
          {[
            {
              h: 'Sensitivities dominate.',
              b: 'The single biggest lever is per-method detection sensitivity — five orders of magnitude of community disagreement. This is where domain expertise belongs.',
            },
            {
              h: 'Worldview is second.',
              b: 'Longtermism strength and channel-D hostile probability are not parameters of nature; they are parameters of philosophy. Reasonable people pick differently.',
            },
            {
              h: 'Astrophysics barely matters.',
              b: 'R*, fₚ and nₑ — the parameters we know best — barely move the answer. Locking them does not collapse the distribution. The SDO finding shows up here too.',
            },
          ].map((card, i) => (
            <div key={i}>
              <div
                className="font-display text-lg text-ink"
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
