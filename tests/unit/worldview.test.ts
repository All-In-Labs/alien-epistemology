import { describe, it, expect } from 'vitest';
import {
  applyWorldview,
  defaultWorldview,
  type WorldviewDials,
  type ChannelContributions,
} from '../../src/model/worldview';

const baseChannels: ChannelContributions = { A: 100, B: 200, C: 50, D: -10 };

describe('applyWorldview', () => {
  it('with all dials neutral (and filter-prior off 0.5), returns the sum unchanged for the relevant channels', () => {
    const dials: WorldviewDials = {
      ...defaultWorldview(),
      longtermismStrength: 1,
      timeDiscount: 0,
      personAffecting: false,
      alienMoralWeight: 1,
      hingeyness: 1,
      filterPriorBehind: 0, // signA = +1, so v.A passes through
      riskAversion: 'EV-max',
    };
    const v = applyWorldview(baseChannels, dials);
    expect(v.A).toBe(100);
    expect(v.B).toBe(200);
    expect(v.C).toBe(50);
    expect(v.D).toBe(-10);
    expect(v.total).toBe(340);
  });

  it('longtermism strength multiplies channels A and B', () => {
    const dials = {
      ...defaultWorldview(),
      longtermismStrength: 0.5,
      timeDiscount: 0,
      filterPriorBehind: 0, // signA = +1 so the channel-A multiplier is visible
    };
    const v = applyWorldview(baseChannels, dials);
    expect(v.A).toBe(50);
    // hingeyness=0.1 default → B = 200 * 0.5 * 0.1 = 10
    expect(v.B).toBeCloseTo(10, 6);
  });

  it('channel A sign tracks WorldviewDials.filterPriorBehind (Finding B fix)', () => {
    const dials = (filterPriorBehind: number): WorldviewDials => ({
      ...defaultWorldview(),
      longtermismStrength: 1,
      timeDiscount: 0,
      filterPriorBehind,
    });
    const filterAhead = applyWorldview(baseChannels, dials(0.2));
    const neutral = applyWorldview(baseChannels, dials(0.5));
    const filterBehind = applyWorldview(baseChannels, dials(0.8));
    expect(filterAhead.A).toBeGreaterThan(0); // sign +1
    expect(neutral.A).toBe(0); // sign 0
    expect(filterBehind.A).toBeLessThan(0); // sign -1
    // Symmetric around 0.5 in magnitude.
    expect(filterAhead.A).toBeCloseTo(-filterBehind.A, 6);
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
      filterPriorBehind: 0, // sign +1 so the discount on A is visible
    });
    const b = applyWorldview(baseChannels, {
      ...defaultWorldview(),
      timeDiscount: 0.05,
      filterPriorBehind: 0,
    });
    expect(b.A).toBeLessThan(a.A);
    expect(b.B).toBeLessThan(a.B);
  });

  it('does not touch D — Dark Forest is a real near-term cost regardless of worldview', () => {
    const a = applyWorldview(baseChannels, defaultWorldview());
    expect(a.D).toBe(-10);
  });
});
