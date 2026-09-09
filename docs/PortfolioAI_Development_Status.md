# PortfolioAI — Development Status

**Status:** Living implementation and handover record

**Current milestone:** Stage 7.2B1 — cohort orchestrator hardened and dry-run validated; Cohort A execution and Stage 8 not started

**Last reviewed:** 9 September 2026

This document records what is actually implemented, live, incomplete, and approved
next. It is intentionally concise and does not duplicate the product specification.

## A. Project identity

PortfolioAI is the private `drddutta-portfolio/PortfiolioAI` repository for a
personal investment decision-support system covering a diversified Indian
portfolio across multiple broker/demat accounts. It is not an autonomous investment
adviser, order-execution bot, or trading bot; investment decisions remain with the
owner.

- Frontend: React, Vite, and strict TypeScript.
- Backend: Supabase Auth, PostgreSQL, Row Level Security, RPCs, and Edge Functions.
- Current major sources/integrations: trusted Excel/XLSX portfolio imports, Angel
  One SmartAPI market prices, and the server-side Trendlyne MCP adapter for
  controlled structured fundamental, aggregate-ownership and provisional-document
  evidence. Angel One remains current-price authority.
- Portfolio: one consolidated portfolio across distinct broker/demat accounts.

## B. Canonical document hierarchy

Authority descends in this order:

1. `PortfolioAI_Master_Blueprint.md` defines product vision, intended capabilities,
   investment methodology, and long-term architecture.
2. `PortfolioAI_Database_Architecture.md` defines approved database design, data
   ownership, provenance, accounting semantics, and security/RLS expectations.
3. `PortfolioAI_Development_Rules.md` defines engineering, security, testing,
   deterministic-calculation, and implementation standards.
4. This Development Status records actual implementation, completed milestones,
   known limitations, the current milestone, and next approved work.
5. Stage-specific documents, including `Stage_4_Market_Data.md`, record detailed
   stage decisions and completed-stage behaviour.

The first three documents are canonical specifications. This file reports current
reality without overriding them. Implementation sequencing may differ from the
Blueprint's broad phases without constituting an architectural conflict.

## C. Completed implementation state — Stages 1–4

### Foundation and security

- React + Vite + TypeScript frontend and Supabase backend.
- Email/password authentication, password reset, persisted sessions, logout, and
  protected application routes; public self-registration is not exposed.
- User-owned portfolio RLS/security foundation and browser read-only financial
  ledger boundary.
- Private GitHub repository and a Consolidated Portfolio.

### Broker structure

The consolidated portfolio contains five distinct broker/demat accounts:

- Motilal Oswal
- Sharekhan
- Angel One
- Zerodha
- INDMoney

### Import and transaction foundation

- Trusted Excel/XLSX import with preview, validation, explicit confirmation, and a
  trusted ledger-commit path.
- Immutable staged source evidence, original values, import provenance, and
  transaction-to-source-row lineage.
- Browser clients cannot directly insert, update, delete, or truncate trusted
  transactions. Corrections must use controlled, auditable semantics.
- Financial quantities and calculations use PostgreSQL numeric values and decimal
  strings/Decimal.js rather than JavaScript floating-point arithmetic.

### Current verified portfolio snapshot

The completed-stage operational snapshot records:

- 477 `ACTIVE` transactions.
- 270 transaction/security histories.
- 248 open holdings and 22 closed positions.
- 270 canonical securities.

These counts describe the current imported portfolio state; they are not generic
application limits.

### Dashboard and holdings

- Professional Dashboard foundation with transaction-derived position counts,
  supported portfolio totals, allocation presentation, and explicit completeness
  states.
- Holdings page plus a separate Closed Positions view.
- Current price, market value, portfolio weight, supported cost basis/P&L, broker
  exposure, price evidence, role, and sector presentation where evidence permits.
- Cost-basis coverage and data-quality indicators; unavailable values remain
  unavailable rather than estimated.
- Holdings search, role and sector filters, open/closed filtering, and deterministic
  sorting are implemented.

### Market data — Stage 4

- Angel One SmartAPI is integrated server-side through an authenticated Supabase
  Edge Function; provider credentials are not exposed to the browser.
