# Stage D21–D32 — Allocation Performance and Collapsible Dashboard

## Status

Implementation branch: `dashboard-allocation-performance`

Production enrichment and Dashboard activation are in progress. Allocation visuals are owner-reviewed; market-cap and sector classification are complete for the current non-ETF equity portfolio; D26 allocation-vs-performance positioning is now implemented for review.

## Production enrichment audit

The canonical enrichment contract is `current_security_enrichment_v1`, `current_security_classification_v1`, and `current_market_cap_category_v1`.

Initial audit on 2026-09-13 found 272 canonical enrichment rows but zero normalized sector, industry, market-cap, or Large/Mid/Small classifications.

## D21 sector / industry normalization

### Stored Trendlyne evidence promotion

Migration `20260913154500_promote_stored_trendlyne_sector_industry_evidence.sql` promotes only previously stored, deterministically linked Trendlyne classification evidence.

It seeds the controlled industry taxonomy, creates verified provider mappings, writes append-only SECTOR/INDUSTRY observations and selects current evidence without ticker/name/theme inference.

The initial stored-evidence pass classified 25 current equities. A bounded Trendlyne classification cohort then accepted 23 of 40 planned identities and normalized 11 newly observed exact provider sector/industry pairs while preserving the Stage-7 immutable-evidence trigger.

### Owner STOCK MASTER sector evidence

The owner-provided `PortFolio-1 (1)(3).xlsx` STOCK MASTER sector column was ingested as `STOCK_MASTER` evidence rather than being represented as provider evidence.

That increased sector coverage to 212 / 240 current non-ETF equities (88.3%).

### Final sector-gap review

Migration `20260913172000_complete_sector_gap_review.sql` closes the final 28 sector gaps through owner-reviewed canonical classification evidence. The review uses the owner STOCK MASTER taxonomy where an exact/alternate symbol is available, and otherwise uses current exchange/company/reference evidence recorded in the source payload. It does not infer sectors from ticker names alone.

Current sector coverage is:

- 240 / 240 current non-ETF equities = 100% by holding count
- no remaining canonical sector gaps in the current non-ETF equity portfolio
- ETF remains a separate Dashboard bucket

The final gap review is stored as `OWNER_REVIEWED_CLASSIFICATION` evidence with explicit per-symbol evidence notes/URLs and append-only observations/decisions.

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

Current market-cap classification is therefore:

- 240 / 240 current non-ETF equities = 100%
- Large Cap: 48
- Mid Cap: 54
- Small Cap: 138
- ETF remains a separate Dashboard bucket

The AMFI observations retain source URL, workbook hash, as-of date, rank, INR market cap and identity basis. The owner workbook's rupee-threshold Large/Mid/Small formulas are not used as canonical classification because the active PortfolioAI policy is rank-based.

## UI foundation

The Dashboard now includes:

- Sector allocation donut with ETF and classification coverage
- Sector slices shown individually at 1.5% portfolio weight or above; smaller sectors grouped into `Other sectors`
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

## D26 allocation vs performance matrix

D26 adds a read-only sector positioning matrix below the detailed performance tables.

Transparent classification rules:

- High allocation = sector portfolio weight >= 5%
- Low allocation = sector portfolio weight < 5%
- Strong performance = sector supported unrealised return >= current portfolio supported unrealised return
- Weak performance = sector supported unrealised return < current portfolio supported unrealised return

The matrix surfaces four descriptive quadrants:

- Portfolio strength — high allocation / stronger return
- Review priority — high allocation / weaker return
- Emerging strength — lower allocation / stronger return
- Low-priority drag — lower allocation / weaker return

The panel prints both thresholds, includes allocation and return for every eligible sector, and explicitly states that it does not create buy/sell/add/reduce recommendations. Sectors without supported accounting return are excluded from the matrix rather than estimated.

## Collapsible Dashboard behavior

Lower-priority sections are collapsible with state stored in browser localStorage:

- Portfolio Risk & Concentration: open by default
- Monitoring & Configuration Coverage: closed by default
- Research & Intelligence Status: closed by default
- Portfolio Intelligence Snapshot: closed by default

Command Index navigation automatically opens a collapsed target.

## Safety boundaries

This stage does not mutate holdings, transactions, roles, targets, or recommendations. Dashboard rendering itself makes no provider calls. Provider-backed enrichment is explicit, bounded, accounted, provenance-preserving, and separate from UI rendering.

The Stage-7 immutable-evidence trigger remains enforced. No safeguard was disabled to complete D21–D26.

## Remaining planned stages

- D24/D25: final sector and market-cap performance validation
- D30: shared Portfolio Scope behavior
- D31: final coverage/integrity validation
- D32: responsive visual polish and merge