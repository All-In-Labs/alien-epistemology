# Drake Cause Prioritization Tool

An interactive essay that asks: should we fund alien-finding as an EA cause area? Built per
`drake-tool-spec.md`. Visual identity from the Direction A v2 prototype in
`design/effective-aliens-visualizer/project/direction-a.jsx`.

The tool's single most important property is **epistemic neutrality**: distributions over point
estimates, no privileged worldview, no defaults that flatter the conclusion. Click *View
assumptions ↗* in the masthead to read the full honesty contract — relocated to an appendix
modal so it sits next to the analysis rather than gating entry to it.

## What it does

The user adjusts:

1. **Drake-equation parameter bounds** (Ch.1) — `R*, fₚ, nₑ, fₗ, fᵢ, f_c, L, f_d`, sampled
   between user-set bounds. fₗ follows Sandberg, Drexler & Ord's own model by default;
   dragging its slider switches to a custom log-uniform range.
2. **Detection programmes** (Ch.2) — five toggleable methods (SETI radio, technosignature,
   biosignature astrobiology, interstellar probe R&D, RETINA passive radar), each with a cost,
   a survey reach (the share of the galaxy its instruments can cover this decade, sourced from
   published surveys) and a sensitivity within that reach. Only SETI is on by default. Probes
   can't detect anything within a decade, so they add cost only.
3. **Value channels** (Ch.3) — Great Filter information (always bad news), astronomical waste,
   direct-contact value and Dark Forest disvalue, plus per-world value uncertainty
4. **Worldview** (Ch.4) — seven dials (longtermism strength, time discount, alien moral weight,
   hingeyness, filter prior, person-affecting, risk aversion) and six presets (Strong
   longtermist, Filter pessimist, Moderate longtermist, Neartermist, Dark Forest,
   Astronomical-Waste max.)
5. **Bayesian-shortcut prior overrides** (after Ch.4) — directly set P(N≥1) or floor the
   detection probability, e.g. for the "they're already here" scenario

…and sees the verdict (Ch.5) as an **"out of 100 worlds" split**: more good than GiveWell's
top charities / less difference either way / serious harm. One GiveWell multiple in plain words
sits underneath (average, typical world or cautious), with the full distribution, comparator
bars from published estimates, and a tornado plot of which input moves the answer most (Ch.6).

See `drake-tool-spec.md` §0 for how the build has diverged from the original spec.

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

All four gates (plus a visual check, see `CLAUDE.md`) must pass before any commit.

## Permalinks

The full app state (Drake bounds, f_l model, detection methods, value channels and their
uncertainty, worldview, prior overrides) serialises to the URL hash via deflate + base64url. The
address bar reflects state in real time (debounced 500ms). Click "Copy permalink ↗" in the
masthead to copy a shareable URL; click any of the five "Jump to →" chips to load a preset
(useful for live demos). The schema is versioned (currently `v: 5`); older links are migrated
in `src/lib/permalink.ts`.

## Presenter mode

Press **P** or click "Presenter mode" in the masthead. A sticky black header pins live headline
stats and the chapter counter; **←/→** snap-scroll between the seven chapters.

## References

- Sandberg, Drexler &amp; Ord (2018), *Dissolving the Fermi Paradox* — arXiv:1806.02404
- Hanson, Martin, McCarter &amp; Paulson (2021), *If Loud Aliens Explain Human Earliness, Quiet
  Aliens Are Also Rare* — arXiv:2102.01522 (Grabby Aliens; explains why the tool has no Grabby mode)
- Bostrom (2003), *Astronomical Waste* — nickbostrom.com/astronomical/waste
- Bostrom (2013), *Existential Risk Prevention as Global Priority* — existential-risk.com/concept.pdf
- Ord (2020), *The Precipice*
- Armstrong &amp; Sandberg (2013), *Eternity in Six Hours* — Acta Astronautica (FHI preprint linked in the app)
- Azad (2026), *Contra Fermi Paradox is Not Contra UFOs* — for the directional-reasoning critique
- GiveWell cost-effectiveness analysis — GiveWell uses its own units, not DALYs; the tool's
  ~$100/DALY bar is our approximation of its top-charity bar
- Robitaille &amp; Whitney (2010); Licquia &amp; Newman (2015) — Milky Way star formation rate
- Cassan et al. (2012); Bryson et al. (2021) — planet and habitable-zone occurrence

## Spec-to-code map

| Spec section | Implementation |
|---|---|
| §5.1 Drake equation | `src/model/drake.ts`, `src/constants/defaults.ts` |
| §5.2 Detection | `src/model/detection.ts`, `src/constants/detectionDefaults.ts` |
| §5.3 Value channels | `src/model/value.ts`, `src/constants/valueDefaults.ts` |
| §5.4 Worldview | `src/model/worldview.ts` |
| §5.5 Prior overrides | `src/components/PriorOverridePanel.tsx` + `PriorOverrides` in monteCarlo.ts |
| §6.4 Presets | `src/presets/worldviews.ts` |
| §6.5 Permalinks | `src/lib/permalink.ts`, `src/hooks/usePermalink.ts` |
| §7.1 Cost-effectiveness | `multiplierSamples` in monteCarlo.ts; Ch.5 verdict |
| §7.2 Comparators | `src/constants/comparators.ts`, ComparatorBars |
| Honesty contract / assumptions appendix | `src/components/AssumptionsModal.tsx` |
| Ch.6 tornado | `src/components/chapters/Ch06Tornado.tsx` |
| Presenter mode | `src/components/PresenterBar.tsx` + keybindings in `App.tsx` |

## A note on priors

The tool computes EV of search effort *given* a prior; the prior is the user's responsibility.
Per Azad's directional-reasoning observation, conditional probabilities have direction —
&ldquo;no probes → no aliens&rdquo; doesn't licence &ldquo;no aliens → no probes&rdquo; — and
users should be free to encode whatever evidence they find compelling via the §5.5 Bayesian
shortcuts.
