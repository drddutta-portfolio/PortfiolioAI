# R4N Gate F — Local Prerequisite Mutation Proposal V1

**Status:** Prepared only / not approved / not executed  
**Branch:** `r4n-pharma-subprofile-architecture`

## Purpose

Prepare the exact local-only mutation executor required to materialize the two prerequisites previously proven missing by the read-only numeric preflight:

1. one `fundamental_metric_definitions` row for `PHARMA_EXPORT_US_REVENUE_GROWTH`;
2. four immutable `data_source_records` rows for the reviewed Q1-Q4 FY26 issuer releases.

This gate does **not** authorize execution.

## Prepared artifacts

- `scripts/r4n/torntpharm-local-prerequisite-mutation.sql`
- `scripts/r4n/run-torntpharm-local-prerequisite-mutation.sh`
- `src/features/research/torntpharmLocalPrerequisiteMutationProposal.ts`
- `src/features/research/torntpharmLocalPrerequisiteMutationProposal.test.ts`

Command prepared:

`npm run r4n:mutate:prerequisites`

## Approval guard

The runner refuses before database discovery unless this explicit flag is present:

`PORTFOLIOAI_ALLOW_LOCAL_PREREQUISITE_MUTATION=YES`

Without that flag:
- Supabase DB URL is not resolved;
- no database connection occurs;
- no SQL is executed.

The runner also refuses non-local DB URLs and accepts only localhost / 127.0.0.1.

## SQL scope

Maximum persistent local inserts:

- metric-definition rows: **1**
- immutable source-record rows: **4**
- fundamental-observation rows: **0**

## Fail-closed preconditions

Before insert, the SQL requires:

- existing `COMPANY_EXCHANGE_FILING` source registry row;
- source registry active;
- entitlement verified;
- retention rights verified;
- no conflicting metric-definition semantics;
- no same-artifact source record with a different payload hash, payload or source URL.

Any conflict aborts the transaction.

## Idempotency

Metric definition:
- keyed by `code`;
- existing matching row is retained;
- conflicting row aborts.

Source records:
- canonical DB dedup key remains `(source_code, record_kind, external_record_id, payload_hash)`;
- application-level preflight additionally aborts if the same artifact ID exists with different canonical content;
- exact existing source records are not duplicated.

## Verified hashes used

- Q1 FY26: `b8a8b87c01a1ea1ade5f1d7bc158804a793caeed8d02f1652e885b94deae8788f`
- Q2 FY26: `3847fc6cadca356c5d1d0b07da2a584a9f90b2c7c3cbaa83237bd5d05fceec5f2`
- Q3 FY26: `3df20aaafb6be4e2f9f2f070489feb8937c97f0d47f6997a3c6c5910224caeb7`
- Q4 FY26: `d08cf8f86694557b5391ff9085e9e98a1667d4d4fab8994e2626e990922998b53`

Q4 retains the reviewed comparable base-business value of **16%**. The rejected 31% claim is not materialized.

## Postconditions

The SQL verifies before commit:

- exactly one matching metric-definition row exists;
- exactly four matching immutable source-record rows exist;
- no fundamental observations are inserted by this gate.

## Current state

- proposal prepared: **YES**
- execution approved: **NO**
- executed: **NO**
- local mutation performed: **NO**
- production mutation: **NO**

## Next workflow step

Owner should:
1. `git pull`;
2. inspect the localhost glass-box mutation proposal cards;
3. give visual approval;
4. run full local validation.

Only after that may the owner separately approve actual local execution.