- Application calculations use a provider-independent `MarketPriceProvider`
  boundary. Provider identifiers remain separate from canonical security identity.
- Mapping is deterministic and evidence-backed: 248 of 248 open holdings have
  verified mappings, including an explicitly reviewed mapping exception.
- Latest-price cache coverage is 248 of 248 open holdings, enabling current
  portfolio market value and weights even where cost basis is incomplete.
- Market-data provenance preserves provider, mapping evidence, exact decimal price,
  provider timestamp, and retrieval timestamp.
- Fresh/stale status is based on retrieval time; missing provider timestamps are
  not replaced with retrieval time.
- Server-side caching, bounded quote batches, cooldowns, rate control, and
  database-backed operation leases protect the provider and shared account.

## D. Known current limitations

These are explicit, deferred limitations—not accidental omissions:

- 28 open holdings with SELL history lack a deterministic remaining cost basis
  pending an approved FIFO/lot-accounting engine.
- Those 28 positions may still have valid CMP, Market Value, and Portfolio Weight.
  Missing cost basis must not be confused with missing market-price evidence.
- 296 historical imported transactions have no known transaction date. Dates must
  remain null and must never be fabricated merely to make FIFO work.
- Total unrealised P&L remains unavailable because the approved completeness rules
  do not permit a deterministic portfolio-wide value until every open position has
  a supported remaining cost basis.
- Trusted sector classifications are not yet populated.
- Cached prices may become stale between market-data refreshes.
- Historical OHLCV population is not complete for the future technical/momentum
  engine.
- Advanced investment engines remain future work.

## E. Completed Stage 5

### Stage 5 — Transactions, FIFO Lot Accounting & Portfolio Accounting

Stage 5 application code, additive migration, tests and implementation documentation
are complete. Migration `20260907160000_create_stage5_manual_transactions.sql` is
applied locally and remotely. Local SQL security tests and local/remote schema lint
pass, and generated Supabase types reflect the deployed schema.

**Transactions page:** user-facing navigation and a page for reviewing
historical transactions, with search; sorting; security, broker/account,
transaction-type, and available-date filters; and visible data quality, source, and
provenance.

**Manual transaction entry:** validated, trusted BUY/SELL entry with
portfolio, broker/demat account, security, transaction date, quantity, price,
available charges, appropriate source/notes, and auditable provenance.

**Accounting engine:** on-demand exact-decimal per-history accounting. Provable
chronology uses authoritative FIFO lots; incomplete chronology uses deterministic,
order-independent weighted-average cost when the effective BUY/SELL ledger remains
mathematically valid. Results expose basis, charge completeness and unresolved state.

**Missing-date behaviour:** dates remain null and are never invented. Missing dates
prevent a FIFO claim but no longer suppress independently calculable average cost,
remaining cost, gross realised P&L or live-CMP unrealised P&L.

**Auditability:** preserve imported historical evidence. Corrections and reversals
must be linked and auditable; manual changes must retain provenance and must not
silently rewrite trusted history.

Read-only production-snapshot reconciliation for the completion amendment finds 58
FIFO histories and 213 average-cost histories, with no currently unresolved ledger;
48/201 are open and 10/12 closed respectively. Historical missing charges remain
explicit gross-only quality and never become zero-valued stored evidence.

The post-migration production snapshot remains 477 active transactions, 270
security histories, 248 open holdings, 22 closed histories, and 248/248 current
price coverage. Market value remains ₹22,48,208.55; Stage 5 did not mutate market
data or imported ledger evidence.

## E.1 Implemented Stage 5.1

Stage 5.1 adds trusted canonical-security onboarding within manual transaction entry,
audited transaction correction by supersession, sortable transaction headers,
combined security/source/quality/evidence filters, and durable requirements
traceability. New securities receive an explicit unresolved Angel One mapping until
trusted provider-master evidence can verify them; no provider identity or CMP is
fabricated. Corrections preserve original transactions and imported source evidence,
while on-demand accounting automatically reads the replacement `ACTIVE` row.

