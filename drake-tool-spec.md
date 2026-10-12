# Drake Cause Prioritization Tool — Implementation Spec

A React SPA that evaluates "searching for alien civilisations" as an EA cause area, using the Sandberg–Drexler–Ord (2018) probabilistic Drake formulation, multiple value channels, and worldview dials. Output is cost-effectiveness expressed as a multiplier of the GiveWell top-charity bar, with full Monte Carlo distributions.

## 0. Corrections and changes since the build (October 2026)

**Read this first.** An external review (October 2026) found factual errors in this spec and design choices that the code has since changed. Where this section and the rest of the spec disagree, **this section and the code win**. The body below is kept as the original design record.

**Factual corrections**

| Spec said | Correct | Source |
|---|---|---|
| Default bounds give P(N = 0) ≈ 30–50% (§5.1) | Log-uniform f_l over 1e-30–1 gives ≈ 88%. SDO's own model gives 52%. 30% is SDO's *literature-resampling* figure, a different method. | SDO 2018 §2, §3.2 |
| f_l log-uniform 1e-30–1 is "SDO's headline range" | SDO model f_l = 1 − e^(−λVt) with log10(λVt) ~ N(0, 50). The site now uses this by default (`DEFAULT_FL_DISTRIBUTION`). | SDO 2018 §3.1 |
| R* "modern observations centre ~1.5–3" stars/yr | ~0.7–1.9 *solar masses*/yr, which is ~6–7 stars/yr | Robitaille & Whitney 2010; Licquia & Newman 2015 |
| Kepler implies f_p × n_e ≈ 0.4 | ~0.37–0.60 rocky HZ planets per *Sun-like* star | Bryson et al. 2021 |
| Grabby aliens expand at ~25–50% of c | The authors' fit puts it above 0.5c | Hanson et al. 2021 |
| V_cosmic_endowment 1e16 = "Bostrom-style astronomical waste numbers" | 1e16 is Bostrom 2013's Earth-only figure, in lives not DALYs. The 2003 paper's figures are 1e38 lives per century (upper) or >1e13 per second (conservative). | Bostrom 2003, 2013 |
| V_xrisk_info 1e10 is "one order below standard total-view values" | No published anchor. It is ≥6 orders below total-view figures. | — |
| GiveDirectly ≈ 0.1× the GiveWell bar | ≈ 0.43–0.63× (GiveWell 2024 re-evaluation; bar is 6× benchmark as of May 2026) | GiveWell |
| "GiveWell bar ≈ $100/DALY" (implied GiveWell figure) | GiveWell doesn't use DALYs. $100/DALY is our approximation. | GiveWell |

**Design changes**

- **No Grabby Aliens / Hybrid cosmology** (§5.1.5 and everywhere else it appears). "P(we are inside a grabby zone)" contradicts Hanson et al. 2021, whose model is fitted on the premise that we are *not*. The "they're already here" scenario lives in the prior overrides (§5.5).
- **Channel A is always ≤ 0**: −Δ × ϕ × V_xrisk_info. It is not a sign flip around a prior of 0.5 (§5.3).
- **Risk aversion** options are Average / Typical world / Cautious (mean / median / 25th percentile). Log-utility was dropped (§5.4, §6.4).
- **Verdict** leads with an "out of 100 worlds" split: more good than GiveWell (> 1×), less difference either way (−1× to 1×), serious harm (< −1×). It does not lead with a single multiplier (§7).
- **Value uncertainty**: channel magnitudes (±1 OOM) and Channel B shifts (±0.1) are sampled per world, so P(EV < 0) is a real probability.
- **Probes** (§5.2) cannot detect anything within a decade (travel time ≈ 20 years at 0.2c), so they have zero in-decade detection probability.
- **RETINA is off by default.** Only SETI is on, as §5.2 originally said.
- **Presets** use descriptive names (Strong longtermist, Filter pessimist, Moderate longtermist), not people's names. Their dial values aren't sourced from those people (e.g. Ord argues against pure time discounting).
- **Detection has survey reach** (§5.2). Each method's per-target detection probability is `p_m = r_m × (1 − exp(−s_m × c_m_$B))`: reach `r_m` (share of the galaxy its instruments can cover this decade, log-uniform) times the old Poisson term, with `s_m` now per target *in reach*. Spend never raises reach. Defaults, built from published surveys ÷ 1–4×10¹¹ stars: radio 1e-8–1e-3 (Sheikh 2025; Gajjar 2021; Margot 2026), optical/IR 1e-8–3e-3 (Tellis & Marcy 2017; Suazo 2022), biosignatures 1e-12–1e-9 (STScI 2025), RETINA 1e-12–1e-6 (a guess; no source). In-reach sensitivities are still placeholders: 0.1–100 per $1B-decade (radio, optical, RETINA), 0.001–1 (biosignatures). The old table's sensitivities treated every civilisation in the galaxy as within reach; at the defaults they put P(SETI detects something this decade) at ~16%, now ~5%.
- **Biosignature searches count life-bearing planets**, R* × f_p × n_e × f_l × 3×10⁹ yr × f_d, not detectable civilisations.
- **Comparator bars** (§7.2) are published figures with named sources: cage-free campaigns 1.7–200× (titotal 2024, replicating RP; dot = RP CCM default 71×), biosecurity 0.06–800× (Millett & Snyder-Beattie 2017, future generations counted, undiscounted). AI safety and the CCM/Founders Pledge biosecurity bars are dropped: no published figure their authors stand behind.
- **Permalinks** are schema v5. v1–v4 links keep which methods are on and their costs, and take the new reach and sensitivity defaults.

## 1. Goal

A genuinely honest interactive tool. The user adjusts:
1. Drake-equation parameter bounds
2. Which detection programmes to fund and at what marginal decadal cost
3. How a detection translates into value (four channels, possibly negative)
4. Their worldview (longtermism strength, moral weights, risk aversion, etc.)

…and sees the resulting cost-effectiveness distribution, with side-by-side comparisons across worldview presets and against benchmark cause areas.

## 2. Non-goals

- **No fudging.** No defaults chosen to make alien-finding look favourable. Where defaults are required, they reflect mainstream EA estimates with explicit citations in tooltips.
- **No point estimates** of N. SDO's whole point is that this is misleading; we display distributions only.
- **No "naïve mode."** Maximum honesty is a stated requirement.
- **No backend.** Pure client-side SPA, deployable as static files.

## 3. Architecture overview

