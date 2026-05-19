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
  const padL = 400;
  const padR = 56;
  const h = items.length * rowH + 56;
  const innerW = w - padL - padR;
  const cx = padL + innerW / 2;
  // Range widened from ±3 to ±6 OoM: the mean-multiplier metric swings further
  // than the old gmean-of-positives, so a tighter range would saturate every row.
  // Clamped so bars never render outside the drawing area (which would visually
  // collide with the label/symbol columns).
  const RANGE = 6;
  const mapDx = (v: number): number => {
    const clamped = Math.max(-RANGE, Math.min(RANGE, v));
    return (clamped / RANGE) * (innerW / 2);
  };
  // Min space we need outside the bar for the value label to fit without colliding.
  const labelOutsidePx = 80;

  return (
    <svg
      viewBox={`0 0 ${String(w)} ${String(h)}`}
      preserveAspectRatio="xMidYMid meet"
      className="block w-full h-auto"
    >
      {[-6, -4, -2, 0, 2, 4, 6].map((l) => (
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
        fill="#2e6a31"
        fontFamily="IBM Plex Mono, monospace"
        letterSpacing="0.14em"
      >
        RATIO TO BASELINE (active config)
      </text>
      {items.map((it, i) => {
        const y = 36 + i * rowH;
        const xLow = cx + mapDx(it.low);
        const xHigh = cx + mapDx(it.high);
        // Place each value label outside its own bar's outer endpoint when there's
        // room; otherwise inside the bar near the baseline-side end. Done per-bar
        // (not per-pair) so inversely-correlated rows (e.g. time discount) read right.
        const placeLabel = (barEnd: number) => {
          const onLeft = barEnd < cx;
          const outerSpace = onLeft ? barEnd - padL : w - padR - barEnd;
          const outside = outerSpace >= labelOutsidePx;
          return {
            x: outside
              ? onLeft
                ? barEnd - 6
                : barEnd + 6
              : onLeft
                ? cx - 6
                : cx + 6,
            anchor: onLeft ? 'end' : ('start' as 'end' | 'start'),
            outside,
            onLeft,
          };
        };
        const lowPos = placeLabel(xLow);
        const highPos = placeLabel(xHigh);
        // When both endpoints are close to baseline (the input barely moves the
        // metric, e.g. V_A x-risk info), the two inline labels collide near cx.
        // Stack them vertically — low slightly above row centre, high slightly
        // below — so they read cleanly. Also trigger stacking when both endpoints
        // land on the same side of baseline (e.g. V_D high near baseline alongside
        // V_D low far left), because the labels would otherwise occupy the same
        // horizontal band.
        // Stack labels vertically when the two label POSITIONS would collide —
        // either because the endpoints are close (tightFit) or because both
        // labels resolve to the same inside-baseline anchor (e.g. both bars
        // saturate the chart edge so placeLabel pushes both to cx±6).
        const tightFit = Math.abs(xLow - xHigh) < 60;
        const samePosCollision =
          lowPos.anchor === highPos.anchor && Math.abs(lowPos.x - highPos.x) < 80;
        const stack = tightFit || samePosCollision;
        // A label whose anchor point lands inside a bar (its own or the other
        // bar) needs a light fill so it reads against the bar AND must be
        // vertically centred within the bar's strip, not stacked below it
        // (otherwise the text would straddle the bar's bottom edge).
        const insideAnyBar = (px: number): boolean => {
          const lowBarMin = Math.min(cx, xLow);
          const lowBarMax = Math.max(cx, xLow);
          const highBarMin = Math.min(cx, xHigh);
          const highBarMax = Math.max(cx, xHigh);
          const eps = 0.5;
          return (
            (px > lowBarMin + eps && px < lowBarMax - eps) ||
            (px > highBarMin + eps && px < highBarMax - eps)
          );
        };
        const lowOnDark = insideAnyBar(lowPos.x);
        const highOnDark = insideAnyBar(highPos.x);
        // When stacking is needed, separate the two labels vertically. For
        // inside-bar labels (light fill) the bar is only 20px tall, so use
        // tight offsets (y-3 / y+7) that stay within the bar's strip. For
        // outside-bar labels we have the full row height to work with (y-2 /
        // y+12), sized so the pair reads as a unit and there's a clear gap to
        // the next row.
        const lowLabelY = stack
          ? lowOnDark
            ? y - 3
            : y - 2
          : y + 4;
        const highLabelY = stack
          ? highOnDark
            ? y + 7
            : y + 12
          : y + 4;
        return (
          <g key={i}>
            <text
              x={padL - 14}
              y={y + 5}
              textAnchor="end"
              fontSize="13"
              fill="#1f1d18"
              fontFamily="Playfair Display, Georgia, serif"
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
            {/* Bars are coloured by direction-from-baseline, not by which sweep produced
                them. Dark = the parameter value (whichever sweep, low or high) pushes the
                metric BELOW baseline; orange = above. This keeps the visual story
                consistent across inversely-correlated parameters like time discount. */}
            <rect
              x={Math.min(cx, xLow)}
              y={y - 10}
              width={Math.abs(cx - xLow)}
              height={20}
              fill={xLow < cx ? '#2a2823' : '#2e6a31'}
              opacity={0.88}
            />
            <rect
              x={Math.min(cx, xHigh)}
              y={y - 10}
              width={Math.abs(cx - xHigh)}
              height={20}
              fill={xHigh < cx ? '#2a2823' : '#2e6a31'}
              opacity={0.88}
            />
            {/* Value labels: each bar's label sits at its own outer endpoint.
                Colour matches the bar (dark for below-baseline, orange for above);
                when the bar saturates the chart and the label has to go inside,
                use a light fill so it reads on the dark/orange fill. */}
            <text
              x={lowPos.x}
              y={lowLabelY}
              textAnchor={lowPos.anchor}
              fontSize="10.5"
              fill={
                lowOnDark
                  ? '#faf6ec'
                  : lowPos.onLeft
                    ? '#1f1d18'
                    : '#2e6a31'
              }
              fontFamily="IBM Plex Mono, monospace"
            >
              {it.lowLabel}
            </text>
            <text
              x={highPos.x}
              y={highLabelY}
              textAnchor={highPos.anchor}
              fontSize="10.5"
              fill={
                highOnDark
                  ? '#faf6ec'
                  : highPos.onLeft
                    ? '#1f1d18'
                    : '#2e6a31'
              }
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
