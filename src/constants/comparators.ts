// Reference cause-area cost-effectiveness multipliers (× GiveWell bar). Every bar is a
// published figure, labelled with its source; areas with no published figure behind them
// are listed in COMPARATOR_OMISSIONS instead of being given an invented range.
// Ranges (whiskers) — not point estimates — to be honest about disagreement.

export interface ComparatorItem {
  label: string;
  lo: number;
  mid: number;
  hi: number;
  source: string;
  /** Optional URL — when present, the source label renders as a link. */
  sourceUrl?: string;
}

export const COMPARATORS: ComparatorItem[] = [
  {
    label: 'GiveDirectly — GiveWell',
    // GiveWell's Nov 2024 re-evaluation puts GiveDirectly at 2.6–3.8× its cash benchmark
    // (by country). GiveWell's funding bar is 6× that benchmark (as of May 2026), so
    // GiveDirectly sits at ~0.43–0.63× the bar.
    lo: 0.43,
    mid: 0.55,
    hi: 0.63,
    source: 'GiveWell (2024 re-evaluation; bar = 6× benchmark)',
    sourceUrl:
      'https://blog.givewell.org/2024/11/12/re-evaluating-the-impact-of-unconditional-cash-transfers/',
  },
  {
    label: 'GiveDirectly — RP CCM',
    // RP CCM's published direct-cash-transfers estimate is ~2 DALYs/$1k ≈ 0.2× this tool's
    // $100/DALY bar. We widen slightly to reflect parameter-distribution uncertainty
    // (the CCM is a Monte-Carlo tool, not a point estimate).
    lo: 0.1,
    mid: 0.2,
    hi: 0.5,
    source: 'Rethink Priorities CCM (2 DALYs/$1k vs our $100/DALY bar)',
    sourceUrl: 'https://ccm.rethinkpriorities.org/',
  },
  {
    label: 'GiveWell top charities',
    lo: 0.7,
    mid: 1.0,
    hi: 1.5,
    source: 'GiveWell (definitional)',
    sourceUrl: 'https://www.givewell.org/how-we-work/our-criteria/cost-effectiveness',
  },
  {
    label: 'Cage-free campaigns',
    // titotal (2024) replicates Rethink Priorities' animal-welfare model: 1,996 DALYs per
    // $1,000 with RP's moral weights, 17 with neuron-count weights. RP's CCM default output
    // is 714 (as reported in Jan 2024). This tool's bar is 10 DALYs per $1,000, so 200×,
    // 1.7× and 71×. The spread is almost all moral weights.
    lo: 1.7,
    mid: 71,
    hi: 200,
    source:
      'titotal 2024 (replicating RP): 1.7× with neuron-count weights to 200× with RP’s; dot = RP CCM default, 71×',
    sourceUrl: 'https://forum.effectivealtruism.org/posts/qARKFgYhCqmKB2YpF',
  },
  {
    label: 'Biosecurity (x-risk) — Millett & Snyder-Beattie',
    // Table 2: $0.125–$1,600 per life-year across three models, counting future generations
    // and undiscounted, for a hypothetical ~$250B century-long programme. 100 ÷ cost per
    // life-year = 800× to 0.06×. Excluding future generations (discounted) it is $770 per
    // life-year or more, i.e. ≤ 0.13×. The dot is the log-midpoint, not a published figure.
    lo: 0.0625,
    mid: 7.1,
    hi: 800,
    source:
      'Millett & Snyder-Beattie 2017: $0.125–$1,600 per life-year, future generations counted, undiscounted; dot = log-midpoint',
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
      'No bar. The only published figures are RP CCM defaults (~160–170×, Jan 2024), and RP staff say to put “very little trust” in them.',
    sourceUrl:
      'https://ea.greaterwrong.com/posts/pniDWyjc9vY5sjGre/rethink-priorities-cross-cause-cost-effectiveness-model',
  },
  {
    label: 'Biosecurity — RP CCM',
    reason:
      'Left out for the same reason (CCM defaults ~590–890×). Founders Pledge’s guide gives no × GiveWell figure.',
    sourceUrl:
      'https://ea.greaterwrong.com/posts/pniDWyjc9vY5sjGre/rethink-priorities-cross-cause-cost-effectiveness-model',
  },
];
