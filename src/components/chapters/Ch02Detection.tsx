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
      kicker="Each method has a cost (decadal marginal spend) and a sensitivity coefficient — probability of finding a single detectable civilisation per $1B-decade of marginal spend. These sensitivities are the most uncertain numbers in the model."
    >
      <div className="bg-paper border border-ink px-7 py-1">
        {methods.map((m) => (
          <MethodRow key={m.id} method={m} />
        ))}
      </div>
      <div
        className="font-serif text-sm text-muted mt-4 pl-3.5 italic max-w-[780px]"
        style={{ borderLeft: '2px solid #c2410c' }}
      >
        Per-method sensitivities dominate the result. Adjust them critically. Tooltips link to the
        primary literature; defaults are placeholders awaiting domain-expert refinement.
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
