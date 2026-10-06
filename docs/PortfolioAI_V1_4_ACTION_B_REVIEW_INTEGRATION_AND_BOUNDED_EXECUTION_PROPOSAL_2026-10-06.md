# PortfolioAI V1-4 Action B — reviewed-evidence integration and bounded execution proposal

Date: 6 October 2026

## Disposition

**REVIEW-LEDGER INTEGRATION = IMPLEMENTED / DEPLOYED / FOCUSED TESTS PASS. V1-4 = IN PROGRESS / NOT PROVEN. V1-5 = NOT STARTED / NOT AUTHORIZED.**

Starting authoritative Development HEAD for this pass:

`f7426507687f9c6d8de9560708733a65c7dbfe8d`

This pass follows the V1-4 frozen contract. It does not change the approved 111-member cohort, manifest SHA-256 `79f551558333adc1f37d6a26298d8088ee02db3161f03c6d6e59f9a19a93fc27`, frozen value **132,585,696 paise**, final same-member threshold of **100 members AND 119,327,127 paise**, all-239-equity/all-248-holding visibility, fail-closed states, or V1-9 restore requirement.

No provider call, external filing acquisition, migration, broad materialization, P8 execution, R2 write, scheduler action, Production/main change, Auth/RLS change or V1-5 action occurred.

## 1. Architectural integration implemented

The existing `research_evidence_requirement_reviews` ledger is now consumed through a shared adapter:

`supabase/functions/_shared/v14-reviewed-evidence.ts`

The existing readiness materializer remains the sole readiness authority. It now loads owner/source-cutoff-scoped reviews plus their immutable `data_source_records` and `research_documents` anchors and passes eligible reviewed facts into the existing `validateObservationSeries` contract.

The adapter does **not** make a review row authoritative merely because foreign keys and hashes exist. It validates, as applicable:

- portfolio/security/requirement scope;
- source-record existence, source payload hash, and security association;
- research-document security/identity/content hash;
- supporting quote actually present in the immutable source payload;
- exact numeric value and approved metric code;
- period, period type, unit/currency and scope;
- publication/retrieval/freshness/cutoff compatibility;
- human reviewer identity for documentary and ownership factual review;
- supersession only inside the same portfolio/security/requirement context;
- conflicts between active reviews;
- minimum distinct reporting periods;
- minimum distinct ownership quarters;
- minimum distinct documentary evidence units.

Existing validated canonical observations have precedence. The review ledger is a fallback evidence adapter, not a competing authority.

Numeric reviewed facts become synthetic validator inputs only when their source-bound facts pass the existing canonical metric contract. Documentary and ownership requirements have separate guarded review-family handling and cannot bypass their minimum-evidence requirements.

## 2. AKUMS canary raw response corrected interpretation

The preserved AKUMS raw canary was inspected directly.

The response contains numeric values and field labels such as:

- `ROCE Ann. %`;
- `ROCE Ann. 1Y Ago %`;
- `ROCE Ann. 3Y Avg %`;
- `ROIC Ann. %`.

Therefore the earlier phrase “no unit metadata” was too broad. A literal `%` in the provider label can support a **percentage-unit fact** when bound to the exact source field.

It still does not supply the complete V1-4 contract:
- no source-proven historical reporting-period dates for the requested annual series;
- no consolidated/standalone reporting scope;
- no publication proof for the financial observation;
- the explicit `2026-10-06` date is the response/entity date, not three historical reporting periods;
- `3Y Avg` is not three distinct annual observations.

The failed canary therefore remains a valid failure of the complete dated-field contract. It does not prove that all Trendlyne tools, ownership sources or document sources are unusable.

## 3. Focused validation

Two temporary Development-only self-test packages were invoked through Supabase internal networking and then immediately retired behind `verify_jwt:true` 410 responders.

Focused suite 1: **13/13 PASS**
- accepted source-bound numeric review;
- wrong context;
- source-hash mismatch;
- missing scope;
- period anchor;
- publication anchor;
- percent-label unit evidence;
- distinct-period minimum;
- human reviewer requirement;
- post-cutoff review;
- quote binding;
- supersession;
- conflicting reviews.

