# R4N Gate F — TORNTPHARM Business-Model Evidence Acquisition Contract

**Status:** Local-first design contract only  
**Profile:** PHARMA_V1  
**Primary subprofile:** DOMESTIC_FORMULATIONS  
**Material overlay:** GLOBAL_GENERICS  
**Emerging watch:** CDMO_CRAMS — excluded from the acquisition denominator until an Emerging-specific contract is separately versioned  
**Contract version:** `PHARMA_BUSINESS_MODEL_EVIDENCE_ACQUISITION_V1`

## Purpose

Define how PortfolioAI may gather, normalize and review the 14 currently unmet business-model evidence requirements for the reviewed TORNTPHARM Pharma assignment without ingesting anything yet.

This contract does **not** authorize:
- database writes or evidence ingestion;
- paid/licensed provider calls;
- production changes;
- scoring, recommendation or sizing;
- scheduler changes;
- PR merge or deployment.

The canonical PHARMA_V1/subprofile metric contracts remain authoritative for applicability, history requirements, source contract, freshness and calculation ownership. This acquisition contract adds only the planning layer needed to locate and shape source evidence safely.

## Access-gate semantics

| Access gate | Meaning |
| --- | --- |
| `PUBLIC_OFFICIAL_FIRST` | Start with issuer, exchange or regulator evidence. No licensed source is required as the first lane. |
| `PUBLIC_OR_LICENSED` | Public/issuer disclosure may satisfy the contract; an approved licensed source is an allowed fallback only if separately authorized. |
| `LICENSED_REQUIRED` | The evidence contract cannot be completed from issuer self-description alone; an approved licensed source is mandatory and remains separately permission-gated. |

## Acquisition methods

| Method | Meaning |
| --- | --- |
| `DOCUMENT_EXTRACTION` | Extract an explicitly disclosed fact without inventing a numeric derivation. |
| `EVENT_REVIEW` | Build a dated, provenance-complete event series. |
| `DERIVED_FROM_DISCLOSED_INPUTS` | PortfolioAI may derive the metric only from compatible explicitly disclosed direct inputs. |
| `COMPOSITE_REVIEW` | Combine multiple approved source lanes into one reviewed evidence state without blending them into a score. |

## TORNTPHARM 14-requirement plan

| Scope | Metric | Level | History minimum / preferred | Access | Method | Required evidence shape | Fail-closed boundary |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Domestic Formulations | Domestic Revenue Growth | Mandatory | 3 / 5 years | Public/official first | Derived from disclosed inputs | Comparable disclosed domestic-formulations revenue by period | Never substitute total India revenue or commentary for a compatible domestic-formulations series |
| Domestic Formulations | Field Force Productivity | Mandatory | 3 / 5 years | Public/official first | Derived from disclosed inputs | Disclosed MR headcount plus compatible domestic revenue | Employee totals or inferred MR headcount are prohibited |
| Domestic Formulations | Brand & Therapy Leadership | Mandatory | 3 / 5 years | Licensed required | Composite review | Issuer franchise/therapy evidence cross-checked with approved licensed market share/rank evidence | Issuer self-description alone is insufficient; no licensed call without separate approval |
| Domestic Formulations | Domestic Exposure Materiality Review | Mandatory | 1 / 1 event | Public/official first | Composite review | Issuer segment/site evidence plus regulator context producing explicit ACTIVE/INACTIVE decision | Ambiguity remains REVIEW_REQUIRED |
| Domestic Formulations | New Launch Contribution | Important | 3 / 5 years | Public/official first | Document extraction | Explicitly disclosed launch contribution or compatible disclosed numerator/denominator | Qualitative launch-success language never becomes a percentage |
| Domestic Formulations | Chronic / Acute Mix | Important | 3 / 5 years | Public or licensed | Composite review | Comparable issuer-disclosed therapy mix, or approved licensed source if issuer disclosure is absent | No estimation from brand lists or anecdotes |
| Domestic Formulations | Domestic Pipeline Evidence | Important | 1 / 3 events | Public/official first | Event review | Dated material domestic launch/pipeline events with product, therapy, stage/outcome and provenance | Undated pipeline claims/product lists do not count |
| Domestic Formulations | In-licensing / M&A Execution | Supplementary | 1 / 4 events | Public/official first | Event review | Dated material transactions with disclosed terms and execution/outcome evidence | Rumoured/proposed/immaterial transactions remain contextual |
| Global Generics | Regulatory Site Status | Mandatory | 1 / 1 event | Public/official first | Event review | Current regulated-site inspection/action/remediation/closure state | Older clean evidence cannot override a newer unresolved action |
| Global Generics | Export / US Revenue Growth | Mandatory | 4 / 8 quarters | Public/official first | Derived from disclosed inputs | Comparable disclosed US/export revenue by period | Do not substitute total international revenue for reviewed compatible US/export scope |
| Global Generics | Pipeline / Launch / Approval Evidence | Mandatory | 1 / 4 events | Public/official first | Event review | Dated material filing/launch/approval/rejection/milestone events linked to product/geography/stage | Unidentified or undated events remain unavailable/review-required |
| Global Generics | US Generic Price Erosion | Mandatory | 4 / 8 quarters | Public/official first | Document extraction | Explicit issuer ASP/price-erosion evidence separated from volume/mix | No residual back-solving without an approved versioned method |
| Global Generics | Generics Volume / Mix | Important | 4 / 8 quarters | Public/official first | Document extraction | Explicit issuer volume and product-mix effects separated from price | No invented numeric split when disclosure is qualitative |
| Global Generics | Complex / Specialty Generics Mix | Important | 3 / 5 years | Public/official first | Composite review | Product-mix and material-launch evidence supporting complex/specialty classification | Ordinary generics cannot be reclassified without issuer/official evidence |

## Summary contract

For the current reviewed TORNTPHARM model:
- 14 planned requirements;
- 8 mandatory;
- 5 important;
- 1 supplementary;
- 12 public/official-first;
- 1 public-or-licensed;
- 1 licensed-source required;
- 3 controlled PortfolioAI derivations from explicitly disclosed compatible inputs;
- CDMO / CRAMS Emerging remains outside this contract;
- evidence ingestion authorization = **false**.

## Next safe gate

The next step after owner visual approval and full local validation is to prepare a **source-discovery dry run** for the public/official-first rows only. That dry run may identify candidate issuer/exchange/regulator artifacts and report gaps, but must not fetch paid/licensed sources or write evidence unless separately authorized.
