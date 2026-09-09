# Stage 7.2B1 — Cohort Orchestrator Hardening Completion

**Status:** Complete locally; dry-run only; no Cohort A provider execution

## Boundary and prior defect

The action-separated Stage 7.2A path repeated the same overview request for
fundamentals, ownership and document operations. Its conservative Cohort A estimate
was 111 attempts before retries, above the 100-attempt daily safety ceiling.

Stage 7.2B1 adds a provider-neutral planner and cleanup executor without changing
the schema, provider budget, identity rules, metric dictionary, or evidence model.
It does not activate Cohort A execution and made no Trendlyne call.

## Exact dry-run cohort

The unchanged 25-security cohort is HDFCBANK, M&M, BHARTIARTL, MOTHERSON, BBOX,
AVALON, ASTRAMICRO, WABAG, WAAREEENER, ZAGGLE, ICICIBANK, SBIN, FEDERALBNK, INFY,
TITAN, TORNTPHARM, LAURUSLABS, TVSMOTOR, IREDA, HUDCO, TDPOWERSYS, MTARTECH,
PIIND, VBL and NETWEB.

All are open canonical equities. The first ten have fresh verified identity,
first-wave fundamental and aggregate-ownership evidence. The already approved
three document appearances are also within their seven-day discovery backstop.
Those cached domains plan as `SKIPPED_FRESH`.

## Call reuse and evidence boundaries

For each of the 15 new securities, one overview request may serve provider identity
confirmation and the separately validated fundamental processor. Up to two identity
search requests are reserved for strict resolution, and one ownership-specific
request remains separate. Raw request reuse never merges canonical domains:
fundamental and ownership mappings, source records, observations, run items and
refresh states retain their own semantic and provenance rules.

Documents remain limited to the previously approved three securities. Fresh cached
appearances are skipped; bodies are not retained and identity remains
`REVIEW_REQUIRED`. Adjusted P/B remains `PBV_ADJUSTED_PROVIDER` and conflicting.

## Dry-run budget and batches

- Required identity-search attempts: up to 30.
- Shared overview attempts: 15.
- Ownership-specific attempts: 15.
- Document-search attempts: zero because the approved three are fresh.
- Other attempts: zero.
- Base total: 60.
- Bounded transient retry reserve: 12 (20% of base).
- Worst-case reservation: 72 attempts.
- Batch 1: eight new securities, 32 base plus seven retry units = 39.
- Batch 2: seven new securities, 28 base plus five retry units = 33.
- Projected daily maximum: 72 of 100.

The planner rejects non-equities, a document scope above three, any batch over 40,
and any daily plan over 100. Retry reserve is shared and bounded; it is not three
blind retries per request. Actual future retries remain limited to approved
transient failure classes.

## Cleanup and tests

The execution boundary reserves before leasing and guarantees reservation settlement,
unused-unit release, lease release and terminal run completion through `finally`.
Tests cover reservation, lease, execution, settlement, lease-release and completion
failures, as well as cached skips, shared overview, identity reuse, document bounds,
batching and budget rejection. Existing Trendlyne parser/contract tests continue to
cover null preservation, unexpected identities, adjusted P/B separation, ownership
semantics, document review state and deduplication contracts.

No schema migration or deployment was required. Linked provider usage, reservation,
run-item and refresh-state counts remained zero. Stage 7.2B Cohort A is not complete
and requires a separate owner-authorized execution after this prerequisite is pushed.
