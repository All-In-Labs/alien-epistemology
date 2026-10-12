// The verdict in one paragraph, near the top of the page, so a visitor who never scrolls
// to Ch.5 still gets the answer. Same numbers and wording as the Ch.5 headline.

import { useStore, configurationLabel } from '../store';
import { outcomeSplit, worldsThatFind } from '../model/summary';

export function VerdictTeaser() {
  const out = useStore((s) => s.drakeOutput);
  const label = useStore(configurationLabel);

  let body: string;
  if (out === null) {
    body = 'Running the model…';
  } else if (out.totalCostM <= 0 || out.pAnyDetection === 0) {
    body =
      'No detection programme is switched on, so there is nothing to find. Switch one on in Ch.2.';
  } else {
    const split = outcomeSplit(out.pAboveGiveWell, out.pHarmBeyondGiveWell);
    body =
      `Out of 100 plausible worlds, ${String(split.better)} are worth more than GiveWell’s ` +
      `top charities on average, ${String(split.less)} make less difference either way, and ` +
      `${String(split.worse)} do serious harm. The search actually finds something this ` +
      `decade in ${worldsThatFind(out.pAnyDetection)} of them.`;
  }

  return (
    <div className="mb-8 pl-3.5 max-w-[840px]" style={{ borderLeft: '2px solid #2e6a31' }}>
      <div className="font-mono text-[11px] text-muted tracking-chip uppercase">
        The verdict, in short · {label}
      </div>
      <p className="font-serif text-[16px] text-ink mt-1 leading-snug">
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
