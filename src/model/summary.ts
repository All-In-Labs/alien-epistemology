// Headline summary statistic for the verdict, chosen by the worldview's risk-aversion
// dial (spec §5.4): EV-max → mean, log-utility → geometric mean, difference-making →
// 25th percentile. Pure function so the verdict, presenter bar and tests agree.

import type { DrakeMCOutput } from './monteCarlo';
import type { RiskAversion } from './worldview';

export interface HeadlineStat {
  /** The statistic's value in × GiveWell-bar units, or null when it is undefined. */
  value: number | null;
  /** Long label for the verdict, e.g. "mean (EV-max)". */
  label: string;
  /** Short label for compact displays such as the presenter bar. */
  short: string;
  /** Why the value is null, when it is. */
  note?: string;
}

type SummaryInputs = Pick<
  DrakeMCOutput,
  'meanMultiplier' | 'gmeanMultiplier' | 'p25Multiplier' | 'pNegativeEV'
>;

export function headlineFor(out: SummaryInputs, risk: RiskAversion): HeadlineStat {
  switch (risk) {
    case 'EV-max':
      return { value: out.meanMultiplier, label: 'mean (EV-max)', short: 'mean' };
    case 'log-utility':
      if (out.gmeanMultiplier === null) {
        return {
          value: null,
          label: 'geometric mean (log-utility)',
          short: 'geo. mean',
          note: `undefined: ${(out.pNegativeEV * 100).toFixed(0)}% of samples are losses, and log utility can't take a loss`,
        };
      }
      return {
        value: out.gmeanMultiplier,
        label: 'geometric mean (log-utility)',
        short: 'geo. mean',
      };
    case 'difference-making':
      return {
        value: out.p25Multiplier,
        label: '25th percentile (difference-making)',
        short: 'p25',
      };
  }
}
