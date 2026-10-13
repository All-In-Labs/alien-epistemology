// Plain-language summaries of the Monte Carlo output for the Ch.5 verdict.
//
// The verdict leads with an "out of 100 worlds" split (beats GiveWell / does less /
// makes things worse) because no single number describes this distribution honestly:
// the median says "about nothing" and the mean says "enormous", and both are true.
// The risk dial then picks one secondary GiveWell multiple to show underneath.

import type { DrakeMCOutput } from './monteCarlo';
import type { RiskAversion } from './worldview';

export interface SummaryStat {
  /** × GiveWell-bar units. Always defined. */
  value: number;
  /** Long label, e.g. "average — long shots count fully". */
  label: string;
  /** Short label for compact displays. */
  short: string;
}

type SummaryInputs = Pick<DrakeMCOutput, 'meanMultiplier' | 'medianMultiplier' | 'p25Multiplier'>;

export function summaryFor(out: SummaryInputs, risk: RiskAversion): SummaryStat {
  switch (risk) {
    case 'average':
      return {
        value: out.meanMultiplier,
        label: 'average — long shots count fully',
        short: 'average',
      };
    case 'typical':
      return { value: out.medianMultiplier, label: 'typical world (median)', short: 'typical' };
    case 'cautious':
      return { value: out.p25Multiplier, label: 'cautious (25th percentile)', short: 'cautious' };
  }
}

export interface OutcomeSplit {
  /** Whole worlds out of 100; the three always sum to 100. */
  better: number;
  less: number;
  worse: number;
  /** True when a bucket has a real but sub-0.5% share, so it rounds to 0 worlds. */
  betterUnderOne: boolean;
  worseUnderOne: boolean;
}

/**
 * Split 100 worlds by outcome, symmetric around zero at GiveWell scale: more good than
 * a GiveWell top charity (multiplier > 1), at least as much harm as it does good
 * (multiplier < −1), and everything in between (mostly ≈ 0). Largest-remainder rounding
 * so the counts always sum to 100.
 */
export function outcomeSplit(pBetter: number, pWorse: number): OutcomeSplit {
  const b = Math.min(1, Math.max(0, pBetter));
  const w = Math.min(1 - b, Math.max(0, pWorse));
  const raw = [b * 100, (1 - b - w) * 100, w * 100];
  const floors = raw.map((x) => Math.floor(x));
  let remaining = 100 - floors.reduce((a, c) => a + c, 0);
  const order = raw.map((x, i) => ({ i, frac: x - Math.floor(x) })).sort((p, q) => q.frac - p.frac);
  for (const { i } of order) {
    if (remaining <= 0) break;
    floors[i] = (floors[i] ?? 0) + 1;
    remaining--;
  }
  const [better = 0, less = 0, worse = 0] = floors;
  return {
    better,
    less,
    worse,
    betterUnderOne: better === 0 && b > 0,
    worseUnderOne: worse === 0 && w > 0,
  };
}

/** Plain words for a GiveWell multiple, for readers who don't want to parse 10⁻¹⁰. */
export function plainGloss(multiplier: number): string {
  // Same thresholds as the dot groups: |x| < 1e-3 reads as "about nothing" whatever its
  // sign, and only x ≤ −1 counts as harm on GiveWell's scale.
  if (multiplier <= -1) return 'more harm than GiveWell does good';
  if (multiplier <= -1e-3) return 'slightly worse than doing nothing';
  if (multiplier < 1e-3) return 'about nothing';
  if (multiplier < 0.5) return 'less than GiveWell';
  if (multiplier < 2) return 'about as good as GiveWell';
  // No "far better" for big numbers: the number beside it already says how much.
  return 'better than GiveWell';
}

/**
 * How many of 100 worlds actually see a detection this decade, in plain words. The dot
 * grid shows each world's *expected* value, so most green dots are worlds where nothing
 * is found; this says how rare a find really is.
 */
