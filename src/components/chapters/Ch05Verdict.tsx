import { ChapterShell } from '../ChapterShell';
import { SignedHistogram } from '../charts/SignedHistogram';
import { ComparatorBars } from '../charts/ComparatorBars';
import { useStore, configurationLabel } from '../../store';
import { COMPARATORS, COMPARATOR_OMISSIONS } from '../../constants/comparators';

/**
 * Below 10⁻³ × GiveWell (either sign) a world counts as "≈ 0": the same cut-off plainGloss
 * uses for "about nothing", so the chart, the numbers and the words agree.
 */
const HIST_FLOOR_LOG = -3;
import {
  summaryFor,
  outcomeSplit,
  plainGloss,
  plainNumber,
  worldsThatFind,
  meanIsNoise,
  reconcileVerdict,
} from '../../model/summary';
import { OutcomeDots } from '../charts/OutcomeDots';
import { OUTCOME_COLORS } from '../../constants/outcomeColors';
import { Segmented } from '../controls/Segmented';
import type { RiskAversion } from '../../model/worldview';

// Number-only formatter (no trailing × — caller decides whether to add one).
/** Same plain format as the headline number ("−3,136", "1.7 million", "≈ 0"). */
function fmtX(v: number): string {
  return `${plainNumber(v)}×`;
}


