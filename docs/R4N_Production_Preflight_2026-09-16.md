# R4N production forward-deployment preflight — 16 September 2026

Status: **SQL PREFLIGHT + ALTERNATIVE RECOVERY PROOF + DRY RUN PASSED / PRODUCTION UNCHANGED**

## Scope and controls

The owner authorized continuation of the read-only production preflight for the
three checksum-pinned forward migrations documented in
`docs/R4N_Production_Forward_Deployment_Package.md`.

No migration was applied or repaired. No policy, scheduler, provider, Edge
Function, business row or migration-history row was changed. The ordinary local
database was not changed. A disposable local restore-verification database was
created and destroyed.

## Candidate migration integrity

The reviewed files still match their pinned SHA-256 values:

| Version | SHA-256 |
| --- | --- |
| `20260915190026` | `17bae04bd9bc613ad3e6a746526b24af5c7998343c0a7e0a490fb3d591104e3d` |
| `20260915193011` | `4d2bb5128764f4f40bf93b8ce93ca7c85dd449cb422e5ba65c563b07bf6b295c` |
| `20260915193024` | `11fbe76699fdaa23d06ca7d84f07626cc4d92632eaac08bcb1ab5e31947d497d` |

The linked migration ledger remains on the previously audited divergent state.
None of these three forward versions is present remotely.

## Live SQL preflight

The authenticated Supabase Dashboard SQL Editor returned:

- `research_subprofile_contracts`: absent;
- `research_subprofile_assignments`: absent;
- `research_subprofile_secondary_exposures`: absent;
- `COMPANY_EXCHANGE_FILING / NEWS / V6`: closed, still enabled, freshness
  `ELAPSED_TIME`;
- `COMPANY_EXCHANGE_FILING / NEWS / V7`: enabled, current, freshness
  `ELAPSED_TIME`;
- no enabled policy uses `DISABLED` freshness;
- two active cron rows with the reviewed definitions:
  - `portfolioai-n5-nse-news-30min`, `*/30 * * * *`,
    `select public.invoke_nse_news_pipeline_scheduled_v1();`;
  - `portfolioai-news-evidence-classification-30min`, `5,35 * * * *`,
    `select public.reclassify_unclassified_news_from_stored_evidence_v1(100);`;
- both jobs use database `postgres`, username `postgres`, and remain active;
- `get_portfolio_profile_weight_context_v1(uuid,uuid,text)` remains
  `SECURITY DEFINER` with `search_path=public`;
- authenticated and anonymous execution are currently available;
- the confirmed ambiguous `count(*)::integer as total_position_count` alias is
  still present.

The live state satisfies the three migrations' explicit prerequisites. The
portfolio-weight repair intentionally preserves `SECURITY DEFINER`, preserves
authenticated execution, removes anonymous execution and replaces only the
ambiguous internal alias.

## Exact business-row preservation baseline

| Relation | Exact rows |
| --- | ---: |
| `portfolios` | 1 |
| `transactions` | 489 |
| `securities` | 273 |
| `fundamental_observations` | 458 |
| `stock_recommendation_runs` | 4 |

Any authorized deployment must reproduce these counts exactly after the three
migrations.

## Backup and restore finding

The Supabase Management API and authenticated Dashboard both report no platform
backup, and PITR is disabled. This fails the mandatory backup prerequisite.

A private temporary logical export was captured outside the repository:

- roles: 765 bytes;
- public/application schema: 439,234 bytes;
- public/application data: 30,153,187 bytes.

The first standalone-database restore could not be proven because Supabase logical
dumps deliberately exclude platform-managed `pg_cron`, `extensions` and `vault`
schemas. The owner then approved a restore-tested alternative recovery artifact.

The production schema and explicitly scoped `public` application data were
restored into a second isolated Supabase stack with migrations and seed disabled.
The single captured owner row from `auth.users` was restored only to validate the
public ownership relationships. Verification found:

- 180 public foreign keys checked with zero orphan references;
- exact preservation of 1 portfolio, 489 transactions, 273 securities, 458
  fundamental observations and 4 recommendation runs;
- 81/81 public tables with RLS enabled;
- all three R4N relations absent, matching production pre-state; and
- NEWS and portfolio-weight function state matching the live preflight.

The verified permission-restricted artifact is stored outside Git at
`/Users/drdibyendudutta/Documents/ChatGPT/PortfolioAI_Backups/portfolioai-production-application-2026-09-16.tgz`
with SHA-256
`a46c7b7a8eb60bedd80340344c0e7bd8d4e282ab2ca4528214688b1271787350`.
The packaged files were extracted and their individual checksums revalidated. The
disposable stack and temporary copies were destroyed.

This artifact proves PortfolioAI application-data recovery. It does not replace a
complete hosted Supabase platform backup: hosted Auth state beyond the referenced
owner, Storage, Vault, migration ledger and `pg_cron` remain platform-managed.

## Final isolated deployment dry run

The current remote ledger contained 93 unique versions. An isolated bundle was
rebuilt with one comment-only compatibility marker per remote version and only the
three checksum-pinned forward migrations. After reusing the linked project's
non-secret IPv4 pooler routing metadata, `supabase db push --dry-run` selected
exactly, and only, these migrations in order:

1. `20260915190026_reconcile_r4n_research_subprofiles.sql`;
2. `20260915193011_reconcile_news_policy_final_state.sql`;
3. `20260915193024_reconcile_portfolio_weight_context.sql`.

The temporary bundle was destroyed. No migration was applied.

## Decision and next gate

The approved alternative recovery proof and isolated dry run are complete.
Production remains unchanged. The next and only remaining gate is separate,
explicit authorization for the production write using a freshly rebuilt bundle.
If production state changes before authorization, repeat the live preflight and
dry run first.
