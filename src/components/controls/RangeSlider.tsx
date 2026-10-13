import type { ReactNode } from 'react';
import { Tooltip } from '../Tooltip';
import { Sym } from '../Sym';

interface RangeSliderProps {
  label: string;
  sym?: string;
  min?: number;
  max?: number;
  step?: number;
  value: number;
  unit?: string;
  warn?: boolean;
  hint?: string;
  onChange: (v: number) => void;
  tooltip?: ReactNode;
}

export function RangeSlider({
  label,
  sym,
  min = 0,
  max = 1,
  step = 0.01,
  value,
  unit = '',
  warn = false,
  hint,
  onChange,
  tooltip,
}: RangeSliderProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          {sym !== undefined && (
            <span className="font-display italic text-[15px] text-ink">
              <Sym s={sym} />
            </span>
          )}
          <span className="font-sans text-[13px] text-ink">{label}</span>
          {tooltip !== undefined && <Tooltip>{tooltip}</Tooltip>}
        </div>
        <span className={`font-mono text-xs ${warn ? 'text-accent' : 'text-ink'}`}>
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          onChange(Number(e.target.value));
        }}
        aria-label={label}
        aria-valuetext={`${String(value)}${unit}`}
        className="w-full"
        style={{ accentColor: warn ? '#2e6a31' : '#1f1d18' }}
      />
      {hint !== undefined && <div className="font-mono text-[10.5px] text-muted">{hint}</div>}
    </div>
  );
}
