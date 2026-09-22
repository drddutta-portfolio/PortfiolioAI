# R4N Gate G6.4 — PHARMA FCF Yield Canonical Metric Contract V1

**Status:** Proposal only / metric identity reconciled in architecture / no migration / no numeric score bands  
**Branch:** `r4n-pharma-subprofile-architecture`

## Purpose

G6.3 identified an ambiguity between:

- `FCF_YIELD`
- `FCF_YIELD_PERCENT`

G6.4 resolves the **architectural identity** of the Valuation cash-flow corroboration metric without activating storage migration or numeric scoring.

## Canonical metric identity

Canonical code:

`FCF_YIELD_PERCENT`

Canonical unit:

`PERCENT`

Legacy alias:

`FCF_YIELD`

The legacy alias may map to the canonical percent metric but must never create a second independent observation or double-count the same economic evidence.

## Formula

Canonical formula:

`(FREE_CASH_FLOW_ANNUAL / CURRENT_MARKET_CAP) * 100`

Calculation owner:

`PORTFOLIOAI`

### Numerator

`FREE_CASH_FLOW_ANNUAL`

Already reviewed in the PHARMA_V1 parent evidence layer as:

`CFO_ANNUAL - CAPEX_ANNUAL`

Requirements:

- latest completed annual period;
- reviewed compatible CFO and capex semantics;
- negative FCF remains valid evidence.

Negative FCF is not clamped to zero or neutral.

### Denominator

Concept:

`CURRENT_MARKET_CAP`

Requirements:

- current authoritative market price must underlie the denominator;
- stale market-cap evidence is prohibited;
- a provider market-cap label may not override the application’s authoritative current-price contract.

G6.4 deliberately does not authorize an unreviewed provider market-cap field as canonical price authority.

## Why `FCF_YIELD_PERCENT` is canonical

The Pharma UI already exposes FCF yield explicitly as a percentage concept, and the economic formula itself is a percentage.

Therefore `FCF_YIELD_PERCENT` is the clearer canonical code.

`FCF_YIELD` is retained only as a legacy alias for compatibility.

## Alias rule

If both identifiers exist for the same underlying observation:

- canonicalize to `FCF_YIELD_PERCENT`;
- do not count both;
- retain source provenance;
- do not silently average conflicting values.

## Relationship to G6.3

G6.3 state:

`AMBIGUOUS`

G6.4 resolves the intended architecture to:

`FCF_YIELD_PERCENT`

But implementation remains proposal-only.

No database migration or historical observation rewrite is authorized in this checkpoint.

## What remains unresolved

G6.4 does **not** approve:

- numeric FCF-yield score bands;
- Valuation component weights;
- peer-relative Valuation methodology;
- whole Valuation dimension readiness;
- production metric migration.

A later implementation checkpoint must reconcile storage/alias behavior before score execution.

## Repository artifacts

Added:

- `src/features/research/pharmaFcfYieldMetricContract.ts`
- `src/features/research/pharmaFcfYieldMetricContract.test.ts`
- this G6.4 methodology document

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

The Gate G glass-box now exposes:

- **G6.4 · Canonical FCF-yield metric**
- **G6.4 · Formula & authority boundary**

## Explicit non-activation boundary

- canonical metric code selected: **YES — FCF_YIELD_PERCENT**
- legacy alias identified: **YES — FCF_YIELD**
- canonical formula proposed: **YES**
- storage migration approved: **NO**
- numeric FCF-yield bands approved: **NO**
- whole Valuation dimension ready: **NO**
- score execution: **NO**
- persisted score run: **NO**
- production mutation: **NO**

## Next checkpoint

Owner should:

1. `git pull`;
2. inspect the G6.4 cards;
3. validate the canonical code/formula/authority boundary;
4. then run focused G6.3 + G6.4 validation.

Only after validation should the project either define Domestic FCF-yield score bands or reconcile the underlying persisted metric aliases.
