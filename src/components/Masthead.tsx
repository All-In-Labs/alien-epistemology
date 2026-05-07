import { useState } from 'react';
import { Segmented } from './controls/Segmented';

export type CosmologyOption = 'sdo' | 'grabby' | 'hybrid';

export function Masthead() {
  const [cosmology, setCosmology] = useState<CosmologyOption>('sdo');

  return (
    <header className="px-20 pt-14 pb-9 border-b border-ink relative">
      <div className="flex justify-between items-center font-mono text-[11px] text-muted tracking-eyebrow uppercase">
        <span>aliens.allinlabs.io · v0.1 draft</span>
        <span>a worldview-sensitive analysis</span>
      </div>

      <div className="font-mono text-[11px] text-accent mt-[18px] tracking-eyebrow uppercase">
        An interactive essay in seven parts
      </div>
      <h1
        className="font-display text-[96px] leading-[0.94] mt-3.5 max-w-[1100px]"
        style={{ letterSpacing: '-0.02em', fontWeight: 600 }}
      >
        Should we fund{' '}
        <em className="font-display italic text-accent" style={{ fontStyle: 'italic' }}>
          alien-finding?
        </em>
      </h1>
      <p className="font-serif text-[21px] leading-[1.45] mt-6 max-w-[840px] text-ink">
        Frank Drake&rsquo;s 1961 equation gives a number; Sandberg, Drexler &amp; Ord&rsquo;s 2018
        reformulation gives a <em>distribution</em>. This tool lets you set its bounds, choose
        detection programmes, weight four value channels and your own worldview &mdash; then asks
        what cost-effectiveness, in GiveWell-bar units, the search comes out at.
      </p>

      <div className="flex gap-6 mt-8 items-center flex-wrap">
        <Segmented<CosmologyOption>
          ariaLabel="Cosmological model"
          value={cosmology}
          onChange={setCosmology}
          options={[
            { value: 'sdo', label: 'SDO Drake' },
            { value: 'grabby', label: 'Grabby Aliens', disabled: true },
            { value: 'hybrid', label: 'Hybrid', disabled: true },
          ]}
        />
        <span className="font-mono text-[11px] text-muted tracking-chip uppercase">
          Cosmological model{' '}
          <span className="text-accent normal-case tracking-normal">(phases 5+)</span>
        </span>
        <div className="flex-1" />
        <button
          type="button"
          disabled
          className="font-mono text-[11px] tracking-chip uppercase px-4 py-2.5 border border-ink bg-transparent text-ink cursor-not-allowed opacity-50"
        >
          Presenter mode (P)
        </button>
        <button
          type="button"
          disabled
          className="font-mono text-[11px] tracking-chip uppercase px-4 py-2.5 bg-ink text-paper border-0 cursor-not-allowed opacity-50"
        >
          Copy permalink ↗
        </button>
      </div>
    </header>
  );
}
