import { ChapterShell } from '../ChapterShell';
import { Histogram } from '../charts/Histogram';
import { ComparatorBars } from '../charts/ComparatorBars';
import { useStore } from '../../store';
import { PRESETS } from '../../presets/worldviews';
import { COMPARATORS } from '../../constants/comparators';

function fmtX(v: number): string {
  if (!Number.isFinite(v)) return '—';
  if (v === 0) return '0×';
  const abs = Math.abs(v);
  if (abs < 0.001) return `${(v * 1000).toFixed(3)}×10⁻³`;
  if (abs < 1) return `${v.toFixed(3)}×`;
  if (abs < 100) return `${v.toFixed(2)}×`;
  return `${v.toFixed(0)}×`;
}

function fmtPct(p: number): string {
  if (!Number.isFinite(p)) return '—';
  return `${(p * 100).toFixed(0)}%`;
}

export function Ch05Verdict() {
  const out = useStore((s) => s.drakeOutput);
  const activePreset = useStore((s) => s.activePreset);
  const presetName = activePreset
    ? (PRESETS.find((p) => p.id === activePreset)?.name ?? 'Custom')
    : 'Custom';

  const median = out?.medianMultiplier ?? 0;
  const p5 = out?.p5Multiplier ?? 0;
  const p95 = out?.p95Multiplier ?? 0;
  const pAbove = out?.pAboveGiveWell ?? 0;
  const pNeg = out?.pNegativeEV ?? 0;

  // For the histogram, use only positive log-finite multipliers.
  const positives = (() => {
    if (!out) return new Float64Array(0);
    const buf = new Float64Array(out.multiplierSamples.length);
    let k = 0;
    for (const v of out.multiplierSamples) {
      if (v > 0 && Number.isFinite(v)) {
        buf[k++] = v;
      }
    }
    return buf.slice(0, k);
  })();

  return (
    <ChapterShell
      num="05"
      eyebrow="The verdict"
      title="A distribution, not a number."
      kicker="Cost-effectiveness expressed as a multiplier of the GiveWell top-charity bar (~$100 per DALY averted). Log x-axis. Vertical line marks the bar."
    >
      <div className="bg-paper border border-ink px-7 py-6">
        <div className="flex justify-between items-end mb-3.5">
          <div>
            <div className="font-mono text-[11px] text-muted tracking-chip uppercase">
              Cost-effectiveness · {presetName} preset
            </div>
            <div
              className="font-display text-5xl leading-none mt-1.5"
              style={{ fontWeight: 600, letterSpacing: '-0.01em' }}
            >
              {fmtX(median)}
              <span className="font-mono text-lg text-muted ml-1.5">× GiveWell · median</span>
            </div>
          </div>
          <div className="flex gap-6 font-mono text-[11.5px] text-muted">
            <div>
              <div className="uppercase tracking-[0.12em]">5th</div>
              <div className="font-serif text-lg text-ink">{fmtX(p5)}</div>
            </div>
            <div>
              <div className="uppercase tracking-[0.12em]">95th</div>
              <div className="font-serif text-lg text-ink">{fmtX(p95)}</div>
            </div>
            <div>
              <div className="uppercase tracking-[0.12em]">P( &gt; GW )</div>
              <div className="font-serif text-lg text-ink">{fmtPct(pAbove)}</div>
            </div>
            <div>
              <div className="uppercase tracking-[0.12em]">P( EV &lt; 0 )</div>
              <div className="font-serif text-lg text-accent">{fmtPct(pNeg)}</div>
            </div>
          </div>
        </div>
        <Histogram
          samples={positives}
          w={1120}
          h={300}
          refLine={0}
          refLabel="GiveWell bar (1×)"
          logMin={-6}
          logMax={9}
          nBins={75}
          xTicks={['10⁻⁶', '10⁻³', '1', '10³', '10⁶', '10⁹']}
        />
        {pNeg > 0 && (
          <div className="font-mono text-[11px] text-accent mt-3">
            ⚠ {fmtPct(pNeg)} of samples have negative EV (Dark Forest / hostile-contact channel
            dominates). Histogram shows the positive tail only.
          </div>
        )}
      </div>

      <div className="mt-7 bg-paper border border-ink px-7 py-6">
        <div className="font-mono text-[11px] text-muted tracking-chip uppercase mb-3">
          vs reference cause areas — ranges, not points
        </div>
        <ComparatorBars
          items={[
            {
              label: `This tool — ${presetName}`,
              lo: Math.max(p5, 1e-9),
              mid: Math.max(median, 1e-9),
              hi: Math.max(p95, 1e-9),
              main: true,
            },
            ...COMPARATORS.map((c) => ({
              label: c.label,
              lo: c.lo,
              mid: c.mid,
              hi: c.hi,
            })),
          ]}
        />
      </div>
    </ChapterShell>
  );
}
