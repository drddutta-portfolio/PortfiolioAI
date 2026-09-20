# PortfolioAI — Gate H H2 ROCE IQR Convention Decision

**Date:** 20 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Target:** TORNTPHARM / Capital Efficiency  
**Status:** OWNER DECISION REQUIRED  
**Safety:** read-only; no score persistence

## Why a decision is required

The owner-approved Domestic Capital Efficiency methodology uses:

- ROCE level — 60%
- ROCE stability / IQR — 20%
- ROCE trend — 20%

TORNTPHARM currently has three locked annual ROCE observations:

- FY2024 = 28%
- FY2025 = 31%
- FY2026 = 26%

Level and trend are unambiguous:

- median ROCE = 28%
- latest minus median of prior two years = 26 - 29.5 = -3.5 percentage points

The IQR is not unambiguous with only three observations unless a percentile convention is explicitly chosen.

## Two defensible conventions

### Option A — Linear percentile interpolation / Type-7 style

Sorted values:

```text
26, 28, 31
```

Q1 = 27  
Q3 = 29.5  
IQR = 2.5 pp

Under the approved stability bands:

- IQR 2.5 => stability score 100

Capital Efficiency score:

```text
Level:     85 × 60% = 51
Stability:100 × 20% = 20
Trend:     40 × 20% = 8

Total = 79
```

### Option B — Tukey hinges / exclusive-median halves

Sorted values:

```text
26, 28, 31
```

Q1 = 26  
Q3 = 31  
IQR = 5 pp

Under the approved stability bands:

- IQR 5 => stability score 80

Capital Efficiency score:

```text
Level:     85 × 60% = 51
Stability: 80 × 20% = 16
Trend:     40 × 20% = 8

Total = 75
```

## Recommendation for PortfolioAI

Use **Option A — linear percentile interpolation / Type-7 style** as the canonical IQR convention.

Reasons:

- deterministic for any sample size;
- continuous rather than hinge-based;
- widely used by common analytical/statistical tooling;
- scales cleanly when the preferred five-year ROCE history becomes available;
- avoids changing convention as the history length grows.

This recommendation changes no approved score band or weight. It only fixes the deterministic definition of the already-approved `IQR` statistic.

## Proposed canonical rule

```text
PERCENTILE_CONVENTION = LINEAR_INTERPOLATION_TYPE_7

For sorted x[0..n-1] and percentile p:
h = (n - 1) × p
lower = floor(h)
upper = ceil(h)
value = x[lower] + (h - lower) × (x[upper] - x[lower])

Q1 = p25
Q3 = p75
IQR = Q3 - Q1
```

## Approval effect

If approved:

- TORNTPHARM ROCE IQR = 2.5 pp
- Capital Efficiency derived-statistic package becomes deterministic
- Capital Efficiency read-only score = 79
- no score is persisted
- no other dimension is affected

If not approved, Capital Efficiency remains fail-closed pending a different explicit percentile convention.
