import { ChapterShell } from '../ChapterShell';
import { ChannelCard } from '../ChannelCard';
import { RangeSlider } from '../controls/RangeSlider';
import { useStore } from '../../store';

export function Ch03Value() {
  const channels = useStore((s) => s.channels);
  const setChannelOn = useStore((s) => s.setChannelOn);
  const patchA = useStore((s) => s.patchChannelA);
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
      <div className="grid grid-cols-2 gap-5">
        <ChannelCard
          id="A"
          title="Great Filter information"
          tag="Hanson 2008"
          sign="-"
          description="Detection updates our credence about whether the Great Filter is behind or ahead of us. Generically: finding life is bad news."
          defaultV="1×10¹⁰ DALY"
          on={channels.A.on}
          onToggle={(v) => {
            setChannelOn('A', v);
          }}
        >
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-3">
            <RangeSlider
              sym="ϕ"
              label="Filter prior P( behind us )"
              value={channels.A.filterPriorBehind}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => {
                patchA({ filterPriorBehind: v });
              }}
              hint="< 0.5 flips channel A positive"
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
        >
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-3">
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
