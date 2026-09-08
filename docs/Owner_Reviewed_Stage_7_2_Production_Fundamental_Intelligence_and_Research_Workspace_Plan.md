## 1. Repository state verified

- `main` is at commit `028994d7372ff372f72911a62b2396b02a178cf3`, the completed Stage 7.1C milestone.
- The trusted Trendlyne adapter, migration `20260908200000`, Edge contracts, pgTAP coverage, and cached enrichment frontend foundation are present.
- No files, database records, deployments, provider settings, commits, or portfolio data were changed during this review.
- One pre-existing repository-state issue was found: [PortfolioAI_Product_UI_and_Decision_Workflow.md](/Users/drdibyendudutta/Documents/ChatGPT/PortfolioAI/docs/PortfolioAI_Product_UI_and_Decision_Workflow.md) is currently untracked. It should be reviewed and committed as an implementation reference before Stage 7.2 begins.

The canonical boundary and the proposed Stage 7.2 boundary are compatible. Stage 7.2 should operationalize trusted evidence acquisition and presentation—not implement investment scoring or recommendations.

## 2. Stage 7.2 recommended boundary

### In scope

- Conservative production-safe Trendlyne rollout beyond the ten-security pilot.
- PortfolioAI-owned quota and call-budget controls.
- Domain-specific freshness, cooldown, retry, and failure policy.
- Per-call, per-security, per-run, and provider-level observability.
- Controlled Cohorts A, B, and C with explicit stop gates.
- Cache-only `/app/research/:security`.
- Portfolio Research Coverage page.
- Owner-facing refresh controls and cost estimates.
- Conflict, provenance, staleness, missing-data, and review-required presentation.
- Controlled manual orchestration first; scheduled orchestration only after cohort acceptance.
- A reviewed canonical-observation selection policy, without analytical scoring.

### Deferred

- Quality-Growth, Core Selection, Core Health, Satellite Opportunity.
- Valuation, momentum, risk, portfolio-fit, movement, and exit scoring.
- Add/Hold/Reduce/Exit recommendations.
- Investment Committee and AI synthesis.
- Theme Outlook scoring.
- Automated role, theme, position, target, or transaction changes.
- News, SAST, insider-deal, bulk/block-deal, and corporate-event schemas.
- Trendlyne technical data as a market-price substitute.
- Google Drive archival until download and retention rights are specifically verified.
- Full financial statements or long historical charts until period, scope, currency, and series contracts are adequate.

No boundary expansion is recommended.

## 3. Current reusable components

| Component | Current capability | Stage 7.2 reuse |
|---|---|---|
| `data_sources` | Provider activation, entitlement, retention, capabilities | Retain as provider registry; do not place quota counters in JSON |
| `data_ingestion_runs` | Run status and aggregate requested/fetched/failed counts | Extend with scoped operational metadata |
| `data_source_records` | Immutable SHA-256-deduplicated raw evidence | Reuse unchanged |
| `data_ingestion_leases` and RPCs | Operation-level mutual exclusion and cooldown | Reuse beneath an atomic budget reservation layer |
| `security_identity_observations` | Immutable matched provider IDs | Reuse as the first identity lookup |
| `fundamental_metric_definitions` | Provider-neutral metric dictionary | Extend only after semantic review |
| `fundamental_observations` | Exact-decimal, period-aware, immutable evidence | Reuse |
| `fundamental_observation_decisions` | Selected canonical observation relationship | Reuse through a narrowly controlled selection service |
| Reconciliation tables | Competing-observation review and audit | Reuse for genuine like-for-like conflicts |
| Research document tables | Provider-independent metadata and source appearances | Reuse for provisional document discovery |
| Current Stage 7 views | Cache-only selected enrichment | Extend with research-specific projections |
| Trendlyne MCP client/parser | Streamable HTTP, sanitized errors, strict parsing | Refactor into typed domain operations |
| `refresh-security-enrichment` | Authenticated, held-equity-only, ten-security bounded refresh | Preserve as the trusted boundary; add control-plane enforcement |
| Frontend enrichment repository/hook | Cache-only reads and six-state enrichment handling | Reuse patterns, not the narrow DTO |
| App route/shell conventions | Protected routes and lazy-loaded pages | Reuse for Research routes |

