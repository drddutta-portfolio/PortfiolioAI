# PortfolioAI — G-FINAL-4 End-to-End Read-Only Dry Run Review

**Date:** 20 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Status:** IMPLEMENTED / OWNER VALIDATION PENDING  
**Target:** PHARMA_V1 engine + TORNTPHARM current-state readiness

## Purpose

G-FINAL-4 is the final Gate G checkpoint.

It must prove two things separately:

1. the approved PHARMA_V1 scoring engine is deterministic, reproducible, fixed-weight and hand-verifiable;
2. the current TORNTPHARM evidence state does not emit a score when required inputs remain incomplete.

No production score execution or persistence is authorized.

---

## Synthetic full-engine dry run

The synthetic fixture passes all ten weighted dimensions through the real G7 read-only scoring adapter using approved methodology contract versions.

Primary scores:

| Dimension | Primary | Overlay | Final | Weight | Contribution |
|---|---:|---:|---:|---:|---:|
| Quality | 80 | 0 | 80 | 13% | 10.400 |
| Growth | 75 | +1.00 | 76 | 15% | 11.400 |
| Capital Efficiency | 70 | 0 | 70 | 10% | 7.000 |
| Cash Flow | 65 | 0 | 65 | 10% | 6.500 |
| Balance Sheet / Credit | 85 | 0 | 85 | 10% | 8.500 |
| Business Durability | 72 | -0.50 | 71.5 | 10% | 7.150 |
| Valuation | 60 | 0 | 60 | 12% | 7.200 |
| Momentum | 78 | 0 | 78 | 8% | 6.240 |
| Ownership / Governance | 82 | 0 | 82 | 6% | 4.920 |
| Risk | 68 | +0.75 | 68.75 | 6% | 4.125 |

Hand total:

```text
10.400
+ 11.400
+ 7.000
+ 6.500
+ 8.500
+ 7.150
+ 7.200
+ 6.240
+ 4.920
+ 4.125
= 73.435
```

Expected adapter result:

```text
overallScore = 73.435
```

No hidden reweighting is used.

No second overlay stock score is created.

---

## TORNTPHARM current-state dry run

The current company evidence is intentionally evaluated separately from the synthetic engine proof.

Current state:

- methodology contracts: complete and owner-approved;
- G-FINAL-2 evidence sufficiency lock: not all seven remaining dimensions score-ready;
- governance runtime: `REVIEW_REQUIRED`;
- current overall score: `null`;
- current overall state: `NOT_CURRENTLY_COMPUTABLE`.

Reason codes:

- current TORNTPHARM evidence is not sufficient for all ten numeric dimensions;
- governance runtime remains review-required;
- no missing dimension is renormalized away;
- no missing evidence becomes neutral;
- no score persistence occurs.

This is the intended fail-closed behavior.

---

## Gate G versus Gate H boundary

The G-FINAL-4 design distinguishes:

### Gate G — engine contract completeness

Gate G asks whether the methodology is deterministic and reproducible.

The synthetic end-to-end dry run demonstrates:

- all ten weighted dimensions can flow through the approved adapter;
- approved overlay modifiers are applied within dimensions;
- fixed weights sum to the hand-verifiable overall result;
- governance semantics are represented;
- no hidden reweighting occurs;
- score execution/persistence remain OFF.

Therefore Gate G may close if local validation passes.

### Gate H — first actual deterministic TORNTPHARM score

Gate H still requires completion of the company-specific evidence inputs that remain fail-closed.

Current Gate H entry state:

```text
FAIL_CLOSED_EVIDENCE_COMPLETION_REQUIRED
```

This means Gate H can begin as the company-score execution stage, but it cannot emit the first TORNTPHARM numeric score until the required evidence gaps are resolved.

---

## Safety state

- production mutation: NO
- score execution: OFF
- score persistence: OFF
- recommendation: OFF
- position sizing: OFF
- provider refresh: NO
- scheduler change: NO
- deployment: NO
- PR merge: NO
- automatic trading: NO
