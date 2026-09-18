# R4N Gate F — TORNTPHARM Read-Only Public Content Review Dry Run

**Status:** Read-only pilot only  
**Contract:** `TORNTPHARM_READ_ONLY_CONTENT_REVIEW_V1`  
**Ingestion authorization:** false

## Purpose

Inspect a deliberately small public/official artifact subset and produce proposed evidence candidates plus explicit rejection/gap reasons without writing anything to canonical evidence storage.

This pilot reviews only:
- Q1 FY26 results release;
- Q2 FY26 results release;
- Q3 FY26 results release;
- Q4 FY26 results release;
- FDA 2019 Indrad warning letter;
- FDA 2024 Indrad closeout letter.

## Pilot requirement 1 — Export / US Revenue Growth

The issuer releases explicitly disclose:

- Q1 FY26: US business revenue up **19% YoY**;
- Q2 FY26: US business revenue up **26% YoY**;
- Q3 FY26: US business revenue up **19% YoY**;
- Q4 FY26: reported US business revenue up **31% YoY**, but the same release separately states **base-business US revenue grew 16% YoY**.

Because Q4 FY26 consolidated results include JB Pharma from 21 January 2026, the reported 31% growth is excluded from the comparable four-quarter candidate series. The 16% base-business growth is used as the proposed Q4 candidate because it better preserves scope compatibility with the pre-acquisition Q1-Q3 business.

Proposed four-quarter candidate series:
- 2025-06-30: 19%
- 2025-09-30: 26%
- 2025-12-31: 19%
- 2026-03-31: 16% base-business

Dry-run result:
- proposed observations: 4
- minimum contract: 4 quarters
- proposed minimum gap: 0
- state: `MINIMUM_CANDIDATE_HISTORY_PRESENT`
- canonical evidence writes: 0

The rejected claim remains explicitly visible:
- Q4 FY26 reported US growth = 31%
- rejection reason: post-acquisition consolidated scope is not comparable to the earlier quarters for this four-quarter series.

## Pilot requirement 2 — Regulatory Site Status

FDA warning letter dated 8 October 2019:
- site: Indrad, Gujarat;
- FEI 3005029956;
- FDA recorded significant CGMP violations following its April 2019 inspection.

FDA closeout letter dated 4 September 2024:
- references the same warning-letter chain and FEI;
- states that, based on FDA's evaluation, the firm appears to have addressed the violations in Warning Letter 320-20-03;
- explicitly says future inspections and regulatory activities will further assess adequacy and sustainability.

Proposed regulator-event candidates:
- 2019-10-08: `WARNING_LETTER_ACTIVE`
- 2024-09-04: `WARNING_LETTER_CLOSED_OUT`

Dry-run result:
- state: `PARTIAL_SCOPE_REVIEW`
- reason: only the Indrad warning-to-closeout chain is reviewed in this pilot;
- no assertion is made that all material US-facing Torrent manufacturing sites are currently clear of unresolved regulatory actions.

## Dry-run summary

- reviewed public/official artifacts: **6**
- proposed evidence candidates: **6**
- rejected claims: **1**
- requirements piloted: **2**
- ingestion writes: **0**
- ingestion authorized: **false**

## Safety boundary

This dry run performs content review only. Proposed candidates remain outside canonical evidence storage.

Not authorized:
- evidence ingestion;
- production Supabase mutation;
- paid/licensed provider calls;
- score/recommendation/sizing changes;
- scheduler changes;
- production deployment;
- PR merge.

## Next safe step

After owner localhost visual approval and full local validation, the next Gate F slice can expand the read-only review to another small public/official requirement set, or prepare a formal **candidate-to-ingestion proposal contract**. Any actual evidence write remains separately approval-gated.
