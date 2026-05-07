import { useCallback, useEffect, useState } from 'react';
import { Masthead } from './components/Masthead';
import { StatPair } from './components/StatPair';
import { Ch00Contract } from './components/chapters/Ch00Contract';
import { Ch01Drake } from './components/chapters/Ch01Drake';
import { Ch02Detection } from './components/chapters/Ch02Detection';
import { Ch03Value } from './components/chapters/Ch03Value';
import { Ch04Worldview } from './components/chapters/Ch04Worldview';
import { Ch05Verdict } from './components/chapters/Ch05Verdict';
import { Ch06Tornado } from './components/chapters/Ch06Tornado';
import { PriorOverridePanel } from './components/PriorOverridePanel';
import { PresenterBar } from './components/PresenterBar';
import { useDrakeMCRunner } from './hooks/useDrakeMCRunner';
import { usePermalink } from './hooks/usePermalink';

// Anchor ids for presenter-mode keyboard scroll. Each chapter renders a wrapper
// section with a matching id; the keyboard handler scrolls between them.
const ANCHORS = [
  { id: 'masthead', title: 'Masthead' },
  { id: 'ch-00', title: 'How to read this' },
  { id: 'ch-01', title: 'The equation' },
  { id: 'ch-02', title: 'The instruments' },
  { id: 'ch-03', title: 'What detection is worth' },
  { id: 'ch-04', title: 'Your axioms' },
  { id: 'ch-05', title: 'The verdict' },
  { id: 'ch-06', title: 'What changes the answer most?' },
];

const CHAPTER_TITLES = ANCHORS.map((a) => a.title);

export default function App() {
  useDrakeMCRunner();
  usePermalink();
  const [presenter, setPresenter] = useState(false);
  const [chapterIdx, setChapterIdx] = useState(0);

  const togglePresenter = useCallback(() => {
    setPresenter((v) => !v);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePresenter();
        return;
      }
      if (presenter && e.key === 'Escape') {
        e.preventDefault();
        setPresenter(false);
        return;
      }
      if (!presenter) return;
      const scrollTo = (idx: number): void => {
        const anchor = ANCHORS[idx];
        if (!anchor) return;
        document
          .getElementById(anchor.id)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        setChapterIdx((i) => {
          const next = Math.min(i + 1, ANCHORS.length - 1);
          scrollTo(next);
          return next;
        });
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setChapterIdx((i) => {
          const next = Math.max(i - 1, 0);
          scrollTo(next);
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [presenter, togglePresenter]);

  return (
    <div
      className="bg-bg text-ink min-h-screen font-serif"
      style={{ scrollSnapType: presenter ? 'y mandatory' : 'none' }}
    >
      {presenter && <PresenterBar chapterIdx={chapterIdx} chapterTitles={CHAPTER_TITLES} />}
      <div id="masthead">
        <Masthead presenter={presenter} onTogglePresenter={togglePresenter} />
      </div>
      <section className="px-20 pt-12 pb-3">
        <StatPair />
        <p className="font-serif italic text-[14px] text-muted mt-3.5 max-w-[840px]">
          The pairing matters more than either individual stat.{' '}
          <span className="text-ink not-italic">&ldquo;We are probably alone&rdquo;</span> and{' '}
          <span className="text-ink not-italic">&ldquo;we probably are not&rdquo;</span> are equally
          valid framings of the same Monte Carlo result.
        </p>
      </section>
      <div id="ch-00">
        <Ch00Contract />
      </div>
      <div id="ch-01">
        <Ch01Drake />
      </div>
      <div id="ch-02">
        <Ch02Detection />
      </div>
      <div id="ch-03">
        <Ch03Value />
      </div>
      <div id="ch-04">
        <Ch04Worldview />
      </div>
      <section id="prior-overrides" className="px-20 py-10 border-t border-ink">
        <PriorOverridePanel />
      </section>
      <div id="ch-05">
        <Ch05Verdict />
      </div>
      <div id="ch-06">
        <Ch06Tornado />
      </div>
      <footer className="px-20 py-12 border-t border-ink font-mono text-[11px] text-muted tracking-chip uppercase flex justify-between">
        <span>Sources · SDO 2018 · Bostrom 2003 · Hanson 2021 · Ord 2020 · Azad 2026</span>
        <span>
          Worldview-diversified · no worldview privileged · no defaults flatter the conclusion
        </span>
      </footer>
    </div>
  );
}
