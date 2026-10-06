# PortfolioAI — V1-4 Evidence Remediation Closure Execution Package — 6 October 2026

## Status

V1-4 remains **IN PROGRESS / NOT PROVEN**. V1-5 remains **NOT AUTHORIZED**.

This package updates the existing 1,608-job V1-4 worklist only where the new H1/O1/F0 evidence and validator repairs affect execution. It does not restart a general audit.

Frozen contract remains unchanged:
- 111 approved members;
- manifest SHA-256 `79f551558333adc1f37d6a26298d8088ee02db3161f03c6d6e59f9a19a93fc27`;
- frozen value 132,585,696 paise;
- final V1 release minimum: 100 successful frozen members and 119,327,127 paise from the same successful members.

## H1 correction and normalized candidates

H1 run `e2e978fa-004f-450c-840f-bdcd00df271d` executed six HTTP requests and captured four responses. That is not equivalent to four usable acquisitions.

### Semantically valid existing captures

- NSE 1-Oct-2026 bhavcopy `0775efe3-8781-4900-9bff-c79af88e9b61`: ZIP valid; raw-body SHA-256 equals recorded hash; one CSV; 3,712 rows; TradDt/BizDt exactly 2026-10-01; 2,662 EQ identities; 269 current-canonical symbol matches with no matched ISIN mismatch; no conflicting duplicate identity/close; no invalid EQ close.
- NSE 5-Oct-2026 bhavcopy `f19dce57-6f6d-42d7-a677-d3bc1fcdb454`: ZIP valid; raw-body SHA-256 equals recorded hash; one CSV; 3,712 rows; TradDt/BizDt exactly 2026-10-05; 2,678 EQ identities; 269 current-canonical symbol matches with no matched ISIN mismatch; no conflicting duplicate identity/close; no invalid EQ close.
- NSE corporate actions `7244f482-177e-4622-b2d2-b3dff9f45e00`: valid JSON and raw-body hash. Five actions: KMSUGAR demerger; RSYSTEMS interim dividend; NATCOPHARM rights 2:21 @ premium Rs 748; IGL dividend Rs 1.50; NMDC dividend Re 1.

The bhavcopy payload hashes are raw ZIP-body hashes. Their separately computed uncompressed CSV hashes are `5d5ac5591c32ca5d53539df02cfdee3795a2657183570a42eb1d714ab1822354` and `567b772dd9a411fd4b2271fc3490dde3b013a1596c3b67a56ccb4e45d0bf2df3`. These hash domains must not be compared as if identical artifacts.

NATCOPHARM and IGL are frozen/current holdings, but the corporate-action response carries ISINs `INE987B01018` and `INE203G01019`, while current PortfolioAI identities are `INE987B01026` and `INE203G01027`. Those actions are excluded from automatic security attachment until historical-identity lineage proves the relationship. A rights issue is not a generic split factor.

### Preserved failed capture

NIFTY capture `87baa591-3b0d-4f1c-96ce-9ce2bc6b4c88` has HTTP 200 but `text/html` and an HTML page titled **Error 500**. Disposition:
- request execution: SUCCESS;
- response capture: SUCCESS;
- data acquisition: FAILED;
- semantic validation: FAILED;
- immutable capture: PRESERVED.

The new `v14-source-validation.ts` rejects this class of response and validates content type, schema, index identity, dates, values and requested session coverage.

## Ownership candidates — source-bound, NOT owner-reviewed

Raw records:
- SBIN: `95adfc40-0b3d-4bbd-b556-7b8811910243`
- WABAG: `0ed88b27-bd50-4d90-bf5c-71145dd88103`

Both raw responses bind exact symbol/ISIN to the current canonical security.

### SBIN / BANK

The approved BANK rule names `INSTITUTIONAL_OWNERSHIP_TREND_4Q`; Stage 8.6A defines institutional ownership as FII/FPI + DII. Source chart observations for the latest four actual quarters are:

| quarter | FII/FPI % | DII % | Institutional % |
| --- | ---: | ---: | ---: |
| 2025-09-30 | 9.6 | 27.8 | 37.4 |
| 2025-12-31 | 10.3 | 27.2 | 37.5 |
| 2026-03-31 | 11.4 | 26.2 | 37.6 |
| 2026-06-30 | 10.8 | 26.7 | 37.5 |

Mutual Fund is a subset of DII and must not be added again. The chart values are rounded to one decimal; current summary/insight fields contain more precise latest values and are cross-check evidence, not a substitute for one value in an otherwise rounded historical series.

### WABAG / ENVIRONMENTAL_SERVICES

The frozen contract requires `OWNERSHIP_TREND_4Q` but does not identify which one of promoter, institutional, FII, DII, MF or public is the canonical trend series. This is an explicit policy ambiguity and cannot be resolved by code silently.

Latest four actual chart quarters include:
- promoter: 19.1, 19.1, 19.1, 19.1;
- institutional: 22.9, 23.3, 22.4, 24.6;
- FII: 18.4, 19.0, 16.6, 18.2;
- DII: 4.5, 4.3, 5.8, 6.4;
- MF: 3.6, 3.8, 5.1, 5.5;
- public: 58.0, 57.6, 58.5, 56.3.

