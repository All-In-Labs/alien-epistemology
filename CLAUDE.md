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
- The Ord Moderate preset must NOT produce "obviously a top EA cause" with default settings.
  If it does, defaults are biased. Fix.
- RETINA is in the same UI list as everything else; it doesn't get special billing.
- Hanson's Grabby Aliens model is included but its premises are contested (per Azad). The
  cosmology selector treats SDO/Grabby/Hybrid as equal options visually.
- Per-method detection sensitivity coefficients are the most uncertain numbers in the model.
  The Ch.2 italic block-quote says so.
- The verdict histogram only shows positive multipliers. P(EV<0) is shown as a separate stat
  (in accent) so non-trivial negative-EV worldviews aren't hidden by the log axis.
- The Ch.5 headline follows the worldview's risk-aversion dial (`src/model/summary.ts`):
  EV-max → mean, log-utility → geometric mean (null if any sample is a loss),
  difference-making → 25th percentile. On defaults the mean sits >10 orders of magnitude
  above the median, because a few samples with large N carry almost all the EV.
- Channel A is always ≤ 0: −Δ × ϕ × V_xrisk_info (Hanson: finding life is bad news). It is
  not a sign flip around ϕ = 0.5.
- `valueUncertainty` makes P(EV<0) a real probability. Without it, V(detection) is one number
  per config, so every sample shares its sign. Tests that call `runDrakeMC` without it get the
  point-value model (`NO_VALUE_UNCERTAINTY`).
- Permalinks are schema v3. v1/v2 links migrate to zero value uncertainty and log-uniform fₗ,
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
