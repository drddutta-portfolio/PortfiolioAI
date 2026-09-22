# PortfolioAI — Gate G Final Closure Audit

**Date:** 20 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**PR:** #101 — OPEN / DRAFT / UNMERGED  
**Status:** ACTIVE CLOSURE AUDIT — GATE G NOT YET COMPLETE  
**Target:** TORNTPHARM / PHARMA_V1 / DOMESTIC_FORMULATIONS  
**Safety:** methodology/research only; no score persistence, recommendation activation, sizing activation, provider refresh, deployment, scheduler change, PR merge, or automatic trading.

---

## 1. Purpose

This audit answers one question:

> What still prevents TORNTPHARM from producing a deterministic, hand-verifiable PHARMA_V1 score for Gate H?

The higher-level product roadmap remains:

```text
Gate F — Evidence correct and canonical
   ↓
Gate G — Define how Pharma evidence becomes scores
   ↓
Gate H — Score TORNTPHARM deterministically
   ↓
Gate I — Recommendation logic
   ↓
Gate J — Pharma rollout
   ↓
Gate K — Other sector engines
   ↓
Gate L — Portfolio decision methodology
   ↓
Gate M — Automation
```

G9 architecture/portability work is complete, but that does not imply Gate G or TORNTPHARM end-to-end completion.

---

## 2. Existing Gate G architecture that remains valid

The following are already defined and must be preserved:

- ten PHARMA_V1 weighted dimensions totaling 100%;
- dimension score-ready coverage gate = 60%;
- overall score-ready coverage gate = 70%;
- every weighted dimension must be READY;
- common PHARMA_V1 core must be READY;
- Primary subprofile must be READY;
- Emerging Watch excluded from readiness and score denominators;
- no hidden denominator renormalization;
- no BANK_NBFC fallback;
- no Domestic threshold transfer to other Primary subprofiles;
- Material Overlay never creates a second stock score;
- governance/regulatory anti-double-counting remains mandatory;
- G7 read-only adapter already supports fixed-weight overall aggregation once every dimension has a valid numeric result.

TORNTPHARM role state remains:

- Primary = `DOMESTIC_FORMULATIONS`
- Material Overlay = `GLOBAL_GENERICS`
- Emerging Watch = `CDMO_CRAMS`

---

## 3. Dimension-by-dimension deterministic scoring readiness

| Dimension | Weight | Current methodology state | Gate G closure requirement |
|---|---:|---|---|
| Quality | 13% | Domestic Operating Margin curve exists as `VALIDATED_NOT_ACTIVE` / proposal only | approve/freeze numeric contract; implement deterministic evidence-to-score calculation and lineage; validate reference cases |
| Growth | 15% | Segment Growth curve exists as `VALIDATED_NOT_ACTIVE` / proposal only | approve/freeze numeric contract; implement deterministic evidence-to-score calculation and lineage; validate reference cases |
| Capital Efficiency | 10% | `SUBPROFILE_THRESHOLDS_REQUIRED` | define Domestic ROCE calibration/bands and deterministic aggregation |
| Cash Flow | 10% | `SUBPROFILE_THRESHOLDS_REQUIRED` | define Domestic cash-conversion calibration/bands and deterministic aggregation |
| Balance Sheet / Credit | 10% | `SUBPROFILE_THRESHOLDS_REQUIRED` | define Domestic leverage/credit calibration/bands and deterministic aggregation |
| Business Durability | 10% | `NO_APPROVED_DIMENSION_AGGREGATION` | define a versioned whole-dimension aggregation contract |
| Valuation | 12% | `PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE_V1_OWNER_APPROVED`; owner-approved but inactive | wire the three required component scores into the G7 adapter; prove missing-component fail-closed behavior; approve Gate H use |
| Momentum | 8% | `SUBPROFILE_THRESHOLDS_REQUIRED` | define Pharma benchmark, numeric bands, component weights and aggregation |
| Ownership / Governance | 6% | `SUBPROFILE_THRESHOLDS_REQUIRED` | define numeric calibration that remains distinct from G4 gate behavior and avoids double-counting |
| Risk | 6% | `SUBPROFILE_THRESHOLDS_REQUIRED` | define Pharma market/regulatory risk normalization/bands and reconcile with G4/G7-P2 |

---

## 4. Cross-cutting blockers

### 4.1 Primary numeric score wiring

The G7 TORNTPHARM explainable preview currently passes `primaryScore = null` for every dimension.

Therefore even dimensions with substantial methodology already defined cannot emit a numeric result until evidence-to-score calculation is implemented and linked to the G7 adapter.

This is an implementation/methodology-completion blocker, not permission to substitute zero.

### 4.2 Material Overlay numeric modifier

G7-P1 already defines a candidate formula:

```text
CAP_POINTS
× economic materiality
× evidence completeness
× confidence factor
× normalized overlay signal
```

Current candidate combined per-dimension cap = 10 points.

But the contract explicitly remains:

- proposal only;
- not empirically calibrated;
- owner validation required;
- `g71ConsumptionApproved = false`;
- score execution disabled.

For TORNTPHARM, the Global Generics Material Overlay is currently considered relevant to:

- Growth;
- Business Durability;
- Risk.

Gate G cannot close until the overlay modifier treatment for these dimensions is either:
1. explicitly approved and deterministically computable; or
2. explicitly classified as non-numeric for Gate H with a documented fail-closed consequence.

No silent neutral modifier is permitted.

### 4.3 Governance/regulatory runtime mapping

The G7 gap register still records:

`G7-GAP-TORN-GOVERNANCE-RUNTIME`