export function Ch05Verdict() {
  const out = useStore((s) => s.drakeOutput);
  const configLabel = useStore(configurationLabel);
  const riskAversion = useStore((s) => s.worldview.riskAversion);
  const patchWorldview = useStore((s) => s.patchWorldview);

  const median = out?.medianMultiplier ?? 0;
  const mean = out?.meanMultiplier ?? 0;
  const meanSE = out?.meanMultiplierSE ?? 0;
  const meanNoise = meanIsNoise(mean, meanSE);
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

  // Share of worlds meaningfully below zero (not just a hair below it).
  const pMeaningfullyNeg = (() => {
    const xs = out?.multiplierSamples;
    if (!xs || xs.length === 0) return 0;
    let k = 0;
    for (const v of xs) if (v <= -Math.pow(10, HIST_FLOOR_LOG)) k++;
    return k / xs.length;
  })();

  // Histogram range: |x| from 10⁻¹² (anything smaller is "≈ 0") up to the largest
  // magnitude seen, always including the ±1× GiveWell lines.
  const histLogMax = (() => {
    let maxLog = 1;
    for (const v of out?.multiplierSamples ?? []) {
      const a = Math.abs(v);
      if (a > 0 && Number.isFinite(a)) maxLog = Math.max(maxLog, Math.log10(a));
    }
    return Math.ceil(maxLog);
  })();


  return (
    <ChapterShell
      num="05"
      eyebrow="The verdict"
      title="A spread of worlds, not one number."
      kicker="Each world is one draw of every uncertain input in Chapters 1–4. We run 100,000 and scale to 100. “GiveWell” means our approximation of GiveWell’s funding bar: about $100 per disability-adjusted life year (DALY) averted. Its top charities sit about twice above that line."
    >
      <div className="bg-paper border border-ink px-4 sm:px-7 py-6">
        <div className="font-mono text-[11px] text-muted tracking-chip uppercase">
          Out of 100 plausible worlds · {configLabel}
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
                    text: 'worlds where the bet is worth more than GiveWell',
                    sub: 'usually a small chance of a very large payoff, not an actual find',
                  },
                  {
                    key: 'less' as const,
                    count: String(split.less),
                    text: 'worlds where it makes almost no difference',
                    sub: 'mostly because a find is very unlikely in that world',
                  },
                  {
                    key: 'worse' as const,
                    count: fmtCount(split.worse, split.worseUnderOne),
                    text: 'worlds where it does more harm than GiveWell does good',
                    sub: 'finding aliens can be bad news: it may mean the cosmos is already claimed, or draw hostile attention that could end us (Ch.3)',
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
                      <span className="block font-serif text-[13px] text-muted leading-snug mt-0.5 max-w-[460px]">
                        {row.sub}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <p className="font-serif text-[15px] text-ink mt-5 max-w-[780px]">
              {reconcileVerdict({ split, median, mean, meanSE, pNegative: pMeaningfullyNeg })}
            </p>
            <p className="font-serif text-[14px] text-muted mt-2 max-w-[780px]">
              Each dot is one world&rsquo;s value <em>on average</em>, over whether the search
              finds anything. Even in the green worlds it usually finds nothing: the search
              actually finds something this decade in{' '}
              <span className="text-ink">{worldsThatFind(pAnyDetection)}</span> of 100 worlds.
            </p>

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
                {riskAversion === 'average' && meanNoise ? (
                  <>
                    <span className="font-display text-3xl" style={{ fontWeight: 600 }}>
                      ≈ 0×
                    </span>{' '}
                    GiveWell — too close to zero to tell the sign
                  </>
                ) : (
                  <>
                    <span className="font-display text-3xl" style={{ fontWeight: 600 }}>
                      {plainNumber(summary.value)}×
                    </span>{' '}
                    GiveWell — {plainGloss(summary.value)}
                  </>
                )}
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
            For the numbers people · every world, losses and gains
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
              <div className="font-serif text-lg text-ink">
                {meanNoise ? 'sign unclear' : fmtX(mean)}
              </div>
            </div>
            <div>
              <div className="uppercase tracking-[0.12em]">95th</div>
              <div className="font-serif text-lg text-ink">{fmtX(p95)}</div>
            </div>
          </div>
        </div>
        {/* On phones the chart keeps a readable minimum width and scrolls sideways. */}
        <div className="overflow-x-auto">
          <div className="min-w-[720px] md:min-w-0">
            <SignedHistogram
              samples={out?.multiplierSamples ?? new Float64Array(0)}
              logMin={HIST_FLOOR_LOG}
              logMax={histLogMax}
            />
          </div>
        </div>
      </div>

      <div className="mt-7 bg-paper border border-ink px-7 py-6">
        <div className="font-mono text-[11px] text-muted tracking-chip uppercase mb-3">
          vs reference cause areas — published figures; ranges where the source gives one
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[720px] md:min-w-0">
            <ComparatorBars
              items={[
                {
                  label: `This tool — ${configLabel} (${summary.short}${summary.value < 0 ? ', negative' : ''})`,
                  lo: p5,
                  mid: summary.value,
                  hi: p95,
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
        </div>
        <div className="font-mono text-[11px] text-muted mt-2">
          This tool&rsquo;s whisker runs from its 5th to its 95th percentile world; the dot is the
          number chosen under &ldquo;In GiveWell terms&rdquo;.
          {(summary.value > p95 || summary.value < p5) &&
            ' The dot sits outside the whisker because a few worlds with enormous payoffs (or losses) dominate the average.'}
        </div>
        <div
          className="mt-5 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 font-mono text-[11px] text-muted"
          style={{ borderTop: '1px dashed #d8d3c8' }}
        >
          <div className="sm:col-span-2 tracking-chip uppercase mb-1">Sources</div>
          {COMPARATORS.map((c) => (
            <div
              key={c.label}
              className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-3"
            >
              <span className="text-ink shrink-0 sm:max-w-[40%]">{c.label}</span>
              <span className="sm:text-right">
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
                {c.extraLinks?.map((l) => (
                  <span key={l.url + l.text}>
                    {' · '}
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-dotted underline-offset-2 hover:text-accent transition-colors"
                    >
                      {l.text}
                    </a>
                  </span>
                ))}
              </span>
            </div>
          ))}
          <div className="sm:col-span-2 tracking-chip uppercase mt-3 mb-1">Not shown</div>
          {COMPARATOR_OMISSIONS.map((o) => (
            <div
              key={o.label}
              className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-3"
            >
              <span className="text-ink shrink-0 sm:max-w-[40%]">{o.label}</span>
              <span className="sm:text-right">
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