User acceptance subsequently exposed that the first frontend used separate search
and select controls: an unmatched typed ticker did not reveal onboarding and native
select validation blocked submission. The accepted UI now uses one searchable
security control. It lists existing matches or presents a contextual **Add new
security** action, pre-fills the typed ticker, preserves transaction fields, and
automatically selects the trusted RPC result without a reload. REQ-TRAN-001 is not
considered satisfied by backend availability alone.

Migrations `20260907190000_complete_stage5_1_transaction_management.sql`,
`20260907200000_fix_isin_validation_lint.sql`, and
`20260907210000_store_security_series_canonically.sql` are applied to the linked
project. The latter two forward-only migrations preserve applied history while
removing a lint warning and placing exchange series on the canonical security
listing rather than the globally unique identifier table.

Post-deployment read-only validation remains unchanged: 477 active transactions,
270 security histories, 248 open holdings, 22 closed histories, 270 canonical
securities, 248 verified mappings and 248 latest prices. No production security,
transaction, correction request, or mapping was fabricated for testing. Remote
schema lint and migration history pass; the local/test pgTAP suite validates both
trusted workflows transactionally.

## E.2 Stage 6 implementation and deployment

Stage 6 application code is complete and migration
`20260907220000_create_stage6_portfolio_classification.sql` is applied to the
linked project. The migration adds portfolio-owned themes and portfolio-safe
many-to-many theme membership with owner-scoped RLS. Membership is validated
against transaction-derived open holdings and has no dependency on a primary-role row. Existing
`portfolio_security_settings` remains the single source for roles and position
preferences.

The Portfolio Structure page manages role, exact-decimal target/minimum/maximum
weights, priority, watchlist, frozen state, investment horizon, notes and theme
membership. Explicit `OTHER` remains distinct from an absent settings row shown as
`UNCLASSIFIED`. ETF presentation uses canonical asset class independently of role.

Dashboard valuation now retains the priced market-value subtotal under incomplete
coverage and labels coverage and unpriced holdings. Allocation and weights are
identified as priced-subset values when incomplete. Covered unrealised and realised
P&L remain qualified by accounting coverage rather than presented as complete.

Holdings reads imported HOLDINGS snapshot evidence directly from immutable source
rows. Valid snapshot cost/P&L values are visibly labelled as reconciliation evidence
alongside authoritative FIFO values; spreadsheet errors are ignored. No snapshot
storage table, transaction mutation, inferred date, fabricated price, provider
mapping, sector or industry was introduced.

Post-migration production evidence contains 478 active transactions, 271 security
histories, 249 open holdings, 22 closed histories, 271 canonical securities, 248
verified mappings and 248 latest prices. The covered market-value subtotal is
₹22,59,239.37 across 248/249 open holdings; V2RETAIL is the sole unpriced holding
and remains an EQUITY with an unresolved Angel One mapping. All 249 production
positions remain genuinely UNCLASSIFIED because no production settings were
created. After the audited BBOX correction, the nine canonical ETF assets remain
distinct from portfolio roles.

Disposable local acceptance verified theme create/edit/retire, multiple simultaneous
theme memberships, role changes that preserve theme membership, theme removal that
preserves role and holding, and persistence of position settings. Temporary themes,
memberships and settings were removed after verification; no production
configuration or financial history was changed. Imported HOLDINGS evidence was
verified in the UI beside unavailable FIFO values for incomplete chronology.

Validation: TypeScript, ESLint, Vitest, production build, all pgTAP assertions,
local and linked public-schema lint, migration-history alignment, remote schema
inspection and production-snapshot acceptance pass. The local Edge Function wrapper
did not return cached prices during browser acceptance; the restored production
cache and exact subtotal were therefore verified directly in PostgreSQL, while UI
partial-coverage behavior remains covered by deterministic application tests.

## E.3 Stage 6 owner-acceptance completion and deployment

Owner-acceptance remediation is implemented and deployed. The existing correction
action now opens in a visible modal and browser
integration verifies the full audited correction payload. Transaction details lead
with supported investment/position context and retain identifiers, correction and
void history under Audit & provenance.

