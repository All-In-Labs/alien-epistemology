// "Out of 100 worlds" icon array for the verdict. One dot per world, filled in order:
// more good than GiveWell, then less difference either way, then serious harm.
//
// Colours follow a diverging scheme (good pole / neutral grey / bad pole), checked with
// the dataviz palette validator: the green and orange stay distinct under protanopia
// and deuteranopia. Every group is also labelled with its count beside the grid, so
// identity never rests on colour alone.

import type { OutcomeSplit } from '../../model/summary';
import { OUTCOME_COLORS } from '../../constants/outcomeColors';

const COLS = 10;
const STEP = 18;
const R = 7;

interface OutcomeDotsProps {
  split: OutcomeSplit;
}

export function OutcomeDots({ split }: OutcomeDotsProps) {
  const groups: { key: keyof typeof OUTCOME_COLORS; count: number; label: string }[] = [
    { key: 'better', count: split.better, label: 'do more good than GiveWell' },
    { key: 'less', count: split.less, label: 'make less difference than GiveWell' },
    { key: 'worse', count: split.worse, label: 'do serious harm' },
  ];
  const dots: { key: keyof typeof OUTCOME_COLORS; label: string; count: number }[] = [];
  for (const g of groups) {
    for (let i = 0; i < g.count; i++) dots.push(g);
  }
  const size = COLS * STEP;
  return (
    <svg
      viewBox={`0 0 ${String(size)} ${String(size)}`}
      width={size}
      height={size}
      role="img"
      aria-label={`Out of 100 worlds: ${String(split.better)} do more good than GiveWell, ${String(split.less)} make less difference, ${String(split.worse)} do serious harm.`}
      className="flex-shrink-0"
    >
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={(i % COLS) * STEP + STEP / 2}
          cy={Math.floor(i / COLS) * STEP + STEP / 2}
          r={R}
          fill={OUTCOME_COLORS[d.key]}
        >
          <title>{`${String(d.count)} of 100 worlds ${d.label}`}</title>
        </circle>
      ))}
    </svg>
  );
}
