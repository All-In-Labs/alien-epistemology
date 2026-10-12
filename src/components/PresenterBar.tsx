import { useStore } from '../store';
import { summaryFor, outcomeSplit, plainNumber } from '../model/summary';

interface PresenterBarProps {
  chapterIdx: number;
  chapterTitles: string[];
}

function fmtPct(p: number): string {
  return `${(p * 100).toFixed(0)}%`;
}

export function PresenterBar({ chapterIdx, chapterTitles }: PresenterBarProps) {
  const out = useStore((s) => s.drakeOutput);
  const riskAversion = useStore((s) => s.worldview.riskAversion);
  const idx = String(chapterIdx).padStart(2, '0');
  const max = String(Math.max(0, chapterTitles.length - 1)).padStart(2, '0');
  const title = chapterTitles[chapterIdx] ?? '';
  // Same headline as the Ch.5 verdict: the 100-world split, plus the dial's summary.
  const split = out !== null ? outcomeSplit(out.pAboveGiveWell, out.pHarmBeyondGiveWell) : null;
  const summary = out !== null ? summaryFor(out, riskAversion) : null;

  return (
    <div
      className="sticky top-0 z-10 bg-ink text-paper px-4 sm:px-7 py-2.5 flex flex-wrap justify-between items-center gap-x-5 gap-y-1 font-mono text-[11px] tracking-chip uppercase"
      style={{ position: 'sticky' }}
    >
      <span className="hidden lg:inline">Presenter mode · ←/→ chapter · P to exit</span>
      <span className="flex flex-wrap gap-x-5 gap-y-1 items-baseline">
        <span>
          P( N=0 ){' '}
          <span className="font-serif text-sm ml-1.5 normal-case tracking-normal">
            {out ? fmtPct(out.pNZero) : '—'}
          </span>
        </span>
        <span>
          P( N≥1 ){' '}
          <span className="font-serif text-sm ml-1.5 normal-case tracking-normal">
            {out ? fmtPct(out.pNGteOne) : '—'}
          </span>
        </span>
        <span>
          of 100 worlds{' '}
          <span className="font-serif text-sm ml-1.5 normal-case tracking-normal">
            {split === null
              ? '—'
              : `${split.betterUnderOne ? '<1' : String(split.better)} beat GiveWell · ${split.worseUnderOne ? '<1' : String(split.worse)} serious harm`}
          </span>
        </span>
        <span>
          {summary?.short ?? 'average'}{' '}
          <span className="font-serif text-sm ml-1.5 normal-case tracking-normal">
            {summary === null ? '—' : `${plainNumber(summary.value)}×`}
          </span>
        </span>
      </span>
      <span>
        {idx} / {max} · <span className="normal-case">{title}</span>
      </span>
    </div>
  );
}