Focused suite 2: **4/4 PASS**
- one ownership quarter cannot satisfy 4Q;
- four distinct reviewed quarters can satisfy 4Q;
- one document cannot satisfy a two-evidence requirement;
- two distinct reviewed documents can satisfy it.

The tightened materializer is ACTIVE in Development as:

- function: `p7-ic2-materialize-readiness`;
- version: **23**;
- bundle SHA-256: `538a6408bf6237f636149bdb70ef46a0f6efea775edbf4916d68346a7bb517b6`.

An owner-authenticated dry-run was not performed because this agent does not possess the owner's PortfolioAI session. Authentication was not weakened.

## 4. Preview verification limitation

The Vercel connector was used with both the known team slug and returned team ID. Both requests returned the same team-scope **403 forbidden / re-authentication required** response.

No protection was disabled and PortfolioAI authentication was not weakened. Hosted Preview acceptance therefore remains unavailable in this pass and is not claimed.

No frontend source was changed by this implementation; the change is confined to the Development Supabase evidence-readiness path and documentation/tests.

## 5. Cache/worklist outcomes

The authoritative private Phase 1 worklist was re-read in full: **1,608 jobs / 111 frozen members**.

| family | jobs | current deterministic outcome |
|---|---:|---|
| CACHE_CANONICAL_VALIDATED | 2 | already satisfies cache contract |
| CACHE_FIELD_METADATA_REVIEW | 183 | numeric/value evidence exists in cache for candidates, but source-bound period/scope/publication proof remains incomplete; no review is fabricated |
| CACHE_QUARTER_REVIEW | 108 | explicit dated ownership-quarter candidates are reusable, but series definition/basis requires factual review; adapter now enforces distinct-quarter minima |
| CACHE_EXCERPT_REVIEW | 274 | cached discovery references are not document bodies; remain blocked |
| ACQUIRE_RAW_THEN_REVIEW | 49 | 47 parameter-value jobs remain non-executable under failed tested contract; 2 ownership calls are independent and separately proposal-ready |
| BLOCKED_CONTRACT | 685 | exact source/period/factual contracts remain unsupported; no call estimate invented |
| BLOCKED_HISTORY_AUTHORITY | 307 | 275 shared history-authority jobs can use a separately bounded official-source authority batch; 32 exact benchmark authority/token jobs remain blocked |

Frozen-member `research_documents` census:
- 108/111 members have discovery rows;
- 136 total document rows;
- **0 VERIFIED document identities**;
- **0 reporting-period dates**;
- **0 reporting-period types**;
- **0 canonical content hashes**;
- **0 stored source URLs**.

Those rows are therefore discovery shells, not validated document evidence.

A targeted scan of current cached numeric source anchors found no FY labels, month/year reporting labels, XBRL reporting-period contexts, consolidated/standalone evidence, or publication evidence in the relevant source payloads. ISO-formatted dates that do occur are source/entity retrieval context and are not silently promoted into financial reporting periods.

## 6. Current and predicted readiness

Current persisted readiness is unchanged:

**111 REVIEW_REQUIRED / 0 READY** for the frozen cohort.

Predicted readiness from this implementation alone is also:

**111 REVIEW_REQUIRED / 0 READY**.

That is expected. The review ledger currently has zero rows, and implementation capability is not evidence readiness. The new code enables future source-reviewed facts to reach the existing validator; it does not invent those facts.

## 7. Private per-requirement execution matrix

The full row-level proposal is:

`docs/private/PortfolioAI_V1_4_ACTION_B_BOUNDED_EXECUTION_PROPOSAL_2026-10-06.csv`

It contains all **1,608** frozen requirement jobs and records:
- member/security identity;
- requirement/minimum;
- current cache blocker;
- proposal disposition and independent batch;
- executable vs NOT EXECUTABLE status;
- supported source path;
- exact callable request/URL where proven;
- parser/target;
- attempts/retries;
- raw/usage/review/observation/snapshot/item/selection/lineage ceilings;
- expected blocker removed;
- blockers remaining after the action;
- shared-batch ceilings that must not be summed per member.

