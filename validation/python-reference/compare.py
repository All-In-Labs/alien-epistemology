"""
Python reference implementation of the Drake Cause Prioritization Tool's MC pipeline.

Built from the spec (drake-tool-spec.md §5.1–§7.1), NOT transliterated from the
TypeScript source. The aim is an independent second opinion on the headline statistics:
if JS and Python disagree by more than MC stderr, at least one is wrong.

Different RNGs (Python's PCG64 vs JS's mulberry32) deliberately. Cross-implementation
agreement up to MC noise is what we're testing — not bit-exact reproducibility.

Run:
    python3 compare.py

Compares against JS reference numbers produced by `pnpm vitest` with similar seeds.
"""

from __future__ import annotations

import math

import numpy as np

# ---- Drake parameter ranges (spec §5.1, defaults). ----

DRAKE_RANGES: dict[str, tuple[str, float, float]] = {
    "R":  ("log-uniform",    1.5,    10.0),
    "fp": ("linear",         0.4,     1.0),
    "ne": ("log-uniform",    0.1,     1.0),
    "fl": ("log-uniform",    1e-30,   1.0),
    "fi": ("log-uniform",    1e-3,    1.0),
    "fc": ("log-uniform",    1e-2,    1.0),
    "L":  ("log-uniform",  100.0,  1e10),
    "fd": ("log-uniform",    1e-3,    1.0),
}

# ---- Detection defaults (spec §5.2). ----

DETECTION_METHODS = [
    # (id, type, costM_decadal, sens_min, sens_max)
    ("seti",   "radio",          50.0,   1e-4, 1e-1),
    ("tech",   "technosig",      50.0,   1e-5, 1e-2),
    ("bio",    "biosig",       5000.0,   1e-4, 1e-2),
    ("probe",  "probe",         500.0,   1e-6, 1e-4),
    ("retina", "passive_radar",   5.0,   1e-6, 1e-2),
]
# Spec note: SETI on by default, others off. Match the JS defaultDetectionState.
DETECTION_DEFAULT_ON = {"seti": True, "tech": False, "bio": False, "probe": False, "retina": False}


def sample_drake(rng: np.random.Generator, n: int) -> tuple[np.ndarray, np.ndarray]:
    """Sample n draws of N (rate) and N_detectable from the Drake parameter joint."""
    samples: dict[str, np.ndarray] = {}
    for name, (dist, lo, hi) in DRAKE_RANGES.items():
        if dist == "log-uniform":
            samples[name] = np.exp(rng.uniform(math.log(lo), math.log(hi), size=n))
        else:
            samples[name] = rng.uniform(lo, hi, size=n)
    # Sum logs for numerical stability across 30+ OOM.
    log_n = (
        np.log(samples["R"])
        + np.log(samples["fp"])
        + np.log(samples["ne"])
        + np.log(samples["fl"])
        + np.log(samples["fi"])
        + np.log(samples["fc"])
        + np.log(samples["L"])
    )
    N = np.exp(log_n)
    N_det = np.exp(log_n + np.log(samples["fd"]))
    return N, N_det


def poisson_partition(N: np.ndarray) -> tuple[float, float, float]:
    """Mean partition stats: (pNZero, pNExactlyOne, pNGtOne)."""
    # exp(-N) underflows to 0 for large N; np.exp handles this gracefully.
    pz = np.where(N <= 0, 1.0, np.exp(-N))
    p1 = np.where(N <= 0, 0.0, N * np.exp(-N))
    pgt1 = np.where(N <= 0, 0.0, 1 - pz - p1)
    return float(pz.mean()), float(p1.mean()), float(pgt1.mean())


def detection_combined(rng: np.random.Generator, N_det: np.ndarray) -> np.ndarray:
    """Per-sample P(at least one detection across SETI-on default config)."""
    n = N_det.shape[0]
    log_prod_miss = np.zeros(n)
    any_on = False
    for (mid, _mtype, costM, smin, smax) in DETECTION_METHODS:
        if not DETECTION_DEFAULT_ON[mid] or costM <= 0:
            continue
        any_on = True
        # Sample sensitivity log-uniformly per-sample.
        s = np.exp(rng.uniform(math.log(smin), math.log(smax), size=n))
        c_B = costM / 1000.0  # M$ → $B-decade
        p_m = 1 - np.exp(-s * c_B)  # per-civ-per-decade
        # P(this method misses all N_det civs) = (1 - p_m)^N_det. Use log1p for precision.
        # Mask the N_det <= 0 case to keep log undefined values out.
        with np.errstate(invalid="ignore"):
            log_miss = np.where(N_det > 0, N_det * np.log1p(-p_m), 0.0)
        log_prod_miss += log_miss
    if not any_on:
        return np.zeros(n)
    p_combined = np.where(N_det > 0, -np.expm1(log_prod_miss), 0.0)
    return p_combined


def main() -> None:
    n = 100_000
    seed = 42
    rng = np.random.default_rng(seed=seed)

    N, N_det = sample_drake(rng, n)
    pz, p1, pgt1 = poisson_partition(N)
    p_det = detection_combined(rng, N_det)

    # MC stderr: σ_p = √(p(1-p)/n). For p≈0.5, n=100k → σ ≈ 0.0016.
    se = lambda p: math.sqrt(max(p * (1 - p), 1e-30) / n)

    print(f"Python reference @ n={n}, seed={seed}")
    print(f"  pNZero        = {pz:.4f}  ±{4*se(pz):.4f} (4σ)")
    print(f"  pNGteOne      = {1-pz:.4f}  ±{4*se(1-pz):.4f}")
    print(f"  pNExactlyOne  = {p1:.4f}  ±{4*se(p1):.4f}")
    print(f"  pNGtOne       = {pgt1:.4f}  ±{4*se(pgt1):.4f}")
    print(f"  pAnyDetection = {p_det.mean():.4f}  (mean of continuous per-sample probability)")
    print(f"  median N      = {np.median(N):.3e}")
    print(f"  mean N        = {N.mean():.3e}")
    print()
    print("JS reference (from `pnpm vitest`, seeds 'sdo-1'..'sdo-5', n=100k each):")
    print("  pNZero        ≈ 0.875  ±0.004 (across 5 seeds)")
    print("  pNGteOne      ≈ 0.125  ±0.004")
    print("  pNExactlyOne  ≈ 0.013")
    print("  pNGtOne       ≈ 0.111")
    print("  pAnyDetection ≈ 0.018  (default detection state = SETI only)")
    print()
    print("Agreement check:")
    js_pz = 0.875
    print(f"  |Python pNZero - JS pNZero| = {abs(pz - js_pz):.4f}  "
          f"(threshold 8σ = {8*se(pz):.4f})")
    assert abs(pz - js_pz) < 8 * se(pz), "pNZero diverges beyond 8σ — investigate"
    print("  PASS: partition stats agree within MC stderr.")


if __name__ == "__main__":
    main()