## 4. Identified gaps

1. No atomic provider-call reservation or daily/rolling budget enforcement.
2. No append-only record for each attempted MCP tool call.
3. No per-security/per-domain refresh state.
4. No run-item table explaining individual security outcomes.
5. `data_ingestion_runs` lacks explicit portfolio, estimated-call, attempted-call, accepted, conflicting, and skipped counts.
6. Freshness is partly hard-coded by the Edge Function instead of being driven by metric/domain policy.
7. The function fetches before performing a complete stale-domain plan.
8. Multiple actions repeat overview calls that could be shared within one controlled research refresh.
9. Leases are operation-specific; there is no provider-wide concurrency ceiling.
10. Lease release should be guaranteed through structured `finally` handling, while expiry remains crash recovery.
11. Current provider failures do not expose enough safe operational classification for owner diagnostics.
12. Pilot evidence has no selected canonical fundamental decisions; therefore the selected-current view cannot yet power comprehensive Research cards.
13. Existing financial evidence is latest/TTM-heavy and insufficient for annual or quarterly statement tables and long-term charts.
14. Annual CFO and ROE currently lack adequate period metadata.
15. Adjusted P/B is deliberately conflicting and cannot be displayed as generic P/B.
16. Document records have provisional source identity only; no retained body or content hash exists.
17. No Research repository, page, coverage view, refresh panel, or route exists.
18. No scheduler or event-ingestion source exists.
19. Current classification taxonomy values remain unseeded.
20. The UI workflow document is not yet tracked by Git.

## 5. Proposed schema delta

All changes should be additive and split into reviewable migrations.

| Object | Purpose and rules |
|---|---|
| `provider_ingestion_controls` | One service-managed control row per source: ingestion enabled, scheduler enabled, internal daily and rolling ceilings, warning/conservation thresholds, per-run ceiling, concurrency limit, failure threshold, and policy version. Browser read-only through a safe view. |
| `provider_control_events` | Append-only audit of kill-switch, scheduler, budget, and temporary-override changes, including actor, reason, old/new state, and expiry. |
| `provider_budget_windows` | Mutable operational counters for daily and rolling windows: reserved, consumed, failed, and released units. Service-only. Atomic checks prevent oversubscription. |
| `provider_usage_events` | Append-only record of every attempted tool call: run, security, domain, tool class, estimated units, outcome, safe error code, attempt/completion time, and nullable provider-reported units. |
| `data_ingestion_run_items` | Per-security/per-domain status: skipped fresh, attempted, accepted, unchanged, conflicting, rejected, or failed; includes call counts and safe reason codes. |
| Alter `data_ingestion_runs` | Add nullable `portfolio_id`, orchestration type, estimated/reserved/attempted call counts, accepted/conflicting/rejected counts, trigger source, and policy version. Existing history remains valid. |
| `security_refresh_states` | Operational cache keyed by source/security/domain: last attempt, last success, last evidence change, fresh-until, next eligible time, consecutive failures, last safe error, and last run. It never replaces immutable evidence. |
| `refresh_domain_policies` | Versioned domain freshness/cooldown/retry policy rather than hard-coded Edge values. |
| `reserve_provider_budget_v1` | Service-only atomic RPC that checks kill switch, concurrency, window ceilings, and worst-case estimated calls before reserving capacity. |
| `settle_provider_budget_v1` | Service-only RPC that converts reservations into consumed/failed/released units idempotently. |
| `record_refresh_item_result_v1` | Service-only atomic run-item/refresh-state update with validated transitions. |
| `provider_usage_summary_v1` | Safe browser-readable usage summary; actual provider quota remains nullable/unknown. |
| `portfolio_research_coverage_v1` | Security-level cached coverage, freshness, conflict, review, last-success, and next-eligible projection restricted by portfolio ownership. |
| `research_security_snapshot_v1` | Cache-only detail projection combining identity, selected evidence, provider evidence counts, ownership, documents, and status. |
| Optional `research_document_identity_decisions` | Append-only review decision for provisional document candidates. Do not mutate immutable document evidence to simulate verification. |
| Metric-definition additions | Only after field-by-field annual/quarterly contract validation. Each definition must state period types, unit, currency, scope requirements, sector applicability, and selection policy. |

