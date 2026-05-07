# Drake Cause Prioritization Tool

An interactive essay that asks: should we fund alien-finding as an EA cause area? Built per
`drake-tool-spec.md`. Visual identity from the Direction A v2 prototype in
`design/effective-aliens-visualizer/project/direction-a.jsx`.

The tool's single most important property is **epistemic neutrality**: distributions over point
estimates, no privileged worldview, no defaults that flatter the conclusion. See the Ch.0
honesty contract on the live page for the full rules.

## What it does

The user adjusts:

1. **Drake-equation parameter bounds** (Ch.1) — log-uniform sampling over `R*, fₚ, nₑ, fₗ, fᵢ, f_c, L, f_d`
2. **Detection programmes** (Ch.2) — five toggleable methods (SETI radio, technosignature,
   biosignature astrobiology, interstellar probe R&D, RETINA passive radar) with cost and
   sensitivity dials
3. **Value channels** (Ch.3) — four channels covering Great Filter information, astronomical
   waste, direct-contact value, and Dark Forest disvalue
4. **Worldview** (Ch.4) — six dials (longtermism strength, time discount, alien moral weight,
   hingeyness, filter prior, person-affecting, risk aversion) and six presets (Bostrom, Hanson,
   Ord, Neartermist, Dark Forest, Astronomical-Waste max.)
5. **Cosmology** (masthead) — SDO Drake / Grabby Aliens / Hybrid; weighted mixture of the two
   models per spec §5.1.5
6. **Bayesian-shortcut prior overrides** (advanced) — directly set P(N≥1) or floor the detection
   probability for users who weight evidence outside the Drake parameters

…and sees the cost-effectiveness distribution in × GiveWell-bar units, with summary stats,
percentile bands, comparator bars, and a tornado plot of which input moves the answer most.

## Local development

```bash
pnpm install
pnpm dev
```

Then open http://localhost:5173.

### Quality gates

```bash
pnpm test         # vitest — unit + integration; TDD for src/model/* and src/lib/permalink.ts
pnpm lint         # eslint typescript-eslint/strict-type-checked, --max-warnings=0
pnpm typecheck    # tsc --noEmit; strict + every extra strictness flag
pnpm build        # vite build → dist/
```

All four gates must pass before any commit per spec §13.7.

## Permalinks

The full app state (Drake bounds, methods, channels, worldview, cosmology, prior overrides)
serialises to the URL hash via deflate + base64url. The address bar reflects state in real time
(debounced 500ms). Click "Copy permalink ↗" in the masthead to copy a shareable URL; click any
of the three "Jump to →" chips to teleport to a fully-configured worldview (useful for live
demos). Schema is versioned (`v: 1`); future changes ship migrations in `src/lib/permalink.ts`.

## Presenter mode

Press **P** or click "Presenter mode" in the masthead. A sticky black header pins live headline
stats and the chapter counter; **←/→** snap-scroll between the seven chapters.

## References

- Sandberg, Drexler &amp; Ord (2018), *Dissolving the Fermi Paradox* — arXiv:1806.02404
- Hanson, Martin, McCarter &amp; Paulson (2021), *If Loud Aliens Explain Human Earliness, Quiet
  Aliens Are Also Rare* — arXiv:2102.01522 (Grabby Aliens)
- Bostrom (2003), *Astronomical Waste* — nickbostrom.com/astronomical/waste.html
- Ord (2020), *The Precipice*
- Sandberg &amp; Armstrong (2013), *Eternity in Six Hours*
- Azad (2026), *Contra Fermi Paradox is Not Contra UFOs* — for the directional-reasoning critique
- GiveWell cost-effectiveness analysis — for the bar (~$100/DALY)

## Spec-to-code map

| Spec section | Implementation |
|---|---|
| §5.1 Drake equation | `src/model/drake.ts`, `src/constants/defaults.ts` |
| §5.1.5 Cosmology | `src/model/grabby.ts`, branching in `src/model/monteCarlo.ts` |
| §5.2 Detection | `src/model/detection.ts`, `src/constants/detectionDefaults.ts` |
| §5.3 Value channels | `src/model/value.ts`, `src/constants/valueDefaults.ts` |
| §5.4 Worldview | `src/model/worldview.ts` |
| §5.5 Prior overrides | `src/components/PriorOverridePanel.tsx` + `PriorOverrides` in monteCarlo.ts |
| §6.4 Presets | `src/presets/worldviews.ts` |
| §6.5 Permalinks | `src/lib/permalink.ts`, `src/hooks/usePermalink.ts` |
| §7.1 Cost-effectiveness | `multiplierSamples` in monteCarlo.ts; Ch.5 verdict |
| §7.2 Comparators | `src/constants/comparators.ts`, ComparatorBars |
| Ch.0 honesty contract | `src/components/chapters/Ch00Contract.tsx` |
| Ch.6 tornado | `src/components/chapters/Ch06Tornado.tsx` |
| Presenter mode | `src/components/PresenterBar.tsx` + keybindings in `App.tsx` |

## A note on priors

The tool computes EV of search effort *given* a prior; the prior is the user's responsibility.
Per Azad's directional-reasoning observation, conditional probabilities have direction —
&ldquo;no probes → no aliens&rdquo; doesn't licence &ldquo;no aliens → no probes&rdquo; — and
users should be free to encode whatever evidence they find compelling via the §5.5 Bayesian
shortcuts.
