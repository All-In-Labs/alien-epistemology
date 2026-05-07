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
  const N = R * fp * ne * fl * fi * fc * L;
  return {
    N,
    N_detectable: N * fd,
    components: { R, fp, ne, fl, fi, fc, L, fd },
  };
}