### RLS and retention

- Control-plane writes and all budget RPCs: service role only.
- Authenticated users: safe read projections restricted to their portfolio/history.
- Usage and run details must not expose provider request bodies or credentials.
- Evidence and usage events are append-only.
- Mutable budget windows and refresh states are operational projections, rebuildable from events where practical.
- Rollback in production means disabling new behavior and leaving additive objects dormant, not dropping evidence-bearing tables.

## 6. Quota and freshness policy

### Quota representation

Maintain three separate concepts:

- `provider_quota_status = UNKNOWN`: honest representation until Trendlyne supplies authoritative quota metadata.
- `internal_safety_budget`: owner-approved PortfolioAI ceiling.
- `observed_usage`: actual PortfolioAI tool-call attempts.

Do not label internal ceilings as Trendlyne plan limits.

### Conservative initial internal budget

Recommended starting policy, subject to owner approval:

- Daily ceiling: **100 tool-call attempts**.
- Rolling 30-day ceiling: **1,500 attempts**.
- Per logical orchestration run: **40 attempts**.
- Per Edge invocation: retain **10 securities maximum**.
- Provider-wide concurrency: **one active Trendlyne orchestration**.
- Warning: 60%.
- Caution: 75%.
- Conservation: 90%.
- Hard stop: 100%.

A failed `tools/call` attempt consumes one internal unit because external billing behavior is unknown. MCP initialization/transport requests should be counted separately as transport diagnostics, not silently treated as known provider quota units.

### Operation ceilings

- Identity: up to 10 securities/invocation; reserve up to three calls for an unmapped security.
- Fundamentals: 10 securities and normally one overview call each.
- Ownership: 10 securities; reserve two calls each while overview identity revalidation is required.
- Documents: initially three securities and two calls each.
- Manual combined research refresh: show the conservative worst-case estimate before execution.
- News, events, and technicals: disabled in Stage 7.2.

### Retry policy

- Identity conflicts, malformed responses, semantic validation errors, and HTTP 4xx other than 408/429: no automatic retry.
- 408, 429, transient network, and 5xx errors: at most three attempts with jittered backoff.
- Suggested backoff: 30 seconds, 2 minutes, 10 minutes.
- For explicit provider throttling, honor a safe `Retry-After`; otherwise defer 15 minutes, then 1 hour, then 4 hours.
- Every attempt consumes the internal budget.
- Abort a run after five consecutive provider failures or a failure rate above 20% once ten calls have been attempted.
- Two unexpected-security responses in one cohort should stop the cohort immediately.

### Manual override

A service-side owner operation may temporarily increase an internal ceiling or permit a high-priority refresh. It must:

- be time-limited;
- state the added allowance;
- include an owner and reason;
- be append-only audited;
- never bypass identity, RLS, asset-class, or hard provider-disable rules;
- never claim the external quota is safe.

### Freshness model

| Domain | Initial policy |
|---|---|
| Verified provider identity | 180 days; refresh on identifier conflict, symbol/ISIN change, or explicit review |
| TTM fundamentals | Seven days, plus filing/result-driven refresh |
| Annual metrics | 90 days; filing-driven preferred |
| Quarterly metrics | 30 days; result-driven preferred |
| Valuation evidence | One business day; evidence only, not Angel One price |
| Ownership | 45 days or new shareholding filing |
| Document discovery | Event-driven; seven-day backstop for selected holdings |
| News | Deferred |
| Corporate events | Deferred until the observed provider mode is reliable and schema is approved |
| Technical/market evidence | No scheduled Trendlyne refresh; Angel One remains authoritative |
| Raw market cap | One business day, provisional provider evidence only |

