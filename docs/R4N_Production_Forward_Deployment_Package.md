# R4N production forward-deployment package

Status: **DISPOSABLE PROOF + LIVE PREFLIGHT + ALTERNATIVE RECOVERY PROOF + DRY RUN PASSED / PRODUCTION AUTHORIZATION NOT REQUESTED**

## Exact approved migration candidate set

Order is mandatory:

| Version | Migration | SHA-256 |
| --- | --- | --- |
| `20260915190026` | `reconcile_r4n_research_subprofiles` | `17bae04bd9bc613ad3e6a746526b24af5c7998343c0a7e0a490fb3d591104e3d` |
| `20260915193011` | `reconcile_news_policy_final_state` | `4d2bb5128764f4f40bf93b8ce93ca7c85dd449cb422e5ba65c563b07bf6b295c` |
| `20260915193024` | `reconcile_portfolio_weight_context` | `11fbe76699fdaa23d06ca7d84f07626cc4d92632eaac08bcb1ab5e31947d497d` |

No compatibility marker from the ordinary active directory is part of the
candidate set. Compatibility markers generated in an isolated deployment bundle
represent versions already present in the production ledger and contain comments
only; they are never pushed because their versions are already applied.

## Why the ordinary repository must not be pushed

The production audit found 46 active-local versions absent from production. The
Supabase CLI documents that `db push` applies migrations missing from the remote
ledger. Running it from the ordinary repository would therefore exceed the
approved set.

The approved deployment mechanism is an isolated temporary work directory whose
migration directory contains:

1. one comment-only marker for every version currently present in the production
   ledger; and
2. only the three checksum-pinned forward migrations above.

The mechanism does not call `migration repair`, edit
`supabase_migrations.schema_migrations`, or copy any other active-local migration.

## Mandatory read-only preflight

Run and retain the output before asking for production execution approval:

```sql
select version, name
from supabase_migrations.schema_migrations
order by version;

select to_regclass('public.research_subprofile_contracts') as contracts,
       to_regclass('public.research_subprofile_assignments') as assignments,
       to_regclass('public.research_subprofile_secondary_exposures') as exposures;

select source_code, data_domain, policy_version, is_enabled, freshness_basis,
       effective_from, effective_to
from public.refresh_domain_policies
where data_domain = 'NEWS'
order by source_code, policy_version;

select jobid, jobname, schedule, command, database, username, active
from cron.job
order by jobid;

select p.prosecdef, p.proconfig,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute,
       strpos(pg_get_functiondef(p.oid),
              'count(*)::integer as total_position_count') > 0 as ambiguous_alias
from pg_proc p
where p.oid =
  'public.get_portfolio_profile_weight_context_v1(uuid,uuid,text)'::regprocedure;

select 'portfolios' as relation, count(*) from public.portfolios
union all select 'transactions', count(*) from public.transactions
union all select 'securities', count(*) from public.securities
union all select 'fundamental_observations', count(*) from public.fundamental_observations
union all select 'stock_recommendation_runs', count(*) from public.stock_recommendation_runs;
```

Abort if:

- the production ledger differs from the reviewed authorization snapshot;
- any R4N table is present without the other two;
- NEWS V6 is absent or not closed, or NEWS V7 is not the current enabled policy;
- any enabled policy uses `DISABLED` freshness;
- the two cron rows differ from the reviewed names, schedules, commands or active
  states;
- the weight function signature/security mode/access grants differ from the
  reviewed pre-state; or
- the three file checksums differ from this document.

A verified production backup must exist and its restore procedure must be tested or
confirmed before execution authorization.

## Isolated bundle commands

Use a task-specific variable and an authenticated, percent-encoded direct database
URL supplied through an approved secret store:

```bash
R4N_BUNDLE_DIR="$(mktemp -d /private/tmp/portfolioai-r4n-prod.XXXXXX)"
mkdir -p "$R4N_BUNDLE_DIR/supabase/migrations"
cp supabase/config.toml "$R4N_BUNDLE_DIR/supabase/config.toml"
```

Query the production ledger read-only and create one comment-only file named
`<version>_remote_ledger_compatibility_marker.sql` inside the isolated migration
directory for every returned version. Validate that every version is exactly 14
digits and unique. Never copy SQL from ordinary historical migrations into these
markers.

Then copy only the three checksum-pinned files:

```bash
cp supabase/migrations/20260915190026_reconcile_r4n_research_subprofiles.sql \
  supabase/migrations/20260915193011_reconcile_news_policy_final_state.sql \
  supabase/migrations/20260915193024_reconcile_portfolio_weight_context.sql \
  "$R4N_BUNDLE_DIR/supabase/migrations/"

shasum -a 256 "$R4N_BUNDLE_DIR"/supabase/migrations/2026091519*.sql
supabase db push --dry-run \
  --db-url "$PORTFOLIOAI_PRODUCTION_DB_URL" \
  --workdir "$R4N_BUNDLE_DIR"
```

