# Stage D19 — Dashboard Monitoring & Configuration Coverage

Status: **IMPLEMENTED ON REVIEW BRANCH — OWNER VISUAL APPROVAL PENDING**

## Purpose

Add a read-only Dashboard section that shows how much of the current portfolio is operationally configured and evidenced for continuous monitoring.

This stage intentionally precedes a future Alerts / Calendar / Event Monitoring build. It does not invent future events or alert records that do not yet exist.

## Dashboard content

### Summary coverage

Shows current-holding coverage for:

- assigned portfolio roles
- configured sizing ranges
- configured target-price or stop-loss monitoring
- fresh market evidence
- stored research evidence

### Readiness matrix

Shows coverage for:

- portfolio role assignment
- target weight
- min/max sizing range
- price monitoring
- fresh market data
- stored research evidence
- persisted recommendation/advisory evidence

Watchlisted and frozen holding counts are shown as context.

### Monitoring setup gaps

Ranks up to 12 current holdings with the largest operational monitoring gaps using only UI prioritisation. Possible gaps include:

- no current price
- stale market price
- no stored research evidence
- role unclassified
- target weight not set
- incomplete min/max sizing range
- no target/stop monitoring
- no persisted advisory

The ordering is not stored as a risk score or recommendation.

## Safety boundary

- no Supabase migration
- no Edge Function change
- no provider/API call
- no AI call
- no new alert-generation logic
- no recommendation/scoring execution
- no transaction, holding, role, target, stop-loss or sizing mutation
- no trade/order execution

The component reads existing portfolio state, `portfolio_security_settings`, cached research coverage and persisted recommendation records.

## UI placement

Mounted below Portfolio Risk & Concentration and above Research & Intelligence Status.

## Validation gate before merge

- owner visual review on localhost
- TypeScript/typecheck
- targeted lint for changed TypeScript
- production build
- responsive review
- confirm repository diff remains frontend/docs only
