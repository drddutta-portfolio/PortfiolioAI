# PortfolioAI — Gate H H2 Remaining Evidence Lock

**Date:** 20 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Status:** READ-ONLY BLOCKER LOCK

## Purpose

Freeze the exact remaining H2 blockers after the validated Quality, Growth, Capital Efficiency, Cash Flow, Balance Sheet / Credit, and Ownership / Governance inputs.

This review used the canonical PortfolioAI production database read-only.

No provider refresh or database write was performed.

## Canonical database findings

### TORNTPHARM market evidence

At the 20 September 2026 snapshot:

- `market_metric_observations` rows for TORNTPHARM = **0**
- `market_price_history` rows for TORNTPHARM = **0**

Therefore Momentum and market-risk metrics cannot be derived from existing canonical history.

### Valuation

Available canonical observations include a self-history valuation observation, but the latest located `PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT` value is:

- **-14.87%**
- source: `TRENDLYNE_MCP`
- fresh through: **18 September 2026**

At the 20 September 2026 Gate H snapshot this is stale under the approved Valuation contract.

Current P/E evidence exists, but that does not satisfy the required authoritative current market-price/market-cap semantics.

Production contains only one reviewed PHARMA primary-subprofile assignment:

- TORNTPHARM → `DOMESTIC_FORMULATIONS`

Therefore a reviewed canonical Domestic Formulations peer cohort does not yet exist in production.

Valuation remains fail-closed.

## Business Durability

Read-only public/official research has now completed Field Force Productivity using directly disclosed compatible India observations:

| Period | India field force | India revenue | Derived monthly revenue / MR |
|---|---:|---:|---:|
| FY23 | 5,500 | ₹4,984 crore | ~₹7.55 lakh |
| FY24 | ~5,700 | ₹5,666 crore | ~₹8.28 lakh |
| FY25 | ~6,400 | ₹6,393 crore | ~₹8.32 lakh |

Candidate reviewed state:

`FIELD_FORCE_PRODUCTIVITY = STRONG -> 75`

No employee-total inference is used.

Business Durability is now 3 / 4 components ready and remains blocked only by the licensed-market-source cross-check required for Brand / Therapy Leadership.

No licensed-provider call was made.

## Risk

The existing owner-approved TORNTPHARM regulatory runtime remains:

`REVIEW_REQUIRED`

because company-wide current regulatory scope/materiality and subsequent outcome context remain unresolved.

Market-risk inputs are also absent:

- 1Y max drawdown;
- TORNTPHARM 1Y volatility;
- NIFTY Pharma 1Y volatility;
- relative-volatility ratio.

## Global Generics overlay semantic reconciliation

The production secondary exposure is correctly recorded as:

- Global Generics materiality state: `MATERIAL`
- confidence: `MEDIUM`
- evidence basis: comparable FY2025-26 standalone revenue share approximately **12.05%**

Gate E and the numeric overlay contract use different thresholds for different purposes:

- Gate E business-exposure classification: `MATERIAL` begins at **10%**;
- G2/G7 numeric overlay eligibility: minimum **15%**.

Therefore there is no methodology contradiction:

```text
12.05% >= 10%  -> MATERIAL business exposure
12.05% < 15%   -> BELOW_SCORING_MATERIALITY for numeric overlay
```

The H2 runtime mapping now uses:

`overlayRole = BELOW_SCORING_MATERIALITY`

and the deterministic overlay eligibility state is:

`BELOW_SCORING_MATERIALITY`

No numeric Global Generics modifier is applied.

The Global Generics exposure still remains active for applicability/evidence requirements; it simply does not alter a numeric dimension score at the current economic share.

## Exact actions still required before H2 can close

1. Authorize a market-history provider refresh or equivalent approved canonical import for:
   - TORNTPHARM daily history;
   - NIFTY Pharma daily benchmark history.

2. Authorize the licensed-market source required for Brand / Therapy Leadership.

3. Continue read-only public/official research for:
   - company-wide regulatory scope and subsequent material inspection/remediation context.

4. Establish reviewed Domestic Formulations peer assignments/cohort and current valuation market authority.

The Global Generics 12.05% / 15% issue no longer blocks H2: it is explicitly mapped to BELOW_SCORING_MATERIALITY for numeric overlay participation.

## H2 state

`H2 EXIT ELIGIBLE = NO`

This is an evidence/authorization blocker, not a methodology-design gap.

No overall score may be calculated yet.

## Safety

- production mutation: NO
- evidence write: NO
- provider refresh: NO
- paid/licensed call: NO
- score execution: OFF
- score persistence: OFF
- recommendation: OFF
- sizing: OFF
- deployment: NO
- PR merge: NO
