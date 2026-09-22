# R4N Gate F — Prepared Local Numeric Ingestion Package + Regulatory Event Persistence Proposal

**Status:** Prepared only / no writes / no migration apply  
**Branch:** `r4n-pharma-subprofile-architecture`

## Purpose

Prepare the first two post-validation persistence packages without executing either:

1. a local numeric ingestion package for the four reviewed TORNTPHARM US-growth observations;
2. a canonical regulatory-event persistence migration proposal for the two reviewed FDA Indrad events.

Both remain separately approval-gated.

## A. Local numeric ingestion package

Contract:

`TORNTPHARM_LOCAL_NUMERIC_INGESTION_V1`

Canonical target:

`public.fundamental_observations`

Prepared observations:

- 2025-06-30 — 19%
- 2025-09-30 — 26%
- 2025-12-31 — 19%
- 2026-03-31 — 16% base-business

All four are:
- `PHARMA_EXPORT_US_REVENUE_GROWTH`;
- `QUARTER`;
- `PERCENT`;
- direct official lineage;
- source code `COMPANY_EXCHANGE_FILING`;
- targeted at the existing immutable canonical numeric evidence store.

The rejected Q4 31% claim is absent.

### Database prerequisites still unresolved

The package deliberately does not claim write readiness.

Before any local observation insert can be authorized:

1. the local TORNTPHARM security UUID must be resolved explicitly;
2. the reviewed PHARMA_V1 + Domestic Formulations assignment version must match;
3. `fundamental_metric_definitions` must register `PHARMA_EXPORT_US_REVENUE_GROWTH` with canonical unit `PERCENT`;
4. four immutable `data_source_records` rows must exist for the reviewed Q1-Q4 FY26 issuer releases;
5. an existing-fact conflict/idempotency preflight must pass;
6. the owner must separately approve the local write.

The source-record requirement is mandatory because `fundamental_observations.source_record_id` is non-null and foreign-keyed to `data_source_records`.

### Proposed metric definition

The package proposes, but does not apply:

- code: `PHARMA_EXPORT_US_REVENUE_GROWTH`
- name: Export / US Revenue Growth
- value kind: `NUMERIC`
- canonical unit: `PERCENT`
- statement scope: `PHARMA_BUSINESS_MODEL`
- freshness: 10,368,000 seconds
- period type: `QUARTER`
- mapping version: `PHARMA_V1_GLOBAL_GENERICS_V1`
- source priority: `COMPANY_EXCHANGE_FILING`
- semantic guard: separately disclosed US/export revenue growth only

Package state:

- validator-accepted rows: **4**
- prepared observation rows: **4**
- source records required: **4**
- metric-definition registrations required: **1**
- proposed writes: **0**
- `writeAuthorized = false`

## B. Regulatory event persistence proposal

Runtime proposal contract:

`PHARMA_REGULATORY_EVENT_PERSISTENCE_PROPOSAL_V1`

SQL review artifact:

`docs/sql/R4N_PHARMA_REGULATORY_EVENT_EVIDENCE_V1_MIGRATION_PROPOSAL.sql`

The SQL is intentionally stored outside `supabase/migrations` and ends in `ROLLBACK`.

### Proposed canonical objects

Table:

`public.research_regulatory_event_observations`

Current-state view:

`public.current_research_regulatory_site_state_v1`

Proposed regulator source:

`US_FDA_OFFICIAL`

The source registry proposal is deliberately:
- inactive;
- entitlement-unverified;
- retention-rights-unverified.

No activation claim is made.

### Proposed event-table guarantees

- append-only history;
- immutable after insert through existing Stage 7 evidence mutation trigger;
- security FK;
- data-source-record FK;
- source-code FK;
- site-specific scope only;
- US FDA regulator code only for V1;
- warning-letter active / warning-letter closed-out states only;
- logical idempotency identity;
- authenticated read only for held securities through RLS;
- authenticated mutation denied;
- service-role mutation only;
- security-invoker current-state view.

The table does not permit a company-wide state to be inferred from one facility chain.

### Current event package state

- contract-accepted events: **2**
- event-contract quarantined: **0**
- canonical storage implemented: **false**
- migration under Supabase migration directory: **false**
- schema apply authorized: **false**
- event write authorized: **false**

## Safety boundary

This checkpoint does not authorize:

- local numeric evidence insert;
- source-record materialization;
- metric-definition mutation;
- regulatory event table creation;
- FDA source activation;
- production Supabase changes;
- provider calls;
- scoring/recommendation/sizing changes;
- scheduler changes;
- deployment;
- PR merge.

## Next gate

After localhost visual approval and local validation, the owner can decide separately whether to authorize:

1. a **local-only numeric preflight / source-record materialization package**; and/or
2. conversion of the regulatory-event SQL proposal into an executable local migration for replay testing.

Neither authorization would imply production deployment.
