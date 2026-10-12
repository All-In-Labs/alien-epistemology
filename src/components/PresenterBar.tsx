import { useStore } from '../store';
import { headlineFor } from '../model/summary';

interface PresenterBarProps {
  chapterIdx: number;
  chapterTitles: string[];
}

function fmtPct(p: number): string {
  return `${(p * 100).toFixed(0)}%`;
}

function fmtX(v: number): string {
  if (!Number.isFinite(v)) return '—';
  if (v === 0) return '0×';
  // Round near-zero values that would otherwise render as ugly scientific notation.
  if (Math.abs(v) < 1e-3) return '≈0×';
  if (Math.abs(v) < 100) return `${v.toFixed(2)}×`;
  return `${v.toFixed(0)}×`;
}

export function PresenterBar({ chapterIdx, chapterTitles }: PresenterBarProps) {
  const out = useStore((s) => s.drakeOutput);
  const riskAversion = useStore((s) => s.worldview.riskAversion);
  const idx = String(chapterIdx).padStart(2, '0');
  const max = String(Math.max(0, chapterTitles.length - 1)).padStart(2, '0');
  const title = chapterTitles[chapterIdx] ?? '';
  // Same headline statistic as the Ch.5 verdict, chosen by the risk-aversion dial.
  const headline = out !== null ? headlineFor(out, riskAversion) : null;
  const headlineLabel = headline?.short ?? 'mean';

  return (
    <div
      className="sticky top-0 z-10 bg-ink text-paper px-7 py-2.5 flex justify-between items-center font-mono text-[11px] tracking-chip uppercase"
      style={{ position: 'sticky' }}
    >
      <span>Presenter mode · ←/→ chapter · P to exit</span>
      <span className="flex gap-5 items-baseline">
        <span>
          P( N≥1 ){' '}
          <span className="font-serif text-sm ml-1.5 normal-case tracking-normal">
            {out ? fmtPct(out.pNGteOne) : '—'}
          </span>
        </span>
        <span>
          P( EV&lt;0 ){' '}
          <span className="font-serif text-sm ml-1.5 text-accent normal-case tracking-normal">
            {out ? fmtPct(out.pNegativeEV) : '—'}
          </span>
        </span>
        <span>
          {headlineLabel}{' '}
          <span className="font-serif text-sm ml-1.5 normal-case tracking-normal">
            {headline === null ? '—' : headline.value === null ? 'undef.' : fmtX(headline.value)}
          </span>
        </span>
      </span>
      <span>
        {idx} / {max} · <span className="normal-case">{title}</span>
      </span>
    </div>
  );
}
