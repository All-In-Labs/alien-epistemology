// Web Worker host for the Ch.6 tornado sweeps (29 Monte Carlo runs). Running them here
// keeps sliders responsive; they used to block the main thread on every change.

import { runTornado, type TornadoItem, type TornadoState } from '../model/tornado';

interface TornadoRequest {
  id: number;
  state: TornadoState;
}

export interface TornadoResponse {
  id: number;
  items: TornadoItem[];
}

self.addEventListener('message', (e: MessageEvent<TornadoRequest>) => {
  const { id, state } = e.data;
  const msg: TornadoResponse = { id, items: runTornado(state) };
  (self as unknown as Worker).postMessage(msg);
});