Metric definitions should drive `fresh_until`; the Edge Function should not apply one blanket duration.

### UI status meanings

- **Fresh:** accepted cached evidence within policy.
- **Stale:** valid cached evidence beyond `fresh_until`.
- **Missing:** no usable evidence exists.
- **Conflicting:** competing or semantically disputed evidence exists.
- **Review required:** evidence is retained but needs an explicit decision.
- **Failed refresh, cached fallback:** the latest attempt failed, but older valid evidence remains visible with its age and failure banner.
- **Unavailable:** evidence cannot be used because required value, period, scope, unit, or identity is absent.

## 7. Production cohort rollout

### Cohort A — 25 securities

Include the ten pilot names plus 15 owner-approved open equities selected deterministically across:

- banks/NBFCs and non-financial companies;
- large, mid, small, and unavailable market-cap classifications;
- clean and incomplete accounting histories;
- strong and weak provider search coverage;
- portfolio roles if assigned.

The current verified snapshot had no position-setting rows, so Core/Satellite diversity may be impossible until the owner assigns roles. The selection report must state this rather than inventing classifications.

### Gate from A to B

- 100% equity/open-holding/scope validation.
- Zero unexpected securities accepted.
- At least 24/25 identities verified; every unresolved item quarantined.
- Zero duplicate verified provider IDs.
- Zero silent null-to-zero conversion.
- 100% of newly mapped fields reviewed against their semantic contracts.
- Adjusted P/B remains separately conflicting.
- Provider-call usage within the reserved estimate, allowing only documented retry variance.
- Provider-call failure rate no more than 5%.
- No document automatically promoted from `REVIEW_REQUIRED`.
- No browser live-provider calls.
- No cross-user RLS disclosure or mutation.
- No accounting, holdings, role, theme, or Angel One count/value changes.
- Cache page p95 target below 500 ms for the cohort on the linked environment.
- Structured storage growth measured and confirmed body-free.

### Cohort B — approximately 75 securities

Add 50 eligible equities, stratified using the same rules. Proceed only after Cohort A review is signed off.

Gate:

- At least 97% verified identity coverage.
- Zero incorrect identity acceptance.
- No unresolved duplicate or idempotency defects.
- Provider failures no more than 5%.
- Non-predeclared semantic conflict rate below 5%.
- Budget state stays below conservation threshold.
- Research and coverage queries remain within agreed performance targets.
- No security/RLS or portfolio regressions.

### Cohort C — remaining eligible open equities

Exclude ETFs and all non-equities. Refresh only stale or missing domains, not every domain for every holding.

Gate:

- At least 98% verified identities among eligible equities.
- All exceptions explicitly unresolved, conflicting, or review-required.
- No mandatory gate regression from Cohorts A/B.
- Owner approval after reviewing projected call cost and exceptions.

## 8. Research Workspace design

Route: `/app/research/:security`

Normal page loading must query Supabase views/repositories only.

| Section | Initial Stage 7.2 presentation |
|---|---|
| Overview | Canonical identity, Angel One CMP, position/accounting context, role/themes, available sector/category, raw Trendlyne market cap, coverage and freshness. Provider market cap must not replace CMP. |
| Financials | Honest latest/TTM cards for revenue, PAT, CFO, and ROE where available. No comprehensive statement table or 3Y/5Y chart until period series are trustworthy. |
| Quality & Growth | “Not yet scored.” Show input-coverage checklist only—available, missing, or semantically incomplete. No derived CAGR, cash conversion, or quality conclusion. |
| Ownership | Latest quarterly aggregate values and period labels. History appears only when multiple period-qualified observations exist. Pledge denominator is shown explicitly. |
| Valuation | Raw market cap and P/E evidence. Adjusted P/B appears only as “Provider adjusted P/B — conflicting/not equivalent to generic P/B.” No valuation state or recommendation. |
| Documents | Provisional source appearances grouped by type/date/provider, with `REVIEW_REQUIRED`. “Open” is unavailable unless a lawful external reference/archive exists. |
| Evidence | Selected observation, provider observations, competitors/conflicts, source field, period, scope, unit/currency, publication/retrieval time, freshness, and review state. |

