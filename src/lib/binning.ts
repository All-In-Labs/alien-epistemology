export function binLog10(
  samples: Float64Array,
  logMin: number,
  logMax: number,
  nBins: number,
): number[] {
  const bins = new Array<number>(nBins).fill(0);
  const range = logMax - logMin;
  for (let i = 0; i < samples.length; i++) {
    const v = samples[i];
    if (v === undefined || v <= 0) continue;
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
