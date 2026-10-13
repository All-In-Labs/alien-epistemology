# CLAUDE.md — Working notes for Claude Code

## What this project is

An interactive tool that evaluates "searching for alien civilisations" as an EA cause area.
Built per the spec at `drake-tool-spec.md` (root). Read that first if you've forgotten the
design.

**The single most important property of this project is epistemic neutrality.** The spec exists
because the goal is honest analysis, not a pitch. If you find yourself defaulting toward
parameter values or copy that make alien-finding look favourable, stop and reread §10 of the
spec. The acceptance criteria forbid this.

## Quality gates — all four must pass before any phase is "done"

```bash
pnpm test         # Vitest — unit + integration; TDD for model code
pnpm lint         # ESLint with --max-warnings=0; strict-type-checked preset
pnpm typecheck    # tsc --noEmit; strict mode + every extra strictness flag
pnpm dev          # then verify visually with Playwright (Claude-for-Chrome was offline at build time)
```

If any of these fail, fix before proceeding. No "I'll come back to this."

## TDD for model code

Files in `src/model/` and `src/lib/permalink.ts` are pure functions. Write tests first:

1. New behaviour → new failing test in `tests/unit/{module}.test.ts`
2. Implement minimum code to pass
3. Refactor under test
4. Re-run all gates

Already-tested modules: `rng`, `sampling`, `binning`, `drake`, `detection`, `value`,
`worldview`, `monteCarlo`, `grabby`, `permalink` (round-trip), `presets` (integration).

## Visual verification

At every phase boundary, exercise the new feature via Playwright (the project also wires up
Claude for Chrome but that extension wasn't connected during initial build):

1. `pnpm dev` in background
2. Navigate to `http://localhost:5173`
3. `browser_take_screenshot { fullPage: true }` and eyeball
4. Exercise the new control via `browser_evaluate` or `browser_click`
5. Screenshot again to confirm

For range sliders, use `browser_evaluate` to dispatch synthetic `input` events — physical
dragging via the MCP is unreliable.

For permalink testing, navigate to a URL with a `#s=...` hash and verify hydration matches.

## TypeScript style

- **No `any`.** Use `unknown` and narrow.
- **No `!` (non-null assertion).** Use a real check.
- **`noUncheckedIndexedAccess` is on** — `arr[0]` is `T | undefined`. Handle the undefined case.
- **`type` imports** for type-only imports (lint enforces this).
- **`exactOptionalPropertyTypes` is on** — `{ x?: number }` is not assignable from
  `{ x: undefined }`. When you genuinely want a "set to undefined" semantic, declare the field
  as `x?: number | undefined` explicitly.
- Discriminated unions over enums for state machines.

## Things you'll forget and shouldn't

- The headline stats are PAIRED — `P(N=0)` and `P(N≥1)`. Never display only one. Both must have
  identical typographic and chromatic weight.
- The Moderate longtermist preset (id `ord`) must NOT produce "obviously a top EA cause" with default settings.
  If it does, defaults are biased. Fix.
- RETINA is in the same UI list as everything else; it doesn't get special billing.
- Presets have descriptive names ("Strong longtermist", "Filter pessimist", "Moderate
  longtermist"), not people's names: their dial values aren't sourced from anyone's stated
  views (e.g. Ord argues against pure time discounting). Keep it that way.
- There is no Grabby Aliens mode. It was removed because it modelled "we are inside a grabby
  volume", which Hanson et al. 2021 rule out by construction. "They're already here" lives in
  the prior overrides. Permalinks v1–v3 drop the old `cosmology` / `grabby` fields on decode.
- Interstellar probes can't return a detection within the model's decade (travel time), so
  the probe method has zero detection probability: funding it only adds cost.
- Detection = reach × in-reach sensitivity: `p_m = r_m × (1 − exp(−s_m × c_$B))`. Reach is
  the share of the galaxy a method's instruments cover this decade, sourced from published
  surveys (tooltips + `detectionDefaults.ts` comments). Spend never raises reach. In-reach
  sensitivities are still placeholders and the most uncertain numbers in the model; the
  Ch.2 italic block-quote says so. RETINA's reach is a labelled guess (no source).
- Biosignature searches count life-bearing planets (`N_lifeDetectable`, using
  `BIOSPHERE_LIFETIME_YEARS`), not civilisations. Channel B (astronomical waste) needs a
  technosignature-type detection (`B_FIRES`); microbes alone don't fire it.
- The default "In GiveWell terms" dial is Typical world (median). Don't put the average
  first: it is dominated by a few huge-payoff worlds. The 100-world split is of *expected*
  values, so its copy says "on average" and the page states how many worlds actually find
  something (`worldsThatFind`). No "far better than GiveWell" style adjectives.
- Neutrality tests check the split (fewer than 40 of 100 worlds beat GiveWell, at least 5
  do serious harm, for the site defaults and Moderate longtermist). Median-based checks
  can't fail: the median is ≈ 0 for every non-negative preset.
- `configurationLabel` names the configuration: a preset's name until anything (other than
  the risk dial) is edited, then "Your settings"; "Default settings" when untouched. Every
  store edit clears `activePreset`. Permalinks carry an optional `preset` field.
- Comparator bars must be published figures with a named source, with a dot only when the
  source gives a point (no midpoints). They are on this tool's bar (1 DALY per $100 = 10 per
  $1k), which is ~2× easier than the DALY-based sources' own GiveWell figure (~20–21 per $1k),
  so each source label states the conversion and the source's own ratio. The 1× line is
  "GiveWell's funding bar", never "top charities". If a cause area has none (AI safety, currently), list it in
  `COMPARATOR_OMISSIONS`; don't invent a range. Negative values go in the chart's "below 0"
  zone; never clamp them to a tiny positive (that made bad results look like "≈ nothing").
