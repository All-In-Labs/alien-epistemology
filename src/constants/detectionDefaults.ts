// Detection-method defaults from spec §5.2 table.

export type DetectionType = 'radio' | 'technosig' | 'biosig' | 'probe' | 'passive_radar';

export type DetectionMethodId = 'seti' | 'tech' | 'bio' | 'probe' | 'retina';

export interface SensitivityBound {
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
  /** Sensitivity per civ per $1B-decade. Bounds are log-uniform. */
  sensitivity: { min: number; default: number; max: number };
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
    sensitivity: { min: 1e-4, default: 1e-2, max: 1e-1 },
    defaultOn: true,
    note: 'Breakthrough Listen, Allen Telescope Array, narrow-band radio surveys.',
  },
  tech: {
    id: 'tech',
    name: 'Technosignature search',
    type: 'technosig',
    costMin: 10,
    costDefault: 50,
    costMax: 500,
    sensitivity: { min: 1e-5, default: 1e-3, max: 1e-2 },
    defaultOn: false,
    note: 'Optical SETI, Dyson-sphere infrared anomalies, NIR transit anomalies.',
  },
  bio: {
    id: 'bio',
    name: 'Biosignature astrobiology',
    type: 'biosig',
    costMin: 1000,
    costDefault: 5000,
    costMax: 20000,
    sensitivity: { min: 1e-4, default: 1e-3, max: 1e-2 },
    defaultOn: false,
    note: 'JWST atmospheric spectroscopy, future Habitable Worlds Observatory.',
  },
  probe: {
    id: 'probe',
    name: 'Interstellar probe R&D',
    type: 'probe',
    costMin: 100,
    costDefault: 500,
    costMax: 5000,
    sensitivity: { min: 1e-6, default: 1e-5, max: 1e-4 },
    defaultOn: false,
    note: 'Breakthrough Starshot-style; multi-decade payoff, decadal R&D spend.',
  },
  retina: {
    id: 'retina',
    name: 'RETINA (passive radar)',
    type: 'passive_radar',
    costMin: 1,
    costDefault: 5,
    costMax: 50,
    sensitivity: { min: 1e-6, default: 1e-4, max: 1e-2 },
    defaultOn: true,
    note: 'Passive multistatic radar reusing terrestrial illumination; cheap, novel.',
  },
};

export const DETECTION_METHOD_ORDER: DetectionMethodId[] = [
  'seti',
  'tech',
  'bio',
  'probe',
  'retina',
];
