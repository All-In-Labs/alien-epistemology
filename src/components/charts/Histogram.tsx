import { binLog10WithOverflow, percentile } from '../../lib/binning';

interface HistogramProps {
  /** Raw samples; will be log10-binned. */
  samples: Float64Array;
  /** Width in px. */
  w?: number;
  /** Height in px. */
  h?: number;
  /** log10(value) of vertical reference line (e.g. 0 → 1× GiveWell bar). */
  refLine?: number;
  refLabel?: string;
  /** Min and max log10 values for x-axis. */
  logMin?: number;
  logMax?: number;
  /** Number of bins. */
  nBins?: number;
  /** X-axis tick labels (rendered at evenly-spaced positions). */
  xTicks?: string[];
  /** Axis label. */
  xLabel?: string;
}

export function Histogram({
  samples,
  w = 1120,
  h = 300,
  refLine = 0,
  refLabel = 'GiveWell bar (1×)',
  logMin = -6,
  logMax = 6,
  nBins = 60,
  xTicks = ['10⁻⁶', '10⁻³', '1', '10³', '10⁶'],
  xLabel = 'cost-effectiveness, × GiveWell bar (log)',
}: HistogramProps) {
  const padL = 44;
  const padR = 20;
  const padT = 20;
  const padB = 44;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const { bins, belowCount, aboveCount } = binLog10WithOverflow(samples, logMin, logMax, nBins);
  const binMax = Math.max(...bins, 1);
  const bw = innerW / bins.length;

  const p5 = percentile(samples, 0.05);
  const p25 = percentile(samples, 0.25);
  const p75 = percentile(samples, 0.75);
  const p95 = percentile(samples, 0.95);
  const range = logMax - logMin;
  const logToX = (v: number): number => {
    if (v <= 0) return 0;
    const t = (Math.log10(v) - logMin) / range;
    return Math.max(0, Math.min(1, t));
  };
  const x5 = logToX(p5);
  const x25 = logToX(p25);
  const x75 = logToX(p75);
  const x95 = logToX(p95);

  const refT = (refLine - logMin) / range;
  const refX = padL + Math.max(0, Math.min(1, refT)) * innerW;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${String(w)} ${String(h)}`}
      className="block"
    >
      {[0, 0.25, 0.5, 0.75, 1].map((g) => (
        <g key={g}>
          <line
            x1={padL}
            x2={w - padR}
            y1={padT + innerH * (1 - g)}
            y2={padT + innerH * (1 - g)}
            stroke="rgba(31,29,24,0.08)"
          />
        </g>
      ))}
      {samples.length > 0 ? (
        <>
          <rect
            x={padL + innerW * x5}
            y={padT}
            width={innerW * (x95 - x5)}
            height={innerH}
            fill="rgba(0,0,0,0.025)"
          />
          <rect
            x={padL + innerW * x25}
            y={padT}
            width={innerW * (x75 - x25)}
            height={innerH}
            fill="rgba(0,0,0,0.05)"
          />
        </>
      ) : null}
      {bins.map((v, i) => {
        const height = (v / binMax) * innerH;
        return (
          <rect
            key={i}
            x={padL + i * bw + 0.5}
            y={padT + innerH - height}
            width={Math.max(0.5, bw - 1)}
            height={height}
            fill="#2a2823"
            opacity={0.85}
          />
        );
      })}
      <line
        x1={refX}
        x2={refX}
        y1={padT - 4}
        y2={padT + innerH + 4}
        stroke="#c2410c"
        strokeWidth={1.5}
        strokeDasharray="3 3"
      />
      <text
        x={refX + 6}
        y={padT + 10}
        fontSize="11"
        fill="#c2410c"
        fontFamily="IBM Plex Mono, monospace"
      >
        {refLabel}
      </text>
      {xTicks.map((t, i) => (
        <text
          key={i}
          x={padL + (i / Math.max(1, xTicks.length - 1)) * innerW}
          y={h - padB + 18}
          textAnchor="middle"
          fontSize="10"
          fill="#7a7368"
          fontFamily="IBM Plex Mono, monospace"
        >
          {t}
        </text>
      ))}
      <text
        x={padL + innerW / 2}
        y={h - 6}
        textAnchor="middle"
        fontSize="10"
        fill="#7a7368"
        fontFamily="IBM Plex Mono, monospace"
      >
        {xLabel}
      </text>
      {belowCount > 0 && (
        <text
          x={padL + 4}
          y={padT - 4}
          textAnchor="start"
          fontSize="10"
          fill="#7a7368"
          fontFamily="IBM Plex Mono, monospace"
        >
          ←{belowCount.toString()} below
        </text>
      )}
      {aboveCount > 0 && (
        <text
          x={w - padR - 4}
          y={padT - 4}
          textAnchor="end"
          fontSize="10"
          fill="#7a7368"
          fontFamily="IBM Plex Mono, monospace"
        >
          {aboveCount.toString()} above→
        </text>
      )}
    </svg>
  );
}
