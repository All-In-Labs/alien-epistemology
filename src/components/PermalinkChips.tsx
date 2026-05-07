// Three pre-baked "lightning-talk" permalink chips. Each maps to a preset that
// loads a fully-configured worldview state — useful for live-demo navigation
// without dragging sliders.

import { useStore } from '../store';
import { buildHash } from '../lib/permalink';
import { applyPreset, PRESETS } from '../presets/worldviews';
import { defaultDrakeRanges } from '../model/drake';
import { defaultDetectionState } from '../model/detection';
import { defaultGrabbyState } from '../model/grabby';
import type { SerializedState } from '../lib/permalink';

interface ChipDef {
  presetId: 'bostrom' | 'near' | 'hanson';
  label: string;
  desc: string;
}

const CHIPS: ChipDef[] = [
  { presetId: 'bostrom', label: 'Bostrom view', desc: 'long-term, total-view' },
  { presetId: 'near', label: 'Neartermist view', desc: 'person-affecting, 3% disc.' },
  { presetId: 'hanson', label: 'Hanson Filter view', desc: 'filter likely ahead' },
];

function previewHash(presetId: ChipDef['presetId']): string {
  const preset = PRESETS.find((p) => p.id === presetId);
  if (!preset) return '';
  const { worldview, channels } = applyPreset(preset);
  const state: SerializedState = {
    v: 1,
    drakeRanges: defaultDrakeRanges(),
    methods: defaultDetectionState(),
    channels,
    worldview,
    cosmology: 'sdo',
    grabby: defaultGrabbyState(),
    overrides: {},
  };
  return buildHash(state);
}

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
        const hash = previewHash(c.presetId);
        return (
          <button
            key={c.presetId}
            type="button"
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
            <span className="font-mono text-[10px] opacity-75">{hash.slice(0, 16)}…</span>
          </button>
        );
      })}
    </div>
  );
}
