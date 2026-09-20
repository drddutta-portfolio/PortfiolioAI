# PortfolioAI — Gate I / I2 PHARMA_V1 Recommendation Methodology Candidate

**Date:** 21 September 2026
**Repository:** `drddutta-portfolio/PortfiolioAI`
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 — OPEN / DRAFT / UNMERGED
**Stage:** I2 — PHARMA_V1 Recommendation Methodology Lock
**Status:** CANDIDATE IMPLEMENTED / VALIDATION PENDING / OWNER METHODOLOGY APPROVAL REQUIRED

## Purpose

I2 defines the first PHARMA_V1-specific deterministic recommendation policy candidate.

It does not calculate or publish a recommendation for TORNTPHARM or AUROPHARMA.

The policy remains:

> **OWNER_REVIEW_PENDING / READ-ONLY / NON-PERSISTING**

## Methodology basis

The candidate is deliberately constructed without reading a reference-company overall score.

The approved PHARMA_V1 qualitative normalization anchors are:

- Strong = 75;
- Neutral = 50;
- Weak = 25.

The recommendation role thresholds are proposed as:

| Role | Overall threshold | Rationale |
|---|---:|---|
| Core candidate | >= 80 | Reserve Core for aggregate strength above the 75 Strong component anchor |
| Satellite candidate | >= 65 | Midpoint between Watch/Neutral 50 and Core 80 |
| Watch | >= 50 | Exact Neutral anchor |
| Avoid | < 50 | Fully evaluable overall state below Neutral |

This produces a monotonic role ladder and does not use TORNTPHARM's known 75.1575 score as a threshold input.

## Dimension treatment

All ten PHARMA_V1 dimensions receive an explicit recommendation-layer treatment.

| Dimension | I2 treatment | Core floor | Satellite floor |
|---|---|---:|---:|
| Quality | Role-blocking floor | 75 | 50 |
| Growth | Role-blocking floor | 50 | 50 |
| Capital Efficiency | No separate role gate | — | — |
| Cash Flow | Role-blocking floor | 50 | 50 |
| Balance Sheet / Credit | Role-blocking floor | 50 | 50 |
| Business Durability | Role-blocking floor | 75 | 50 |
| Valuation | Caution only | — | — |
| Momentum | Caution only | — | — |
| Ownership / Governance | Role-blocking floor | 50 | 50 |
| Risk | Role-blocking floor | 50 | 50 |

Rationale:

- Core requires Strong Quality and Strong Business Durability because those are non-substitutable franchise-strength dimensions in a long-duration Pharma role.
- Other role-blocking business/safety dimensions must remain at least Neutral for Core and Satellite.
- Capital Efficiency remains fully represented in the overall score but gets no second recommendation-layer gate because business-model/subprofile capital intensity differs materially across Pharma.
- Valuation and Momentum are already weighted numerically and therefore remain visible cautions below the Neutral anchor rather than being double-counted as floors.

## Missing floor versus failed floor

I2 explicitly separates the two states.

### Missing mandatory floor data

```text
required role floor cannot be evaluated
    -> INSUFFICIENT
```

Missing data is not a negative signal.

### Evaluated floor fails

```text
higher role becomes ineligible
    -> continue down approved role ladder
```

Examples:

- Core threshold passed + Core floor failed -> test Satellite;
- Satellite threshold passed + Satellite floor failed -> test Watch.

A failed role floor does not automatically create Avoid.

## Avoid semantics

The candidate contains no extra numeric global hard blocker.

`AVOID` means:

> a fully evaluable company has an overall score below the Watch / Neutral threshold of 50.

Structural incompleteness, missing required floor data, unresolved governance, or non-computable score result in `INSUFFICIENT`, not Avoid.

## Cautions

Candidate caution rules:

| Dimension/context | Trigger | Role effect |
|---|---:|---|
| Valuation | score < 50 | none; visible caution |
| Momentum | score < 50 | none; visible caution |
| Governance High Risk | INTERPRETATION_ONLY_HIGH_RISK | none; visible caution |

Cautions never create a second numeric penalty.

## Governance behavior

The I2 candidate preserves the owner-approved G7 governance contract:

- `CLEAR` -> no additional recommendation constraint;
- `INTERPRETATION_ONLY_HIGH_RISK` -> caution only, no cap or penalty;
- `REVIEW_REQUIRED` -> `INSUFFICIENT`;
- `BLOCKED_REVIEW` -> `INSUFFICIENT`.

This avoids regulatory double counting.

## Overlay behavior

Material Overlay and Emerging Watch are context only.

They cannot:

- create an independent recommendation;
- override the Primary-derived role;
- blend a second role;
- create a second score;
- add a hidden penalty/bonus.

AUROPHARMA's `GLOBAL_GENERICS` Primary status is not an overlay case and remains upstream-score blocked until that Primary methodology becomes computable.

## Fail-closed behavior

The policy returns `INSUFFICIENT` for:

- authoritative score state = `SCORE_NOT_COMPUTABLE`;
- overall score absent;
- mandatory role-floor data absent;
- governance = `REVIEW_REQUIRED`;
- governance = `BLOCKED_REVIEW`.

It does not reconstruct a score.

## Synthetic methodology coverage

The I2 tests cover:

- exact threshold boundaries;
- Core-floor failure falling to Satellite;
- Satellite-floor failure falling to Watch;
- missing floor data -> Insufficient;
- valuation/momentum caution-only behavior;
- governance High Risk interpretation-only behavior;
- governance Review Required / Blocked Review fail-closed behavior;
- overlay independence;
- non-computable score fail-closed behavior;
- no downstream persistence/sizing/action enablement;
- no TORNTPHARM / AUROPHARMA / BANK_NBFC / HDFCBANK identity embedded in the policy contract.

## First local validation attempt

The first owner-run I2 validation successfully completed:

- focused methodology and regression tests: **5 / 5 test files passed**;
- focused tests: **35 / 35 passed**;
- strict TypeScript: PASS;
- presentation data-boundary architecture guard: PASS.

The run then stopped at focused ESLint on two `@typescript-eslint/no-unnecessary-type-assertion` findings inside `evaluateFloors`.

Both findings were redundant `minimum as number` casts. `Object.entries(floors)` already inferred `minimum` as numeric in this context.

Correction:

- removed the two unnecessary assertions;
- no threshold, floor, blocker, caution, governance, overlay or fail-closed behavior changed;
- no test expectation changed;
- no recommendation was calculated.

I2 remains **CANDIDATE / OWNER REVIEW PENDING** until the complete validation command passes and the owner approves the methodology.

## Owner approval required

I2 is **not locked** until the owner explicitly approves the candidate methodology.

The approval decision should cover:

1. Core >= 80;
2. Satellite >= 65;
3. Watch >= 50;
4. Avoid < 50;
5. Core floors;
6. Satellite floors;
7. Valuation/Momentum caution-only treatment;
8. no additional numeric global hard blocker;
9. governance fail-closed/caution behavior;
10. overlay context-only behavior.

Suggested approval phrase:

`APPROVE I2 PHARMA_V1 RECOMMENDATION POLICY V1 — CORE 80 / SATELLITE 65 / WATCH 50 — FLOORS AND CAUTIONS AS PROPOSED`

## Current state

```text
Gate H = COMPLETE / PASS
I1 = COMPLETE / PASS
I2 = CANDIDATE IMPLEMENTED / VALIDATION PENDING / OWNER APPROVAL PENDING
I3 = NOT STARTED
I4 = NOT STARTED
```
