# R4N Gate F — TORNTPHARM Artifact-Level Content Review Plan

**Status:** Local-first planning only  
**Contract:** `TORNTPHARM_ARTIFACT_CONTENT_REVIEW_PLAN_V1`  
**Evidence state:** `NOT_REVIEWED` for every requirement and every artifact

## Purpose

Turn the public/official source hubs into an exact document review queue for the 12 `PUBLIC_OFFICIAL_FIRST` TORNTPHARM business-model requirements.

This stage plans which exact documents should be inspected and how relevant each one is likely to be. It does **not** review document content into evidence, fetch artifacts into PortfolioAI storage, or ingest observations.

## Exact artifact queue

The plan contains 12 exact artifacts:

### Annual reports
- Integrated Annual Report 2022-23
- Integrated Annual Report 2023-24
- Integrated Annual Report 2024-25
- Integrated Annual Report 2025-26

### Quarterly result releases
- Q4 FY25 Results Release
- Q1 FY26 Results Release
- Q2 FY26 Results Release
- Q3 FY26 Results Release
- Q4 FY26 Results Release

### Regulator documents
- FDA Warning Letter — Indrad facility — 8 October 2019
- FDA Closeout Letter — Indrad facility — 4 September 2024

### Exchange filing
- Regulation 30 — JB Chemicals acquisition completion — 21 January 2026

## Relevance classification

Each artifact-to-requirement link is classified only as:

- `LIKELY_RELEVANT`
- `POSSIBLY_RELEVANT`

These labels are planning judgments only. Neither label means the artifact satisfies the evidence contract.

Disclosure-sensitive requirements are intentionally conservative. For example, all five quarterly releases are only `POSSIBLY_RELEVANT` for US Generic Price Erosion until explicit price/ASP evidence is actually verified.

## Planning coverage versus evidence coverage

The plan keeps two different gap concepts:

1. **Planning coverage gap** — whether enough candidate documents/periods are lined up to attempt the required history.
2. **Reviewed-evidence gap** — how many verified observations are still missing after actual document review.

Current state:
- requirements planned: **12**
- requirements with enough candidate documents to cover minimum planning horizon: **12**
- requirements with enough candidate documents to cover preferred planning horizon: **5**
- evidence reviewed: **0**
- every requirement remains `NOT_REVIEWED`

This prevents candidate-document availability from being mistaken for evidence readiness.

## Example: Export / US Revenue Growth

Planned candidate periods:
- Q4 FY25
- Q1 FY26
- Q2 FY26
- Q3 FY26
- Q4 FY26

Contract history:
- minimum: 4 quarters
- preferred: 8 quarters

Planning result:
- candidate documents: 5
- minimum planning gap: 0
- preferred planning gap: 3
- reviewed observations: 0
- minimum reviewed-evidence gap: 4

## Safety state

- content fetch authorized: **false**
- evidence review authorized: **false**
- ingestion authorized: **false**
- paid/licensed provider use: **false**
- production write: **false**
- scoring/recommendation/sizing: **outside this gate**

## Next safe step

After localhost visual approval and full local validation, the next Gate F step should be a separately authorized **read-only document-content review dry run** for selected public/official artifacts. That later step may inspect content and propose evidence candidates, but it must still perform no ingestion unless separately approved.
