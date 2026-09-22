# R4N secondary-exposure production gate

Status: **PREPARED, NOT AUTHORIZED, NOT APPLIED**

## Exact target

Only this forward migration is in scope for this gate:

`20260916100032_reconcile_r4n_secondary_exposure_contract.sql`

Pinned SHA-256:

`17715c03fe12ad0fa46d1b09a76bd5aae4828c39336e2f0d57db39d250918605`

The migration is additive and fail-closed. It creates no business rows and aborts if `research_subprofile_secondary_exposures` is non-empty.

## Required live preconditions

Immediately before any authorized deployment, re-check all of the following:

- target version `20260916100032` is absent from `supabase_migrations.schema_migrations`;
- predecessor versions `20260915190026`, `20260915193011`, and `20260915193024` are present;
- `research_subprofile_contracts` has 5 rows;
- `research_subprofile_assignments` has 0 rows;
- `research_subprofile_secondary_exposures` has 0 rows;
- business preservation baseline remains:
  - portfolios: 1;
  - transactions: 492;
  - securities: 273;
  - fundamental_observations: 458;
  - stock_recommendation_runs: 4;
- RLS remains enabled on all three R4N tables;
- authenticated access remains SELECT-only and mutation remains service-role-only;
- NEWS V6/V7 and both production cron definitions remain unchanged;
- a successful encrypted production backup exists and is verified before deployment.

Abort if any precondition differs materially from the reviewed state.

## Isolated deployment mechanism

Use `scripts/buildR4NSecondaryExposureProductionDeploymentBundle.mjs` from the exact reviewed commit. The builder:

- verifies the source migration SHA-256;
- reads the linked remote migration ledger;
- refuses an empty or duplicate parsed ledger;
- refuses deployment if the target version is already present;
- requires the three R4N predecessor versions to be present;
- creates a fresh temporary Supabase workdir;
- creates no-op compatibility markers for every already-applied remote version;
- copies only the single approved target migration into the workdir.

After building the bundle:

1. run `supabase db push --dry-run` from the generated temporary workdir;
2. verify that dry-run selects **exactly one migration**, version `20260916100032`;
3. retain the same unchanged temporary workdir;
4. only after explicit owner authorization, run `supabase db push --yes` from that workdir;
5. do not use `--include-all`, migration repair, ordinary repository-wide `db push`, or migration-history rewriting.

## Required post-deployment validation

If and only if the migration is explicitly authorized and applied, verify immediately:

- remote ledger contains `20260916100032` exactly once;
- `research_subprofile_secondary_exposures` still has 0 rows;
- new columns exist: `assignment_status`, `confidence_state`, `effective_from`, `effective_to`, `reason_code`, `reviewed_by`, `reviewed_at`;
- expected lifecycle/materiality/confidence/effective-interval/reviewer constraints exist;
- reviewer index exists;
- RLS/grants remain unchanged;
- all business preservation counts match the preflight baseline;
- NEWS policy and cron state remain unchanged;
- no assignment, evidence, scoring, recommendation, sizing, provider, scheduler, Edge Function, or application deployment is performed as part of this gate.

## Authorization boundary

This document and the bundle-builder commit do **not** authorize a production migration. They prepare a deterministic, reviewable deployment package only.

Applying the migration requires an explicit owner instruction naming this exact migration. Any later assignment creation, evidence ingestion, scoring, recommendations, sizing, provider execution, scheduler change, application deployment, Edge deployment, or PR merge remains separately gated.