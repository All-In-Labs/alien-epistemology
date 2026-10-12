import { ChapterShell } from '../ChapterShell';
import { Histogram } from '../charts/Histogram';
import { ComparatorBars } from '../charts/ComparatorBars';
import { useStore } from '../../store';
import { PRESETS } from '../../presets/worldviews';
import { COMPARATORS } from '../../constants/comparators';

// Number-only formatter (no trailing × — caller decides whether to add one).
function fmtMul(v: number): string {
  if (!Number.isFinite(v)) return '—';
  if (v === 0) return '0';
  const abs = Math.abs(v);
  // Round near-zero magnitudes so we don't show "-8.3e-5" as a headline.
  // Prefix "≈" makes the rounding visible without breaking the "× GiveWell" suffix.
  if (abs < 1e-3) return v < 0 ? '≈ −0' : '≈ 0';
  if (abs < 1) return v.toFixed(3).replace(/\.?0+$/, '');
  if (abs < 100) return v.toFixed(2);
  if (abs < 1e6) return v.toFixed(0);
  return v.toExponential(1);
}

function fmtX(v: number): string {
  return `${fmtMul(v)}×`;
}

function fmtPct(p: number): string {
  if (!Number.isFinite(p)) return '—';
  return `${(p * 100).toFixed(0)}%`;
}

function supScript(n: number): string {
  const map: Record<string, string> = {
    '-': '⁻',
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
  };
  return String(n)
    .split('')
    .map((c) => map[c] ?? c)
    .join('');
}

export function Ch05Verdict() {
  const out = useStore((s) => s.drakeOutput);
  const activePreset = useStore((s) => s.activePreset);
  const presetName = activePreset
    ? (PRESETS.find((p) => p.id === activePreset)?.name ?? 'Custom')
    : 'Custom';

  const median = out?.medianMultiplier ?? 0;
  const medianGivenDetection = out?.medianMultiplierGivenDetection ?? 0;
  const gmean = out?.gmeanPositiveMultiplier ?? 0;
  const p5 = out?.p5Multiplier ?? 0;
  const p95 = out?.p95Multiplier ?? 0;
  const pAbove = out?.pAboveGiveWell ?? 0;
  const pNeg = out?.pNegativeEV ?? 0;
  const pAnyDetection = out?.pAnyDetection ?? 0;

  // Three regimes, each with its own headline:
  //   1. No detections at all — conditional median is undefined.
  //   2. Detections happen but every value is 0 (no channels enabled) — multipliers
  //      are exactly 0; "median given detection" is technically 0 but conveys nothing.
  //   3. Normal — show the unconditional median when it's non-zero, otherwise fall
  //      back to the conditional median (which doesn't collapse on the no-detection
  //      mass when P(N=0) > 0.5).
  const noDetections = pAnyDetection === 0;
  const allZeroValue = !noDetections && gmean === 0 && pNeg === 0;
  const hideHeadlineNumber = noDetections || allZeroValue;

  const headlineValue = Math.abs(median) < 1e-12 ? medianGivenDetection : median;
  const headlineLabel =
    Math.abs(median) < 1e-12 ? '× GiveWell · median given detection' : '× GiveWell · median';

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

  // Pick histogram x-range from the actual min/max of positive samples so all
  // bins are visible — no off-chart overflow. Previously we clipped to the
  // 2nd/98th percentiles to keep the chart compact, but that left long tails
  // hidden in edge markers; now we show the full range, accepting that under
  // wide-uncertainty presets the chart may span 20+ OoM.
  const xRange = (() => {
    if (positives.length === 0) return { logMin: -3, logMax: 3 };
    let minLog = Infinity;
    let maxLog = -Infinity;
    for (const v of positives) {
      if (v <= 0) continue;
      const lv = Math.log10(v);
      if (lv < minLog) minLog = lv;
      if (lv > maxLog) maxLog = lv;
    }
    if (!Number.isFinite(minLog) || !Number.isFinite(maxLog)) {
      return { logMin: -3, logMax: 3 };
    }
    let logMin = Math.floor(minLog);
    let logMax = Math.ceil(maxLog);
    // Always show the GiveWell line.
    logMin = Math.min(logMin, -1);
    logMax = Math.max(logMax, 1);
    return { logMin, logMax };
  })();
  const xTicks = (() => {
    const step = Math.ceil((xRange.logMax - xRange.logMin) / 6);
    const ticks: string[] = [];
    for (let l = xRange.logMin; l <= xRange.logMax; l += step) {
      if (l === 0) ticks.push('1');
      else ticks.push(`10${supScript(l)}`);
    }
    return ticks;
  })();

  return (
    <ChapterShell
      num="05"
      eyebrow="The verdict"
      title="A distribution, not a number."
      kicker="Cost-effectiveness expressed as a multiplier of an approximate GiveWell top-charity bar (~$100 per DALY averted; GiveWell itself uses its own units). Log x-axis. Vertical line marks the bar. The 95th percentile reflects rare scenarios where N is very large; the typical case is the median given detection."
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
              {hideHeadlineNumber ? (
                <span className="text-muted">n/a</span>
              ) : (
                <>
                  {fmtMul(headlineValue)}
                  <span className="font-mono text-lg text-muted ml-1.5">{headlineLabel}</span>
                </>
              )}
            </div>
            <div className="font-mono text-[11px] text-muted mt-1">
              {noDetections
                ? 'no detections in any sample — enable at least one method or raise the detection-floor override'
                : allZeroValue
                  ? 'every detection has zero value — enable at least one channel to see EV'
                  : gmean > 0 && median !== 0
                    ? `geom. mean of positive multipliers: ${fmtX(gmean)} · unconditional median: ${fmtX(median)}`
                    : gmean > 0
                      ? `geom. mean of positive multipliers: ${fmtX(gmean)}`
                      : median !== 0
                        ? `unconditional median: ${fmtX(median)}`
                        : 'no positive multipliers under this worldview — every detection is net negative'}
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
          logMin={xRange.logMin}
          logMax={xRange.logMax}
          nBins={Math.max(40, (xRange.logMax - xRange.logMin) * 6)}
          xTicks={xTicks}
        />
        {pNeg > 0 && (
          <div className="font-mono text-[11px] text-accent mt-3">
            ⚠ {fmtPct(pNeg)} of samples have negative EV under this worldview. Histogram shows
            the positive tail only.
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
              label: `This tool — ${presetName}${Math.abs(median) < 1e-12 ? ' (cond.)' : ''}`,
              lo: Math.max(Math.abs(median) < 1e-12 ? gmean / 100 : p5, 1e-9),
              mid: Math.max(headlineValue, 1e-9),
              hi: Math.max(Math.abs(median) < 1e-12 ? gmean * 100 : p95, 1e-9),
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
        <div
          className="mt-5 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 font-mono text-[11px] text-muted"
          style={{ borderTop: '1px dashed #d8d3c8' }}
        >
          <div className="col-span-2 tracking-chip uppercase mb-1">Sources</div>
          {COMPARATORS.map((c) => (
            <div key={c.label} className="flex justify-between gap-3">
              <span className="text-ink">{c.label}</span>
              <span className="text-right">
                {c.sourceUrl !== undefined ? (
                  <a
                    href={c.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-dotted underline-offset-2 hover:text-accent transition-colors"
                  >
                    {c.source}
                  </a>
                ) : (
                  c.source
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </ChapterShell>
  );
}
