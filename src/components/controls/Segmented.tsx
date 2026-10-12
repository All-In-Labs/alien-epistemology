import { useRef } from 'react';
import type { KeyboardEvent } from 'react';

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

/**
 * A radio group drawn as joined buttons. Keyboard behaviour follows the ARIA radio-group
 * pattern: one tab stop (the selected option), arrow keys move and select, Home/End jump.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (from: number, step: number): void => {
    const n = options.length;
    for (let k = 1; k <= n; k++) {
      const i = (((from + step * k) % n) + n) % n;
      const o = options[i];
      if (o !== undefined && o.disabled !== true) {
        onChange(o.value);
        refs.current[i]?.focus();
        return;
      }
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    const current = Math.max(
      0,
      options.findIndex((o) => o.value === value),
    );
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      move(current, 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      move(current, -1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      move(-1, 1);
    } else if (e.key === 'End') {
      e.preventDefault();
      move(options.length, -1);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className="inline-flex border border-edge rounded-md overflow-hidden bg-white"
    >
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            disabled={o.disabled}
            onClick={() => {
              onChange(o.value);
            }}
            className="px-3 py-1.5 font-sans text-[12.5px] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-r border-edge last:border-r-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-accent"
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
