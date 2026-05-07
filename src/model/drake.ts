import type { Rng } from '../lib/rng';
import { logUniform, linearUniform } from '../lib/sampling';
import {
  DRAKE_DEFAULTS,
  type DrakeBound,
  type DrakeParamId,
} from '../constants/defaults';

export type DrakeRanges = Record<DrakeParamId, DrakeBound>;

export interface DrakeSample {
  N: number;
  N_detectable: number;
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

export function sampleDrake(rng: Rng, ranges: DrakeRanges): DrakeSample {
  const R = sampleParam(rng, 'R', ranges.R);
  const fp = sampleParam(rng, 'fp', ranges.fp);
  const ne = sampleParam(rng, 'ne', ranges.ne);
  const fl = sampleParam(rng, 'fl', ranges.fl);
  const fi = sampleParam(rng, 'fi', ranges.fi);
  const fc = sampleParam(rng, 'fc', ranges.fc);
  const L = sampleParam(rng, 'L', ranges.L);
  const fd = sampleParam(rng, 'fd', ranges.fd);
  // Sum logs rather than multiply to avoid mantissa-bit loss across factors
  // that span 30+ orders of magnitude. The product N = R*fp*ne*fl*fi*fc*L
  // can lose precision when several factors are tiny — log-space accumulates
  // with full Float64 precision and exp's only the final result.
  const logN =
    Math.log(R) +
    Math.log(fp) +
    Math.log(ne) +
    Math.log(fl) +
    Math.log(fi) +
    Math.log(fc) +
    Math.log(L);
  const N = Math.exp(logN);
  const N_detectable = Math.exp(logN + Math.log(fd));
  return {
    N,
    N_detectable,
    components: { R, fp, ne, fl, fi, fc, L, fd },
  };
}
