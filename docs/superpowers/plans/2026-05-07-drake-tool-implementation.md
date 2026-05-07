# Drake Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Drake Cause Prioritization Tool — Direction A v2 — as a fully-functional Vite + React + TS-strict SPA, running real Monte Carlo math per `drake-tool-spec.md`, locally only (no Caddy deploy this milestone).

**Architecture:** Vite + React 18 + TypeScript-strict + Tailwind (with design-token theme extension) + Zustand for state + Web Worker for the Monte Carlo loop + bespoke SVG chart components ported from `design/effective-aliens-visualizer/project/direction-a.jsx`. TDD for all model code; Claude-for-Chrome smoke at every phase boundary.

**Tech Stack:** Vite 6, React 18.3, TypeScript 5.6 (strict + every extra strictness flag per spec §13.1), Tailwind 3, Zustand 5, Vitest 2, RTL, ESLint with `typescript-eslint/strict-type-checked`, Prettier, `pako` (deflate), `pnpm` via corepack.

**References:**
- `drake-tool-spec.md` — root spec (source of truth for *what* to build)
- `docs/superpowers/specs/2026-05-07-drake-tool-implementation-design.md` — brainstorm output (open questions resolved)
- `design/effective-aliens-visualizer/project/direction-a.jsx` — visual identity
- `design/effective-aliens-visualizer/project/shared.jsx` — bespoke chart implementations to port

---

## Phase boundary discipline

At the end of every phase, all four gates must pass before continuing:

1. `pnpm test` — green
2. `pnpm lint --max-warnings=0` — clean
3. `pnpm typecheck` — clean
4. Claude-for-Chrome visual verification — start `pnpm dev`, navigate, screenshot, exercise new controls, confirm visual + functional correctness

Then commit with the phase reference (e.g. `feat: phase 1 — drake core`).

---

## Phase 0 — Tooling install

### Task 0.1: Install pnpm via corepack

**Files:** none (global tooling)

- [ ] **Step 1: Confirm with user, then run corepack**

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm --version
```

Expected: pnpm version 9.x prints. corepack is bundled with Node 22; `corepack enable` adds the `pnpm` shim to PATH.

---

## Phase 1 — Drake core + scaffold + Ch.0 honesty contract + Ch.1 visuals

### Task 1.1: Initialise project with Vite

**Files:** repo root

- [ ] **Step 1: Scaffold Vite + React + TS**

```bash
pnpm create vite@latest . --template react-ts
```

Expected: Vite asks "Current directory is not empty" — choose "Ignore files and continue".

- [ ] **Step 2: Install dependencies**

```bash
pnpm install
pnpm add zustand pako
pnpm add -D tailwindcss postcss autoprefixer vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/pako
pnpm add -D eslint @eslint/js typescript-eslint eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y eslint-plugin-import prettier
```

- [ ] **Step 3: Initialise Tailwind**

```bash
pnpm exec tailwindcss init -p
```

- [ ] **Step 4: Commit scaffold**

```bash
git init
git add -A
git commit -m "chore: scaffold vite + react + ts + tailwind"
```

### Task 1.2: Apply strict TS config

**Files:**
- Modify: `tsconfig.json`
- Modify: `tsconfig.app.json`

- [ ] **Step 1: Replace `tsconfig.app.json` compilerOptions with the strict spec**

Use the exact `compilerOptions` block from `drake-tool-spec.md` §13.1. Verbatim:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable", "WebWorker"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true,
    "useUnknownInCatchVariables": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 2: Add `typecheck` script to `package.json`**

```json
"scripts": {
  "typecheck": "tsc --noEmit"
}
```

- [ ] **Step 3: Run typecheck — fix any fallout from the existing scaffold**

```bash
pnpm typecheck
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add tsconfig.app.json package.json
git commit -m "chore: apply strict typescript config"
```

### Task 1.3: Apply ESLint strict-type-checked config

**Files:**
- Create: `eslint.config.js` (use the verbatim block from spec §13.2)
- Modify: `package.json` (add `lint`, `format` scripts)

- [ ] **Step 1: Write `eslint.config.js`** — copy verbatim from spec §13.2.

- [ ] **Step 2: Add scripts to `package.json`**

```json
"lint": "eslint . --max-warnings=0",
"format": "prettier --write .",
"format:check": "prettier --check ."
```

- [ ] **Step 3: Add `.prettierrc.json` with `{}` (defaults)**

- [ ] **Step 4: Run lint, fix scaffold violations**

```bash
pnpm lint
```

Expected: clean (or fix any scaffolded sample violations).

- [ ] **Step 5: Commit**

```bash
git add eslint.config.js .prettierrc.json package.json
git commit -m "chore: apply strict eslint config"
```

### Task 1.4: Configure Tailwind with design tokens

**Files:**
- Modify: `tailwind.config.js`
- Modify: `src/index.css`
- Create: `src/styles/fonts.css`

- [ ] **Step 1: Write `tailwind.config.js`** with theme extension carrying the Direction A palette

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#f4efe2',
        paper: '#faf6ec',
        ink: '#1f1d18',
        muted: '#7a7368',
        accent: '#c2410c',
        bar: '#2a2823',
        rule: '#1f1d18',
        grid: 'rgba(31,29,24,0.08)',
        edge: '#e5dfcd',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        serif: ['Source Serif 4', 'serif'],
        sans: ['IBM Plex Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      letterSpacing: {
        eyebrow: '0.18em',
        chip: '0.14em',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2: Add Google Fonts `<link>` in `index.html`** — copy the `<link>` for Fraunces, Source Serif 4, IBM Plex Sans, IBM Plex Mono from `design/effective-aliens-visualizer/project/Drake Tool.html` lines 7–9.

- [ ] **Step 3: Replace `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root { height: 100%; margin: 0; }
body { background: #f4efe2; color: #1f1d18; }
* { box-sizing: border-box; }
```

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.js index.html src/index.css
git commit -m "chore: configure tailwind with direction-a design tokens"
```

### Task 1.5: Configure Vitest

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (add `test` script)

- [ ] **Step 1: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
});
```

- [ ] **Step 2: Add scripts**

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Commit**

```bash
git add vitest.config.ts package.json
git commit -m "chore: configure vitest"
```

### Task 1.6: Implement seedable RNG (TDD)

**Files:**
- Create: `src/lib/rng.ts`
- Test: `tests/unit/rng.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/unit/rng.test.ts
import { describe, it, expect } from 'vitest';
import { makeRng } from '../../src/lib/rng';

