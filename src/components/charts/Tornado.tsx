// Tornado / sensitivity plot ported from design's A_Tornado.

interface TornadoItem {
  symbol: string;
  label: string;
  /** Log10 OoM shift in median multiplier from baseline when the parameter is at its lower bound. */
  low: number;
  /** Log10 OoM shift at upper bound. */
  high: number;
  lowLabel: string;
  highLabel: string;
}

interface TornadoProps {
  items: TornadoItem[];
}

export function Tornado({ items }: TornadoProps) {
  const w = 1120;
  const rowH = 38;
  const padL = 360;
  const padR = 48;
  const h = items.length * rowH + 56;
  const innerW = w - padL - padR;
  const cx = padL + innerW / 2;
  const mapDx = (v: number): number => (v / 3) * (innerW / 2);

  return (
    <svg
      viewBox={`0 0 ${String(w)} ${String(h)}`}
      preserveAspectRatio="xMidYMid meet"
      className="block w-full h-auto"
    >
      {[-3, -2, -1, 0, 1, 2, 3].map((l) => (
        <g key={l}>
          <line
            x1={cx + mapDx(l)}
            x2={cx + mapDx(l)}
            y1={28}
            y2={h - 18}
            stroke={l === 0 ? '#1f1d18' : 'rgba(31,29,24,0.06)'}
            strokeWidth={l === 0 ? 1.25 : 1}
          />
          <text
            x={cx + mapDx(l)}
            y={h - 4}
            textAnchor="middle"
            fontSize="10"
            fill="#6e675c"
            fontFamily="IBM Plex Mono, monospace"
          >
            {l === 0 ? 'baseline' : `${l > 0 ? '+' : ''}${String(l)} OoM`}
          </text>
        </g>
      ))}
      <text
        x={cx}
        y={20}
        textAnchor="middle"
        fontSize="11"
        fill="#c2410c"
        fontFamily="IBM Plex Mono, monospace"
        letterSpacing="0.14em"
      >
        GEOM. MEAN × GW (active worldview)
      </text>
      {items.map((it, i) => {
        const y = 36 + i * rowH;
        const xLow = cx + mapDx(it.low);
        const xHigh = cx + mapDx(it.high);
        const x0 = Math.min(xLow, xHigh);
        const x1 = Math.max(xLow, xHigh);
        return (
          <g key={i}>
            <text
              x={padL - 14}
              y={y + 5}
              textAnchor="end"
              fontSize="13"
              fill="#1f1d18"
              fontFamily="Source Serif 4, serif"
              fontStyle="italic"
            >
              {it.symbol}
            </text>
            <text
              x={padL - 60}
              y={y + 5}
              textAnchor="end"
              fontSize="12"
              fill="#6e675c"
              fontFamily="IBM Plex Sans, sans-serif"
            >
              {it.label}
            </text>
            <rect
              x={Math.min(cx, xLow)}
              y={y - 10}
              width={Math.abs(cx - xLow)}
              height={20}
              fill="#2a2823"
              opacity={0.85}
            />
            <rect
              x={Math.min(cx, xHigh)}
              y={y - 10}
              width={Math.abs(cx - xHigh)}
              height={20}
              fill="#c2410c"
              opacity={0.9}
            />
            <text
              x={x0 - 6}
              y={y + 4}
              textAnchor="end"
              fontSize="10.5"
              fill="#2a2823"
              fontFamily="IBM Plex Mono, monospace"
            >
              {it.lowLabel}
            </text>
            <text
              x={x1 + 6}
              y={y + 4}
              textAnchor="start"
              fontSize="10.5"
              fill="#c2410c"
              fontFamily="IBM Plex Mono, monospace"
            >
              {it.highLabel}
            </text>
          </g>
        );
      })}
      <text
        x={padL - 60}
        y={20}
        textAnchor="end"
        fontSize="10"
        fill="#6e675c"
        fontFamily="IBM Plex Mono, monospace"
        letterSpacing="0.14em"
      >
        PARAMETER
      </text>
    </svg>
  );
}

export type { TornadoItem };
