// The verdict's full distribution, losses and gains alike. Losses are mirrored to the left
// of a central "≈ 0" column and gains run to the right, both on the same log scale and the
// same count scale, so a reader can see at a glance whether one side outweighs the other.
// Bars take the dot grid's colours (better than GiveWell / about the same / serious harm).

import { logTicks } from '../../lib/axis';
import { OUTCOME_COLORS } from '../../constants/outcomeColors';

const SUP: Record<string, string> = {
  '-': '⁻',
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
};

function powLabel(l: number, negative: boolean): string {
  const sign = negative ? '−' : '';
  if (l === 0) return `${sign}1`;
  return `${sign}10${String(l)
    .split('')
    .map((c) => SUP[c] ?? c)
    .join('')}`;
}

function pct(n: number, total: number): string {
  const v = (n / Math.max(1, total)) * 100;
  if (v > 0 && v < 1) return '<1%';
  return `${v.toFixed(0)}%`;
}

interface SignedHistogramProps {
  /** Every world's multiplier (× GiveWell), signed. */
  samples: Float64Array;
  /** |x| below 10^logMin counts as "≈ 0". */
  logMin: number;
  /** |x| above 10^logMax is drawn in the outermost bin. */
  logMax: number;
  binsPerDecade?: number;
  w?: number;
  h?: number;
}

export function SignedHistogram({
  samples,
  logMin,
  logMax,
  binsPerDecade = 3,
  w = 1120,
  h = 300,
}: SignedHistogramProps) {
  const padL = 16;
  const padR = 16;
  const padT = 34;
  const padB = 44;
  const centreW = 64;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const sideW = (innerW - centreW) / 2;
  const cx = padL + innerW / 2;

  const range = Math.max(1, logMax - logMin);
  const nBins = Math.max(1, Math.round(range * binsPerDecade));
  const pos = new Array<number>(nBins).fill(0);
  const neg = new Array<number>(nBins).fill(0);
  let zero = 0;
  let nNeg = 0;
  let nPos = 0;
  for (const v of samples) {
    if (!Number.isFinite(v)) continue;
    const a = Math.abs(v);
    if (a < Math.pow(10, logMin)) {
      zero++;
      continue;
    }
    const t = (Math.log10(a) - logMin) / range;
    const i = Math.min(nBins - 1, Math.max(0, Math.floor(t * nBins)));
    if (v > 0) {
      pos[i] = (pos[i] ?? 0) + 1;
      nPos++;
    } else {
      neg[i] = (neg[i] ?? 0) + 1;
      nNeg++;
    }
  }
  const binMax = Math.max(1, ...pos, ...neg);
  const bw = sideW / nBins;
  // Bin i covers |x| from 10^(logMin + i/binsPerDecade) upward; colour by which side of
  // the ±1× GiveWell line it sits on.
  const binLog = (i: number): number => logMin + (i / nBins) * range;
  const posX = (i: number): number => cx + centreW / 2 + i * bw;
  const negX = (i: number): number => cx - centreW / 2 - (i + 1) * bw;
  const ticks = logTicks(logMin, logMax, 5);
  const tickX = (l: number, negative: boolean): number => {
    const off = centreW / 2 + ((l - logMin) / range) * sideW;
    return negative ? cx - off : cx + off;
  };
  const total = samples.length;
  const oneX = (negative: boolean): number => tickX(0, negative);

  return (
    <svg
      viewBox={`0 0 ${String(w)} ${String(h)}`}
      preserveAspectRatio="xMidYMid meet"
      className="block w-full h-auto"
      role="img"
      aria-label={`Distribution of outcomes: ${pct(nNeg, total)} of worlds below zero, ${pct(zero, total)} about zero, ${pct(nPos, total)} above zero.`}
    >
      <defs>
        <pattern
          id="zero-hatch"
          patternUnits="userSpaceOnUse"
          width="6"
          height="6"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="6" stroke={OUTCOME_COLORS.less} strokeWidth="2" />
        </pattern>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((g) => (
        <line
          key={g}
          x1={padL}
          x2={w - padR}
          y1={padT + innerH * (1 - g)}
          y2={padT + innerH * (1 - g)}
          stroke="rgba(31,29,24,0.08)"
        />
      ))}
      {pos.map((v, i) => {
        const height = (v / binMax) * innerH;
        const better = binLog(i) >= 0;
        return (
          <rect
            key={`p${String(i)}`}
            x={posX(i) + 0.5}
            y={padT + innerH - height}
            width={Math.max(0.5, bw - 1)}
            height={height}
            fill={better ? OUTCOME_COLORS.better : OUTCOME_COLORS.less}
          />
        );
      })}
      {neg.map((v, i) => {
        const height = (v / binMax) * innerH;
        const harm = binLog(i) >= 0;
        return (
          <rect
            key={`n${String(i)}`}
            x={negX(i) + 0.5}
            y={padT + innerH - height}
            width={Math.max(0.5, bw - 1)}
            height={height}
            fill={harm ? OUTCOME_COLORS.worse : OUTCOME_COLORS.less}
          />
        );
      })}
      {zero > 0 && (
        <rect
          x={cx - centreW / 2 + 6}
          y={padT}
          width={centreW - 12}
          height={innerH}
          fill="url(#zero-hatch)"
          opacity={0.6}
        />
      )}
      {/* ±1× GiveWell lines. */}
      {[false, true].map((negative) => (
        <line
          key={String(negative)}
          x1={oneX(negative)}
          x2={oneX(negative)}
          y1={padT - 4}
          y2={padT + innerH + 4}
          stroke={negative ? OUTCOME_COLORS.worse : OUTCOME_COLORS.better}
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
      ))}
      <text
        x={padL}
        y={padT - 14}
        fontSize="12"
        fill="#1f1d18"
        fontFamily="IBM Plex Mono, monospace"
      >
        ← losses · {pct(nNeg, total)} of worlds
      </text>
      <text
        x={cx}
        y={padT - 14}
        textAnchor="middle"
        fontSize="12"
        fill="#1f1d18"
        fontFamily="IBM Plex Mono, monospace"
      >
        ≈ 0 · {pct(zero, total)}
      </text>
      <text
        x={w - padR}
        y={padT - 14}
        textAnchor="end"
        fontSize="12"
        fill="#1f1d18"
        fontFamily="IBM Plex Mono, monospace"
      >
        {pct(nPos, total)} of worlds · gains →
      </text>
      {ticks.flatMap((l) =>
        [true, false].map((negative) => (
          <text
            key={`${String(l)}${String(negative)}`}
            x={tickX(l, negative)}
            y={h - padB + 18}
            textAnchor="middle"
            fontSize="10"
            fill="#6e675c"
            fontFamily="IBM Plex Mono, monospace"
          >
            {powLabel(l, negative)}
          </text>
        )),
      )}
      <text
        x={cx}
        y={h - 6}
        textAnchor="middle"
        fontSize="10"
        fill="#6e675c"
        fontFamily="IBM Plex Mono, monospace"
      >
        × GiveWell bar, log scale each side · dashed lines at ±1×
      </text>
    </svg>
  );
}
