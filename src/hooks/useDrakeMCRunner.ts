import { useEffect, useRef } from 'react';
import { MCWorkerClient } from '../lib/workerClient';
import { useStore } from '../store';

const MC_SAMPLES = 100_000;
const DEBOUNCE_MS = 150;

/**
 * Build a stable seed from the state slices that affect the MC. Used when
 * seedMode === 'deterministic' so identical configs produce identical results
 * across re-runs (the lightning-talk demo benefits from this — wiggling a slider
 * shouldn't add visible bouncing noise).
 */
function deterministicSeed(state: {
  drakeRanges: unknown;
  methods: unknown;
  channels: unknown;
  worldview: unknown;
  overrides: unknown;
  valueUncertainty: unknown;
  flDistribution: unknown;
  astroLocked: unknown;
}): string {
  // JSON.stringify is good enough; we hash to keep the seed compact.
  const payload = JSON.stringify(state);
  // Tiny FNV-1a hash — not cryptographic, just a stable mapping.
  let h = 2166136261 >>> 0;
  for (let i = 0; i < payload.length; i++) {
    h = (h ^ payload.charCodeAt(i)) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return `det-${h.toString(16)}`;
}

export function useDrakeMCRunner(): void {
  const drakeRanges = useStore((s) => s.drakeRanges);
  const methods = useStore((s) => s.methods);
  const channels = useStore((s) => s.channels);
  const worldview = useStore((s) => s.worldview);
  const overrides = useStore((s) => s.overrides);
  const valueUncertainty = useStore((s) => s.valueUncertainty);
  const flDistribution = useStore((s) => s.flDistribution);
  const seedMode = useStore((s) => s.seedMode);
  const setDrakeOutput = useStore((s) => s.setDrakeOutput);
  const setMcPending = useStore((s) => s.setMcPending);

  const timer = useRef<number | undefined>(undefined);
  const seedRef = useRef(0);
  /** Bumped on every settings change, so a result for older settings can't clear mcPending. */
  const genRef = useRef(0);
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
    setMcPending(true);
    const gen = ++genRef.current;
    timer.current = window.setTimeout(() => {
      const client = clientRef.current;
      if (!client) return;
      const seed =
        seedMode === 'deterministic'
          ? deterministicSeed({
              drakeRanges,
              methods,
              channels,
              // The risk dial only picks which summary number to show; leaving it out of
              // the seed means flipping it doesn't reshuffle the verdict's dots.
              worldview: { ...worldview, riskAversion: undefined },
              overrides,
              valueUncertainty,
              flDistribution,
              astroLocked: false, // not part of MC math; excluded from seed for stability
            })
          : `drake-${(++seedRef.current).toString()}`;
      void client
        .run({
          ranges: drakeRanges,
          methods,
          channels,
          worldview,
          overrides,
          valueUncertainty,
          flDistribution,
          n: MC_SAMPLES,
          seed,
        })
        .then((out) => {
          setDrakeOutput(out);
          if (gen === genRef.current) setMcPending(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer.current);
    };
  }, [
    drakeRanges,
    methods,
    channels,
    worldview,
    overrides,
    valueUncertainty,
    flDistribution,
    seedMode,
    setDrakeOutput,
    setMcPending,
  ]);
}
