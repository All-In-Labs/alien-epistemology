// Two-way URL hash <-> store sync. On mount, read the hash and hydrate the store
// if a valid state is present. On every state change, debounce-write the hash via
// history.replaceState so the address bar always reflects current state.

import { useEffect, useRef } from 'react';
import { applySerializedState, getSerializedState, useStore } from '../store';
import { buildHash, readHashState } from '../lib/permalink';

const URL_DEBOUNCE_MS = 500;

export function usePermalink(): void {
  const drakeRanges = useStore((s) => s.drakeRanges);
  const methods = useStore((s) => s.methods);
  const channels = useStore((s) => s.channels);
  const worldview = useStore((s) => s.worldview);
  const cosmology = useStore((s) => s.cosmology);
  const grabby = useStore((s) => s.grabby);
  const overrides = useStore((s) => s.overrides);
  const astroLocked = useStore((s) => s.astroLocked);
  const hydratedRef = useRef(false);
  const writeTimerRef = useRef<number | undefined>(undefined);

  // Hydrate on mount.
  useEffect(() => {
    const state = readHashState(window.location.hash);
    if (state) {
      applySerializedState(state);
    }
    hydratedRef.current = true;
  }, []);

  // Write debounced.
  useEffect(() => {
    if (!hydratedRef.current) return;
    window.clearTimeout(writeTimerRef.current);
    writeTimerRef.current = window.setTimeout(() => {
      const hash = buildHash(getSerializedState());
      window.history.replaceState(null, '', `${window.location.pathname}${hash}`);
    }, URL_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(writeTimerRef.current);
    };
  }, [drakeRanges, methods, channels, worldview, cosmology, grabby, overrides, astroLocked]);
}
