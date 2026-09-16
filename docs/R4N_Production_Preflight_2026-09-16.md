# R4N production forward-deployment preflight — 16 September 2026

Status: **SQL PREFLIGHT PASSED / BACKUP GATE FAILED / PRODUCTION UNCHANGED**

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

The files were checksummed and permission-restricted. A full restore could not be
proven in a standalone local database because Supabase logical dumps deliberately
exclude platform-managed `pg_cron`, `extensions` and `vault` schemas on which the
application schema depends. The disposable database was destroyed after the
failed-closed verification attempts. This logical export does not replace a
verified Supabase platform backup.

## Decision and next gate

Production deployment remains blocked. Before requesting execution approval:

1. establish and verify a Supabase platform backup or another owner-approved,
   fully restore-tested recovery artifact;
2. re-run the live read-only preflight if production state changes;
3. rebuild the isolated compatibility-marker bundle from the current remote
   ledger;
4. require the dry run to list exactly the three checksum-pinned migrations; and
5. request separate explicit authorization for the production write.

