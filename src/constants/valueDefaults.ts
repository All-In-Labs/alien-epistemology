// Value-channel defaults from spec §5.3.

import type { DetectionType } from './detectionDefaults';

export type ValueChannelId = 'A' | 'B' | 'C' | 'D';

export interface ChannelADefaults {
  /** P(Great Filter behind us) — affects sign of channel A. */
  filterPriorBehind: number;
  /** Credence shift on detection by detection-type — uses biosig/technosig/contact. */
  delta: { biosig: number; technosig: number; radio: number; passive_radar: number; probe: number };
  /** V_xrisk_info in DALYs (the "value of x-risk information"). */
  vXriskInfo: number;
}

export interface ChannelBDefaults {
  /** Tech-viability evidence shift on detection (positive). */
  techViabilityShift: number;
  /** Lightcone-claim evidence shift on detection (negative). */
  lightconeClaimShift: number;
  /** V_cosmic_endowment, used as DALY-equivalents. The default 10¹⁶ is Bostrom (2013)'s
   *  count of *lives*; a life is many DALYs, so treating it as 10¹⁶ DALYs understates the
   *  figure ~50–80× (a deliberately conservative reading). */
  vCosmicEndowment: number;
}

export interface ChannelCDefaults {
  pFriendly: number;
  vContactFriendly: number;
  /** Detection types where C fires. */
  fires: DetectionType[];
}

export interface ChannelDDefaults {
  pHostile: number;
  /** Negative DALYs. */
  vHostileDisvalue: number;
  fires: DetectionType[];
}

/**
 * Detection types that fire Channel B (astronomical waste). B is about whether interstellar
 * technology works and whether the cosmos is already claimed; a biosignature (microbes)
 * says nothing about either, so it needs a technosignature to fire.
 */
export const B_FIRES: readonly DetectionType[] = ['radio', 'technosig', 'passive_radar', 'probe'];

export const VALUE_DEFAULTS = {
  A: {
    filterPriorBehind: 0.5,
    delta: { biosig: 0.1, technosig: 0.3, radio: 0.4, passive_radar: 0.4, probe: 0.3 },
    vXriskInfo: 1e10,
  } satisfies ChannelADefaults,
  B: {
    techViabilityShift: 0.15,
    lightconeClaimShift: -0.1,
    vCosmicEndowment: 1e16,
  } satisfies ChannelBDefaults,
  C: {
    pFriendly: 0.5,
    vContactFriendly: 1e8,
    fires: ['radio', 'technosig', 'passive_radar'],
  } satisfies ChannelCDefaults,
  D: {
    pHostile: 0.05,
    vHostileDisvalue: -1e12,
    fires: ['radio', 'technosig', 'probe'],
  } satisfies ChannelDDefaults,
};
