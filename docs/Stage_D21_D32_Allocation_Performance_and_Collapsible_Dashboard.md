# Stage D21–D32 — Allocation Performance and Collapsible Dashboard

## Status

Implementation branch: `dashboard-allocation-performance`

Production enrichment and Dashboard activation are in progress. The UI is visually approved; backend classification coverage has now been materially populated.

## Production enrichment audit

The canonical enrichment contract is `current_security_enrichment_v1`, `current_security_classification_v1`, and `current_market_cap_category_v1`.

Initial audit on 2026-09-13 found 272 canonical enrichment rows but zero normalized sector, industry, market-cap, or Large/Mid/Small classifications.

## D21 sector / industry normalization

### Stored Trendlyne evidence promotion

Migration `20260913154500_promote_stored_trendlyne_sector_industry_evidence.sql` promotes only previously stored, deterministically linked Trendlyne classification evidence.

It:

- seeds `PORTFOLIOAI_INDUSTRY` taxonomy version 1;
- creates only sector/industry values explicitly present in provider evidence;
- creates verified `TRENDLYNE_MCP` source mappings;
- writes append-only `SECTOR` and `INDUSTRY` observations;
- selects current observations through `security_attribute_decisions`;
- performs no ticker/name/theme inference.

This first pass classified 25 current equities.

### Bounded classification cohort

Production then deployed a classification-only Trendlyne refresh with:

- hard per-run maximum: 40 calls;
- existing provider daily limit: 50 internal attempts;
- provider budget reservation and settlement;
- ingestion lease;
- run/run-item accounting;
- one `search_entities` call per target;
- exact canonical symbol + ISIN match required;
- no automatic taxonomy decision for a previously unseen source pair.

The dry run planned 40 highest-current-value unclassified equities and projected daily Trendlyne usage from 4 to 44, within the 50-call limit.

Live run `5d96186d-65c1-4baf-987e-e650c9b11e52` completed `SUCCEEDED`:

- requested: 40
- attempted provider calls: 40
- accepted: 23
- rejected: 17
- failed: 0
- immediately normalized through pre-existing verified mappings: 12
- newly observed exact source-sector/source-industry pairs: 11
- provider usage after the run: 44 / 50 for the UTC day

The 11 new exact pairs were reviewed and mapped by forward migration `20260913163000_verify_new_trendlyne_classification_pairs.sql`. An initial attempt to rewrite provider observations was rejected by the Stage-7 immutability trigger; the final migration preserves the observations unchanged and only adds canonical master values, verified mappings, and current selection decisions.

After mapping, sector coverage is:

- 48 / 240 current non-ETF equities = 20.0% by holding count
- 42.3% of current equity priced value

No further Trendlyne classification calls are made once the daily safety budget is near its limit.

## D21 market-cap classification

The active policy is `SEBI_AMFI_FULL_MARKET_CAP_RANK_V1`:

- Large Cap = full-market-cap rank 1–100
- Mid Cap = rank 101–250
- Small Cap = rank 251+
- missing trusted rank evidence remains unclassified

PortfolioAI does not derive these categories from arbitrary rupee thresholds.

### Official AMFI source

Production registered `AMFI_OFFICIAL` and deployed `refresh-amfi-market-cap-classification` against the official AMFI 30-Jun-2026 workbook:

`https://portal.amfiindia.com/spages/AverageMarketCapitalization30Jun2026.xlsx`

The function validates the workbook before any write:

- contiguous ranks beginning at 1;
- minimum universe size 251;
- duplicate rank/ISIN rejection;
- rank/category consistency;
- byte limit and fetch timeout;
- matching by trusted ISIN evidence rather than ticker inference.

Dry run validation:

- official universe: 5,427 companies
- current non-ETF equity targets: 240
- trusted AMFI matches: 189
- no trusted ISIN: 49
- trusted ISIN not in AMFI universe: 2
- identity conflicts: 0
- planned Large Cap: 47
- planned Mid Cap: 51
- planned Small Cap: 91
- writes: 0

Live run `d367fc34-73d4-4403-9309-ad00bc084229` completed `SUCCEEDED`:

- accepted: 189
- rejected: 51
- conflicting: 0
- failed: 0
- Large Cap: 47
- Mid Cap: 51
- Small Cap: 91
- insufficient-evidence assessments: 2

Current market-cap classification coverage is:

- 189 / 240 current non-ETF equities = 78.8% by holding count
- 80.7% of current equity priced value

The AMFI observations retain source URL, workbook hash, as-of date, full-market-cap rank, INR market cap, and policy evidence. They are fresh through 31-Dec-2026 for this half-year reference list.

## UI foundation

The Dashboard now includes:

- Sector allocation donut with explicit ETF and Unclassified slices
- Market-Cap allocation donut with Large / Mid / Small / ETF / Unclassified
- classification coverage displayed in each donut centre
- leading sector groups plus `Other sectors`
- Sector Performance table
- Market-Cap Performance table
- supported-return and return-contribution semantics
- explicit priced/accounting coverage per row
- sortable holdings / weight / P&L / return / contribution columns
- `Performance` in the Dashboard Command Index

Missing classifications remain visible and are never guessed.

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

- D21: continue classification coverage only within provider/accounting limits
- D22/D23: allocation activation and coverage validation
- D24/D25: sector and market-cap performance validation
- D26: allocation-vs-performance matrix
- D27/D28: collapsible sections and remembered state
- D29: command-index integration
- D30: shared Portfolio Scope behavior
- D31: final coverage/integrity validation
- D32: responsive visual polish and merge