```
User adjusts dials
   ↓
Monte Carlo engine samples (n = 10⁵):
   1. Drake parameters → N (civilisations)
   2. Detection sensitivities × N → P(detection in decade)
   3. Value channels conditional on detection → V_detect
   4. Worldview dials transform V_detect → V_user (in DALY-equivalent or long-run-utility units)
   5. EV = P(detect) × V_user
   6. EV / total cost → cost-effectiveness in DALY/$
   7. Divide by GiveWell-bar DALY/$ → multiplier
   ↓
Histogram of multipliers, summary stats, comparator bars
```

The MC engine is the load-bearing component. Everything else is UI around it.

## 4. Tech stack & deployment

- **Build:** Vite + React 18 + TypeScript (strict mode — see §13.1 for required `tsconfig.json` flags)
- **Styling:** Tailwind CSS. No component library — keep it lightweight; build your own sliders.
- **Charts:** Recharts for histograms and comparator bars. (D3 is overkill here.)
- **Math:** Pure TypeScript, no Squiggle, no WASM. The Monte Carlo loop should run in a Web Worker to keep the UI responsive — n = 10⁵ samples per re-run, debounced ~150 ms after the last slider change.
- **State:** Zustand or plain React context. No Redux.
- **Routing:** None needed. Single page.
- **Quality toolchain:** ESLint with `typescript-eslint/strict-type-checked` ruleset (§13.2); Prettier for formatting; Vitest + React Testing Library for unit/integration; Puppeteer MCP for E2E/visual verification (§13.5).
- **Package manager:** pnpm (faster, stricter dependency resolution).
- **Deploy target:** Static build served by Caddy at `aliens.allinlabs.io` on the existing Hetzner VPS. Build artefact is `dist/` from `vite build`; Caddy serves with SPA fallback to `index.html`.

## 5. The probability model

### 5.1 Drake equation (SDO 2018 style)

`N = R* × f_p × n_e × f_l × f_i × f_c × L`

Each parameter is sampled from a log-uniform distribution between user-tunable bounds. Astrophysical parameters have established lower bounds that the UI **strongly nudges** users to respect (warn if they go outside the established range).

| Parameter | Distribution | Default min | Default max | Hard floor (warn below) | Notes |
|-----------|--------------|-------------|-------------|-------------------------|-------|
| `R*` (stars/yr in Milky Way) | log-uniform | 1.5 | 10 | 1.0 | Milky Way star formation rate; modern observations centre ~1.5–3 |
| `f_p` (fraction of stars with planets) | linear (truncated) | 0.4 | 1.0 | 0.4 | Kepler + microlensing strongly suggest most stars host planets |
| `n_e` (habitable planets per system) | log-uniform | 0.1 | 1.0 | 0.01 | Kepler implies `f_p × n_e ≈ 0.4` for sun-like stars |
| `f_l` (fraction developing life) | log-uniform | 1e-30 | 1.0 | none | Genuine wide uncertainty; SDO's headline range |
| `f_i` (fraction with intelligence) | log-uniform | 1e-3 | 1.0 | none | Wide |
| `f_c` (fraction communicating) | log-uniform | 1e-2 | 1.0 | none | Wide |
| `L` (civ lifetime, years) | log-uniform | 100 | 1e10 | none | From short-lived to galactic-timescale |

Sampling: `x ~ exp(uniform(log(min), log(max)))` for log-uniform; standard for linear.

**Display both sides of the SDO finding prominently.** With default bounds, P(N = 0 in Milky Way) is ~30–50% — but the complement P(N ≥ 1) is ~50–70%. **[Wrong — see §0: ≈ 88% with log-uniform f_l, ≈ 51% with SDO's f_l model.]** Both are equally valid framings of the same result, and using only the first subtly biases toward "probably alone" — which is not what the SDO finding actually says (cf. Azad, *Contra Fermi Paradox is Not Contra UFOs*, 2026). Show as paired top-of-page stats with neutral framing, neither privileged:

- "P(no other civilisation in Milky Way): X%"
- "P(at least one other civilisation in Milky Way): Y%"
- "P(more than one): Z%" — surfaces the Poisson-tail nature

The pairing is more important than either individual stat.

**Detection-readiness multiplier (folded in here as Jonny requested):** an additional log-uniform multiplier `f_d ∈ [0.001, 1.0]` representing the fraction of existing civs whose signals/biosignatures/etc. are detectable in principle by *any* current human technology. Defaults wide. This is what folds detection probability into Drake. Effective `N_detectable = N × f_d`.

### 5.1.5 Cosmological model selector

The SDO Drake formulation models stationary, communicating civilisations. An alternative — Hanson et al.'s *Grabby Aliens* (2021) — models civilisations as rapidly expanding (~25–50% of c **[wrong — >0.5c; and this mode was removed, see §0]**) and predicts ~40–50% of observable universe volume is already controlled. Detection implications differ dramatically: if we are inside a grabby zone, artefacts/probes should be ubiquitous and detection sensitivity is much higher.

Expose a cosmological-model selector at the top of the Drake panel:

| Option | Description | Effect on model |
|--------|-------------|------------------|
| **SDO Drake** (default) | Stationary communicating civs | N from sampled Drake params; detection from sensitivity model |
| **Grabby Aliens** (Hanson) | Rapid expansion, possibly already here | N replaced by P(we are inside a grabby zone), default log-uniform [0.05, 0.5]; detection sensitivity for probe and passive_radar methods boosted by 10–100× |
| **Hybrid** | Weighted mixture | User specifies credence in each (default 0.7 SDO / 0.3 Grabby); MC samples drawn proportionally |

Tooltip should note: (a) Hanson's "all stars equally habitable" assumption is contested (per Azad's critique — we orbit a ~95th-percentile-mass star, which is improbable if low-mass stars host life equally), (b) Hanson himself argues grabby aliens may already be present. The tool stays neutral on this — it just lets the user model under either framework.

### 5.2 Detection programme model

