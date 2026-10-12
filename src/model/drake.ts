import type { Rng } from '../lib/rng';
import { logUniform, linearUniform, standardNormal } from '../lib/sampling';
import {
  BIOSPHERE_LIFETIME_YEARS,
  DRAKE_DEFAULTS,
  SDO_FL_LOG10_RATE,
  type DrakeBound,
  type DrakeParamId,
  type FlDistribution,
} from '../constants/defaults';

export type DrakeRanges = Record<DrakeParamId, DrakeBound>;

export interface DrakeSample {
  N: number;
  N_detectable: number;
  /** Life-bearing planets whose biosignatures are of a detectable kind: R·fₚ·nₑ·fₗ·T_biosphere·f_d,
   *  floored at N_detectable (every civilisation lives on a life-bearing planet). This is
   *  what biosignature searches look for. */
  N_lifeDetectable: number;
  components: Record<DrakeParamId, number>;
}

export function defaultDrakeRanges(): DrakeRanges {
  return {
    R: { ...DRAKE_DEFAULTS.R.defaults },
    fp: { ...DRAKE_DEFAULTS.fp.defaults },
    ne: { ...DRAKE_DEFAULTS.ne.defaults },
    fl: { ...DRAKE_DEFAULTS.fl.defaults },
    fi: { ...DRAKE_DEFAULTS.fi.defaults },
    fc: { ...DRAKE_DEFAULTS.fc.defaults },
    L: { ...DRAKE_DEFAULTS.L.defaults },
    fd: { ...DRAKE_DEFAULTS.fd.defaults },
  };
}

function sampleParam(rng: Rng, id: DrakeParamId, range: DrakeBound): number {
  const dist = DRAKE_DEFAULTS[id].distribution;
  return dist === 'log-uniform'
    ? logUniform(rng, range.min, range.max)
    : linearUniform(rng, range.min, range.max);
}

/** SDO 2018 f_l: 1 − exp(−λVt) with log10(λVt) normally distributed. Always in [0, 1]. */
export function sampleFlSDO(rng: Rng): number {
  const log10Rate = SDO_FL_LOG10_RATE.mean + SDO_FL_LOG10_RATE.sd * standardNormal(rng);
  // 10^x overflows to Infinity for x > ~308 (f_l → 1) and underflows to 0 for x < ~-323
  // (f_l → 0, so N = 0); -expm1 keeps precision when the rate is tiny.
  return -Math.expm1(-Math.pow(10, log10Rate));
}

export function sampleDrake(
  rng: Rng,
  ranges: DrakeRanges,
  flDistribution: FlDistribution = 'log-uniform',
): DrakeSample {
  const R = sampleParam(rng, 'R', ranges.R);
  const fp = sampleParam(rng, 'fp', ranges.fp);
  const ne = sampleParam(rng, 'ne', ranges.ne);
  // Both f_l models consume two uniforms (SDO's Box–Muller draw uses two), so switching
  // between them keeps every later draw in step. The tornado relies on that.
  let fl: number;
  if (flDistribution === 'sdo-lognormal') {
    fl = sampleFlSDO(rng);
  } else {
    fl = sampleParam(rng, 'fl', ranges.fl);
    rng();
  }
  const fi = sampleParam(rng, 'fi', ranges.fi);
  const fc = sampleParam(rng, 'fc', ranges.fc);
  const L = sampleParam(rng, 'L', ranges.L);
  const fd = sampleParam(rng, 'fd', ranges.fd);
  // Sum logs rather than multiply to avoid mantissa-bit loss across factors
  // that span 30+ orders of magnitude. The product N = R*fp*ne*fl*fi*fc*L
  // can lose precision when several factors are tiny — log-space accumulates
  // with full Float64 precision and exp's only the final result.
  const logLifeRate = Math.log(R) + Math.log(fp) + Math.log(ne) + Math.log(fl);
  const logN = logLifeRate + Math.log(fi) + Math.log(fc) + Math.log(L);
  const logLife = Math.max(logLifeRate + Math.log(BIOSPHERE_LIFETIME_YEARS), logN);
  const N = Math.exp(logN);
  const N_detectable = Math.exp(logN + Math.log(fd));
  const N_lifeDetectable = Math.exp(logLife + Math.log(fd));
  return {
    N,
    N_detectable,
    N_lifeDetectable,
    components: { R, fp, ne, fl, fi, fc, L, fd },
  };
}