Audited Remove/Restore uses ACTIVE/REVERSED state rather than hard deletion or the
unresolved REVERSAL type. Trusted RPCs enforce ownership, BUY/SELL eligibility,
idempotency and effective-quantity integrity; immutable source lineage remains on
the original row. Canonical classification requests are owner-visible under RLS but
only a service-role operation can apply shared security changes. The ten-position
ETF audit confirmed nine ETFs and identified BBOX as conclusively EQUITY; the
guarded, audited BBOX correction is now applied remotely.

Dashboard now includes deterministic per-account broker analytics with an explicit
Unknown / Unattributed bucket and coverage, plus Best 30 / Worst 30 unrealised-return
ranking using FIFO- or average-cost-supported holdings with trusted CMP. Holdings
presents the selected accounting basis and imported snapshot values with immediately
distinct labels. Sector/market-cap
enrichment remains Stage 7; target/stop/trend/momentum remains monitoring/technical.

Local final validation is complete after the three forward migrations and
application changes: 116 pgTAP/RLS assertions, 96 Vitest tests, TypeScript, ESLint,
the production build, local public-schema lint and `git diff --check` pass. The
audit-protection migration additionally proves that controlled VOID/RESTORE and
classification application can append legitimate history while trusted direct
UPDATE or DELETE attempts against either applied-history table fail. Generated
Supabase types match the schema. On 8 September 2026 the linked project applied, in
order, `20260908100000`, `20260908101000` and `20260908102000`; linked migration
history now aligns through the final migration.

The accounting completion was reconciled from a read-only production snapshot.
ABCAPITAL independently matches imported average cost ₹324.7142857, remaining cost
₹11,365 and gross realised P/L ₹424. CPPLUS and ETERNAL likewise match imported
average cost, remaining cost and gross realised P/L. Their current values and
unrealised P/L use PortfolioAI's trusted CMP rather than the older workbook CMP.
Representative additional partial-sale, fully dated FIFO and fully closed histories
were checked. Production-snapshot accounting coverage is 58 FIFO histories (48
open, 10 closed), 213 average-cost histories (201 open, 12 closed), and zero
unresolved histories.

All 22 closed histories reconcile exactly to immutable XLSX realised-P/L evidence.
Closed Holdings labels disposed quantity separately from current quantity zero,
shows historical average acquisition cost, and identifies remaining cost/current
value as zero. Ten histories use FIFO and twelve use average cost. Reopened-cycle
tests prove a prior close retains realised history while a later BUY alone supplies
the new open FIFO cost basis.

Transactions is compatible with the linked pre-completion schema: expected
`PGRST205`/missing-RPC responses for pending audit objects no longer abort page
loading or expose raw PostgREST details. Only VOID/RESTORE features are unavailable;
listing, correction, filtering and provenance remain usable. Fully migrated local
tests confirm audit history and actions return automatically. Classification-request
submission converts only its known pending-table mismatch to a human message.

Post-deployment read-only schema/data inspection confirms BBOX is `EQUITY` /
`COMMON_STOCK`, with its approved request and immutable applied ETF-to-equity audit
history present. Authenticated users retain SELECT-only direct access to transactions
and audit histories. VOID/RESTORE execute only through ownership-validating RPCs,
classification requests remain owner-scoped, shared classification application
remains service-only, and immutable-history triggers reject UPDATE/DELETE even for
trusted operational roles.

Live authenticated-browser acceptance passed without changing transaction, role,
theme, position-setting or price data. Transactions loads 478 active records without
PGRST205 and retains correction, Remove/Restore availability, search/filter/sort and
auditable provenance. Holdings loads 249 open and 22 closed histories; ABCAPITAL,
CPPLUS, ETERNAL, ANANTRAJ and BEL show supported average-cost accounting, current
price/value and realised/unrealised P/L. All closed histories retain disposed and
acquired quantities, historical average cost, zero current quantity/remaining cost,
and reconciled realised values. Dashboard remains explicitly partial at 248/249
priced holdings and ₹22,59,239.37, with V2RETAIL still unpriced; broker analytics and
Best/Worst ranking render. Portfolio Structure shows BBOX as an equity stock, the
nine remaining ETF assets as ETFs, and existing roles, themes and settings unchanged.

