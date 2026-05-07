import { describe, it, expect } from 'vitest';
import { makeRng } from '../../src/lib/rng';
import {
  sampleGrabbyZoneCredence,
  sensitivityBoostFor,
  defaultGrabbyState,
} from '../../src/model/grabby';

describe('grabby aliens model', () => {
  it('sampleGrabbyZoneCredence returns values in [0, 1]', () => {
    const r = makeRng('grabby-1');
    for (let i = 0; i < 1000; i++) {
      const v = sampleGrabbyZoneCredence(r, defaultGrabbyState());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('sensitivityBoostFor returns 1× for non-probe/passive_radar types', () => {
    expect(sensitivityBoostFor('radio')).toBe(1);
    expect(sensitivityBoostFor('biosig')).toBe(1);
    expect(sensitivityBoostFor('technosig')).toBe(1);
  });

  it('sensitivityBoostFor returns >1 for probe and passive_radar', () => {
    expect(sensitivityBoostFor('probe')).toBeGreaterThan(1);
    expect(sensitivityBoostFor('passive_radar')).toBeGreaterThan(1);
  });
});
