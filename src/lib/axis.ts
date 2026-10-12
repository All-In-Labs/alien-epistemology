// Tick positions for log-scale axes.

/**
 * Integer log10 tick positions between logMin and logMax, at most ~maxTicks of them,
 * on a step that keeps 0 (i.e. 1×) as a tick whenever it is in range.
 */
export function logTicks(logMin: number, logMax: number, maxTicks = 7): number[] {
  if (!(logMax > logMin)) return [];
  const step = Math.max(1, Math.ceil((logMax - logMin) / (maxTicks - 1)));
  const ticks: number[] = [];
  for (let l = Math.ceil(logMin / step) * step; l <= logMax; l += step) ticks.push(l);
  return ticks;
}

/** Where a log10 value sits along an axis spanning logMin..logMax, as a fraction 0–1. */
export function logFraction(log: number, logMin: number, logMax: number): number {
  return (log - logMin) / (logMax - logMin);
}
