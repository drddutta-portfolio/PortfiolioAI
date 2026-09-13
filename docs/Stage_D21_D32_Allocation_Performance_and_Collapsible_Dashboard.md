# Stage D21–D32 — Allocation Performance and Collapsible Dashboard

## Status

Implementation branch: `dashboard-allocation-performance`

Production enrichment and Dashboard activation are in progress. Allocation visuals are owner-reviewed; backend classification coverage is now materially populated and the interactive chart/table layer is under final review.

## Production enrichment audit

The canonical enrichment contract is `current_security_enrichment_v1`, `current_security_classification_v1`, and `current_market_cap_category_v1`.

Initial audit on 2026-09-13 found 272 canonical enrichment rows but zero normalized sector, industry, market-cap, or Large/Mid/Small classifications.

## D21 sector / industry normalization

### Stored Trendlyne evidence promotion

Migration `20260913154500_promote_stored_trendlyne_sector_industry_evidence.sql` promotes only previously stored, deterministically linked Trendlyne classification evidence.

It seeds the controlled industry taxonomy, creates verified provider mappings, writes append-only SECTOR/INDUSTRY observations and selects current evidence without ticker/name/theme inference.

The initial stored-evidence pass classified 25 current equities. A bounded Trendlyne classification cohort then accepted 23 of 40 planned identities and normalized 11 newly observed exact provider sector/industry pairs while preserving the Stage-7 immutable-evidence trigger.

### Owner STOCK MASTER sector evidence

The owner-provided `PortFolio-1 (1)(3).xlsx` STOCK MASTER sector column was then ingested as `STOCK_MASTER` evidence rather than being represented as provider evidence.

Current sector coverage is:

- 212 / 240 current non-ETF equities = 88.3% by holding count
- 28 non-ETF equities remain without canonical sector evidence
- the Dashboard donut can show 27 Unclassified when one of those holdings lacks a usable current priced value, because the donut is current-value weighted

Unresolved securities remain Unclassified until trusted owner/provider/reference evidence is available; they are not guessed from company names.

### Trendlyne usage-accounting correction

The production audit found that PortfolioAI had conflated internal provider attempts with the MCPPro account-page tool-call counter. Forty `SEARCH_ENTITIES` operations were recorded as internal attempts, while the Trendlyne account page showed only four tool calls consumed.

PortfolioAI now reports these separately:

- internal safety attempts: operational control-plane count
- provider-usage estimate: provider-billable/tool-call estimate aligned to the observed MCPPro counter

The internal safety guard remains independent of the paid provider allowance.

## D21 market-cap classification

The active policy is `SEBI_AMFI_FULL_MARKET_CAP_RANK_V1`:

- Large Cap = full-market-cap rank 1–100
- Mid Cap = rank 101–250
- Small Cap = rank 251+

PortfolioAI does not derive final categories from arbitrary rupee thresholds.

### Official AMFI source

Production registered `AMFI_OFFICIAL` and ingested the official AMFI 30-Jun-2026 workbook after validating a contiguous 5,427-company full-market-cap rank universe.

The first pass matched 189 / 240 equities by trusted ISIN. A second official-reference fallback matched all 51 remaining equities uniquely by exact NSE symbol against the same validated AMFI universe.

The symbol-fallback live run `b31c04df-11bc-4a37-9e5b-3626f65c2fec` completed `SUCCEEDED`:

- requested: 51
- accepted: 51
- rejected: 0
- conflicting: 0
- Large Cap added: 1
- Mid Cap added: 3
- Small Cap added: 47

Current market-cap classification is therefore:

- 240 / 240 current non-ETF equities = 100%
- Large Cap: 48
- Mid Cap: 54
- Small Cap: 138
- ETF remains a separate Dashboard bucket

The AMFI observations retain source URL, workbook hash, as-of date, rank, INR market cap and identity basis. The owner workbook's rupee-threshold Large/Mid/Small formulas are not used as canonical classification because the active PortfolioAI policy is rank-based.

## UI foundation

The Dashboard now includes:

- Sector allocation donut with explicit ETF and Unclassified slices
- Market-Cap allocation donut with contrasting Large / Mid / Small / ETF colors
- classification coverage displayed in each donut centre
- hover/focus tooltips on donut slices with group name, holdings, current value and portfolio weight
- `Other sectors` tooltip detail showing included sector names
- Sector Performance table
- Market-Cap Performance table
- supported-return and return-contribution semantics
- explicit priced/accounting coverage per row
- sortable holdings / weight / P&L / return / contribution columns
- interactive Sector Performance group/holdings cells that open a floating constituent-stock panel
- constituent panel sorted by unrealised return descending and showing symbol/company, return, unrealised P&L and current value
- `Performance` in the Dashboard Command Index

The interactive allocation layer uses only already-loaded portfolio/enrichment data and makes no provider calls.

## Collapsible Dashboard behavior

Lower-priority sections are collapsible with state stored in browser localStorage:

- Portfolio Risk & Concentration: open by default
- Monitoring & Configuration Coverage: closed by default
- Research & Intelligence Status: closed by default
- Portfolio Intelligence Snapshot: closed by default

Command Index navigation automatically opens a collapsed target.

## Safety boundaries

This stage does not mutate holdings, transactions, roles, targets, or recommendations. Dashboard rendering itself makes no provider calls. Provider-backed enrichment is explicit, bounded, accounted, provenance-preserving, and separate from UI rendering.

The Stage-7 immutable-evidence trigger remains enforced. No safeguard was disabled to complete D21.

## Remaining planned stages

- resolve the remaining 28 sector classifications through trusted owner/provider/reference evidence
- D24/D25: final sector and market-cap performance validation
- D26: allocation-vs-performance matrix
- D30: shared Portfolio Scope behavior
- D31: final coverage/integrity validation
- D32: responsive visual polish and merge
