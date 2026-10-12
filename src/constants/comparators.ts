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
    label: 'Cage-free campaigns — Rethink Priorities',
    // The source estimates 9–120 chicken-years affected per dollar; it gives no GiveWell
    // multiple. Converting needs a chicken moral weight, so this range is our own conversion.
    lo: 5,
    mid: 80,
    hi: 1000,
    source: 'Rethink Priorities, 9–120 chicken-years/$ (× GiveWell conversion is ours)',
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
    source: 'Rethink Priorities CCM (range is illustrative, not a CCM output)',
    sourceUrl: 'https://ccm.rethinkpriorities.org/',
  },
  {
    label: 'Biosecurity — Founders Pledge',
    // The report gives qualitative "impact multipliers", not a GiveWell multiple, so this
    // range is our own judgement informed by it.
    lo: 0.1,
    mid: 10,
    hi: 1000,
    source: 'Founders Pledge GCBR guide (no × GiveWell figure given; range is ours)',
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
    source: 'Rethink Priorities CCM (range is illustrative, not a CCM output)',
    sourceUrl: 'https://ccm.rethinkpriorities.org/',
  },
];
