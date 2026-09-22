# R4N Gate G6.3 — Domestic Valuation Cash-Flow Corroboration Evidence Identity Lock V1

**Status:** Proposal only / blocker surfaced / no numeric thresholds / no score execution  
**Branch:** `r4n-pharma-subprofile-architecture`

## Purpose

G6.3 was intended to evaluate whether Domestic Formulations Valuation could progress from the validated self-history subcurve into the `CASH_FLOW_CORROBORATION` component.

The inspection found a metric-identity ambiguity that must be resolved before numeric thresholds are defensible.

## Confirmed parent methodology

`PHARMA_VALUATION_CONTEXT` already defines Valuation semantically as:

`pe_ev_ebitda_fcf_yield_vs_history_and_peers`

G5.4 also validates FCF yield as a supported evidence family.

Therefore cash-flow corroboration belongs conceptually inside Valuation.

## Concrete metric-code mismatch

Current repository usage is inconsistent:

- Pharma UI references `FCF_YIELD_PERCENT`
- `pharmaScoringEvidence.ts` looks for `FCF_YIELD`

The parent `pharmaResearchProfile.ts` contract does not name a concrete FCF-yield metric code.

A clean canonical registration tying those identifiers together was not found in the current repository inspection.

## Why numeric thresholds are blocked

Before G6 defines an FCF-yield score curve, PortfolioAI needs one versioned canonical contract that states:

1. canonical metric code;
2. formula;
3. unit;
4. denominator price/market-cap authority;
5. FCF period and scope;
6. treatment of negative FCF;
7. alias treatment for legacy/UI identifiers;
8. freshness semantics.

Without this, numeric thresholds would risk scoring different economic quantities under similar names.

## Required reconciliation

G6.3 records the current state as:

`AMBIGUOUS`

Observed identifiers:

- `FCF_YIELD`
- `FCF_YIELD_PERCENT`

Required before numeric thresholds:

- canonical metric definition: **YES**
- canonical formula: **YES**
- canonical unit: **YES**
- alias reconciliation: **YES**

Current approval state for all four: **NO**

## Domestic Formulations boundary

This blocker is attached to the Domestic Formulations Valuation workstream because G6.2 already validated the self-history subcomponent there.

It does not authorize a generic Pharma FCF-yield curve.

## Relationship to G6.2

G6.2 remains valid:

- self-history curve validated / not active;
- whole Valuation dimension not ready.

G6.3 explains one reason the dimension remains incomplete: the cash-flow corroboration metric identity is not yet canonicalized.

## Repository artifacts

Added:

- `src/features/research/pharmaG6DomesticValuationFcfIdentity.ts`
- `src/features/research/pharmaG6DomesticValuationFcfIdentity.test.ts`
- this G6.3 methodology document

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

The Gate G glass-box now exposes:

- **G6.3 · FCF-yield evidence identity lock**
- **G6.3 · Numeric-threshold blocker**

## Explicit boundary

- FCF-yield cash-flow corroboration concept: **VALID**
- concrete metric identity: **AMBIGUOUS**
- numeric thresholds allowed: **NO**
- whole Valuation dimension ready: **NO**
- score execution: **NO**
- persisted score run: **NO**
- production mutation: **NO**

## Next checkpoint

Owner should:

1. `git pull`;
2. inspect the G6.3 blocker cards;
3. validate the blocker contract;
4. only then decide whether to reconcile the FCF-yield metric identity or select another subprofile-specific family.
