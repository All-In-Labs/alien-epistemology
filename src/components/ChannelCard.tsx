import type { ReactNode } from 'react';
import { Toggle } from './controls/Toggle';
import { Tooltip } from './Tooltip';
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
  tooltip?: ReactNode;
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
  tooltip,
}: ChannelCardProps) {
  return (
    <div className="px-7 py-6 bg-paper border border-ink">
      <div className="flex justify-between items-start gap-4">
        <div>
          <div className="font-mono text-[11px] tracking-eyebrow text-muted uppercase">
            Channel {id} · sign {sign}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <h3
              className="font-subhead text-2xl text-ink"
              style={{ fontWeight: 600, letterSpacing: '-0.01em' }}
            >
              {title}
            </h3>
            {tooltip !== undefined && <Tooltip>{tooltip}</Tooltip>}
          </div>
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
