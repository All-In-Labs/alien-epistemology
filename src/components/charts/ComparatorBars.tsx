interface ComparatorItem {
  label: string;
  lo: number;
  mid: number;
  hi: number;
  main?: boolean;
}

interface ComparatorBarsProps {
  items: ComparatorItem[];
  w?: number;
  rowH?: number;
}

function supScript(n: number): string {
  const map: Record<string, string> = {
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
  return String(n)
    .split('')
    .map((c) => map[c] ?? c)
    .join('');
}

export function ComparatorBars({ items, w = 1120, rowH = 36 }: ComparatorBarsProps) {
  const padL = 280;
  const padR = 40;
  const h = items.length * rowH + 36;
  const innerW = w - padL - padR;

  // Auto-extend the axis so the tool's wide-tail bar fits. Default window is
  // [-3, 5] OoM (good for most cause-area comparators); expand whenever a bar
  // exceeds it. Without this, "This tool — Bostrom" runs past the chart's
  // right edge under longtermist presets where p95 ≈ 10^7+.
  let minLog = -3;
  let maxLog = 5;
  for (const item of items) {
    if (item.lo > 0) minLog = Math.min(minLog, Math.floor(Math.log10(item.lo)));
    if (item.hi > 0) maxLog = Math.max(maxLog, Math.ceil(Math.log10(item.hi)));
  }
  const logSpan = maxLog - minLog;

  const mapX = (v: number): number => {
    const lv = Math.log10(Math.max(v, Math.pow(10, minLog - 1)));
    return ((lv - minLog) / logSpan) * innerW;
  };

  // Build tick marks across the (possibly-expanded) range. Show every OoM when
  // the span is small, every 2 OoM when larger, so labels don't crowd.
  const tickStep = logSpan <= 8 ? 1 : 2;
  const ticks: number[] = [];
  for (let l = minLog; l <= maxLog; l += tickStep) ticks.push(l);

  return (
    <svg
      viewBox={`0 0 ${String(w)} ${String(h)}`}
      preserveAspectRatio="xMidYMid meet"
      className="block w-full h-auto"
    >
      {ticks.map((l) => (
        <g key={l}>
          <line
            x1={padL + mapX(Math.pow(10, l))}
            x2={padL + mapX(Math.pow(10, l))}
            y1={20}
            y2={h - 12}
            stroke="rgba(31,29,24,0.06)"
          />
          <text
            x={padL + mapX(Math.pow(10, l))}
            y={h - 2}
            textAnchor="middle"
            fontSize="10"
            fill="#6e675c"
            fontFamily="IBM Plex Mono, monospace"
          >
            {l === 0 ? '1×' : `10${supScript(l)}×`}
          </text>
        </g>
      ))}
      {/* GiveWell line at 1× */}
      <line
        x1={padL + mapX(1)}
        x2={padL + mapX(1)}
        y1={16}
        y2={h - 14}
        stroke="#2e6a31"
        strokeWidth={1.25}
        strokeDasharray="3 3"
      />
      {items.map((it, i) => {
        const y = 28 + i * rowH;
        const x0 = padL + mapX(it.lo);
        const x1 = padL + mapX(it.hi);
        const xm = padL + mapX(it.mid);
        const isMain = it.main ?? false;
        const stroke = isMain ? '#2e6a31' : '#2a2823';
        const sw = isMain ? 2 : 1.5;
        return (
          <g key={i}>
            <text
              x={padL - 12}
              y={y + 4}
              textAnchor="end"
              fontSize="12"
              fill="#1f1d18"
              fontFamily="IBM Plex Sans, sans-serif"
              fontWeight={isMain ? 600 : 500}
            >
              {it.label}
            </text>
            <line x1={x0} x2={x1} y1={y} y2={y} stroke={stroke} strokeWidth={sw} />
            <line x1={x0} x2={x0} y1={y - 5} y2={y + 5} stroke={stroke} strokeWidth={sw} />
            <line x1={x1} x2={x1} y1={y - 5} y2={y + 5} stroke={stroke} strokeWidth={sw} />
            <circle cx={xm} cy={y} r={isMain ? 5 : 4} fill={stroke} />
          </g>
        );
      })}
    </svg>
  );
}
