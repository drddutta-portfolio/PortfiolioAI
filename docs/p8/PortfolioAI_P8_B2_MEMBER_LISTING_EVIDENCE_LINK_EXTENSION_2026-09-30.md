# PortfolioAI P8-B2 member-to-listing evidence-link extension

Date: 30 September 2026  
Environment: Development only  
Status: **MIGRATION CREATED / LOCAL REPLAY PENDING / HOSTED APPLICATION NOT AUTHORIZED**

## Why this extension exists

The official NSE monthly security masters prove that one ISIN can have multiple contemporaneous line-level equity rows. Across the 32 acquired files, 114,908 duplicate-ISIN groups were observed; every group differed by series and instrument ID, with smaller subsets also differing by symbol and security name.

The original B2 foundation allowed only one `listing_observation_id` on a historical universe member. Using that field as the sole evidence pointer would discard authoritative NSE line-level evidence.

## Additive design

Migration:

`supabase/migrations/20260930170500_add_p8_b2_member_listing_evidence_links.sql`

New append-only table:

`p8_historical_universe_member_listing_evidence`

Each link preserves:

- universe member identity;
- portfolio / experiment / security / decision scope;
- listing observation identity;
- evidence role.

Approved evidence roles:

- `ELIGIBILITY_SUPPORT`
- `IDENTITY_SUPPORT`
- `SYMBOL_SERIES_VARIANT`
- `DELISTING_SUPPORT`
- `OTHER_SUPPORT`

New service-only append/select path:

`append_and_select_p8_historical_universe_v2(jsonb,jsonb,jsonb,jsonb)`

V2 creates one member per security identity and leaves the legacy member-level `listing_observation_id` null. Eligibility is proven by one or more immutable evidence links instead.

New owner-scoped `security_invoker` view:

`current_p8_historical_universe_member_listing_evidence_v1`

## Invariants

- no duplicate NSE row is collapsed or deleted;
- one ISIN-level security member can retain many line-level listing observations;
- all linked observations must match portfolio, experiment and security scope;
- every ELIGIBLE member must have at least one `ELIGIBILITY_SUPPORT` observation that is LISTED + PROVEN + valid at the decision instant;
- symbol/series/instrument variants remain auditable;
- run-hash reuse with different member or evidence-link content is rejected;
- link rows are append-only;
- authenticated users receive owner-scoped read access only;
- mutation path is service-role only;
- the legacy single observation pointer is preserved for backward compatibility but is not repurposed by V2.

## Current boundary

No historical universe data is materialized by this migration package. Hosted PortfolioAI Dev application remains separately approval-gated after local migration replay and SQL contract test pass.
