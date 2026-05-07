import { useStore } from '../store';
import { percentile } from '../lib/binning';

function fmtPct(p: number): string {
  if (Number.isNaN(p)) return '—';
  return `${(p * 100).toFixed(0)}%`;
}

function pctileBand(samples: Float64Array, op: '<' | '>='): string {
  if (samples.length === 0) return '—';
  // Empirical 5/95 percentile of the indicator (boolean) is just bounds at the threshold;
  // we report the 5th–95th percentile of N here as a sanity figure rather than the indicator's
  // CI which would always equal the point estimate. For first paint this is illustrative.
  const lo = percentile(samples, 0.05);
  const hi = percentile(samples, 0.95);
  if (op === '<') {
    return `5th–95th: ${lo.toExponential(1)} – ${hi.toExponential(1)}`;
  }
  return `5th–95th: ${lo.toExponential(1)} – ${hi.toExponential(1)}`;
}

export function StatPair() {
  const out = useStore((s) => s.drakeOutput);

  const pZero = out ? fmtPct(out.pNZero) : '—';
  const pGteOne = out ? fmtPct(out.pNGteOne) : '—';
  const pGtOne = out ? fmtPct(out.pNGtOne) : '—';
  const detail = out ? pctileBand(out.samples, '>=') : '';

  return (
    <div className="grid grid-cols-2 border border-ink bg-paper">
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
        <div className="font-mono text-[11.5px] text-muted mt-2.5">{detail || '—'}</div>
      </div>
      <div className="px-8 py-7">
        <div className="font-mono text-[11px] tracking-chip text-muted uppercase">
          P( at least one other civilisation in the Milky Way )
        </div>
        <div
          className="font-display text-[88px] leading-[0.95] mt-3.5 text-ink"
          style={{ fontWeight: 600 }}
        >
          {pGteOne}
        </div>
        <div className="font-mono text-[11.5px] text-muted mt-2.5">{detail || '—'}</div>
      </div>
      <div className="col-span-2 border-t border-ink px-8 py-3.5 flex justify-between font-mono text-[11.5px] text-muted">
        <span>
          P( more than one ) — surfacing the Poisson tail —{' '}
          <span className="text-ink">{pGtOne}</span>
        </span>
        <span>n = 100,000 Monte Carlo samples · debounced 150 ms</span>
      </div>
    </div>
  );
}
