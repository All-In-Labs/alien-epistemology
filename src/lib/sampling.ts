import type { Rng } from './rng';

export function logUniform(rng: Rng, min: number, max: number): number {
  const lo = Math.log(min);
  const hi = Math.log(max);
  return Math.exp(lo + rng() * (hi - lo));
}

export function linearUniform(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}

/** Standard normal draw via Box–Muller. Uses two uniforms; 1 - u keeps log() finite. */
export function standardNormal(rng: Rng): number {
  const u1 = 1 - rng();
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
