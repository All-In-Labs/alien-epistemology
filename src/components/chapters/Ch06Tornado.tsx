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

function spread(it: TornadoItem): number {
  return Math.abs(it.high - it.low);
}

function worlds(n: number): string {
  const r = Math.round(n);
  return `${String(r)} world${r === 1 ? '' : 's'}`;
}

/** Captions computed from the sweep results, so they can't contradict the chart. */
function captionsFor(items: TornadoItem[]): { h: string; b: string }[] {
  const top = items[0];
  if (top === undefined || items.every((it) => it.high === 0 && it.low === 0)) {
    // Every row is flat: no programme is switched on, so nothing is spent or found.
    return [
      {
        h: 'Nothing moves the answer yet.',
        b: 'No detection programme is switched on (Ch.2), so there is nothing to spend and nothing to find. Switch one on to see which inputs matter.',
      },
    ];
  }
  const biggestOf = (pred: (it: TornadoItem) => boolean): TornadoItem | undefined =>
    items.filter(pred).sort((a, b) => spread(b) - spread(a))[0];
  const nature = biggestOf((it) => it.kind === 'nature');
  const judgement = biggestOf((it) => it.kind !== 'nature');
  const top5 = items.slice(0, 5);
  const unsourced = top5.filter((it) => !it.sourced).length;
  const cards = [
    {
      h: `${top.label.replace(/\s*\(.*\)$/, '')} moves the answer most.`,
      b: `Across its plausible range it moves ${worlds(spread(top))} of 100 between “better than GiveWell” and “serious harm” (net), at your current settings.`,
    },
  ];
  if (nature !== undefined && judgement !== undefined) {
    cards.push({
      h:
        spread(nature) < spread(judgement)
          ? 'Values matter more than astronomy.'
          : 'Astronomy matters as much as values.',
      b: `The most influential fact about nature, ${nature.label.toLowerCase()}, moves ${worlds(spread(nature))}. The most influential value or philosophical input, ${judgement.label.toLowerCase()}, moves ${worlds(spread(judgement))}. Facts about nature tend to make long shots bigger on both sides at once, so they shift the balance less than you might expect.`,
    });
  }
  cards.push({
    h: `${String(unsourced)} of the top 5 are judgement calls.`,
    b: 'They have no published source: they are the tool’s guesses or philosophical stances, labelled as such where they appear. Change them in Ch.3 and Ch.4 if yours differ.',
  });
  return cards;
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
      eyebrow="Sensitivity"
      title="What changes the answer most?"
      kicker="Each row pushes one input to the bottom, then the top, of its plausible range and counts how many of the 100 worlds move: worlds better than GiveWell minus worlds of serious harm. Green moves toward better, orange toward harm. Longest bars first."
    >
      <div className="bg-paper border border-ink px-4 sm:px-7 py-7">
        {items ? (
          <div
            className="transition-opacity"
            style={{ opacity: busy ? 0.45 : 1 }}
            aria-busy={busy}
          >
            <div className="hidden lg:block">
              <Tornado items={items} />
            </div>
            {/* Phones: the chart's label column alone is wider than the screen, so show
                the same ranking as a list. */}
            <ol className="lg:hidden flex flex-col gap-2.5">
              {items
                .filter((it) => Math.round(spread(it)) > 0)
                .map((it) => (
                  <li key={it.symbol} className="font-serif text-[15px] text-ink">
                    {it.label}
                    <span className="block font-mono text-[11.5px] text-muted">
                      low end <span className="text-ink">{it.lowLabel}</span> · high end{' '}
                      <span className="text-ink">{it.highLabel}</span> net worlds
                    </span>
                  </li>
                ))}
            </ol>
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
