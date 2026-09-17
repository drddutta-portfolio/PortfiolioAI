# R4N — TORNTPHARM Gate E Secondary-Exposure Evidence Review

**Status:** LOCAL / READ-ONLY REVIEW ARTIFACT — EVIDENCE REVIEW COMPLETE  
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

- the FY2025-26 annual report describes the United States as a key regulated market within the Company's generics business and states an intention to expand complex generics;
- the annual report describes Heumann/Torrent Germany as operating in the generic pharmaceutical market;
- management has separately discussed the US and Germany as generic markets while distinguishing India and Brazil as branded markets.

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

### 2. CDMO_CRAMS — EMERGING by approved qualitative override

Earlier Gate E review retained this exposure as `UNKNOWN` because standalone contract-manufacturing revenue alone did not establish the approved `CDMO_CRAMS` business-model definition.

Fresh official issuer evidence resolves that business-model question:

- Torrent's June 2025 acquisition announcement for J.B. Chemicals & Pharmaceuticals described the combination as adding **emerging international CDMO capabilities**;
- Torrent's FY2025-26 annual report states that the acquisition provides a **meaningful entry and expansion opportunity in the Contract Development and Manufacturing Organization (CDMO) segment**, which it describes as strategically attractive;
- the Chairman's FY2024-25 AGM statement says the addition of the CDMO platform opens a **promising, long-term growth avenue** for Torrent;
- the FY2025-26 annual report describes JB Pharma's lozenges capability, including medicated and herbal lozenges and large-scale global production.

This establishes that the acquired JB Pharma activity is genuinely a CDMO business-model exposure, not merely a generic contract-manufacturing accounting line.

However, the currently retained official evidence does **not** isolate a comparable FY2025-26 revenue numerator for the CDMO platform itself. Therefore the standalone ₹626.65 crore contract-manufacturing line is still not used as the CDMO numerator.

Under the approved V1 rule, an exposure may be classified `EMERGING` through a provenance-complete qualitative override when management explicitly identifies it as a strategic/growing operating model even when a comparable business-model revenue numerator is unavailable. The official issuer disclosures satisfy that condition, but do not support escalation to `MATERIAL` without a stronger economic-materiality basis.

**Assessment:**
- exposure code: `CDMO_CRAMS`
- materiality: `EMERGING`
- confidence: `MEDIUM`
- quantitative revenue share: unavailable / not used
- override basis: issuer-defined CDMO platform + strategic long-term growth avenue
- reason code candidate: `QUALITATIVE_OVERRIDE_EMERGING_JB_PHARMA_CDMO_PLATFORM`
- effective evidence date: `2026-01-21` for consolidation into Torrent; assignment-package effective-from candidate remains `2026-03-31`

This is deliberately conservative. It recognizes a real CDMO business model while avoiding an unsupported revenue-share calculation.

### 3. Brazil and other branded international markets

Brazil is described by Torrent as a branded-generics market and an extension of its branded business model. This is not a separate secondary subprofile merely because it is outside India. Geography does not create a second business-model code.

No separate secondary exposure is created from Brazil or the broader Rest-of-World branded franchise at this stage.

## Conditional materiality consequence

Because `GLOBAL_GENERICS` is reviewed as `MATERIAL`, export/regulated-market and regulatory/site evidence requirements that are conditional for a `DOMESTIC_FORMULATIONS` primary model should be treated as active in the effective research contract.

The `CDMO_CRAMS` exposure is `EMERGING`; only requirements explicitly designed to activate for emerging CDMO exposure should activate at this stage.

This determines applicability only. It does not imply that the required evidence is already present or score-ready.

## Gate E review-package consequence

Current reviewed evidence supports:

- primary: `DOMESTIC_FORMULATIONS` — `SUPPORTED`, confidence `HIGH`;
- secondary: `GLOBAL_GENERICS` — `MATERIAL`, confidence `MEDIUM`;
- secondary: `CDMO_CRAMS` — `EMERGING`, confidence `MEDIUM`.

No retained secondary exposure remains `UNKNOWN`, no dominant-secondary reclassification conflict exists, and conditional export/regulatory materiality has been resolved through the `MATERIAL` Global Generics exposure.

Subject to the existing environment-resolved security identity and assignment-version checks, the Gate E review package may therefore advance to:

- Gate E review decision: `READY_FOR_REVIEW`;
- proposed assignment lifecycle: still `PROVISIONAL`;
- proposed primary assignment: `DOMESTIC_FORMULATIONS`;
- proposed secondary exposures: `GLOBAL_GENERICS = MATERIAL`, `CDMO_CRAMS = EMERGING`;
- no automatic transition to `REVIEWED`;
- no production persistence from this artifact.

## Production boundary

This document is an evidence-backed local/read-only review artifact only. It does not create or modify any row in production Supabase. Promotion from `PROVISIONAL` to `REVIEWED`, and any production assignment write, require a separate explicit owner authorization after the exact assignment package is presented for review.
