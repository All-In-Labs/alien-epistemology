import { Segmented } from './controls/Segmented';
import { PermalinkButton } from './PermalinkButton';
import { PermalinkChips } from './PermalinkChips';
import { Tooltip } from './Tooltip';
import { useStore } from '../store';
import type { CosmologyMode } from '../model/monteCarlo';

interface MastheadProps {
  presenter: boolean;
  onTogglePresenter: () => void;
}

export function Masthead({ presenter, onTogglePresenter }: MastheadProps) {
  const cosmology = useStore((s) => s.cosmology);
  const setCosmology = useStore((s) => s.setCosmology);
  const worldview = useStore((s) => s.worldview);
  const patchWorldview = useStore((s) => s.patchWorldview);
  const resetAll = useStore((s) => s.resetAll);

  return (
    <header className="px-20 pt-14 pb-9 border-b border-ink relative">
      <div className="flex justify-between items-center font-mono text-[11px] text-muted tracking-eyebrow uppercase">
        <span>aliens.allinlabs.io · v0.1 draft</span>
        <span className="flex items-center gap-4">
          <button
            type="button"
            onClick={resetAll}
            className="font-mono text-[11px] tracking-eyebrow uppercase text-muted hover:text-accent transition-colors cursor-pointer bg-transparent border-0 p-0"
          >
            Reset all to defaults ↺
          </button>
          <span>a worldview-sensitive analysis</span>
        </span>
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
        <Segmented<CosmologyMode>
          ariaLabel="Cosmological model"
          value={cosmology}
          onChange={setCosmology}
          options={[
            { value: 'sdo', label: 'SDO Drake' },
            { value: 'grabby', label: 'Grabby Aliens' },
            { value: 'hybrid', label: 'Hybrid' },
          ]}
        />
        <span className="font-mono text-[11px] text-muted tracking-chip uppercase flex items-center gap-1.5">
          Cosmological model
          <Tooltip>
            <p>
              <strong>SDO Drake</strong> models stationary, communicating civilisations from
              Sandberg, Drexler &amp; Ord (2018).
            </p>
            <p className="mt-2">
              <strong>Grabby Aliens</strong> (Hanson et al. 2021) models civs as rapidly
              expanding (~25–50% of c). Premises are contested — per Azad (2026) we orbit a
              ~95th-percentile-mass star, which is improbable if low-mass stars host life
              equally.
            </p>
            <p className="mt-2">
              <strong>Hybrid</strong> draws each MC sample from one branch in proportion to
              your worldview&rsquo;s grabby credence.
            </p>
          </Tooltip>
        </span>
        {cosmology === 'hybrid' && (
          <span className="flex items-center gap-2 font-mono text-[11px] text-muted tracking-chip uppercase">
            Mix
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={worldview.grabbyCredence}
              onChange={(e) => {
                patchWorldview({ grabbyCredence: Number(e.target.value) });
              }}
              className="w-[100px]"
              style={{ accentColor: '#c2410c' }}
              aria-label="Grabby credence (hybrid mix)"
            />
            <span className="text-ink normal-case tracking-normal">
              {Math.round(worldview.grabbyCredence * 100)}% grabby
            </span>
          </span>
        )}
        <div className="flex-1" />
        <button
          type="button"
          onClick={onTogglePresenter}
          className="font-mono text-[11px] tracking-chip uppercase px-4 py-2.5 border border-ink bg-transparent text-ink cursor-pointer transition-colors hover:bg-ink hover:text-paper"
          style={{
            background: presenter ? '#c2410c' : 'transparent',
            color: presenter ? '#faf6ec' : '#1f1d18',
            borderColor: presenter ? '#c2410c' : '#1f1d18',
          }}
        >
          {presenter ? 'Exit presenter' : 'Presenter mode (P)'}
        </button>
        <PermalinkButton />
      </div>

      <div className="mt-5 pt-5" style={{ borderTop: '1px dashed #d8d3c8' }}>
        <PermalinkChips />
        <p className="font-serif italic text-[13px] text-muted mt-2.5 max-w-[780px]">
          Pre-loaded permalinks: each loads a fully-configured worldview (Drake bounds, channels,
          dials) and updates the URL hash. For walking an audience between configurations without
          dragging sliders.
        </p>
      </div>
    </header>
  );
}
