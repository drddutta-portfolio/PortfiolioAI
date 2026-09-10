# Stage 8.3 — Profile Resolution and First Bank Metric Promotion

## Why this stage exists

Stage 8.2 exposed the common scorecard and sector-aware framework, but production sector/industry enrichment is currently unavailable for all 249 open holdings. Without a safe fallback, HDFCBANK would incorrectly resolve to the GENERAL scoring profile in the UI.

Stage 8.3 therefore adds an explicit reviewed scoring-profile assignment layer. It is methodology metadata only; it never changes portfolio membership, primary role, themes, Core/Satellite classification, or transaction data.

## HDFCBANK reviewed profile

HDFCBANK is recorded as the owner-reviewed `BANK_NBFC` pilot while trusted sector enrichment remains unavailable. The Research scorecard shows whether a profile came from a reviewed assignment, a sector rule, or the GENERAL fallback.

## First bank-specific canonical metrics

The previously captured Trendlyne bank-contract evidence is reused with zero new provider calls. Only the three exact labels already verified in Stage 8.1C are promoted:

- `Gross NPA ratio Qtr %` → `GROSS_NPA_PERCENT` = 1.17%
- `Net NPA ratio % Qtr` → `NET_NPA_PERCENT` = 0.41%
- `EPS Qtr YoY Growth %` → `EPS_GROWTH_YOY` = 18.37%

The migration fails closed unless the immutable source capture contains the exact provider labels and exact HDFCBANK values. No period-end date is invented because the provider result did not provide a safe exact reporting date for these fields.

## Sector coverage

The broader non-financial scoring framework from Stage 8.2 remains active as methodology. Until trusted sector enrichment is populated, non-financial holdings resolve to GENERAL unless a reviewed profile assignment exists. This is intentionally preferable to guessing a sector from a ticker or company name.

## Roadmap alignment

The original Stage 7.2D work has now produced the dataset contract, verified Trendlyne field mappings, controlled parser/storage extensions, provider quota controls and owner-confirmed manual discovery/promotion pilots. Stage 8 has begun as a parallel deterministic-intelligence layer, but the research ingestion roadmap remains unfinished.

Next gates:

1. expose and visually inspect the common scorecard/ratings panel on localhost;
2. populate trusted sector/industry enrichment or reviewed pilot profile assignments for a small non-financial cohort;
3. verify only the Trendlyne fields required by those sector models;
4. add Angel One-derived momentum/risk inputs;
5. calculate auditable partial/complete scores only after coverage gates pass;
6. then implement Core/Satellite suitability as a recommendation layer controlled by the user;
7. widen monthly ingestion and later scheduled/event-driven refresh only after pilot validation.
