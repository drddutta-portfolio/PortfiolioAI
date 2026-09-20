# PortfolioAI — G-FINAL-3 Cross-Cutting Review

**Date:** 20 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Status:** IMPLEMENTED / OWNER REVIEW PENDING  
**Target:** TORNTPHARM / PHARMA_V1

## Purpose

G-FINAL-3 completes the two remaining cross-cutting methodology controls before the final end-to-end dry run:

1. Global Generics Material Overlay
2. Governance / Regulatory runtime mapping

No score execution, persistence, recommendation, sizing, production mutation, provider refresh, deployment, scheduler change, PR merge, or trading is authorized.

---

## 1. Global Generics Material Overlay

The existing G7-P1 formula is carried forward unchanged:

```text
modifier points =
10
× economic materiality fraction
× evidence completeness
× confidence factor
× normalized overlay signal
```

Confidence factors:

- LOW = 0.50
- MEDIUM = 0.75
- HIGH = 1.00

Rules:

- combined per-dimension cap = ±10 points;
- direct economic-share scaling;
- READY overlay only;
- PARTIAL overlay does not receive a numeric modifier;
- unresolved contradiction blocks modifier;
- missing evidence may not become neutral;
- independent overlay cap stacking is prohibited;
- Emerging Watch remains numerically excluded;
- final dimension remains bounded to 0–100;
- no second stock score is created.

For TORNTPHARM, the Global Generics Material Overlay remains relevant only to dimensions touched by the overlay contract, notably Growth, Business Durability and Risk.

This formula remains non-active until owner approval.

---

## 2. Governance / Regulatory runtime behavior

Existing owner-approved G7-P2 behavior remains authoritative:

- Critical / blocked-review => overall preview blocked
- High Risk => interpretation-only
- no numeric high-risk cap
- no extra hidden penalty
- no hidden double counting

The underlying G4 runtime contract remains fail-closed:

- regulatory scope must be established;
- materiality cannot be inferred;
- closeout does not erase the historical event;
- closeout without subsequent outcome context remains review-required.

---

## 3. TORNTPHARM current runtime mapping

Reviewed evidence currently establishes:

- FDA warning-letter history at the Indrad finished-dosage site;
- later FDA closeout of that warning-letter chain;
- historical event retained.

Current evidence does **not** establish:

- company-wide current regulatory scope across all material US-facing sites;
- complete economic materiality of the reviewed chain;
- subsequent outcome context sufficient to infer company-wide clearance.

Therefore the TORNTPHARM runtime candidate is intentionally:

```text
event class: REGULATORY
severity: MODERATE
scope: Indrad site established
regulatory materiality: UNKNOWN
remediation: CLOSED_OUT
subsequent outcome established: false

result: REVIEW_REQUIRED
```

This is not a negative score and not a neutral score. It is an explicit fail-closed runtime state.

---

## 4. G-FINAL-3 closure boundary

G-FINAL-3 methodology can be approved even while TORNTPHARM remains runtime-review-required.

Approval means:

- overlay formula/cap is accepted;
- governance runtime interpretation rules are accepted;
- current TORNTPHARM mapping is accepted as the correct fail-closed state from the evidence presently locked.

It does **not** mean that TORNTPHARM is yet ready for Gate H.

G-FINAL-4 must still perform the full end-to-end read-only dry run and will show whether the remaining evidence gaps permit an overall score.

---

## Safety state

- score execution: OFF
- score persistence: OFF
- recommendation: OFF
- position sizing: OFF
- production mutation: NO
- provider refresh: NO
- scheduler change: NO
- deployment: NO
- PR merge: NO
- automatic trading: NO
