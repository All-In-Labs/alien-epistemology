// Typed client for the MC web worker. Single in-flight request per client; new
// requests cancel any pending one (we just keep the latest result).

import type { DrakeMCInput, DrakeMCOutput } from '../model/monteCarlo';

interface PendingRequest {
  id: number;
  resolve: (out: DrakeMCOutput) => void;
}

interface WorkerResponse {
  id: number;
  output: DrakeMCOutput;
}

export class MCWorkerClient {
  private worker: Worker;
  private nextId = 1;
  private inflight: PendingRequest | null = null;

  constructor() {
    this.worker = new Worker(new URL('../workers/mcWorker.ts', import.meta.url), {
      type: 'module',
    });
    this.worker.addEventListener('message', (e: MessageEvent<WorkerResponse>) => {
      const { id, output } = e.data;
      if (this.inflight?.id === id) {
        this.inflight.resolve(output);
        this.inflight = null;
      }
    });
  }

  run(input: DrakeMCInput): Promise<DrakeMCOutput> {
    const id = this.nextId++;
    const promise = new Promise<DrakeMCOutput>((resolve) => {
      this.inflight = { id, resolve };
    });
    this.worker.postMessage({ id, input });
    return promise;
  }

  terminate(): void {
    this.worker.terminate();
  }
}