Final Stage 6 UI-summary remediation keeps primary role and theme membership
independent. Portfolio Structure now replaces the misleading primary-role
`THEMATIC` summary card with `In Themes`, counting each open holding once when it
belongs to at least one active user-controlled theme; the primary-role filter and
editor continue to expose `THEMATIC` as a role, and ETF asset class remains a
separate canonical classification. Production-backed browser verification shows
the active Waste Management theme with six assigned holdings, an `In Themes` count
of six, and exactly six positions after selecting that summary.

Dashboard now displays a covered unrealised-return percentage beside the partial
covered unrealised P/L amount. Its denominator is the remaining cost basis of the
same holdings included in the covered P/L numerator, never total portfolio cost or
imported HOLDINGS snapshot values; a zero or unsupported denominator remains
unavailable. The 8 September production-backed snapshot shows covered unrealised
P/L of ₹3,83,301.62 over ₹18,70,672.75, or +20.49%, covering 248 of 249 open
holdings. V2RETAIL is the sole exclusion because trusted CMP remains unavailable.

Clean empty-database replay remains blocked at the older, production-data-specific
`20260907130000_verify_motherson_angel_mapping.sql` guard. Disposable-local replay
was completed by marking only that historical data migration applied, after which
all later migrations and the full pgTAP suite passed. The already-applied migration
was not edited.

## E.4 Stage 7 local foundation checkpoint

The owner-approved Stage 7 architecture is implemented and validated locally. Four
functional migrations establish provider-neutral sources/raw evidence, ingestion
runs and leases, canonical listings and identity reconciliation, classification and
fundamental observations/decisions, the versioned SEBI/AMFI full-market-cap rank
policy, cache-only current views and listing-aware Stage 4 mappings. Four small
forward-only hardening migrations were added: the first local pgTAP run proved
that an aggregate view could reveal an unavailable row for an unrelated user's
security and schema lint found an invalid qualified `greatest` call in the lease
function, an audit review added database-enforced immutability for raw and
normalized provider evidence plus append-only selection-decision events. The
last correction fixes both seeded policy dates to the 8 September 2026 owner
decision so later replay cannot acquire a deployment-dependent effective date. The
corrected view now limits results to the authenticated user's full
transaction history while trusted server roles retain canonical-universe access.

The approved narrow ninth migration is also applied locally. It adds explicit
nullable publication time, immutable provider-independent research documents,
multiple immutable source appearances, deterministic content/authority/metadata
identity keys, and dedicated fundamental reconciliation cases/members/events.
Competing observations remain intact, and RLS keeps document URLs and conflict
membership within the user's transaction-history security scope.

Trendlyne MCP is PortfolioAI's planned primary structured fundamental-data provider,
but it is neither the canonical data model nor a single point of failure. It remains
inactive. No provider-specific fields are canonical, and no network call is made
until the subscribed MCP methods, stable identifiers, usage limits, caching and
retention rights are inspected. The authenticated Edge Function contract serves
stored cache data and records an explicit configuration-pending result for an
unverified provider. Normal Dashboard operation never depends on a live MCP call.

The Dashboard locally uses selected cached evidence for trusted sector and
market-cap category allocation. Its denominator remains all priced open positions;
Unclassified/Unavailable and ETF/non-equity buckets are explicit, and enrichment
exposes LOADING, AVAILABLE, PARTIAL, UNAVAILABLE, STALE and FAILED states. The old
unlabeled imported company-name fallback was removed. Transactions, portfolio
roles, themes, accounting and Stage 4 price semantics are unchanged.

The approved `PORTFOLIOAI_INDUSTRY_V1` taxonomy shell is present, but its sector and
industry mapping values remain deliberately unseeded until actual STOCK MASTER and
provider classifications are inspected. No production enrichment observations or
coverage claims exist yet. The implemented `MARKET_CAP_CONFLICT_TOLERANCE_V1`
routes like-for-like observations to review at more than 1% same-date difference or
more than 5% adjacent-date difference within 36 hours; unlike bases or more distant
dates are not compared. These thresholds never average or fabricate a value.

