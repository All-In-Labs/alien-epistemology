import { ChapterShell } from '../ChapterShell';
import { PresetTile } from '../PresetTile';
import { RangeSlider } from '../controls/RangeSlider';
import { Segmented } from '../controls/Segmented';
import { Toggle } from '../controls/Toggle';
import { Tooltip } from '../Tooltip';
import { CitationLink } from '../CitationLink';
import { useStore } from '../../store';
import { PRESETS } from '../../presets/worldviews';
import type { RiskAversion } from '../../model/worldview';

const TT_LONGTERMISM = (
  <p>
    Multiplier on channels A and B. 0 = pure neartermist (only persons-now matter); 1 = total-view
    longtermism (all future persons matter equally).{' '}
    <CitationLink cite="ordPrecipice" text="Ord 2020 §10" />;{' '}
    <CitationLink cite="macAskill2022" text="MacAskill 2022" />.
  </p>
);
const TT_DISCOUNT = (
  <p>
    Pure time-preference rate (Ramsey 1928). Discounts channels A and B by (1+r)^-T over their
    horizon. 0% = no time preference; 3%/yr ≈ Stern Review; 10% = aggressive markets-style.
  </p>
);
const TT_ALIEN_WEIGHT = (
  <p>
    Multiplier on channel C (direct-contact value). 0 = alien welfare doesn&rsquo;t count; 1 =
    counts equally to humans.{' '}
    <CitationLink cite="schwitzgebelGarza" text="Schwitzgebel & Garza 2015" />.
  </p>
);
const TT_HINGEYNESS = (
  <p>
    Probability our actions today materially shift the cosmic endowment trajectory.{' '}
    <CitationLink cite="macAskill2020" text="MacAskill 2020" /> on the &ldquo;hinge of
    history&rdquo; hypothesis. High hingeyness amplifies channel B.
  </p>
);
const TT_FILTER_PRIOR = (
  <p>
    P(the Great Filter is behind us). Sets the sign of channel A: when prior &gt; 0.5, finding
    life is bad news (the filter is ahead); when prior &lt; 0.5, finding life is good news.{' '}
    <CitationLink cite="hansonFilter" text="Hanson 1998" />.
  </p>
);
const TT_PERSON_AFFECTING = (
  <p>
    When on, channel B (astronomical waste) is zeroed entirely — non-existent future persons have
    no welfare to weigh. <CitationLink cite="parfit1984" text="Parfit 1984" />.
  </p>
);
const TT_RISK = (
  <p>
    Decision-theoretic summary stat. EV-max takes the mean (risk-neutral); log-utility takes the
    geometric mean (risk-averse); difference-making takes the 25th percentile (downside-averse).
    See <CitationLink cite="rethinkPrioritiesCRAFT" text="Rethink Priorities CRAFT/CURVE" />.
  </p>
);

export function Ch04Worldview() {
  const worldview = useStore((s) => s.worldview);
  const activePreset = useStore((s) => s.activePreset);
  const patchWorldview = useStore((s) => s.patchWorldview);
  const loadPreset = useStore((s) => s.loadPreset);

  return (
    <ChapterShell
      num="04"
      eyebrow="Your axioms"
      title="Six dials and one of six presets."
      kicker="Worldview dials act as transforms on the value channels before EV is computed. No preset is privileged — Bostrom and Neartermist sit in the same dropdown."
    >
      <div className="font-mono text-[11px] text-muted tracking-chip uppercase mb-3">
        {activePreset === null
          ? 'Active configuration · Custom (no preset selected)'
          : 'Active configuration · click another preset to switch, or tweak any dial below'}
      </div>
      <div role="radiogroup" aria-label="Worldview preset" className="grid grid-cols-3 gap-3.5">
        {PRESETS.map((p, idx) => (
          <PresetTile
            key={p.id}
            preset={p}
            active={activePreset === p.id}
            onClick={() => {
              loadPreset(p.id);
            }}
            onKeyDown={(e) => {
              const keyMap: Record<string, number> = {
                ArrowRight: 1,
                ArrowLeft: -1,
                ArrowDown: 3,
                ArrowUp: -3,
              };
              const delta = keyMap[e.key];
              if (delta === undefined) return;
              e.preventDefault();
              const next = (idx + delta + PRESETS.length) % PRESETS.length;
              const target = PRESETS[next];
              if (target) {
                loadPreset(target.id);
                // Focus the corresponding tile.
                const buttons = e.currentTarget.parentElement?.querySelectorAll('button');
                buttons?.[next]?.focus();
              }
            }}
          />
        ))}
      </div>

      <div
        className="mt-7 grid grid-cols-2 bg-paper border border-ink px-7 py-6"
        style={{ rowGap: '18px', columnGap: '60px' }}
      >
        <RangeSlider
          sym="α_L"
          label="Longtermism strength"
          value={worldview.longtermismStrength}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => {
            patchWorldview({ longtermismStrength: v });
          }}
          hint="0 = neartermist · 1 = pure total-view"
          tooltip={TT_LONGTERMISM}
        />
        <RangeSlider
          sym="r"
          label="Pure time discount (per yr)"
          value={Number((worldview.timeDiscount * 100).toFixed(2))}
          min={0}
          max={10}
          step={0.1}
          unit="%"
          onChange={(v) => {
            patchWorldview({ timeDiscount: v / 100 });
          }}
          hint="discounts channels A & B over horizon T"
          tooltip={TT_DISCOUNT}
        />
        <RangeSlider
          sym="w_α"
          label="Alien moral weight"
          value={worldview.alienMoralWeight}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => {
            patchWorldview({ alienMoralWeight: v });
          }}
          hint="multiplies channel C only"
          tooltip={TT_ALIEN_WEIGHT}
        />
        <RangeSlider
          sym="h"
          label="Hingeyness"
          value={worldview.hingeyness}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => {
            patchWorldview({ hingeyness: v });
          }}
          hint="P( our actions matter for cosmic endowment )"
          tooltip={TT_HINGEYNESS}
        />
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
          hint="used in channel A only"
          tooltip={TT_FILTER_PRIOR}
        />
        <div className="flex flex-col gap-1.5">
          <div className="font-sans text-[13px] flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              Person-affecting view
              <Tooltip>{TT_PERSON_AFFECTING}</Tooltip>
            </span>
            <Toggle
              on={worldview.personAffecting}
              onChange={(v) => {
                patchWorldview({ personAffecting: v });
              }}
              label="Person-affecting view"
            />
          </div>
          <div className="font-mono text-[10.5px] text-muted">
            zeros channel B (astronomical waste)
          </div>
        </div>
        <div className="flex flex-col gap-1.5 col-span-2">
          <div className="font-sans text-[13px] flex items-center gap-1.5">
            Risk aversion
            <Tooltip>{TT_RISK}</Tooltip>
          </div>
          <Segmented<RiskAversion>
            value={worldview.riskAversion}
            onChange={(v) => {
              patchWorldview({ riskAversion: v });
            }}
            options={[
              { value: 'EV-max', label: 'EV-max' },
              { value: 'log-utility', label: 'log-utility' },
              { value: 'difference-making', label: 'difference-making' },
            ]}
            ariaLabel="Risk aversion"
          />
          <div className="font-mono text-[10.5px] text-muted">
            summary stat used: mean / geom-mean / 25th-percentile
          </div>
        </div>
      </div>
    </ChapterShell>
  );
}
