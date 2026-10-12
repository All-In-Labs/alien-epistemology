import type { ReactNode } from 'react';
import { Toggle } from './controls/Toggle';
import { DualLogTrack } from './controls/DualLogTrack';
import { Sparkline } from './charts/Sparkline';
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
    </>
  ),
  tech: (
    <>
      <p>
        <strong>Technosignature search.</strong> Optical SETI, Dyson-sphere infrared anomalies, NIR
        transit anomalies. Wider net than radio but at different sensitivity. See{' '}
        <CitationLink cite="wright2014" text="Wright et al. 2014 (G-HAT)" />.
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

function fakePreview(seedKey: string, on: boolean): number[] {
  // Deterministic preview shape — the real per-method histogram is computed in the
  // worker in phase 4; here we render a placeholder shape that's distinct per method.
  let h = 0;
  for (let i = 0; i < seedKey.length; i++) h = (h * 31 + seedKey.charCodeAt(i)) >>> 0;
  const out = new Array<number>(24);
  for (let i = 0; i < 24; i++) {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0;
    const t = i / 23;
    const center = 0.5 + ((h & 0xff) / 255 - 0.5) * 0.5;
    const d = (t - center) / 0.18;
    out[i] = Math.exp(-d * d) * (on ? 1 : 0.4);
  }
  return out;
}

export function MethodRow({ method }: MethodRowProps) {
  const setMethodOn = useStore((s) => s.setMethodOn);
  const setMethodCost = useStore((s) => s.setMethodCost);
  const setMethodSensitivity = useStore((s) => s.setMethodSensitivity);
  const cfg = method;

  // Slider bounds extend an order of magnitude beyond spec defaults so users can
  // explore. Spec §10 #7 calls these "the most uncertain numbers in the model" —
  // they need to be tuneable, not display-only.
  const specBounds = DETECTION_DEFAULTS[cfg.id].sensitivity;
  const noInDecade = NO_IN_DECADE_DETECTION.includes(cfg.type);
  const sliderMin = specBounds.min / 10;
  const sliderMax = specBounds.max * 10;

  return (
    <div className="grid grid-cols-[40px_1fr] lg:grid-cols-[40px_1fr_140px_200px_120px] gap-3 lg:gap-5 items-center py-4 lg:py-4.5 border-b border-edge last:border-b-0">
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
        <div className="col-span-2 lg:col-span-1 font-serif text-[13px] text-muted leading-snug">
          No detections possible within a decade: travel time alone is ~20 years. Adds cost only.
        </div>
      ) : (
        <div className="col-span-2 lg:col-span-1">
          <div className="font-mono text-[10.5px] text-muted uppercase tracking-[0.1em] flex justify-between">
            <span>log sensitivity</span>
            <span className="opacity-70">
              10{supScript(Math.round(Math.log10(cfg.sensMin)))}–10
              {supScript(Math.round(Math.log10(cfg.sensMax)))}
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
          <div className="font-mono text-[11px] text-muted mt-1">per civ · per $1B-decade</div>
        </div>
      )}
      <div className="hidden lg:block">
        <Sparkline
          values={fakePreview(`A-m-${cfg.id}`, cfg.on)}
          w={120}
          h={28}
          stroke={cfg.on ? '#1f1d18' : '#bdb6a4'}
          fill={cfg.on ? 'rgba(31,29,24,0.08)' : 'rgba(31,29,24,0.03)'}
        />
      </div>
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
