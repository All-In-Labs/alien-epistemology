# Python reference implementation

A clean-room re-implementation of the Drake Cause Prioritization Tool's Monte Carlo
pipeline, built from the spec (`drake-tool-spec.md` §5.1–§7.1). Used to verify the
TypeScript model against an independent implementation with a different RNG path.

## Why this exists

The JS test suite (Vitest) proves *internal* consistency — determinism, convergence,
Poisson partition sums to 1, etc. It can't prove the JS does what the spec says.

The Python implementation is the independent witness: if JS and Python disagree on
headline statistics beyond MC stderr, at least one is wrong. Agreement within stderr
is strong evidence that the spec-to-code translation is correct on both sides.

## Run

```sh
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python3 compare.py
```

## What it checks

Currently:
- Drake parameter sampling (log-uniform / linear-uniform per spec §5.1)
- Poisson partition statistics (`pNZero`, `pNExactlyOne`, `pNGtOne`) per §5.1's framing
- Default detection state's `pAnyDetection` (SETI-on, others-off per §5.2)

The script prints both Python and JS reference values and asserts agreement within 8σ
of MC stderr. JS reference numbers come from `pnpm vitest` runs with similar seeds at
n=100k; see `tests/integration/convergence.test.ts` and the SDO anchor.

## Limitations

- Different RNGs (Python PCG64 vs JS mulberry32) mean we test agreement on
  *statistics*, not on per-sample values.
- Value-channel and worldview transforms not yet ported. Those would let us
  cross-check `evDALYs` and the headline multiplier too — a worthwhile follow-up.
- f_l sampling matches JS (log-uniform 1e-30 to 1), not SDO 2018's log-normal. See
  the SDO literature anchor test for the parameter-range comparison.
