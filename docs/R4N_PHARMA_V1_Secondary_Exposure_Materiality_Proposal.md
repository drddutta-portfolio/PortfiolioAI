# R4N — PHARMA_V1 Secondary-Exposure Materiality V1

**Status:** OWNER APPROVED — IMPLEMENTED LOCALLY ON R4N  
**Owner approval:** 17 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Scope:** Gate E review methodology only. This approval does not authorize production writes, assignment promotion, scoring, recommendations, provider calls, or scheduler changes.

## Why this rule exists

R4N defines secondary Pharma business-model exposures as:

- `IMMATERIAL`
- `EMERGING`
- `MATERIAL`
- `DOMINANT`
- `UNKNOWN`

The schema and TypeScript contract intentionally did not assign numeric thresholds to those states until Gate E review. The owner has now approved the V1 materiality thresholds and guardrails below.

The rule remains separate from the primary-subprofile decision. A secondary exposure can activate evidence requirements or risk overlays, but it cannot create or blend a second score.

## Approved V1 materiality rule

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

### Approved states

| State | V1 rule | Review consequence |
|---|---|---|
| `UNKNOWN` | Evidence is insufficient, incomparable, ambiguous, or does not isolate the business-model exposure. | Fail closed; Gate E review package remains provisional. |
| `IMMATERIAL` | Business-model-attributable revenue is **<5%** of comparable company revenue **and** there is no reviewed qualitative trigger showing disproportionate strategic/regulatory importance. | Does not activate business-model-specific conditional requirements by default. |
| `EMERGING` | Revenue share is **>=5% and <10%**, or below 10% but management explicitly identifies the business as a strategic/growing operating model with retained evidence. | Exposure remains visible; activate only requirements explicitly marked for emerging exposure. |
| `MATERIAL` | Revenue share is **>=10% and <50%**, or a reviewed qualitative override establishes that the exposure is economically/regulatorily material despite a lower disclosed revenue share. | Activate the applicable secondary-exposure evidence requirements/overlays. |
| `DOMINANT` | Revenue share is **>=50%**, or retained evidence establishes that this is the principal business model. | Treat as a primary-subprofile conflict/reclassification review; do not simply retain it as an ordinary secondary exposure. |

## Basis for the 10% anchor

The 10% `MATERIAL` anchor is aligned with the quantitative reporting threshold in **Ind AS 108 Operating Segments**, where a segment is separately reportable when revenue, profit/loss, or assets meet the 10% test. PortfolioAI is not treating Ind AS 108 as a business-model-classification rule; it uses the 10% level only as an externally grounded materiality anchor for the internal research contract.

The 5% `EMERGING` floor is an owner-approved internal conservative review threshold.

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

## Implementation status

The approved V1 rule is encoded in `src/features/research/pharmaSecondaryExposureMateriality.ts` with focused tests in `pharmaSecondaryExposureMateriality.test.ts`.

The resolver:

1. uses the approved 5%, 10% and 50% quantitative boundaries;
2. retains `UNKNOWN` whenever comparable business-model-attributable revenue cannot be established;
3. requires provenance-complete qualitative overrides with `MEDIUM` or `HIGH` confidence and an effective date;
4. refuses an override that attempts to downgrade a stronger quantitative state;
5. flags `DOMINANT` exposure for primary-subprofile reclassification review;
6. remains pure, non-scoring and free of provider/database I/O.

The Gate E review-package contract separately blocks `READY_FOR_REVIEW` when any secondary exposure remains `UNKNOWN` or is `DOMINANT` and therefore requires primary-subprofile reclassification review.

No production persistence, assignment promotion, evidence ingestion, scoring or recommendation is authorized by this implementation.
