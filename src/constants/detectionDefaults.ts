// Detection-method defaults from spec §5.2 table.

export type DetectionType = 'radio' | 'technosig' | 'biosig' | 'probe' | 'passive_radar';

export type DetectionMethodId = 'seti' | 'tech' | 'bio' | 'probe' | 'retina';

/**
 * Detection types that cannot produce a detection within the decade this model scores.
 * A Breakthrough Starshot-style probe at ~20% of light speed needs ~20 years to reach
 * Alpha Centauri, plus 4.4 years for its signal to come back. Funding these adds cost
 * but no in-decade chance of detection.
 */
export const NO_IN_DECADE_DETECTION: readonly DetectionType[] = ['probe'];

export interface SensitivityBound {
  min: number;
  max: number;
}

/**
 * Survey reach: the share of the galaxy's targets (stars, or for biosignatures, star
 * systems) a method's instruments can actually cover this decade at plausible signal
 * strengths. Built from published survey sizes and sensitivity limits, divided by ~2×10¹¹
 * stars (the middle of the Milky Way's 100–400 billion) at both ends of each range.
 * Spending more buys more looks within this reach, not more reach: instruments, not this
 * decade's budget, set how far they can see.
 */
export interface ReachBound {
  min: number;
  max: number;
}

export interface DetectionMethodConfig {
  id: DetectionMethodId;
  name: string;
  type: DetectionType;
  /** Decadal cost in millions USD. */
  costMin: number;
  costDefault: number;
  costMax: number;
  /** Sensitivity per civ WITHIN REACH per $1B-decade: how fast spend turns a target in
   *  reach into a detection (on, aimed our way and in-band when we look). Log-uniform. */
  sensitivity: { min: number; default: number; max: number };
  /** Share of the galaxy within reach this decade. Log-uniform. */
  reach: ReachBound;
  /** Initially on/off in the spec. */
  defaultOn: boolean;
  /** Tooltip / sourcing note. */
  note: string;
}

export const DETECTION_DEFAULTS: Record<DetectionMethodId, DetectionMethodConfig> = {
  seti: {
    id: 'seti',
    name: 'SETI radio (BL/ATA)',
    type: 'radio',
    costMin: 10,
    costDefault: 50,
    costMax: 500,
    sensitivity: { min: 0.1, default: 3, max: 100 },
    // Both ends ÷ ~2×10¹¹ stars (the middle of NASA's 100–400 billion), no rounding.
    // Low: a transmitter as strong as our Deep Space Network, which an SKA-class array
    // could detect within ~65 ly / 20 pc (Sheikh 2025) — ~3,000 stars at ~0.1 stars/pc³
    // → 1.5×10⁻⁸. (Earth's everyday leakage, e.g. LTE, only to ~4 ly: no other star.)
    // High: beacons ≥ 4×10¹⁸ W across the ~60 million stars in Breakthrough Listen's
    // galactic-centre beams (Gajjar 2021) → 3×10⁻⁴.
    reach: { min: 1.5e-8, max: 3e-4 },
    defaultOn: true,
    note: 'Breakthrough Listen, Allen Telescope Array, narrow-band radio surveys. Reach spans a Deep-Space-Network-strength transmitter (~1.5×10⁻⁸ of the galaxy) to galaxy-spanning beacons (~3×10⁻⁴).',
  },
  tech: {
    id: 'tech',
    name: 'Technosignature search',
    type: 'technosig',
    costMin: 10,
    costDefault: 50,
    costMax: 500,
    sensitivity: { min: 0.1, default: 3, max: 100 },
    // Both ends ÷ ~2×10¹¹ stars. Lasers: 5,600 stars (Tellis & Marcy 2017) → 2.8×10⁻⁸.
    // Waste heat from star-scale engineering: 2.9×10⁸ stars within 5 kpc (Suazo 2022)
    // → 1.45×10⁻³.
    reach: { min: 3e-8, max: 1.5e-3 },
    defaultOn: false,
    note: 'Optical SETI, Dyson-sphere infrared anomalies, NIR transit anomalies. Reach spans laser searches of ~5,600 stars (~3×10⁻⁸) to waste-heat searches of ~3×10⁸ stars (~1.5×10⁻³).',
  },
  bio: {
    id: 'bio',
    name: 'Biosignature astrobiology',
    type: 'biosig',
    costMin: 1000,
    costDefault: 5000,
    costMax: 20000,
    sensitivity: { min: 1e-3, default: 0.03, max: 1 },
    // JWST's Rocky Worlds programme: 9 rocky planets in 8 systems, ranked by distance to
    // the "cosmic shoreline" (not by habitable zone), and it tests for atmospheres, not
    // life (STScI 2025). ~1–10 systems ÷ ~2×10¹¹ stars → 5×10⁻¹²–5×10⁻¹¹. HWO launches
    // in the 2040s.
    reach: { min: 5e-12, max: 5e-11 },
    defaultOn: false,
    note: 'JWST atmospheric spectroscopy now; the Habitable Worlds Observatory is not due until the 2040s. Reach is ~1–10 star systems of the galaxy’s ~200 billion.',
  },
  probe: {
    id: 'probe',
    name: 'Interstellar probe R&D',
    type: 'probe',
    costMin: 100,
    costDefault: 500,
    costMax: 5000,
    sensitivity: { min: 1e-6, default: 1e-5, max: 1e-4 },
    // Alpha Centauri's three stars ÷ ~2×10¹¹. Unused: probes cannot report back within
    // the decade.
    reach: { min: 1.5e-11, max: 1.5e-11 },
    defaultOn: false,
    note: 'Breakthrough Starshot-style R&D. Cannot detect anything within the decade (travel time), so it adds cost only.',
  },
  retina: {
    id: 'retina',
    name: 'RETINA (passive radar)',
    type: 'passive_radar',
    costMin: 1,
    costDefault: 5,
    costMax: 50,
    sensitivity: { min: 0.1, default: 3, max: 100 },
    // No published source. RETINA only sees our own airspace, so its reach is the share of
    // civilisations with an artefact here this decade. Lower: about one star system in 10¹².
    // Upper (a guess): as if a typical civilisation had probes near one star in a million.
    // "They're already here" belongs in the prior overrides, not here.
    reach: { min: 1e-12, max: 1e-6 },
    // Off by default like every method except SETI (spec §5.2), so RETINA gets no special
    // billing in the default configuration (CLAUDE.md).
    defaultOn: false,
    note: 'Passive multistatic radar reusing terrestrial illumination; cheap, novel. Sees only our own airspace; its reach range is a guess with no published source.',
  },
};

export const DETECTION_METHOD_ORDER: DetectionMethodId[] = [
  'seti',
  'tech',
  'bio',
  'probe',
  'retina',
];
