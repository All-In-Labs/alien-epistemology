// Reference cause-area cost-effectiveness multipliers (× GiveWell bar) from spec §7.2.
// Ranges (whiskers) — not point estimates — to be honest about disagreement.

export interface ComparatorItem {
  label: string;
  lo: number;
  mid: number;
  hi: number;
  source: string;
}

export const COMPARATORS: ComparatorItem[] = [
  { label: 'GiveDirectly', lo: 0.05, mid: 0.1, hi: 0.3, source: 'GiveWell' },
  { label: 'GiveWell top charities', lo: 0.7, mid: 1.0, hi: 1.5, source: 'GiveWell (definitional)' },
  { label: 'Cage-free campaigns', lo: 5, mid: 80, hi: 1000, source: 'OPP, Rethink Priorities' },
  { label: 'AI safety (technical)', lo: 0.001, mid: 1, hi: 10000, source: 'huge community uncertainty' },
  { label: 'Biosecurity / pandemic prep', lo: 0.1, mid: 10, hi: 1000, source: 'OPP estimates' },
];
