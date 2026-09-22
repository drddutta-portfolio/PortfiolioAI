# R4N Gate G6.16 — Domestic Formulations Valuation Component Weighting Approval Gate V1

**Status:** Proposal only / explicit approval gate / no three-component weights selected  
**Branch:** `r4n-pharma-subprofile-architecture`

## Purpose

G6.16 addresses the final methodology blocker before a complete Domestic Formulations Valuation dimension can exist.

The three component methodologies are now available:

1. self-history relative valuation;
2. peer-relative valuation;
3. FCF-yield cash-flow corroboration.

Canonical repository inspection found no approved weighting split across these three components.

Therefore G6.16 does not invent one.

## Current state

Dimension:

`VALUATION`

Parent PHARMA_V1 dimension weight:

`12%`

Required components:

- `SELF_HISTORY_RELATIVE_VALUATION`
- `PEER_RELATIVE_VALUATION`
- `CASH_FLOW_CORROBORATION`

Current approved component weighting method:

`null`

Current component weights:

- self-history: `null`
- peer-relative: `null`
- cash-flow corroboration: `null`

## Structural rules for any future approved split

A future weighting contract must:

- be explicitly versioned;
- receive explicit owner approval;
- use finite non-negative weights;
- keep each weight between 0 and 1;
- sum to 1 within deterministic tolerance;
- preserve all three component identities;
- prohibit hidden renormalization when one component is missing unless separately approved.

## No implicit equal-thirds rule

A 33.33/33.33/33.33 split is itself a methodology decision.

It is not assumed.

Therefore:

`equalThirdsDefaultAllowed = false`

## No missing-component renormalization

If one component is unavailable, PortfolioAI must not silently rescale the remaining component weights to 100%.

That would change the approved methodology based on missing evidence.

Therefore:

`missingComponentRenormalizationAllowed = false`

## Candidate review versus approval

G6.16 may validate that a candidate split is structurally valid.

Example:

- self-history 40%
- peer-relative 40%
- FCF corroboration 20%

is structurally valid because the weights are finite, non-negative and sum to 100%.

It is **not approved** by G6.16.

Structural validity is not methodology approval.

## Readiness boundary

Until a component split is explicitly approved:

`whole Valuation dimension ready = false`

and:

`score execution = NO`

## Repository artifacts

Added:

- `src/features/research/pharmaDomesticValuationWeightingGate.ts`
- `src/features/research/pharmaDomesticValuationWeightingGate.test.ts`
- this methodology document

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

## UI review surface

Gate G now includes:

- **G6.16 · Valuation component weighting gate**
- **G6.16 · No implicit equal-thirds rule**

## Explicit boundary

- component weighting selected: **NO**
- equal-thirds default: **NO**
- missing-component renormalization: **NO**
- explicit owner approval required: **YES**
- whole Valuation dimension ready: **NO**
- score execution: **NO**
- production mutation: **NO**

## Next checkpoint

Owner should pull, inspect the G6.16 cards and run focused validation.

After validation, an explicit methodology decision is required for the three-component Valuation split before the Domestic Formulations Valuation dimension can be completed.
