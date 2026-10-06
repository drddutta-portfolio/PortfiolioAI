# PortfolioAI V1-4 — Owner-Approved Batches A/B/C/E Execution Record — 6 October 2026

## Scope
Executed only the owner-approved V1-4 closure package:
- Batch A HISTORY_ACTION_COVERAGE_V1
- Batch B ANGEL_BENCHMARK_SUPPORTED_MISSING_V1
- Batch C HISTORY_CONTRACT_PROOF_V1
- Batch E AKUMS_OFFICIAL_PDF_CAPTURE_V1

Batch D review persistence was not executed.
Batch F canonical materialization was not executed because Batch B prerequisite failed.
No T1, Production/main, P8, R2, scheduler, Auth/RLS or V1-5 work was performed.

## Batch A — COMPLETE / PASS
Run: `a7375df9-16b7-4bb2-b214-73a4cf29d0c0`

Outcome:
- 16 external requests total
- zero retries
- 15 monthly/partial-month NSE corporate-action responses accepted
- 15 immutable source records written
- covered 25-Aug-2025 through 6-Oct-2026
- run status SUCCEEDED

The first bootstrap request was consumed before a local cookie-header handling error; the resumed execution deliberately skipped a second bootstrap and used exactly the remaining 15 API requests, preserving the hard 16-request ceiling.

## Batch B — STOPPED / FAIL-CLOSED
Grant: `34e7c8c0-6edf-4541-8051-b621499ae450`

Requested first supported missing code: `NIFTY_CAPITAL_GOODS`.

Outcome:
- shared Angel One instrument-master lookup consumed once
- first exact benchmark identity resolution returned `P7_IC_BENCHMARK_IDENTITY_NOT_FOUND`
- Angel One history calls: 0
- no benchmark mapping/history rows written
- one-time grant consumed once
- remaining 11 benchmark codes were not attempted
- four unsupported authority labels remained untouched

This follows the approved stop-at-first-unresolved-identity rule.

## Batch C — COMPLETE / TRUTHFUL NON-READY PROOF
Append-only security history-contract proofs written: 111/111.

All 111 currently carry:
- `exchangeCalendarState = UNVERIFIED`
- reason: Batch B stopped before missing benchmark authority/calendar completion

Structural corporate-action handling is additionally UNSUPPORTED for 10 frozen securities because raw close cannot be treated as adjustment-safe across the detected event:
- CAMS — face-value split
- ECLERX — bonus 1:1
- GOODLUCK — bonus 2:1
- HDFCAMC — bonus 1:1
- HDFCBANK — bonus 1:1
- HINDUNILVR — demerger
- KARURVYSYA — bonus 1:5
- KOTAKBANK — face-value split
- TDPOWERSYS — face-value split
- TVSMOTOR — scheme of arrangement / bonus NCRPS

Existing market-history rows were not mutated. No benchmark proof was fabricated after Batch B failure.

## Batch E — COMPLETE / PASS
Private bucket:
`research-source-documents`
- public: false
- PDF-only
- 8 MiB per-object limit
- no Auth/RLS policy changes

Official NSE requests:
- 3 GETs
- zero retries
- total bytes: 14,886,580 (<16 MiB)

Objects:
1. AKUMS Investor Presentation — 3,007,028 bytes — SHA-256 `9018a5f73f647f853888217b2f4aac92f2261100edaac8a3b2789ef4c3ab8084`
2. AKUMS BM Outcome 16:11 — 5,939,776 bytes — SHA-256 `b1f201361d7b00e620ae446bc0be72b6082df33931ce7c84445fdf6df5900984`
3. AKUMS BM Outcome 15:45 — 5,939,776 bytes — same SHA-256 as item 2

Therefore:
- 3 private Storage objects
- 3 immutable source records
- 2 research documents after content-hash deduplication
- 3 research-document source appearances

Document identity remains REVIEW_REQUIRED; no owner review was inferred.

## Side-effect check
- research_evidence_requirement_reviews: 0
- research_evidence_snapshots: 1,485
- research_evidence_snapshot_items: 22,401
- research_evidence_snapshot_selections: 956
- research_evidence_snapshot_lineage: 478

These canonical counts are unchanged from the pre-execution check; therefore Batch F was not run.

## Disposition
- Batch A: COMPLETE / PASS
- Batch B: STOPPED / BLOCKED at exact benchmark identity
- Batch C: COMPLETE / truthful fail-closed proof
- Batch E: COMPLETE / PASS
- Batch D: NOT EXECUTED
- Batch F: NOT ELIGIBLE / NOT EXECUTED

V1-4 remains IN PROGRESS / NOT PROVEN.
V1-5 remains NOT AUTHORIZED.
