import { Masthead } from './components/Masthead';
import { StatPair } from './components/StatPair';
import { Ch00Contract } from './components/chapters/Ch00Contract';
import { Ch01Drake } from './components/chapters/Ch01Drake';
import { Ch02Detection } from './components/chapters/Ch02Detection';
import { Ch03Value } from './components/chapters/Ch03Value';
import { useDrakeMCRunner } from './hooks/useDrakeMCRunner';

export default function App() {
  useDrakeMCRunner();
  return (
    <div className="bg-bg text-ink min-h-screen font-serif">
      <Masthead />
      <section className="px-20 pt-12 pb-3">
        <StatPair />
        <p className="font-serif italic text-[14px] text-muted mt-3.5 max-w-[840px]">
          The pairing matters more than either individual stat.{' '}
          <span className="text-ink not-italic">&ldquo;We are probably alone&rdquo;</span> and{' '}
          <span className="text-ink not-italic">&ldquo;we probably are not&rdquo;</span> are equally
          valid framings of the same Monte Carlo result.
        </p>
      </section>
      <Ch00Contract />
      <Ch01Drake />
      <Ch02Detection />
      <Ch03Value />
      <footer className="px-20 py-12 border-t border-ink font-mono text-[11px] text-muted tracking-chip uppercase flex justify-between">
        <span>Sources · SDO 2018 · Bostrom 2003 · Hanson 2021 · Ord 2020 · Azad 2026</span>
        <span>Phase 3 of 7 — Value channels</span>
      </footer>
    </div>
  );
}