Each card needs a consistent drawer or expandable evidence panel. Missing values show “Unavailable” plus a reason—not blank, zero, or placeholder estimates.

## 9. Research Coverage design

Create `/app/research` as the owner’s portfolio-level research coverage page.

Recommended columns:

- Security and asset class.
- Portfolio role and themes.
- Fundamental, ownership, valuation, and document coverage.
- Overall freshness.
- Conflict count.
- Review-required count.
- Last successful refresh.
- Last attempted refresh.
- Next eligible refresh.
- Latest safe failure state.
- Estimated refresh cost.

Filters:

- Fresh, stale, missing, conflicting, review required.
- Core, Satellite, Unclassified.
- Theme.
- Sector.
- Market-cap category.
- Equity eligibility.
- Provider identity status.

This belongs under **Research**, because coverage gaps are part of the research workflow. Operational controls—budgets, scheduler, kill switch, overrides, and run diagnostics—belong under **Settings → Data Sources / Refresh**.

## 10. Refresh orchestration

Recommended flow:

`Eligible open equities`
→ `derive stale/missing domains`
→ `rank priority`
→ `estimate worst-case calls`
→ `reserve budget atomically`
→ `acquire provider/domain lease`
→ `create run and run items`
→ `use existing verified identity or resolve strictly`
→ `call only required tools`
→ `retain immutable source evidence`
→ `normalize recognized fields`
→ `quarantine ambiguity/conflict`
→ `settle usage`
→ `update refresh state`
→ `complete run`
→ `release lease in finally`

Priority:

1. Known result/filing requiring refresh.
2. Stale Core holding.
3. Stale Satellite holding.
4. Held equity with major research gaps.
5. Owner-selected manual refresh.
6. Periodic backstop.

Until roles exist, items 2 and 3 collapse into owner priority and evidence-gap ranking. Accounting completeness may be shown as portfolio context but should not influence whether global company evidence is semantically valid.

## 11. Testing and security plan

### Unit and adapter tests

- Budget thresholds, reservations, settlement, window rollover, warning states.
- Call estimation and failed-call accounting.
- Fresh/stale/missing/conflicting/fallback state transitions.
- Retry classification and jitter bounds.
- Existing mapping reuse and provider-name fallback.
- MOTHERSON/MSUMI, BBOX, identifier changes, and semantic-neighbor rejection.
- Every approved metric’s unit, period, scope, null, and conflict behavior.
- Document appearance and version/dedup behavior.
- No full document body persistence.

### Database and integration tests

- Concurrent budget reservations cannot exceed a ceiling.
- Concurrent leases permit only the intended provider/operation concurrency.
- Expired reservations and leases recover safely.
- Run and run-item transitions are idempotent.
- Browser roles cannot mutate controls, usage, runs, evidence, selections, or documents.
- Unrelated users cannot read portfolio coverage, refresh state, documents, or run details.
- Service RPCs validate portfolio ownership and eligible open equity scope.
- Cached fallback remains readable after provider failure.
- Selected observations always reference valid compatible evidence.
- Provisional and conflicting evidence cannot silently become selected.

### UI tests

- Research route is cache-only.
- No render, navigation, tab switch, or filter triggers an Edge refresh.
- Every unavailable/conflict/review/stale state is rendered explicitly.
- Adjusted P/B cannot render under a generic P/B label.
- Coverage filters and drill-down preserve portfolio ownership.
- Manual refresh shows a conservative call estimate and confirmation.

### Regression gates

Before and after every cohort compare:

- transaction count and immutable transaction hashes;
- current holdings quantities;
- accounting basis and P&L outputs;
- broker accounts;
- roles and position settings;
- themes and memberships;
- Angel One mappings and price observations;
- security asset classes;
- Stage 4–7 RLS behavior.

## 12. Rollback/kill strategy

### Provider kill switch

Set `provider_ingestion_controls.ingestion_enabled=false` through a service-only audited owner operation. Existing cached evidence remains readable.

