// f_l defaults to SDO 2018's model; setting f_l bounds switches to a custom range.
import { describe, it, expect } from 'vitest';
import { useStore } from '../../src/store';

describe('store: f_l distribution', () => {
  it('starts on SDO 2018’s model', () => {
    useStore.getState().resetAll();
    expect(useStore.getState().flDistribution).toBe('sdo-lognormal');
  });

  it('dragging the f_l slider switches to the user’s own range; reset goes back to SDO', () => {
    const s = useStore.getState();
    s.setDrakeRange('fl', { min: 1e-10, max: 0.5 });
    expect(useStore.getState().flDistribution).toBe('log-uniform');
    expect(useStore.getState().drakeRanges.fl).toEqual({ min: 1e-10, max: 0.5 });
    useStore.getState().resetDrakeRanges();
    expect(useStore.getState().flDistribution).toBe('sdo-lognormal');
  });

  it('setting another parameter leaves the f_l distribution alone', () => {
    useStore.getState().resetAll();
    useStore.getState().setDrakeRange('L', { min: 1000, max: 1e9 });
    expect(useStore.getState().flDistribution).toBe('sdo-lognormal');
  });
});