The dry run must say `Would push these migrations:` followed by exactly the three
versions in the table above, in that order. Save the output. Any additional,
missing, reordered or renamed entry aborts the deployment.

Only after separate explicit production authorization may the exact same directory
and connection be used without `--dry-run`:

```bash
supabase db push \
  --db-url "$PORTFOLIOAI_PRODUCTION_DB_URL" \
  --workdir "$R4N_BUNDLE_DIR" \
  --yes
```

Do not use `--include-all`. Do not run from the ordinary repository workdir. Do not
run `migration repair`.

## Mandatory post-deployment validation

Run in this order before any provider or application action:

```sql
select version, name
from supabase_migrations.schema_migrations
where version in ('20260915190026','20260915193011','20260915193024')
order by version;

select count(*) as contracts
from public.research_subprofile_contracts;
select count(*) as assignments
from public.research_subprofile_assignments;
select count(*) as secondary_exposures
from public.research_subprofile_secondary_exposures;

select relname, relrowsecurity
from pg_class
where oid in (
  'public.research_subprofile_contracts'::regclass,
  'public.research_subprofile_assignments'::regclass,
  'public.research_subprofile_secondary_exposures'::regclass
)
order by relname;

select source_code, data_domain, policy_version, is_enabled, freshness_basis,
       effective_to is not null as is_closed
from public.refresh_domain_policies
where source_code='COMPANY_EXCHANGE_FILING'
  and data_domain='NEWS'
  and policy_version in (6,7)
order by policy_version;

select jobid, jobname, schedule, command, database, username, active
from cron.job
order by jobid;

select strpos(pg_get_functiondef(
  'public.get_portfolio_profile_weight_context_v1(uuid,uuid,text)'::regprocedure),
  'count(*)::integer as total_position_count') = 0 as ambiguity_removed,
  has_function_privilege('authenticated',
    'public.get_portfolio_profile_weight_context_v1(uuid,uuid,text)','EXECUTE')
    as authenticated_execute,
  has_function_privilege('anon',
    'public.get_portfolio_profile_weight_context_v1(uuid,uuid,text)','EXECUTE')
    as anon_execute;
```

Expected state: three new ledger rows; five R4N contracts; zero assignments and
exposures; RLS enabled on all three tables; V6 disabled/closed with `DISABLED`
freshness; V7 enabled/current; cron rows byte-for-byte unchanged; ambiguous alias
absent; authenticated execution true and anonymous execution false. Re-run the
preflight business-row counts and require exact equality.

## Recovery plan

- Each migration is transactional. A failure inside one migration rolls back that
  migration and prevents later bundle entries from running.
- If an earlier migration committed and a later one failed, keep its ledger row and
  rerun the same checksum-pinned bundle after diagnosing the failure. The migrations
  are idempotent for their approved final state.
- Never delete a production ledger row or drop an R4N table as an emergency
  shortcut. R4N creates no assignments, so a post-check failure can be diagnosed
  without touching business data.
- Never restore cron by scheduling/unscheduling during this deployment: these
  migrations do not mutate cron. A cron fingerprint difference is evidence of an
  external concurrent change; stop and investigate.
- If the NEWS or function final state must change after a successful deployment,
  create a new reviewed forward migration. Do not edit these applied files.
- If database recovery is required, use the verified platform backup/restore path
  under a separate incident authorization. Do not improvise with a reset or broad
  data dump.

## Disposable validation result

The production public schema was loaded into an explicitly disposable database
with minimum synthetic auth, Vault, pgcrypto, pg_net and cron signatures and only
the NEWS V6/V7, two scheduler rows and one empty portfolio fixture.

- The three forward migrations applied in one ordered transaction.
- R4N plus forward-repair pgTAP passed 35/35.
- The empty portfolio-weight function returned `0|0|0|0|0` without ambiguity.
- NEWS V6 became disabled/closed/`DISABLED`; V7 remained current.
- The cron fingerprint remained `064a4b111379db30be8a3c22c6ee3a9b` before and
  after both direct application and isolated CLI deployment.
- Database lint passed with no errors; the inherited
  `get_portfolio_coverage_registry_v1` volatility warning remains.
- The isolated CLI dry run failed closed when a remote-only ledger version lacked a
  local marker. After adding its comment-only marker, the dry run listed exactly
  the three approved migrations. The disposable push added exactly those three
  ledger rows and no other version.
- Existing fixture rows were preserved and no R4N assignment was created.
- The disposable database and isolated bundle were destroyed.

Production remains unchanged. This document is the review package before any
production authorization request.