Unsupported facts and endpoints are marked **NOT EXECUTABLE**.

## 8. Proposed independent execution batches — not executed

### H1 — NSE October 1/5 authority amendment

This is the amendment requested after the earlier ordered approval stopped H1 behind the failed financial canary.

H1 is independent of Trendlyne financial-field capability and may run without retrying that provider tool.

Exact external request ceiling: **6 requests, 0 retries**.

1. GET `https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_20261001_F_0000.csv.zip`
2. GET `https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_20261005_F_0000.csv.zip`
3. GET `https://www.niftyindices.com/reports/historical-data`
4. POST `https://www.niftyindices.com/BackPage/getTotalReturnIndexString` for NIFTY 500, 01-Oct-2026 through 05-Oct-2026
5. GET `https://www.nseindia.com/companies-listing/corporate-filings-actions` to establish the official NSE session cookie
6. GET `https://www.nseindia.com/api/corporates-corporateActions?index=equities&from_date=01-10-2026&to_date=05-10-2026`

Reuse only pure validation/parsing logic from the preserved P8 code. **Do not run P8 and do not write R2.**

Capture-only write ceiling:
- 1 bounded ingestion run;
- 4 logical run items (Oct 1 bhavcopy, Oct 5 bhavcopy, NIFTY 500 TRI, corporate actions);
- at most 4 immutable raw authority source records;
- 0 commercial-provider usage events;
- 0 market-history rows;
- 0 fundamental observations;
- 0 review rows;
- 0 snapshots/items/selections/lineage.

A subsequent separately approved validation/materialization step would be needed before H1 could remove per-security adjustment/alignment blockers.

### O1 — two independent ownership-source calls

These are not the failed `get_parameter_values_multi_stock` contract.

Exact provider requests:
- SBIN: `get_ownership_deals_insider_sast({"stock_code":"SBIN","type":"shareholding"})`
- WABAG: `get_ownership_deals_insider_sast({"stock_code":"WABAG","type":"shareholding"})`

Ceiling:
- 2 provider attempts total;
- 0 retries;
- at most 2 provider usage events;
- at most 2 immutable raw source records;
- 0 observations;
- 0 review rows during capture;
- 0 snapshots/items/selections/lineage.

Each result must pass the existing dated-quarter parser and later ownership basis review. Failure of either ownership request does not stop H1.

### T1 — remaining Trendlyne parameter requests

**NOT EXECUTABLE.**

The 47 affected jobs deduplicate to **44 unique** `get_parameter_values_multi_stock` requests. The tested canary contract failed mandatory period/scope/publication proof. No retry or campaign expansion is proposed.

### F1/F2 — official filing/document evidence

**NOT EXECUTABLE YET.**

Existing issuer/document code supplies useful safety and parsing patterns, but the frozen cache does not currently hold verified filing URLs/body hashes/period metadata for these requirements. Exact acquisition URLs must first be proven; calls are not estimated from member count.

### B1 — unresolved benchmark mappings

**NOT EXECUTABLE YET.**

The 32 exact-benchmark authority/token jobs remain fail-closed. Existing mapped benchmarks must not substitute for methodology-required indices.

## 9. Cutoff rule

Frozen membership and valuation remain unchanged.

Any new source retrieved on 6 October or later cannot be represented as evidence that was available under the frozen 5 October source cutoff.

If H1/O1 or later official-filing evidence is acquired, it must be used in a **prospective evaluation run with an explicit later source cutoff**, while preserving the frozen cohort/value contract. No evidence timestamp may be backdated and no freshness rule may be relaxed.

## 10. Approval boundary

Implementation and bounded planning are complete under the current authorization.

V1-4 remains **IN PROGRESS / NOT PROVEN**.

The next independent actions requiring owner approval are:
- **H1**: amend the prior ordering so the six-request official NSE October 1/5 capture-only authority batch may execute independently;
- **O1**: authorize exactly the two ownership-source calls above.

No approval is requested for T1, F1/F2 or B1 because they are not currently executable.

After any approved capture, stop and report before review persistence or canonical materialization.
