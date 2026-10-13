// The short answer, directly under the page title, so a visitor who never scrolls still
// gets the verdict and knows what "the search" is. Same numbers as the Ch.5 headline.

import { useStore, configurationLabel } from '../store';
import {
  headlineVerdict,
  meanIsNoise,
  outcomeSplit,
  worldsThatFind,
} from '../model/summary';
import type { DetectionMethodId } from '../constants/detectionDefaults';

const SHORT_NAMES: Record<DetectionMethodId, string> = {
  seti: 'radio SETI',
  tech: 'technosignature searches',
  bio: 'biosignature searches',
  probe: 'interstellar probe research',
  retina: 'RETINA passive radar',
};

function fmtMoney(costM: number): string {
  if (costM >= 1000) return `$${(costM / 1000).toFixed(1).replace(/\.0$/, '')} billion`;
  return `$${String(Math.round(costM))} million`;
}

function listNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1] ?? ''}`;
}

export function VerdictTeaser() {
  const out = useStore((s) => s.drakeOutput);
  const methods = useStore((s) => s.methods);
  const label = useStore(configurationLabel);

  const funded = methods.filter((m) => m.on && m.costM > 0);
  const what =
    funded.length === 0
      ? null
      : `Spending ${fmtMoney(funded.reduce((a, m) => a + m.costM, 0))} this decade on ${listNames(funded.map((m) => SHORT_NAMES[m.id]))}`;

  let answer: string | null = null;
  let body: string;
  if (out === null) {
    body = 'Running the model…';
  } else if (what === null || out.pAnyDetection === 0) {
    body =
      'No detection programme is switched on, so there is nothing to find. Switch one on in Ch.2.';
  } else {
    const split = outcomeSplit(out.pAboveGiveWell, out.pHarmBeyondGiveWell);
    answer = headlineVerdict(split, meanIsNoise(out.meanMultiplier, out.meanMultiplierSE));
    body =
      `${what}: in ${String(split.better)} of 100 plausible worlds that bet is worth more than ` +
      `GiveWell, in ${String(split.less)} it makes almost no difference, and in ` +
      `${String(split.worse)} it does serious harm. Even in the good worlds the search ` +
      `usually finds nothing; it finds something in ${worldsThatFind(out.pAnyDetection)} of 100.`;
  }

  return (
    <div className="mt-6 pl-4 max-w-[900px]" style={{ borderLeft: '3px solid #2e6a31' }}>
      <div className="font-mono text-[11px] text-muted tracking-chip uppercase">
        Short answer · {label}
      </div>
      {answer !== null && (
        <p className="font-serif text-xl sm:text-2xl text-ink mt-1.5 leading-snug">{answer}</p>
      )}
      <p className="font-serif text-base sm:text-lg text-ink mt-1.5 leading-snug">
        {body}{' '}
        <a
          href="#ch-05"
          className="text-muted underline decoration-dotted underline-offset-2 hover:text-accent"
        >
          See the verdict ↓
        </a>
      </p>
    </div>
  );
}

/**
 * The note under the paired headline stats. "Equally valid framings" is only true when the
 * two are close; with a prior override at 10% / 90% it would contradict the numbers.
 */
export function PairingNote() {
  const pNZero = useStore((s) => s.drakeOutput?.pNZero ?? null);
  const close = pNZero !== null && pNZero > 0.3 && pNZero < 0.7;
  return (
    <p className="font-serif italic text-[14px] text-muted mt-3.5 max-w-[840px]">
      The pairing matters more than either individual stat.
      {close && (
        <>
          {' '}
          <span className="text-ink not-italic">&ldquo;We are probably alone&rdquo;</span> and{' '}
          <span className="text-ink not-italic">&ldquo;we probably are not&rdquo;</span> are equally
          valid framings of the same Monte Carlo result.
        </>
      )}
    </p>
  );
}
