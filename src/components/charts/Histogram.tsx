import { binLog10WithOverflow, percentiles } from '../../lib/binning';
import { logFraction } from '../../lib/axis';

export interface AxisTick {
  /** log10 of the value the tick marks. */
  log: number;
  label: string;
}

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
  /** X-axis ticks, each placed at its own log10 value. */
  xTicks?: AxisTick[];
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
  xTicks = [
    { log: -6, label: '10⁻⁶' },
    { log: -3, label: '10⁻³' },
    { log: 0, label: '1' },
    { log: 3, label: '10³' },
    { log: 6, label: '10⁶' },
  ],
  xLabel = 'cost-effectiveness, × GiveWell bar (log)',
}: HistogramProps) {
  const padL = 44;
  const padR = 20;
  const padT = 20;
  const padB = 44;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const { bins, belowCount, aboveCount } = binLog10WithOverflow(samples, logMin, logMax, nBins);
  // Y-scale is driven by in-range bins only — including the overflow counts would
  // crush the in-range distribution when one tail has a lot of mass. The overflow
  // shows up as a hatched edge-marker rendered at full chart height (count-
  // independent) so the reader sees "there's mass beyond this edge" without the
  // count distorting the y-axis.
  const binMax = Math.max(...bins, 1);
  const bw = innerW / bins.length;
  const overflowW = 14;

  const [p5 = 0, p25 = 0, p75 = 0, p95 = 0] = percentiles(samples, [0.05, 0.25, 0.75, 0.95]);
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
      viewBox={`0 0 ${String(w)} ${String(h)}`}
      preserveAspectRatio="xMidYMid meet"
      className="block w-full h-auto"
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
      {/* Off-chart overflow markers — full-height hatched stripes at the chart
          edges that signal "there's mass beyond this edge" without trying to
          encode the count in bar height (which would distort the in-range scale
          when one tail is huge). The count is shown as a label above. */}
      <defs>
        <pattern id="overflow-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#2a2823" strokeWidth="2" opacity="0.5" />
        </pattern>
      </defs>
      {belowCount > 0 && (
        <rect
          x={padL - overflowW - 2}
          y={padT}
          width={overflowW}
          height={innerH}
          fill="url(#overflow-hatch)"
        />
      )}
      {aboveCount > 0 && (
        <rect
          x={w - padR + 2}
          y={padT}
          width={overflowW}
          height={innerH}
          fill="url(#overflow-hatch)"
        />
      )}
      <line
        x1={refX}
        x2={refX}
        y1={padT - 4}
        y2={padT + innerH + 4}
        stroke="#2e6a31"
        strokeWidth={1.5}
        strokeDasharray="3 3"
      />
      <text
        x={refX + 6}
        y={padT + 10}
        fontSize="11"
        fill="#2e6a31"
        fontFamily="IBM Plex Mono, monospace"
      >
        {refLabel}
      </text>
      {xTicks.map((t) => (
        <text
          key={t.log}
          x={padL + logFraction(t.log, logMin, logMax) * innerW}
          y={h - padB + 18}
          textAnchor="middle"
          fontSize="10"
          fill="#6e675c"
          fontFamily="IBM Plex Mono, monospace"
        >
          {t.label}
        </text>
      ))}
      <text
        x={padL + innerW / 2}
        y={h - 6}
        textAnchor="middle"
        fontSize="10"
        fill="#6e675c"
        fontFamily="IBM Plex Mono, monospace"
      >
        {xLabel}
      </text>
      {belowCount > 0 && (
        <text
          x={padL - overflowW / 2 - 4}
          y={padT - 4}
          textAnchor="middle"
          fontSize="10"
          fill="#6e675c"
          fontFamily="IBM Plex Mono, monospace"
        >
          ←{belowCount.toString()}
        </text>
      )}
      {aboveCount > 0 && (
        <text
          x={w - padR + overflowW / 2 + 4}
          y={padT - 4}
          textAnchor="middle"
          fontSize="10"
          fill="#6e675c"
          fontFamily="IBM Plex Mono, monospace"
        >
          {aboveCount.toString()}→
        </text>
      )}
    </svg>
  );
}
