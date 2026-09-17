# R4N — TORNTPHARM Gate E Secondary-Exposure Evidence Review

**Status:** LOCAL / READ-ONLY REVIEW ARTIFACT  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Scope:** Gate E evidence review only. This document does not authorize production writes, assignment promotion, evidence ingestion, scoring, recommendations, provider calls, or scheduler changes.

## Objective

Apply the approved Gate E V1 secondary-exposure materiality rule to TORNTPHARM using retained official issuer evidence while preserving the rule that geography alone is not a business model.

## Primary subprofile

Primary candidate remains:

`PHARMA_V1 -> DOMESTIC_FORMULATIONS`

Official issuer evidence supports this as the primary operating model. The India business is the company's largest market and the foundation of its branded-generics business; FY2025-26 standalone India revenue was ₹7,723.60 crore out of ₹10,712.00 crore total revenue from operations, approximately 72.1%.

**Primary-model review state:** `SUPPORTED`  
**Proposed confidence:** `HIGH`  
**Effective-from candidate:** `2026-03-31`

## Secondary exposure review

### 1. GLOBAL_GENERICS — MATERIAL

Torrent's disclosures identify the United States and Germany as generic businesses rather than merely export geographies:

- the FY2025-26 annual report describes the United States as a key regulated market within the Company's Generics segment and states an intention to expand complex generics;
- the annual report describes Heumann/Torrent Germany as operating in the generic pharmaceutical market;
- management's Q2 FY2025-26 earnings call explicitly grouped the US and Germany on the "generic side" while separately discussing India and Brazil as branded markets.

Comparable FY2025-26 standalone geography revenue disclosed in the annual report:

- USA: ₹913.08 crore;
- Germany & Malta: ₹377.28 crore;
- combined US + Germany/Malta: ₹1,290.36 crore;
- total standalone revenue from operations: ₹10,712.00 crore.

Quantitative share:

`₹1,290.36 crore / ₹10,712.00 crore = approximately 12.05%`

Under the approved V1 rule, a supported business-model exposure between 10% and <50% is `MATERIAL`.

**Assessment:**
- exposure code: `GLOBAL_GENERICS`
- materiality: `MATERIAL`
- confidence: `MEDIUM`
- basis: issuer-defined generic businesses + comparable standalone revenue share above 10%
- reason code candidate: `ISSUER_DEFINED_GENERIC_BUSINESS_REVENUE_SHARE_GTE_10`

Confidence remains MEDIUM rather than HIGH because the annual-report geography line combines Germany and Malta and does not publish one audited business-model revenue line labelled `GLOBAL_GENERICS`. The conclusion is nevertheless stronger than a geography-only inference because issuer disclosures independently characterize the US and Germany operations as generic businesses.

### 2. CDMO_CRAMS — UNKNOWN / unresolved potential exposure

The FY2025-26 standalone financial statements disclose contract-manufacturing revenue of ₹626.65 crore, approximately 5.85% of standalone revenue from operations.

That percentage would fall in the V1 `EMERGING` range **if** the numerator were established as the approved `CDMO_CRAMS` business model. Current retained evidence does not establish that equivalence.

Relevant context exists, including Torrent's historical dedicated formulation/packaging manufacturing arrangement for insulin, but the current annual report does not identify the ₹626.65 crore contract-manufacturing line as a CDMO/CRAMS platform, disclose customer/contract economics, or map it to the approved CDMO/CRAMS business-model definition.

Therefore:

- do not convert "contract manufacturing" automatically to `CDMO_CRAMS`;
- retain the potential exposure as `UNKNOWN` pending business-model-specific evidence;
- do not use the 5.85% share to classify it as `EMERGING` yet.

**Assessment:**
- exposure code: `CDMO_CRAMS`
- materiality: `UNKNOWN`
- confidence: `LOW`
- reason code candidate: `CONTRACT_MANUFACTURING_NOT_YET_MAPPED_TO_CDMO_CRAMS`

### 3. Brazil and other branded international markets

Brazil is described by Torrent as a branded-generics market and an extension of its branded business model. This is not a separate secondary subprofile merely because it is outside India. Geography does not create a second business-model code.

No separate secondary exposure is created from Brazil or the broader Rest-of-World branded franchise at this stage.

## Gate E review-package consequence

Current reviewed evidence supports:

- primary: `DOMESTIC_FORMULATIONS` — `SUPPORTED`, confidence `HIGH`;
- secondary: `GLOBAL_GENERICS` — `MATERIAL`, confidence `MEDIUM`;
- potential secondary: `CDMO_CRAMS` — `UNKNOWN`, confidence `LOW`.

Because the approved review-package logic fails closed whenever a retained secondary exposure has unresolved `UNKNOWN` materiality, TORNTPHARM remains:

- assignment lifecycle: `PROVISIONAL`;
- Gate E review decision: `KEEP_PROVISIONAL`;
- active blocker: `UNRESOLVED_SECONDARY_EXPOSURE_MATERIALITY` for the potential `CDMO_CRAMS` exposure.

No production assignment should be created from this artifact.

## Next safe step

Resolve whether the disclosed contract-manufacturing activity meets the approved `CDMO_CRAMS` business-model definition using official issuer evidence. If not enough evidence exists, retain `UNKNOWN` and document that limitation rather than forcing a classification.