describe('makeRng', () => {
  it('is deterministic for a given seed', () => {
    const a = makeRng('seed-42');
    const b = makeRng('seed-42');
    for (let i = 0; i < 100; i++) {
      expect(a()).toBe(b());
    }
  });

  it('produces different sequences for different seeds', () => {
    const a = makeRng('A');
    const b = makeRng('B');
    const sa = Array.from({ length: 10 }, () => a());
    const sb = Array.from({ length: 10 }, () => b());
    expect(sa).not.toEqual(sb);
  });

  it('returns values in [0, 1)', () => {
    const r = makeRng('x');
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
```

- [ ] **Step 2: Run — expect FAIL (module not found)**

```bash
pnpm test -- tests/unit/rng.test.ts
```

- [ ] **Step 3: Implement `src/lib/rng.ts` (xmur3 + sfc32, ported from `shared.jsx`)**

```ts
function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function sfc32(a: number, b: number, c: number, d: number): () => number {
  return () => {
    a |= 0; b |= 0; c |= 0; d |= 0;
    const t = ((a + b) | 0) + d | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

export function makeRng(seed: string): () => number {
  const s = xmur3(seed);
  return sfc32(s(), s(), s(), s());
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
pnpm test -- tests/unit/rng.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/rng.ts tests/unit/rng.test.ts
git commit -m "feat(model): seedable RNG (xmur3 + sfc32)"
```

### Task 1.7: Implement sampling primitives (TDD)

**Files:**
- Create: `src/lib/sampling.ts`
- Test: `tests/unit/sampling.test.ts`

Functions: `logUniform(rng, min, max)`, `linearUniform(rng, min, max)`.

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { makeRng } from '../../src/lib/rng';
import { logUniform, linearUniform } from '../../src/lib/sampling';

describe('logUniform', () => {
  it('produces values in [min, max]', () => {
    const r = makeRng('lu');
    for (let i = 0; i < 10000; i++) {
      const v = logUniform(r, 1e-3, 1e3);
      expect(v).toBeGreaterThanOrEqual(1e-3);
      expect(v).toBeLessThanOrEqual(1e3);
    }
  });

  it('is uniform in log space (KS sanity)', () => {
    const r = makeRng('lu2');
    const samples = Array.from({ length: 5000 }, () => logUniform(r, 1, 1000));
    const logs = samples.map(Math.log10);
    const mean = logs.reduce((a, b) => a + b, 0) / logs.length;
    expect(mean).toBeGreaterThan(1.3);
    expect(mean).toBeLessThan(1.7);
  });
});

describe('linearUniform', () => {
  it('produces values in [min, max]', () => {
    const r = makeRng('li');
    for (let i = 0; i < 1000; i++) {
      const v = linearUniform(r, 0.4, 1.0);
      expect(v).toBeGreaterThanOrEqual(0.4);
      expect(v).toBeLessThanOrEqual(1.0);
    }
  });
});
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement**

```ts
export function logUniform(rng: () => number, min: number, max: number): number {
  const lo = Math.log(min);
  const hi = Math.log(max);
  return Math.exp(lo + rng() * (hi - lo));
}

export function linearUniform(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}
```

- [ ] **Step 4: PASS, commit**

```bash
git add src/lib/sampling.ts tests/unit/sampling.test.ts
git commit -m "feat(model): log-uniform and linear-uniform sampling"
```

### Task 1.8: Drake parameter sampling (TDD)

**Files:**
- Create: `src/model/drake.ts`
- Create: `src/constants/defaults.ts`
- Test: `tests/unit/drake.test.ts`

- [ ] **Step 1: Write `src/constants/defaults.ts` with the spec §5.1 table** (verbatim numbers)

```ts
export interface DrakeBound { min: number; max: number; floor?: number; }
export type DrakeParamId = 'R' | 'fp' | 'ne' | 'fl' | 'fi' | 'fc' | 'L' | 'fd';

export interface DrakeParamConfig {
  id: DrakeParamId;
  symbol: string;
  label: string;
  distribution: 'log-uniform' | 'linear-uniform';
  defaults: DrakeBound;
}

export const DRAKE_DEFAULTS: Record<DrakeParamId, DrakeParamConfig> = {
  R:  { id: 'R',  symbol: 'R*',  label: 'Star formation rate',           distribution: 'log-uniform',    defaults: { min: 1.5,    max: 10,    floor: 1.0  } },
  fp: { id: 'fp', symbol: 'fₚ',  label: 'Fraction of stars with planets', distribution: 'linear-uniform', defaults: { min: 0.4,    max: 1.0,   floor: 0.4  } },
  ne: { id: 'ne', symbol: 'nₑ',  label: 'Habitable planets per system',   distribution: 'log-uniform',    defaults: { min: 0.1,    max: 1.0,   floor: 0.01 } },
  fl: { id: 'fl', symbol: 'fₗ',  label: 'Fraction developing life',       distribution: 'log-uniform',    defaults: { min: 1e-30,  max: 1.0   } },
  fi: { id: 'fi', symbol: 'fᵢ',  label: 'Fraction with intelligence',     distribution: 'log-uniform',    defaults: { min: 1e-3,   max: 1.0   } },
  fc: { id: 'fc', symbol: 'f_c', label: 'Fraction communicating',         distribution: 'log-uniform',    defaults: { min: 1e-2,   max: 1.0   } },
  L:  { id: 'L',  symbol: 'L',   label: 'Civilisation lifetime (yr)',     distribution: 'log-uniform',    defaults: { min: 100,    max: 1e10  } },
  fd: { id: 'fd', symbol: 'f_d', label: 'Detection-readiness multiplier', distribution: 'log-uniform',    defaults: { min: 1e-3,   max: 1.0   } },
};

export const DRAKE_PARAM_ORDER: DrakeParamId[] = ['R','fp','ne','fl','fi','fc','L','fd'];
```

- [ ] **Step 2: Write failing tests for `sampleDrake`**

```ts
import { describe, it, expect } from 'vitest';
import { makeRng } from '../../src/lib/rng';
import { sampleDrake, DrakeRanges } from '../../src/model/drake';
import { DRAKE_DEFAULTS } from '../../src/constants/defaults';

const defaultRanges = (): DrakeRanges => ({
  R: DRAKE_DEFAULTS.R.defaults,
  fp: DRAKE_DEFAULTS.fp.defaults,
  ne: DRAKE_DEFAULTS.ne.defaults,
  fl: DRAKE_DEFAULTS.fl.defaults,
  fi: DRAKE_DEFAULTS.fi.defaults,
  fc: DRAKE_DEFAULTS.fc.defaults,
  L: DRAKE_DEFAULTS.L.defaults,
  fd: DRAKE_DEFAULTS.fd.defaults,
});

describe('sampleDrake', () => {
  it('returns a positive N', () => {
    const r = makeRng('drake-1');
    const ranges = defaultRanges();
    const sample = sampleDrake(r, ranges);
    expect(sample.N).toBeGreaterThanOrEqual(0);
    expect(sample.N_detectable).toBeGreaterThanOrEqual(0);
    expect(sample.N_detectable).toBeLessThanOrEqual(sample.N);
  });

  it('produces a wide distribution by default (SDO finding)', () => {
    const r = makeRng('drake-2');
    const ranges = defaultRanges();
    const Ns = Array.from({ length: 5000 }, () => sampleDrake(r, ranges).N);
    const zeros = Ns.filter(n => n < 1).length;
    expect(zeros / Ns.length).toBeGreaterThan(0.1);
    expect(zeros / Ns.length).toBeLessThan(0.7);
  });
});
```

- [ ] **Step 3: FAIL**

- [ ] **Step 4: Implement `src/model/drake.ts`**

```ts
import { logUniform, linearUniform } from '../lib/sampling';
import type { DrakeBound, DrakeParamId } from '../constants/defaults';

export type DrakeRanges = Record<DrakeParamId, DrakeBound>;

export interface DrakeSample {
  N: number;
  N_detectable: number;
  components: Record<DrakeParamId, number>;
}

export function sampleDrake(rng: () => number, ranges: DrakeRanges): DrakeSample {
  const R  = logUniform(rng, ranges.R.min, ranges.R.max);
  const fp = linearUniform(rng, ranges.fp.min, ranges.fp.max);
  const ne = logUniform(rng, ranges.ne.min, ranges.ne.max);
  const fl = logUniform(rng, ranges.fl.min, ranges.fl.max);
  const fi = logUniform(rng, ranges.fi.min, ranges.fi.max);
  const fc = logUniform(rng, ranges.fc.min, ranges.fc.max);
  const L  = logUniform(rng, ranges.L.min, ranges.L.max);
  const fd = logUniform(rng, ranges.fd.min, ranges.fd.max);
  const N = R * fp * ne * fl * fi * fc * L;
  return { N, N_detectable: N * fd, components: { R, fp, ne, fl, fi, fc, L, fd } };
}
```

- [ ] **Step 5: PASS, commit**

```bash
git add src/model/drake.ts src/constants/defaults.ts tests/unit/drake.test.ts
git commit -m "feat(model): drake parameter sampling (sdo formulation)"
```

### Task 1.9: Monte Carlo skeleton — N distribution stats (TDD)

**Files:**
- Create: `src/model/monteCarlo.ts`
- Test: `tests/unit/monteCarlo.test.ts`

- [ ] **Step 1: Write failing tests for `runDrakeMC` returning summary stats including `pNZero`, `pNGteOne`, `pNGtOne`**

```ts
import { describe, it, expect } from 'vitest';
import { runDrakeMC } from '../../src/model/monteCarlo';
import { DRAKE_DEFAULTS } from '../../src/constants/defaults';

const defaultRanges = () => ({
  R: DRAKE_DEFAULTS.R.defaults, fp: DRAKE_DEFAULTS.fp.defaults,
  ne: DRAKE_DEFAULTS.ne.defaults, fl: DRAKE_DEFAULTS.fl.defaults,
  fi: DRAKE_DEFAULTS.fi.defaults, fc: DRAKE_DEFAULTS.fc.defaults,
  L: DRAKE_DEFAULTS.L.defaults, fd: DRAKE_DEFAULTS.fd.defaults,
});

describe('runDrakeMC', () => {
  it('produces probabilities that sum to 1 across the partition {N=0, N=1, N>1}', () => {
    const out = runDrakeMC({ ranges: defaultRanges(), n: 10000, seed: 'mc-1' });
    expect(out.pNZero + out.pNExactlyOne + out.pNGtOne).toBeCloseTo(1, 6);
  });

  it('pNGteOne === 1 - pNZero', () => {
    const out = runDrakeMC({ ranges: defaultRanges(), n: 10000, seed: 'mc-2' });
    expect(out.pNGteOne).toBeCloseTo(1 - out.pNZero, 6);
  });

  it('returns N samples and sample bins', () => {
    const out = runDrakeMC({ ranges: defaultRanges(), n: 1000, seed: 'mc-3' });
    expect(out.samples.length).toBe(1000);
  });
});
```

- [ ] **Step 2: FAIL**

- [ ] **Step 3: Implement `src/model/monteCarlo.ts`**

```ts
import { sampleDrake, type DrakeRanges } from './drake';
import { makeRng } from '../lib/rng';

export interface DrakeMCInput {
  ranges: DrakeRanges;
  n: number;
  seed: string;
}

export interface DrakeMCOutput {
  pNZero: number;
  pNExactlyOne: number;
  pNGtOne: number;
  pNGteOne: number;
  samples: Float64Array;
}

export function runDrakeMC({ ranges, n, seed }: DrakeMCInput): DrakeMCOutput {
  const rng = makeRng(seed);
  const samples = new Float64Array(n);
  let zero = 0, one = 0, gtOne = 0;
  for (let i = 0; i < n; i++) {
    const s = sampleDrake(rng, ranges);
    samples[i] = s.N;
    if (s.N < 1) zero++;
    else if (s.N < 2) one++;
    else gtOne++;
  }
  return {
    pNZero: zero / n,
    pNExactlyOne: one / n,
    pNGtOne: gtOne / n,
    pNGteOne: 1 - zero / n,
    samples,
  };
}
```

- [ ] **Step 4: PASS, commit**

```bash
git add src/model/monteCarlo.ts tests/unit/monteCarlo.test.ts
git commit -m "feat(model): drake monte carlo skeleton with paired N stats"
```

### Task 1.10: Zustand store with Drake state

**Files:**
- Create: `src/store.ts`

- [ ] **Step 1: Implement initial store**

```ts
import { create } from 'zustand';
import type { DrakeRanges } from './model/drake';
import type { DrakeMCOutput } from './model/monteCarlo';
import { DRAKE_DEFAULTS } from './constants/defaults';

interface AppState {
  drakeRanges: DrakeRanges;
  drakeOutput: DrakeMCOutput | null;
  setDrakeRange: (id: keyof DrakeRanges, bound: { min: number; max: number }) => void;
  setDrakeOutput: (out: DrakeMCOutput) => void;
  resetDrake: () => void;
}

const initialRanges = (): DrakeRanges => ({
  R: DRAKE_DEFAULTS.R.defaults, fp: DRAKE_DEFAULTS.fp.defaults,
  ne: DRAKE_DEFAULTS.ne.defaults, fl: DRAKE_DEFAULTS.fl.defaults,
  fi: DRAKE_DEFAULTS.fi.defaults, fc: DRAKE_DEFAULTS.fc.defaults,
  L: DRAKE_DEFAULTS.L.defaults, fd: DRAKE_DEFAULTS.fd.defaults,
});

export const useStore = create<AppState>((set) => ({
  drakeRanges: initialRanges(),
  drakeOutput: null,
  setDrakeRange: (id, bound) => set((s) => ({ drakeRanges: { ...s.drakeRanges, [id]: bound } })),
  setDrakeOutput: (out) => set({ drakeOutput: out }),
  resetDrake: () => set({ drakeRanges: initialRanges() }),
}));
```

- [ ] **Step 2: Commit**

```bash
git add src/store.ts
git commit -m "feat(state): zustand store with drake ranges"
```

### Task 1.11: Bespoke chart components — Sparkline + Histogram + ComparatorBars + Tornado

**Files:**
- Create: `src/components/charts/Sparkline.tsx`
- Create: `src/components/charts/Histogram.tsx`
- Create: `src/components/charts/ComparatorBars.tsx`
- Create: `src/components/charts/Tornado.tsx`

Port verbatim from `design/effective-aliens-visualizer/project/shared.jsx` (Sparkline, Histogram, ComparatorBars) and `direction-a.jsx` (A_Tornado). Add TS types. Histogram takes `samples: Float64Array` instead of a seed and renders bins computed from the samples (log-binned for cost-effectiveness use case; for Drake N display, log10 with bins from -3 to +9).

- [ ] **Step 1: Implement `Sparkline.tsx` from `shared.jsx` lines 25–34**

```tsx
interface SparklineProps {
  values: number[];
  w?: number;
  h?: number;
  stroke?: string;
  fill?: string;
}

export function Sparkline({ values, w = 120, h = 28, stroke = '#1f1d18', fill = 'rgba(31,29,24,0.10)' }: SparklineProps) {
  const max = Math.max(...values, 1e-9);
  const norm = values.map(v => v / max);
  const pts = norm.map((v, i) => `${(i / (norm.length - 1)) * w},${h - v * h}`).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      <polygon points={area} fill={fill} />
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth={1.25} />
    </svg>
  );
}
```

- [ ] **Step 2: Implement `Histogram.tsx`** — takes a `Float64Array` of log10 multipliers, computes histogram with custom bin edges, renders SVG matching `shared.jsx` lines 37–76 styling. Props: `samples: Float64Array`, `w`, `h`, `refLine` (vertical reference at log10=0 for GiveWell bar), `xMin`, `xMax`, `xLabel`. Compute percentile bands from samples (5/25/75/95).

(Code in this step is ~80 lines, port directly from `shared.jsx` Histogram, replace fakeHistogram with bin-counts of provided samples on log10 scale.)

- [ ] **Step 3: Implement `ComparatorBars.tsx`** — port from `shared.jsx` lines 79–120 verbatim, type as `items: Array<{ label: string; lo: number; mid: number; hi: number; main?: boolean }>`.

- [ ] **Step 4: Implement `Tornado.tsx`** — port from `direction-a.jsx` lines 148–190, type as `items: Array<{ sym: string; label: string; low: number; high: number; lowLabel: string; highLabel: string }>`.

- [ ] **Step 5: Commit**

```bash
git add src/components/charts/
git commit -m "feat(charts): bespoke svg components ported from design"
```

### Task 1.12: RangeSlider + Toggle + Segmented (control primitives)

**Files:**
- Create: `src/components/controls/RangeSlider.tsx`
- Create: `src/components/controls/Toggle.tsx`
- Create: `src/components/controls/Segmented.tsx`
- Create: `src/components/controls/LogRangeSlider.tsx`

Port from `shared.jsx` lines 124–158, 205–218. The `LogRangeSlider` is new — for Drake parameter min/max bounds with two thumbs and warn-floor styling.

- [ ] **Step 1: Implement `RangeSlider.tsx`** (single-thumb linear)

```tsx
interface RangeSliderProps {
  label: string;
  sym?: string;
  min?: number;
  max?: number;
  step?: number;
  value: number;
  unit?: string;
  warn?: boolean;
  hint?: string;
  onChange: (v: number) => void;
}

export function RangeSlider(props: RangeSliderProps) {
  const { label, sym, min = 0, max = 1, step = 0.01, value, unit = '', warn = false, hint, onChange } = props;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          {sym && <span className="font-serif italic text-[15px] text-ink">{sym}</span>}
          <span className="font-sans text-[13px] text-ink">{label}</span>
        </div>
        <span className={`font-mono text-xs ${warn ? 'text-accent' : 'text-ink'}`}>{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: warn ? '#c2410c' : '#1f1d18' }}
      />
      {hint !== undefined && <div className="font-mono text-[10.5px] text-muted">{hint}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Implement `Toggle.tsx`** (port from `shared.jsx` 145–158)

- [ ] **Step 3: Implement `Segmented.tsx`** (port from `shared.jsx` 205–218)

- [ ] **Step 4: Implement `LogRangeSlider.tsx`** — two-thumb log-scale range with bound labels and warn-below-floor styling. This is the slider used in Direction A Ch.1 (`A_DrakeRow` in `direction-a.jsx`).

```tsx
interface LogRangeSliderProps {
  symbol: string;
  label: string;
  min: number;
  max: number;
  floor?: number;
  loValue: number;
  hiValue: number;
  preview: number[];
  onChange: (lo: number, hi: number) => void;
  distribution: 'log-uniform' | 'linear-uniform';
}
```

Render: 180px label column (italic serif symbol + sans label), middle track with two thumbs, sparkline preview on the right. Format bounds via `formatBound` helper (port from `direction-a.jsx` 84–89). On change, emit new lo/hi. Use `<input type="range">` × 2 stacked or a custom drag handler — start with two range inputs side-by-side for simplicity.

- [ ] **Step 5: Commit**

```bash
git add src/components/controls/
git commit -m "feat(controls): range, log-range, toggle, segmented primitives"
```

### Task 1.13: Histogram-bin helper for Drake samples

**Files:**
- Create: `src/lib/binning.ts`
- Test: `tests/unit/binning.test.ts`

- [ ] **Step 1: Failing test** — `binLog10(samples, min, max, nBins)` returns `number[]` of bin counts.

```ts
import { describe, it, expect } from 'vitest';
import { binLog10 } from '../../src/lib/binning';

describe('binLog10', () => {
  it('counts samples into log-spaced bins', () => {
    const samples = new Float64Array([0.1, 1, 10, 100, 1000]);
    const bins = binLog10(samples, -1, 3, 4);
    expect(bins.reduce((a, b) => a + b, 0)).toBe(5);
    expect(bins.length).toBe(4);
  });

  it('handles values below min by clamping to 0th bin', () => {
    const samples = new Float64Array([1e-10, 1]);
    const bins = binLog10(samples, -3, 3, 6);
    expect(bins[0]).toBe(1);
  });
});
```

- [ ] **Step 2: FAIL**

- [ ] **Step 3: Implement**

```ts
export function binLog10(samples: Float64Array, logMin: number, logMax: number, nBins: number): number[] {
  const bins = new Array<number>(nBins).fill(0);
  const range = logMax - logMin;
  for (let i = 0; i < samples.length; i++) {
    const v = samples[i];
    if (v === undefined || v <= 0) continue;
    const logV = Math.log10(v);
    const t = Math.max(0, Math.min(0.999999, (logV - logMin) / range));
    const idx = Math.floor(t * nBins);
    bins[idx] = (bins[idx] ?? 0) + 1;
  }
  return bins;
}
```

- [ ] **Step 4: PASS, commit**

### Task 1.14: Layout chrome — Masthead + StatPair + ChapterShell

**Files:**
- Create: `src/components/Masthead.tsx`
- Create: `src/components/StatPair.tsx`
- Create: `src/components/ChapterShell.tsx`

Port from `direction-a.jsx`:
- Masthead from lines 290–320
- StatPair from lines 45–62 (real values from `useStore().drakeOutput`)
- A_Chapter from lines 29–43

Translate inline styles to Tailwind classes using the design tokens. For example: `style={{padding:'56px 80px 36px', borderBottom:'1px solid #1f1d18'}}` → `className="px-20 pt-14 pb-9 border-b border-ink"`.

- [ ] **Step 1: Implement `Masthead.tsx`** — render the v0.1 strip, eyebrow, h1 with red "alien-finding?", lede paragraph, cosmology selector + "presenter mode" button + "copy permalink" button + permalink chips strip. For Phase 1, the cosmology selector is a stub (single 'sdo' value, the others disabled with a "coming in phase 5" tooltip).

- [ ] **Step 2: Implement `StatPair.tsx`** — reads `useStore().drakeOutput`, formats `pNZero`, `pNGteOne`, `pNGtOne` as percentages, displays "n = 100,000 Monte Carlo samples · debounced 150 ms" footer.

- [ ] **Step 3: Implement `ChapterShell.tsx`** — `<section data-chapter={num}>` with eyebrow + h2 + kicker + children, matching `A_Chapter` exactly.

- [ ] **Step 4: Commit**

### Task 1.15: Ch.0 Honesty Contract chapter

**Files:**
- Create: `src/components/chapters/Ch00Contract.tsx`
- Create: `src/components/ContractRule.tsx`

Port from `direction-a.jsx` lines 218–226 (A_ContractRule) and the chapter body lines 331–343. Static content, no state.

- [ ] **Step 1: Implement** — three numbered rules, body copy verbatim from `direction-a.jsx`. Footer line "Cf. SDO 2018 · Azad 2026 (directional reasoning) · §10 of the project spec".

- [ ] **Step 2: Commit**

### Task 1.16: Ch.1 Drake equation chapter

**Files:**
- Create: `src/components/chapters/Ch01Drake.tsx`

For each parameter in `DRAKE_PARAM_ORDER`, render a `LogRangeSlider` row with:
- Symbol + label
- Two-thumb min/max inputs bound to `useStore().drakeRanges[id]` and `setDrakeRange`
- Floor warning: when `lo < floor`, render the slider with `warn=true` so it goes accent-red
- Sparkline preview on the right showing the marginal distribution of *that parameter's* contribution; for now use `binLog10` of `nSamples=1000` of just that parameter's sampling

Footer: two buttons — "Lock astrophysical params" (bonds R, fp, ne to defaults), "Reset to SDO defaults".

- [ ] **Step 1: Implement** the chapter component plus a `useDrakeMCRunner` hook that runs `runDrakeMC` (n=10⁵) on mount and on `drakeRanges` change with 150ms debounce, putting the result into `setDrakeOutput`.

- [ ] **Step 2: Commit**

### Task 1.17: Wire App.tsx to render Phase 1

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Replace `App.tsx`**

```tsx
import { Masthead } from './components/Masthead';
import { StatPair } from './components/StatPair';
import { Ch00Contract } from './components/chapters/Ch00Contract';
import { Ch01Drake } from './components/chapters/Ch01Drake';
import { useDrakeMCRunner } from './hooks/useDrakeMCRunner';

export default function App() {
  useDrakeMCRunner();
  return (
    <div className="bg-bg text-ink min-h-screen font-serif">
      <Masthead />
      <section className="px-20 pt-12 pb-3">
        <StatPair />
        <p className="font-serif italic text-[14px] text-muted mt-3.5 max-w-[840px]">
          The pairing matters more than either individual stat.{' '}
          <span className="text-ink not-italic">"We are probably alone"</span>{' '}
          and{' '}
          <span className="text-ink not-italic">"we probably are not"</span>{' '}
          are equally valid framings of the same Monte Carlo result.
        </p>
      </section>
      <Ch00Contract />
      <Ch01Drake />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

### Task 1.18: Phase 1 verification gate

- [ ] **Step 1: `pnpm test`** — all green

- [ ] **Step 2: `pnpm typecheck`** — clean

- [ ] **Step 3: `pnpm lint`** — clean

- [ ] **Step 4: `pnpm dev`** — start in background, navigate via Claude for Chrome to `http://localhost:5173`, screenshot, confirm:
  - Masthead renders with Fraunces h1 in correct cream/ink/accent palette
  - Headline stats show **both** P(N=0) and P(N≥1) with identical visual weight
  - Both stats sum to 100% (allowing rounding)
  - Ch.0 honesty contract renders with three numbered rules
  - Ch.1 Drake parameter sliders render; moving any slider visibly changes the headline stats (debounced)
  - Floor-warning visual fires when a param is dragged below its floor

- [ ] **Step 5: Commit phase boundary**

```bash
git add -A
git commit -m "phase(1): drake core complete"
```

---

## Phase 2 — Detection programmes

**Goal:** Five toggleable detection methods + combined `P(detection)` calc + Ch.2 instruments visuals.

**TDD-first**, then UI. New files:
- `src/constants/detectionDefaults.ts` — five methods from spec §5.2 table
- `src/model/detection.ts` — `pDetectGivenN({ methods, N_detectable })`
- `tests/unit/detection.test.ts` — formula identity, disable=zero, RETINA-cheap-per-unit
- `src/components/MethodToggle.tsx` — port from `direction-a.jsx` `A_MethodRow` (lines 91–114)
- `src/components/chapters/Ch02Detection.tsx` — chapter scaffold + sensitivity caveat blockquote
- Update `src/store.ts` to track method on/off + per-method cost + per-method log-sensitivity
- Update `src/model/monteCarlo.ts` to compute `P(detection)` per sample, surface `pAnyDetection` in summary
- Update `StatPair.tsx` to also show "P(any detection in decade): Z%" stat under the pair

**Verification gate:** all four; new Claude-for-Chrome checks: enabling/disabling each method updates the detection stat live; impossible combos (zero cost) handled.

Detection formula reference (spec §5.2):
- Per method, per civ: `p_m = 1 - exp(-s_m × c_m / 1e9)` where `s_m` is the sampled sensitivity (log-uniform over user bounds) and `c_m` is the user-set decadal cost
- Per method against `N_detectable`: `P_m = 1 - (1-p_m)^N_detectable`
- Combined: `P_detect = 1 - Π_m (1 - P_m)`

Commit: `phase(2): detection programmes complete`.

---

## Phase 3 — Value channels

**Goal:** Four channels + Ch.3 cards + EV in DALYs computed in MC.

New files:
- `src/constants/valueDefaults.ts` — defaults for each channel from spec §5.3
- `src/model/value.ts` — `valueOnDetection({ detectionType, channels, dials })` returning `vDetect: number`
- `tests/unit/value.test.ts` — algebraic identities (disable all channels → 0; channel A goes negative when Δ > 0 and prior says filter behind)
- `src/components/ChannelCard.tsx` — port from `direction-a.jsx` lines 116–134 (A_ChannelCard)
- `src/components/chapters/Ch03Value.tsx` — chapter wrapper

Update store to carry channel toggle/dial state. Update MC to compute per-sample EV in DALYs. Headline stats unchanged (still N + P(detection)) until Phase 6.

Channel formulas (spec §5.3):
- A: `−Δ × V_xrisk_info` (sign flips when filter prior > 0.5)
- B: `(net shift) × V_cosmic_endowment` where net shift = tech_viability_shift + lightcone_claim_shift
- C: `P(friendly) × V_contact_friendly`, only fires for `radio | technosig | passive_radar`
- D: `P(hostile) × V_hostile_disvalue`, only fires for `radio | technosig | probe`

`V_detect = A + B + C + D`.

Commit: `phase(3): value channels complete`.

---

## Phase 4 — Worldview & presets, Web Worker, comparison view

**Goal:** Worldview panel + 6 presets + MC moved into Worker + side-by-side compare for 2 presets.

New files:
- `src/model/worldview.ts` — `applyWorldview({ vDetect, dials })` returning `vUser`
- `src/presets/worldviews.ts` — six presets from spec §6.4
- `tests/unit/worldview.test.ts`, `tests/integration/presets.test.ts`
- `src/workers/mcWorker.ts` — host the MC loop with a `postMessage`-driven contract
- `src/lib/workerClient.ts` — typed wrapper for spawning the worker, debouncing, transferable Float64Array results
- `src/components/WorldviewPanel.tsx` — six dials + risk-aversion segmented control (port from `direction-a.jsx` lines 387–399)
- `src/components/PresetSelector.tsx`, `src/components/PresetTile.tsx`
- `src/components/chapters/Ch04Worldview.tsx`
- `src/components/ComparisonView.tsx` — render two histograms side-by-side for two selected presets

Worldview transforms (spec §5.4):
- Longtermism strength multiplies channels A, B
- Pure time discount discounts A, B by `(1+r)^-T_horizon`
- Person-affecting toggle zeros B
- Alien moral weight multiplies C
- Risk aversion changes which summary stat we display (mean vs geom-mean vs 25th-pctl)
- Filter prior P(behind us) used in channel A
- Hingeyness multiplies B

**Acceptance check** (spec §10 #2): Ord Moderate preset must NOT default to "obviously top EA cause" multiplier. Verify this empirically via a MC run in tests.

Commit: `phase(4): worldview, presets, worker, compare`.

---

## Phase 5 — Cosmology & prior overrides

**Goal:** Three-way cosmology selector (SDO / Grabby / Hybrid) + grabby model + the §5.5 Bayesian-shortcut prior overrides.

New files:
- `src/model/grabby.ts` — sample `P(inside grabby zone)` per spec §5.1.5; for hybrid, mix samples by `grabby_credence`
- `tests/unit/grabby.test.ts`
- `src/components/CosmologySelector.tsx` — already stubbed in Phase 1; activate
- `src/components/PriorOverridePanel.tsx` — two toggleable sliders: P(N≥1) override, detection-floor override

Worker now branches on cosmology mode. For grabby, replace `N_detectable` calc with `P(inside grabby zone)` and apply 10–100× sensitivity boost on `probe`/`passive_radar` methods.

Commit: `phase(5): cosmology + prior overrides`.

---

## Phase 6 — Output, comparators, tooltips

**Goal:** Ch.5 verdict (histogram in cost-effectiveness × GiveWell units, summary stats, comparator bars) + tooltips throughout.

New files:
- `src/constants/comparators.ts` — table from spec §7.2
- `src/components/chapters/Ch05Verdict.tsx`
- `src/components/SummaryStats.tsx` — median, 5th, 95th, P(>GW), P(EV<0)
- `src/components/Tooltip.tsx` — accessible hover/focus tooltip with primary-source links

Update MC to also compute `multiplier = (EV_DALYs / total_cost) × 100` per sample (with `total_cost = sum of enabled-method decadal costs`). Output histogram uses log10 multiplier samples.

**Acceptance check** (spec §10 #4): comparator bars show whisker ranges, not points. (#9 will be deferred to Phase 7.)

Commit: `phase(6): output, comparators, tooltips`.

---

## Phase 7 + v2 — Permalinks, tornado, presenter mode, colophon, README

**Goal:** Round out the v2 bundle and ship-ready local app.

### 7a — Permalinks

- `src/lib/permalink.ts` — encode/decode state to base64url+deflate hash with `pako`; `v=1`; migrations map
- `src/lib/migrations.ts` — empty for now but framework in place
- `tests/integration/permalink.test.ts` — round-trip on randomised state
- `src/components/PermalinkButton.tsx` — copy URL + 1.5s "Copied!" toast
- `src/components/PermalinkChips.tsx` — three chips (Bostrom / Neartermist / Hanson Filter), each loads a fully-configured worldview state
- `src/presets/permalinkChips.ts` — three pre-baked state objects (loaded via setting all relevant store fields)
- App effect: parse `window.location.hash` on load → migrate → hydrate; debounced (~500ms) `history.replaceState` on state change

### 7b — Ch.6 Tornado / sensitivity plot

- Worker: add `runTornadoSweep` that runs MC ~10 times with each tornado parameter swept to its low/high bound, holding others at Ord Moderate defaults; return `Array<{ symbol, label, low, high, lowLabel, highLabel }>` sorted by total spread
- `src/model/tornado.ts` — pure function for the sweep params + label formatting
- `src/components/chapters/Ch06Tornado.tsx` — chapter wrapper consuming the result; "Sensitivities dominate / Worldview is second / Astrophysics barely matters" three-card footer (verbatim copy from `direction-a.jsx` lines 449–451)
- Use n=10⁴ for sweeps (vs n=10⁵ for the main MC) to keep it snappy

### 7c — Presenter mode

- `src/components/PresenterMode.tsx` — sticky black header that pins headline stats + chapter counter when active
- `useEffect` keybinding handler: `P` toggles, `←/→` snap-scroll between chapter refs (port from `direction-a.jsx` lines 239–262)

### 7d — Colophon + README + CLAUDE.md

- Footer (port from `direction-a.jsx` lines 463–466)
- Top-level `README.md` — citations: SDO 2018, Bostrom 2003, Hanson 2021, Sandberg & Armstrong 2013, Ord *Precipice*, Azad 2026; usage notes; "computes EV given a prior, prior is your responsibility" framing per spec §5.5
- `CLAUDE.md` per spec §13.6

Commit chunks: `phase(7): permalinks`, `phase(7): tornado`, `phase(7): presenter mode`, `phase(7): colophon + readme`.

---

## Final acceptance gate (spec §10)

After Phase 7 commits, run end-to-end:

- [ ] `pnpm test` — all green, non-trivial coverage of all model + permalink
- [ ] `pnpm lint --max-warnings=0` — clean
- [ ] `pnpm typecheck` — clean, no `any` in `src/`
- [ ] Claude-for-Chrome smoke test: load app, exercise one of each control type (slider, toggle, preset, cosmology, permalink chip, presenter mode, tornado), verify results
- [ ] Manual eyeball: Ord Moderate default multiplier is **not** "obviously top EA cause"; `P(EV<0)` is non-zero under Dark Forest preset; both `P(N=0)` and `P(N≥1)` always paired with identical typographic weight

If any check fails, fix before declaring done. No "I'll come back to this."
