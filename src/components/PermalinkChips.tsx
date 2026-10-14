// One-click worldviews at the top of the page. Names and descriptions come from the same
// PRESETS list as the Ch.4 tiles, so a preset is called the same thing everywhere.

import { useStore } from '../store';
import { PRESETS, type PresetId } from '../presets/worldviews';

/** A spread of views, including the neutrality benchmark (Moderate longtermist). */
const CHIP_IDS: PresetId[] = ['ord', 'bostrom', 'near', 'dark'];
const CHIPS = CHIP_IDS.flatMap((id) => {
  const p = PRESETS.find((x) => x.id === id);
  return p ? [{ presetId: id, label: p.name, desc: p.short }] : [];
});

export function PermalinkChips() {
  const activePreset = useStore((s) => s.activePreset);
  const loadPreset = useStore((s) => s.loadPreset);

  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      <span className="font-mono text-[10.5px] text-muted tracking-chip uppercase">
        Start from a worldview →
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
