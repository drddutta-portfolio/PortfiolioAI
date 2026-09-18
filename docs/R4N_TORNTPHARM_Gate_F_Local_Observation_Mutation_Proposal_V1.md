# R4N Gate F — Local Observation Mutation Proposal V1

**Status:** Prepared only / not approved / not executed  
**Branch:** `r4n-pharma-subprofile-architecture`

## Purpose

Prepare the final local-only Gate F evidence-write proposal for the four reviewed TORNTPHARM US-growth observations that the read-only numeric preflight classified as `INSERT_CANDIDATE`.

## Prepared observations

Metric:

`PHARMA_EXPORT_US_REVENUE_GROWTH`

Rows:

- 2025-06-30 → 19%
- 2025-09-30 → 26%
- 2025-12-31 → 19%
- 2026-03-31 → 16%

The rejected Q4 31% claim is excluded.

## Prepared artifacts

- `scripts/r4n/torntpharm-local-observation-mutation.sql`
- `scripts/r4n/run-torntpharm-local-observation-mutation.sh`
- `src/features/research/torntpharmLocalObservationMutationProposal.ts`
- `src/features/research/torntpharmLocalObservationMutationSql.test.ts`

Prepared command:

`npm run r4n:mutate:observations`

## Approval boundary

The runner refuses before database discovery unless:

`PORTFOLIOAI_ALLOW_LOCAL_OBSERVATION_MUTATION=YES`

is explicitly present.

Without this flag:
- no local DB URL lookup;
- no database connection;
- no SQL execution.

The runner separately refuses any DB URL not clearly using `localhost` or `127.0.0.1`.

## Fail-closed lookups

Inside the transaction, the SQL requires:

- exactly one active NSE TORNTPHARM security row;
- exactly one current reviewed PHARMA_V1 / Domestic Formulations assignment;
- one active `PHARMA_EXPORT_US_REVENUE_GROWTH` NUMERIC/PERCENT/PHARMA_BUSINESS_MODEL metric contract;
- all four immutable `COMPANY_EXCHANGE_FILING` issuer-result source records;
- zero conflicting existing US-growth quarter facts.

Any mismatch aborts the transaction.

## Canonical observation semantics

Each inserted row uses:

- metric code: `PHARMA_EXPORT_US_REVENUE_GROWTH`
- numeric value: reviewed percent
- unit: `PERCENT`
- period type: `QUARTER`
- consolidation scope: `UNKNOWN`
- source code: `COMPANY_EXCHANGE_FILING`
- source record id: dynamically resolved immutable source record
- retrieved_at: copied from the immutable source record
- fresh_until: source retrieved_at + registered metric freshness seconds
- evidence status: `AVAILABLE`

## Idempotency and conflict policy

- Exact matching facts are skipped.
- Any same-quarter conflicting value or unit aborts.
- The SQL does not overwrite observations.
- Postconditions require exactly four matching reviewed facts and zero conflicts.

## Current state

- proposal prepared: **YES**
- execution approved: **NO**
- executed: **NO**
- local observation writes: **0**
- production writes: **0**

## Next workflow step

1. Owner `git pull`.
2. Inspect localhost glass-box cards.
3. Give visual approval.
4. Run full local validation.
5. Only then separately authorize the exact local 4-row observation mutation.
