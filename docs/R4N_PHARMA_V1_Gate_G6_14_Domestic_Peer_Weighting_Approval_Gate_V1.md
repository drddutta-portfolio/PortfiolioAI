# R4N Gate G6.14 — Domestic Formulations Peer Weighting Approval Gate V1

**Status:** Proposal only / explicit approval gate / no PE-vs-EV/EBITDA weight selected  
**Branch:** `r4n-pharma-subprofile-architecture`

## Purpose

G6.14 formalizes the final blocker between validated PE/EV peer-relative inputs and a combined peer-component score.

Canonical plan inspection found no approved PE-vs-EV/EBITDA weighting rule.

The permanent R4N rule prohibits inventing scoring weights.

Therefore G6.14 creates an explicit approval gate instead of silently selecting 50/50 or another default.

## Current state

Required normalized inputs:

- `PE_TTM`
- `EV_EBITDA`

Current approved weighting method:

`null`

Current weights:

- PE: `null`
- EV/EBITDA: `null`

Combined peer score:

`NOT READY`

## Structural rules for any future approved weighting

Any future weighting contract must:

- be explicitly versioned;
- receive explicit owner approval;
- use finite non-negative weights;
- keep each weight between 0 and 1;
- sum exactly to 1 within deterministic numerical tolerance;
- prohibit hidden defaults;
- prohibit single-metric fallback unless separately approved.

## Candidate review versus approval

G6.14 may validate that a candidate pair of weights is structurally valid.

Example:

- PE 0.50
- EV/EBITDA 0.50

may be structurally valid because the weights are finite, non-negative and sum to one.

That does **not** make 50/50 approved.

Structural validity is not methodology approval.

## Why equal weighting is not assumed

A 50/50 average is itself a scoring-methodology decision.

The canonical plan does not approve it.

Therefore:

`equalWeightDefaultAllowed = false`

## Whole Valuation boundary

Even after G6.14:

- self-history curve: validated / not active;
- FCF-yield corroboration: validated / not active;
- peer-relative per-metric curves: validated / not active;
- cross-metric readiness: validated / not active;
- PE-vs-EV/EBITDA weight: **UNAPPROVED**;
- overall Valuation component weights: **UNAPPROVED**.

Therefore:

`whole Valuation dimension ready = false`

## Repository artifacts

Added:

- `src/features/research/pharmaDomesticPeerWeightingGate.ts`
- `src/features/research/pharmaDomesticPeerWeightingGate.test.ts`
- this methodology document

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

## UI review surface

Gate G now includes:

- **G6.14 · Peer weighting approval gate**
- **G6.14 · No implicit 50/50 rule**

## Explicit boundary

- PE-vs-EV/EBITDA weighting selected: **NO**
- equal weighting default: **NO**
- candidate structural validation: **YES**
- explicit owner approval required: **YES**
- combined peer score ready: **NO**
- whole Valuation dimension ready: **NO**
- score execution: **NO**
- production mutation: **NO**

## Next checkpoint

Owner should pull, inspect the G6.14 cards, and run focused validation.

After validation, an explicit methodology decision is required before any PE-vs-EV/EBITDA weighting can be versioned.