Multi-source storage is implemented. Screener owner-provided CSV/XLSX ingestion,
official company/filing retrieval, controlled allowlisted public-web acquisition,
future licensed adapters and manual-audit workflows are architecturally supported
but not operational. Adapter fixtures prove explicit source-field paths and
metric-level fallback. Derived formula/input lineage is deferred to the mandatory
pre-Stage-8 analytical-input review.

Local validation covers 177 pgTAP/RLS assertions and 125 Vitest tests. TypeScript,
ESLint, the production build, local public-schema lint and generated Supabase types
pass. Full migration replay and `public` schema equivalence pass using an ephemeral,
uncommitted shadow-only fixture that supplies the exact prerequisite data asserted
by the historical MOTHERSON verification migration; the ordinary seedless replay
still fails closed at that intentional production-data guard. Supabase-managed
`storage` triggers differ with local service-image versions and are outside the
PortfolioAI `public` schema result. Final secret and diff checks are recorded in the
completion report for this checkpoint. At the close of the local checkpoint, no
remote migration, provider call, Edge Function deployment or git push had occurred.

## E.5 Stage 7 remote deployment and completion

On 8 September 2026 the owner authorized the final pre-production review and,
subject to every blocking gate passing, remote application of exactly the nine
Stage 7 migrations. Governance, migration, security, local validation, isolated
full-chain replay and public-schema equivalence gates passed. Commit
`a312422851c971f1f344be41846112ad11196d1d` captured the reviewed Stage 7
implementation before deployment.

The linked PortfolioAI Supabase project `uxiyufbsbgzzdujzcdxe` matched the expected
pre-Stage-7 migration history through `20260908102000`. Migrations
`20260908110000` through `20260908120000` were then applied once, in order, with no
reset, repair, provider call, invented enrichment data or transaction/accounting
mutation. Linked migration history is synchronized and remote `public` schema lint
reports no errors.

Read-only remote catalog verification confirms all 25 Stage 7 tables, six
security-invoker cache views and required RPCs are present; all Stage 7 tables have
RLS enabled; browser mutation grants are absent; trusted functions have an empty
`search_path` and the intended execute grants; and the three `published_at`
columns are nullable. The ninth migration's five document/reconciliation tables,
constraints, indexes, validation/audit triggers and policies are present. A remote
unrelated-user RLS simulation returned zero rows from every portfolio-scoped Stage
7 table and cache view while leaving globally readable reference metadata visible.

Post-deployment counts remain 482 transactions, 271 securities, one portfolio,
five broker accounts, 248 latest-price rows and zero portfolio security settings.
Dashboard, Holdings, Transactions and Portfolio Structure load against the remote
schema without PGRST/schema errors or a live provider. Existing holdings,
accounting, classifications and themes remain available. Stage 7 is therefore
**DEPLOYED / COMPLETE**.

That statement described the Stage 7 completion checkpoint. Stage 7.1A subsequently
completed subscribed MCP tool/schema and rights discovery; Stage 7.1B correctly
identified the missing trusted server-side adapter as the ingestion gate. Stage
7.1C has now activated the owner-approved source and deployed that adapter.

## E.6 Stage 7.1C trusted Trendlyne pilot

Migration `20260908200000_enable_trusted_trendlyne_ingestion.sql` is applied to the
linked project. It adds the provider-scoped instrument identifier, its verified
uniqueness rule, document-appearance deduplication, the reviewed first-wave metric
dictionary, and auditable owner-approved provider activation. The deployed
`refresh-security-enrichment` function reads the credential only from the server
secret store, enforces authenticated portfolio ownership, open-held equity scope,
one-to-ten security limits, a three-security document limit and ingestion leases.

The controlled pilot succeeded for HDFCBANK, M&M, BHARTIARTL, MOTHERSON, BBOX,
AVALON, ASTRAMICRO, WABAG, WAAREEENER and ZAGGLE. All ten received distinct verified
Trendlyne instrument mappings; 70 first-wave fundamental observations and 58
aggregate ownership observations were retained. Ten adjusted P/B observations are
explicitly `CONFLICTING`, not generic P/B. Three annual-report source appearances
were retained for HDFCBANK, M&M and BHARTIARTL as `REVIEW_REQUIRED`; full document
bodies were discarded. A repeat document run left exactly three documents and
three appearances.

