// A compact, always-visible copy of the 100-world split, for readers working through the
// controls in Ch.1–4 while the verdict is thousands of pixels away. After each change it
// shows what moved ("+3 better"), so a reader can see the effect of a dial without
// remembering the previous numbers. Hidden whenever the short answer, the Ch.5 verdict or
// the Ch.6 sensitivity chart is on screen.

import { useEffect, useRef, useState } from 'react';
import { useStore, configurationLabel } from '../store';
import { outcomeSplit, type OutcomeSplit } from '../model/summary';
import { OUTCOME_COLORS } from '../constants/outcomeColors';

const DELTA_MS = 5000;

function useAnyVisible(ids: string[]): boolean {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const seen = new Map<string, boolean>();
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) seen.set(e.target.id, e.isIntersecting);
      setVisible([...seen.values()].some(Boolean));
    });
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    }
    return () => {
      obs.disconnect();
    };
  }, [ids]);
  return visible;
}

const WATCH = ['masthead', 'ch-05', 'ch-06'];

function deltaText(prev: OutcomeSplit, next: OutcomeSplit): string | null {
  const parts: string[] = [];
  const fmt = (d: number, word: string): void => {
    if (d !== 0) parts.push(`${d > 0 ? '+' : '−'}${String(Math.abs(d))} ${word}`);
  };
  fmt(next.better - prev.better, 'better');
  fmt(next.worse - prev.worse, 'harm');
  if (parts.length === 0 && next.less !== prev.less) fmt(next.less - prev.less, 'about the same');
  return parts.length > 0 ? parts.join(', ') : 'no change';
}

export function VerdictPill() {
  const out = useStore((s) => s.drakeOutput);
  const pending = useStore((s) => s.mcPending);
  const label = useStore(configurationLabel);
  const hidden = useAnyVisible(WATCH);

  const split =
    out === null || out.pAnyDetection === 0
      ? null
      : outcomeSplit(out.pAboveGiveWell, out.pHarmBeyondGiveWell);

  const prevRef = useRef<OutcomeSplit | null>(null);
  const [delta, setDelta] = useState<string | null>(null);
  useEffect(() => {
    if (split === null) return;
    const prev = prevRef.current;
    prevRef.current = split;
    if (prev === null) return;
    setDelta(deltaText(prev, split));
    const t = window.setTimeout(() => {
      setDelta(null);
    }, DELTA_MS);
    return () => {
      window.clearTimeout(t);
    };
    // Re-run only when a new Monte Carlo result arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [out]);

  if (split === null) return null;

  return (
    <button
      type="button"
      onClick={() => {
        document.getElementById('ch-05')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }}
      aria-label={`Verdict, ${label}: ${String(split.better)} of 100 worlds better than GiveWell, ${String(split.less)} about the same, ${String(split.worse)} serious harm. Go to the verdict.`}
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 max-w-[calc(100vw-32px)] flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 border border-ink font-mono text-[12px] text-ink shadow-md transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        background: delta !== null && !pending ? '#eef3e6' : '#faf6ec',
        opacity: hidden ? 0 : pending ? 0.6 : 1,
        pointerEvents: hidden ? 'none' : 'auto',
      }}
      tabIndex={hidden ? -1 : 0}
    >
      {(
        [
          ['better', split.better, 'better'],
          ['less', split.less, 'same'],
          ['worse', split.worse, 'harm'],
        ] as const
      ).map(([key, n, word]) => (
        <span key={key} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ background: OUTCOME_COLORS[key] }}
          />
          <span className="font-semibold">{n}</span> {word}
        </span>
      ))}
      <span className="text-muted">
        · {pending ? 'recomputing…' : (delta ?? label)}
      </span>
      <span aria-live="polite" className="sr-only">
        {!pending && delta !== null ? `Verdict changed: ${delta}` : ''}
      </span>
    </button>
  );
}
