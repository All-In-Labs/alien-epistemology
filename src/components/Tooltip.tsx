// Lightweight tooltip with a small "i" trigger. Hover or focus to open; tap toggles it,
// since iOS Safari doesn't focus buttons on tap.
//
// Visibility is CSS-driven (group-hover / group-focus-within) so the tooltip
// doesn't require client JS to appear. Position is JS-tweaked: on hover/focus
// the trigger's viewport position is measured and the body is placed (and on
// phones, narrowed) so it stays inside the viewport.

import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  triggerLabel?: string;
}

const TOOLTIP_WIDTH = 320;
const VIEWPORT_MARGIN = 8;

/**
 * Horizontal placement for the tooltip body, in px relative to the trigger's left edge:
 * centred on the trigger where possible, clamped to stay inside the viewport, and
 * narrowed on viewports smaller than the body (phones).
 */
function placement(rect: DOMRect): { left: number; width: number } {
  const vw = window.innerWidth;
  const width = Math.min(TOOLTIP_WIDTH, vw - 2 * VIEWPORT_MARGIN);
  const centred = rect.left + rect.width / 2 - width / 2;
  const clamped = Math.max(VIEWPORT_MARGIN, Math.min(vw - width - VIEWPORT_MARGIN, centred));
  return { left: clamped - rect.left, width };
}

export function Tooltip({ children, triggerLabel = 'i' }: TooltipProps) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent): void => {
      if (rootRef.current?.contains(e.target as Node) !== true) setOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  const [place, setPlace] = useState<{ left: number; width: number }>({
    left: 9 - TOOLTIP_WIDTH / 2,
    width: TOOLTIP_WIDTH,
  });

  const updatePlacement = (): void => {
    const el = triggerRef.current;
    if (!el) return;
    setPlace(placement(el.getBoundingClientRect()));
  };

  return (
    <span
      ref={rootRef}
      className="relative inline-flex group align-middle"
      onMouseEnter={updatePlacement}
      onFocusCapture={updatePlacement}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-describedby={id}
        aria-label="Explanation"
        aria-expanded={open}
        onClick={() => {
          updatePlacement();
          setOpen((v) => !v);
        }}
        className="w-7 h-7 -m-[5px] flex items-center justify-center cursor-help bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 rounded-full"
        style={{ outlineColor: '#2e6a31' }}
      >
        <span
          aria-hidden
          className="w-[18px] h-[18px] rounded-full border text-[10px] font-mono leading-none flex items-center justify-center"
          style={{ borderColor: '#2e6a31', color: '#2e6a31' }}
        >
          {triggerLabel}
        </span>
      </button>
      {/* The outer span's top padding bridges the gap to the trigger, so the pointer can
          move into the tooltip (to click a citation) without it closing. */}
      <span
        className={`absolute top-full z-20 group-hover:block group-focus-within:block pt-2 pointer-events-auto ${open ? 'block' : 'hidden'}`}
        style={{ left: place.left, width: place.width }}
      >
        <span
          id={id}
          role="tooltip"
          className="block bg-ink text-paper px-3.5 py-3 font-serif text-[13px] leading-[1.45] shadow-lg"
        >
          {children}
        </span>
      </span>
    </span>
  );
}