- Reach ranges divide survey star counts by ~2×10¹¹ (the middle of 100–400 billion) at both
  ends, with no rounding up. Taking the favourable count at each end inflates log-uniform means.
- The Monte Carlo must consume the same random draws whatever the inputs (point vs ranged
  bounds, SDO vs log-uniform fₗ). The tornado compares runs on one seed and relies on it;
  `detection.test.ts` and `drake.test.ts` check it.
- Presets reset everything they don't set (Drake bounds, methods, overrides, value
  uncertainty, fₗ model) to the defaults, so a preset never depends on click order.
- The tornado runs in `workers/tornadoWorker.ts` (pure logic in `model/tornado.ts`),
  debounced. Don't move it back onto the main thread: 35 Monte Carlo runs block input. It
  measures change in net worlds (better − serious harm, out of 100), not the mean: the mean
  is a difference of two heavy tails and can sit within noise of zero. A sweep's low end must
  not set a value-uncertainty spread to exactly 0 (zero spreads skip random draws).
- The verdict histogram (`SignedHistogram`) shows every world: losses mirrored left of an
  "≈ 0" column, gains right, in the dot grid's colours. "≈ 0" means |x| < 10⁻³ everywhere
  (chart, `plainGloss`, the Ch.5 sentence); keep those in step.
- Channel D's endowment loss (−P(hostile) × V_cosmic_endowment) gets exactly channel B's
  transform and magnitude draw. Upside and downside must stay on the same scale; a unit test
  checks they cancel. At the defaults B's expected net shift (+0.05) equals P(hostile), so the
  mean is ≈ 0 and `meanMultiplierSE` decides whether the UI may print it (`meanIsNoise`).
- **Grokkability is a goal**: a visitor who hasn't dug into the numbers should get the
  verdict at a glance. Prefer plain words and "out of 100 worlds" framing over statistics.
- The Ch.5 headline is the 100-world split (`outcomeSplit` in `src/model/summary.ts`):
  more good than GiveWell (multiplier > 1) / less difference either way (−1 to 1) / serious
  harm (< −1), drawn as a 10×10 dot grid. Symmetric on purpose: many negative worlds are
  only ≈ −10⁻¹², which isn't harm worth a red dot. No single number works as a headline: the
  median is ≈ 0 and the mean is dominated by rare huge wins and losses. The risk dial (average / typical / cautious →
  mean / median / 25th percentile) only picks the secondary GiveWell number underneath.
  Old permalinks' 'EV-max' / 'log-utility' / 'difference-making' are mapped on decode.
- Channel A is always ≤ 0: −Δ × ϕ × V_xrisk_info (Hanson: finding life is bad news). It is
  not a sign flip around ϕ = 0.5.
- `valueUncertainty` makes P(EV<0) a real probability. Without it, V(detection) is one number
  per config, so every sample shares its sign. Tests that call `runDrakeMC` without it get the
  point-value model (`NO_VALUE_UNCERTAINTY`).
- The site defaults fₗ to SDO 2018's model (`DEFAULT_FL_DISTRIBUTION`); dragging the fₗ
  slider switches to a custom log-uniform range. `runDrakeMC` itself still defaults to
  log-uniform, so tests that want what visitors see must pass `flDistribution` and
  `valueUncertainty` explicitly (see `neutrality.test.ts`, "at the site defaults").
- Permalinks are schema v5. v1/v2 links migrate to zero value uncertainty and log-uniform fₗ,
  so old links keep their maths for features that were added. Error corrections do change old
  links: v1–v3 drop Grabby mode; v1–v4 keep each method's on/off and cost but take the new
  reach and sensitivity defaults (old sensitivities were on a different scale).
- `pnpm` is via corepack (Node 22 bundles it). pnpm 11 settings live in `pnpm-workspace.yaml`,
  not `package.json`'s `pnpm` field (no longer read): `esbuild`'s build script is approved via
  `allowBuilds`, and `verifyDepsBeforeRun: false` stops every script re-running an install.

## When stuck

If stuck on a design question not answered by the spec, prefer the option that:

1. Is more honest (shows uncertainty, doesn't bias output)
2. Is more conservative (defaults toward "probably not a top cause")
3. Is simpler (v1 — Hanson's full math is out of scope, see §11.6 of the spec)

If the question is genuinely ambiguous, ask the user.

## Phase tracking

Phases 1–7 of the spec are complete. Caddy production deploy (spec §4) is deferred per user.
Future work should:

1. Run all four gates and confirm green before claiming done
2. Commit with a phase reference if extending the phase structure
3. Update this CLAUDE.md with anything you learned that future-you should know
