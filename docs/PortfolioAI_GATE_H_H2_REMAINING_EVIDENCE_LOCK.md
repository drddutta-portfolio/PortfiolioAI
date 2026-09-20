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

Still blocked by:

1. licensed-market-source cross-check required for Brand / Therapy Leadership;
2. minimum three comparable periods of MR/field-force headcount plus compatible domestic revenue required for Field Force Productivity.

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

## Global Generics overlay contradiction

The production secondary exposure is currently recorded as:

- Global Generics materiality state: `MATERIAL`
- confidence: `MEDIUM`
- evidence basis: comparable FY2025-26 standalone revenue share approximately **12.05%**

However, the current G2 eligibility contract used by the owner-approved G7 numeric modifier requires:

`materialOverlayMinimumPercent = 15`

Therefore:

```text
12.05% < 15%
```

and the deterministic G2 eligibility function returns:

`REVIEW_REQUIRED`

with:

`MATERIAL_OVERLAY_REQUIRES_REVIEWED_MATERIALITY`

This is now an explicit H2 contradiction requiring owner/methodology-state reconciliation. No numeric overlay modifier may be produced from the current state.

## Exact actions still required before H2 can close

1. Authorize a market-history provider refresh or equivalent approved canonical import for:
   - TORNTPHARM daily history;
   - NIFTY Pharma daily benchmark history.

2. Authorize the licensed-market source required for Brand / Therapy Leadership.

3. Continue read-only public/official research for:
   - multi-period field-force/MR history;
   - company-wide regulatory scope and subsequent material inspection/remediation context.

4. Resolve the Global Generics classification/eligibility contradiction:
   - reviewed label = MATERIAL;
   - evidence-basis economic share = 12.05%;
   - numeric eligibility minimum = 15%.

5. Establish reviewed Domestic Formulations peer assignments/cohort and current valuation market authority.

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
