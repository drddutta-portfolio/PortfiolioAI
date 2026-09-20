# PortfolioAI — Gate H H2 TORNTPHARM Cash Flow Input Lock

**Date:** 20 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Target:** TORNTPHARM / Cash Flow  
**Status:** IMPLEMENTED / VALIDATION PENDING  
**Mode:** read-only; no score persistence

## Matched annual package

Three matched annual periods are now locked:

| FY end | CFO (₹ cr) | PAT (₹ cr) | CAPEX (₹ cr) | FCF (₹ cr) |
|---|---:|---:|---:|---:|
| 2024-03-31 | 3266.08 | 1656.38 | 432.78 | 2833.30 |
| 2025-03-31 | 2585.11 | 1911.25 | 611.87 | 1973.24 |
| 2026-03-31 | 3022.71 | 2163.37 | 677.39 | 2345.32 |

FY2024 and FY2025 CFO values are taken from Torrent Pharma's official FY2024-25 consolidated statement of cash flows. FY2026 CFO was already present in the locked TORNTPHARM official manifest.

FCF remains the existing deterministic identity:

```text
FCF = CFO - CAPEX
```

## Derived statistics

CFO / PAT series:

- FY2024 = 1.971818061072942
- FY2025 = 1.3525755395683454
- FY2026 = 1.3972228513846454

FCF / PAT series:

- FY2024 = 1.7105374370615438
- FY2025 = 1.032434270765206
- FY2026 = 1.0841048919047598

Locked statistics:

- median CFO / PAT = **1.3972228513846454**
- median FCF / PAT = **1.0841048919047598**
- positive FCF years = **3 / 3**
- latest CFO / PAT minus prior-two median = **-0.26497394893599835**

## Owner-approved Cash Flow curve result

Component scores:

- CFO / PAT = **100**
- FCF / PAT = **100**
- positive-FCF consistency subscore = **100**
- CFO trend subscore = **20**
- combined consistency / trend = **68**

Read-only Cash Flow candidate:

```text
100 × 0.45
+ 100 × 0.35
+ 68 × 0.20
= 93.6
```

> **Cash Flow = 93.6**

## Safety state

- score execution: OFF
- score persistence: OFF
- production mutation: NO
- evidence write: NO
- provider refresh: NO
- paid API call: NO
- recommendation: OFF
- sizing: OFF
- deployment: NO
- PR merge: NO

## Validation checkpoint

Focused validation is still required before this Cash Flow lock is classified as PASS.

H2 remains in progress.
