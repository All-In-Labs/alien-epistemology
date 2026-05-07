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
}: RangeSliderProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          {sym !== undefined && (
            <span className="font-serif italic text-[15px] text-ink">{sym}</span>
          )}
          <span className="font-sans text-[13px] text-ink">{label}</span>
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
        className="w-full"
        style={{ accentColor: warn ? '#c2410c' : '#1f1d18' }}
      />
      {hint !== undefined && <div className="font-mono text-[10.5px] text-muted">{hint}</div>}
    </div>
  );
}
