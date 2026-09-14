# R2D Portfolio Coverage Production Completion

**Status:** PRODUCTION INTEGRATION COMPLETE — authenticated read-only endpoint  
**Date:** 14 September 2026

## Scope

R2D exposes the Portfolio Coverage Registry to the application through an authenticated, owner-scoped, read-only server boundary. It does not fetch provider data and does not mutate portfolio, research, scoring, recommendation or sizing data.

## Production components

### Database projection

`public.get_portfolio_coverage_registry_v1(p_portfolio_id uuid, p_user_id uuid)`

Properties:

- `STABLE`
- `SECURITY INVOKER`
- explicit portfolio ownership check
- `anon`: no EXECUTE
- `authenticated`: no EXECUTE
- `service_role`: EXECUTE only
- no writes
- no provider calls
- compact aggregate coverage response

Migration:

`20260914075005_r2d_portfolio_coverage_registry_v1.sql`

### Edge Function

`portfolio-coverage-registry`

Properties:

- JWT verification enabled
- requires POST
- validates the current signed-in user with `auth.getUser()`
- independently verifies `portfolio_id` ownership before service-role reads
- invokes only the service-only read projection
- returns `providerCalls: 0` and `budgetConsumed: 0`
- never exposes the service-role credential to the browser

### Application repository

`src/data/portfolioCoverageRegistryRepository.ts`

This provides the shared application access path:

`loadPortfolioCoverageRegistry(portfolioId)`

Presentation code should consume this repository or a later domain hook/view model rather than directly reading service-side coverage/control tables.

## Response scope

For each current open holding, R2D returns compact cached facts including:

- security identity and asset class;
- current quantity;
- canonical application sector, industry and market-cap category from `current_security_enrichment_v1`;
- identity/fundamental/ownership/document coverage metadata;
- compact Angel One daily-history counts and date range;
- reviewed scoring-profile assignment metadata;
- latest persisted score-run metadata when present;
- latest persisted recommendation metadata when present;
- position-sizing persistence availability.

R2D does not return raw OHLCV rows, document bodies, provider raw payloads, budgets, leases or service-control internals.

## Production verification

Verified against the production database after deployment:

1. The correct portfolio owner id returns 249 current open holdings.
2. A deliberately incorrect user id is rejected with SQLSTATE `42501` and `PORTFOLIO_NOT_AUTHORIZED`.
3. Direct execution privilege is absent for both `anon` and `authenticated`.
4. `service_role` has execution privilege.
5. The database function is `SECURITY INVOKER`, not `SECURITY DEFINER`.
6. Registry output reports 0 provider calls and 0 budget consumed.
7. Sector coverage is 240/240 current equities.
8. HDFCBANK sector is `Banking` and market-cap category is `LARGE_CAP`, exactly matching `current_security_enrichment_v1`.
9. HDFCBANK recommendation remains `PREVIEW` with null source score-run lineage; R2D does not upgrade it to canonical score-linked readiness.
10. Sizing persistence remains unavailable because the R1 production sizing persistence migration is not applied.
11. Provider usage events remained 124 before/after verification.
12. Data ingestion runs remained 110 before/after verification.
13. Score runs remained 0 before/after verification.
14. Recommendation runs remained 3 before/after verification.
15. Fundamental observations remained 420 before/after verification.
16. Supabase security advisor did not identify the new R2D function as an exposed SECURITY DEFINER function; it remains service-only SECURITY INVOKER.

## Verification limitation

The tooling session did not possess the owner's live browser access JWT, so a successful end-to-end HTTP request using that exact authenticated browser session could not be executed from the tool environment. The deployed Edge Function uses the same `auth.getUser()` authenticated-session pattern already used by existing production Edge Functions, while the service-only database function and ownership boundary were independently verified in production.

Unauthenticated/bad-session HTTP behavior remains additionally protected by Edge Function `verify_jwt=true` and the in-function authenticated-user check.

## Safety outcome

R2D caused:

- no provider invocation;
- no provider-budget consumption;
- no research-evidence mutation;
- no transaction or holdings mutation;
- no score/recommendation/sizing mutation;
- no broadening of authenticated/anon access to provider-control tables;
- no change to the canonical Dashboard classification authority.

## Completion boundary

It is now valid to say:

- **R2 COVERAGE CONTRACT COMPLETE**
- **R2C READ-ONLY COVERAGE BASELINE COMPLETE**
- **R2D PRODUCTION INTEGRATION COMPLETE — authenticated read-only endpoint**
- **R2E REPOSITORY ARCHITECTURE COMPLETE / MERGED**

It is not valid to say:

- portfolio-wide research complete;
- portfolio-wide market-history complete;
- portfolio-wide scoring/recommendation/sizing complete;
- research automation complete.

The next work returns to R3/R4 evidence breadth and sector/research-profile rollout, under the R2E Single Source of Truth rules and existing provider-control safeguards.