MF is contained within DII. Pledge is percentage of promoter shares, not percentage of total equity. The provider date list includes Sep-2026 but no Sep-2026 chart observation exists; it is not an observation.

No review row is authorized merely by this package. The owner must separately accept the exact facts/series before reviewer identity can truthfully be used.

## History validator repair

Development now contains:
- `v14-history-readiness.ts`;
- materializer version `P7_IC3_CANONICAL_SNAPSHOT_V3_HISTORY_CONTRACT`;
- append-only proof loader for `V1_4_HISTORY_CONTRACT_VALIDATION`.

A history requirement can become FRESH only after proving:
- sufficient distinct sessions;
- exact calendar/window;
- complete supported corporate-action treatment;
- truthful price/return basis;
- stock/benchmark session alignment when required;
- exact VERIFIED Angel One benchmark mapping;
- cutoff/freshness;
- reproducible lineage.

Raw close is never relabelled adjusted close. Stock adjusted-price and benchmark total-return series are blocked unless an approved contract explicitly permits the mixed return basis.

Proof is append-only; existing market-history rows do not need to be mutated.

## Benchmark capability recovery

The previous H1 NIFTY request used the wrong encoding. Preserved working code proves the Nifty Indices contract uses:
1. bootstrap GET `https://www.niftyindices.com/reports/historical-data`;
2. POST `https://www.niftyindices.com/BackPage/getTotalReturnIndexString`;
3. JSON body `{"cinfo":"{'name':'<INDEX>','startDate':'DD-Mon-YYYY','endDate':'DD-Mon-YYYY','indexName':'<INDEX>'}"}`;
4. `Content-Type: application/json; charset=UTF-8`, `X-Requested-With: XMLHttpRequest`, Origin and Referer;
5. JSON response validation, exact index identity, positive TRI values, dates and coverage.

Official NSE/Nifty data is proposed as validation/complementary authority. Angel One remains the designated market-data authority.

Within the frozen 111, twelve missing benchmark codes are already supported by the exact Angel One benchmark adapter:
- NIFTY_CAPITAL_GOODS — 18 members;
- NIFTY_CHEMICALS — 4;
- NIFTY_CONSUMER_DURABLES — 5;
- NIFTY_CONSUMER_SERVICES — 5;
- NIFTY_FINANCIAL_SERVICES_EX_BANK — 9;
- NIFTY_HOSPITALS — 2;
- NIFTY_INDIA_DEFENCE — 4;
- NIFTY_OIL_GAS — 2;
- NIFTY_POWER — 2;
- NIFTY_SERVICES_SECTOR — 1;
- NIFTY_TELECOM — 1;
- NIFTY_TRANSPORTATION_LOGISTICS — 1.

Four frozen authority labels are not currently executable through the approved registry:
`NIFTY_CAPITAL_MARKETS`, `NIFTY_ENERGY_CONTEXT`, `NIFTY_HEALTHCARE_CONTEXT`, `NIFTY_INSURANCE`.
No provider request may be made for these until exact index-vs-context semantics and an approved adapter identity are established.

## AKUMS document track and durable storage dependency

Resolved official URLs are the three NSE archive PDFs already documented. No body has been fetched.

PortfolioAI Dev currently has **zero Supabase Storage buckets**. R2 writes are prohibited by the current authorization. Therefore durable body capture cannot be truthfully executed yet.

Proposed storage dependency: explicit owner authorization for a dedicated private Supabase Storage bucket `research-source-documents`, PDF-only, non-public. No PDF/base64 body will be stored in Postgres or GitHub.

## Consolidated execution package requiring owner approval

### Batch A — HISTORY_ACTION_COVERAGE_V1

Purpose: establish complete official corporate-action coverage across the current 252-session history window without changing Angel One market-data authority.

Scope: frozen 111 only; candidate window 25-Aug-2025 through prospective source cutoff 6-Oct-2026.

External requests:
- 1 NSE corporate-action page bootstrap;
- 15 monthly/partial-month corporate-action API requests covering Aug-2025 through Oct-2026;
- total ceiling **16 external requests**;
- retries **0**.

Writes:
- ≤1 ingestion run;
- ≤15 run items;
- ≤15 immutable raw source records;
- provider usage events 0;
- market_price_history writes 0;
- benchmark history writes 0;
- observation/review/snapshot/selection/lineage writes 0.

Deduplication: source URL + requested month/partial month + raw SHA-256.
Stop: any non-JSON/error/challenge response, malformed action schema, unresolved action type that cannot be represented truthfully, or unexpected host.
Success removes only corporate-action coverage uncertainty. It does not itself make history READY.

### Batch B — ANGEL_BENCHMARK_SUPPORTED_MISSING_V1

Scope: exactly the twelve supported missing benchmark codes listed above and their frozen-member consumers.

External requests:
- ≤1 shared Angel One instrument-master request;
- ≤12 Angel One daily-history calls;
- total ceiling **13 external requests**;
- retries **0**.

