import type { ReactNode } from 'react';

interface ChapterShellProps {
  num: string;
  eyebrow: string;
  title: string;
  kicker?: string;
  children: ReactNode;
}

export function ChapterShell({ num, eyebrow, title, kicker, children }: ChapterShellProps) {
  return (
    <section
      data-chapter={num}
      className="px-20 pt-14 pb-12 border-t border-ink"
      style={{ scrollSnapAlign: 'start' }}
    >
      <div className="grid grid-cols-[120px_1fr] gap-8 items-baseline">
        <div>
          <div className="font-mono text-[11px] tracking-eyebrow text-muted uppercase">
            Ch. {num}
          </div>
          <div className="font-mono text-[11px] tracking-eyebrow text-accent uppercase mt-1.5">
            {eyebrow}
          </div>
        </div>
        <div>
          <h2
            className="font-display text-[44px] leading-[1.05] m-0 text-ink"
            style={{ fontWeight: 600, letterSpacing: '-0.01em' }}
          >
            {title}
          </h2>
          {kicker !== undefined && (
            <p className="font-serif text-[18px] leading-[1.45] text-muted mt-3.5 max-w-[780px]">
              {kicker}
            </p>
          )}
        </div>
      </div>
      <div className="mt-9">{children}</div>
    </section>
  );
}
