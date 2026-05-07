// A two-thumb range slider for log-uniform Drake parameters.
// Renders a track with two draggable thumbs (low and high bound), with the
// active band highlighted between them. Accepts log-or-linear distribution and
// formats endpoint labels with scientific notation when appropriate.

import { useCallback, useId } from 'react';
import { Sparkline } from '../charts/Sparkline';

interface LogRangeSliderProps {
  symbol: string;
  label: string;
  /** Allowed slider range — should span more than the param's defaults. */
  rangeMin: number;
  rangeMax: number;
  /** Current low-side value. */
  loValue: number;
  /** Current high-side value. */
  hiValue: number;
  /** Hard floor; lo below this triggers warn styling. */
  floor?: number | undefined;
  distribution: 'log-uniform' | 'linear-uniform';
  preview: number[];
  onChange: (lo: number, hi: number) => void;
}

function formatBound(v: number): string {
  if (v === 0) return '0';
  const abs = Math.abs(v);
  if (abs >= 1e6 || abs < 1e-2) {
    const exp = Math.floor(Math.log10(abs));
    const mantissa = v / Math.pow(10, exp);
    if (Math.abs(mantissa - 1) < 0.05) return `10${supScript(exp)}`;
    return `${mantissa.toFixed(1)}×10${supScript(exp)}`;
  }
  if (abs >= 100) return v.toFixed(0);
  if (abs >= 1) return v.toFixed(2).replace(/\.?0+$/, '');
  return v.toFixed(3).replace(/\.?0+$/, '');
}

function supScript(n: number): string {
  const map: Record<string, string> = {
    '-': '⁻',
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
  };
  return String(n)
    .split('')
    .map((c) => map[c] ?? c)
    .join('');
}

export function LogRangeSlider({
  symbol,
  label,
  rangeMin,
  rangeMax,
  loValue,
  hiValue,
  floor,
  distribution,
  preview,
  onChange,
}: LogRangeSliderProps) {
  const id = useId();

  // Map between user value space and the [0, 1] slider position.
  const valueToFrac = useCallback(
    (v: number): number => {
      if (distribution === 'log-uniform') {
        const lo = Math.log10(rangeMin);
        const hi = Math.log10(rangeMax);
        return (Math.log10(Math.max(v, rangeMin)) - lo) / (hi - lo);
      }
      return (v - rangeMin) / (rangeMax - rangeMin);
    },
    [distribution, rangeMin, rangeMax],
  );

  const fracToValue = useCallback(
    (f: number): number => {
      const t = Math.max(0, Math.min(1, f));
      if (distribution === 'log-uniform') {
        const lo = Math.log10(rangeMin);
        const hi = Math.log10(rangeMax);
        return Math.pow(10, lo + t * (hi - lo));
      }
      return rangeMin + t * (rangeMax - rangeMin);
    },
    [distribution, rangeMin, rangeMax],
  );

  const loFrac = valueToFrac(loValue);
  const hiFrac = valueToFrac(hiValue);
  const warn = floor !== undefined && loValue < floor;

  const stepSize = 0.001; // 0.1% of slider range
  const handleLoChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const f = Number(e.target.value);
    const newLo = fracToValue(f);
    const newHi = newLo > hiValue ? newLo : hiValue;
    onChange(newLo, newHi);
  };
  const handleHiChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const f = Number(e.target.value);
    const newHi = fracToValue(f);
    const newLo = newHi < loValue ? newHi : loValue;
    onChange(newLo, newHi);
  };

  return (
    <div className="grid grid-cols-[180px_1fr_220px] gap-6 items-center py-3.5 border-b border-edge">
      <div className="flex items-baseline gap-2.5">
        <span className="font-serif italic text-[22px] text-ink">{symbol}</span>
        <span className="font-sans text-[13px] text-muted">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`font-mono text-[11px] w-[60px] text-right ${warn ? 'text-accent' : 'text-muted'}`}
        >
          {formatBound(loValue)}
        </span>
        <div className="flex-1 h-2.5 relative" style={{ background: '#ece6d3' }}>
          <div
            className="absolute top-0 h-full"
            style={{
              left: `${(loFrac * 100).toString()}%`,
              width: `${((hiFrac - loFrac) * 100).toString()}%`,
              background: '#1f1d18',
            }}
          />
          <input
            id={`${id}-lo`}
            aria-label={`${label} minimum`}
            type="range"
            min={0}
            max={1}
            step={stepSize}
            value={loFrac}
            onChange={handleLoChange}
            className="absolute inset-0 w-full opacity-0 cursor-pointer pointer-events-auto"
            style={{ height: '24px', top: '-7px' }}
          />
          <input
            id={`${id}-hi`}
            aria-label={`${label} maximum`}
            type="range"
            min={0}
            max={1}
            step={stepSize}
            value={hiFrac}
            onChange={handleHiChange}
            className="absolute inset-0 w-full opacity-0 cursor-pointer pointer-events-auto"
            style={{ height: '24px', top: '-7px' }}
          />
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              left: `calc(${(loFrac * 100).toString()}% - 1px)`,
              top: '-4px',
              width: '2px',
              height: '18px',
              background: warn ? '#c2410c' : '#c2410c',
            }}
          />
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              left: `calc(${(hiFrac * 100).toString()}% - 1px)`,
              top: '-4px',
              width: '2px',
              height: '18px',
              background: '#c2410c',
            }}
          />
        </div>
        <span className="font-mono text-[11px] text-muted w-[60px]">{formatBound(hiValue)}</span>
      </div>
      <div className="flex justify-end">
        <Sparkline values={preview} w={200} h={32} stroke="#1f1d18" fill="rgba(31,29,24,0.10)" />
      </div>
    </div>
  );
}
