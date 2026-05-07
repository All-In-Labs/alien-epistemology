import { describe, it, expect } from 'vitest';
import { defaultChannelState, valueOnDetection } from '../../src/model/value';

describe('valueOnDetection', () => {
  it('returns 0 when all channels are off', () => {
    const ch = defaultChannelState();
    ch.A.on = false;
    ch.B.on = false;
    ch.C.on = false;
    ch.D.on = false;
    expect(valueOnDetection('radio', ch)).toBe(0);
  });

  it('channel A is negative when filterPriorBehind > 0.5 and Δ > 0 (bad news)', () => {
    const ch = defaultChannelState();
    ch.B.on = false;
    ch.C.on = false;
    ch.D.on = false;
    ch.A.filterPriorBehind = 0.8; // strong prior filter is behind us
    const v = valueOnDetection('technosig', ch);
    expect(v).toBeLessThan(0);
  });

  it('channel A flips sign when filterPriorBehind < 0.5 (filter ahead — finding life is GOOD news)', () => {
    const ch = defaultChannelState();
    ch.B.on = false;
    ch.C.on = false;
    ch.D.on = false;
    ch.A.filterPriorBehind = 0.2;
    const v = valueOnDetection('technosig', ch);
    expect(v).toBeGreaterThan(0);
  });

  it('channel C only fires for radio/technosig/passive_radar', () => {
    const ch = defaultChannelState();
    ch.A.on = false;
    ch.B.on = false;
    ch.D.on = false;
    expect(valueOnDetection('biosig', ch)).toBe(0);
    expect(valueOnDetection('probe', ch)).toBe(0);
    expect(valueOnDetection('radio', ch)).toBeGreaterThan(0);
    expect(valueOnDetection('technosig', ch)).toBeGreaterThan(0);
    expect(valueOnDetection('passive_radar', ch)).toBeGreaterThan(0);
  });

  it('channel D is negative for radio/technosig/probe; zero for biosig/passive_radar', () => {
    const ch = defaultChannelState();
    ch.A.on = false;
    ch.B.on = false;
    ch.C.on = false;
    expect(valueOnDetection('biosig', ch)).toBe(0);
    expect(valueOnDetection('passive_radar', ch)).toBe(0);
    expect(valueOnDetection('radio', ch)).toBeLessThan(0);
    expect(valueOnDetection('technosig', ch)).toBeLessThan(0);
    expect(valueOnDetection('probe', ch)).toBeLessThan(0);
  });

  it('total is sum of enabled channels', () => {
    const ch = defaultChannelState();
    const a = valueOnDetection('radio', { ...ch, B: { ...ch.B, on: false }, C: { ...ch.C, on: false }, D: { ...ch.D, on: false } });
    const b = valueOnDetection('radio', { ...ch, A: { ...ch.A, on: false }, C: { ...ch.C, on: false }, D: { ...ch.D, on: false } });
    const c = valueOnDetection('radio', { ...ch, A: { ...ch.A, on: false }, B: { ...ch.B, on: false }, D: { ...ch.D, on: false } });
    const d = valueOnDetection('radio', { ...ch, A: { ...ch.A, on: false }, B: { ...ch.B, on: false }, C: { ...ch.C, on: false } });
    const total = valueOnDetection('radio', ch);
    expect(total).toBeCloseTo(a + b + c + d, 1);
  });
});
