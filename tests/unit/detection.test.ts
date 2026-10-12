import { describe, it, expect } from 'vitest';
import { makeRng } from '../../src/lib/rng';
import {
  pDetectGivenN,
  pDetectPerMethod,
  totalDecadalCostMillions,
  type DetectionMethodState,
  defaultDetectionState,
} from '../../src/model/detection';

const allOn = (): DetectionMethodState[] =>
  defaultDetectionState().map((m) => ({ ...m, on: true }));

const allOff = (): DetectionMethodState[] =>
  defaultDetectionState().map((m) => ({ ...m, on: false }));

describe('pDetectGivenN', () => {
  it('returns 0 when no methods are enabled', () => {
    const r = makeRng('det-1');
    const p = pDetectGivenN(r, allOff(), 100);
    expect(p).toBe(0);
  });

  it('returns 0 when N_detectable = 0', () => {
    const r = makeRng('det-2');
    const p = pDetectGivenN(r, allOn(), 0);
    expect(p).toBe(0);
  });

  it('returns a probability in [0, 1]', () => {
    const r = makeRng('det-3');
    for (let i = 0; i < 100; i++) {
      const N = i * 0.1;
      const p = pDetectGivenN(r, allOn(), N);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });

  it('strictly increases with N', () => {
    // For deterministic expectation we average across many seeds.
    const samples = 200;
    let p_low = 0;
    let p_high = 0;
    for (let i = 0; i < samples; i++) {
      const r = makeRng(`det-mono-${i.toString()}`);
      p_low += pDetectGivenN(r, allOn(), 1);
      const r2 = makeRng(`det-mono-${i.toString()}`);
      p_high += pDetectGivenN(r2, allOn(), 1000);
    }
    expect(p_high).toBeGreaterThan(p_low);
  });

  it('disabling a method reduces the combined probability', () => {
    const r1 = makeRng('det-disable-1');
    const r2 = makeRng('det-disable-1');
    const all = allOn();
    const fewer = allOn().map((m) => (m.id === 'retina' ? { ...m, on: false } : m));
    const pAll = pDetectGivenN(r1, all, 1000);
    const pFewer = pDetectGivenN(r2, fewer, 1000);
    expect(pAll).toBeGreaterThanOrEqual(pFewer);
  });
});

describe('interstellar probes cannot detect anything within the decade', () => {
  it('a probe-only programme has zero detection probability but still costs money', () => {
    const methods = defaultDetectionState().map((m) => ({ ...m, on: m.id === 'probe' }));
    const r = makeRng('probe-only');
    for (const N of [1, 1e3, 1e9]) {
      expect(pDetectGivenN(r, methods, N)).toBe(0);
      expect(pDetectPerMethod(r, methods, N).byMethod.probe).toBe(0);
    }
    expect(totalDecadalCostMillions(methods)).toBeGreaterThan(0);
  });

  it('adding probes to SETI leaves the detection probability unchanged', () => {
    const seti = defaultDetectionState().map((m) => ({ ...m, on: m.id === 'seti' }));
    const both = defaultDetectionState().map((m) => ({
      ...m,
      on: m.id === 'seti' || m.id === 'probe',
    }));
    const a = pDetectGivenN(makeRng('same'), seti, 1e4);
    const b = pDetectGivenN(makeRng('same'), both, 1e4);
    expect(b).toBe(a);
  });
});
