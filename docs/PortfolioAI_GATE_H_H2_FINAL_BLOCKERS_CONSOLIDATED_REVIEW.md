# PortfolioAI — Gate H H2 Final Blockers Consolidated Review

**Date:** 20 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Status:** H2 NOT YET CLOSED / VALUATION CLOSED / ONE BUSINESS-DURABILITY BLOCKER REMAINS

## Current H2 deterministic dimension state

Nine dimensions are now validated and score-ready at the H2 dimension level:

- Quality = 92
- Growth = 78.25
- Capital Efficiency = 79
- Cash Flow = 93.6
- Balance Sheet / Credit = 65
- Ownership / Governance = 70
- Momentum = 95
- Risk = 80
- Valuation = 30 under `PHARMA_DOMESTIC_VALUATION_MA_TRANSITION_V1_OWNER_APPROVED`

One dimension remains incomplete:

- Business Durability

No H3 final company score may be calculated until Business Durability is completed.

---

## 1. Business Durability — sole remaining H2 blocker

Current reviewed components:

- Brand / Therapy Leadership = REVIEW_REQUIRED / null
- Field Force Productivity = STRONG / 75
- R&D Productivity = STRONG / 75
- Pipeline / Corporate Execution = STRONG / 75

Ready components = 3 / 4.

### Exact licensed evidence requirement

The Gate F acquisition contract requires:

- external licensed Indian pharmaceutical market evidence;
- company/brand/therapy rank and/or market-share evidence;
- current/recent period;
- independently sourced rather than only issuer self-description.

The identified licensed source family is:

`AIOCD Pharmatrac / AIOCD-AWACS`

Issuer-reported FY26 orientation evidence includes:

- combined Torrent + JB Pharma ranked 5th in IPM;
- top-five positions across multiple therapy areas;
- Cardiac #1;
- CNS #3;
- GI #3;
- Pain Management #5;
- Derma #5;
- 75% chronic/sub-chronic revenue share.

These issuer statements remain orientation evidence only and do not satisfy the licensed cross-check by themselves.

### Exact H2 completion shape

Acceptable licensed evidence should provide, for Torrent Pharmaceuticals or the reviewed post-acquisition business scope:

1. company-level India market rank and/or share;
2. at least the major therapy-level rank/share relevant to Torrent's leadership claim;
3. period/date;
4. source/vendor identity;
5. enough context to distinguish Torrent standalone vs Torrent + JB Pharma combined scope.

Without this, Brand / Therapy Leadership remains `REVIEW_REQUIRED`.

No freeform numeric inference is permitted.

---

## 2. Valuation — CLOSED at H2 dimension level

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

### FCF-yield M&A comparability blocker

The base G6.17 contract remains:

- Self-history 40%
- Peer-relative 40%
- FCF corroboration 20%

The H2 FCF-yield prerequisite audit found no valid current local FCF-yield derivation path, and the available completed annual FCF is not comparable to the current post-transaction valuation denominator because of the current M&A scope transition.

The base G6.17 contract explicitly identifies M&A/capex FCF distortion as a mandatory methodology revisit trigger.

The owner therefore approved a versioned TORNTPHARM-specific transition contract:

`PHARMA_DOMESTIC_VALUATION_MA_TRANSITION_V1_OWNER_APPROVED`

Transition weights:

- Self-history = 50%
- Peer-relative = 50%
- FCF corroboration = 0%

This is an explicit methodology version, not hidden missing-component renormalization.

### H2 transition Valuation result

`(40 × 0.50) + (20 × 0.50) = 30`

> **Valuation = 30**

### Transition exit rule

When comparable post-merger completed annual FCF becomes available:

1. the transition contract expires;
2. the FCF-yield lane must be recomputed under the approved current-market-cap authority contract;
3. Valuation reverts to the base 40/40/20 G6.17 contract.

No permanent extension is automatic.

Canonical H2 transition document:

`docs/PortfolioAI_GATE_H_H2_MA_TRANSITION_VALUATION_V1.md`

---

## 3. H2 remaining work

Only one substantive evidence blocker remains:

### Brand / Therapy Leadership licensed cross-check

Required source family:

`AIOCD Pharmatrac / AIOCD-AWACS`

No licensed call has yet been made.

Required evidence remains:

- company rank/share;
- major therapy rank/share;
- current/recent period;
- standalone vs combined Torrent + JB scope clarity.

Once that component is resolved, Business Durability can be finalized and H2 can be formally closed.

---

## Safety boundary

- H3 final company score: **CLOSED**
- H3 score calculation: **NO**
- production DB mutation: **NO**
- production peer assignment persistence: **NO**
- licensed AIOCD call: **NO**
- recommendation: **NO**
- sizing: **NO**
- scheduler change: **NO**
- PR #101 merge: **NO**
- base G6.17 40/40/20 contract overwritten: **NO**
