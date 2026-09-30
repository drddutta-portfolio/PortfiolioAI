# PortfolioAI P8-B2 historical identity/source-archive V3 extension

Date: 1 October 2026  
Environment: Development only  
Authority: owner-approved P8-B2 remediation migration-package scope  
Status: **LOCAL CLASSIFICATION + CLEAN REPLAY + SQL CONTRACT COMPLETE / PASS / HOSTED APPLICATION NOT AUTHORIZED**

## Purpose

The P8-B2 reconciliation proved that the earlier live-`securities.id` historical-universe model cannot represent the full frozen common-equity population without contaminating the current product identity registry.

The V3 extension therefore adds a P8-local historical identity and source-archive layer while preserving all earlier B2 v1/v2 objects unchanged.

## Repository package

Migration:

`supabase/migrations/20261001001500_create_p8_b2_historical_identity_registry_v3.sql`

Contract test:

`supabase/tests/p8_b2_historical_identity_registry_v3.sql`

The migration is additive only. It contains no `DROP`, no write to `public.securities`, and no alteration/reuse of the earlier B2 v1/v2 tables.

## New tables

- `p8_historical_security_identities`
- `p8_historical_source_archives`
- `p8_historical_listing_observations_v3`
- `p8_historical_universe_runs_v3`
- `p8_historical_universe_members_v3`
- `p8_historical_universe_member_listing_evidence_v3`
- `p8_historical_universe_run_selections_v3`

## New read models

All use `security_invoker=true`:

- `current_p8_historical_universe_run_v3`
- `current_p8_historical_universe_membership_v3`
- `current_p8_historical_universe_member_listing_evidence_v3`

## New service-only functions

- `append_p8_historical_security_identity_v1(jsonb)`
- `append_p8_historical_source_archive_v1(jsonb)`
- `append_p8_historical_listing_observation_v3(jsonb)`
- `append_and_select_p8_historical_universe_v3(jsonb,jsonb,jsonb,jsonb)`

Authenticated/browser roles have read-only access under owner-scoped RLS and no direct table DML. Anonymous access is denied. The Supabase `service_role` remains the elevated server-side role and retains the platform-standard table privileges; the four V3 append/select functions remain explicitly executable only by `service_role` among API roles.

## Frozen identity contract

The registry admits only historical identities matching the frozen P8 common-equity ISIN rule:

- country prefix: `IN`;
- issuer type: `E` or `9`;
- security type code: `01`.

Historical ISIN is the identity. Symbol, name, series and instrument ID remain dated source evidence.

Optional current-security linkage supports only:

- `EXACT_ISIN`;
- `EXACT_NSE_SYMBOL_CURRENT_NULL_ISIN`;
- `NONE`.

The append function verifies the current canonical row for the first two bases and never modifies it.

## Source-provenance contract

`p8_historical_source_archives` stores immutable file-level provenance:

- source date / URL / file name;
- CSV and GZIP SHA-256;
- retrieval time;
- exact publication time only when genuinely known;
- `available_no_later_than_at`;
- explicit proof basis and reference;
- immutable archive hash.

For the NSE historical-master path, exact publication time remains NULL and the frozen conservative availability upper bound is exactly 09:00 Asia/Kolkata on the source date. This encodes the previously approved exchange-before-trading-hours proof without fabricating a publication timestamp.

## Universe V3 contract

One V3 run is scoped to one source archive for one decision date.

An `ELIGIBLE` historical identity must have at least one `ELIGIBILITY_SUPPORT` listing observation from that exact selected archive/date. Same-identity symbol/series variants may be linked many-to-one.

An identity may be a valid historical universe member with `canonical_security_id = NULL`; live PortfolioAI security identity is not required for historical eligibility.

The run append/select function remains:

- deterministic;
- append-only;
- idempotent;
- fail-closed on changed run/member/evidence content;
- source-availability bounded strictly before the decision instant.

## Preservation contract

The package does not:

- change the seven current null-ISIN securities;
- add the 4,262 historical-only identities to `public.securities`;
- write historical universe data;
- make provider calls;
- start P8-B3 or P8-C;
- change Production or `main`.

The earlier B2 v1/v2 objects remain intact and the test explicitly proves that a V3 run writes nothing into them.

## Local validation sequence

From the P8-B2 verification worktree:

```bash
cd "/Users/drdibyendudutta/Documents/ChatGPT/PortfolioAI-P8-B2-Verify"
git fetch origin PortfolioAI-Development
git checkout <NEW_DEVELOPMENT_HEAD>

node scripts/p8/p8-b2-classify-historical-identities.mjs
supabase db reset

psql \
"postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
-v ON_ERROR_STOP=1 \
-f supabase/tests/p8_b2_historical_identity_registry_v3.sql
```

Expected classification aggregates:

```text
historical_unique_identities = 5211
frozen_company_equity_identities = 4524
excluded_non_frozen_identities = 687
exact_current_equity_links = 255
matched_non_equity_current_rows = 1
current_null_isin_company_equity_candidates = 7
p8_local_historical_identity_rows_required = 4262
frozen_equity_symbol_collision_groups = 40
frozen_equity_present_on_latest_decision_date = 4385
frozen_equity_historical_only_before_latest_date = 139
```

Expected successful SQL ending:

```text
BEGIN
DO
DO
ROLLBACK
```

The SQL test covers:

- exact-ISIN current linkage;
- unique current-null-ISIN symbol linkage without live-row mutation;
- historical-only identity with no current security;
- rejection of false exact links;
- rejection of non-frozen fund identity;
- source-archive idempotency;
- no invented publication timestamp;
- rejection of an unsupported NSE availability bound;
- line-level observation idempotency;
- same-identity many-to-one listing variants;
- eligible/ineligible V3 membership;
- run/selection repeatability;
- same-run-hash changed-evidence rejection;
- append-only behavior;
- legacy v1/v2 preservation;
- RLS, anonymous denial and authenticated owner-read contract;
- `security_invoker` views;
- browser/user write denial and authenticated owner-scoped reads;
- service-role-only execution of the privileged append/select functions, while preserving Supabase's platform-standard elevated `service_role` table privileges.

## Stop boundary

Hosted PortfolioAI Dev application is **not authorized by this package creation**. Historical materialization remains not started.

After local classification + clean reset + SQL contract test pass, return for separate owner approval before applying this exact migration to hosted PortfolioAI Dev.

## Local migration gate closure

The corrected V3 package completed the full local gate on 1 October 2026:

```text
classification = PASS
clean db reset = PASS
V3 migration replay = PASS
SQL contract test = PASS
terminal sequence = BEGIN → DO → DO → ROLLBACK
```

The local package is therefore **COMPLETE / PASS**.

Hosted PortfolioAI Dev application remains a separately approval-gated action under the P8 handoff. Historical universe materialization has not started.
