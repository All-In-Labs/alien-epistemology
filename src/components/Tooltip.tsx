// Lightweight CSS-only tooltip with a small "i" trigger. Hover or focus to open.
//
// Supports rich body content (paragraphs, citation links). Used for spec §10 #8 — primary-source
// links on key controls — and §5.1.5 — the cosmology-selector contested-premise note.

import { useId } from 'react';
import type { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  triggerLabel?: string;
}

export function Tooltip({ children, triggerLabel = 'i' }: TooltipProps) {
  const id = useId();
  return (
    <span className="relative inline-flex group align-middle">
      <button
        type="button"
        aria-describedby={id}
        className="w-4 h-4 rounded-full border border-muted text-muted text-[9px] font-mono leading-none flex items-center justify-center cursor-help bg-transparent hover:bg-ink hover:text-paper hover:border-ink transition-colors"
      >
        {triggerLabel}
      </button>
      <span
        id={id}
        role="tooltip"
        className="absolute left-1/2 top-full z-20 hidden group-hover:block group-focus-within:block mt-2 -translate-x-1/2 w-[320px] bg-ink text-paper px-3.5 py-3 font-serif text-[13px] leading-[1.45] shadow-lg pointer-events-auto"
      >
        {children}
      </span>
    </span>
  );
}
