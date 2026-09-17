# R4N — PHARMA_V1 Secondary-Exposure Materiality Proposal

**Status:** DRAFT FOR OWNER REVIEW — NOT AN APPROVED METHODOLOGY  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Scope:** Gate E review methodology only. This document does not authorize production writes, assignment promotion, scoring, recommendations, provider calls, or scheduler changes.

## Why this proposal exists

R4N already defines secondary Pharma business-model exposures as:

- `IMMATERIAL`
- `EMERGING`
- `MATERIAL`
- `DOMINANT`
- `UNKNOWN`

The schema and TypeScript contract intentionally do not assign numeric thresholds to those states. Gate E now requires an explicit reviewed materiality rule before a provisional assignment can be considered ready for human review.

The rule must remain separate from the primary-subprofile decision. A secondary exposure can activate evidence requirements or risk overlays, but it cannot create or blend a second score.

## Proposed V1 materiality rule

### Measurement basis

Use **business-model-attributable revenue share** as the default quantitative basis:

`exposure_revenue / comparable_company_revenue`

Requirements:

1. Numerator and denominator must use the same reporting scope and period.
2. Prefer audited annual revenue; use management-disclosed segment/business revenue only when its definition is clear.
3. Geography alone is not a business model. For example, non-India revenue must not automatically be classified as `GLOBAL_GENERICS`.
4. Contract manufacturing revenue must not automatically be classified as `CDMO_CRAMS` unless the disclosed activity matches the approved CDMO/CRAMS business-model definition.
5. Profit, assets, capacity, customer concentration, regulatory exposure and management description may be retained as corroborating evidence, but must not silently substitute for revenue share without an explicit reason code.
6. If the business-model numerator cannot be established from retained evidence, materiality remains `UNKNOWN`.

### Proposed states

| State | Proposed V1 rule | Review consequence |
|---|---|---|
| `UNKNOWN` | Evidence is insufficient, incomparable, ambiguous, or does not isolate the business-model exposure. | Fail closed; Gate E review package remains provisional. |
| `IMMATERIAL` | Business-model-attributable revenue is **<5%** of comparable company revenue **and** there is no reviewed qualitative trigger showing disproportionate strategic/regulatory importance. | Does not activate business-model-specific conditional requirements by default. |
| `EMERGING` | Revenue share is **>=5% and <10%**, or below 10% but management explicitly identifies the business as a strategic/growing operating model with retained evidence. | Exposure remains visible; activate only requirements explicitly marked for emerging exposure. |
| `MATERIAL` | Revenue share is **>=10% and <50%**, or a reviewed qualitative override establishes that the exposure is economically/regulatorily material despite a lower disclosed revenue share. | Activate the applicable secondary-exposure evidence requirements/overlays. |
| `DOMINANT` | Revenue share is **>=50%**, or retained evidence establishes that this is the principal business model. | Treat as a primary-subprofile conflict/reclassification review; do not simply retain it as an ordinary secondary exposure. |

## Basis for the 10% anchor

The 10% `MATERIAL` anchor is deliberately aligned with the quantitative reporting threshold in **Ind AS 108 Operating Segments**, where a segment is separately reportable when revenue, profit/loss, or assets meet the 10% test. PortfolioAI is not treating Ind AS 108 as a business-model-classification rule; it is using the 10% level only as an externally grounded materiality anchor for the internal research contract.

The proposed 5% `EMERGING` floor is an internal conservative review threshold and therefore requires explicit owner approval before implementation.

## Qualitative override guardrails

A sub-10% exposure may be elevated to `MATERIAL` only when retained evidence shows a distinct business-model risk or economics that would be misleading to omit. Examples include:

- material regulatory/site dependency;
- major customer or contract concentration tied to that model;
- a separately managed strategic business with disclosed growth/capex commitment;
- a legally or operationally distinct platform whose downside could materially affect the issuer.

Every qualitative override must retain:

- source reference;
- reason code;
- reviewer provenance;
- confidence `MEDIUM` or `HIGH`;
- effective date.

No qualitative override may be inferred from company name, geography, sector label, or a generic narrative statement.

## TORNTPHARM Gate E application

Current official FY2025-26 standalone disclosure shows:

- total revenue from operations: about `₹10,712 crore`;
- India revenue: about `₹7,723.6 crore` (~72%);
- outside-India revenue: about `₹2,988.4 crore` (~28%);
- contract manufacturing revenue: about `₹626.65 crore` (~5.9%).

These figures support the conclusion that India/domestic formulations are economically dominant in the standalone revenue mix, but they **do not by themselves resolve the secondary business-model classifications**:

- outside-India revenue is not automatically `GLOBAL_GENERICS`;
- contract manufacturing revenue is not automatically `CDMO_CRAMS`.

Therefore the current Gate E position remains:

- primary candidate: `DOMESTIC_FORMULATIONS` — evidence-supported;
- secondary exposure materiality: `UNKNOWN` until business-model-specific evidence is mapped;
- assignment lifecycle: `PROVISIONAL`;
- review package: fail closed until secondary-exposure materiality review is complete.

## Implementation gate

This proposal must not be encoded into the active contract until the owner explicitly approves the V1 thresholds and guardrails.

If approved, implementation should:

1. add a pure deterministic materiality resolver with explicit inputs and reason codes;
2. retain `UNKNOWN` whenever evidence cannot support a comparable revenue share;
3. require a reasoned qualitative override rather than an implicit override;
4. add boundary tests at 5%, 10% and 50%;
5. ensure `DOMINANT` secondary exposure triggers a primary-subprofile conflict/reclassification blocker;
6. keep all secondary exposures non-scoring until a mixed-model scoring methodology is separately approved.
