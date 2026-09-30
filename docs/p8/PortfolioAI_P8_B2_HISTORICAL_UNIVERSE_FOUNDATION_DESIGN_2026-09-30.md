# PortfolioAI P8-B2 historical universe and listing-validity foundation

Date: 30 September 2026  
Environment: Development only  
Authority: owner-approved P8-B2 design/local-migration scope  
Status: **MIGRATION CREATED / HOSTED APPLICATION NOT AUTHORIZED**

## Purpose

P8-B2 must reconstruct a survivor-free historical NSE equity universe without projecting current holdings, current `securities.is_active`, current classifications, or undated listing rows backward.

The repository migration creates an additive, append-only foundation for:

1. immutable historical listing/delisting observations;
2. immutable decision-instant universe runs;
3. immutable security-level membership dispositions;
4. append-only canonical run selections;
5. owner-scoped, `security_invoker` historical read models;
6. service-only idempotent append/select functions.

## New objects

Migration: `supabase/migrations/20260930061500_create_p8_historical_universe_foundation.sql`

Tables:

- `p8_listing_observations`
- `p8_historical_universe_runs`
- `p8_historical_universe_members`
- `p8_historical_universe_run_selections`

Views:

- `current_p8_historical_universe_run_v1`
- `current_p8_historical_universe_membership_v1`

Functions:

- `append_p8_listing_observation_v1(jsonb)`
- `append_and_select_p8_historical_universe_v1(jsonb,jsonb,jsonb)`
- append-only mutation rejection trigger function

## Bias-control invariants

- No current-holdings fallback exists.
- No current `securities.is_active` fallback exists.
- Existing `security_listings.valid_from/valid_to` rows are not rewritten.
- Unknown historical validity remains `UNKNOWN`.
- `PROVEN` validity requires an explicit `valid_from`.
- ELIGIBLE membership requires a same-owner, same-experiment, same-security LISTED observation with PROVEN validity covering the decision date.
- Later retrieval is acceptable only where an immutable publication archive proves the historical listing interval.
- READY universe runs cannot contain BLOCKED members.
- A globally unreconstructable decision date is represented as a BLOCKED run with an explicit global blocker.
- Corrections are append-and-reselect, never update/delete.
- Canonical selection history is separate from immutable universe content.

## Security model

All four tables have RLS enabled. Authenticated reads require ownership of `portfolio_id`. Browser writes are denied. Append/select functions are service-role only. Both read views use `security_invoker=true`.

## Preservation contract

The migration performs **no data backfill and no current-state mutation**. It does not update:

- `securities`
- `security_listings`
- `transactions`
- current holdings
- P7 evidence snapshots/selections/lineage
- scoring/recommendation/action history
- current classifications or methodology assignments

Historical listing acquisition and any canonical security additions for genuinely historical/delisted instruments are separate, later owner-approved operations.

## Local SQL test

`supabase/tests/p8_b2_historical_universe_foundation.sql` verifies:

- listing-observation idempotency;
- no invented PROVEN validity date;
- append-only mutation rejection;
- decision-instant eligible membership validation;
- run/content and selection repeatability;
- canonical read-view resolution;
- `securities.is_active` preservation;
- `security_invoker` views;
- authenticated read / anonymous deny / service-only mutation privileges.

## Current stop

The migration has been created in the repository only. It has **not** been applied to PortfolioAI Dev.

The current connected session has no local PostgreSQL/Supabase runtime, so the SQL replay test cannot honestly be reported as executed here. Under the P8 handoff protocol, hosted application must not occur until local migration replay/test evidence exists and the owner separately approves the exact hosted migration.
