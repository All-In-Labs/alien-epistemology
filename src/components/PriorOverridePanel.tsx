import { Toggle } from './controls/Toggle';
import { Tooltip } from './Tooltip';
import { CitationLink } from './CitationLink';
import { useStore } from '../store';

export function PriorOverridePanel() {
  const overrides = useStore((s) => s.overrides);
  const patchOverrides = useStore((s) => s.patchOverrides);

  const pNGteOneOn = overrides.overridePNGteOne !== undefined;
  const detectionFloorOn = overrides.detectionFloor !== undefined;

  return (
    <div className="bg-paper border border-ink px-7 py-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="font-mono text-[11px] text-muted tracking-chip uppercase">
          Advanced · Bayesian-shortcut prior overrides
        </div>
        <Tooltip>
          <p>
            A &ldquo;Bayesian shortcut&rdquo; lets you set the posterior directly rather than
            asking the model to derive it from the Drake parameters. Useful if you weight
            evidence (UAP reports, theological arguments, anthropic considerations) the model
            doesn&rsquo;t cover.
          </p>
          <p className="mt-2">
            Per <CitationLink cite="azad2026" text="Azad 2026" /> on directional reasoning:
            conditional probabilities have direction. The tool computes EV <em>given</em> a
            prior; the prior is yours.
          </p>
        </Tooltip>
      </div>
      <p className="font-serif italic text-[13.5px] text-muted mt-1 max-w-[780px] mb-3">
        For users who weight evidence outside the Drake parameters &mdash; e.g. those who
        take UAP observations as evidence of alien presence. The tool computes EV{' '}
        <em>given</em> a prior; the prior is yours to pick. (Cf. Azad 2026 on directional
        reasoning.)
      </p>
      <p className="font-serif italic text-[12.5px] text-muted mt-1 max-w-[780px] mb-5">
        For the &ldquo;they&rsquo;re already here&rdquo; scenario, combine both: set{' '}
        <span className="text-ink not-italic">P(≥1 alien civ)</span> high <em>and</em> raise the{' '}
        <span className="text-ink not-italic">detection sensitivity floor</span>. The first
        decides whether they exist; the second decides how visible they are. One alone barely
        moves the verdict.
      </p>

      <div className="border-t border-edge pt-4 pb-4">
        <div className="flex items-baseline justify-between mb-2.5">
          <div>
            <div className="font-sans text-[13px] font-semibold text-ink">
              Override P( ≥ 1 alien civ in Milky Way )
            </div>
            <div className="font-mono text-[10.5px] text-muted">
              Bypasses the Drake equation for the partition stat.
            </div>
          </div>
          <Toggle
            on={pNGteOneOn}
            onChange={(v) => {
              patchOverrides({ overridePNGteOne: v ? 0.5 : undefined });
            }}
            label="Override P(N≥1)"
          />
        </div>
        {pNGteOneOn && (
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={overrides.overridePNGteOne ?? 0.5}
              onChange={(e) => {
                patchOverrides({ overridePNGteOne: Number(e.target.value) });
              }}
              className="flex-1"
              aria-label="Override P(N≥1) value"
            />
            <span className="font-mono text-xs text-ink w-12 text-right">
              {((overrides.overridePNGteOne ?? 0.5) * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-edge pt-4">
        <div className="flex items-baseline justify-between mb-2.5">
          <div>
            <div className="font-sans text-[13px] font-semibold text-ink">
              Detection sensitivity floor
            </div>
            <div className="font-mono text-[10.5px] text-muted">
              Ensures P( detection | aliens exist ) ≥ floor.
            </div>
          </div>
          <Toggle
            on={detectionFloorOn}
            onChange={(v) => {
              patchOverrides({ detectionFloor: v ? 0.1 : undefined });
            }}
            label="Detection floor"
          />
        </div>
        {detectionFloorOn && (
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={overrides.detectionFloor ?? 0.1}
              onChange={(e) => {
                patchOverrides({ detectionFloor: Number(e.target.value) });
              }}
              className="flex-1"
              aria-label="Detection floor value"
            />
            <span className="font-mono text-xs text-ink w-12 text-right">
              {((overrides.detectionFloor ?? 0.1) * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