Reviewed regulatory evidence exists, but the complete runtime mapping into:

- severity;
- facility/product/geography scope;
- economic materiality;
- remediation state;
- subsequent outcome

is not canonically resolved.

Gate H requires a deterministic G4/G7-P2 runtime input.

### 4.4 Governance high-risk constraint

G7-P2 currently preserves:

- Critical / blocked-review ⇒ overall preview blocked;
- High Risk ⇒ interpretation-only;
- no hidden penalty;
- no approved numeric cap.

This is internally coherent, but the contract still states:

- proposal only;
- owner validation required;
- `g71ConsumptionApproved = false`.

Gate G must explicitly freeze this behavior for Gate H rather than leaving it provisional.

### 4.5 Readiness contract activation

The 60% dimension gate / 70% overall gate / every-dimension-ready rule is implemented as a proposal-only contract.

Gate G closure requires explicit methodology approval for deterministic Gate H use.

### 4.6 Overall aggregation

The G7 adapter already defines fixed-weight aggregation using the canonical ten PHARMA_V1 weights.

No new overall weighting formula is required.

Gate G closure must instead prove:

- all ten final dimension scores are present;
- each score is produced by an approved contract;
- no missing dimension is renormalized away;
- overall score is hand-reproducible from dimension scores × fixed weights.

---

## 5. Existing research-gap register blockers specific to TORNTPHARM

The current canonical G7 gap register contains these TORNTPHARM blockers:

1. `G7-GAP-TORN-GOVERNANCE-RUNTIME`
2. `G7-GAP-DOMESTIC-BUSINESS-DURABILITY`
3. `G7-GAP-DOMESTIC-ROCE`
4. `G7-GAP-DOMESTIC-CASH-CONVERSION`
5. `G7-GAP-DOMESTIC-BALANCE-SHEET`
6. `G7-GAP-DOMESTIC-OWNERSHIP-GOVERNANCE`
7. `G7-GAP-PHARMA-RISK-BANDS`
8. `G7-GAP-PHARMA-MOMENTUM`

All eight currently block the TORNTPHARM overall preview.

The controlled-expansion gaps for API/Bulk Drugs, CDMO/CRAMS and Biopharma/Biosimilars are **not Gate G blockers for TORNTPHARM** and belong later under Gate J.

---

## 6. Gate G closure workplan

The owner explicitly simplified the remaining Gate G closure sequence to avoid unnecessary micro-stages. The canonical closure plan is capped at four main checkpoints.

### G-FINAL-1 — Freeze already-mature numeric contracts

- Domestic Quality / Operating Margin
- Domestic Growth / Segment Growth
- Domestic Valuation combined score
- readiness thresholds
- G7-P2 governance behavior

Deliverable:
versioned Gate-H-eligible contracts, deterministic reference cases, no score persistence.

**Status: COMPLETE / PASS.**

### G-FINAL-2 — Complete all remaining Domestic numeric dimensions

- Capital Efficiency
- Cash Flow
- Balance Sheet / Credit
- Business Durability
- Ownership / Governance
- Risk
- Momentum

This single stage absorbs the former calibration / evaluator / adapter micro-checkpoints. It includes:

- parent-dimension reconciliation;
- TORNTPHARM evidence-sufficiency lock;
- numeric calibration candidates;
- deterministic evaluators and reference cases;
- read-only adapter compatibility;
- explicit owner methodology freeze.

Deliverable:
one approved deterministic numeric contract per remaining weighted dimension, with no BANK_NBFC fallback, no hidden reweighting, and no score persistence.

### G-FINAL-3 — Complete cross-cutting TORNTPHARM controls

This stage combines:

- Global Generics Material Overlay treatment;
- canonical governance/regulatory runtime mapping.

It includes:

- economic materiality input;
- evidence completeness;
- confidence factor;
- normalized overlay signal;
- eligible dimensions;
- combined per-dimension cap;
- contradiction behavior;
- deterministic G4/G7-P2 runtime state.

Deliverable:
approved deterministic cross-cutting controls, or an explicit fail-closed state where evidence remains insufficient.

### G-FINAL-4 — End-to-end read-only scoring integration and hand-verifiable dry run

Using no persistence and no recommendation logic:

1. calculate all ten Primary dimension scores;
2. apply approved Material Overlay modifiers only where eligible;
3. apply governance blocking semantics;
4. compute final ten dimension scores;
5. calculate the fixed-weight overall score;
6. expose complete methodology/evidence lineage;
7. independently hand-check the result.

Gate G closes only after this dry run is reproducible and every numeric dependency is versioned.

There are no G-FINAL-5 or G-FINAL-2C/2D/2E checkpoints in the simplified canonical plan.

---

## 7. Gate H entry condition

Gate H may begin only when all of the following are true:

- every weighted dimension has an approved deterministic numeric contract;
- TORNTPHARM evidence required by those contracts is sufficient or explicitly fail-closed;
- Material Overlay behavior is approved;
- governance/regulatory runtime input is deterministic;
- readiness contract is approved;
- fixed-weight overall aggregation is reproducible;
- a hand-verifiable dry-run fixture passes;
- score persistence remains OFF.

Then:

> **Gate G = COMPLETE / ENGINE CONTRACT COMPLETE**

and Gate H may calculate the first deterministic TORNTPHARM score.

---

## 8. Explicit non-goals

This audit does not authorize:

- Gate H score persistence;
- recommendation logic;
- position sizing;
- controlled expansion to additional Pharma Primary subprofiles;
- production data mutation;
- production migration;
- provider refresh;
- scheduler changes;
- deployment;
- PR merge;
- automatic trading.

