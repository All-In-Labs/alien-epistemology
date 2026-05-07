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
          logMin={-6}
          logMax={9}
          nBins={75}
          xTicks={['10⁻⁶', '10⁻³', '1', '10³', '10⁶', '10⁹']}
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
        {/* Use the conditional-on-detection stats for the user's row when the
            unconditional median collapses to 0; otherwise the plotted whisker is
            squashed against the y-axis and the label appears struck-through against
            the GiveWell reference line. */}
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
      </div>
    </ChapterShell>
  );
}
