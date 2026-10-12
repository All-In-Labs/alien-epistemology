import type { ReactNode } from 'react';
import { Toggle } from './controls/Toggle';
import { DualLogTrack } from './controls/DualLogTrack';
import { Tooltip } from './Tooltip';
import { CitationLink } from './CitationLink';
import { useStore } from '../store';
import type { DetectionMethodState } from '../model/detection';
import {
  DETECTION_DEFAULTS,
  NO_IN_DECADE_DETECTION,
  type DetectionMethodId,
} from '../constants/detectionDefaults';

const METHOD_TOOLTIPS: Record<DetectionMethodId, ReactNode> = {
  seti: (
    <>
      <p>
        <strong>SETI radio.</strong> Breakthrough Listen + Allen Telescope Array; narrow-band radio
        surveys of nearby stars and the galactic plane.
      </p>
      <p className="mt-2">
        For scale: Breakthrough Listen was funded at $100M over 10 years (2015). Costs here are
        marginal additional spend per decade.
      </p>
      <p className="mt-2">
        <strong>Reach 1.5×10⁻⁸–3×10⁻⁴ of the galaxy</strong>, depending on how loud they are,
        out of ~200 billion stars (NASA gives 100&ndash;400 billion:{' '}
        <CitationLink cite="nasaStarCount2015" text="NASA" />
        ). Low end: a transmitter as strong as our Deep Space Network, which an SKA-class array
        could pick up within ~65 light years (
        <CitationLink cite="sheikh2025" text="Sheikh et al. 2025" />) &mdash; about 3,000 stars.
        Earth&rsquo;s everyday leakage (mobile networks) would carry only ~4 light years, which
        reaches no other star. High end: beacons above ~4×10¹⁸ W, visible across the ~60 million
        stars in Breakthrough Listen&rsquo;s galactic-centre beams (
        <CitationLink cite="gajjar2021" text="Gajjar et al. 2021" />
        ). In between: an Arecibo-class transmitter is visible to the Green Bank Telescope out to
        ~127 pc (<CitationLink cite="margot2026" text="Margot 2026" />
        ); nearby-star surveys have covered ~1,300 stars (
        <CitationLink cite="price2020" text="Price et al. 2020" />) and ~288,000 stars in the
        beams (<CitationLink cite="wlodarczykSroka2020" text="Wlodarczyk-Sroka et al. 2020" />
        ).
      </p>
    </>
  ),
  tech: (
    <>
      <p>
        <strong>Technosignature search.</strong> Optical SETI, Dyson-sphere infrared anomalies, NIR
        transit anomalies. Wider net than radio but at different sensitivity. See{' '}
        <CitationLink cite="wright2014" text="Wright et al. 2014 (G-HAT)" />.
      </p>
      <p className="mt-2">
        <strong>Reach 3×10⁻⁸–1.5×10⁻³ of the galaxy.</strong> Low end: Keck&rsquo;s laser search of
        5,600 stars (<CitationLink cite="tellisMarcy2017" text="Tellis & Marcy 2017" />). High
        end: infrared waste-heat searches of ~2.9×10⁸ stars within 5 kpc (
        <CitationLink cite="suazo2022" text="Suazo et al. 2022" />) &mdash; but only a
        civilisation turning much of its star&rsquo;s light into heat would show up.
      </p>
    </>
  ),
  bio: (
    <>
      <p>
        <strong>Biosignature astrobiology.</strong> JWST atmospheric spectroscopy now; the Habitable
        Worlds Observatory is proposed for launch in the 2040s. Detects microbial life via O₂/CH₄
        disequilibria. Channel C and D do not fire under biosig detection (per spec §5.3).
      </p>
      <p className="mt-2">
        It looks for life, not civilisations, so it counts life-bearing planets: R* × fₚ × nₑ ×
        fₗ × ~3 billion years (about how long Earth has had life).{' '}
        <strong>Reach 5×10⁻¹²–5×10⁻¹¹ of the galaxy:</strong> JWST&rsquo;s Rocky Worlds
        programme is observing 9 rocky planets, and it tests whether they have atmospheres, not
        whether they have life (<CitationLink cite="stsciRockyWorlds2025" text="STScI 2025" />
        ). That is ~1&ndash;10 star systems of ~200 billion.
      </p>
    </>
  ),
  probe: (
    <>
      <p>
        <strong>Interstellar probe R&amp;D.</strong> Breakthrough Starshot-style; multi-decade
        payoff. Decadal R&amp;D spend.{' '}
        <CitationLink cite="armstrongSandberg" text="Armstrong & Sandberg 2013" /> on
        probe-feasibility. It cannot detect anything within the decade this model scores: at
        Starshot&rsquo;s target of ~20% of light speed a probe needs ~20 years to reach Alpha
        Centauri, plus 4.4 years for its signal to come back. Funding it here adds cost only.
      </p>
    </>
  ),
  retina: (
    <>
      <p>
        <strong>RETINA passive radar.</strong> Multistatic passive radar reusing terrestrial
        broadcast illumination — much cheaper than active scanning. Built for aircraft detection, so
        it can only see artefacts that enter the airspace its transmitters illuminate.
      </p>
      <p className="mt-2">
        <strong>Reach 10⁻¹²–10⁻⁶: a guess, with no published source.</strong> Since it sees only
        our own airspace, its reach is the share of civilisations with an artefact here this
        decade. The top of the range is as if a typical civilisation had probes near one star in
        a million. If you think they&rsquo;re already here, use the prior overrides after Ch.4.
      </p>
    </>
  ),
};

