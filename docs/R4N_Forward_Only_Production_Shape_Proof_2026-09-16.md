# R4N forward-only production-shape proof — 16 September 2026

Status: **DISPOSABLE PROOF PASSED / PRODUCTION UNCHANGED**

## Scope

This proof validates
`20260915190026_reconcile_r4n_research_subprofiles.sql` against a disposable,
schema-only representation of the production public schema captured during the
owner-approved read-only audit.

The migration is additive and limited to the canonical research-subprofile
authority. It does not create assignments, alter scoring, add position sizing,
change cron jobs, invoke a provider, repair migration history or replace existing
classification/reference registries.

## Migration behavior

The migration:

- aborts when only a partial set of the three R4N relations exists;
- creates the contract registry, assignment history and secondary-exposure history;
- creates the approved constraints, indexes and immutable-history triggers;
- enables RLS and restores authenticated read/service-only mutation boundaries;
- inserts the five approved `PHARMA_V1` V1 contract definitions by composite key;
- validates that rows using those keys have the approved display names; and
- creates zero security assignments or secondary exposures.

It is safe on the fresh baseline where the R4N objects already exist: the second
application completed without duplicating registry rows or changing assignment
state.

## Disposable strategy

1. Create the explicitly named disposable database
   `portfolioai_r4n_prodshape_proof` in the local Supabase PostgreSQL cluster.
2. Add only a synthetic `auth.users(id)` shell, a deterministic `auth.uid()` test
   function and the extension schema required to load public foreign keys and
   exclusion constraints.
3. Load the read-only production public-schema dump. No production row data is
   loaded.
4. Assert that the production shape contains 81 public tables and no R4N relations.
5. Apply the reconciliation migration in one transaction.
6. Run the existing R4N pgTAP suite and a transaction-rolled-back deterministic
   owner/portfolio/security/transaction/assignment fixture.
7. Apply the migration a second time to prove safe existing-object behavior.
8. Verify empty fixture state and preservation of the production-only AMFI fallback
   function.
9. Drop the disposable database and delete the temporary fixture script.

## Results

- Migration application: passed.
- R4N pgTAP: 19/19 passed.
- Held-security owner RLS visibility: passed.
- Cross-owner assignment isolation: passed.
- Reviewed-assignment delete rejection: passed.
- Reviewed-assignment in-place rewrite rejection: passed.
- Second application/idempotence: passed.
- Final R4N registry: five contracts, zero assignments, zero secondary exposures.
- Public-table RLS: 84/84 tables enabled after adding the three R4N tables.
- Production-only `invoke_amfi_market_cap_symbol_fallback_v1(text)`: preserved.
- `position_sizing_assessments`: not introduced.
- Fixture rows after rollback: zero auth users, portfolios, securities, transactions,
  assignments and secondary exposures.
- Disposable database: destroyed.

## Lint deviation

Full public-schema lint did not pass because the schema-only production clone does
not contain the production extension/vault schemas and because production retains
the previously confirmed ambiguous `total_position_count` reference in
`get_portfolio_profile_weight_context_v1`. The existing volatility warning on
`get_portfolio_coverage_registry_v1` also remains.

No lint finding points to an R4N reconciliation object. The missing pgcrypto/vault
dependencies are a limitation of loading only the public schema; the ambiguous
function is a genuine, separately documented forward-repair requirement. These
findings were not suppressed or repaired incidentally.

## Remaining gate

This proof does not authorize production application. Before that can be proposed:

1. package and prove the already-confirmed forward repairs against the same
   production-compatible target, including the ambiguous portfolio-profile
   function and NEWS scheduler/policy final state;
2. define an exact deployment mechanism that applies only reviewed forward SQL and
   does not cause Supabase CLI to execute the 46 unrelated local-only versions;
3. capture a verified production backup and exact pre/post queries; and
4. obtain separate explicit production approval for the reviewed SQL and deployment
   mechanism.
