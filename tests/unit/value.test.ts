import { describe, it, expect } from 'vitest';
import {
  defaultChannelState,
  valueOnDetection,
  channelValuesForTypeSet,
} from '../../src/model/value';

describe('valueOnDetection', () => {
  it('returns 0 when all channels are off', () => {
    const ch = defaultChannelState();
    ch.A.on = false;
    ch.B.on = false;
    ch.C.on = false;
    ch.D.on = false;
    expect(valueOnDetection('radio', ch)).toBe(0);
  });

  it('channel A magnitude is the unsigned product Δ × V_xrisk_info (sign applied later in worldview)', () => {
    const ch = defaultChannelState();
    ch.B.on = false;
    ch.C.on = false;
    ch.D.on = false;
    // The channel layer is now sign-free; it returns the unsigned magnitude regardless
    // of the (now-vestigial) ch.A.filterPriorBehind field. Sign is applied by
    // applyWorldview using WorldviewDials.filterPriorBehind.
    const v1 = valueOnDetection('technosig', { ...ch, A: { ...ch.A, filterPriorBehind: 0.8 } });
    const v2 = valueOnDetection('technosig', { ...ch, A: { ...ch.A, filterPriorBehind: 0.2 } });
    expect(v1).toBe(v2);
    expect(v1).toBeGreaterThan(0);
    expect(v1).toBeCloseTo(ch.A.delta.technosig * ch.A.vXriskInfo, 6);
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

// A microbe tells us nothing about whether interstellar technology works or whether the
// cosmos is already claimed, so the astronomical-waste channel needs a technosignature.
describe('astronomical-waste channel (B) needs evidence of technology', () => {
  it('does not fire for a biosignature-only detection', () => {
    expect(channelValuesForTypeSet(['biosig'], defaultChannelState()).B).toBe(0);
  });

  it('fires for radio, technosignatures, passive radar and probes', () => {
    for (const t of ['radio', 'technosig', 'passive_radar', 'probe'] as const) {
      expect(channelValuesForTypeSet([t], defaultChannelState()).B).not.toBe(0);
    }
  });

  it('fires when a biosignature comes with a technosignature', () => {
    expect(channelValuesForTypeSet(['biosig', 'radio'], defaultChannelState()).B).not.toBe(0);
  });
});
