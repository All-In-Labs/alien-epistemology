import { ChapterShell } from '../ChapterShell';
import { PresetTile } from '../PresetTile';
import { RangeSlider } from '../controls/RangeSlider';
import { Segmented } from '../controls/Segmented';
import { Toggle } from '../controls/Toggle';
import { useStore } from '../../store';
import { PRESETS } from '../../presets/worldviews';
import type { RiskAversion } from '../../model/worldview';

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
      <div className="grid grid-cols-3 gap-3.5">
        {PRESETS.map((p) => (
          <PresetTile
            key={p.id}
            preset={p}
            active={activePreset === p.id}
            onClick={() => {
              loadPreset(p.id);
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
        />
        <div className="flex flex-col gap-1.5">
          <div className="font-sans text-[13px] flex items-center justify-between">
            Person-affecting view
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
          <div className="font-sans text-[13px]">Risk aversion</div>
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
