import { ChapterShell } from '../ChapterShell';
import { MethodRow } from '../MethodRow';
import { useStore } from '../../store';

export function Ch02Detection() {
  const methods = useStore((s) => s.methods);
  const resetMethods = useStore((s) => s.resetMethods);

  return (
    <ChapterShell
      num="02"
      eyebrow="The instruments"
      title="Five programmes you can fund, in any combination."
      kicker="Each method has a cost (marginal spend per decade), a reach (the share of the galaxy its instruments can cover this decade, built from published surveys) and a sensitivity within that reach (how fast spending turns a target in view into a detection). Spending more buys more looks within reach, never more reach."
    >
      <div className="bg-paper border border-ink px-7 py-1">
        {methods.map((m) => (
          <MethodRow key={m.id} method={m} />
        ))}
      </div>
      <div
        className="font-serif text-sm text-muted mt-4 pl-3.5 italic max-w-[780px]"
        style={{ borderLeft: '2px solid #2e6a31' }}
      >
        Reach is the binding limit: even radio SETI&rsquo;s widest view takes in about one star in
        three thousand. A transmitter as strong as our Deep Space Network would be visible from
        about one star in a hundred million, and Earth&rsquo;s everyday radio leakage from none.
        The sensitivities within reach &mdash; is a civilisation in view transmitting, aimed our
        way and in-band when we look? &mdash; are the most uncertain numbers in the model. Their
        defaults are wide placeholder ranges, not community estimates. Adjust them critically;
        each ⓘ links the surveys behind the reach ranges.
      </div>
      <div className="flex gap-3 mt-4 font-mono text-[11px] text-muted tracking-chip uppercase items-center">
        <button
          type="button"
          onClick={() => {
            resetMethods();
          }}
          className="px-3.5 py-2 bg-transparent border border-ink text-ink cursor-pointer hover:bg-ink hover:text-paper transition-colors"
        >
          Reset detection defaults
        </button>
      </div>
    </ChapterShell>
  );
}
