# Stage 7.2A — Provider Control Plane Completion

**Status:** Implemented, deployed and fully validated 2026-09-09
**Scope:** Provider control plane only; no Cohort A or Stage 7.2B work

## Implemented

- Provider ingestion and future-scheduler kill switches.
- Configurable PortfolioAI internal limits: 100 attempts per UTC day, 1,500 per
  rolling 30 days, 40 per logical run and one active orchestration.
- Warning, caution, conservation and hard-stop thresholds at 60%, 75%, 90% and
  100%, plus a configurable consecutive-failure threshold.
- Concurrency-safe service-only reservation and idempotent settlement RPCs.
- Append-only provider-call accounting and audited control changes.
- Per-security/domain run items and mutable refresh-state projections.
- Versioned freshness policies, including disabled news, events and technical data.
- Authenticated safe operational summary with actual quota shown as `UNKNOWN`.
- Kill-switch enforcement before MCP client construction.

These limits are PortfolioAI safety controls, not Trendlyne contractual quotas.

## Schema and RPCs

Migration `20260909100000_create_stage7_2a_provider_control_plane.sql` adds seven
control-plane tables, additive nullable run columns, and these RPCs:

- `set_provider_ingestion_control_v1`
- `reserve_provider_budget_v1`
- `settle_provider_budget_v1`
- `record_provider_usage_event_v1`
- `record_refresh_item_result_v1`
- `get_provider_operational_summary_v1`

Mutation RPCs are service-role only. Browser roles have no direct mutation grants.
Control and usage events reject updates and deletes.

## Kill switch and evidence preservation

When `ingestion_enabled=false`, the trusted function records a safe skipped run and
returns before constructing or calling the provider client. Cached evidence remains
readable. Transactions, holdings, accounting, roles, themes and Angel One prices
are independent and unchanged.

## Validation

- Clean linked-schema baseline replay in the disposable database: passed.
- Migration application and disposable schema lint: passed with no errors.
- pgTAP: 45/45 assertions passed.
- Two-session concurrency: first reservation succeeded; the second returned
  `CONCURRENCY_LIMIT` after serialization.
- Linked migration history synchronized through `20260909100000`.
- Linked public-schema lint: passed with no errors.
- Edge tests: 62/62 passed, including four control-contract tests.
- Full application Vitest suite: 153/153 passed across 27 files, including both
  jsdom UI suites.
- Application and Node TypeScript project checks: passed.
- Application ESLint and Edge ESLint: passed.
- Vite production bundle: passed with the pre-existing chunk-size warning.
- The jsdom and ESLint startup stalls were synchronous reads of changing package
  files in the existing local `node_modules` installation. Reinstalling the exact
  lockfile with `npm ci` repaired the local dependency tree without changing any
  package version or runtime application behavior.
- Linked CLI pgTAP runs no assertions because its temporary login role lacks `USAGE`
  on the existing `extensions` schema; failure occurs at `extensions.plan(45)`.
  Production privileges and RLS were not weakened. Disposable pgTAP/RLS plus linked
  migration-history, lint, schema-only dump and object/grant inspection provide the
  safe linked-environment equivalent.
- Linked table estimates reconfirmed the accounting and evidence baseline, with zero
  provider usage events, reservations, run items or refresh-state rows.

Pre/post linked estimates remained 482 transactions, 271 securities, 249 Angel One
mappings, 248 latest prices, 128 fundamental observations, 10 security identity
observations, two themes, 14 theme memberships and zero position settings.

## Known limitations and Stage 7.2B boundary

- No scheduler, event-driven orchestration or broader cohort is implemented.
- Business-day freshness uses a documented bounded 24-hour approximation.
- Existing evidence is not backfilled into the operational refresh projection.
- Research UI, coverage UI, scoring, recommendations and Stage 8 remain deferred.
- Provider control mutation has no browser Settings editor.

No Trendlyne production call was made during Stage 7.2A implementation or
validation.