### Scheduler

Set `scheduler_enabled=false`, then pause/remove the scheduled invocation. Manual refresh can remain separately disabled or enabled by policy.

### Application code

Redeploy the last known-good function/frontend version. Additive database objects remain compatible and dormant.

### Provider activation

Prefer the new operational kill switch over changing historical activation evidence. If provider deactivation is required, perform it through an audited trusted operation; never delete activation or usage history.

### Migrations

Before production application, validate in disposable local environments. After production application, do not drop evidence tables as routine rollback. Use a new forward migration only if correction is required.

### Partial run

- Mark the run `PARTIAL` or `FAILED`.
- Preserve valid evidence already committed.
- Record individual failed/skipped items.
- Set next-eligible times according to failure policy.
- Settle unused reservation units.
- Release the lease in `finally`; lease expiry remains crash recovery.
- Never roll back by deleting valid prior evidence.

None of these actions affects transactions, holdings, accounting, themes, roles, or Angel One prices.

## 13. Stage 7.2A–F implementation sequence

### 7.2A — Control plane

- **Purpose:** Budget, usage, run-item, freshness, kill-switch, and override architecture.
- **Schema:** Control, usage, refresh-state tables, RPCs, and safe views.
- **Backend:** Pure quota/freshness modules; no provider calls.
- **UI:** Settings read-only status panel may be stubbed from real cached controls.
- **Gate:** Concurrency, RLS, rollover, and recovery tests pass.
- **Rollback:** Disable new controls; no evidence affected.

### 7.2B — Adapter hardening and Cohort A

- **Purpose:** Replace pilot orchestration assumptions with budgeted, freshness-aware operations.
- **Schema:** Only approved metric-definition additions.
- **Backend:** Typed domain responses, shared overview calls where safe, guaranteed lease settlement.
- **Provider calls:** Exactly the approved 25-security cohort.
- **Gate:** Cohort A criteria above.
- **Rollback:** Kill switch; cached pilot and accepted cohort evidence remain.

### 7.2C — Canonical evidence policy and Research Workspace

- **Purpose:** Present evidence honestly and define which observations can be selected.
- **Schema:** Research snapshot views; optional trusted selection RPC.
- **Backend:** Research repository and DTOs.
- **UI:** `/app/research/:security` with staged sections.
- **Provider calls:** None from normal UI.
- **Gate:** Cache-only, evidence-status, and semantic-label tests.
- **Rollback:** Remove route/redeploy frontend; evidence remains.

### 7.2D — Research Coverage and operations UX

- **Purpose:** Portfolio-wide research gaps and owner-visible operational state.
- **Schema:** Coverage and usage summary views.
- **Backend:** Coverage repository and refresh-cost estimator.
- **UI:** `/app/research`; Settings control/run panel.
- **Provider calls:** Only explicit confirmed refresh actions.
- **Gate:** RLS, filters, estimates, and no-auto-refresh tests.
- **Rollback:** Disable manual refresh action; cached coverage remains.

### 7.2E — Cohorts B and C

- **Purpose:** Expand only after measured acceptance.
- **Schema/backend/UI:** No architectural redesign.
- **Provider calls:** Approximately 75, then remaining eligible open equities, split into bounded stale-domain batches.
- **Gate:** Each cohort requires a separate acceptance report and owner authorization.
- **Rollback:** Kill switch and stop at last accepted cohort.

### 7.2F — Scheduled/event-driven orchestration

- **Purpose:** Controlled recurring refresh of stale or event-relevant domains.
- **Schema:** Schedule metadata only if existing platform scheduling cannot provide sufficient auditability.
- **Backend:** Scheduler entry point reusing the same budget/orchestrator service.
- **UI:** Next run, last run, pause state.
- **Provider calls:** Budgeted and freshness-filtered.
- **Gate:** Dry-run planning, duplicate schedule protection, kill-switch, failure, and recovery tests.
- **Rollback:** Disable scheduler without affecting manual access or cached evidence.

## 14. Stage 7.2 Definition of Done

Stage 7.2 is complete only when:

