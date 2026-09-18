# R4N Gate G1 — PHARMA_V1 Adaptive Classification Contract V1

**Status:** Proposal only / no assignment mutation / no score execution  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Canonical parent architecture:** `docs/PORTFOLIOAI_PHARMA_V1_ADAPTIVE_SCORING_CLASSIFICATION_PLAN.md`

## Purpose

Gate G1 converts the adaptive PHARMA_V1 classification architecture into a deterministic, reviewable repository contract before any overlay-scoring implementation continues.

It does not replace the existing reviewed assignment model. It produces a classification proposal that must still pass review before any assignment can become canonical.

## Evidence boundary

Classification evidence must be reviewed.

Accepted evidence tiers are explicitly represented:

1. audited segment evidence;
2. annual-report business-mix evidence;
3. issuer results/presentation evidence;
4. official subsidiary/product/facility evidence;
5. other official/exchange evidence.

Third-party labels do not directly classify a Pharma business.

## Revenue and profit

Both revenue-share and profit-share may be retained.

For Material Overlay determination, either may establish economic materiality.

PortfolioAI preserves the materiality basis as:

- `REVENUE`
- `PROFIT`
- `BOTH`
- `NONE`

If revenue leadership and profit leadership imply different Primary subprofiles, Gate G1 returns:

`REVIEW_REQUIRED`

No automatic tie-breaker is invented.

## Primary classification

A Primary candidate requires:

- stable leadership across **2 consecutive annual periods**;
- reviewed evidence;
- compatible annual periods.

Two non-consecutive annual observations do not satisfy persistence.

If an existing Primary would change, the new Primary cannot be accepted without separately confirmed structural-change evidence.

## Material Overlay

A secondary exposure becomes a Material Overlay only when its economic share is at least **15%** of consolidated revenue or profit for **2 consecutive annual periods**.

One year above 15% remains:

`EMERGING_WATCH`

with reason:

`MATERIAL_THRESHOLD_NOT_YET_SUSTAINED`

## Emerging Watch

Emerging Watch applies when:

- latest reviewed economic share is at least **5%** but below sustained Material Overlay status; or
- separately reviewed evidence explicitly establishes that the exposure is growing toward materiality.

The second path is deliberately evidence-gated. PortfolioAI does not infer “growing toward materiality” from vague commentary.

## Below scoring materiality

Below 5% normally resolves to:

`BELOW_SCORING_MATERIALITY`

This classification does not suppress independent governance/regulatory/risk events from the Interpretation layer.

## Effective dating

Any eventual accepted assignment remains effective-dated.

Gate G1 requires effective dating but does not write assignments or alter the database schema.

## Fail-closed states

The proposal returns `REVIEW_REQUIRED` or `INSUFFICIENT_EVIDENCE` when:

- no reviewed classification evidence exists;
- fewer than 2 annual periods exist;
- the two annual periods are not consecutive;
- revenue and profit imply different Primary leaders;
- Primary leadership is not stable for 2 periods;
- a Primary reassignment lacks structural-change confirmation;
- materiality lacks usable revenue/profit share evidence.

## Repository artifacts

Added:

- `src/features/research/pharmaAdaptiveClassificationContract.ts`
- `src/features/research/pharmaAdaptiveClassificationContract.test.ts`
- this Gate G1 document.

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

The Gate G glass-box now exposes:

- **G1 · Adaptive classification contract**
- **G1 · Fail-closed classification boundary**

## Explicit non-activation boundary

- classification contract: **PROPOSAL ONLY**
- canonical assignment write: **NO**
- schema migration: **NO**
- overlay modifier execution: **NO**
- score execution: **NO**
- persisted score run: **NO**
- recommendation change: **NO**
- position sizing: **NO**
- production mutation: **NO**

## Next checkpoint

Owner should:

1. `git pull`;
2. inspect Gate G → G1 classification cards on localhost;
3. confirm the visual/architectural interpretation;
4. run focused validation.

Only after validation should Gate G proceed to G2 — Overlay Modifier Contract.
