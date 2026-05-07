// Web Worker host for the Monte Carlo loop. Receives a DrakeMCInput, returns the
// DrakeMCOutput. Float64Arrays are transferred (not copied) for zero-copy speed.

import { runDrakeMC, type DrakeMCInput, type DrakeMCOutput } from '../model/monteCarlo';

interface WorkerRequest {
  id: number;
  input: DrakeMCInput;
}

interface WorkerResponse {
  id: number;
  output: DrakeMCOutput;
}

self.addEventListener('message', (e: MessageEvent<WorkerRequest>) => {
  const { id, input } = e.data;
  const output = runDrakeMC(input);
  const msg: WorkerResponse = { id, output };
  // Transfer the typed-array buffers to avoid a copy.
  const transfers: Transferable[] = [
    output.samples.buffer as ArrayBuffer,
    output.detectableSamples.buffer as ArrayBuffer,
    output.detectionProbSamples.buffer as ArrayBuffer,
    output.evSamples.buffer as ArrayBuffer,
    output.multiplierSamples.buffer as ArrayBuffer,
  ];
  (self as unknown as Worker).postMessage(msg, transfers);
});