- Internal quotas are atomic, auditable, configurable, and never presented as provider contractual quotas.
- Kill switch and scheduler disable work without losing cached evidence.
- Every call and per-security outcome is accounted for.
- Freshness is domain/metric-policy driven.
- Cohorts A, B, and C pass separately approved gates.
- No ETF/non-equity receives equity fundamental ingestion.
- Research detail and coverage pages are cache-only.
- Selected, provider, conflicting, stale, missing, and provisional evidence are visually distinct.
- No incomplete metric set is presented as a full financial statement.
- Documents remain provisional unless canonical identity is independently established.
- All security/RLS, type, lint, build, Vitest, pgTAP, migration, secret, and regression gates pass.
- Transactions, holdings, accounting, roles, themes, and Angel One pricing remain unchanged.
- Stage 8 remains unimplemented.

## 15. Immediate next step after approval

Approve and implement **Stage 7.2A only**: the provider-budget, usage-accounting, refresh-state, kill-switch, and run-observability control plane with no Trendlyne production calls.

After Stage 7.2, the dependency order should be:

1. Mandatory pre-Stage-8 canonical-input and point-in-time lineage review.
2. Deterministic Quality-Growth and sector-specific input diagnostics.
3. Core Selection, Core Health, and Satellite Opportunity.
4. Valuation, momentum, risk, portfolio-fit, sizing, movement, and exit intelligence.
5. Monitoring, meaningful-change detection, calendar, and alerts.
6. Evidence-grounded optional AI Investment Committee.
7. Theme Outlook only after adequate structured breadth exists.

## 16. Files that would be changed during implementation

Expected surfaces, not changes made now:

- New Stage 7.2 migrations under `supabase/migrations/`.
- [enrichment.ts](/Users/drdibyendudutta/Documents/ChatGPT/PortfolioAI/supabase/functions/_shared/enrichment.ts)
- [trendlyne.ts](/Users/drdibyendudutta/Documents/ChatGPT/PortfolioAI/supabase/functions/_shared/trendlyne.ts)
- [refresh-security-enrichment/index.ts](/Users/drdibyendudutta/Documents/ChatGPT/PortfolioAI/supabase/functions/refresh-security-enrichment/index.ts)
- New shared quota, freshness, and orchestration modules.
- New Edge/unit/pgTAP/RLS tests.
- [database.types.ts](/Users/drdibyendudutta/Documents/ChatGPT/PortfolioAI/supabase/types/database.types.ts)
- New research and coverage repositories/types/hooks.
- New `ResearchPage` and `ResearchSecurityPage`.
- [AppRoutes.tsx](/Users/drdibyendudutta/Documents/ChatGPT/PortfolioAI/src/routes/AppRoutes.tsx)
- [AppShell.tsx](/Users/drdibyendudutta/Documents/ChatGPT/PortfolioAI/src/components/AppShell.tsx)
- Application styles and UI tests.
- Development Status, Requirements Register, Database Architecture, Stage 7 documentation, and a new Stage 7.2 completion document.

## 17. Risks / unresolved owner decisions

1. Approve or revise the proposed 100/day and 1,500/rolling-30-day internal budgets.
2. Decide whether owner overrides may raise a ceiling or only spend reserved emergency capacity.
3. Decide whether Cohort A should include the pilot ten or consist of 25 additional securities.
4. Assign portfolio roles first if role-stratified rollout is required; current evidence indicates position settings may still be absent.
5. Approve the canonical selection policy for provisional Trendlyne observations.
6. Decide whether raw provider payload retention remains permitted for broader production volume.
7. Confirm document download, body-retention, and Google Drive archival rights before implementing archival.
8. Determine whether the current provider offers trustworthy annual/quarterly series with sufficient period, scope, currency, and publication metadata.
9. Decide cache-query performance targets and acceptable structured-storage growth.
10. Review and commit the currently untracked UI workflow document before treating it as repository-governed implementation input.

**STAGE 7.2 PLAN READY FOR OWNER REVIEW — NO IMPLEMENTATION PERFORMED**