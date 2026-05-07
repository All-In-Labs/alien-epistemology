import { useState } from 'react';
import { ChapterShell } from '../ChapterShell';
import { AssumptionsModal } from '../AssumptionsModal';

interface RuleProps {
  n: string;
  title: string;
  body: string;
}

function ContractRule({ n, title, body }: RuleProps) {
  return (
    <div className="grid grid-cols-[72px_1fr] gap-6 py-[22px] border-b border-edge last:border-b-0">
      <div
        className="font-display text-[56px] leading-[0.95] text-accent"
        style={{ fontWeight: 600 }}
      >
        {n}
      </div>
      <div>
        <div
          className="font-display text-[24px] text-ink"
          style={{ fontWeight: 600, letterSpacing: '-0.01em' }}
        >
          {title}
        </div>
        <p className="font-serif text-[15px] leading-[1.55] text-ink mt-2 max-w-[780px]">{body}</p>
      </div>
    </div>
  );
}

export function Ch00Contract() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <ChapterShell
      num="00"
      eyebrow="The honesty contract"
      title="Three rules this tool keeps."
      kicker="Before any numbers — the constraints under which the model was designed. If you find a result that violates one of these, the tool is broken; tell us."
    >
      <div className="bg-paper border border-ink px-8 py-1">
        <ContractRule
          n="1"
          title="Distributions, never point estimates."
          body="The SDO finding is that uncertainty over Drake&rsquo;s parameters spans many orders of magnitude. A single number for N hides that — and chooses, implicitly, which orders of magnitude get to count. We display histograms and percentile bands. The single number you see in any stat is always either a median or an explicitly labelled summary."
        />
        <ContractRule
          n="2"
          title="No worldview is privileged."
          body="The six presets — Bostrom, Hanson, Ord, Neartermist, Dark Forest, Astronomical-Waste — sit equally in the dropdown. None is the default look. Defaults under Ord Moderate must not produce &ldquo;obviously a top EA cause&rdquo;; if they do, the defaults are biased and need adjusting."
        />
        <ContractRule
          n="3"
          title="Defaults don't flatter the conclusion."
          body="Per-method detection sensitivities are the most uncertain numbers in the whole model and would be the easiest to fudge. We pick placeholders that sit roughly in the middle of expert disagreement and label them as such. The result of the tool is a function of your inputs; we own the inputs we picked."
        />
        <div className="py-4 flex items-center justify-between gap-6 flex-wrap">
          <span className="font-mono text-[11px] text-muted tracking-chip uppercase">
            Cf. SDO 2018 · Azad 2026 (directional reasoning) · §10 of the project spec
          </span>
          <button
            type="button"
            onClick={() => {
              setModalOpen(true);
            }}
            className="font-mono text-[11px] tracking-chip uppercase px-3.5 py-2 border border-ink text-ink hover:bg-ink hover:text-paper transition-colors cursor-pointer"
          >
            View every assumption →
          </button>
        </div>
      </div>
      <AssumptionsModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
        }}
      />
    </ChapterShell>
  );
}
