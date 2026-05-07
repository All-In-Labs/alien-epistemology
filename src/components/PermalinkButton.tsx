import { useState } from 'react';
import { buildHash } from '../lib/permalink';
import { getSerializedState } from '../store';

export function PermalinkButton() {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (): Promise<void> => {
    const hash = buildHash(getSerializedState());
    const url = `${window.location.origin}${window.location.pathname}${hash}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      window.prompt('Copy this URL', url);
    }
  };
  return (
    <button
      type="button"
      onClick={() => {
        void handleCopy();
      }}
      className="font-mono text-[11px] tracking-chip uppercase px-4 py-2.5 bg-ink text-paper border-0 cursor-pointer transition-colors hover:bg-accent"
    >
      {copied ? 'Copied!' : 'Copy permalink ↗'}
    </button>
  );
}