Writes:
- ≤12 `market_benchmarks` upserts;
- ≤4,800 `market_benchmark_price_history` rows (hard ceiling 400 rows/code; deduplicated on benchmark/provider/interval/session);
- ≤13 provider-usage events;
- ≤1 run/control record plus ≤12 run items;
- zero security market-history, observations, reviews, snapshots/items/selections/lineage.

Grant/control: one scoped benchmark execution grant for the exact ordered code set; consume once.
Stop: first unresolved/ambiguous exact index identity, auth/provider error, schema error, or <252 usable distinct sessions for a requested benchmark. Do not continue dependent benchmark materialization after that code fails.
Remaining blocker: four unsupported authority labels above remain separate policy/adapter work.

### Batch C — HISTORY_CONTRACT_PROOF_V1

No external calls.

Inputs:
- existing Angel One stock/benchmark histories;
- H1 bhavcopy canaries;
- Batch A action captures;
- Batch B exact benchmark mappings/history.

Writes:
- ≤111 append-only security validation source records;
- ≤12 append-only supported-benchmark validation source records;
- record kind `V1_4_HISTORY_CONTRACT_VALIDATION`;
- zero mutation of existing history rows;
- zero observations/reviews/snapshots.

Each proof must state source authority, calendar state, action state/unresolved count, return basis, freshness through and immutable lineage IDs. Any unsupported action or calendar/session mismatch writes a truthful non-ready proof or no proof; never a FRESH proof.

### Batch D — O1_OWNER_FACT_REVIEW_V1

External calls: 0.

SBIN: four institutional-quarter candidate facts above are eligible for owner factual review.
WABAG: **not executable for persistence until the owner selects/approves the intended canonical ownership series for the frozen ENVIRONMENTAL_SERVICES methodology**.

Review authority: actual portfolio owner only. Batch approval is not factual approval.

After explicit factual review:
- SBIN review write ceiling: 4 append-only review rows;
- WABAG review write ceiling: 4 only after the policy decision and factual review;
- no observations, snapshots or scoring writes.

Idempotency: security + requirement + series/basis + quarter + source record hash + review version.
Stop: mixed basis, source quote/value conflict, listed-but-unobserved quarter, reviewer identity mismatch, or owner declines a fact.

### Batch E — AKUMS_OFFICIAL_PDF_CAPTURE_V1

Dependency: owner must explicitly authorize creation/use of private Supabase Storage bucket `research-source-documents`. Without storage authorization this batch remains BLOCKED.

External requests after storage authorization:
- exactly the 3 resolved official NSE PDF URLs;
- ceiling **3 GETs**, retries **0**;
- redirects rejected outside approved official host.

Storage/write ceiling:
- ≤3 private PDF objects, total hard ceiling 16 MiB;
- ≤3 immutable body-metadata source records (hash/MIME/bytes/URL; no base64 body);
- ≤3 research-document-source appearances;
- ≤3 research-document identities before content-hash deduplication, reduced when hashes prove identity;
- observations 0; review rows 0; snapshots 0.

Validation: PDF MIME/magic/integrity, issuer AKUMS/ISIN, NSE dissemination metadata, document date/type, content SHA-256. Equal sizes are not deduplication. Different hashes are revisions/versions until chronology reviewed.
Stop: invalid MIME/PDF, host redirect, >16 MiB aggregate, issuer mismatch, or storage failure.

### Batch F — FROZEN_111_CANONICAL_MATERIALIZATION_V1 (dependent)

This batch may run only after the approved preceding evidence/review contracts have completed and the dry-run readiness result is accepted.

External/provider calls: 0.

Scope: exactly the frozen 111, unchanged manifest/value.

Execution: three resumable slices, each ≤40 members.

Hard write ceiling:
- ≤111 snapshots;
- ≤1,608 snapshot items;
- ≤111 selections;
- ≤111 lineage rows;
- 3 one-time materialization grants maximum;
- zero provider usage and zero change to holdings/frozen valuation.

Stop: any manifest mismatch, source cutoff violation, unexpected READY transition without qualifying lineage, append/select conflict, or release-cohort/value inconsistency.

Release evaluation remains separate: V1 requires at least 100 READY-successful frozen members and 119,327,127 paise from those same members. All 239 equities/248 holdings remain visible with truthful non-ready states.

## Tests and Development deployment

Committed regression coverage now includes:
- HTTP-200 HTML error-page rejection;
- TRI identity/date/value validation;
- bhavcopy identity/date/duplicate handling;
- history qualification;
- corporate-action/calendar failure;
- stale history;
- benchmark alignment;
- mixed return-basis rejection;
- four-quarter ownership success with latest-period freshness;
- stale latest ownership quarter.

Focused runtime self-tests passed 8/8 for capture/history and the ownership policy canary passed both success and stale cases.

Development `p7-ic2-materialize-readiness` v27 compiled/deployed successfully. No materialization was run.

## Current approval boundary

No Batch A-F execution is performed by this document.

A single owner authorization may approve the unchanged executable contracts A, B and C and the dependent F contract without repeated slice permission. D still requires actual factual review; E additionally requires explicit storage authorization. Unsupported benchmark labels remain fail-closed until a separate exact source-contract decision.
