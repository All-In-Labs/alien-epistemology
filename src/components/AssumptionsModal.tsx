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
            <em>fₗ</em> can be sampled two ways (Ch.1). <strong>Log-uniform</strong> between your
            bounds is the default. <strong>SDO 2018</strong> uses their own model: fₗ = 1 −
            e<sup>−λVt</sup> with log₁₀(λVt) ~ Normal(0, 50), i.e. a median of one abiogenesis
            event per planet and ~50 orders of magnitude of spread (
            <CitationLink cite="sdo2018" text="SDO 2018 §3.1" />). Fed SDO&rsquo;s Table 1
            ranges, it reproduces their 52% probability of no other civilisation.
          </>
        ),
      },
      {
        text: (
          <>
            The seven Drake factors{' '}
            <em>R★, fₚ, nₑ, fₗ, fᵢ, f_c, L</em> are <strong>independently distributed</strong>.
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
            data clusters at the upper end, so log-uniform would over-weight low values). Per{' '}
            <CitationLink cite="sdo2018" text="SDO 2018 §3" />.
          </>
        ),
      },
      {
        text: (
          <>
            <em>fₗ</em>'s default lower bound is <strong>10⁻³⁰</strong> — extremely permissive.
            This dominates the wide-tail behaviour of <em>P(N=0)</em>; SDO chose it to reflect
            genuine wide uncertainty in abiogenesis. If you tighten this bound, the headline
            "P(no civ)" stat can shift substantially.
          </>
        ),
      },
      {
        text: (
          <>
            <em>N</em> from the Drake equation is the <strong>expected count</strong>, not the
            actual count. We treat the actual count as Poisson(<em>N</em>): so{' '}
            <em>P(no civ) = E[exp(−N)]</em>, <em>P(=1) = E[N · exp(−N)]</em>, etc. SDO 2018
            uses the same continuous-rate framing.
          </>
        ),
      },
      {
        text: (
          <>
            <em>f_d</em> (detection-readiness multiplier) is a tool-specific addition not in
            SDO 2018. It multiplies <em>N</em> by a sample from [user min, user max] log-uniform
            to get <em>N_detectable</em>. Default range [10⁻³, 1.0].
          </>
        ),
      },
      {
        text: (
          <>
            Grabby Aliens cosmology (<CitationLink cite="hansonGrabby" text="Hanson 2021" />) is
            simplified per spec §11.6: a single <em>P(we are inside a grabby zone)</em> sampled
            log-uniformly between user bounds, rather than Hanson's full expansion-rate dynamics.
            When inside a grabby zone, <em>N_detectable</em> is treated as saturated (1×10⁶).
          </>
        ),
      },
      {
        text: (
          <>
            Hybrid cosmology mixes SDO and Grabby branches per-sample by{' '}
            <em>worldview.grabbyCredence</em>; not a posterior weighted average.
          </>
        ),
      },
      {
        text: (
          <>
            <strong>Grabby is not externally calibrated.</strong> The SDO branch reproduces{' '}
            <CitationLink cite="sdo2018" text="SDO 2018" />'s pre-Fermi pNZero within ~10pp
            when fed SDO's parameter ranges (see <em>literature-anchors.test.ts</em>). The
            Grabby branch has no equivalent anchor against{' '}
            <CitationLink cite="hansonGrabby" text="Hanson 2021" />'s published density /
            expansion-rate numbers — our "P(inside zone)" framing doesn't cleanly map to
            them. Treat Grabby-mode output with higher uncertainty than SDO-mode output.
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
            Per-civ-per-decade detection probability is{' '}
            <em>p_m = 1 − exp(−s_m × c_m_$B)</em>, i.e. <strong>Poisson-arrival</strong> in detection
            opportunities. Treats one method-decade-civ as a single Bernoulli trial. Realistic for
            transit/spectroscopy methods; less so for serendipitous discoveries.
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
            Sensitivities <em>s_m</em> are sampled log-uniform from user bounds. Costs <em>c_m</em>{' '}
            are point estimates with no uncertainty.
          </>
        ),
      },
      {
        text: (
          <>
            The default sensitivity coefficients are <strong>placeholders</strong> awaiting
            domain-expert refinement. Spec §10 #7 explicitly flags these as "the most uncertain
            numbers in the model."
          </>
        ),
      },
      {
        text: (
          <>
            Under Grabby Aliens, probe + passive_radar sensitivities are boosted by{' '}
            <strong>50×</strong> (midpoint of spec's 10–100× range). Other methods unchanged.
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
            valuable)&rdquo;); that second part isn&rsquo;t modelled.{' '}
            <em>ChannelAState.filterPriorBehind</em> is a vestigial field retained for
            permalink back-compat — it is not read by the model.
          </>
        ),
      },
      {
        text: (
          <>
            Channel B (<CitationLink cite="bostromAstroWaste" text="Bostrom 2003" />) fires{' '}
            <strong>exactly once</strong> if any detection happens — the cosmic-endowment update
            doesn't double-count across multiple-method detections.
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
            judgement call, not a published figure.
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
            Biosig and passive_radar detections do <em>not</em> draw hostile attention.
          </>
        ),
      },
      {
        text: (
          <>
            <strong>V_xrisk_info = 10¹⁰ DALYs</strong> (Channel A). Loosely inspired by
            longtermist x-risk valuations (cf. <CitationLink cite="ordPrecipice" text="Ord 2020" />);
            roughly one order of magnitude below the standard total-view figure (~10¹¹ DALYs per
            unit of probability shift). Tornado bounds: 10⁶ to 10¹⁴.
          </>
        ),
      },
      {
        text: (
          <>
            <strong>V_cosmic_endowment = 10¹⁶ DALYs</strong> (Channel B). Inspired by{' '}
            <CitationLink cite="bostromAstroWaste" text="Bostrom 2003" />, but{' '}
            <strong>~22 OOM below</strong> his published conservative biological estimate
            (~10³⁸ lives over the cosmic endowment, or ~10¹³ lives per second of delay).
            The compression is deliberate: feeding Bostrom's literal number makes alien-finding
            ≈ 10²⁹ × GiveWell under almost any preset, violating the spec's epistemic-neutrality
            requirement. 10¹⁶ keeps Channel B as the dominant contributor under longtermism
            (~99% of EV mass) while leaving room for other channels to matter at the margin.
            Tornado bounds: 10¹² to 10²⁰ — the upper end is still 18 OOM below Bostrom.
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
            <strong>V_hostile_disvalue = −10¹² DALYs</strong> (Channel D). Roughly two orders
            of magnitude above current-population × per-life-disvalue (~10¹⁰) — reflects
            multi-generation harm if hostile contact ≈ extinction. Tornado bounds: −10⁸ to −10¹⁶.
          </>
        ),
      },
      {
        text: (
          <>
            Empirical note: under any longtermist preset, <strong>Channel A is a rounding
            error compared to Channel B</strong> (V_xrisk ≪ V_endowment by 6 OOM). The
            "four channels" framing is structurally important for honest neutrality, but the
            verdict under longtermism is overwhelmingly Channel-B-driven. See the Ch.6 tornado
            for confirmation.
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
            Longtermism strength (α_L ∈ [0, 1]) multiplies <em>only</em> channels A and B (the
            time-distant ones). Channels C (direct contact) and D (Dark Forest) are treated as
            near-term consequences and are not multiplied by α_L.
          </>
        ),
      },
      {
        text: (
          <>
            Pure time discount applies <em>only</em> to channels A and B, with hardcoded horizons
            <em> T_A = 100 years</em> and <em>T_B = 1000 years</em>. These horizons are picked to
            illustrate the discount mechanism, not derived from a particular x-risk model.
          </>
        ),
      },
      {
        text: (
          <>
            Person-affecting view (off by default) <strong>zeros channel B entirely</strong> when
            on. Channels A, C, D unaffected. <CitationLink cite="parfit1984" text="Parfit 1984" />.
          </>
        ),
      },
      {
        text: (
          <>
            Hingeyness multiplies channel B only (under the assumption that "we are at a critical
            period" matters most for steering the cosmic endowment).
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
            Risk aversion picks the <strong>headline statistic</strong> in Ch.5 — not the
            maths. EV-max → mean; log-utility → geometric mean over all samples (undefined if
            any sample is a loss, since log utility can&rsquo;t take one; 0 if any sample is
            0); difference-making → 25th percentile. The MC distribution itself is
            risk-neutral.
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
            <CitationLink cite="giveWell" text="GiveWell" /> bar fixed at 1 DALY per $100. Multiplier
            = (EV in DALYs / total cost in $) ÷ (1 / 100). All comparator bars in the verdict are
            in × GiveWell-bar units. Comparator ranges are{' '}
            <strong>community estimates</strong>, not posteriors of any particular model.
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
            The median and mean are always shown under the headline. On default settings they
            differ by many orders of magnitude: most samples have almost no chance of a
            detection, while a few have a large one, so the mean is driven by the tail.
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
            The tornado plot's aggregate is <strong>geometric mean of positive multipliers</strong>,
            not the unconditional median (which collapses to 0 whenever P(N=0) &gt; 0.5).
          </>
        ),
      },
      {
        text: (
          <>
            Histogram x-axis range is computed dynamically from the 2nd/98th percentiles of the
            sample, clamped to [10⁻¹², 10¹²], with the GiveWell bar always visible.
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
          See drake-tool-spec.md §5 for the model definition · §10 for acceptance criteria
        </div>
      </div>
    </dialog>
  );
}
