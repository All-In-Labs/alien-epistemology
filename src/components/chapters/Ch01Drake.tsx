import { useMemo } from 'react';
import { ChapterShell } from '../ChapterShell';
import { LogRangeSlider } from '../controls/LogRangeSlider';
import { useStore } from '../../store';
import {
  DRAKE_DEFAULTS,
  DRAKE_PARAM_ORDER,
  type DrakeParamId,
} from '../../constants/defaults';
import { makeRng } from '../../lib/rng';
import { logUniform, linearUniform } from '../../lib/sampling';
import { binLog10 } from '../../lib/binning';
import type { DrakeRanges } from '../../model/drake';
import type { ReactNode } from 'react';
import { CitationLink } from '../CitationLink';

const PREVIEW_SAMPLES = 1000;
const PREVIEW_BINS = 32;

// For a single parameter, return a small histogram of its sampled distribution
// over the chosen bounds — used for the inline sparkline preview.
function previewFor(id: DrakeParamId, lo: number, hi: number): number[] {
  if (lo <= 0 || hi <= 0 || hi <= lo) return new Array<number>(PREVIEW_BINS).fill(0);
  const cfg = DRAKE_DEFAULTS[id];
  const rng = makeRng(`preview-${id}-${lo.toString()}-${hi.toString()}`);
  const samples = new Float64Array(PREVIEW_SAMPLES);
  for (let i = 0; i < PREVIEW_SAMPLES; i++) {
    samples[i] =
      cfg.distribution === 'log-uniform' ? logUniform(rng, lo, hi) : linearUniform(rng, lo, hi);
  }
  if (cfg.distribution === 'linear-uniform') {
    // Linear bin into nBins slots
    const bins = new Array<number>(PREVIEW_BINS).fill(0);
    for (const v of samples) {
      const t = Math.max(0, Math.min(0.999999, (v - lo) / (hi - lo)));
      const idx = Math.floor(t * PREVIEW_BINS);
      bins[idx] = (bins[idx] ?? 0) + 1;
    }
    return bins;
  }
  return binLog10(samples, Math.log10(lo), Math.log10(hi), PREVIEW_BINS);
}

// Generous slider range — wider than the param's defaults so users can explore.
// Capped at the parameter's ceiling (1.0 for fractions) so users can't drag the
// upper bound into mathematically impossible territory.
function sliderRange(id: DrakeParamId): [number, number] {
  const cfg = DRAKE_DEFAULTS[id];
  if (cfg.distribution === 'linear-uniform') return [0, cfg.ceiling ?? 1];
  const lo = cfg.defaults.min / 10;
  const hi = cfg.defaults.max * 10;
  const cappedHi = cfg.ceiling !== undefined ? Math.min(hi, cfg.ceiling) : hi;
  return [Math.max(lo, 1e-40), cappedHi];
}

function buildPreviews(ranges: DrakeRanges): Record<DrakeParamId, number[]> {
  return {
    R: previewFor('R', ranges.R.min, ranges.R.max),
    fp: previewFor('fp', ranges.fp.min, ranges.fp.max),
    ne: previewFor('ne', ranges.ne.min, ranges.ne.max),
    fl: previewFor('fl', ranges.fl.min, ranges.fl.max),
    fi: previewFor('fi', ranges.fi.min, ranges.fi.max),
    fc: previewFor('fc', ranges.fc.min, ranges.fc.max),
    L: previewFor('L', ranges.L.min, ranges.L.max),
    fd: previewFor('fd', ranges.fd.min, ranges.fd.max),
  };
}

