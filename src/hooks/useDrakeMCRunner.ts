import { useEffect, useRef } from 'react';
import { runDrakeMC } from '../model/monteCarlo';
import { useStore } from '../store';

const MC_SAMPLES = 100_000;
const DEBOUNCE_MS = 150;

export function useDrakeMCRunner(): void {
  const drakeRanges = useStore((s) => s.drakeRanges);
  const setDrakeOutput = useStore((s) => s.setDrakeOutput);
  const timer = useRef<number | undefined>(undefined);
  const seedRef = useRef(0);

  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      seedRef.current += 1;
      const out = runDrakeMC({
        ranges: drakeRanges,
        n: MC_SAMPLES,
        seed: `drake-${seedRef.current.toString()}`,
      });
      setDrakeOutput(out);
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer.current);
    };
  }, [drakeRanges, setDrakeOutput]);
}
