# Stage D21–D32 — Allocation Performance and Collapsible Dashboard

## Status

Implementation branch: `dashboard-allocation-performance`

## Production enrichment audit

The canonical enrichment contract already exists through `current_security_enrichment_v1`, `current_security_classification_v1`, and `current_market_cap_category_v1`.

Initial audit on 2026-09-13 found:

- 272 canonical enrichment rows
- 0 populated sector values
- 0 populated industry values
- 0 populated market-cap values
- 0 populated Large/Mid/Small market-cap categories

Trendlyne `SECURITY_IDENTITY` source records contained stored `sector` and `industry` fields for a limited pilot subset. Production verification found 25 deterministically linked securities with explicit stored sector/industry evidence.

## D21 sector / industry normalization

On 2026-09-13 the owner approved continuing D21 enrichment normalization. Migration `promote_stored_trendlyne_sector_industry_evidence` was applied to production and added to this branch.

The migration:

- seeds `PORTFOLIOAI_INDUSTRY` taxonomy version 1;
- creates only sector and industry master values present in stored Trendlyne evidence;
- creates explicit `TRENDLYNE_MCP` -> canonical mapping rows;
- records append-only `SECTOR` and `INDUSTRY` security attribute observations;
- selects those observations through `security_attribute_decisions` using `EVIDENCE_PRIORITY`;
- applies a 365-day classification freshness horizon from the source retrieval time;
- does not infer classification from ticker, name, theme, role, price, or holdings data;
- makes no new provider call.

Post-migration verification showed 25 securities with trusted sector and industry evidence in `current_security_enrichment_v1`. They remain `PARTIAL` because market-cap classification is not yet available.

## Market-cap evidence status

Production contains 32 stored `MARKET_CAP_PROVIDER_RAW` observations covering 25 securities, but there are currently no rows in `market_cap_classification_observations` and no rank-based category assessments.

The active classification policy is `SEBI_AMFI_FULL_MARKET_CAP_RANK_V1`:

- Large Cap = rank 1–100 by full market capitalisation;
- Mid Cap = rank 101–250;
- Small Cap = rank 251+;
- insufficient trusted rank evidence must remain unclassified.

The official AMFI categorisation page currently exposes the 2026 Jan–Jun list but not a Jul–Dec 2026 list. PortfolioAI must not convert raw market-cap rupee values into Large/Mid/Small using ad-hoc thresholds. Market-cap categories therefore remain explicitly unavailable until authoritative rank evidence is available and normalized.

## UI foundation in this stage

- Sector allocation donut chart with explicit Unclassified and ETF slices
- Market-Cap allocation donut chart with Large / Mid / Small / ETF / Unclassified support
- donut centres show classification coverage so partial data cannot look complete
- smaller sector groups aggregate into `Other sectors` after the leading groups
- New Sector Performance table
- New Market-Cap Performance table
- Explicit classification coverage
- ETFs represented as an independent ETF bucket rather than forced into equity cap categories
- Supported return only: unrealised P&L divided by supported invested cost
- Return contribution expressed as percentage points of supported portfolio cost
- Per-row priced/accounting coverage
- Sortable holdings, weight, P&L, return and return-contribution columns
- `Performance` added to Dashboard Command Index

## Collapsible Dashboard behavior

Lower-priority layers are collapsible while the executive overview, allocation/performance, structure/action centre and news remain immediately visible.

Initial defaults:

- Portfolio Risk & Concentration: open
- Monitoring & Configuration Coverage: closed
- Research & Intelligence Status: closed
- Portfolio Intelligence Snapshot: closed

The browser remembers each section state in localStorage. Command Index navigation automatically opens a collapsed target section.

## Safety boundaries

This stage:

- does not make new provider/API calls merely to render the Dashboard;
- does not mutate holdings, transactions, roles, targets or recommendations;
- does not estimate missing returns;
- does not infer missing classifications;
- excludes unclassified securities from classified performance aggregates and reports coverage explicitly;
- promotes only previously stored provider classification evidence with explicit source provenance.

## Remaining planned stages

- D21: continue enrichment completion / provenance
- D22: sector allocation activation as classification coverage grows
- D23: market-cap allocation activation after authoritative rank evidence is available
- D24: sector performance
- D25: market-cap performance
- D26: allocation-vs-performance matrix
- D27/D28: collapsible sections and remembered state
- D29: command-index integration
- D30: shared Portfolio Scope behavior across downstream modules
- D31: coverage/integrity validation
- D32: responsive visual polish and merge