Five toggleable methods. Each has:
- **On/off toggle** (initially: SETI on, others off — but show RETINA in the same place, not as a separate "his project" thing)
- **Cost slider** in USD over a decade (marginal additional spend; log scale)
- **Sensitivity coefficient** `s_m`: probability that a single detectable civ is found by this method per $1B-decade of marginal spend, log-uniform
- **Detection-type tag**: `radio`, `technosig`, `biosig`, `probe`, `passive_radar` — affects which value channels can fire (e.g. biosig detection doesn't trigger contact channels)

Defaults (decadal marginal cost in USD):

| Method | Cost min | Cost default | Cost max | Sensitivity min (per $1B-decade per civ) | Sensitivity default | Sensitivity max | Type |
|--------|----------|--------------|----------|------------------------------------------|---------------------|-----------------|------|
| SETI radio (BL/ATA) | 10M | 50M | 500M | 1e-4 | 1e-2 | 1e-1 | radio |
| Technosignature search (optical, Dyson) | 10M | 50M | 500M | 1e-5 | 1e-3 | 1e-2 | technosig |
| Biosignature astrobiology (JWST atm., future missions) | 1B | 5B | 20B | 1e-4 | 1e-3 | 1e-2 | biosig |
| Interstellar probe R&D (Starshot-style) | 100M | 500M | 5B | 1e-6 | 1e-5 | 1e-4 | probe |
| RETINA (passive radar) | 1M | 5M | 50M | 1e-6 | 1e-4 | 1e-2 | passive_radar |

**[Superseded — see §0. These sensitivities treated every civilisation in the galaxy as within reach. Methods now have a sourced survey reach, and sensitivities are per target in reach.]**

These sensitivity numbers are **rough placeholders.** A user with domain expertise (and Jonny in particular for RETINA) should refine them. The tool should make it easy to adjust them and explain in tooltips that these are the most uncertain numbers in the whole model.

**Combined detection probability:**

For each method `m` that is enabled, with cost `c_m` and sensitivity `s_m`:
- Per-civ-per-decade detection probability: `p_m = 1 - exp(-s_m × c_m / 1e9)` **[now `r_m × (1 − exp(−s_m × c_m / 1e9))` with survey reach `r_m`; see §0]**
- Probability *this* method detects at least one of `N_detectable` civs: `P_m = 1 - (1 - p_m)^N_detectable`
- Combined: `P_detect = 1 - Π_m (1 - P_m)`

### 5.3 Value model — four channels

Each channel produces a value (in the same internal units as DALYs averted, with the worldview transform applied later). Channels are toggleable so users can isolate effects.

**Channel A: Great Filter information value**

Detection updates our credence about whether the Filter is behind or ahead of us. Per Hanson, finding life is generically *bad news* — especially complex life.

- User dial: prior P(Filter behind us), default 0.5
- User dial: credence shift Δ on detection, by detection type:
  - biosig (microbial): reduces P(filter behind) by Δ_bio (default 0.1)
  - technosig: reduces P(filter behind) by Δ_tech (default 0.3)
  - radio/contact: reduces P(filter behind) by Δ_contact (default 0.4)
- Translated to DALY-equivalent via "value of information about x-risk." User dial: `V_xrisk_info` in DALYs, default `1e10` (one order of magnitude below standard total-view longtermist x-risk values), log-uniform with wide bounds.
- Channel A value = `−Δ × V_xrisk_info` (negative because bad news; sign can flip if user sets P(filter behind) > 0.5) **[Superseded — see §0: −Δ × ϕ × V, never positive.]**

**Channel B: Astronomical waste update**

Detection is two-sided: evidence interstellar civs are tech-viable (good for "we could too") AND that the lightcone is partially claimed (bad for our cosmic endowment).

- User dial: P(positive long-run cosmic future achievable | no detection), default 0.1
- User dial: shift in P(positive future achievable | detection), default +0.05 (split into):
  - Tech-viability evidence: +0.15 (default)
  - Lightcone-claim evidence: −0.10 (default)
- User dial: `V_cosmic_endowment` in DALYs, default `1e16` (Bostrom-style astronomical waste numbers), log-uniform with wide bounds
- Channel B value = `(net shift) × V_cosmic_endowment`

**Channel C: Direct contact value**

Knowledge transfer, scientific value, etc. Only fires for detection types that involve receiving *information* (radio, technosig).

- User dial: P(contact is friendly | detection), default 0.5
- User dial: `V_contact_friendly` in DALYs, default `1e8` (rough), log-uniform
- Channel C value = `P(friendly) × V_contact_friendly` (only if detection type ∈ {radio, technosig, passive_radar})

**Channel D: Contact disvalue (Dark Forest)**

Detection alerts hostile aliens or commits us to METI which alerts them. Active mainly for two-way comm but also for technosignature methods that imply we can be spotted in turn.

- User dial: P(hostile attention | detection), default 0.05
- User dial: `V_hostile_disvalue` (negative DALYs), default `−1e12`
- Channel D value = `P(hostile) × V_hostile_disvalue` (only for radio/technosig/probe methods)

**Total value if detection occurs:** `V_detect = A + B + C + D`

### 5.4 Worldview dials

These act as **transforms on the value channels** before the final EV is computed.

| Dial | Range | Default | Effect |
|------|-------|---------|--------|
| Longtermism strength | 0.0–1.0 | 0.3 | Multiplies channels A and B. (0 = neartermist; 1 = pure total-view longtermist) |
| Pure time discount rate (annual) | 0–10% | 0.1% | Discounts long-run value channels A and B by `(1+r)^-T` where T = expected time horizon for that channel |
| Person-affecting view | toggle | off | If on, zeros channel B (astronomical waste only counts for total-view) |
| Alien moral weight | 0.0–1.0 | 0.1 | Multiplies channel C |
| Risk aversion | enum: `EV-max`, `log-utility`, `difference-making` | `EV-max` | Affects how the MC distribution is summarised: EV-max → mean; log-utility → geometric mean; difference-making → quantile (e.g. 25th percentile) |
| Great Filter prior P(behind us) | 0.0–1.0 | 0.5 | Used in channel A |
| Hingeyness P(we are at uniquely critical period) | 0.0–1.0 | 0.1 | Multiplies channel B (high hingeyness = our actions matter more for cosmic endowment) |
| Grabby Aliens credence | 0.0–1.0 | 0.1 | Mixing weight when "Hybrid" cosmology is selected; ignored otherwise |

### 5.5 Prior overrides

To accommodate users who weight evidence outside the Drake/Grabby parameters — e.g. those who take UAP observations as evidence of alien presence, or those with strong philosophical priors — the tool exposes optional prior overrides. These are clearly labelled as opinionated inputs that bypass the model:

- **"Override P(at least one alien civ in Milky Way)"** — toggle + slider. When enabled, replaces the cosmology-derived `P(N ≥ 1)` with the user's direct credence. Drake/Grabby parameters become irrelevant for this run; this is a pure Bayesian shortcut.
- **"Override detection sensitivity floor"** — toggle + slider. When enabled, ensures `P(detection | aliens exist)` doesn't fall below this floor (for users who think alien presence is already evident in some form).

The tool takes no position on whether such overrides are warranted — that's the user's epistemic call. The README should explain that the tool computes EV of search effort *given* a prior, and the prior is the user's responsibility. Per Azad's directional-reasoning observation, conditional probabilities have direction: "no probes → no aliens" doesn't licence "no aliens → no probes," and users should be free to encode whatever evidence they find compelling.

## 6. UI specification

### 6.1 Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Drake Cause Prioritization Tool   [Cosmology ▼] [Preset ▼] [🔗]│
│  Should we fund alien-finding? — A worldview-sensitive analysis │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   TOP-OF-PAGE LIVE STATS:                                       │
│   • P(no other civ in MW): X%   • P(≥1 other civ): Y%           │
│   • P(any detection in decade): Z%                              │
│   • Cost-effectiveness vs GiveWell: median W×                   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [Output Histogram]              [Comparator Bars]              │
│   x: log multiplier vs GW         GiveWell │ Animal │ AI │ Bio │ │
│   shaded percentile bands         This tool: ...                │
├─────────────────────────────────────────────────────────────────┤
│  ▼ Drake parameters    ▼ Detection programmes                   │
│  ▼ Value channels      ▼ Worldview                              │
│  ▼ Prior overrides (advanced)                                   │
├─────────────────────────────────────────────────────────────────┤
│  [Compare side-by-side ▼]  Pick 2–4 presets to render in parallel
└─────────────────────────────────────────────────────────────────┘
```

Sections collapsible. Default state: Drake & Detection open; Value & Worldview collapsed but with summary preview.

### 6.2 Component list

- `<RangeSlider>` — supports log scale, min/max bounds, "warn below floor" UI, tooltip with reference info
- `<ProbabilitySlider>` — 0–1 linear with percentage display
- `<DistributionHistogram>` — recharts BarChart with log x-axis, percentile bands, vertical line for GiveWell bar
- `<ComparatorBars>` — horizontal bar chart of cost-effectiveness vs reference cause areas
- `<MethodToggle>` — for the five detection programmes; toggle + cost slider + sensitivity slider + tooltip
- `<ChannelCard>` — for each of the four value channels; collapsible, with mini-explanation
- `<WorldviewPanel>` — six dials grouped together
- `<PresetSelector>` — dropdown that loads a preset configuration (see 6.4)
- `<CosmologySelector>` — three-way segmented control: SDO Drake / Grabby Aliens / Hybrid
- `<PriorOverridePanel>` — the optional Bayesian-shortcut overrides from §5.5
- `<PermalinkButton>` — copy-current-state-as-URL button (see §6.5)
- `<ComparisonView>` — when enabled, renders 2–4 histograms side-by-side, one per selected preset, with a small dial-summary above each

### 6.3 Interactions

- Slider changes → debounced re-run of MC (~150ms) → update histogram + stats
- "Reset to defaults" button per section
- "Lock astrophysical params" — convenience toggle to fix R*, f_p, n_e at well-supported values, leaving only the speculative parameters live
- "Show me the SDO finding" — info button that explains why P(alone) is so high under honest priors

### 6.4 Worldview presets

These should populate ALL relevant dials, not just a subset:

| Preset | Longtermism | Discount | Person-affecting | Alien weight | Risk | Filter prior | Hingeyness |
|--------|-------------|----------|-------------------|--------------|------|--------------|------------|
| **Bostrom Longtermist** | 1.0 | 0% | off | 0.5 | EV-max | 0.5 | 0.5 |
| **Hanson Filter Pessimist** | 0.7 | 0% | off | 0.1 | EV-max | 0.2 (filter likely ahead) | 0.3 |
| **Ord Moderate** | 0.5 | 0.1% | off | 0.3 | log-utility | 0.5 | 0.2 |
| **Neartermist** | 0.0 | 3% | on | 0.0 | EV-max | 0.5 | 0.0 |
| **Dark Forest** | 0.5 | 0% | off | 0.0 | difference-making | 0.5 | 0.2 |
| **Astronomical Waste maximalist** | 1.0 | 0% | off | 0.0 | EV-max | 0.7 | 0.8 |

Each preset should also bias certain value channels (e.g. Dark Forest preset turns up the channel D probability to 0.3).

### 6.5 Permalinks and sharing

State is fully serialisable. The tool supports shareable permalinks with no backend required:

- **Encoding:** all dial values, toggles, cosmology selection, prior overrides, and section UI state serialise to a single JSON object → deflate-compress → base64url → place in URL hash fragment as `#s=...`. Hash (not query string) keeps the state out of server logs and CDN caches.
- **Versioning:** the encoded state object includes a `v` field (start at `v=1`). When the schema changes, bump the version and add a migration in a `migrations/` map keyed by `v`. On load, run all applicable migrations in sequence so old links keep working.
- **Compactness:** with deflate + base64url, a full state object should fit in ~500–1500 chars — well within practical URL limits and shareable on Twitter/Bluesky/Substack without truncation. If a particular state exceeds 2000 chars, fall back to "Export config as JSON" (see below) rather than a permalink.
- **UI:** a 🔗 button next to the preset selector. On click: copy URL to clipboard, show a 1.5s "Copied!" toast confirmation. Optionally, a kebab menu next to it for "Export config as JSON" and "Import config from JSON" — useful for verbose sharing, version control, or pasting into a blog post.
- **Loading flow:** on page load, parse `window.location.hash`; if a state object is present, validate against schema and apply migrations; on success, hydrate state before first MC run; on failure, fall back to defaults and show a non-blocking warning with a "Start fresh" button.
- **Reset:** "Reset to defaults" must also clear the URL hash via `history.replaceState(null, '', window.location.pathname)`.
- **Live URL update:** debounced (~500ms) `history.replaceState` on state change so the address bar always reflects the current state. This makes "just bookmark this page" work as a save mechanism.

The use case: someone reading your Substack post can be linked directly to a specific configuration via `https://aliens.allinlabs.io/#s=...` ("here's what the model says under my exact worldview"), then tweak from there.

## 7. Output computation

### 7.1 Cost-effectiveness in GiveWell-bar units

- `total_cost` = sum of decadal marginal costs for *enabled* methods
- `EV_in_DALYs` = `P(detect) × V_user` (per worldview transform)
- `DALYs_per_dollar` = `EV_in_DALYs / total_cost`
- **GiveWell bar**: `1 / 100` DALYs per dollar (i.e. ~$100 per DALY averted, the rough top-charity bar; configurable as a constant)
- `multiplier = DALYs_per_dollar × 100`

Output the histogram of `multiplier` across MC samples, on a log x-axis, from 1e-6× to 1e6× GiveWell.

### 7.2 Comparator references

Display these as horizontal bars next to the tool's output (all in "× GiveWell-bar" units). These are rough community estimates — make them adjustable in a settings panel and link to source.

| Cause | Multiplier (rough) | Source |
|-------|--------------------|--------|
| GiveDirectly | 0.1× | GiveWell |
| GiveWell top charities | 1× | by definition |
| Cage-free corporate campaigns | 10–1000× | OPP, RP estimates (highly disputed under person-affecting) |
| AI safety (technical) | 0.001×–10000× | huge uncertainty |
| Biosecurity / pandemic prep | 0.1×–1000× | OPP estimates |

These should display as ranges (whiskers), not point values, to be honest about disagreement.

**[Superseded — see §0. The table's ranges had no sources behind them. The chart now shows only published figures; AI safety has none its authors stand behind, so it is listed as "not shown".]**

### 7.3 Histogram & summary stats

- Mean (or geometric mean / 25th percentile per risk-aversion choice)
- Median
- 5th / 95th percentile
- P(this is more cost-effective than GiveWell bar)
- P(this is *negative* expected value) — important honesty flag

## 8. Code structure

```
drake-tool/
├── public/
├── src/
│   ├── components/
│   │   ├── RangeSlider.tsx
│   │   ├── ProbabilitySlider.tsx
│   │   ├── DistributionHistogram.tsx
│   │   ├── ComparatorBars.tsx
│   │   ├── MethodToggle.tsx
│   │   ├── ChannelCard.tsx
│   │   ├── WorldviewPanel.tsx
│   │   ├── PresetSelector.tsx
│   │   ├── CosmologySelector.tsx
│   │   ├── PriorOverridePanel.tsx
│   │   ├── PermalinkButton.tsx
│   │   └── ComparisonView.tsx
│   ├── model/
│   │   ├── drake.ts          # SDO Drake sampling
│   │   ├── grabby.ts         # Grabby Aliens model + hybrid mixing
│   │   ├── detection.ts      # Detection probability per method
│   │   ├── value.ts          # Four channels
│   │   ├── worldview.ts      # Dial transforms
│   │   └── monteCarlo.ts     # Main loop
│   ├── workers/
│   │   └── mcWorker.ts       # Web Worker host for MC
│   ├── lib/
│   │   ├── permalink.ts      # encode/decode, base64url, deflate
│   │   └── migrations.ts     # versioned schema migrations
│   ├── presets/
│   │   └── worldviews.ts     # The six presets
│   ├── constants/
│   │   ├── defaults.ts       # All default values from this spec
│   │   └── comparators.ts    # Reference cause-area cost-effectiveness
│   ├── store.ts              # Zustand or context
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   ├── unit/
│   │   ├── drake.test.ts
│   │   ├── grabby.test.ts
│   │   ├── detection.test.ts
│   │   ├── value.test.ts
│   │   ├── worldview.test.ts
│   │   └── monteCarlo.test.ts
│   ├── integration/
│   │   ├── permalink.test.ts        # Round-trip + version migrations
│   │   └── presets.test.ts          # Each preset produces sensible outputs
│   └── e2e/
│       └── README.md                # Notes on how to drive Puppeteer MCP for visual checks
├── CLAUDE.md                 # Working notes for Claude Code (see §13.6)
├── README.md                 # User-facing: philosophical framing, references
├── eslint.config.js          # See §13.2
├── tsconfig.json             # See §13.1
├── .prettierrc.json
├── vitest.config.ts
├── vite.config.ts
└── package.json
```

## 9. Implementation phases

**Verification gate at every phase boundary:** before declaring a phase complete, all of the following must pass:

1. `pnpm test` — all unit + integration tests green (write tests *first* for new model code; see §13.4)
2. `pnpm lint` — zero ESLint warnings (§13.2)
3. `pnpm typecheck` — zero TypeScript errors under strict mode (§13.1)
4. **Puppeteer MCP visual check** — start dev server, navigate to it, take a screenshot, verify the new UI renders correctly and any new interactions update output as expected (§13.5). Phase-specific checks listed below.

**Phase 1 — Drake core (1 session)**
- Vite + React + TS + Tailwind scaffold with strict configs (§13.1, §13.2) committed up front
- Drake parameter sliders with log-uniform sampling
- MC engine in main thread (move to Worker in Phase 4)
- Histogram of N
- Paired "P(N=0)" / "P(N≥1)" headline stats
- *Tests first:* `tests/unit/drake.test.ts` — sampling produces correct distributions (deterministic with seed; bounded; log-uniform shape verified by Kolmogorov-Smirnov against reference)
- *Puppeteer check:* sliders render; moving R* slider visibly changes histogram; both headline stats display and sum to 100%

**Phase 2 — Detection (1 session)**
- Five method toggles + cost/sensitivity sliders
- Combined `P(detection)` calc
- Top-of-page "P(any detection in decade)" stat
- *Tests first:* `tests/unit/detection.test.ts` — `1 - Π(1 - P_m)` formula correct; toggling methods off zeroes their contribution; RETINA at default cost is dramatically cheaper per unit detection probability
- *Puppeteer check:* enabling/disabling each method updates the detection stat; impossible combinations (e.g. zero cost) handled gracefully

**Phase 3 — Value channels (1 session)**
- Four channel cards with all sub-dials
- Aggregate `V_detect` calc
- Histogram now shows EV in DALYs
- *Tests first:* `tests/unit/value.test.ts` — each channel computes correctly under known inputs; signs flip where they should (e.g. Channel A goes negative when Δ > 0 and prior is "filter behind")
- *Puppeteer check:* Dark Forest channel slider can drive output negative; toggling channels off zeroes their contribution to histogram

**Phase 4 — Worldview & presets (1 session)**
- Worldview panel with seven dials
- Preset selector with six presets
- Move MC into Web Worker
- Side-by-side comparison view (start with 2 presets)
- *Tests first:* `tests/unit/worldview.test.ts` — each dial transform is correct; `tests/integration/presets.test.ts` — each preset produces a stable, distinct output distribution
- *Puppeteer check:* loading each preset visibly shifts the histogram; side-by-side renders both panels correctly

**Phase 5 — Cosmology models & prior overrides (0.5 session)**
- Add Grabby Aliens model and hybrid mixing
- `<CosmologySelector>` UI
- `<PriorOverridePanel>` for the §5.5 Bayesian-shortcut overrides
- Update worker to handle all three cosmology branches
- *Tests first:* `tests/unit/grabby.test.ts` — Grabby sampling produces correct shape; hybrid mixing weights samples proportionally
- *Puppeteer check:* switching cosmology updates headline stats; enabling P(N≥1) override bypasses Drake parameters as expected

**Phase 6 — Output polish & comparators (1 session)**
- Cost-effectiveness multiplier histogram
- Comparator bars (with whiskers for ranges)
- Summary stats panel (mean, median, percentiles, P(negative EV))
- Tooltips and references throughout
- *Puppeteer check:* every tooltip renders; comparator bars show range whiskers; P(negative EV) displays and is non-zero under Dark Forest preset

**Phase 7 — Permalinks & deployment (0.5 session)**
- Encode/decode state with base64url + deflate
- Versioning + migrations scaffold
- 🔗 button + clipboard + toast
- Live URL updates on state change (debounced)
- Export/import as JSON
- `vite build`
- Caddy config snippet for `aliens.allinlabs.io` with SPA fallback
- README with citations: SDO 2018, Bostrom 2003, Hanson 2021, Sandberg & Armstrong 2013, Ord *Precipice*, Azad 2026
- *Tests first:* `tests/integration/permalink.test.ts` — round-trip equality on randomised state; v1→v2 migration test (synthetic, to validate the framework even if no migrations exist yet)
- *Puppeteer check:* generate permalink, open in fresh page context, verify state hydrates bit-identically; clear via reset button removes hash

## 10. Acceptance criteria & honesty checks

The tool ships when all of these are visibly true on first load with default settings:

1. **Both P(N=0) and P(N≥1) display prominently and equally.** No "we are probably alone" framing — paired stats only.
2. **Default cost-effectiveness multiplier** under the Ord Moderate preset is **not** "obviously a top EA cause." If the defaults produce 100× GiveWell with no tuning, defaults are biased and need adjusting.
3. **P(negative EV)** is shown — Dark Forest / hostile contact channel should make this non-trivial under some worldviews.
4. **Comparator bars** show ranges, not points, with hover tooltips explaining sources.
5. **No worldview is privileged in the UI.** All six presets have equal billing in the dropdown.
6. **No cosmology is privileged in the UI.** SDO is the default, but Grabby Aliens and Hybrid have equal billing in the selector with neutral descriptions.
7. **Sensitivity caveat** appears in the Detection section: "Per-method sensitivities are the most uncertain numbers in this model and dominate the result. Adjust them critically."
8. **Tooltips link to primary sources** for each major number (SDO paper, Hanson grabby paper, Bostrom astro-waste, Azad critique, GiveWell methodology, etc.).
9. **Permalinks round-trip cleanly** — sharing a URL and opening it in a fresh browser produces a bit-identical state.
10. **`pnpm test` passes** with non-trivial coverage of all model code (drake, grabby, detection, value, worldview, monteCarlo) and the permalink round-trip.
11. **`pnpm lint` passes with zero warnings** under the strict ESLint config (§13.2).
12. **`pnpm typecheck` passes with zero errors** under TypeScript strict mode (§13.1). No `any` anywhere in `src/` (verified by lint rule).
13. **Puppeteer MCP smoke test passes** — a single end-to-end run that loads the app, exercises one of each major control type (slider, toggle, preset, cosmology, permalink), and screenshots the result.

## 11. Open implementation questions

These are best resolved during Phase 1 by Claude Code, but flagging them now:

1. **Web Worker vs main thread for MC.** 10⁵ samples × ~30 ops should be fast enough on main thread, but UI may stutter on slower devices. Recommend Worker from the start to avoid retrofitting.
2. **Histogram binning.** Log x-axis with ~50 bins from 1e-6 to 1e6 GiveWell is a reasonable default; consider letting the user toggle linear/log.
3. **Preset comparison performance.** Running 4 MC simulations in parallel with 10⁵ samples each = 4×10⁵ ops. Should still be fine in a Worker. If not, drop to 5×10⁴ for comparison view only.
4. **Sensitivity slider UI.** The numbers (1e-6 to 1e-1) are awkward on a normal slider. Consider exposing as "log10(sensitivity)" with a label like "log sensitivity: -3" alongside the actual probability.
5. **Mobile.** Out of scope for v1, but the sliders shouldn't break on narrow viewports. Stack vertically.
6. **Grabby Aliens implementation depth.** Hanson's full model is mathematically rich. For v1, abstract it to a single P(we are inside grabby zone) prior with a sensitivity boost on probe/passive_radar methods, rather than implementing the full expansion-rate dynamics. Note this in the tooltip so users know the simplification.
7. **Permalink schema versioning.** Recommend strict versioning: bump `v` on any breaking schema change, never reuse a version number, always provide a migration. Keep migrations idempotent. Test round-trips on every change.

## 12. Reading & references

For Claude Code to consult when implementing tooltips and the README:

- Sandberg, Drexler & Ord (2018), *Dissolving the Fermi Paradox* — arXiv:1806.02404
- Sandberg & Armstrong (2013), *Eternity in Six Hours: intergalactic spreading of intelligent life and sharpening the Fermi paradox* — for the probe-feasibility argument and its directional reasoning
- Hanson, Martin, McCarter & Paulson (2021), *If Loud Aliens Explain Human Earliness, Quiet Aliens Are Also Rare* — arXiv:2102.01522 (the Grabby Aliens paper)
- Hanson, *The Great Filter* — Hanson's homepage
- Azad (2026), *Contra Fermi Paradox is Not Contra UFOs* — jehanazad.com — for the framing critique of "P(alone)" stats and the directional-reasoning point
- Bostrom (2003), *Astronomical Waste* — nickbostrom.com/astronomical/waste.html
- Ord (2020), *The Precipice* — for x-risk DALY framing
- Open Philanthropy worldview diversification posts
- Rethink Priorities CRAFT/CURVE sequence — for risk-aversion / decision-theory framings
- GiveWell cost-effectiveness analysis — for the bar

## 13. Verification, testing, and CLAUDE.md

The verification gates referenced throughout §9 and §10 are specified here. **All four gates (test, lint, typecheck, Puppeteer smoke) must pass at every phase boundary.** No "I'll fix it later" — fix it now or revert the change.

### 13.1 TypeScript strict configuration

`tsconfig.json` should set every available strictness flag. This is the floor:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable", "WebWorker"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",

    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true,
    "useUnknownInCatchVariables": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false,

    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["src", "tests"]
}
```

Notable consequences: `noUncheckedIndexedAccess` means `arr[0]` has type `T | undefined`, forcing explicit handling. `exactOptionalPropertyTypes` means `{x?: number}` is *not* assignable from `{x: undefined}`. These will generate friction up front and pay back later.

### 13.2 ESLint configuration

Use `typescript-eslint`'s strict-type-checked preset plus React, hooks, a11y, and import plugins. `eslint.config.js`:

```js
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import a11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';

export default tseslint.config(
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: { parserOptions: { project: './tsconfig.json' } },
    plugins: { react, 'react-hooks': reactHooks, 'jsx-a11y': a11y, import: importPlugin },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'import/order': ['error', { 'newlines-between': 'always', alphabetize: { order: 'asc' } }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
    },
  },
);
```

Run as `pnpm lint` (alias for `eslint . --max-warnings=0`). Zero warnings is the gate, not zero errors.

### 13.3 Formatting

Prettier with default settings. Single source of truth — no rules duplicated in ESLint. Run on save in editor; `pnpm format` formats the whole tree.

### 13.4 Test-driven development

**TDD applies to all model code (`src/model/*.ts`) and the permalink lib.** These are pure functions — easy to test, hard to debug if you don't. The workflow:

1. Write a failing test that pins the desired behaviour
2. Implement the minimum code to pass
3. Refactor with the test as a safety net
4. Repeat

For each model file, tests should cover:
- **Determinism with seed:** sampling is reproducible given a fixed RNG seed (use a seedable PRNG; the global `Math.random` is non-deterministic). Consider `seedrandom` or implementing xoroshiro inline.
- **Distribution shape:** with N=10⁴ samples, the empirical distribution matches the analytical one within a tolerance (e.g. KS-test for log-uniforms).
- **Edge cases:** zero costs, all methods disabled, all channels disabled, prior overrides active.
- **Algebraic identities:** disabling all channels gives `V_detect = 0`; disabling all methods gives `P(detection) = 0`; setting `f_d = 1` and a single perfect method gives `P(detection) → 1` for `N ≥ 1`.

**TDD is *not* required for components.** Use React Testing Library for behavioural tests where it's worth it (preset loading, slider range enforcement, permalink button), but don't waste time on shallow snapshot tests of every visual tweak. Visual verification is Puppeteer's job.

### 13.5 Puppeteer MCP for end-to-end verification

The Puppeteer MCP server lets Claude Code drive a real browser. Use it at every phase boundary for visual verification, and for the E2E smoke test in §10.

**Pattern at each phase boundary:**

1. Start dev server: `pnpm dev` (in background)
2. Use Puppeteer MCP to navigate to `http://localhost:5173`
3. Take a screenshot — eyeball it for layout regressions
4. Exercise the new functionality: click toggles, drag sliders (use `evaluate` to dispatch input events on range inputs since dragging is fiddly), select presets
5. Take screenshots at each step
6. Verify expected text/numbers appear via DOM queries

**Phase 7 (permalinks) E2E specifically:**

- Set a non-default state via UI interactions
- Read `window.location.hash` via `evaluate`
- Open a new browser context, navigate to the URL with that hash
- Read the state via either visible UI text or `window.__store` (expose this in dev for testing)
- Assert bit-equality

**Visual sanity checks Claude Code should perform every phase:**

- Are headline stats both visible and not overflowing?
- Does the histogram render (not blank, not erroring)?
- Do tooltips appear on hover where they should?
- Are sliders visually distinct when warning-floor crossed (per §5.1)?
- On narrow viewport (e.g. 768px), does anything overlap or break?

If a screenshot looks wrong, fix it before moving on. "Done" means visually correct, not just type-checked.

### 13.6 CLAUDE.md contents

When Claude Code starts the project, it should write a `CLAUDE.md` at the repo root with the following contents (verbatim or adapted):

````markdown
# CLAUDE.md — Working notes for Claude Code

## What this project is

An interactive tool that evaluates "searching for alien civilisations" as an EA cause area. Built per the spec at `drake-tool-spec.md` (root). Read that first if you've forgotten the design.

**The single most important property of this project is epistemic neutrality.** The spec exists because the goal is honest analysis, not a pitch. If you find yourself defaulting toward parameter values or copy that make alien-finding look favourable, stop and reread §10 of the spec. The acceptance criteria forbid this.

## Quality gates — all four must pass before any phase is "done"

```bash
pnpm test         # Vitest — unit + integration; TDD for model code
pnpm lint         # ESLint with --max-warnings=0; strict-type-checked preset
pnpm typecheck    # tsc --noEmit; strict mode + every extra strictness flag
pnpm dev          # then verify visually with Puppeteer MCP
```

If any of these fail, fix before proceeding. No "I'll come back to this."

## TDD for model code

Files in `src/model/` and `src/lib/` are pure functions. Write tests first:

1. New behaviour → new failing test in `tests/unit/{module}.test.ts`
2. Implement minimum code to pass
3. Refactor under test
4. Re-run all gates

This is non-negotiable for `drake.ts`, `grabby.ts`, `detection.ts`, `value.ts`, `worldview.ts`, `monteCarlo.ts`, and `lib/permalink.ts`.

## Puppeteer MCP usage

At every phase boundary:

1. Start dev server in background
2. Navigate to `http://localhost:5173` via Puppeteer
3. Screenshot baseline
4. Exercise the new feature; screenshot again
5. Verify state visually and via DOM queries
6. If anything looks wrong, fix it

For range sliders, use `evaluate` to dispatch synthetic `input` events — dragging is unreliable.

For permalink testing, open a fresh browser context and verify state hydrates identically.

## TypeScript style

- **No `any`.** Ever. Use `unknown` and narrow with type guards.
- **No `!` (non-null assertion).** Use a real check or `assertNonNull` helper.
- **`noUncheckedIndexedAccess` is on** — `arr[0]` is `T | undefined`. Handle the undefined case.
- **`type` imports** for type-only imports (lint enforces this).
- Discriminated unions over enums for state machines (cosmology selector, decision theory, etc.).

## Phase tracking

The spec's §9 lists Phases 1–7. After completing each phase:

1. Run all four gates and confirm green
2. Commit with a message referencing the phase (`Phase 3: value channels complete`)
3. Update this CLAUDE.md with anything you learned that future-you should know (gotchas, surprising behaviours, design decisions that aren't in the spec)

## Things you'll forget and shouldn't

- The headline stats are PAIRED — `P(N=0)` and `P(N≥1)`. Never display only one.
- The Ord Moderate preset must NOT produce "obviously a top EA cause" with default settings. If it does, defaults are biased. Fix.
- RETINA is in the same UI list as everything else; it doesn't get special billing.
- Hanson's grabby aliens model is included but its premises are contested (per Azad). Tooltip must say so.
- Sensitivity coefficients (per-method, per-$1B-decade) are the most uncertain numbers in the model. Tooltip must say so.

## When stuck

If stuck on a design question not answered by the spec, prefer the option that:

1. Is more honest (shows uncertainty, doesn't bias output)
2. Is more conservative (defaults toward "probably not a top cause")
3. Is simpler (v1 — Hanson's full math is out of scope, see §11.6 of the spec)

If the question is genuinely ambiguous, ask the user.
````

This CLAUDE.md is itself part of the deliverable — it should be committed at the start of Phase 1 and updated as the project progresses.

### 13.7 Quality-gate workflow summary

The order of operations every time Claude Code is about to declare any unit of work complete:

```
1. pnpm test         (writes new tests first if doing TDD; expects all green)
2. pnpm lint         (zero warnings)
3. pnpm typecheck    (zero errors)
4. pnpm dev          (start server)
5. Puppeteer MCP     (navigate, exercise, screenshot, verify)
6. Commit            (with phase reference)
7. Update CLAUDE.md  (if anything notable was learned)
```

Skipping any of 1–5 is a defect in process even if the resulting code happens to work. The point is the discipline; without it the spec's honesty guarantees become aspirational.

### 13.8 Claude Design handoff

Visual design is being done **before** Phase 1, in Claude Design (Anthropic Labs). The output of that work is a handoff bundle that Claude Code consumes at the start of Phase 1. This section specifies how the handoff fits into the rest of the spec.

**Inputs to the Claude Design session:**

- This spec file (`drake-tool-spec.md`) — give Claude Design the whole thing; it should understand the philosophical neutrality requirements, not just the visual asks.
- A small set of visual references — **3 reference sites, 2–3 high-resolution screenshots each, of specific views (not homepages)**. Opus 4.7 (the model behind Claude Design) accepts images up to ~2,576 px on the long edge, so high-res screenshots carry plenty of detail for it to reason about. Screenshots are the primary input, not URLs — Claude Design cannot autonomously visit a URL and explore it.
- *Optionally:* the Claude Design web-capture bookmarklet, used selectively. The bookmarklet is user-driven: you navigate your browser to a reference page, click the bookmarklet, then hover-and-click individual elements to add them to a structural capture (which arrives in Claude Design as a JSON file describing those elements). It's slower per element than a screenshot and produces structure, not visuals — so use it only when you specifically want the DOM/structural detail of a particular component (e.g. the slider treatment on the IiB Drake page, or the dial layout on Portfolio Builder). For overall layout and aesthetic, screenshots are better.
- Constraints: distribution-first (histograms over single numbers); information-dense without being cluttered; equal visual weight to paired stats; no celebratory or scary framing on outputs.

**Neutrality requirements for the design phase:**

The §10 honesty checks apply to visual design as well as copy. When prompting Claude Design, explicitly require:

1. `P(N=0)` and `P(N≥1)` rendered with **identical typographic and chromatic weight**. Neither is framed as the "main" answer.
2. Cost-effectiveness output histogram is **chromatically neutral** across the whole range. No green-for-good / red-for-bad — that visually instructs the user about which direction is desirable, which is exactly what the tool refuses to do. A single neutral hue (e.g. greys, or a single muted colour) shaded by density is correct.
3. Worldview presets get **equal billing in the dropdown** — no preset is the "default look" or pre-selected with extra polish.
4. Cosmology selector treats SDO / Grabby / Hybrid as **equal options**. Default to SDO, but the visual treatment shouldn't make the others feel secondary.
5. The comparator bars in §7.2 use **whiskers for ranges, not point estimates** — design must support showing uncertainty, not just a single bar height.
6. Tooltips link to primary sources and read as **expository**, not advocative.

**Handoff bundle structure:**

The Claude Design export should be placed at `./design/` in the repo before Phase 1 begins. Claude Code reads from there during scaffolding. Expected contents (approximately, depending on Claude Design's output format at the time):

- Design tokens (colours, typography scale, spacing scale) — these become the Tailwind config and CSS variables
- Component-level mockups for each major UI element listed in §6.2
- Layout specs for the main view and the comparison view
- Interactive prototype HTML (for visual reference; not the production code)
- A README from Claude Design instructing the coding agent on intent

**Phase 1 amendment:**

Phase 1 in §9 begins with: "Read the handoff bundle at `./design/` and apply the design tokens to the Tailwind config before scaffolding components." All component implementations in subsequent phases conform to the handoff bundle's design specs. If a component is needed that the handoff didn't cover (rare, but possible — e.g. an obscure error state), Claude Code infers visual treatment from the existing tokens rather than improvising freely.

**When visual changes come up later:**

If after Phase 7 deployment a visual issue arises (a layout breaking on mobile, a component the design didn't anticipate, a reader complaining the histogram is hard to read), the workflow is:

1. Take a high-res screenshot of the affected view on the live site (`aliens.allinlabs.io`). For a quick layout regression, this is usually enough.
2. *Optionally,* if you need structural detail of a specific broken element, use the Claude Design web-capture bookmarklet on the live page: navigate there in your browser, click the bookmarklet, hover-and-click the element to capture it as JSON.
3. Open a new Claude Design session (or continue the existing one) and supply the screenshot, plus the structural capture if you used one. Describe the issue and ask for a revised treatment.
4. Iterate on just that component in the canvas.
5. Export an updated partial handoff bundle (just the changed pieces) and apply via Claude Code.

Note that Claude Design cannot autonomously visit `aliens.allinlabs.io` and find issues on its own — every iteration requires you to drive the browser and supply the screenshots/captures. Plan for this when scoping post-deployment fix sessions.

Don't make ad-hoc visual changes in code without going through Claude Design — the design system stays the source of truth, otherwise the visual coherence drifts over time.
