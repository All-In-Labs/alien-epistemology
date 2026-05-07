interface SparklineProps {
  values: number[];
  w?: number;
  h?: number;
  stroke?: string;
  fill?: string;
}

export function Sparkline({
  values,
  w = 120,
  h = 28,
  stroke = '#1f1d18',
  fill = 'rgba(31,29,24,0.10)',
}: SparklineProps) {
  if (values.length === 0) return <svg width={w} height={h} />;
  const max = Math.max(...values, 1e-9);
  const norm = values.map((v) => v / max);
  const denom = Math.max(1, norm.length - 1);
  const pts = norm.map((v, i) => `${String((i / denom) * w)},${String(h - v * h)}`).join(' ');
  const area = `0,${String(h)} ${pts} ${String(w)},${String(h)}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${String(w)} ${String(h)}`} className="block">
      <polygon points={area} fill={fill} />
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth={1.25} />
    </svg>
  );
}
