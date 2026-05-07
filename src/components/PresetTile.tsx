import type { Preset } from '../presets/worldviews';

interface PresetTileProps {
  preset: Preset;
  active: boolean;
  onClick: () => void;
}

export function PresetTile({ preset, active, onClick }: PresetTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left px-4 py-3.5 border border-ink cursor-pointer transition-colors"
      style={{
        background: active ? '#1f1d18' : '#faf6ec',
        color: active ? '#faf6ec' : '#1f1d18',
      }}
    >
      <div className="font-mono text-[10.5px] tracking-chip uppercase opacity-70">preset</div>
      <div className="font-display text-lg mt-1" style={{ fontWeight: 600 }}>
        {preset.name}
      </div>
      <div className="font-serif italic text-[13px] opacity-80 mt-1.5">{preset.short}</div>
    </button>
  );
}
