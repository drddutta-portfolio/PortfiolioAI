# PortfolioAI — Gate H H2 Final Blockers Consolidated Review

**Date:** 20 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Status:** H2 COMPLETE / PASS

## Current H2 deterministic dimension state

All ten TORNTPHARM H2 dimension inputs are resolved and validation-passed:

- Quality = 92
- Growth = 78.25
- Capital Efficiency = 79
- Cash Flow = 93.6
- Balance Sheet / Credit = 65
- Business Durability = 75
- Valuation = 30 under `PHARMA_DOMESTIC_VALUATION_MA_TRANSITION_V1_OWNER_APPROVED`
- Ownership / Governance = 70
- Momentum = 95
- Risk = 80

This document deliberately does **not** aggregate those ten dimension values into an H3 company score.

H3 remains closed until started separately.

---

## 1. Business Durability — RESOLVED / PASS

Owner-approved component state:

- Brand / Therapy Leadership = STRONG / 75
- Field Force Productivity = STRONG / 75
- R&D Productivity = STRONG / 75
- Pipeline / Corporate Execution = STRONG / 75

Ready components = 4 / 4.

Approved G-FINAL-2 weights:

- Brand / Therapy Leadership = 35%
- Field Force Productivity = 25%
- R&D Productivity = 20%
- Pipeline / Corporate Execution = 20%

Calculation:

`75 × 0.35 + 75 × 0.25 + 75 × 0.20 + 75 × 0.20 = 75`

> **Business Durability = 75**

### Brand / Therapy Leadership cross-check

The owner approved:

`APPROVE H2 BRAND / THERAPY LEADERSHIP — STRONG / 75 — USING INDEPENDENT AIOCD-DERIVED CROSS-CHECK`

Evidence lineage:

1. India Ratings & Research independently reports AIOCD-derived Torrent/JB market-share, IPM-rank and therapy-position evidence:
   - `https://www.indiaratings.co.in/pressrelease/80734`
2. Torrent FY2025-26 reporting explicitly cites AIOCD Pharmatrac Dataset March 2026 for current combined Torrent + JB IPM and therapy rankings:
   - `https://www.torrentpharma.com/pdf/investors/AR-2025-26.pdf`

H2 acceptance mode:

`INDEPENDENT_AIOCD_DERIVED_REPORT_PLUS_CURRENT_ISSUER_AIOCD_PHARMATRAC_TABLE`

No direct licensed AIOCD provider call was made.

Canonical lock:

`docs/PortfolioAI_GATE_H_H2_BUSINESS_DURABILITY_REVIEW.md`

---

## 2. Valuation — RESOLVED / PASS

### Fresh self-history evidence

Local-only Trendlyne refresh completed successfully:

- metric: `PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT`
- current value: **-15.90%**
- evidence status: AVAILABLE / FRESH
- provider calls: 1
- production touched: NO

Approved Domestic self-history curve:

- -20% to < -5% -> score 40

Therefore:

`Self-History Score = 40`

### Fresh reviewed peer evidence

Owner-approved peer set:

- MANKIND
- ERIS
- EMCURE

Fresh local evidence:

| Security | PE_TTM | EV_EBITDA |
|---|---:|---:|
| TORNTPHARM | 85.02 | 37.11 |
| MANKIND | 46.51 | 22.33 |
| ERIS | 28.21 | 17.92 |
| EMCURE | 35.82 | 16.70 |

Peer medians:

- PE median = 35.82
- EV/EBITDA median = 17.92

Approved G6.12 relative formula:

`(Peer Median / Target - 1) × 100`

Results:

- PE relative premium/discount ≈ -57.87% -> normalized score 20
- EV/EBITDA relative premium/discount ≈ -51.71% -> normalized score 20

Approved G6.15 peer combination:

`(20 × 0.50) + (20 × 0.50) = 20`

Therefore:

`Peer-Relative Score = 20`

### M&A transition FCF treatment

Base G6.17 remains unchanged:

- Self-history 40%
- Peer-relative 40%
- FCF corroboration 20%

Because the completed annual FCF and current post-transaction valuation denominator are not comparable in scope, the owner approved:

`PHARMA_DOMESTIC_VALUATION_MA_TRANSITION_V1_OWNER_APPROVED`

Transition weights:

- Self-history = 50%
- Peer-relative = 50%
- FCF corroboration = 0%

Calculation:

`(40 × 0.50) + (20 × 0.50) = 30`

> **Valuation = 30**

The transition expires when comparable post-merger completed annual FCF becomes available; Valuation then reverts to the base 40/40/20 contract.

Canonical lock:

`docs/PortfolioAI_GATE_H_H2_MA_TRANSITION_VALUATION_V1.md`

---

## 3. H2 final validation

Final H2 validation passed:

- focused Business Durability contract test: PASS
- TypeScript typecheck: PASS
- owner closure declaration: `H2 = COMPLETE / PASS`

There are no unresolved H2 evidence or methodology blockers.

> **H2 = COMPLETE / PASS**

The next stage is H3, but H3 must be started separately.

No H3 final company score was calculated as part of H2 closure.

---

## Safety boundary

- H3 final company score: **NOT STARTED**
- H3 score calculation: **NO**
- official score persistence: **NO**
- production DB mutation: **NO**
- direct licensed AIOCD call: **NO**
- recommendation: **NO**
- sizing: **NO**
- scheduler change: **NO**
- PR #101 merge: **NO**
- base G6.17 40/40/20 contract overwritten: **NO**
