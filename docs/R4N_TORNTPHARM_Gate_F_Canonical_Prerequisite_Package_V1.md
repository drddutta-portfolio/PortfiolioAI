# R4N Gate F — TORNTPHARM Canonical Prerequisite Package V1

**Status:** Prepared only / no mutation  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Package:** `TORNTPHARM_CANONICAL_PREREQUISITE_PACKAGE_V1`

## Purpose

Prepare the exact canonical database prerequisites revealed as missing by the successful local numeric preflight, without mutating local or production Supabase.

The completed read-only preflight confirmed:

- TORNTPHARM security identity: present and unique;
- reviewed Domestic Formulations assignment: present and unique;
- existing US-growth observations: none;
- conflicting US-growth observations: none;
- `PHARMA_EXPORT_US_REVENUE_GROWTH` metric definition: missing;
- all four required issuer source records: missing.

## Metric-definition registration proposal

Prepared row:

- code: `PHARMA_EXPORT_US_REVENUE_GROWTH`
- name: `Export / US Revenue Growth`
- value kind: `NUMERIC`
- canonical unit: `PERCENT`
- statement scope: `PHARMA_BUSINESS_MODEL`
- freshness: `10368000` seconds
- provider: `COMPANY_EXCHANGE_FILING`
- selection: `REVIEWED`
- period type: `QUARTER`
- semantic guard: `SEPARATELY_DISCLOSED_US_OR_EXPORT_REVENUE_GROWTH_ONLY`
- mapping version: `PHARMA_V1_GLOBAL_GENERICS_V1`
- rejected substitute: total-international-revenue growth without compatible scope
- active: `true`

This row is prepared only. It has not been inserted.

## Four immutable source-record proposals

Each proposed row targets `public.data_source_records` and uses:

- source code: `COMPANY_EXCHANGE_FILING`
- record kind: `ISSUER_RESULTS_RELEASE`
- external record id: reviewed artifact code
- exact reviewed source URL
- canonical reviewed raw payload
- SHA-256 payload hash requirement
- reviewed public-fact retention scope

Prepared artifacts:

1. `TORRENT_Q1_FY26_RELEASE`
   - 2025-06-30
   - reviewed US-growth value: 19%
2. `TORRENT_Q2_FY26_RELEASE`
   - 2025-09-30
   - reviewed US-growth value: 26%
3. `TORRENT_Q3_FY26_RELEASE`
   - 2025-12-31
   - reviewed US-growth value: 19%
4. `TORRENT_Q4_FY26_RELEASE`
   - 2026-03-31
   - reviewed comparable base-business value: 16%

The rejected Q4 31% claim is not present in any canonical payload.

## Payload-hash boundary

The package deliberately does **not** fabricate immutable hashes during preparation.

For each source record:

- algorithm: `SHA256`
- hash state: `COMPUTE_AT_MATERIALIZATION_FROM_CANONICAL_RAW_PAYLOAD`
- current payload hash: `null`

A later separately approved materialization step must serialize the canonical payload deterministically and compute the SHA-256 hash before insert.

## Existing source registry prerequisite

No new issuer source needs to be created.

The existing canonical source:

`COMPANY_EXCHANGE_FILING`

is already defined as:

- public web / primary company-exchange filing source;
- active;
- entitlement verified;
- retention-rights verified;
- fundamentals capable;
- primary-evidence capable.

The later materialization gate must still verify this live local state before writing.

## Current package summary

- metric definitions prepared: **1**
- source records prepared: **4**
- payload hashes materialized: **0**
- proposed writes: **0**
- mutation authorized: **false**

## Safety boundary

Not authorized:

- metric-definition insert;
- payload-hash generation/write;
- source-record insert;
- fundamental-observation insert;
- production Supabase mutation;
- deployment;
- PR merge.

## Next safe gate

After localhost visual approval and focused validation, the next decision is whether to prepare and then separately authorize a **local-only prerequisite materialization dry-run/executor** that computes the four SHA-256 hashes and shows the exact SQL/rows that would be inserted.

That future gate must still remain non-production and separately approval-gated before any local mutation.
