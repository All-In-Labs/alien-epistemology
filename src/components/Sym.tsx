// Render a model symbol written as "base_sub" (e.g. "f_d", "α_L") with a real subscript,
// so raw underscores never reach the page. Unicode has no subscript c or d, so this can't
// be done in the strings themselves.

export function Sym({ s }: { s: string }) {
  const i = s.indexOf('_');
  if (i < 0) return <>{s}</>;
  return (
    <>
      {s.slice(0, i)}
      <sub className="text-[0.7em]">{s.slice(i + 1)}</sub>
    </>
  );
}

/** The same for SVG text, where <sub> isn't available. */
export function SvgSym({ s }: { s: string }) {
  const i = s.indexOf('_');
  if (i < 0) return <>{s}</>;
  return (
    <>
      {s.slice(0, i)}
      <tspan baselineShift="sub" fontSize="0.72em">
        {s.slice(i + 1)}
      </tspan>
    </>
  );
}
