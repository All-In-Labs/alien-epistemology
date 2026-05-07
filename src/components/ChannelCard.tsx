import { Toggle } from './controls/Toggle';
import type { ValueChannelId } from '../constants/valueDefaults';

interface ChannelCardProps {
  id: ValueChannelId;
  title: string;
  tag: string;
  sign: '+' | '-' | '±';
  description: string;
  defaultV: string;
  on: boolean;
  onToggle: (v: boolean) => void;
  children?: React.ReactNode;
}

export function ChannelCard({
  id,
  title,
  tag,
  sign,
  description,
  defaultV,
  on,
  onToggle,
  children,
}: ChannelCardProps) {
  return (
    <div className="px-7 py-6 bg-paper border border-ink">
      <div className="flex justify-between items-start gap-4">
        <div>
          <div className="font-mono text-[11px] tracking-eyebrow text-muted uppercase">
            Channel {id} · sign {sign}
          </div>
          <h3
            className="font-display text-2xl mt-2 text-ink"
            style={{ fontWeight: 600, letterSpacing: '-0.01em' }}
          >
            {title}
          </h3>
          <div className="font-mono text-[11px] text-accent mt-1">{tag}</div>
        </div>
        <Toggle on={on} onChange={onToggle} label={`Channel ${id}`} />
      </div>
      <p className="font-serif text-[14.5px] leading-[1.55] text-ink mt-3.5">{description}</p>
      {children}
      <div
        className="font-mono text-[11px] text-muted mt-3 pt-3 flex justify-between"
        style={{ borderTop: '1px dashed #d8d3c8' }}
      >
        <span>default value</span>
        <span className="text-ink">{defaultV}</span>
      </div>
    </div>
  );
}
