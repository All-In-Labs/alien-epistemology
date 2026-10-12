import { useStore } from '../store';

function fmtPct(p: number): string {
  if (Number.isNaN(p)) return '—';
  // For small probabilities (< 5%) where slider effects can be sub-1%, surface a
  // decimal so users see their changes register.
  const v = p * 100;
  if (v > 0 && v < 5) return `${v.toFixed(1)}%`;
  return `${v.toFixed(0)}%`;
}

export function StatPair() {
  const out = useStore((s) => s.drakeOutput);

  const pZero = out ? fmtPct(out.pNZero) : '—';
  const pGteOne = out ? fmtPct(out.pNGteOne) : '—';
  const pGtOne = out ? fmtPct(out.pNGtOne) : '—';
  const pAnyDetection = out ? fmtPct(out.pAnyDetection) : '—';

  return (
    <div className="border border-ink bg-paper">
      <div className="px-8 pt-3 pb-2 border-b border-edge font-mono text-[10.5px] tracking-chip uppercase text-muted">
        Drake / detection — set in Ch.1–2, not by the worldview dials
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3">
      <div className="px-4 sm:px-8 py-5 lg:py-7 border-b lg:border-b-0 lg:border-r border-ink">
        <div className="font-mono text-[11px] tracking-chip text-muted uppercase">
          P( no other civilisation in the Milky Way )
        </div>
        <div
          className="font-display text-6xl lg:text-[88px] leading-[0.95] mt-3.5 text-ink"
          style={{ fontWeight: 600 }}
        >
          {pZero}
        </div>
        <div className="font-mono text-[11.5px] text-muted mt-2.5">
          P( more than one ): <span className="text-ink">{pGtOne}</span>
        </div>
      </div>
      <div className="px-4 sm:px-8 py-5 lg:py-7 border-b lg:border-b-0 lg:border-r border-ink">
        <div className="font-mono text-[11px] tracking-chip text-muted uppercase">
          P( at least one other civilisation in the Milky Way )
        </div>
        <div
          className="font-display text-6xl lg:text-[88px] leading-[0.95] mt-3.5 text-ink"
          style={{ fontWeight: 600 }}
        >
          {pGteOne}
        </div>
        <div className="font-mono text-[11.5px] text-muted mt-2.5">
          The pairing matters more than either side.
        </div>
      </div>
      <div className="px-4 sm:px-8 py-5 lg:py-7">
        <div className="font-mono text-[11px] tracking-chip text-muted uppercase">
          P( any detection in decade )
        </div>
        <div
          className="font-display text-6xl lg:text-[88px] leading-[0.95] mt-3.5 text-ink"
          style={{ fontWeight: 600 }}
        >
          {pAnyDetection}
        </div>
        <div className="font-mono text-[11.5px] text-muted mt-2.5">
          across enabled programmes · n = 100,000
        </div>
      </div>
      </div>
    </div>
  );
}
