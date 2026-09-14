# R2C Application Classification Alignment — 2026-09-14

Status: **CORRECTED APPLICATION-WIDE CLASSIFICATION CONTRACT**

This document supersedes the earlier idea of maintaining a second PortfolioAI sector taxonomy for R2.

## Decision

PortfolioAI has one application-wide sector and market-cap classification source:

`current_security_enrichment_v1`

The Dashboard already consumes this source through:

`loadSecurityEnrichment()` → `usePortfolioEnrichment()` → `enrichmentAllocation()`

R2 and every other application page must use the same classification values.

## Sector rule

For an equity holding:

- `current_security_enrichment_v1.sector` is the application sector label.
- The label must be preserved exactly for grouping, filtering, counts and display.
- R2 must not merge, rename, normalize or replace that label with another user-visible sector taxonomy.
- If the Dashboard says `Banking`, the same security must be `Banking` in Research Coverage, Holdings, Portfolio Structure, scoring context and any future Action Center.
- If the Dashboard says `Financial Services`, it remains `Financial Services`; it is not merged into `Banking`.
- Likewise `Pharma` and `Healthcare`, `FMCG` and `Fast Moving Consumer Goods`, `Power` and `Renewable Energy`, and every other existing Dashboard sector remain distinct unless the shared enrichment record itself is later changed through the approved classification process.

## Market-cap rule

The same principle applies to market-cap classification:

- `current_security_enrichment_v1.market_cap_category` is the shared application market-cap bucket.
- `LARGE_CAP`, `MID_CAP`, `SMALL_CAP` and ETF/non-equity treatment must be derived from the same enrichment record used by the Dashboard.
- No page may maintain an independent market-cap bucket for the same security.

## Research profiles are separate from sectors

Sector classification and research methodology are related but not identical.

A research profile may group multiple application sectors when their economics and required metrics are genuinely compatible. For example, a research-profile family may eventually cover more than one Dashboard sector. That internal grouping must never alter the sector displayed for the security.

Therefore:

`Dashboard sector → optional research-profile mapping → profile-specific evidence/scoring`

not:

`Dashboard sector → rewritten PortfolioAI sector → research`

Research-profile readiness remains independent. A security can have a valid Dashboard sector while its R4 research profile is still `PROFILE_PENDING`.

## Current production classification coverage

The read-only R2C inventory found:

- 240 open equity holdings;
- 240/240 have a sector value in `current_security_enrichment_v1`;
- 48/240 currently have industry detail;
- 9 non-equity holdings are handled separately.

Accordingly, sector classification coverage for the current equity portfolio is **100% at the Dashboard sector level**.

The earlier 210/240 mapped + 30 review-required result referred only to the now-superseded secondary taxonomy mapping. Those 30 holdings are not unclassified in the application; they already have valid Dashboard sector labels such as `Consumer Services`, `Waste Managment`, `Material`, `Services`, `Ship Building`, and `Consumer Discretionary`.

## Single-source-of-truth requirement

All PortfolioAI pages must draw classification data from the same shared enrichment source or from a shared selector/service whose only classification authority is that source.

Pages must not:

1. read a separate local sector mapping for display;
2. infer sector from ticker/company name;
3. merge Dashboard sectors for convenience;
4. maintain page-specific market-cap calculations;
5. silently fall back to stale `securities.sector_id` / `industry_id` values while the enrichment view is authoritative.

If a future classification correction is made, it should be made once in the shared classification/enrichment layer and automatically appear consistently throughout the application.

## Implementation

`src/features/research/sectorResearchMapping.ts` now preserves the Dashboard sector as `applicationSector` and may only propose a downstream research-profile family separately.

`src/features/research/portfolioCoverageProjection.ts` now aggregates by the exact application sector label rather than by a secondary canonical-sector code.

This keeps R2 aligned with the existing Dashboard instead of creating an isolated classification system.
