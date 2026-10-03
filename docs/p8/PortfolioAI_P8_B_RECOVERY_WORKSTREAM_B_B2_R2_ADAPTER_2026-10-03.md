# PortfolioAI P8-B Recovery — B2 R2 Historical Identity Adapter

Date: 3 October 2026  
Environment: Development only  
Recovery: single bounded P8-B Recovery  
Status: WORKSTREAM B — HISTORICAL IDENTITY/SOURCE ADAPTER IMPLEMENTED

## Purpose

Bind Workstream B to the existing canonical B2 R2 datasets rather than rebuilding large historical tables in Supabase.

Canonical roots used:

- `portfolioai-history/development/p8/b2/listing-observations/v1/source_date=YYYY-MM-DD/`
- `portfolioai-history/development/p8/b2/universe-members/v1/decision_date=YYYY-MM-DD/`
- `portfolioai-history/development/p8/manifests/v1/TABLE_EXPORT_COMPLETE.json`

## Identity rule

The adapter joins R2 listing observations to the compact Supabase historical identity registry by `historical_identity_id`. It does not require `canonical_security_id`.

Historical alias validity is a deterministic projection over the frozen B2 snapshots:

- starts only when that exact NSE symbol + company-name alias is observed;
- continues only across subsequent frozen snapshots where that alias remains observed;
- closes at the first subsequent frozen snapshot where it is no longer observed;
- never extends backward before first evidence;
- never uses current symbol/name or manual assignment to fill a gap.

This implements the recovery plan's dated-alias / next-observed-change rule without claiming finer daily precision than the B2 source evidence supports.

## Coverage input

Only `membership_state = ELIGIBLE` rows from the canonical B2 universe-members dataset become feasibility-census candidate pairs. INELIGIBLE/BLOCKED rows remain auditable but do not enter the research-signal denominator.

No R2 object was rewritten. No hosted database mutation occurred.
