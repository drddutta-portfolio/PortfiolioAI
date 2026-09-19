# R4N Gate G6.12 — Domestic Formulations Peer Premium/Discount & Numeric Normalization Proposal V1

**Status:** Proposal only / per-metric peer normalization / no combined peer score  
**Branch:** `r4n-pharma-subprofile-architecture`

## Purpose

G6.12 defines the peer-relative valuation calculation convention and a proposal-only normalization curve for Domestic Formulations.

It applies independently to:

- `PE_TTM`
- `EV_EBITDA`

It does not yet approve how those two metric-family scores are combined.

## Calculation convention

For each comparable metric family:

`(PEER_MEDIAN_MULTIPLE / TARGET_MULTIPLE - 1) * 100`

### Sign convention

- positive percentage → target trades at a discount to the comparable peer median;
- zero → target trades at the peer median;
- negative percentage → target trades at a premium to the comparable peer median.

Examples:

- target 20x vs peer median 25x → +25% relative discount;
- target 25x vs peer median 20x → -20% relative premium;
- target 20x vs peer median 20x → 0%.

## Fail-closed denominator rules

Both target and peer median multiples must be:

- finite;
- positive;
- economically meaningful under the G6.11 comparability contract.

Zero, negative or invalid multiples do not produce a relative valuation observation.

## Proposed normalization bands

The same relative-value bands are proposed independently for PE and EV/EBITDA:

| Relative discount / premium | Score | Interpretation |
|---|---:|---|
| >= +25% | 100 | Large discount to comparable peer median |
| >= +10% and < +25% | 80 | Meaningful discount |
| >= -5% and < +10% | 60 | Near peer median / neutral |
| >= -20% and < -5% | 40 | Meaningful premium |
| < -20% | 20 | Large premium |

The neutral band deliberately tolerates modest premium/discount noise around the peer median.

## Why the bands mirror the self-history relative curve

G6.2 already uses the same percentage interpretation for valuation relative to the company’s own history.

G6.12 uses the same broad percentage thresholds for peer-relative valuation so that:

- positive means relatively cheaper;
- negative means relatively more expensive;
- the five-point score ladder remains interpretable across relative valuation lanes.

This does **not** mean self-history and peer evidence are interchangeable. Their component weights remain separately unapproved.

## PE and EV/EBITDA remain separate

G6.12 produces at most:

- one PE peer-relative normalized score;
- one EV/EBITDA peer-relative normalized score.

It does not approve:

- simple averaging;
- weighted averaging;
- “best of” substitution;
- one metric replacing the other.

Therefore:

`peerComponentScoreReady = false`

## Relationship to G6.11

G6.12 may only operate after G6.11 comparability is satisfied for the relevant metric family:

- minimum three comparable peers;
- median aggregation;
- like-for-like fresh reviewed evidence.

## Whole Valuation boundary

Even after G6.12, the following remain unresolved:

- PE versus EV/EBITDA weighting inside the peer component;
- weights across self-history, peer-relative and FCF-yield corroboration.

Therefore:

`whole Valuation dimension ready = false`

## Repository artifacts

Added:

- `src/features/research/pharmaDomesticPeerPremiumDiscountProposal.ts`
- `src/features/research/pharmaDomesticPeerPremiumDiscountProposal.test.ts`
- this methodology document

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

## UI review surface

Gate G now includes:

- **G6.12 · Peer premium/discount normalization**
- **G6.12 · Cross-metric combination boundary**

## Explicit boundary

- peer premium/discount formula proposed: **YES**
- PE numeric relative curve proposed: **YES**
- EV/EBITDA numeric relative curve proposed: **YES**
- PE/EV weighting approved: **NO**
- peer-component combined score ready: **NO**
- overall Valuation component weights approved: **NO**
- whole Valuation dimension ready: **NO**
- score execution: **NO**
- production mutation: **NO**

## Next checkpoint

Owner should pull, inspect the G6.12 cards and run focused validation.

Only after validation should the project define PE-vs-EV/EBITDA weighting and then the overall Domestic Valuation component weights.
