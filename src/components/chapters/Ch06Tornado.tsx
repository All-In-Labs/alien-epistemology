// Ch.6 Tornado / sensitivity plot.
// The sweeps (src/model/tornado.ts) run in a web worker, debounced, so dragging a slider
// elsewhere on the page stays smooth. The chart shows the last finished result.

import { useEffect, useRef, useState } from 'react';
import { ChapterShell } from '../ChapterShell';
import { Tornado } from '../charts/Tornado';
import type { TornadoItem, TornadoState } from '../../model/tornado';
import type { TornadoResponse } from '../../workers/tornadoWorker';
import { useStore } from '../../store';

/** Wait this long after the last change before re-running the sweeps. */
const DEBOUNCE_MS = 400;

/** The chart clips each bar at ±6 orders of magnitude, so a row can show at most 12. */
const CHART_MAX_SPREAD = 12;

function fmtSpread(n: number): string {
  return n > CHART_MAX_SPREAD ? `more than ${String(CHART_MAX_SPREAD)}` : n.toFixed(1);
}

function spreadOf(items: TornadoItem[], symbol: string): string {
  const it = items.find((x) => x.symbol === symbol);
  return it ? fmtSpread(Math.abs(it.high - it.low)) : '—';
}

/** Captions computed from the sweep results, so they can't contradict the chart. */
function captionsFor(items: TornadoItem[]): { h: string; b: string }[] {
  const top = items[0];
  if (top?.high === 0 && top.low === 0) {
    // Every row is flat: no programme is switched on, so nothing is spent or found.
    return [
      {
        h: 'Nothing moves the answer yet.',
        b: 'No detection programme is switched on (Ch.2), so there is nothing to spend and nothing to find. Switch one on to see which inputs matter.',
      },
    ];
  }
  return [
    {
      h: top ? `${top.label.replace(/\s*\(.*\)$/, '')} moves the answer most.` : 'Computing…',
      b: top
        ? `Moving it from one end of its range to the other shifts the average by ${fmtSpread(Math.abs(top.high - top.low))} orders of magnitude at your current settings. The ranking changes as you move other dials, so this caption is computed, not written in advance.`
        : '',
    },
    {
      h: 'Philosophy is a lever too.',
      b: 'Longtermism strength, time discount and the size of the cosmic endowment are parameters of philosophy, not nature. Reasonable people set them differently.',
    },
    {
      h: 'What we can measure matters least.',
      b: `R*, the best-measured input, spans ${spreadOf(items, 'R*')} orders of magnitude; fₗ, the least-measured, spans ${spreadOf(items, 'fₗ')}. SETI’s reach spans ${spreadOf(items, 'r_seti')}, from published surveys; its sensitivity within reach spans ${spreadOf(items, 's_seti')}, and that range is still a placeholder guess, not a community estimate.`,
    },
  ];
}

export function Ch06Tornado() {
  const drakeRanges = useStore((s) => s.drakeRanges);
  const methods = useStore((s) => s.methods);
  const channels = useStore((s) => s.channels);
  const worldview = useStore((s) => s.worldview);
  const overrides = useStore((s) => s.overrides);
  const valueUncertainty = useStore((s) => s.valueUncertainty);
  const flDistribution = useStore((s) => s.flDistribution);

  const [items, setItems] = useState<TornadoItem[] | null>(null);
  const [busy, setBusy] = useState(true);
  const workerRef = useRef<Worker | null>(null);
  const latestId = useRef(0);

  useEffect(() => {
    const worker = new Worker(new URL('../../workers/tornadoWorker.ts', import.meta.url), {
      type: 'module',
    });
    worker.addEventListener('message', (e: MessageEvent<TornadoResponse>) => {
      // Ignore results for states the user has already moved past.
      if (e.data.id !== latestId.current) return;
      setItems(e.data.items);
      setBusy(false);
    });
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const state: TornadoState = {
      drakeRanges,
      methods,
      channels,
      worldview,
      overrides,
      valueUncertainty,
      flDistribution,
    };
    const timer = window.setTimeout(() => {
      setBusy(true);
      const id = ++latestId.current;
      workerRef.current?.postMessage({ id, state });
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [drakeRanges, methods, channels, worldview, overrides, valueUncertainty, flDistribution]);

  return (
    <ChapterShell
      num="06"
      eyebrow="What changes the answer most?"
      title="The tornado plot."
      kicker="Each row shows how the mean cost-effectiveness multiplier shifts (as a ratio to baseline) when one input is swept to the bottom or top of its plausible range. Dark bars on the left = that endpoint pushes the verdict below baseline (worse); green bars on the right = above baseline (better) — independent of whether it came from the low or high sweep, so inversely-correlated inputs (e.g. time discount) read consistently. Endpoints marked “neg” flip the sign of the verdict (each flip adds 2 to the bar length); “≈ 0” means the answer shrinks to almost nothing. Bars stop at ±6 orders of magnitude. Order is by total spread."
    >
      <div className="bg-paper border border-ink px-4 sm:px-7 py-7">
        {items ? (
          // On narrow viewports the SVG would compress to <30% scale, making
          // every label unreadable and visually overlapping. Let it keep its
          // designed minimum width and scroll horizontally instead.
          <div
            className="overflow-x-auto -mx-4 sm:-mx-7 px-4 sm:px-7 lg:mx-0 lg:px-0 transition-opacity"
            style={{ opacity: busy ? 0.45 : 1 }}
            aria-busy={busy}
          >
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
