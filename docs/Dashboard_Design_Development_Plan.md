# PortfolioAI Dashboard Design Development Plan

**Status:** Active UI redesign plan  
**Branch:** `dashboard-design`  
**Base:** validated `main` after PR #58 Research workspace merge

## Purpose

Redesign the Dashboard as the PortfolioAI command centre while preserving the trusted transaction ledger, deterministic calculations, source provenance, existing Supabase schema, provider accounting, and human-in-the-loop investment boundary.

This branch is UI/presentation focused. It must not introduce schema migrations, provider calls, AI mutations, transaction changes, recommendation-rule changes, or silent financial-semantic changes.

## Stage D1 — Information architecture

Top-down order:

1. Portfolio Scope selector
2. Executive KPI summary
3. Portfolio Pulse
4. Allocation visualisation
5. Position Sizing & Portfolio Impact
6. Top 10 / Bottom 10 performance
7. P&L contributors / detractors
8. Important Portfolio News placeholder
9. Key Insights rail
10. Portfolio structure / broker exposure
11. Data Health
12. Detailed analytics / methodology

## Stage D2 — Portfolio Scope selector

Provide one selector over the existing consolidated portfolio. Scope options are filtered views, not separate portfolios:

- Consolidated Portfolio
- current portfolio roles such as Core, Satellite, ETF, Other and Unclassified
- active user-created Themes

Compatible Dashboard metrics recalculate from the selected subset. Scope filtering must never duplicate or mutate transactions, holdings, roles, themes, settings, or research evidence.

## Stage D3 — Executive KPIs

Show scope-aware:

- priced/current value
- calculable cost basis
- supported unrealised P&L and return
- supported realised P&L
- open-holding count
- coverage context

Partial and unavailable values remain explicitly qualified.

## Stage D4 — Portfolio Pulse

Use current trusted evidence only:

- strongest supported return
- weakest supported return
- largest priced position
- coverage warning when valuation is partial

## Stage D5 — Allocation charts

Use lightweight native CSS/HTML visualisations without adding a chart dependency in the first pass:

- donut chart for portfolio-role allocation
- horizontal bar chart for trusted sector allocation
- donut chart for market-cap category
- expandable asset-class and stock allocation details

## Stage D6 — Position Sizing & Portfolio Impact

Show the 10 largest priced holdings in the selected scope. Keep concepts separate:

- current weight in the consolidated portfolio
- share of the selected scope
- user target weight
- configured minimum/maximum range
- current market value

Target/range comparisons are presentation of existing user settings only. No new recommendation or sizing rule is invented by the Dashboard.

## Stage D7 — Top 10 / Bottom 10

Show at least 10 strongest and 10 weakest supported unrealised-return positions where evidence exists. Percentage return remains separate from P&L contribution.

## Stage D8 — P&L contribution

Show top supported unrealised-P&L contributors and detractors by absolute monetary contribution. This must not be presented as the same concept as return percentage.

## Stage D9 — Key Insights rail

Desktop sticky side rail using only existing facts, initially including:

- largest position
- strongest / weakest supported return
- price coverage
- sizing-target coverage
- shortcuts to Research, Portfolio Structure and Transactions

Future deterministic investment-intelligence signals may be added later through a separately reviewed stage.

## Stage D10 — Broker exposure

For the consolidated scope, retain the existing deterministic broker analytics and make the detailed table expandable.

For filtered role/theme scopes, only market-value exposure may be recomputed from transaction-derived broker quantities and trusted current prices. Do not fabricate filtered broker cost or P&L accounting when that per-account scope calculation is not represented in the current Dashboard view model.

## Stage D11 — Data Health

Show selected-scope evidence quality:

- price coverage
- accounting coverage
- stale prices
- missing prices
- missing transaction dates
- missing broker attribution

## Stage D12 — News placeholder

Reserve the visual location for `Important Portfolio News`, but do not fabricate headlines or perform browser scraping in the Dashboard branch.

Live news requires a separate backend track with source review, scheduling, security matching, deduplication, caching and source provenance.

## Stage D13 — Responsive polish

Desktop: command-centre layout with sticky insights rail.  
Tablet: stacked main area with compact charts.  
Mobile: single-column layout with no page-level horizontal overflow.

## Stage D14 — Validation

Before merge:

- TypeScript
- Dashboard-specific tests where applicable
- production build
- relevant lint / baseline comparison
- visual review at desktop/tablet/mobile widths
- `git diff --check`
- verify no database/schema/provider/AI changes
- owner visual approval

## Separate News Intelligence track

News ingestion is intentionally separate from the UI-only Dashboard redesign:

- N1 source contract review (Trendlyne MCP, NSE/BSE, company IR, approved media/web)
- N2 canonical news data model
- N3 scheduled ingestion
- N4 canonical security matching
- N5 deduplication
- N6 deterministic relevance/category handling
- N7 Dashboard news panel wiring
- N8 automatic cached updates without manual refresh
- N9 optional evidence-grounded AI daily digest

No News Intelligence backend work should be mixed into `dashboard-design` without explicit owner approval for that separate functional stage.
