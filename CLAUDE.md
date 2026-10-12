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
- Per-method detection sensitivity coefficients are the most uncertain numbers in the model.
  The Ch.2 italic block-quote says so.
- The verdict histogram only shows positive multipliers. P(EV<0) is shown as a separate stat
  (in accent) so non-trivial negative-EV worldviews aren't hidden by the log axis.
- **Grokkability is a goal**: a visitor who hasn't dug into the numbers should get the
  verdict at a glance. Prefer plain words and "out of 100 worlds" framing over statistics.
- The Ch.5 headline is the 100-world split (`outcomeSplit` in `src/model/summary.ts`):
  more good than GiveWell (multiplier > 1) / less difference either way (−1 to 1) / serious
  harm (< −1), drawn as a 10×10 dot grid. Symmetric on purpose: many negative worlds are
  only ≈ −10⁻¹², which isn't harm worth a red dot. No single number works as a headline: on defaults the mean sits >10
  orders of magnitude above the median. The risk dial (average / typical / cautious →
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
- Permalinks are schema v4. v1/v2 links migrate to zero value uncertainty and log-uniform fₗ,
  so old links keep their maths.
- `pnpm` is via corepack (Node 22 bundles it). `.npmrc` disables `verifyDepsBeforeRun` and
  `ignored-builds-check` because `esbuild`'s build script is approved via
  `package.json` `pnpm.onlyBuiltDependencies` but pnpm 11's verify-deps check still flags it.

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
