# R4N Gate G6.6 — Canonical FCF_YIELD_PERCENT Registration & Derivation Proposal

**Status:** Proposal only / repository artifact / not executed  
**Branch:** `r4n-pharma-subprofile-architecture`

## Purpose

G6.5 proved that neither `FCF_YIELD` nor `FCF_YIELD_PERCENT` exists in local persisted definitions or observations.

G6.6 therefore prepares a clean canonical registration and deterministic derivation proposal without migrating or writing any database state.

## Canonical registration

Metric code:

`FCF_YIELD_PERCENT`

Definition:

- value kind: `NUMERIC`
- canonical unit: `PERCENT`
- statement scope: `VALUATION`
- calculation owner: `PORTFOLIOAI`
- freshness: 1 day
- mapping version: `PHARMA_FCF_YIELD_PERCENT_V1`

Legacy alias:

`FCF_YIELD`

The alias is compatibility metadata only. It may never count as a second independent Valuation component.

## Derivation

Formula:

`(FREE_CASH_FLOW_ANNUAL / CURRENT_MARKET_CAP) * 100`

Numerator:

`FREE_CASH_FLOW_ANNUAL`

whose reviewed parent definition is:

`CFO_ANNUAL - CAPEX_ANNUAL`

Denominator:

`CURRENT_MARKET_CAP`

with the existing G6.4 authority boundary:

- current authoritative market-price semantics required;
- stale market cap prohibited;
- provider-only market-cap authority cannot override canonical price authority.

Negative FCF is preserved as negative FCF yield.

Zero, negative or non-finite market cap fails closed.

## Evidence adapter reconciliation

The PHARMA_V1 Valuation evidence adapter now treats:

- `FCF_YIELD_PERCENT` as canonical;
- `FCF_YIELD` as a legacy alias fallback.

Both identifiers together still count as **one** Valuation component, never two.

## SQL proposal safety

The registration SQL is stored at:

`docs/sql/R4N_PHARMA_FCF_YIELD_PERCENT_V1_REGISTRATION_PROPOSAL.sql`

It:

- is not in `supabase/migrations/`;
- begins a transaction;
- performs preflight guards;
- proposes the metric definition;
- verifies postconditions;
- deliberately ends with `ROLLBACK`.

It cannot be applied accidentally by normal Supabase migration tooling.

## Explicit boundary

- canonical definition proposal: **YES**
- deterministic derivation proposal: **YES**
- evidence adapter canonicalized: **YES**
- local database mutation: **NO**
- production database mutation: **NO**
- observations created: **NO**
- numeric FCF-yield score bands: **NO**
- whole Valuation dimension ready: **NO**
- score execution: **NO**

## Next checkpoint

Owner should pull the branch, inspect the G6.6 UI cards, and run focused tests/lint/typecheck/build.

Only after G6.6 validation should a separate checkpoint decide whether to execute the canonical definition locally or proceed first with the Domestic FCF-yield threshold design.
