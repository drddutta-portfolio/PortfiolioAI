# R4N Gate G6.15 — Domestic Formulations Peer Combined Score Contract V1

**Status:** Owner-approved methodology / not active / no score execution  
**Branch:** `r4n-pharma-subprofile-architecture`

## Owner methodology decision

The owner explicitly approved:

- PE peer-relative normalized score weight: **50%**
- EV/EBITDA peer-relative normalized score weight: **50%**

This is an approved starting methodology, not a silent permanent default.

## Combination formula

When both normalized peer-relative inputs are valid:

`Combined Peer Score = (PE Score × 0.50) + (EV/EBITDA Score × 0.50)`

Both inputs remain mandatory.

No single-metric fallback is allowed.

## Rationale

The 50/50 starting point is approved because:

- both evidence families are already mandatory;
- both are independently normalized under the same peer methodology;
- the current evidence base does not support a systematic preference for one over the other.

The absence of evidence for a systematic preference is not treated as proof that 50/50 is permanently optimal.

## Mandatory revisit triggers

### 1. Material PE-vs-EV/EBITDA score divergence in backtesting

Revisit the weighting if later backtesting shows that PE-based and EV/EBITDA-based peer-relative scores materially diverge for the Domestic Formulations peer set.

Current state:

- trigger exists: **YES**
- automatic numeric divergence threshold: **NOT APPROVED**

No numeric divergence threshold is invented at G6.15. Later backtesting should provide the evidence needed to version one if useful.

### 2. Meaningful peer leverage heterogeneity

Revisit the weighting if a Domestic Formulations peer with meaningfully different leverage enters the comparison set.

Examples include:

- an M&A-funded entrant;
- a materially different net-debt profile.

This trigger exists because EV/EBITDA's debt-neutrality becomes more informative when capital structures diverge materially.

## Fail-closed input rule

A combined peer score exists only when both:

- normalized PE peer score is valid;
- normalized EV/EBITDA peer score is valid.

Otherwise:

`INSUFFICIENT_EVIDENCE`

and:

`combinedScore = null`

## Anti-drift rule

The implementation prohibits:

- hidden reweighting;
- single-metric fallback;
- silent replacement of the 50/50 contract.

Any later change requires an explicit versioned methodology revision.

## Readiness boundary

G6.15 makes the **peer-relative component methodology complete enough to calculate a proposal score** when all G6.9–G6.12 prerequisites are satisfied.

It does not make the full Valuation dimension ready.

Still unresolved:

- weighting across self-history relative valuation;
- peer-relative valuation;
- FCF-yield cash-flow corroboration.

Therefore:

`whole Valuation dimension ready = false`

## Repository artifacts

Added:

- `src/features/research/pharmaDomesticPeerCombinedScoreContract.ts`
- `src/features/research/pharmaDomesticPeerCombinedScoreContract.test.ts`
- this methodology document

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

## UI review surface

Gate G now includes:

- **G6.15 · Peer combined score — 50/50 approved**
- **G6.15 · Mandatory weighting revisit triggers**

## Explicit boundary

- 50/50 peer weighting methodology approved: **YES**
- combined peer calculation defined: **YES**
- single-metric fallback: **NO**
- hidden reweighting: **NO**
- backtest-divergence revisit trigger: **YES**
- leverage-heterogeneity revisit trigger: **YES**
- automatic divergence threshold: **NO**
- whole Valuation dimension ready: **NO**
- score execution: **NO**
- persisted score run: **NO**
- production mutation: **NO**

## Next checkpoint

Owner should pull, inspect the G6.15 cards and run focused validation.

After validation, the next Domestic Valuation methodology step is to define the weights across:

1. self-history relative valuation;
2. peer-relative valuation;
3. FCF-yield cash-flow corroboration.
