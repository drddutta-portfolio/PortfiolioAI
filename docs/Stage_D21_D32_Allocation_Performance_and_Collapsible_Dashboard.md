# Stage D21–D32 — Allocation Performance and Collapsible Dashboard

## Status

Implementation branch: `dashboard-allocation-performance`

## Production enrichment audit

The canonical enrichment contract already exists through `current_security_enrichment_v1`, `current_security_classification_v1`, and `current_market_cap_category_v1`.

Audit on 2026-09-13 found:

- 272 canonical enrichment rows
- 0 populated sector values
- 0 populated industry values
- 0 populated market-cap values
- 0 populated Large/Mid/Small market-cap categories

Trendlyne `SECURITY_IDENTITY` source records do contain stored `sector` and `industry` fields for a limited pilot subset, but these have not yet been normalized into canonical `security_attribute_observations` / `security_attribute_decisions`. No browser guessing or display-only classification is permitted.

## UI foundation in this stage

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

This UI stage:

- does not create sector or market-cap classifications
- does not make provider/API calls
- does not mutate holdings, transactions, roles, targets or recommendations
- does not estimate missing returns
- does not infer missing classifications
- excludes unclassified securities from classified aggregates and reports coverage explicitly

## Follow-on backend work

D21 canonical enrichment completion must populate sector/industry and market-cap evidence through the existing provenance model. Stored provider evidence may be reused only when the source record can be linked deterministically to a canonical security and preserved with source provenance. Market-cap classification requires a separately validated canonical source and policy; no category should be derived from unsupported browser heuristics.

## Remaining planned stages

- D21: enrichment completion / provenance
- D22: sector allocation activation
- D23: market-cap allocation activation
- D24: sector performance
- D25: market-cap performance
- D26: allocation-vs-performance matrix
- D27/D28: collapsible sections and remembered state
- D29: command-index integration
- D30: shared Portfolio Scope behavior across downstream modules
- D31: coverage/integrity validation
- D32: responsive visual polish and merge
