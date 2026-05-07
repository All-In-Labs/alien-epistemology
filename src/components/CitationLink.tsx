import { CITATIONS, type CitationKey } from '../lib/citations';

interface CitationLinkProps {
  cite: CitationKey;
  /** Override link text. Defaults to the citation's label. */
  text?: string;
}

/** Renders an inline anchor styled for tooltip bodies and the colophon footer. */
export function CitationLink({ cite, text }: CitationLinkProps) {
  const c = CITATIONS[cite];
  return (
    <a
      href={c.url}
      target="_blank"
      rel="noopener noreferrer"
      className="underline decoration-dotted underline-offset-2 hover:text-accent transition-colors"
    >
      {text ?? c.label}
    </a>
  );
}
