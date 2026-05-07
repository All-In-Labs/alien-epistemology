interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex border border-edge rounded-md overflow-hidden bg-white"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={o.disabled}
            onClick={() => {
              onChange(o.value);
            }}
            className="px-3 py-1.5 font-sans text-[12.5px] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-r border-edge last:border-r-0"
            style={{
              background: active ? '#1f1d18' : 'transparent',
              color: active ? '#fff' : '#1f1d18',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
