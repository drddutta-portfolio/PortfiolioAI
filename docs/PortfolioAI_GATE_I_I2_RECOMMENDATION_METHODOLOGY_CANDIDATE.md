# PortfolioAI — Gate I / I2 PHARMA_V1 Owner-Approved Recommendation Methodology Lock

**Date:** 21 September 2026
**Repository:** `drddutta-portfolio/PortfiolioAI`
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 — OPEN / DRAFT / UNMERGED
**Stage:** I2 — PHARMA_V1 Recommendation Methodology Lock
**Status:** COMPLETE / PASS — OWNER APPROVED / LOCKED

## Purpose

I2 defines the first owner-approved PHARMA_V1-specific deterministic recommendation policy.

It does not calculate or publish a recommendation for TORNTPHARM or AUROPHARMA.

The policy remains:

> **OWNER_APPROVED_LOCKED / READ-ONLY / NON-PERSISTING**

## Methodology basis

The candidate is deliberately constructed without reading a reference-company overall score.

The approved PHARMA_V1 qualitative normalization anchors are:

- Strong = 75;
- Neutral = 50;
- Weak = 25.

The recommendation role thresholds are locked as:

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

The locked policy contains no extra numeric global hard blocker.

`AVOID` means:

> a fully evaluable company has an overall score below the Watch / Neutral threshold of 50.

Structural incompleteness, missing required floor data, unresolved governance, or non-computable score result in `INSUFFICIENT`, not Avoid.

## Cautions

Locked caution rules:

| Dimension/context | Trigger | Role effect |
|---|---:|---|
| Valuation | score < 50 | none; visible caution |
| Momentum | score < 50 | none; visible caution |
| Governance High Risk | INTERPRETATION_ONLY_HIGH_RISK | none; visible caution |

Cautions never create a second numeric penalty.

## Governance behavior

The locked I2 policy preserves the owner-approved G7 governance contract:

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

## Consolidated validation and owner approval

The owner ran:

`git pull && bash scripts/i2-validate-pharma-recommendation-methodology.sh`

The complete candidate validation passed:

- focused methodology and regression tests: **5 / 5 test files passed**;
- focused tests: **35 / 35 passed**;
- strict TypeScript: PASS;
- presentation data-boundary architecture guard: PASS;
- focused I2 ESLint: PASS;
- existing architecture lint: PASS;
- production build: PASS;
- I2 diff whitespace check: PASS.

The production build emitted only the existing non-failing Vite large-chunk warning.

The owner then explicitly approved:

> **APPROVED I2 PHARMA_V1 RECOMMENDATION POLICY V1 — CORE 80 / SATELLITE 65 / WATCH 50 — FLOORS AND CAUTIONS AS PROPOSED**

The machine-readable policy identity is therefore locked as:

- version: `PHARMA_V1_RECOMMENDATION_POLICY_V1_OWNER_APPROVED`;
- state: `OWNER_APPROVED_LOCKED`.

The post-approval source transition changes policy identity/state and lock coverage only. It does not change any approved threshold, floor, caution, governance, overlay, blocker, fail-closed, persistence, sizing, or action behavior.

## I2 closure

I2 is formally closed:

> **I2 = COMPLETE / PASS**

Locked methodology:

1. Core candidate: overall score >= 80;
2. Satellite candidate: overall score >= 65;
3. Watch: overall score >= 50;
4. Avoid: fully evaluable overall score < 50;
5. missing/unresolved/non-computable authority state -> Insufficient;
6. Core floors: Quality 75, Business Durability 75, and the other five role-blocking dimensions at least 50;
7. Satellite floors: all seven role-blocking dimensions at least 50;
8. Capital Efficiency: no separate recommendation-layer gate;
9. Valuation and Momentum below 50: caution only;
10. no additional numeric global hard blocker;
11. governance Review Required / Blocked Review: fail closed to Insufficient;
12. Material Overlay / Emerging Watch: context only, with no independent score, role, override, blend, or hidden numeric adjustment.

## Safety state

I2 closure does not:

- calculate the real TORNTPHARM recommendation;
- calculate the real AUROPHARMA recommendation;
- persist a score or recommendation;
- create `stock_recommendation_runs`;
- materialize or activate a production recommendation-policy row;
- mutate Supabase production data;
- call external providers;
- invoke AI interpretation;
- invoke weight guidance/action bias;
- invoke position sizing;
- deploy;
- merge PR #101.

## Current state

```text
Gate H = COMPLETE / PASS
I1 = COMPLETE / PASS
I2 = COMPLETE / PASS
I3 = NOT STARTED
I4 = NOT STARTED
```

**STOP:** Do not start I3 without a separate owner instruction.


## Post-lock validation of the exact owner-approved head

After the owner-approved lock commit `ec6e3c18f35ab5a5065e9ff309d8326791550bb9`, the owner pulled the branch and reran:

`git pull && bash scripts/i2-validate-pharma-recommendation-methodology.sh`

The exact locked-head validation completed successfully through all seven stages:

- focused I2 + I1 + Gate H regressions: PASS;
- strict TypeScript: PASS;
- presentation data-boundary architecture guard: PASS;
- focused I2 lint: PASS;
- existing architecture lint: PASS;
- production build: PASS;
- I2 diff whitespace check: PASS.

Terminal closure:

```text
I2 LOCK VALIDATION PASS
Policy state: OWNER APPROVED / LOCKED
Recommendation persistence: OFF
Score persistence: OFF
I2: COMPLETE / PASS
I3: NOT STARTED
```

The Vite large-chunk message remained a warning only.

This post-lock run validates the exact owner-approved source state and does not change the locked methodology or authorize I3.
