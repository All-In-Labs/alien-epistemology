// Reference cause-area cost-effectiveness multipliers (× GiveWell bar) from spec §7.2.
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
    lo: 0.05,
    mid: 0.1,
    hi: 0.3,
    source: 'GiveWell',
    sourceUrl:
      'https://www.givewell.org/international/technical/programs/givedirectly-cash-for-poverty-relief-program',
  },
  {
    label: 'GiveDirectly — RP CCM',
    // RP CCM's published direct-cash-transfers estimate is ~2 DALYs/$1k ≈ 0.2× the
    // GiveWell bar. We widen slightly to reflect parameter-distribution uncertainty
    // (the CCM is a Monte-Carlo tool, not a point estimate).
    lo: 0.1,
    mid: 0.2,
    hi: 0.5,
    source: 'Rethink Priorities CCM',
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
    label: 'Cage-free campaigns — Rethink Priorities',
    lo: 5,
    mid: 80,
    hi: 1000,
    source: 'Rethink Priorities',
    sourceUrl:
      'https://rethinkpriorities.org/research-area/corporate-campaigns-affect-9-to-120-years-of-chicken-life-per-dollar-spent/',
  },
  {
    label: 'AI safety — RP CCM',
    // RP CCM's x-risk-mitigation outputs span many OoM depending on user-supplied
    // parameter distributions (expected-value framing dominates; risk-aversion
    // framing can flip it). The range here reflects that wide spread.
    lo: 0.01,
    mid: 10,
    hi: 10000,
    source: 'Rethink Priorities CCM',
    sourceUrl: 'https://ccm.rethinkpriorities.org/',
  },
  {
    label: 'Biosecurity — Founders Pledge',
    lo: 0.1,
    mid: 10,
    hi: 1000,
    source: 'Founders Pledge — GCBR report',
    sourceUrl:
      'https://www.founderspledge.com/research/global-catastrophic-biological-risks-a-guide-for-philanthropists',
  },
  {
    label: 'Biosecurity — RP CCM',
    // Same CCM caveat as AI safety — wide range reflecting parameter uncertainty
    // in the x-risk-mitigation evaluator.
    lo: 1,
    mid: 100,
    hi: 5000,
    source: 'Rethink Priorities CCM',
    sourceUrl: 'https://ccm.rethinkpriorities.org/',
  },
];
