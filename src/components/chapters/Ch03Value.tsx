import { ChapterShell } from '../ChapterShell';
import { ChannelCard } from '../ChannelCard';
import { RangeSlider } from '../controls/RangeSlider';
import { CitationLink } from '../CitationLink';
import { useStore } from '../../store';

const CHANNEL_A_TOOLTIP = (
  <p>
    The Great Filter (<CitationLink cite="hansonFilter" text="Hanson 1998" />). Finding life
    elsewhere suggests the early steps were easy, so the filter is more likely ahead of us:
    detection moves a fraction Δ of your credence that the filter is behind us (ϕ) to
    &ldquo;ahead&rdquo;. That is bad news whatever ϕ is, and it shrinks to zero only at ϕ = 0.
  </p>
);
const CHANNEL_B_TOOLTIP = (
  <p>
    Astronomical Waste (<CitationLink cite="bostromAstroWaste" text="Bostrom 2003" />). Two-sided:
    detection raises P(tech-viability) but lowers P(unclaimed lightcone). The two shifts
    (+0.15 and −0.10) have no published source, and their net sign decides which way this
    channel points. The default cosmic endowment, 10¹⁶, is Bostrom 2013&rsquo;s count of
    lives used as DALYs: far below Bostrom 2003&rsquo;s figures (see View assumptions). Fires
    only for technosignature-type detections; microbes say nothing about interstellar tech.
  </p>
);
const CHANNEL_C_TOOLTIP = (
  <p>
    Direct knowledge transfer (Drake/Sagan tradition). Only fires for detection types that
    receive information — radio, technosignature, passive radar. Biosignature and probe
    detections do not trigger contact value.
  </p>
);
const CHANNEL_D_TOOLTIP = (
  <p>
    Dark Forest disvalue (Liu 2008; METI debate). Detection alerts hostile attention or commits
    us to METI. Fires for radio, technosignature, and probe — biosig and passive radar do not
    draw fire. It costs the harm to people alive now and, if hostile contact ends us, the
    cosmic endowment: the same endowment channel B counts as upside, valued the same way.
  </p>
);

