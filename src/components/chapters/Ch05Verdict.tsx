import { ChapterShell } from '../ChapterShell';
import { Histogram } from '../charts/Histogram';
import { ComparatorBars } from '../charts/ComparatorBars';
import { useStore } from '../../store';
import { PRESETS } from '../../presets/worldviews';
import { COMPARATORS, COMPARATOR_OMISSIONS } from '../../constants/comparators';
import { summaryFor, outcomeSplit, plainGloss, plainNumber } from '../../model/summary';
import { OutcomeDots } from '../charts/OutcomeDots';
import { OUTCOME_COLORS } from '../../constants/outcomeColors';
import { Segmented } from '../controls/Segmented';
import type { RiskAversion } from '../../model/worldview';

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
  const riskAversion = useStore((s) => s.worldview.riskAversion);
  const patchWorldview = useStore((s) => s.patchWorldview);
  const presetName = activePreset
    ? (PRESETS.find((p) => p.id === activePreset)?.name ?? 'Custom')
    : 'Custom';

  const median = out?.medianMultiplier ?? 0;
  const mean = out?.meanMultiplier ?? 0;
  const p5 = out?.p5Multiplier ?? 0;
  const p95 = out?.p95Multiplier ?? 0;
  const pAbove = out?.pAboveGiveWell ?? 0;
  const pNeg = out?.pNegativeEV ?? 0;
  const pAnyDetection = out?.pAnyDetection ?? 0;

  // Headline: how 100 plausible worlds split between beating GiveWell, doing less, and
  // making things worse. No single number describes this distribution honestly (the
  // median says "about nothing", the mean says "enormous"), so the split leads and the
  // risk dial picks one GiveWell multiple to show underneath. Two regimes have nothing
  // to show: no detections at all, or every multiplier exactly 0.
  const noDetections = pAnyDetection === 0;
  const allZeroValue = !noDetections && mean === 0 && p5 === 0 && p95 === 0 && pNeg === 0;
  const hideHeadline = out === null || noDetections || allZeroValue;

  const split = outcomeSplit(pAbove, out?.pHarmBeyondGiveWell ?? 0);
  const summary = summaryFor(
    {
      meanMultiplier: mean,
      medianMultiplier: median,
      p25Multiplier: out?.p25Multiplier ?? 0,
    },
    riskAversion,
  );
  const fmtCount = (n: number, underOne: boolean): string => (underOne ? '<1' : String(n));

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
      title="A spread of worlds, not one number."
      kicker="Each world is one draw of every uncertain input in Chapters 1–4. We run 100,000 and scale to 100. “GiveWell” means an approximate bar for its top charities (~$100 per DALY averted; GiveWell itself uses its own units)."
    >
      <div className="bg-paper border border-ink px-4 sm:px-7 py-6">
        <div className="font-mono text-[11px] text-muted tracking-chip uppercase">
          Out of 100 plausible worlds · {presetName} preset
        </div>
        {hideHeadline ? (
          <div className="font-serif text-lg text-muted mt-4">
            {noDetections
              ? 'No detections in any world — enable at least one detection programme in Ch.2, or raise the detection-floor override.'
              : allZeroValue
                ? 'Every detection is worth exactly zero — enable at least one value channel in Ch.3.'
                : 'Running…'}
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 mt-4 items-start">
              <OutcomeDots split={split} />
              <div className="flex flex-col gap-4">
                {[
                  {
                    key: 'better' as const,
                    count: fmtCount(split.better, split.betterUnderOne),
                    text: 'do more good than GiveWell’s top charities',
                    sub: null,
                  },
                  {
                    key: 'less' as const,
                    count: String(split.less),
                    text: 'make less difference than GiveWell, either way',
                    sub: 'mostly close to nothing, because nothing is found',
                  },
                  {
                    key: 'worse' as const,
                    count: fmtCount(split.worse, split.worseUnderOne),
                    text: 'do serious harm',
                    sub: 'at least as much harm as GiveWell’s top charities do good. Finding aliens can be bad news: it may mean the cosmos is already claimed, or draw hostile attention (Ch.3)',
                  },
                ].map((row) => (
                  <div key={row.key} className="flex items-baseline gap-3">
                    <span
                      aria-hidden
                      className="inline-block w-3 h-3 rounded-full flex-shrink-0 self-center"
                      style={{ background: OUTCOME_COLORS[row.key] }}
                    />
                    <span
                      className="font-display text-4xl leading-none w-[64px] text-right text-ink"
                      style={{ fontWeight: 600 }}
                    >
                      {row.count}
                    </span>
                    <span className="font-serif text-lg text-ink leading-snug">
                      {row.text}
                      {row.sub !== null && (
                        <span className="block font-serif text-[13px] text-muted leading-snug mt-0.5 max-w-[460px]">
                          {row.sub}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-5" style={{ borderTop: '1px dashed #d8d3c8' }}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-[11px] text-muted tracking-chip uppercase">
                  In GiveWell terms
                </span>
                <Segmented<RiskAversion>
                  ariaLabel="Which outcome to summarise"
                  value={riskAversion}
                  onChange={(v) => {
                    patchWorldview({ riskAversion: v });
                  }}
                  options={[
                    { value: 'average', label: 'Average' },
                    { value: 'typical', label: 'Typical world' },
                    { value: 'cautious', label: 'Cautious' },
                  ]}
                />
              </div>
              <div className="font-serif text-xl text-ink mt-3">
                <span className="font-display text-3xl" style={{ fontWeight: 600 }}>
                  {plainNumber(summary.value)}×
                </span>{' '}
                GiveWell — {plainGloss(summary.value)}
              </div>
              <div className="font-serif text-[13px] text-muted mt-1 max-w-[780px]">
                {riskAversion === 'average'
                  ? 'Average: every world counts in proportion to its value, so a few long shots with huge payoffs can dominate.'
                  : riskAversion === 'typical'
                    ? 'Typical world: the middle world (median) — half of worlds do better, half worse.'
                    : 'Cautious: the world a quarter of the way up from the worst (25th percentile).'}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-7 bg-paper border border-ink px-4 sm:px-7 py-6">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-3.5">
          <div className="font-mono text-[11px] text-muted tracking-chip uppercase">
            For the numbers people · full distribution (positive outcomes, log scale)
          </div>
          <div className="flex gap-6 font-mono text-[11.5px] text-muted">
            <div>
              <div className="uppercase tracking-[0.12em]">5th</div>
              <div className="font-serif text-lg text-ink">{fmtX(p5)}</div>
            </div>
            <div>
              <div className="uppercase tracking-[0.12em]">median</div>
              <div className="font-serif text-lg text-ink">{fmtX(median)}</div>
            </div>
            <div>
              <div className="uppercase tracking-[0.12em]">mean</div>
              <div className="font-serif text-lg text-ink">{fmtX(mean)}</div>
            </div>
            <div>
              <div className="uppercase tracking-[0.12em]">95th</div>
              <div className="font-serif text-lg text-ink">{fmtX(p95)}</div>
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
          <div className="font-mono text-[11px] text-muted mt-3">
            {fmtPct(pNeg)} of worlds are below zero and not shown on this log-scale chart.
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
              label: `This tool — ${presetName} (${summary.short}${summary.value < 0 ? ', negative' : ''})`,
              lo: Math.max(p5, 1e-9),
              mid: Math.max(summary.value, 1e-9),
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
          <div className="col-span-2 tracking-chip uppercase mt-3 mb-1">Not shown</div>
          {COMPARATOR_OMISSIONS.map((o) => (
            <div key={o.label} className="flex justify-between gap-3">
              <span className="text-ink">{o.label}</span>
              <span className="text-right">
                <a
                  href={o.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-dotted underline-offset-2 hover:text-accent transition-colors"
                >
                  {o.reason}
                </a>
              </span>
            </div>
          ))}
        </div>
      </div>
    </ChapterShell>
  );
}
