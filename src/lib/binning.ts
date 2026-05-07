export interface BinResult {
  bins: number[];
  /** Samples that fell below logMin (excluded from bins, counted here). */
  belowCount: number;
  /** Samples that fell above logMax (excluded from bins, counted here). */
  aboveCount: number;
}

/**
 * Log10-bin samples into `nBins` buckets between `[logMin, logMax]`. Samples
 * outside the range are NOT clipped into the edge buckets (which would create
 * misleading spikes); they're returned separately as `belowCount` / `aboveCount`
 * so the chart can render them as captions instead.
 */
export function binLog10WithOverflow(
  samples: Float64Array,
  logMin: number,
  logMax: number,
  nBins: number,
): BinResult {
  const bins = new Array<number>(nBins).fill(0);
  const range = logMax - logMin;
  let belowCount = 0;
  let aboveCount = 0;
  for (const v of samples) {
    if (v <= 0) continue;
    const logV = Math.log10(v);
    if (logV < logMin) {
      belowCount++;
      continue;
    }
    if (logV >= logMax) {
      aboveCount++;
      continue;
    }
    const t = (logV - logMin) / range;
    const idx = Math.min(nBins - 1, Math.floor(t * nBins));
    bins[idx] = (bins[idx] ?? 0) + 1;
  }
  return { bins, belowCount, aboveCount };
}

/** Backwards-compatible: clamp into edge buckets. Use binLog10WithOverflow instead. */
export function binLog10(
  samples: Float64Array,
  logMin: number,
  logMax: number,
  nBins: number,
): number[] {
  const bins = new Array<number>(nBins).fill(0);
  const range = logMax - logMin;
  for (const v of samples) {
    if (v <= 0) continue;
    const logV = Math.log10(v);
    const t = Math.max(0, Math.min(0.999999, (logV - logMin) / range));
    const idx = Math.floor(t * nBins);
    bins[idx] = (bins[idx] ?? 0) + 1;
  }
  return bins;
}

export function percentile(samples: Float64Array, p: number): number {
  const sorted = Array.from(samples).sort((a, b) => a - b);
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.floor(p * sorted.length)));
  return sorted[idx] ?? 0;
}
