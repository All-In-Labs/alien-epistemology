# Drake Tool — implementation brainstorm output

_2026-05-07. Companion to `drake-tool-spec.md` (root) and the design bundle at `design/effective-aliens-visualizer/`._

This doc captures decisions made during the brainstorm before implementation. The spec is the source of truth for *what* to build; this doc records *how* the open questions in spec §11 (and a few discovered during the brainstorm) were resolved.

## Deliverable

Full Vite + React 18 + TypeScript-strict project at the repo root. Local dev only for this milestone — Caddy / production deploy is deferred. All seven phases of spec §9 plus the v2 bundle additions (Ch.0 honesty contract, Ch.6 tornado / sensitivity plot, presenter mode, three permalink chips). Visual identity from Direction A v2 in `design/effective-aliens-visualizer/project/direction-a.jsx`.

## Architecture decisions resolved in brainstorm

| Decision | Choice | Rationale |
|---|---|---|
| Project layout | Repo root | Repo is single-purpose; no need for a `drake-tool/` subdir |
| Package manager | `pnpm` via `corepack` | Spec §4. Will install via `corepack enable && corepack prepare pnpm@latest --activate` after user confirmation |
| Styling | **Tailwind + design tokens** | Tailwind for layout/spacing/utility classes; theme extension carries the Direction A palette and font stack. Inline styles only inside the bespoke SVG charts |
| Charts | **Bespoke SVG, not Recharts** | The design's histogram (custom percentile bands, dashed accent reference line, log axis), tornado, and comparator whiskers don't translate cleanly to Recharts. Spec §4 suggests Recharts; we deviate here in service of design fidelity. Components are ported from `direction-a.jsx` / `shared.jsx` into `src/components/charts/` as typed React components |
| RNG | Inline `xmur3` + `sfc32` (already in `shared.jsx`) | Seedable, ~10ns/draw, no dep. Spec §13.4 explicitly allows this |
| Tornado-plot data | Real sensitivity sweeps in the Worker, n=10⁴ per sweep (vs n=10⁵ for the main MC) | Honest math; reduced sample count keeps the sweep snappy |
| Verification | Claude for Chrome at every phase boundary | Per spec §13.5 |

## Code structure (extends spec §8)

```
src/
├── components/
│   ├── charts/        Histogram, Sparkline, ComparatorBars, Tornado (bespoke SVG)
│   ├── chapters/      Ch00 (honesty contract) … Ch06 (tornado) sections
│   ├── controls/      RangeSlider, ProbabilitySlider, Toggle, Segmented
│   ├── CosmologySelector.tsx
│   ├── PriorOverridePanel.tsx
│   ├── PresenterMode.tsx
│   ├── PermalinkChips.tsx
│   ├── PermalinkButton.tsx
│   └── ComparisonView.tsx
├── model/             drake.ts, grabby.ts, detection.ts, value.ts, worldview.ts, monteCarlo.ts
├── workers/           mcWorker.ts (transferable typed-array results)
├── lib/               permalink.ts, rng.ts, sampling.ts, migrations.ts
├── presets/           worldviews.ts (six §6.4 presets), permalinkChips.ts
├── constants/         defaults.ts, comparators.ts
├── store.ts           Zustand
├── App.tsx
└── main.tsx
tests/
├── unit/              one file per src/model/* and src/lib/permalink.ts
├── integration/       presets.test.ts, permalink.test.ts
└── e2e/               README.md (Claude-for-Chrome notes)
```

## Phase checkpoint cadence

I'll commit and stop at each phase boundary. At each gate the four spec §13.7 checks must pass: `pnpm test` (TDD-first for model code), `pnpm lint` (zero warnings), `pnpm typecheck` (zero errors), Claude-for-Chrome smoke verification.

| Phase | Sub-deliverable |
|---|---|
| 1 | Scaffold + Drake model + paired headline stats + Ch.0 honesty contract + Ch.1 visuals |
| 2 | Detection model + Ch.2 instruments + "P(any detection)" stat |
| 3 | Value channels + Ch.3 cards + EV in DALYs |
| 4 | Worldview dials + presets + Ch.4 + MC moved into Worker + side-by-side compare |
| 5 | Cosmology selector + grabby model + prior overrides |
| 6 | Ch.5 verdict (histogram, summary, comparator bars) + tooltips |
| 7 + v2 | Permalinks (live URL + chips + JSON export) + Ch.6 tornado + presenter mode + colophon + README |

## Out of scope this milestone

- Caddy / production deploy to `aliens.allinlabs.io` (deferred per user)
- Mobile responsive layout (spec §11.5 marks it out of scope for v1)
- Full Hanson grabby-aliens math; we use the simplified `P(inside grabby zone)` prior + sensitivity boost on probe/passive_radar (per spec §11.6)

## Acceptance criteria

Spec §10 in full. Particularly:
1. Paired `P(N=0)` / `P(N≥1)` of identical visual weight
2. Ord Moderate default does not produce "obviously top EA cause"
3. `P(EV<0)` shown
4. Comparator bars show ranges with whiskers
5. No worldview / cosmology privileged
6. Sensitivity caveat appears in detection section
7. Tooltips link to primary sources
8. Permalink round-trip produces bit-identical state
9. `pnpm test` / `pnpm lint` / `pnpm typecheck` all green; no `any` in `src/`
10. Claude-for-Chrome smoke run passes
