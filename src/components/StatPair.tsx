import { useStore } from '../store';

function fmtPct(p: number): string {
  if (Number.isNaN(p)) return '—';
  return `${(p * 100).toFixed(0)}%`;
}

export function StatPair() {
  const out = useStore((s) => s.drakeOutput);

  const pZero = out ? fmtPct(out.pNZero) : '—';
  const pGteOne = out ? fmtPct(out.pNGteOne) : '—';
  const pGtOne = out ? fmtPct(out.pNGtOne) : '—';
  const pAnyDetection = out ? fmtPct(out.pAnyDetection) : '—';

  return (
    <div className="grid grid-cols-3 border border-ink bg-paper">
      <div className="px-8 py-7 border-r border-ink">
        <div className="font-mono text-[11px] tracking-chip text-muted uppercase">
          P( no other civilisation in the Milky Way )
        </div>
        <div
          className="font-display text-[88px] leading-[0.95] mt-3.5 text-ink"
          style={{ fontWeight: 600 }}
        >
          {pZero}
        </div>
        <div className="font-mono text-[11.5px] text-muted mt-2.5">
          P( more than one ): <span className="text-ink">{pGtOne}</span>
        </div>
      </div>
      <div className="px-8 py-7 border-r border-ink">
        <div className="font-mono text-[11px] tracking-chip text-muted uppercase">
          P( at least one other civilisation in the Milky Way )
        </div>
        <div
          className="font-display text-[88px] leading-[0.95] mt-3.5 text-ink"
          style={{ fontWeight: 600 }}
        >
          {pGteOne}
        </div>
        <div className="font-mono text-[11.5px] text-muted mt-2.5">
          The pairing matters more than either side.
        </div>
      </div>
      <div className="px-8 py-7">
        <div className="font-mono text-[11px] tracking-chip text-muted uppercase">
          P( any detection in decade )
        </div>
        <div
          className="font-display text-[88px] leading-[0.95] mt-3.5 text-ink"
          style={{ fontWeight: 600 }}
        >
          {pAnyDetection}
        </div>
        <div className="font-mono text-[11.5px] text-muted mt-2.5">
          across enabled programmes · n = 100,000
        </div>
      </div>
    </div>
  );
}