export function Ch03Value() {
  const channels = useStore((s) => s.channels);
  const worldview = useStore((s) => s.worldview);
  const patchWorldview = useStore((s) => s.patchWorldview);
  const setChannelOn = useStore((s) => s.setChannelOn);
  const patchB = useStore((s) => s.patchChannelB);
  const patchC = useStore((s) => s.patchChannelC);
  const patchD = useStore((s) => s.patchChannelD);
  const valueUncertainty = useStore((s) => s.valueUncertainty);
  const patchValueUncertainty = useStore((s) => s.patchValueUncertainty);

  return (
    <ChapterShell
      num="03"
      eyebrow="What detection is worth"
      title="Four channels: one good, two bad, one either way."
      kicker="Detection is not unambiguously good. Channel A (Hanson's Filter), Channel D (Dark Forest) and the lightcone-claim side of Channel B can all drive expected value negative. The tool refuses to hide that."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChannelCard
          id="A"
          title="Great Filter information"
          tag="Hanson 1998"
          sign="-"
          description="Detection updates our credence about whether the Great Filter is behind or ahead of us. Generically: finding life is bad news."
          defaultV="1×10¹⁰ DALY"
          on={channels.A.on}
          onToggle={(v) => {
            setChannelOn('A', v);
          }}
          tooltip={CHANNEL_A_TOOLTIP}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-3">
            <RangeSlider
              sym="ϕ"
              label="Filter prior P( behind us )"
              value={worldview.filterPriorBehind}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => {
                patchWorldview({ filterPriorBehind: v });
              }}
              hint="0 = nothing to lose · also editable in Ch.4"
            />
          </div>
          <div className="font-mono text-[10.5px] text-muted mt-2">
            Credence moved by a detection, Δ (guesses, no published source): radio{' '}
            {channels.A.delta.radio} · passive radar {channels.A.delta.passive_radar} ·
            technosignature {channels.A.delta.technosig} · probe {channels.A.delta.probe} ·
            biosignature {channels.A.delta.biosig}
          </div>
        </ChannelCard>

        <ChannelCard
          id="B"
          title="Astronomical-waste update"
          tag="Bostrom 2003"
          sign="±"
          description="Two-sided. Tech-viability evidence (good for &ldquo;we could too&rdquo;) vs lightcone-claim evidence (bad for our cosmic endowment)."
          defaultV="1×10¹⁶ DALY"
          on={channels.B.on}
          onToggle={(v) => {
            setChannelOn('B', v);
          }}
          tooltip={CHANNEL_B_TOOLTIP}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-3">
            <RangeSlider
              label="Tech-viability shift"
              value={channels.B.techViabilityShift}
              min={-0.3}
              max={0.3}
              step={0.01}
              onChange={(v) => {
                patchB({ techViabilityShift: v });
              }}
              hint="positive = good · a guess, no published source"
            />
            <RangeSlider
              label="Lightcone-claim shift"
              value={channels.B.lightconeClaimShift}
              min={-0.3}
              max={0.3}
              step={0.01}
              onChange={(v) => {
                patchB({ lightconeClaimShift: v });
              }}
              hint="negative = bad · a guess, no published source"
            />
          </div>
        </ChannelCard>

        <ChannelCard
          id="C"
          title="Direct-contact value"
          tag="Drake/Sagan"
          sign="+"
          description="Knowledge transfer; only fires for detection types that involve receiving information (radio, technosig, passive radar)."
          defaultV="1×10⁸ DALY"
          on={channels.C.on}
          onToggle={(v) => {
            setChannelOn('C', v);
          }}
          tooltip={CHANNEL_C_TOOLTIP}
        >
          <div className="grid grid-cols-1 mt-3">
            <RangeSlider
              label="P( friendly | detection )"
              value={channels.C.pFriendly}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => {
                patchC({ pFriendly: v });
              }}
              hint="a guess, no published source"
            />
          </div>
        </ChannelCard>

        <ChannelCard
          id="D"
          title="Contact disvalue (Dark Forest)"
          tag="Liu / METI debate"
          sign="-"
          description="Detection alerts hostile aliens, or commits us to METI. Costs lives now and, if it ends us, the cosmic future channel B counts as upside. Active for radio / technosig / probe."
          defaultV="−1×10¹² DALY now, plus the endowment"
          on={channels.D.on}
          onToggle={(v) => {
            setChannelOn('D', v);
          }}
          tooltip={CHANNEL_D_TOOLTIP}
        >
          <div className="grid grid-cols-1 mt-3">
            <RangeSlider
              label="P( hostile attention | detection )"
              value={channels.D.pHostile}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => {
                patchD({ pHostile: v });
              }}
              hint="a guess, no published source"
            />
          </div>
        </ChannelCard>
      </div>

      <div className="mt-5 bg-paper border border-ink px-7 py-5">
        <div className="font-mono text-[11px] text-muted tracking-chip uppercase mb-1">
          Value uncertainty
        </div>
        <p className="font-serif italic text-[13.5px] text-muted max-w-[780px] mb-3">
          Each world in the verdict draws its own channel values around the settings above, so
          some worlds can come out good and others bad. Without this, every world has the same
          sign. Both spreads keep the settings above as the expected values.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          <RangeSlider
            label="Magnitude spread (± orders of magnitude)"
            value={valueUncertainty.magnitudeOOM}
            min={0}
            max={3}
            step={0.1}
            onChange={(v) => {
              patchValueUncertainty({ magnitudeOOM: v });
            }}
            hint="scales each channel's value per sample · 0 = fixed"
          />
          <RangeSlider
            label="Channel B shift uncertainty (±)"
            value={valueUncertainty.shiftPM}
            min={0}
            max={0.3}
            step={0.01}
            onChange={(v) => {
              patchValueUncertainty({ shiftPM: v });
            }}
            hint="each B shift drawn within ± this · drives how many worlds do harm"
          />
        </div>
      </div>
    </ChapterShell>
  );
}
