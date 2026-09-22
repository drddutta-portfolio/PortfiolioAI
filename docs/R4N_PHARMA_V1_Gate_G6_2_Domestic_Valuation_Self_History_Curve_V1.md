# R4N Gate G6.2 — Domestic Formulations Valuation Self-History Curve V1

**Status:** Proposal only / subcomponent threshold family / no score execution  
**Branch:** `r4n-pharma-subprofile-architecture`

## Purpose

G6.2 introduces the first genuinely new subprofile-specific numeric threshold family after the G6.1 applicability lock.

Scope:

`DOMESTIC_FORMULATIONS`

Dimension:

`VALUATION`

Subcomponent:

`SELF_HISTORY_RELATIVE_VALUATION`

This proposal does **not** make the entire Valuation dimension score-ready.

## Why Valuation is the first G6 numeric family

Several G5 families still have parent-taxonomy blockers:

- ROCE / Capital Efficiency
- Cash Conversion
- Balance Sheet / Leverage
- Ownership / Governance

Momentum still lacks a dedicated Pharma parent metric contract and approved Pharma benchmark.

Valuation already aligns directly to canonical `VALUATION`, so it can accept a subprofile-specific threshold proposal without bypassing a taxonomy reconciliation.

## Metric

G6.2 uses:

`PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT`

Semantics:

Current P/E compared with the company’s own five-year average P/E, expressed as implied upside/discount context.

This is **self-history relative valuation**, not intrinsic fair value, target price or recommendation.

## Domestic Formulations V1 bands

Proposed score curve:

- implied upside >= 25% → 100
- >= 10% and < 25% → 80
- >= -5% and < 10% → 60
- >= -20% and < -5% → 40
- < -20% → 20

The neutral zone around the historical norm is intentionally broad.

The curve avoids any absolute statement such as “P/E below 20x is cheap.”

## Evidence requirements

Required:

- current authoritative market price;
- current reviewed earnings base;
- preferred five-year self-history;
- stale price prohibited;
- provider valuation labels cannot override market-price authority.

Broken/non-meaningful earnings denominators remain fail-closed under G5.4.

## BANK_NBFC separation

The repository already contains a BANK_NBFC P/E self-history implementation.

G6.2 does **not** inherit:

- the Bank/NBFC 60/25/15 Valuation dimension weighting;
- bank P/B logic;
- valuation-to-ROE logic;
- any bank benchmark assumption.

Only the general idea of a deterministic self-history-relative signal is shared.

The Domestic Formulations bands above are separately versioned under PHARMA_V1.

## What remains unapproved

The G5.4 Valuation framework still requires:

- `PEER_RELATIVE_VALUATION`
- `CASH_FLOW_CORROBORATION`

G6.2 does not assign component weights to those lanes.

Therefore:

- whole Valuation dimension ready: **NO**
- peer-relative component approved: **NO**
- FCF corroboration component approved: **NO**

## Subprofile boundary

This threshold family applies only to:

`DOMESTIC_FORMULATIONS`

It must not silently apply to:

- `GLOBAL_GENERICS`
- `API_BULK_DRUGS`
- `CDMO_CRAMS`
- `BIOPHARMA_BIOSIMILARS`

Those Primary models require separately reviewed valuation threshold contracts.

## Repository artifacts

Added:

- `src/features/research/pharmaDomesticValuationSelfHistoryCurveProposal.ts`
- `src/features/research/pharmaDomesticValuationSelfHistoryCurveProposal.test.ts`
- this G6.2 methodology document

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

The Gate G glass-box now exposes:

- **G6.2 · Domestic valuation self-history curve**
- **G6.2 · Scope & incomplete-dimension boundary**

## Explicit non-activation boundary

- numeric self-history bands proposed: **YES**
- whole Valuation dimension ready: **NO**
- peer-relative component approved: **NO**
- FCF corroboration approved: **NO**
- BANK/NBFC weighting inherited: **NO**
- absolute P/E bands used: **NO**
- activation approved: **NO**
- score execution: **NO**
- persisted score run: **NO**
- production mutation: **NO**

## Next checkpoint

Owner should:

1. `git pull`;
2. inspect the G6.2 cards on TORNTPHARM → Research → Gate G;
3. confirm the numeric self-history bands and the incomplete-dimension boundary;
4. run focused G6.2 validation.

Only after G6.2 is validated should the next Domestic Formulations G6 threshold slice be selected.
