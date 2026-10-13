// Reference cause-area cost-effectiveness multipliers, in units of THIS TOOL'S bar
// (1 DALY per $100 = 10 DALYs per $1,000; see the Assumptions modal). Every bar is a
// published figure, labelled with its source; areas with no published figure behind them
// are listed in COMPARATOR_OMISSIONS instead of being given an invented range.
// Ranges (whiskers) — not point estimates — to be honest about disagreement. A dot is drawn
// only where the source gives a point.
//
// Sources that report DALYs per $1,000 put GiveWell-grade charities at ~20–21, about twice
// this tool's bar. Dividing their figures by 10 keeps everything on the same scale as the
// search's multiplier, but it makes each figure about 2× the "× GiveWell" ratio the source
// itself would quote, so every source label states the conversion and the source's ratio.

export interface ComparatorItem {
  label: string;
  lo: number;
  hi: number;
  source: string;
  /** The dot. Omitted when the source publishes only a range. */
  mid?: number;
  /** Optional URL — when present, the source label renders as a link. */
  sourceUrl?: string;
  /** Further sources for parts of the figure the main source doesn't cover. */
  extraLinks?: { text: string; url: string }[];
}

export const COMPARATORS: ComparatorItem[] = [
  {
    label: 'GiveDirectly — GiveWell',
    // GiveWell's Nov 2024 re-evaluation puts GiveDirectly at 2.6–3.8× its cash benchmark
    // (by country). GiveWell's funding bar is 6× that benchmark (as of May 2026), so
    // GiveDirectly sits at ~0.43–0.63× the bar.
    // GiveWell headlines "3 to 4 times"; no single figure, so no dot.
    lo: 0.43,
    hi: 0.63,
    source: 'GiveWell 2024 re-evaluation: 2.6–3.8× its cash benchmark, ÷ its bar of 6×',
    sourceUrl:
      'https://blog.givewell.org/2024/11/12/re-evaluating-the-impact-of-unconditional-cash-transfers/',
    extraLinks: [
      {
        text: 'bar = 6× benchmark (May 2026)',
        url: 'https://www.givewell.org/how-we-work/our-criteria/cost-effectiveness/cost-effectiveness-models',
      },
    ],
  },
  {
    label: 'GiveDirectly — RP CCM',
    // RP CCM's default direct-cash-transfers output is 2 DALYs/$1k (as reported, Jan 2024)
    // ≈ 0.2× this tool's $100/DALY bar. A point: no published range.
    lo: 0.2,
    mid: 0.2,
    hi: 0.2,
    source:
      'Rethink Priorities CCM default: 2 DALYs/$1k ÷ our 10 (the CCM’s own GiveWell bar is 21, so ≈0.1× by its reckoning)',
    sourceUrl:
      'https://ea.greaterwrong.com/posts/pniDWyjc9vY5sjGre/rethink-priorities-cross-cause-cost-effectiveness-model',
  },
  {
    label: 'GiveWell bar (this tool’s ≈$100/DALY)',
    // The bar itself, by definition: a point, not a range. It is our approximation of
    // GiveWell's funding bar, not of where its top charities sit: sources reporting DALYs
    // put top charities at ~20 DALYs per $1,000, about 2× this line.
    lo: 1,
    mid: 1,
    hi: 1,
    source: 'Our approximation of GiveWell’s funding bar; top charities sit ~2× above it',
    sourceUrl: 'https://www.givewell.org/how-we-work/our-criteria/cost-effectiveness',
  },
  {
    label: 'Cage-free campaigns',
    // titotal (2024) replicates Rethink Priorities' animal-welfare model: 1,996 DALYs per
    // $1,000 with RP's moral weights, 17 with neuron-count weights. RP's CCM default output
    // is 714 (as reported in Jan 2024), but titotal calls those defaults "just wrong" and
    // the chart drops CCM defaults for AI and biosecurity, so it gets no dot here either.
    // This tool's bar is 10 DALYs per $1,000, so 1.7× to 200×. The spread is almost all
    // moral weights.
    lo: 1.7,
    hi: 200,
    source:
      'titotal 2024 (replicating RP): 17–1,996 DALYs/$1k ÷ our 10; titotal’s own ratio is “about the same” as AMF to “about 100 times”',
    sourceUrl: 'https://forum.effectivealtruism.org/posts/qARKFgYhCqmKB2YpF',
  },
  {
    label: 'Biosecurity (x-risk) — Millett & Snyder-Beattie',
    // Table 2: $0.125–$1,600 per life-year across three models, counting future generations
    // and undiscounted, for a hypothetical ~$250B century-long programme. 100 ÷ cost per
    // life-year = 800× to 0.06×. With a 1% discount rate it is $770 per life-year or more,
    // i.e. ≤ 0.13×. No published point estimate, so no dot.
    lo: 0.0625,
    hi: 800,
    source:
      'Millett & Snyder-Beattie 2017: $0.125–$1,600 per life-year, future generations counted, undiscounted',
    sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5576214',
  },
];

/** Cause areas deliberately left off the chart, and why. */
export interface ComparatorOmission {
  label: string;
  reason: string;
  sourceUrl: string;
}

export const COMPARATOR_OMISSIONS: ComparatorOmission[] = [
  {
    label: 'AI safety',
    // Vasco Grilo's Jan 2024 comment lists CCM defaults of 1,611–1,718 DALYs per $1,000 for
    // AI-misalignment projects; Derek Shiller (RP) replied "put very little trust in the
    // default parameters of the projects".
    reason:
      'No bar. The only published figures are RP CCM defaults (1,611–1,718 DALYs/$1k, Jan 2024: ~80× by the CCM’s own GiveWell bar), and RP staff say to put “very little trust” in them.',
    sourceUrl:
      'https://ea.greaterwrong.com/posts/pniDWyjc9vY5sjGre/rethink-priorities-cross-cause-cost-effectiveness-model',
  },
  {
    label: 'Biosecurity — RP CCM',
    reason:
      'Left out for the same reason (CCM defaults 5,919–8,915 DALYs/$1k: ~280–425× by the CCM’s own bar). Founders Pledge’s guide gives no × GiveWell figure.',
    sourceUrl:
      'https://ea.greaterwrong.com/posts/pniDWyjc9vY5sjGre/rethink-priorities-cross-cause-cost-effectiveness-model',
  },
];