// Per-parameter primary-source citations (spec §10 #8). Surfaced via Tooltip on
// each parameter's symbol/label.
const TOOLTIPS: Record<DrakeParamId, ReactNode> = {
  R: (
    <p>
      Milky Way star formation rate, in stars per year. Measured at roughly 0.7–1.9 solar masses
      per year (<CitationLink cite="robitailleWhitney2010" text="Robitaille & Whitney 2010" />,{' '}
      <CitationLink cite="licquiaNewman2015" text="Licquia & Newman 2015" />); because most new
      stars are low-mass, that is around 6–7 stars per year. SDO&rsquo;s Table 1 uses 1–100 (
      <CitationLink cite="sdo2018" text="SDO 2018" />).
    </p>
  ),
  fp: (
    <p>
      Fraction of stars hosting planets. Microlensing suggests one or more bound planets per star
      on average (<CitationLink cite="cassan2012" text="Cassan et al. 2012" />).
    </p>
  ),
  ne: (
    <p>
      Habitable planets per system. Kepler finds roughly 0.37–0.60 rocky habitable-zone planets per
      Sun-like star (<CitationLink cite="bryson2021" text="Bryson et al. 2021" />; earlier,{' '}
      <CitationLink cite="petigura2013" text="Petigura et al. 2013" /> found 11 ± 4% for Earth-size
      planets at 1–4× Earth&rsquo;s insolation). Sun-like stars are a minority; most stars counted
      in R* are M dwarfs.
    </p>
  ),
  fl: (
    <p>
      Fraction of habitable planets where life arises. Genuine wide uncertainty — this is the
      single biggest spread in the model. The default log-uniform 10⁻³⁰–1 is this tool&rsquo;s
      choice: <CitationLink cite="sdo2018" text="SDO 2018 §3.1" /> instead model fₗ = 1 −
      e<sup>−λVt</sup> with λVt log-normal (median 1, ~50 orders of magnitude wide), which puts
      fₗ near 1 about half the time.
    </p>
  ),
  fi: (
    <p>
      Fraction of life-bearing planets where intelligence emerges. Wide and contested.{' '}
      <CitationLink cite="sdo2018" text="SDO 2018 §3.1, Table 1" />.
    </p>
  ),
  fc: (
    <p>
      Fraction of intelligent species that emit detectable signals. Wide.{' '}
      <CitationLink cite="sdo2018" text="SDO 2018 Table 1" />.
    </p>
  ),
  L: (
    <p>
      Average lifetime of a communicating civilisation. Bounds span &ldquo;short-lived&rdquo;
      (centuries) to &ldquo;galactic-timescale&rdquo; (10¹⁰ yr).{' '}
      <CitationLink cite="sdo2018" text="SDO 2018 Table 1" />.
    </p>
  ),
  fd: (
    <p>
      Detection-readiness multiplier — fraction of existing civs whose signals/biosignatures are
      detectable in principle by current human technology. Folds detectability into Drake. Spec
      §5.1.
    </p>
  ),
};

export function Ch01Drake() {
  const drakeRanges = useStore((s) => s.drakeRanges);
  const setDrakeRange = useStore((s) => s.setDrakeRange);
  const resetDrakeRanges = useStore((s) => s.resetDrakeRanges);
  const astroLocked = useStore((s) => s.astroLocked);
  const toggleAstroLock = useStore((s) => s.toggleAstroLock);
  const previews = useMemo(() => buildPreviews(drakeRanges), [drakeRanges]);

  return (
    <ChapterShell
      num="01"
      eyebrow="The equation"
      title="Seven uncertain factors, one log-uniform multiplication."
      kicker="Each parameter is sampled from a log-uniform distribution between bounds you set. Astrophysical parameters have established lower bounds; the tool nudges you to respect them. The speculative parameters fₗ, fᵢ, f_c, L are wide on purpose — that is the SDO finding."
    >
      <div className="bg-paper border border-ink px-7 py-2">
        {DRAKE_PARAM_ORDER.map((id) => {
          const cfg = DRAKE_DEFAULTS[id];
          const range = drakeRanges[id];
          const [rangeMin, rangeMax] = sliderRange(id);
          // Astrophysical params (R*, fp, ne) become read-only when locked.
          const isAstro = id === 'R' || id === 'fp' || id === 'ne';
          return (
            <LogRangeSlider
              key={id}
              symbol={cfg.symbol}
              label={cfg.label}
              rangeMin={rangeMin}
              rangeMax={rangeMax}
              loValue={range.min}
              hiValue={range.max}
              floor={cfg.floor}
              distribution={cfg.distribution}
              preview={previews[id]}
              onChange={(lo, hi) => {
                setDrakeRange(id, { min: lo, max: hi });
              }}
              disabled={astroLocked && isAstro}
              tooltip={TOOLTIPS[id]}
            />
          );
        })}
      </div>
      <div className="flex gap-3 mt-4 font-mono text-[11px] text-muted tracking-chip uppercase items-center">
        <button
          type="button"
          onClick={toggleAstroLock}
          aria-pressed={astroLocked}
          className="px-3.5 py-2 border cursor-pointer transition-colors"
          style={{
            background: astroLocked ? '#1f1d18' : 'transparent',
            color: astroLocked ? '#faf6ec' : '#1f1d18',
            borderColor: '#1f1d18',
          }}
        >
          {astroLocked ? '✓ Astrophysical params locked' : 'Lock astrophysical params'}
        </button>
        <button
          type="button"
          onClick={() => {
            resetDrakeRanges();
          }}
          className="px-3.5 py-2 bg-transparent border border-ink text-ink cursor-pointer hover:bg-ink hover:text-paper transition-colors"
        >
          Reset to defaults
        </button>
        <div className="flex-1" />
        <span>Distribution previews update on slider release</span>
      </div>
    </ChapterShell>
  );
}
