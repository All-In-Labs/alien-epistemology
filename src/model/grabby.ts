// Grabby Aliens model from spec §5.1.5.
//
// Replaces the Drake N with P(we are inside a grabby zone) — a single number in
// [0, 1] sampled log-uniformly between user bounds. Detection sensitivities for
// probe and passive_radar methods are boosted by 10–100× (artefacts/probes
// would be ubiquitous if we were inside a grabby zone).
//
// Per spec §11.6, this is a deliberate v1 simplification of Hanson et al. 2021's
// expansion-rate model — we don't simulate the full dynamics.

import type { Rng } from '../lib/rng';
import { logUniform } from '../lib/sampling';
import type { DetectionType } from '../constants/detectionDefaults';

export interface GrabbyState {
  /** Bounds for P(we are inside a grabby zone) — log-uniform. */
  zoneCredenceMin: number;
  zoneCredenceMax: number;
}

export function defaultGrabbyState(): GrabbyState {
  return { zoneCredenceMin: 0.05, zoneCredenceMax: 0.5 };
}

export function sampleGrabbyZoneCredence(rng: Rng, g: GrabbyState): number {
  return Math.min(1, Math.max(0, logUniform(rng, g.zoneCredenceMin, g.zoneCredenceMax)));
}

/**
 * Multiplier on per-method sensitivity when in grabby-aliens mode. probe and
 * passive_radar are most affected (artefacts/probes would be detectable);
 * other methods unchanged.
 */
export function sensitivityBoostFor(type: DetectionType): number {
  switch (type) {
    case 'probe':
      return 50; // ~10–100× per spec; pick midpoint
    case 'passive_radar':
      return 50;
    default:
      return 1;
  }
}
