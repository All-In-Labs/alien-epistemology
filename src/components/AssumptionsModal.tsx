// All assumptions baked into the analysis — surfaced for the spec's "epistemic
// neutrality" requirement. Uses the native <dialog> element with showModal()
// for backdrop + focus-trap + Esc-to-close, no library needed.

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { CitationLink } from './CitationLink';

interface AssumptionsModalProps {
  open: boolean;
  onClose: () => void;
}

interface Assumption {
  text: ReactNode;
}

interface Category {
  title: string;
  blurb: string;
  items: Assumption[];
}

const CATEGORIES: Category[] = [
  {
    title: 'Cosmology & Drake structure',
    blurb: 'How we model "how many alien civilisations exist."',
    items: [
      {
        text: (
          <>
            By default <em>fₗ</em> follows <strong>SDO 2018&rsquo;s own model</strong>: fₗ = 1
            − e<sup>−λVt</sup> with log₁₀(λVt) ~ Normal(0, 50), i.e. a median of one abiogenesis
            event per planet and a standard deviation of 50 orders of magnitude (
            <CitationLink cite="sdo2018" text="SDO 2018 §3.1" />). The split is between worlds,
            not planets: in about half of worlds life arises on nearly every habitable planet,
            and in most of the rest it almost never does (SDO: mean fₗ 0.5, median 0.63). With
            the tool&rsquo;s other defaults this gives <em>P(no civ)</em> ≈ 53%; fed
            SDO&rsquo;s Table 1 ranges it reproduces their 52%.
          </>
        ),
      },
      {
        text: (
          <>
            The seven Drake factors{' '}
            <em>
              R★, fₚ, nₑ, fₗ, fᵢ, f<sub>c</sub>, L
            </em>{' '}
            and the tool&rsquo;s eighth, f<sub>d</sub>, are{' '}
            <strong>independently distributed</strong>.
            Real-world correlations (e.g. denser star regions might produce both more planets and
            shorter civ lifetimes) are not modelled.
          </>
        ),
      },
      {
        text: (
          <>
            Each Drake parameter is sampled <strong>log-uniform</strong> between user-set bounds,
            except <em>fₚ</em> which is sampled <strong>linear-uniform</strong> (Kepler/microlensing
            data clusters at the upper end, so log-uniform would over-weight low values). This
            departs from <CitationLink cite="sdo2018" text="SDO 2018 Table 1" />, which uses
            log-uniform 0.1–1 for <em>fₚ</em>.
          </>
        ),
      },
      {
        text: (
          <>
            Dragging the <em>fₗ</em> slider switches to <strong>your own range</strong>, sampled
            log-uniform (default 10⁻³⁰ to 1). That is much more pessimistic than SDO&rsquo;s
            model: it puts only ~3% of samples above 0.1, and gives <em>P(no civ)</em> ≈ 88%.
            Either way, <em>fₗ</em> moves the verdict more than any other Drake parameter
            (see the Ch.6 tornado).
          </>
        ),
      },
      {
        text: (
          <>
            <em>N</em> from the Drake equation is the <strong>expected count</strong>, not the
            actual count. We treat the actual count as Poisson(<em>N</em>): so{' '}
            <em>P(no civ) = E[exp(−N)]</em>, <em>P(=1) = E[N · exp(−N)]</em>, etc. SDO 2018
            report <em>Pr[N &lt; 1]</em> instead and note in a footnote that the Poisson version
            differs little.
          </>
        ),
      },
      {
        text: (
          <>
            <em>f_d</em> (detection-readiness multiplier) is a tool-specific addition not in
            SDO 2018: the share of civilisations producing a signature of a kind our instruments
            look for. It overlaps with SDO&rsquo;s own f_c, which they define as the fraction of
            civilisations that are &ldquo;detectable/contactable&rdquo;, so using both partly
            counts detectability twice. That makes the search look <em>worse</em>: at the
            default range it cuts detectable civilisations by a median of ~30×. It multiplies <em>N</em> by a sample from [user min, user max] log-uniform
            to get <em>N_detectable</em>. Default range [10⁻³, 1.0]. How far away a signature
            could be seen is handled separately, by each method&rsquo;s reach (Ch.2).
          </>
        ),
      },
      {
        text: (
          <>
            <strong>Grabby aliens are not modelled separately.</strong>{' '}
            <CitationLink cite="hansonGrabby" text="Hanson et al. 2021" /> fit their model on the
            premise that we are <em>not</em> inside an expanding civilisation&rsquo;s territory,
            so it cannot be used to add one. Their conclusion for searches is pessimistic: a
            &ldquo;depressingly low transition chance (&lt;∼10⁻⁴) is required to expect that even
            one other quiet alien civilization has ever been active in our galaxy. Which seems
            bad news for SETI.&rdquo; If you share that view, lower fₗ or use the prior overrides
            just after Ch.4, which also cover &ldquo;they&rsquo;re already here&rdquo;.
          </>
        ),
      },
      {
        text: (
          <>
            <strong>Calibration.</strong> With SDO&rsquo;s fₗ model and their Table 1 ranges,
            the Drake model reproduces <CitationLink cite="sdo2018" text="SDO 2018" />
            &rsquo;s pre-Fermi 52%, and an automated test checks it stays that way.
          </>
        ),
      },
    ],
  },
  {
    title: 'Detection & instrumentation',
    blurb: 'How we model "what would actually find them."',
    items: [
      {
        text: (
          <>
            Per-target-per-decade detection probability is{' '}
            <em>p_m = r_m × (1 − exp(−s_m × c_m_$B))</em>: the method&rsquo;s{' '}
            <strong>reach</strong> <em>r_m</em> (share of the galaxy its instruments can cover
            this decade) times a <strong>Poisson-arrival</strong> chance of catching a target in
            reach. Spend raises the second factor, never the first, so no budget pushes{' '}
            <em>p_m</em> above the reach. Treats one method-decade-target as a single Bernoulli
            trial and assumes targets are spread evenly across the galaxy's stars.
          </>
        ),
      },
      {
        text: (
          <>
            Detections across methods are <strong>independent</strong> given <em>N_detectable</em>.
            Shared confounders (atmospheric noise affecting both SETI and technosignature, downtime
            during a target's signal window) aren't modelled.
          </>
        ),
      },
      {
        text: (
          <>
            Reach <em>r_m</em> and in-reach sensitivity <em>s_m</em> are sampled log-uniform from
            user bounds. Costs <em>c_m</em> are point estimates with no uncertainty.
          </>
        ),
      },
      {
        text: (
          <>
            <strong>Reach is sourced</strong>: published survey sizes and sensitivity limits
            divided by ~2×10¹¹ stars, the middle of the galaxy&rsquo;s 100&ndash;400 billion (
            <CitationLink cite="nasaStarCount2015" text="NASA" />
            ), at both ends of each range and without rounding up. Radio SETI 1.5×10⁻⁸&ndash;3×10⁻⁴ (
            <CitationLink cite="sheikh2025" text="Sheikh 2025" />,{' '}
            <CitationLink cite="gajjar2021" text="Gajjar 2021" />,{' '}
            <CitationLink cite="margot2026" text="Margot 2026" />
            ); optical and infrared 3×10⁻⁸&ndash;1.5×10⁻³ (
            <CitationLink cite="tellisMarcy2017" text="Tellis & Marcy 2017" />,{' '}
            <CitationLink cite="suazo2022" text="Suazo 2022" />
            ); biosignatures 5×10⁻¹²&ndash;5×10⁻¹¹ (
            <CitationLink cite="stsciRockyWorlds2025" text="STScI 2025" />
            ). RETINA&rsquo;s 10⁻¹²&ndash;10⁻⁶ is a guess with no source. The low radio end
            is a transmitter as strong as our Deep Space Network; Earth&rsquo;s everyday leakage
            would reach no other star (Sheikh 2025). Past non-detections aren&rsquo;t used to cut{' '}
            <em>N</em>. Margot 2026 finds fewer than 6.3×10⁻⁵ of stars within 20,000 light years
            host an <em>always-on</em> transmitter above 5×10¹⁶ W; by our own rough count of the
            stars in that volume, that still allows over a million such beacons.
          </>
        ),
      },
      {
        text: (
          <>
            The in-reach sensitivities <em>s_m</em> are still <strong>placeholders</strong>{' '}
            (log-uniform 0.1&ndash;100 per target per $1B-decade for radio, optical and RETINA;
            0.001&ndash;1 for biosignatures). They stand for whether a civilisation in view is
            transmitting, aimed our way and in-band when we look, which nobody can measure. Spec
            §10 #7 flags them as &ldquo;the most uncertain numbers in the model.&rdquo;
          </>
        ),
      },
      {
        text: (
          <>
            <strong>Biosignature searches count life, not civilisations.</strong> Their targets
            are life-bearing planets: <em>R* × fₚ × nₑ × fₗ × 3×10⁹ years × f_d</em>, where 3
            billion years is roughly how long Earth has had life. Every other method counts
            detectable civilisations.
          </>
        ),
      },
      {
        text: (
          <>
            Each method has a unique detection-type tag. Multiple methods can detect the same
            civ; expected value is computed by{' '}
            <strong>subset enumeration over the 2ⁿ−1 non-empty enabled-method subsets</strong>{' '}
            rather than the biased <em>P_m / Σ P_m</em> weighting the spec originally suggested.
          </>
        ),
      },
    ],
  },
  {
    title: 'Value channels',
    blurb: 'How we translate "detection" into DALY-equivalent outcomes.',
    items: [
      {
        text: (
          <>
            Channel A (Filter information,{' '}
            <CitationLink cite="hansonFilter" text="Hanson 1998" />): per-type Δ values combine
            as a <strong>probabilistic union</strong> when multiple types fire — i.e.{' '}
            <em>1 − Π(1 − Δᵢ)</em>. This bounds the total credence shift in [0, 1].
          </>
        ),
      },
      {
        text: (
          <>
            Channel A is always <strong>bad news</strong>: detection moves a fraction Δ of your
            credence that the filter is behind us (ϕ, set in Ch.4 and Ch.3) to &ldquo;filter
            ahead&rdquo;, so its value is −Δ × ϕ × V_xrisk_info. It models the news itself, not
            the decision value of learning it (Hanson calls it &ldquo;bad (though
            valuable)&rdquo;); that second part isn&rsquo;t modelled.
          </>
        ),
      },
      {
        text: (
          <>
            Channel B (<CitationLink cite="bostromAstroWaste" text="Bostrom 2003" />) fires{' '}
            <strong>exactly once</strong> if any technosignature-type detection happens (radio,
            optical/infrared, passive radar, probe) — the cosmic-endowment update doesn&rsquo;t
            double-count across methods. A biosignature alone doesn&rsquo;t fire it: microbes
            say nothing about whether interstellar technology works or the cosmos is claimed.
          </>
        ),
      },
      {
        text: (
          <>
            <strong>Value uncertainty</strong> (Ch.3). Each sample scales each channel&rsquo;s
            magnitude by an independent log-uniform factor (default ±1 order of magnitude,
            normalised to mean 1), and draws Channel B&rsquo;s two shifts uniformly within ±0.1
            of their settings by default. Both are mean-preserving, so expected value is
            unchanged; what changes is that samples can now differ in sign, which is what
            makes <em>P(EV &lt; 0)</em> a real probability. The ±0.1 shift spread is a
            judgement call, not a published figure, and it matters: at the defaults every
            &ldquo;better than GiveWell&rdquo; world comes from it. With no spread, channel
            B&rsquo;s expected upside exactly cancels channel D&rsquo;s endowment loss, and the
            split is 0 better / 76 about the same / 24 serious harm.
          </>
        ),
      },
      {
        text: (
          <>
            Channel C fires <em>iff</em> the type set ∩ &#123;radio, technosig, passive_radar&#125;{' '}
            ≠ ∅. Biosig and probe detections do <em>not</em> trigger contact value.
          </>
        ),
      },
      {
        text: (
          <>
            Channel D fires <em>iff</em> the type set ∩ &#123;radio, technosig, probe&#125; ≠ ∅.
            Biosig and passive_radar detections do <em>not</em> draw hostile attention. When it
            fires it costs two things: harm to people alive now (P(hostile) × V_hostile_disvalue)
            and, since hostile contact could end us, the cosmic endowment we would lose
            (P(hostile) × V_cosmic_endowment). That second part is the mirror image of channel B
            and is valued with exactly the same worldview transform.
          </>
        ),
      },
      {
        text: (
          <>
            <strong>V_xrisk_info = 10¹⁰ DALYs</strong> (Channel A). A placeholder with no
            published anchor; loosely inspired by longtermist x-risk valuations (cf.{' '}
            <CitationLink cite="ordPrecipice" text="Ord 2020" />), but far below total-view
            figures, which start around 10¹⁶ lives (
            <CitationLink cite="bostrom2013" text="Bostrom 2013" />). It is six orders of
            magnitude below V_cosmic_endowment. Tornado bounds: 10⁶ to 10¹⁴.
          </>
        ),
      },
      {
        text: (
          <>
            <strong>V_cosmic_endowment = 10¹⁶ DALYs</strong> (Channel B). The number matches{' '}
            <CitationLink cite="bostrom2013" text="Bostrom 2013" />&rsquo;s conservative
            Earth-only estimate of 10¹⁶ future lives (lives of normal duration, not DALYs; using
            it as 10¹⁶ DALYs understates it ~50&ndash;80×, since a life spans many years). It is
            far below <CitationLink cite="bostromAstroWaste" text="Bostrom 2003" />&rsquo;s
            astronomical-waste figures: ~10³⁸ potential lives lost per century of delay (an
            estimate for computer-simulated minds that Bostrom calls conservative) or over 10¹³
            lives per second of delay (biological humans). The endowment appears on both sides:
            channel B&rsquo;s upside and channel D&rsquo;s loss if hostile contact ends us. A
            bigger endowment therefore magnifies the stakes in both directions rather than
            favouring the search. Under longtermism these two terms dominate everything else.
            Tornado bounds: 10¹² to 10²⁰.
          </>
        ),
      },
      {
        text: (
          <>
            <strong>V_contact_friendly = 10⁸ DALYs</strong> (Channel C). No clean published
            anchor — order-of-magnitude equivalent to one global-health-grade technological
            transfer. Multiplied by <em>alienMoralWeight</em> at the worldview stage.
            Not currently probed by the tornado.
          </>
        ),
      },
      {
        text: (
          <>
            <strong>V_hostile_disvalue = −10¹² DALYs</strong> (Channel D). A back-of-envelope
            placeholder: about three times the
            remaining life-years of everyone alive today (~8×10⁹ people × ~40 years ≈ 3×10¹¹) —
            a placeholder for the harm hostile contact does to the current generation. This part
            is not discounted or scaled by longtermism. The loss of the future is counted
            separately, through V_cosmic_endowment (see channel D above). Tornado bounds: −10⁸ to
            −10¹⁶.
          </>
        ),
      },
      {
        text: (
          <>
            <strong>Inputs with no published source</strong> — judgement calls, labelled as
            guesses where they appear: every method&rsquo;s cost range except Breakthrough
            Listen&rsquo;s $100M over 10 years; the in-reach sensitivities; RETINA&rsquo;s reach;
            Channel A&rsquo;s credence shifts Δ (radio and passive radar 0.4, technosignature
            and probe 0.3, biosignature 0.1); Channel B&rsquo;s shifts (+0.15 tech viability,
            −0.10 lightcone claim), whose net sign decides which way that channel points;
            P(friendly) = 0.5 and P(hostile) = 0.05; V_xrisk_info, V_contact_friendly and
            V_hostile_disvalue; the value-uncertainty spreads; the discount horizons; and the
            default worldview dials.
          </>
        ),
      },
      {
        text: (
          <>
            Empirical note: <strong>Channel A does not change the split under any
            preset</strong>. V_xrisk_info is six orders of magnitude below V_cosmic_endowment,
            so even after channel B&rsquo;s small net shift and the hingeyness discount, A is
            tens of thousands of times smaller than B or D: ϕ = 0 and ϕ = 1 give the same split,
            which is why there is no &ldquo;Filter pessimist&rdquo; preset. A starts to
            matter only near the top of its Ch.6 range (V_xrisk_info ≈ 10¹⁴). The four-channel
            framing is kept so the Filter argument is visible and adjustable, but the
            verdict under longtermism is driven by the cosmic endowment, which enters through
            channel B (upside) and channel D (loss). At the defaults channel B&rsquo;s expected
            net shift (+0.05) equals P(hostile) (0.05), so the two cancel on average: the
            average outcome is too close to zero for the simulation to tell its sign. Where the
            serious-harm worlds come from, at the defaults: switching channel D off cuts them
            from 18 to 10, and the 10 left are worlds where B&rsquo;s shift draw comes out negative
            (the cosmos looks claimed); switching channel B off raises them to 36.
          </>
        ),
      },
    ],
  },
  {
    title: 'Worldview transforms',
    blurb: 'How philosophical commitments warp the value channels.',
    items: [
      {
        text: (
          <>
            Longtermism strength (α_L ∈ [0, 1]) multiplies <em>only</em> the time-distant terms:
            channel A, channel B, and channel D&rsquo;s endowment loss. Channel C (direct
            contact) and channel D&rsquo;s harm to people alive now are near-term and are not
            multiplied by α_L.
          </>
        ),
      },
      {
        text: (
          <>
            Pure time discount applies <em>only</em> to channel A, channel B and channel D&rsquo;s
            endowment loss, with hardcoded horizons <em> T_A = 100 years</em> and{' '}
            <em>T_B = 1000 years</em> (the endowment loss uses T_B). These horizons are picked to
            illustrate the discount mechanism, not derived from a particular x-risk model.
          </>
        ),
      },
      {
        text: (
          <>
            Person-affecting view (off by default) <strong>zeros channel B and channel D&rsquo;s
            endowment loss</strong> when on, since both are about people who don&rsquo;t exist
            yet. Channels A, C and D&rsquo;s near-term harm are unaffected. The view is
            discussed in <CitationLink cite="parfit1984" text="Parfit 1984" />, who set out its
            problems and did not endorse it.
          </>
        ),
      },
      {
        text: (
          <>
            Hingeyness multiplies channel B and channel D&rsquo;s endowment loss (under the
            assumption that "we are at a critical period" matters most for steering the cosmic
            endowment). Both get it so that upside and loss stay on the same scale.
          </>
        ),
      },
      {
        text: (
          <>
            Alien moral weight multiplies <em>only</em> channel C (direct-contact value). Other
            channels are framed as effects on humans/x-risk and don't depend on alien interests.
          </>
        ),
      },
      {
        text: (
          <>
            Risk aversion picks the <strong>GiveWell number</strong> shown under the 100-world
            split in Ch.5 — not the maths. Average → mean (long shots count fully);
            Typical world → median; Cautious → 25th percentile. The split itself, and the MC
            distribution, are the same whichever you pick.
          </>
        ),
      },
    ],
  },
  {
    title: 'Cost-effectiveness translation',
    blurb: 'How EV becomes "× GiveWell."',
    items: [
      {
        text: (
          <>
            The &ldquo;GiveWell bar&rdquo; is fixed at <strong>1 DALY per $100</strong>. This is
            our approximation: <CitationLink cite="giveWell" text="GiveWell" /> doesn&rsquo;t
            measure in DALYs (it uses its own units of value, with a{' '}
            <CitationLink cite="giveWellBar2026" text="funding bar of 6× its cash benchmark" /> as
            of May 2026), and its top charities save a life for{' '}
            <CitationLink cite="giveWellCostPerLife2024" text="roughly $3,000–5,500" />.
            Multiplier = (EV in DALYs / total cost in $) ÷ (1 / 100). All comparator bars in the verdict are
            in × GiveWell-bar units. Rethink Priorities&rsquo; CCM puts the GiveWell bar higher,
            at 21 DALYs per $1,000 (
            <CitationLink cite="ccmOutputs2024" text="as reported, Jan 2024" />
            ), so against that bar every multiplier here would be about 2× smaller.
          </>
        ),
      },
      {
        text: (
          <>
            <strong>Comparator bars are published figures</strong>, each labelled with its
            source, not posteriors of any one model. Cage-free campaigns:{' '}
            <CitationLink cite="titotal2024" text="titotal 2024" />
            &rsquo;s replication of Rethink Priorities&rsquo; model, where moral weights move the
            answer from 1.7× to 200×. Biosecurity:{' '}
            <CitationLink cite="millettSnyderBeattie2017" text="Millett & Snyder-Beattie 2017" />
            , counting future generations without discounting (with a 1% discount rate, it
            falls to 0.13× or less). There is no AI-safety bar: the only published figures are CCM defaults that
            Rethink Priorities&rsquo; own staff say not to trust, and an invented range would be
            worse than none.
          </>
        ),
      },
      {
        text: (
          <>
            Total cost = sum of <em>enabled</em> methods' decadal costs. Disabling a method removes
            its cost contribution as well as its detection probability.
          </>
        ),
      },
      {
        text: (
          <>
            The verdict leads with a split of 100 worlds — more good than GiveWell (multiplier
            &gt; 1), less difference either way (−1 to 1), serious harm (&lt; −1) — rather than
            one number,
            because the median and mean differ by many orders of magnitude on default
            settings: most worlds have almost no chance of a detection, while a few have a
            large one. Each &ldquo;world&rdquo; is one MC sample of every uncertain input.
          </>
        ),
      },
    ],
  },
  {
    title: 'Computational',
    blurb: 'Implementation choices that affect the numbers but not the philosophy.',
    items: [
      {
        text: <>n = 100,000 Monte Carlo samples per re-run, debounced 150ms after the last input change.</>,
      },
      {
        text: (
          <>
            Default seed mode is <strong>deterministic</strong> — seed derived from a hash of the
            current state, so identical configs produce bit-identical results. Toggle to "rotating"
            in the masthead to see MC variance.
          </>
        ),
      },
      {
        text: (
          <>
            RNG is xmur3 + sfc32 (passes BigCrush). Detection-probability accumulator uses{' '}
            <em>Math.log1p(−p_m)</em> for precision when p_m is small. Drake product is computed
            in log space.
          </>
        ),
      },
      {
        text: (
          <>
            The tornado plot compares the <strong>mean multiplier</strong> (signed), not the
            median, which collapses to ≈ 0 because most worlds find nothing. Each row reruns the
            model with the same random draws at each end of the input&rsquo;s range, so only the
            input&rsquo;s effect differs. Answers below a millionth of GiveWell count as ≈ 0.
          </>
        ),
      },
      {
        text: (
          <>
            The histogram&rsquo;s x-axis runs from the smallest positive multiplier to the
            largest, but never below 10⁻¹² × GiveWell; smaller positive values are counted in
            the left-edge marker. The GiveWell bar is always visible. Negative worlds are
            reported in a note under the chart, and in the comparator chart&rsquo;s &ldquo;below
            0&rdquo; zone.
          </>
        ),
      },
    ],
  },
];

export function AssumptionsModal({ open, onClose }: AssumptionsModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Native <dialog> dispatches a 'close' event when Esc is pressed or close()
  // is called. Listen for it so external state stays in sync.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handler = (): void => {
      onClose();
    };
    dialog.addEventListener('close', handler);
    return () => {
      dialog.removeEventListener('close', handler);
    };
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className="bg-paper text-ink p-0 max-w-[920px] w-[90vw] max-h-[88vh] border border-ink shadow-xl backdrop:bg-ink/40"
      onClick={(e) => {
        // Click on the backdrop (i.e. on the dialog element itself, not its children) closes.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="px-10 py-9 overflow-y-auto max-h-[88vh]">
        <div className="flex justify-between items-baseline mb-4">
          <div>
            <div className="font-mono text-[11px] tracking-eyebrow text-muted uppercase">
              Honesty contract · appendix
            </div>
            <h2
              className="font-display text-[36px] leading-[1.05] mt-2"
              style={{ fontWeight: 600, letterSpacing: '-0.01em' }}
            >
              Every assumption baked into the analysis.
            </h2>
            <p className="font-serif text-[14.5px] leading-[1.55] text-muted mt-3 max-w-[760px]">
              The tool computes an answer; these are the things we assumed to get there. If any
              of them feel wrong, that&rsquo;s a finger to put on the scale &mdash; either set the
              relevant dial differently, or note in your write-up that this tool isn&rsquo;t the
              right one for the question.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-[11px] tracking-chip uppercase px-3.5 py-2 border border-ink text-ink hover:bg-ink hover:text-paper transition-colors cursor-pointer flex-shrink-0"
            aria-label="Close assumptions"
          >
            Close · Esc
          </button>
        </div>

        <div className="space-y-7 mt-7">
          {CATEGORIES.map((cat) => (
            <div key={cat.title}>
              <div className="flex items-baseline gap-3 border-b border-ink pb-2 mb-3.5">
                <h3
                  className="font-subhead text-[20px] text-ink"
                  style={{ fontWeight: 600, letterSpacing: '-0.01em' }}
                >
                  {cat.title}
                </h3>
                <span className="font-serif italic text-[13px] text-muted">{cat.blurb}</span>
              </div>
              <ol className="font-serif text-[14px] leading-[1.6] text-ink space-y-2.5 pl-6 list-decimal marker:text-accent marker:font-mono marker:text-[12px]">
                {cat.items.map((item, i) => (
                  <li key={i}>{item.text}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-5 border-t border-edge font-mono text-[11px] tracking-chip uppercase text-muted text-center">
          The full model specification and tests are in the project&rsquo;s source code
        </div>
      </div>
    </dialog>
  );
}
