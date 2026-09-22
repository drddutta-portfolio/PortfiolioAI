# R4N Gate G5.6 — PHARMA_V1 Regulatory & Market Risk Framework V1

**Status:** Proposal only / numeric bands unapproved / no score execution  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Canonical parent architecture:** `docs/PORTFOLIOAI_PHARMA_V1_ADAPTIVE_SCORING_CLASSIFICATION_PLAN.md`

## Purpose

Gate G5.6 defines the common PHARMA_V1 **Risk** framework.

The canonical UI already labels this dimension **Regulatory & Market Risk**. The parent Pharma contract directly supplies the regulatory-site evidence lane, while the repository already stores deterministic market-risk evidence from canonical daily market history.

G5.6 joins those evidence lanes conceptually without activating numeric scoring.

## Dimension alignment

Parent metric:

`PHARMA_REGULATORY_SITE_STATUS`

Current parent dimension:

`RISK`

Canonical Gate G dimension:

`RISK`

Alignment state:

`ALIGNED`

No taxonomy reconciliation is required.

## Regulatory risk evidence

The existing parent contract remains conditional on:

`REGULATED_EXPORT_EXPOSURE`

When that condition applies, Risk requires:

- official regulator/issuer evidence;
- current unresolved actions;
- latest material inspection/remediation state;
- site/product/geography scope discipline.

A single site closeout may **not** be promoted into a company-wide regulatory-clearance claim.

This preserves the existing TORNTPHARM Indrad evidence boundary.

## Market-risk evidence already available in the repository

The market-data foundation already provides deterministic derived evidence in:

`market_metric_observations`

using canonical daily OHLCV from:

`market_price_history`

Candidate Risk inputs:

- `MAX_DRAWDOWN_1Y`
- `VOLATILITY_1Y`

Existing definitions:

- Max drawdown: trailing-one-year maximum peak-to-trough decline in daily closing prices.
- Volatility: annualized sample standard deviation of daily log returns using `sqrt(252)`.

These metrics already exist as auditable provider-independent evidence.

However, their **reviewed numeric score rules currently belong to the BANK_NBFC pilot**, not PHARMA_V1.

Therefore:

`PHARMA market-risk score rule state = UNAPPROVED`

No BANK/NBFC curve or threshold is inherited.

## Candidate methodology framework

G5.6 records:

1. `REGULATORY_RISK_CONTEXT`
2. `MARKET_DRAWDOWN`
3. `MARKET_VOLATILITY_CONTEXT`

The following remain unapproved:

- component weights;
- regulatory-risk bands;
- drawdown bands;
- volatility bands.

Volatility additionally requires an approved Pharma peer/benchmark context before normalization.

## Separation from G4

G4 remains the owner of:

- critical regulatory/governance blocking;
- high-risk gate state;
- unknown regulatory materiality review;
- remediation gate interpretation;
- any future transparent governance/regulatory cap.

G5.6 therefore prohibits:

- a second hidden penalty for a G4 critical/blocked event;
- a second hidden penalty for a G4 high-risk event;
- an additional regulatory cap embedded inside the weighted Risk dimension.

Regulatory event context may remain visible for Risk explainability, but the G4 outcome is not numerically re-punished.

## Missing-evidence handling

Missing regulatory or market-risk evidence must not silently become neutral.

Examples:

- regulated-export exposure exists but site status is incomplete → fail closed;
- market history insufficient to derive 1Y drawdown/volatility → not score-ready;
- volatility lacks approved Pharma comparison context → pending/review, not neutral.

## Why no numeric thresholds are created

The repository has evidence derivations, but not a reviewed PHARMA_V1 normalization contract for market risk.

G5.6 therefore does not copy BANK/NBFC thresholds or invent new Pharma bands.

Numeric thresholds remain separately approval-gated.

## Repository artifacts

Added:

- `src/features/research/pharmaRiskCurveProposal.ts`
- `src/features/research/pharmaRiskCurveProposal.test.ts`
- this G5.6 methodology document

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

The Gate G glass-box now exposes:

- **G5.6 · Regulatory & Market Risk framework**
- **G5.6 · G4 separation & market-rule boundary**

## Explicit non-activation boundary

- Risk framework proposal: **YES**
- dimension alignment: **ALIGNED**
- Pharma market-risk rule reviewed: **NO**
- component weights approved: **NO**
- regulatory bands approved: **NO**
- drawdown bands approved: **NO**
- volatility bands approved: **NO**
- G4 second hidden penalty: **NO**
- numeric Risk curve ready: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- production mutation: **NO**
- deployment: **NO**

## Next checkpoint

Owner should:

1. `git pull`;
2. inspect the G5.6 cards on TORNTPHARM → Research → Gate G;
3. confirm the regulatory/market-risk split and G4 anti-double-counting boundary;
4. run focused G5.6 validation.

Only after validation should the final G5 parent family, Momentum, be considered.
