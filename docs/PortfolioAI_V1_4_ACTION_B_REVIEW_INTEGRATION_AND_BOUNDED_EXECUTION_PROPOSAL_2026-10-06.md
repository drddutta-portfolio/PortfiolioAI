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


---

## 11. Validator repair amendment — 6 October 2026

Starting authoritative HEAD for the repair instruction: \`c9462adaec4269dacc67a978da9c2b17e29556f3\`.

Implementation HEAD before this documentation closeout: \`b35dfeb9f45fe4bf804056c3cb1c5986c6c0112c\`.

The earlier V1-4 adapter had demonstrated false-FRESH paths. The repaired contract now makes the following changes:

1. **Requirement-family dispatch:** review handling is selected from the approved requirement plan's \`deterministicCoverageRule\`, not optional review metadata or broad regex matching. Numeric requirements cannot fall through to documentary support.
2. **Exact numeric source binding:** reviewed numeric values require a structured source binding to an exact table cell/XBRL/text cell. Exact decimal tokens are matched contextually; source \`12.50\` cannot prove \`2.50\`. Only explicitly approved identity scale/unit conversion is accepted.
3. **Reporting-period proof:** normalized start/end/type must match the source binding, and start/end anchors must occur in the same source fragment. An FY label alone cannot prove arbitrary dates.
4. **Ownership:** requires percentage value, series, denominator/basis, quarter, source anchors, provenance/freshness, one consistent series/basis, consecutive required quarters and conflict detection for duplicate series+quarter values.
5. **Document identity:** a VERIFIED document with canonical content hash is insufficient by itself. Exactly one \`research_document_sources\` association must bind the document to the same raw source record, with matching content hash and provider-document identity where present.
6. **Reviewer authority/integrity:** the supported review kind/version is family-specific; reviewer identity must equal the actual portfolio owner; deterministic review hashes are recomputed. Supersession context, chronology and branching are validated.
7. **Dates:** malformed dates fail as explicit validation failures rather than throwing.
8. **Canonical/review reconciliation:** canonical CONFLICTING is preserved; contradictory reviewed evidence is not ignored; compatible numeric reviews may supplement only canonical STALE/INSUFFICIENT series through the existing canonical validator; incompatible bases remain blocked.
9. **Complete loading:** review ledger reads page in 500-row blocks with an explicit 5,000-row safety ceiling. Referenced sources/documents are chunked and document-source associations are separately paginated with an explicit completeness blocker.
10. **Lineage:** selected review/source/document/document-source IDs and applicable source/content hashes are retained; aggregate evidence/freshness dates are derived deterministically.
11. **Status precedence:** a requirement conflict now takes precedence over REVIEW_REQUIRED when deriving a security-level readiness status.

### Regression / integration evidence

Committed regression coverage now includes the requested false-FRESH cases in:

- \`supabase/functions/_shared/v14-reviewed-evidence.test.ts\`
- \`supabase/functions/p7-ic2-materialize-readiness/index.deno.test.ts\`
- \`supabase/functions/_shared/p7-ic2-materialize-readiness.test.ts\`

The final focused runtime helper suite against the repaired source passed **7/7**, including numeric-family dispatch, exact-value binding, source-derived period dates, portfolio reviewer authority, document/source content identity and canonical-conflict preservation.

The real materializer handler was then exercised with mocked PostgREST/Auth transport using **501 review rows**:
- 2 review pages were read: offset 0 / 500 rows, then offset 500 / 1 row;
- HTTP handler result: 200;
- processed: 1 security;
- provider calls: 0;
- snapshot/selection writes: 0;
- RPC calls: 0;
- result was not READY.

Both temporary runtime test endpoints were subsequently retired behind JWT protection and return HTTP 410.

Final deployed Development Edge function:
- \`p7-ic2-materialize-readiness\` version **25**;
- bundle SHA-256 \`be640f03e696169dc0e4198adfc74d8946ec932bd8de862593326870d2f6b0a0\`;
- deployment/bundle compilation succeeded.

GitHub/Vercel status for the implementation commit is **success**. Direct Vercel connector access still returns the separate team-scope 403 / re-authentication-required error, so protected hosted Preview acceptance is not claimed.

### Corrected worklist impact

Because \`research_evidence_requirement_reviews\` still contains **0 rows**, the repair does not legitimately move any frozen member to READY and does not change the current persisted frozen readiness count.

The existing 1,608-job family counts remain the worklist baseline. What changed is the acceptance contract for remediation:

- the **183 CACHE_FIELD_METADATA_REVIEW** candidates cannot be promoted from value/label evidence alone; exact source value + source-derived period dates + unit/scope/publication lineage are required;
- the **108 CACHE_QUARTER_REVIEW** candidates require one consistent ownership series/basis, a consecutive required-quarter window and conflict-free values;
- the **274 CACHE_EXCERPT_REVIEW** candidates require verified content identity and a unique raw-source/document association; duplicate database document rows cannot satisfy a minimum;
- the **47 parameter-value jobs / 44 unique requests** remain NOT EXECUTABLE under the failed dated-field contract;
- H1 history authority and O1 ownership remain independent proposals.

No review rows are to be created merely to populate the ledger.

## 12. Representative official-filing source-capability batch

The filing track is no longer described only as “official filings required”.

A representative **AKUMS** source-capability batch is defined from already cached discovery evidence.

### Cached candidate artifacts

**Artifact F0-A — AKUMS Investor Presentation**
- issuer/security: AKUMS;
- cached provider document ID: \`2256940\`;
- cached document type: Investor Presentation;
- source publication date represented in cache: **8 August 2026**;
- existing research_document ID: \`4a4db3f9-a589-4467-984b-1e2c43616ba6\`;
- existing research_document_source ID: \`227cc876-f958-4b86-8a51-bf94c999c803\`;
- current identity/source status: REVIEW_REQUIRED;
- current official source URL: absent;
- current canonical content hash: absent.

The cached body includes the issuer disclosure reference \`Akums/Exchange/2026-27/39\`, NSE/BSE addressees, symbol AKUMS, and the investor-presentation disclosure date. This is sufficient to identify the artifact for official-source discovery, but it is not treated as an official captured body.

**Artifact F0-B — AKUMS Result / financial statement**
- cached provider document IDs visible in the preserved document-search response: \`2256758\` and \`2256745\`;
- represented date: **8 August 2026**;
- explicit source-table periods visible in discovery evidence include quarter ended **30 June 2026**, quarter ended **31 March 2026**, quarter ended **30 June 2025**, and year ended **31 March 2026**;
- consolidated financial/segment headings are visible in the discovery payload.

The two provider IDs must be treated as possible duplicate/section representations until an official content hash proves whether there is one or more underlying official documents.

### Requirement mapping

F0-A is a source-capability canary for documentary requirements such as AKUMS \`GOVERNANCE_EVENT_REVIEW\` and \`REGULATORY_RISK\`; capturing one document does **not** by itself satisfy their multi-evidence minima.

F0-B is a source-capability canary for financial-period extraction. It can prove whether the official result supplies exact period/scope/value cells usable by canonical metric contracts. One FY2026 result does **not** satisfy three-year ROCE or eight-period operating-margin requirements by itself.

### Reusable adapters

Reusable without running P8:
- the strict official-host / redirect / content-hash capture safety pattern from the preserved N4C linked-document work;
- existing immutable \`data_source_records\` lineage conventions;
- existing exact source-field parsing and canonical input validator;
- pure XBRL/reporting-period parsing knowledge where an official artifact is XBRL;
- the repaired V1-4 review adapter for final source/document/value/period identity validation.

Genuinely missing before capture expansion:
- a generic research-document official-source URL resolver that turns the cached artifact identity into an exact NSE/BSE/issuer URL;
- a V1-4 capture wrapper using the existing bounded ingestion-control contract rather than the P8/R2 path.

### F0-DISCOVERY — approval-ready, not executed

Purpose: resolve exact official URLs for **only F0-A and F0-B** before any raw document capture.

Boundary:
- security: AKUMS only;
- target artifact identities: provider document 2256940 and result identities 2256758/2256745 dated 8 August 2026;
- permitted official origins: NSE/BSE or issuer-hosted filing pages/documents only;
- maximum external discovery requests: **4**;
- retries: **0**;
- provider/commercial calls: **0**;
- database writes: **0**;
- storage/R2 writes: **0**;
- review/observation/snapshot/item/selection/lineage writes: **0**.

Mandatory capability proof:
- exact official URL;
- issuer/symbol/date/document-type agreement with cached identity;
- no redirect to an unapproved host;
- if two cached result IDs resolve to the same official artifact, deduplicate before any capture proposal.

Stop rule:
- stop after exact URL resolution for the representative artifacts, or immediately if issuer/document identity cannot be proven within the four-request ceiling;
- report URLs and proposed one-document raw-capture budget separately;
- do not fetch/store the document body under this discovery approval.

Acquisition success at F0-DISCOVERY would remove only **OFFICIAL_URL_UNKNOWN**. It would not remove content-identity, factual-review, normalization or readiness blockers.

## 13. Concrete next approval boundary after repair

The independent next actions are now:

- **H1** — approve the previously specified six-request, zero-retry official NSE Oct 1/5 history-authority capture as an independent amendment. Acquisition success does not equal readiness success.
- **O1** — approve exactly the two previously specified SBIN/WABAG ownership calls, zero retries, with capture-only writes.
- **F0-DISCOVERY** — approve at most four official-source discovery requests for the AKUMS representative investor-presentation/result artifacts, with zero writes and no raw body capture.

**T1 remains NOT EXECUTABLE. B1 remains NOT EXECUTABLE. No broad filing expansion is requested.**

Any H1/O1/F0 evidence retrieved after the historical 5 October cutoff must be evaluated prospectively under an explicit later source cutoff. Frozen membership and frozen valuation do not change. No retrieval or review timestamp may be backdated.

V1-4 remains **IN PROGRESS / NOT PROVEN** and V1-5 remains unauthorized.


---

## 14. Owner-approved H1 / O1 / F0-DISCOVERY execution — 6 October 2026

Owner authorization:

> Approved: H1, O1 and F0-DISCOVERY as three independent bounded batches under their documented ceilings. No T1 parameter campaign, no review persistence, no canonical materialization, no broad filing expansion, and no V1-5 work. Stop and report after each acquisition/discovery batch.

### H1 — COMPLETE / CAPTURE SUCCEEDED

Run ID: \`e2e978fa-004f-450c-840f-bdcd00df271d\`.

External request usage: **6/6**, retries **0**. All six requests returned HTTP 200.

Captured immutable source records:

1. NSE 1-Oct-2026 bhavcopy
   - record: \`0775efe3-8781-4900-9bff-c79af88e9b61\`
   - SHA-256: \`ccc5fb27872716bbcc99d2d87e522ab304f6620e11c3a5045c30e1ff25cbfb73\`
   - 208,712 bytes
2. NSE 5-Oct-2026 bhavcopy
   - record: \`f19dce57-6f6d-42d7-a677-d3bc1fcdb454\`
   - SHA-256: \`43913a4ef72663e2d3fbb0c3b9c686ed8c3d23e5df6ee6b756f8a5c954559ceb\`
   - 207,906 bytes
3. NIFTY 500 TRI response, 1-Oct through 5-Oct-2026
   - record: \`87baa591-3b0d-4f1c-96ce-9ce2bc6b4c88\`
   - SHA-256: \`605642b3800bd48aa58c4d5bfc27a5026f17d0df4631439e7a529358f41c21a6\`
   - 79,251 bytes
4. NSE corporate actions, 1-Oct through 5-Oct-2026
   - record: \`7244f482-177e-4622-b2d2-b3dff9f45e00\`
   - SHA-256: \`e5cce8c71c996a4b061dba76a3ef79becec5e614580a3f39be21dd2651205eee\`
   - 1,442 bytes

No commercial-provider usage event, market-history row, fundamental observation, review row, snapshot/item/selection/lineage row, R2 write or P8 execution occurred.

H1 acquisition success is **not** readiness success. Validation/normalization/materialization remains a separately controlled next step.

The one-time H1 executor was retired behind JWT protection and HTTP 410.

### O1 — COMPLETE / CAPTURE SUCCEEDED

Run ID: \`8888f406-42c2-4766-960c-a7c5b8e5a1b7\`.

Provider tool attempts: **2/2**, retries **0**.

1. SBIN \`get_ownership_deals_insider_sast({"stock_code":"SBIN","type":"shareholding"})\`
   - raw source record: \`95adfc40-0b3d-4bbd-b556-7b8811910243\`
   - SHA-256: \`ce526833ed71e80d96dd2f28344d2d0b01baa95d4c2df7cb09ebed3e48e8f32c\`
   - provider result length: 5,911 chars
2. WABAG \`get_ownership_deals_insider_sast({"stock_code":"WABAG","type":"shareholding"})\`
   - raw source record: \`0ed88b27-bd50-4d90-bf5c-71145dd88103\`
   - SHA-256: \`4e78559c7b0c3b7d530b6711e78123207de55e11d985145fb8f4c1570886f057\`
   - provider result length: 5,981 chars

No fundamental observations, requirement reviews, snapshots/items/selections/lineage were written.

O1 capture success is **not** readiness success. Series/basis, quarter-window, freshness and conflict review remain required by the repaired validator.

The one-time O1 executor was retired behind JWT protection and HTTP 410.

### F0-DISCOVERY — COMPLETE / OFFICIAL URLS RESOLVED

External discovery requests used: **2/4 maximum**, retries **0**, writes **0**.

Exact NSE query for AKUMS on 8-Aug-2026 resolved the representative artifacts:

1. Investor Presentation
   - announcement: Analysts/Institutional Investor Meet/Con. Call Updates
   - time: 08-Aug-2026 17:16:45
   - NSE attachment:
     \`https://nsearchives.nseindia.com/corporate/NSEAKUMS10_08082026171637_AKUMSINVESTORPRESENTATION.pdf\`
   - NSE sequence ID: \`106733318\`
   - NSE ISIN: \`INE09XN01023\`
   - file size reported by NSE: 2.87 MB

2. Financial-results / board-outcome candidate A
   - announcement: Updates
   - time: 08-Aug-2026 16:13:39
   - disclosure text: unaudited financial results for quarter ended 30-Jun-2026
   - NSE attachment:
     \`https://nsearchives.nseindia.com/corporate/NSEAKUMS10_08082026161109_AKUMSBMOUTCOME.pdf\`
   - sequence ID: \`106733132\`
   - reported size: 5.66 MB

3. Financial-results / board-outcome candidate B
   - announcement: Outcome of Board Meeting
   - time: 08-Aug-2026 15:46:10
   - disclosure text: financial results for period ended 30-Jun-2026
   - NSE attachment:
     \`https://nsearchives.nseindia.com/corporate/NSEAKUMS10_08082026154548_AKUMSBMOUTCOME.pdf\`
   - sequence ID: \`106733103\`
   - reported size: 5.66 MB

The two 5.66 MB result candidates may be duplicate/revised representations. They were **not** fetched in F0-DISCOVERY, so no content-hash deduplication is claimed.

F0-DISCOVERY removed only \`OFFICIAL_URL_UNKNOWN\` for the representative artifacts. Content identity, canonical hash, factual extraction, review validation and readiness remain unproven.

The one-time F0 discovery executor was retired behind JWT protection and HTTP 410.

### Stop boundary after the three batches

All three owner-approved independent batches are complete.

No further action is authorized in this execution:
- no T1 parameter campaign;
- no review persistence;
- no canonical observations/materialization;
- no broad filing expansion;
- no raw F0 filing-body capture;
- no H1 normalization/materialization;
- no O1 reviewed-evidence persistence;
- no V1-5.

Any next step requires a new explicit owner approval.

V1-4 remains **IN PROGRESS / NOT PROVEN**.
