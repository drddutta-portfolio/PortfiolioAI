# R4N Gate G6.17 — Domestic Formulations Valuation Combined Score Contract V1

**Status:** Owner-approved methodology / not active / no score execution  
**Branch:** `r4n-pharma-subprofile-architecture`

## Owner methodology decision

The owner explicitly approved:

- self-history relative valuation: **40%**
- peer-relative valuation: **40%**
- FCF-yield cash-flow corroboration: **20%**

This is an approved starting methodology, not a silent permanent default.

## Combined Valuation formula

When all three component scores are valid:

`Valuation Score = (Self-History × 0.40) + (Peer-Relative × 0.40) + (FCF Corroboration × 0.20)`

No component is optional.

Missing or invalid component evidence returns:

`INSUFFICIENT_EVIDENCE`

No missing-component renormalization is allowed.

## Rationale

Self-history and peer-relative valuation are treated as co-equal primary lenses because:

- the company's own multi-year valuation history is meaningful for a durable branded-formulations business;
- the peer set contains genuinely comparable branded-formulations companies;
- there is not yet evidence that one relative-value lens is systematically more trustworthy than the other.

FCF-yield remains capped at 20% because it is **corroboration rather than a standalone valuation verdict**.

A single year's FCF may swing because of:

- working-capital timing;
- one-off capex;
- launch-related inventory build;
- acquisition-related cash-flow effects.

Therefore FCF is allowed to matter without dominating the Valuation outcome.

## Upstream dependency — G6.15 → G6.17

The 40% peer-relative component in G6.17 inherits the owner-approved upstream peer combination from G6.15:

- PE peer-relative normalized score: **50%**
- EV/EBITDA peer-relative normalized score: **50%**

Canonical upstream contract:

`PHARMA_DOMESTIC_PEER_COMBINED_SCORE_V1_OWNER_APPROVED`

This cross-reference is explicit so future reviewers can trace the full methodology chain without reconstructing it manually.

## Mandatory revisit trigger 1 — persistent three-component disagreement

Revisit the 40/40/20 split if later evidence shows persistent disagreement across:

- self-history;
- peer-relative;
- FCF corroboration.

Current state:

- revisit trigger: **YES**
- automatic numeric disagreement threshold: **NOT APPROVED**

No threshold is invented until evidence/backtesting supports one.

## Mandatory revisit trigger 2 — FCF structural distortion

Revisit the FCF 20% weight if FCF becomes structurally distorted by:

- capex cycles;
- M&A cycles;
- other recurring cash-flow timing effects.

This trigger exists because FCF corroboration is useful only while the cash-flow signal remains economically representative.

## Mandatory revisit trigger 3 — peer comparability changes

Revisit the 40% peer-relative weight if peer comparability materially becomes:

- weaker; or
- stronger.

A changing peer set may alter how much confidence should be placed in peer-relative valuation versus the company's own valuation history.

## Anti-drift rules

The implementation prohibits:

- hidden component reweighting;
- missing-component renormalization;
- silent replacement of 40/40/20.

Any future change requires an explicit versioned methodology revision.

## Readiness boundary

G6.17 makes the **Domestic Formulations Valuation methodology calculation-ready** when all upstream component prerequisites are satisfied.

It does **not** activate scoring.

Current state:

- combined Valuation methodology: **OWNER-APPROVED**
- activation: **NO**
- score execution: **NO**
- persisted score run: **NO**
- recommendation impact: **NO**
- position-sizing impact: **NO**

## Repository artifacts

Added:

- `src/features/research/pharmaDomesticValuationCombinedScoreContract.ts`
- `src/features/research/pharmaDomesticValuationCombinedScoreContract.test.ts`
- this methodology document

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

## UI review surface

Gate G now includes:

- **G6.17 · Domestic Valuation combined score — 40/40/20 approved**
- **G6.17 · Valuation revisit & upstream dependency**

## Explicit boundary

- 40/40/20 component weighting approved: **YES**
- G6.15 peer 50/50 inherited: **YES**
- combined Domestic Valuation formula defined: **YES**
- missing-component renormalization: **NO**
- hidden reweighting: **NO**
- three revisit triggers: **YES**
- automatic disagreement threshold: **NO**
- activation: **NO**
- score execution: **NO**
- persisted score run: **NO**
- production mutation: **NO**

## Next checkpoint

Owner should pull, inspect the G6.17 cards and run focused validation.

After validation, Domestic Formulations Valuation can be considered methodology-complete / not active, and G6 can move to the next remaining subprofile-specific curve family.
