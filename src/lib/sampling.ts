import type { Rng } from './rng';

export function logUniform(rng: Rng, min: number, max: number): number {
  const lo = Math.log(min);
  const hi = Math.log(max);
  return Math.exp(lo + rng() * (hi - lo));
}

export function linearUniform(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}
