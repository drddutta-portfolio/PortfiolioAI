# Stage D17 — Dashboard Portfolio Intelligence Snapshot

Status: **IMPLEMENTED ON REVIEW BRANCH — OWNER VISUAL APPROVAL PENDING**

## Purpose

Add a read-only portfolio-level view of the latest persisted recommendation evidence already produced by PortfolioAI.

This stage answers:

> What is PortfolioAI currently saying across the portfolio, and how much of the portfolio has actually been analyzed?

## Dashboard content

### Intelligence coverage

Shows:

- analyzed holdings / current holdings
- analysis coverage percentage
- average persisted score-ready coverage
- count of latest suggested roles that differ from the current user role
- count of confirmed recommendation upgrades / downgrades

### Action-bias distribution

Groups latest persisted recommendation rows by action bias such as:

- Accumulate / Add / Buy
- Hold / Neutral
- Watch / Review
- Reduce / Exit / Avoid

The dashboard does not infer missing recommendations. Holdings with no persisted recommendation run remain explicitly unanalyzed.

### Latest persisted advisories

Shows the latest recommendation evidence for current holdings, including:

- stock
- action bias
- suggested role
- transition status
- change signal when present
- overall score
- score-ready coverage
- age of the persisted recommendation row

Each stock links to its Research workspace.

## Production evidence at stage creation

At implementation time, production contained only **1 latest persisted recommendation row across 240 current holdings**. The panel therefore intentionally exposes low intelligence coverage instead of implying portfolio-wide recommendation coverage.

## Safety boundary

- No Supabase migration
- No Edge Function change
- No provider/API call
- No AI call
- No recommendation/scoring execution
- No role or holding mutation
- No target/stop/sizing mutation
- No trade/order execution

The component reads existing `stock_recommendation_runs` rows only and reuses the authenticated portfolio view.

## UI placement

Mounted below Research & Intelligence Status and above live Portfolio News.

## Validation gate before merge

- owner visual review on localhost
- TypeScript/typecheck
- targeted lint
- production build
- responsive desktop/tablet/mobile review
- confirm frontend/docs-only diff
