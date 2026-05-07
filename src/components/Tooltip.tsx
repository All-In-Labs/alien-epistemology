// Lightweight CSS-only tooltip with a small "i" trigger. Hover or focus to open.
//
// Visibility is CSS-driven (group-hover / group-focus-within) so the tooltip
// doesn't require client JS to appear. Position is JS-tweaked: on hover/focus
// the trigger's viewport position is measured and the body anchors left/center/
// right to avoid clipping at viewport edges.

import { useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  triggerLabel?: string;
}

type Anchor = 'left' | 'center' | 'right';

const TOOLTIP_HALF_WIDTH = 170; // 320px body + ~10px buffer / 2

function pickAnchor(rect: DOMRect): Anchor {
  const vw = window.innerWidth;
  if (rect.left < TOOLTIP_HALF_WIDTH) return 'left';
  if (vw - rect.right < TOOLTIP_HALF_WIDTH) return 'right';
  return 'center';
}

export function Tooltip({ children, triggerLabel = 'i' }: TooltipProps) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useState<Anchor>('center');

  const updateAnchor = (): void => {
    const el = triggerRef.current;
    if (!el) return;
    setAnchor(pickAnchor(el.getBoundingClientRect()));
  };

  const positionClass =
    anchor === 'center'
      ? 'left-1/2 -translate-x-1/2'
      : anchor === 'left'
        ? 'left-0'
        : 'right-0';

  return (
    <span
      className="relative inline-flex group align-middle"
      onMouseEnter={updateAnchor}
      onFocusCapture={updateAnchor}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-describedby={id}
        className="w-[18px] h-[18px] rounded-full border text-[10px] font-mono leading-none flex items-center justify-center cursor-help bg-transparent transition-colors"
        style={{ borderColor: '#c2410c', color: '#c2410c' }}
      >
        {triggerLabel}
      </button>
      <span
        id={id}
        role="tooltip"
        className={`absolute top-full z-20 hidden group-hover:block group-focus-within:block mt-2 w-[320px] bg-ink text-paper px-3.5 py-3 font-serif text-[13px] leading-[1.45] shadow-lg pointer-events-auto ${positionClass}`}
      >
        {children}
      </span>
    </span>
  );
}
