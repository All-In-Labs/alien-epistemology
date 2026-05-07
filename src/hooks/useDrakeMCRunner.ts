import { useEffect, useRef } from 'react';
import { MCWorkerClient } from '../lib/workerClient';
import { useStore } from '../store';

const MC_SAMPLES = 100_000;
const DEBOUNCE_MS = 150;

export function useDrakeMCRunner(): void {
  const drakeRanges = useStore((s) => s.drakeRanges);
  const methods = useStore((s) => s.methods);
  const channels = useStore((s) => s.channels);
  const worldview = useStore((s) => s.worldview);
  const setDrakeOutput = useStore((s) => s.setDrakeOutput);

  const timer = useRef<number | undefined>(undefined);
  const seedRef = useRef(0);
  const clientRef = useRef<MCWorkerClient | null>(null);

  useEffect(() => {
    clientRef.current ??= new MCWorkerClient();
    const client = clientRef.current;
    return () => {
      client.terminate();
      clientRef.current = null;
    };
  }, []);

  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      seedRef.current += 1;
      const client = clientRef.current;
      if (!client) return;
      void client
        .run({
          ranges: drakeRanges,
          methods,
          channels,
          worldview,
          n: MC_SAMPLES,
          seed: `drake-${seedRef.current.toString()}`,
        })
        .then((out) => {
          setDrakeOutput(out);
        });
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer.current);
    };
  }, [drakeRanges, methods, channels, worldview, setDrakeOutput]);
}