Before/after pilot counts remained unchanged at 482 transactions, 249 current
holdings, five broker accounts, zero position settings, two themes, 14 theme
memberships, 248 latest-price rows and zero price-history rows. No accounting,
holdings, role, theme or Angel One price data changed. Browser mutation remains
denied and browser reads of ingestion-run administration remain denied. Normal
application reads remain cache-only.

The pilot establishes provider evidence, not selected canonical fundamentals.
Provider periods/scopes/currency that were absent remain null, classification
taxonomy values remain unseeded, document identities require review, and full
portfolio ingestion is not authorized. Stage 8 and Theme Outlook scoring have not
started.

## E.7 Stage 7.2A provider control plane

Migration `20260909100000_create_stage7_2a_provider_control_plane.sql` is applied
to the linked project. It adds configurable PortfolioAI-internal daily, rolling,
per-run and concurrency safeguards, atomic reservation/settlement, append-only
usage and control audit records, per-run security/domain items, operational refresh
state and versioned freshness policies. The actual provider contractual quota
remains explicitly `UNKNOWN`.

The deployed `refresh-security-enrichment` boundary checks the provider kill switch
before constructing the MCP client, reserves a conservative four internal attempts
per requested security, records each provider tool attempt, settles unused units,
and records run-item and refresh outcomes. Existing pilot bounds remain unchanged.
Scheduler, news, corporate events and Trendlyne technical market data remain
disabled; Angel One remains current-price authority.

Disposable validation passed 45 pgTAP assertions, clean-schema replay, schema lint
and a two-session concurrency test. The full application suite passed 153 tests,
including both jsdom UI suites; 62 Edge tests, TypeScript, application and Edge
ESLint, and the production build also passed. Linked migration history, schema lint,
schema-only inspection and regression estimates passed. The linked CLI pgTAP runner
cannot execute assertions because its temporary login role lacks `USAGE` on the
existing `extensions` schema. That runner limitation occurs at `extensions.plan`
before Stage 7.2A assertions and does not justify widening production privileges;
the disposable pgTAP/RLS suite plus linked read-only schema verification is the safe
equivalent. No Trendlyne call or Cohort A ingestion was performed.

## E.8 Stage 7.2B1 cohort orchestrator hardening

The provider-neutral Cohort A planner reuses one overview request per security for
compatible identity and fundamental processing while retaining separate canonical
domain mappings and provenance. Fresh pilot identity, fundamental, ownership and
approved document-discovery evidence is skipped. The exact 25-security dry run
plans 60 base attempts plus a bounded 12-attempt transient retry reserve across
two logical batches of 39 and 33, within the unchanged 100/day and 40/run limits.

The execution boundary guarantees reservation settlement, unused-unit release,
lease release and terminal completion across failure paths. No schema migration,
deployment, provider call or Cohort A ingestion occurred. Cohort A remains subject
to separate owner authorization.

## F. Deferred future work

- production Trendlyne refresh beyond the controlled ten-security pilot, subject to a separately approved rollout policy
- Quality-Growth diagnostic
- Core Selection and Core Health engines
- Satellite Opportunity Engine
- Valuation, Momentum/Technical, Sector, Risk, and Portfolio-Fit engines
- Advanced Position Sizing, Movement Radar, and Exit Radar
- Investment Thesis and Stock Detail
- production corporate research/document acquisition and extraction pipeline (canonical persistence exists locally)
- Ownership/shareholding intelligence
- Credit Intelligence
- Analyst & Earnings Revision Intelligence
- Why Stocks Moved and Portfolio Calendar
- Screeners and candidate discovery
- AI Investment Committee
- Advanced quant/backtesting

**Deferred does not mean removed from scope.** Each area remains governed by the
Master Blueprint and requires its own reviewed implementation work.

## Documentation consistency

Repository code, migrations, generated database types, tests, Git history and the
owner-verified operational snapshot support the completed Stage 1–4 state recorded
above. The canonical Database Architecture and Stage 4 documentation now reflect
the remotely applied and operational Stage 4 deployment.
