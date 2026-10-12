import { describe, it, expect } from 'vitest';
import {
  applyWorldview,
  defaultWorldview,
  type WorldviewDials,
  type ChannelContributions,
} from '../../src/model/worldview';

const baseChannels: ChannelContributions = { A: 100, B: 200, C: 50, D: -10 };

describe('applyWorldview', () => {
  it('with all dials neutral and ϕ = 1, passes each channel through (A as bad news)', () => {
    const dials: WorldviewDials = {
      ...defaultWorldview(),
      longtermismStrength: 1,
      timeDiscount: 0,
      personAffecting: false,
      alienMoralWeight: 1,
      hingeyness: 1,
      filterPriorBehind: 1, // all prior mass on "filter behind", so the full Δ×V is lost
      riskAversion: 'EV-max',
    };
    const v = applyWorldview(baseChannels, dials);
    expect(v.A).toBe(-100);
    expect(v.B).toBe(200);
    expect(v.C).toBe(50);
    expect(v.D).toBe(-10);
    expect(v.total).toBe(140);
  });

  it('longtermism strength multiplies channels A and B', () => {
    const dials = {
      ...defaultWorldview(),
      longtermismStrength: 0.5,
      timeDiscount: 0,
      filterPriorBehind: 1,
    };
    const v = applyWorldview(baseChannels, dials);
    expect(v.A).toBe(-50);
    // hingeyness=0.1 default → B = 200 * 0.5 * 0.1 = 10
    expect(v.B).toBeCloseTo(10, 6);
  });

  it('channel A is bad news whatever the filter prior, scaling continuously with ϕ (Hanson 1998)', () => {
    const dials = (filterPriorBehind: number): WorldviewDials => ({
      ...defaultWorldview(),
      longtermismStrength: 1,
      timeDiscount: 0,
      filterPriorBehind,
    });
    // Detection moves a fraction of the "filter behind us" credence to "filter ahead":
    // never good news, and zero only when there is no such credence to move.
    expect(applyWorldview(baseChannels, dials(0)).A).toBe(-0);
    expect(applyWorldview(baseChannels, dials(0.2)).A).toBeCloseTo(-20, 9);
    expect(applyWorldview(baseChannels, dials(0.5)).A).toBeCloseTo(-50, 9);
    expect(applyWorldview(baseChannels, dials(0.8)).A).toBeCloseTo(-80, 9);
    // No discontinuity around 0.5 (the old step function jumped from +50 to −50).
    const below = applyWorldview(baseChannels, dials(0.49)).A;
    const above = applyWorldview(baseChannels, dials(0.51)).A;
    expect(Math.abs(above - below)).toBeLessThan(3);
  });

  it('person-affecting view zeros channel B', () => {
    const dials = { ...defaultWorldview(), personAffecting: true };
    const v = applyWorldview(baseChannels, dials);
    expect(v.B).toBe(0);
  });

  it('alien moral weight multiplies channel C only', () => {
    const dials = { ...defaultWorldview(), alienMoralWeight: 0.5 };
    const v = applyWorldview(baseChannels, dials);
    expect(v.C).toBe(25);
  });

  it('hingeyness multiplies channel B only', () => {
    const a = applyWorldview(baseChannels, { ...defaultWorldview(), hingeyness: 0.1 });
    const b = applyWorldview(baseChannels, { ...defaultWorldview(), hingeyness: 1.0 });
    expect(b.B).toBeGreaterThan(a.B);
    expect(b.A).toBe(a.A); // hingeyness doesn't touch A
    expect(b.C).toBe(a.C); // hingeyness doesn't touch C
  });

  it('time discount reduces A and B', () => {
    const a = applyWorldview(baseChannels, {
      ...defaultWorldview(),
      timeDiscount: 0,
      filterPriorBehind: 1,
    });
    const b = applyWorldview(baseChannels, {
      ...defaultWorldview(),
      timeDiscount: 0.05,
      filterPriorBehind: 1,
    });
    expect(Math.abs(b.A)).toBeLessThan(Math.abs(a.A));
    expect(b.B).toBeLessThan(a.B);
  });

  it('does not touch D — Dark Forest is a real near-term cost regardless of worldview', () => {
    const a = applyWorldview(baseChannels, defaultWorldview());
    expect(a.D).toBe(-10);
  });
});