interface MethodRowProps {
  method: DetectionMethodState;
}

function fmtCost(costM: number): string {
  if (costM >= 1000) return `$${(costM / 1000).toFixed(costM % 1000 === 0 ? 0 : 1)}B`;
  return `$${costM.toFixed(0)}M`;
}

/** 3e-3 → "3×10⁻³", 1e-8 → "10⁻⁸", 30 → "30". One significant figure. */
function fmtPow(x: number): string {
  if (!(x > 0)) return '0';
  let e = Math.floor(Math.log10(x) + 1e-9);
  let m = Math.round(x / Math.pow(10, e));
  if (m >= 10) {
    m = 1;
    e += 1;
  }
  if (e >= 0 && e <= 3) return String(m * Math.pow(10, e));
  return m === 1 ? `10${supScript(e)}` : `${String(m)}×10${supScript(e)}`;
}

/** Methods whose reach range has no published source behind it. */
const UNSOURCED_REACH: readonly DetectionMethodId[] = ['retina'];

export function MethodRow({ method }: MethodRowProps) {
  const setMethodOn = useStore((s) => s.setMethodOn);
  const setMethodCost = useStore((s) => s.setMethodCost);
  const setMethodSensitivity = useStore((s) => s.setMethodSensitivity);
  const setMethodReach = useStore((s) => s.setMethodReach);
  const cfg = method;

  // Slider bounds extend an order of magnitude beyond spec defaults so users can
  // explore. Spec §10 #7 calls these "the most uncertain numbers in the model" —
  // they need to be tuneable, not display-only.
  const specBounds = DETECTION_DEFAULTS[cfg.id].sensitivity;
  const noInDecade = NO_IN_DECADE_DETECTION.includes(cfg.type);
  const sliderMin = specBounds.min / 10;
  const sliderMax = specBounds.max * 10;
  // Reach can be explored an order of magnitude either side of its sourced range, but
  // never past the whole galaxy.
  const reachBounds = DETECTION_DEFAULTS[cfg.id].reach;
  const reachSliderMin = reachBounds.min / 10;
  const reachSliderMax = Math.min(1, reachBounds.max * 10);

  return (
    <div className="grid grid-cols-[40px_1fr] lg:grid-cols-[40px_1fr_140px_190px_190px] gap-3 lg:gap-5 items-center py-4 lg:py-4.5 border-b border-edge last:border-b-0">
      <Toggle
        on={cfg.on}
        onChange={(v) => {
          setMethodOn(cfg.id, v);
        }}
        label={cfg.id}
      />
      <div>
        <div className="flex items-center gap-1.5">
          <div className={`font-sans text-sm font-semibold ${cfg.on ? 'text-ink' : 'text-muted'}`}>
            {labelFor(cfg.id)}
          </div>
          <Tooltip>{METHOD_TOOLTIPS[cfg.id]}</Tooltip>
        </div>
        <div className="font-mono text-[10.5px] text-muted uppercase tracking-chip mt-0.5">
          type · {cfg.type}
        </div>
      </div>
      <div className="col-span-2 lg:col-span-1">
        <div className="font-mono text-[10.5px] text-muted uppercase tracking-[0.1em]">
          cost / decade
        </div>
        <div className="font-serif text-lg text-ink mt-0.5">{fmtCost(cfg.costM)}</div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={costFrac(cfg)}
          onChange={(e) => {
            const f = Number(e.target.value);
            const newCost = fracToCost(cfg, f);
            setMethodCost(cfg.id, newCost);
          }}
          className="w-full mt-1"
          style={{ accentColor: cfg.on ? '#1f1d18' : '#c8c4bc' }}
          aria-label={`${cfg.id} cost`}
        />
      </div>
      {noInDecade ? (
        <div className="col-span-2 font-serif text-[13px] text-muted leading-snug">
          No detections possible within a decade: travel time alone is ~20 years. Adds cost only.
        </div>
      ) : (
        <>
          <div className="col-span-2 lg:col-span-1">
            <div className="font-mono text-[10.5px] text-muted uppercase tracking-[0.1em] flex justify-between">
              <span>reach</span>
              <span className="opacity-70">
                {fmtPow(cfg.reachMin)}–{fmtPow(cfg.reachMax)}
              </span>
            </div>
            <div className="mt-2">
              <DualLogTrack
                rangeMin={reachSliderMin}
                rangeMax={reachSliderMax}
                loValue={cfg.reachMin}
                hiValue={cfg.reachMax}
                onChange={(lo, hi) => {
                  setMethodReach(cfg.id, lo, hi);
                }}
                ariaLabelLo={`${cfg.id} reach minimum`}
                ariaLabelHi={`${cfg.id} reach maximum`}
                fillColor={cfg.on ? '#2e6a31' : '#c8c4bc'}
              />
            </div>
            <div className="font-mono text-[11px] text-muted mt-1">
              of the galaxy · {UNSOURCED_REACH.includes(cfg.id) ? 'a guess' : 'sourced ⓘ'}
            </div>
          </div>
          <div className="col-span-2 lg:col-span-1">
            <div className="font-mono text-[10.5px] text-muted uppercase tracking-[0.1em] flex justify-between">
              <span>sensitivity</span>
              <span className="opacity-70">
                {fmtPow(cfg.sensMin)}–{fmtPow(cfg.sensMax)}
              </span>
            </div>
            <div className="mt-2">
              <DualLogTrack
                rangeMin={sliderMin}
                rangeMax={sliderMax}
                loValue={cfg.sensMin}
                hiValue={cfg.sensMax}
                onChange={(lo, hi) => {
                  setMethodSensitivity(cfg.id, lo, hi);
                }}
                ariaLabelLo={`${cfg.id} sensitivity minimum`}
                ariaLabelHi={`${cfg.id} sensitivity maximum`}
                fillColor={cfg.on ? '#2e6a31' : '#c8c4bc'}
              />
            </div>
            <div className="font-mono text-[11px] text-muted mt-1">
              in reach · per $1B-decade
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function labelFor(id: string): string {
  const map: Record<string, string> = {
    seti: 'SETI radio (BL/ATA)',
    tech: 'Technosignature search',
    bio: 'Biosignature astrobiology',
    probe: 'Interstellar probe R&D',
    retina: 'RETINA (passive radar)',
  };
  return map[id] ?? id;
}

function costBoundsFor(id: DetectionMethodId): [number, number] {
  switch (id) {
    case 'seti':
      return [10, 500];
    case 'tech':
      return [10, 500];
    case 'bio':
      return [1000, 20000];
    case 'probe':
      return [100, 5000];
    case 'retina':
      return [1, 50];
  }
}

function costFrac(m: DetectionMethodState): number {
  const [min, max] = costBoundsFor(m.id);
  if (m.costM <= min) return 0;
  if (m.costM >= max) return 1;
  return (Math.log10(m.costM) - Math.log10(min)) / (Math.log10(max) - Math.log10(min));
}

function fracToCost(m: DetectionMethodState, f: number): number {
  const [min, max] = costBoundsFor(m.id);
  const t = Math.max(0, Math.min(1, f));
  return Math.pow(10, Math.log10(min) + t * (Math.log10(max) - Math.log10(min)));
}

function supScript(n: number): string {
  const map: Record<string, string> = {
    '-': '⁻',
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
  };
  return String(n)
    .split('')
    .map((c) => map[c] ?? c)
    .join('');
}