export function worldsThatFind(pAnyDetection: number): string {
  const n = pAnyDetection * 100;
  if (!(n > 0)) return 'none';
  if (n < 0.5) return 'fewer than 1';
  return `about ${String(Math.round(n))}`;
}

const SUPERSCRIPT: Record<string, string> = {
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

/** A GiveWell multiple in plain words-and-digits, e.g. "1.7 million", "≈ 0", "−4 million". */
export function plainNumber(v: number): string {
  if (!Number.isFinite(v)) return '—';
  const a = Math.abs(v);
  const sign = v < 0 ? '−' : '';
  if (a < 1e-3) return '≈ 0';
  if (a < 10) return sign + a.toFixed(a < 1 ? 2 : 1).replace(/\.?0+$/, '');
  // Two significant figures: the Monte Carlo can't support more, and "347,340" reads as
  // more precise than it is.
  if (a < 1e6) {
    const mag = Math.pow(10, Math.floor(Math.log10(a)) - 1);
    return sign + (Math.round(a / mag) * mag).toLocaleString('en-GB');
  }
  const units: [number, string][] = [
    [1e12, 'trillion'],
    [1e9, 'billion'],
    [1e6, 'million'],
  ];
  if (a < 1e15) {
    for (const [u, name] of units) {
      if (a >= u) return `${sign}${(a / u).toFixed(1).replace(/\.0$/, '')} ${name}`;
    }
  }
  const exp = String(Math.round(Math.log10(a)))
    .split('')
    .map((c) => SUPERSCRIPT[c] ?? c)
    .join('');
  return `${sign}10${exp}`;
}

/**
 * True when the sampled mean is within two standard errors of zero, so the simulation can't
 * tell its sign. Happens when big wins and big losses roughly cancel, as they do at the
 * defaults (channel B's expected upside equals channel D's expected endowment loss).
 */
export function meanIsNoise(mean: number, meanSE: number): boolean {
  return Math.abs(mean) < 2 * meanSE;
}

/**
 * One sentence that reconciles the three numbers a reader sees in Ch.5 (the split, the
 * typical world, the average) instead of leaving them to work out why they disagree.
 */
export function reconcileVerdict(o: {
  split: OutcomeSplit;
  median: number;
  mean: number;
  meanSE: number;
  pNegative: number;
}): string {
  const typical =
    Math.abs(o.median) < 1e-3
      ? 'In the typical world the search makes about no difference'
      : `In the typical world the search is worth ${plainNumber(o.median)}× GiveWell (${plainGloss(o.median)})`;
  let average: string;
  if (meanIsNoise(o.mean, o.meanSE)) {
    average =
      'averaged over every world, the rare huge wins and rare huge losses cancel out: the average is too close to zero for this simulation to tell whether it is positive or negative';
  } else if (o.mean > 0) {
    average = `the average is ${plainNumber(o.mean)}× GiveWell, but only because a few long shots pay off enormously`;
  } else {
    average = `the average is ${plainNumber(o.mean)}× GiveWell, because a few worlds go very badly`;
  }
  const negWorlds = Math.round(o.pNegative * 100);
  const harm =
    negWorlds > o.split.worse
      ? ` ${String(negWorlds)} of 100 worlds come out below zero, but only ${String(o.split.worse)} by enough to count as serious harm.`
      : '';
  return `${typical}; ${average}.${harm}`;
}

/**
 * The page's one-line answer to "should we fund this search?", shown under the title.
 * Everything else on the page is evidence for or against this sentence, so it has to stay
 * neutral: it must never sound more (or less) favourable than the split it summarises.
 */
export function headlineVerdict(split: OutcomeSplit, averageIsNoise: boolean): string {
  // TODO(owner): decide how the split maps to a one-line answer. See the request in the PR.
  void averageIsNoise;
  return `Out of 100 plausible worlds, ${String(split.better)} come out better than GiveWell and ${String(split.worse)} do serious harm.`;
}
