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

// Each method only sees part of the galaxy this decade: the stars its instruments can
// survey at plausible signal strengths. Spend buys more looks within that reach, not more
// reach, so no amount of money pushes a single civilisation's detection chance above it.
describe('survey reach (share of the galaxy a method can see this decade)', () => {
  const only = (id: DetectionMethodState['id'], patch: Partial<DetectionMethodState> = {}) =>
    defaultDetectionState().map((m) =>
      m.id === id ? { ...m, on: true, ...patch } : { ...m, on: false },
    );

  it('no method sees the whole galaxy by default', () => {
    for (const m of defaultDetectionState()) {
      expect(m.reachMin).toBeGreaterThan(0);
      expect(m.reachMax).toBeLessThan(0.01);
      expect(m.reachMin).toBeLessThanOrEqual(m.reachMax);
    }
  });

  it('SETI defaults to the sourced range: leakage-only (~10⁻⁸) up to galaxy-spanning beacons (~10⁻³)', () => {
    const seti = defaultDetectionState().find((m) => m.id === 'seti');
    expect(seti?.reachMin).toBe(1e-8);
    expect(seti?.reachMax).toBe(1e-3);
  });

  it('caps detection: one civilisation is found with probability at most the reach, however much is spent', () => {
    const methods = only('seti', {
      reachMin: 1e-4,
      reachMax: 1e-4,
      sensMin: 1e6,
      sensMax: 1e6,
      costM: 1e5,
    });
    expect(pDetectGivenN(makeRng('reach-cap'), methods, 1)).toBeCloseTo(1e-4, 10);
  });

  it('with in-reach sensitivity saturated, P(detect) = 1 − (1 − reach)^N', () => {
    const methods = only('seti', { reachMin: 1e-6, reachMax: 1e-6, sensMin: 1e6, sensMax: 1e6 });
    expect(pDetectGivenN(makeRng('reach-n'), methods, 1e6)).toBeCloseTo(
      1 - Math.pow(1 - 1e-6, 1e6),
      6,
    );
  });

  it('per-civilisation detection = reach × (1 − exp(−s × spend in $B))', () => {
    const methods = only('seti', {
      reachMin: 1e-3,
      reachMax: 1e-3,
      sensMin: 2,
      sensMax: 2,
      costM: 500,
    });
    const expected = 1e-3 * (1 - Math.exp(-2 * 0.5));
    expect(pDetectGivenN(makeRng('reach-formula'), methods, 1)).toBeCloseTo(expected, 12);
  });

  it('reports per-method probabilities with the same reach', () => {
    const methods = only('tech', { reachMin: 1e-5, reachMax: 1e-5, sensMin: 1e6, sensMax: 1e6 });
    const per = pDetectPerMethod(makeRng('reach-per'), methods, 1);
    expect(per.byMethod.tech).toBeCloseTo(1e-5, 10);
    expect(per.combined).toBeCloseTo(1e-5, 10);
  });
});

describe('biosignature searches count life-bearing planets, not civilisations', () => {
  const only = (id: DetectionMethodState['id']) =>
    defaultDetectionState().map((m) => ({ ...m, on: m.id === id }));

  it('can find life where there are no civilisations', () => {
    expect(pDetectGivenN(makeRng('bio-life'), only('bio'), 0, 1e12)).toBeGreaterThan(0);
  });

  it('finds nothing when no planet has life', () => {
    expect(pDetectGivenN(makeRng('bio-none'), only('bio'), 1e9, 0)).toBe(0);
  });

  it('radio SETI ignores the life count', () => {
    expect(pDetectGivenN(makeRng('seti-life'), only('seti'), 0, 1e12)).toBe(0);
  });

  it('without a separate life count, falls back to the detectable-civilisation count', () => {
    const a = pDetectGivenN(makeRng('bio-fallback'), only('bio'), 1e9);
    const b = pDetectGivenN(makeRng('bio-fallback'), only('bio'), 1e9, 1e9);
    expect(a).toBe(b);
  });
});
