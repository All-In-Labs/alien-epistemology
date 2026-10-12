// Five pre-baked "lightning-talk" permalink chips. Each maps to a preset that
// loads a fully-configured worldview state — useful for live-demo navigation
// without dragging sliders.

import { useStore } from '../store';

interface ChipDef {
  presetId: 'bostrom' | 'near' | 'hanson' | 'max-aliens' | 'min-aliens';
  label: string;
  desc: string;
}

const CHIPS: ChipDef[] = [
  { presetId: 'bostrom', label: 'Strong longtermist', desc: 'long-term, total-view' },
  { presetId: 'near', label: 'Neartermist view', desc: 'person-affecting, 3% disc.' },
  { presetId: 'hanson', label: 'Filter pessimist', desc: 'filter likely ahead' },
  { presetId: 'max-aliens', label: 'Maximum-aliens', desc: 'every dial toward "rules"' },
  { presetId: 'min-aliens', label: 'Minimum-aliens', desc: 'every dial toward "catastrophic"' },
];

export function PermalinkChips() {
  const activePreset = useStore((s) => s.activePreset);
  const loadPreset = useStore((s) => s.loadPreset);

  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      <span className="font-mono text-[10.5px] text-muted tracking-chip uppercase">
        Jump to →
      </span>
      {CHIPS.map((c) => {
        const active = activePreset === c.presetId;
        return (
          <button
            key={c.presetId}
            type="button"
            aria-label={`${c.label} — ${c.desc}`}
            onClick={() => {
              loadPreset(c.presetId);
            }}
            className="px-3 py-2 border border-ink cursor-pointer flex items-baseline gap-2 font-sans text-[12.5px] transition-colors"
            style={{
              background: active ? '#1f1d18' : 'transparent',
              color: active ? '#faf6ec' : '#1f1d18',
            }}
          >
            <span style={{ fontWeight: 600 }}>{c.label}</span>
            <span className="font-serif italic text-[11.5px] opacity-75">{c.desc}</span>
          </button>
        );
      })}
    </div>
  );
}
