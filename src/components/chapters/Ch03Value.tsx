import { ChapterShell } from '../ChapterShell';
import { ChannelCard } from '../ChannelCard';
import { RangeSlider } from '../controls/RangeSlider';
import { CitationLink } from '../CitationLink';
import { useStore } from '../../store';

const CHANNEL_A_TOOLTIP = (
  <p>
    The Great Filter (<CitationLink cite="hansonFilter" text="Hanson 1998" />). Detection updates
    whether the filter sits behind us (life is hard, we passed the gauntlet) or ahead (life is
    easy, civilisations rarely survive). By default finding life is bad news. Sign flips when
    you set ϕ &lt; 0.5.
  </p>
);
const CHANNEL_B_TOOLTIP = (
  <p>
    Astronomical Waste (<CitationLink cite="bostromAstroWaste" text="Bostrom 2003" />). Two-sided:
    detection raises P(tech-viability) but lowers P(unclaimed lightcone). The default cosmic
    endowment of 10¹⁶ DALYs is far below Bostrom&rsquo;s own figures (see View assumptions);
    move the two shifts independently.
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
    draw fire.
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

  return (
    <ChapterShell
      num="03"
      eyebrow="What detection is worth"
      title="Four channels — two positive, two negative, all defensible."
      kicker="Detection is not unambiguously good. Channel A (Hanson's Filter) and Channel D (Dark Forest) can drive expected value negative. The tool refuses to hide that."
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
              hint="< 0.5 flips channel A positive · also editable in Ch.4"
            />
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
              hint="positive = good"
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
              hint="negative = bad"
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
            />
          </div>
        </ChannelCard>

        <ChannelCard
          id="D"
          title="Contact disvalue (Dark Forest)"
          tag="Liu / METI debate"
          sign="-"
          description="Detection alerts hostile aliens, or commits us to METI. Active for radio / technosig / probe."
          defaultV="−1×10¹² DALY"
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
            />
          </div>
        </ChannelCard>
      </div>
    </ChapterShell>
  );
}
