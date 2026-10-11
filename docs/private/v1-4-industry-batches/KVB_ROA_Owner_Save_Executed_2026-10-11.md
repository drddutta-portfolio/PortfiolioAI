# KVB ROA owner save — executed Development result

The genuine portfolio owner accepted review `51deb1ef-6105-4180-a139-30619ed6f5da`. The application then validated ROA and issued scoped grants, but its stale materialization request omitted `targetingMode`. The backend correctly rejected that request with `SECURITY_IDS_REQUIRE_AUTHENTICATED_VALIDATION_OR_GRANT_SCOPED_WRITE` before consumption.

The corrected application request includes `P4_GRANT_SCOPED_SECURITY_IDS_V1`. Its test runs the actual backend targeting parser against the generated request. The source-loading route now reads back an existing accepted review for the authenticated owner and exact source, so reload does not request another approval. Save errors include the failed validation, grant-issuance or materialization stage and backend code.

## Actual authorized execution

The executor reused the owner's unexpired, unconsumed KVB-only grant `b7ac4e95-e8d5-4ad1-aac4-d78a213c6f68`, issued at 18:45:10.851 UTC, expiring at 19:00:10.851 UTC. It invoked the existing grant-authenticated materialization action using the project's public anonymous API credential, without impersonating the owner, minting a JWT or inserting an evidence review. The grant was the write authorization; the public credential only satisfied the existing gateway contract.

At evaluation/source cutoff `2026-10-11T18:52:00Z`, the deployed v57 canonical materializer returned HTTP 200, processed exactly KVB, reported zero provider calls, created one snapshot and one selection. A repeated identical request returned HTTP 401 `P4_GRANT_ALREADY_USED`.

- Snapshot: `3a3eefc3-1999-47d5-bb3e-6bd4f38e35c6`
- Selection: `6bf7e938-7aaf-4441-9d8b-8050bc8da315`
- Selection run: `97df965b-8d31-4997-926f-edbdbfc83d0b`
- Selected at: `2026-10-11T18:52:16.74288Z`
- Status: `REVIEW_REQUIRED`
- Independently read back `ROA_ANNUAL`: **FRESH**, numeric value **1.93**, FY2025–26 standalone, linked to the existing owner review and original issuer source. Publication remains NULL; retrieval is not relabelled publication.

## Blocker accounting

The unresolved financial/valuation requirements fell from four to three: `NIM_TTM`, `PE_TTM_RELATIVE`, `PB_RELATIVE`. The latest selected snapshot additionally has five STALE history requirements: 6M/12M momentum, relative strength, maximum drawdown and relative volatility. Total non-FRESH requirements is therefore **8**, not 3.

The evaluation is 00:22 IST on October 12. The loader found no authoritative session-calendar decision for that current IST date; the retained Friday history proof had already expired. This is the existing fail-closed freshness contract. This execution does not manufacture a CLOSED decision or weaken freshness to reproduce the old four-blocker census.

## Development activation and verification

The numeric reviewer resume-read correction is ACTIVE v4, JWT verification enabled, bundle SHA-256 `508368d6d2dfc0df2b3d2e7dd4556d0f300f56a99e961cceb56373fe2a9d34bb`.

Targeted UI/data tests cover resuming the existing review, duplicate clicks, session expiry between validation and grant issuance, actual materializer targeting and exact grant-replay error propagation. The live grant replay was independently rejected. No duplicate accepted review was created. No Production/main change or financial methodology change occurred.

The corrected targeting implementation at `61863686a8e02847032b8fcabc36d03e6ff644be` passed Architecture Guard run `38164793097` and Banking Full Verification run `38164793110`. The resume/error changes require their own final-head CI result; earlier results must not be represented as that result.
