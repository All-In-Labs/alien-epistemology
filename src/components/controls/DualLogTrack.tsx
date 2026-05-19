// Compact two-thumb log-scale track. Used inside MethodRow's sensitivity column
// to let users adjust per-method sensitivity bounds. Pointer hit-testing routes
// clicks to the closer thumb (same pattern as LogRangeSlider).

import { useCallback, useId, useRef } from 'react';

interface DualLogTrackProps {
  rangeMin: number;
  rangeMax: number;
  loValue: number;
  hiValue: number;
  onChange: (lo: number, hi: number) => void;
  ariaLabelLo: string;
  ariaLabelHi: string;
  /** Track height in px (default 6). */
  height?: number;
  /** Track active-band fill color. */
  fillColor?: string;
}

export function DualLogTrack({
  rangeMin,
  rangeMax,
  loValue,
  hiValue,
  onChange,
  ariaLabelLo,
  ariaLabelHi,
  height = 6,
  fillColor = '#2e6a31',
}: DualLogTrackProps) {
  const id = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<'lo' | 'hi' | null>(null);

  const valueToFrac = useCallback(
    (v: number): number => {
      const lo = Math.log10(rangeMin);
      const hi = Math.log10(rangeMax);
      return (Math.log10(Math.max(v, rangeMin)) - lo) / (hi - lo);
    },
    [rangeMin, rangeMax],
  );

  const fracToValue = useCallback(
    (f: number): number => {
      const t = Math.max(0, Math.min(1, f));
      const lo = Math.log10(rangeMin);
      const hi = Math.log10(rangeMax);
      return Math.pow(10, lo + t * (hi - lo));
    },
    [rangeMin, rangeMax],
  );

  const loFrac = valueToFrac(loValue);
  const hiFrac = valueToFrac(hiValue);

  const fracFromPointer = (clientX: number): number => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const updateFor = (which: 'lo' | 'hi', f: number): void => {
    const v = fracToValue(f);
    if (which === 'lo') onChange(v, Math.max(v, hiValue));
    else onChange(Math.min(loValue, v), v);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
    const f = fracFromPointer(e.clientX);
    const which: 'lo' | 'hi' = Math.abs(f - loFrac) <= Math.abs(f - hiFrac) ? 'lo' : 'hi';
    draggingRef.current = which;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFor(which, f);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (draggingRef.current === null) return;
    updateFor(draggingRef.current, fracFromPointer(e.clientX));
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>): void => {
    draggingRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div
      ref={trackRef}
      className="relative cursor-pointer touch-none"
      style={{ background: '#ece6d3', height: `${height.toString()}px` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className="absolute top-0 h-full pointer-events-none"
        style={{
          left: `${(loFrac * 100).toString()}%`,
          width: `${((hiFrac - loFrac) * 100).toString()}%`,
          background: fillColor,
        }}
      />
      <input
        id={`${id}-lo`}
        aria-label={ariaLabelLo}
        type="range"
        min={0}
        max={1}
        step={0.001}
        value={loFrac}
        onChange={(e) => {
          updateFor('lo', Number(e.target.value));
        }}
        className="absolute inset-0 w-full opacity-0"
        style={{ pointerEvents: 'none' }}
      />
      <input
        id={`${id}-hi`}
        aria-label={ariaLabelHi}
        type="range"
        min={0}
        max={1}
        step={0.001}
        value={hiFrac}
        onChange={(e) => {
          updateFor('hi', Number(e.target.value));
        }}
        className="absolute inset-0 w-full opacity-0"
        style={{ pointerEvents: 'none' }}
      />
    </div>
  );
}
