# PortfolioAI V1-4 Action B — cache-first reconciliation and exact execution boundaries

Date: 6 October 2026

## Disposition

**CACHE-FIRST RECONCILIATION = COMPLETE / PASS. V1-4 = IN PROGRESS / NOT PROVEN. V1-5 = NOT STARTED / NOT AUTHORIZED.**

Starting authoritative remote Development HEAD: `af18ade2b049618a384fbf171785ade833d6fcf3`.

This record continues Action B Phase 1. It is not a replacement audit, does not alter the frozen V1-4 contract, and does not authorize provider execution, schema changes, P8 execution, R2 writes, schedulers, Production/main, or V1-5.

The existing private Phase 1 acquisition CSV remains the exact member/requirement ledger for all **1,608 mandatory jobs / 111 frozen members**. Its disposition counts were independently re-read from all 1,608 rows and match the Phase 1 record exactly:

| disposition | jobs |
|---|---:|
| CACHE_CANONICAL_VALIDATED | 2 |
| CACHE_FIELD_METADATA_REVIEW | 183 |
| CACHE_QUARTER_REVIEW | 108 |
| CACHE_EXCERPT_REVIEW | 274 |
| ACQUIRE_RAW_THEN_REVIEW | 49 |
| BLOCKED_CONTRACT | 685 |
| BLOCKED_HISTORY_AUTHORITY | 307 |

Frozen membership, approved manifest SHA-256 `79f551558333adc1f37d6a26298d8088ee02db3161f03c6d6e59f9a19a93fc27`, and frozen value **132,585,696 paise** remain unchanged.

## 1. Numeric cache review — source metadata absence is now proven

The 183 `CACHE_FIELD_METADATA_REVIEW` jobs were reconciled against the latest selected canonical snapshots and the immutable source records referenced by their retained observations.

Current state of those 183 jobs:
- 174 REVIEW_REQUIRED;
- 9 MISSING;
- 0 selected evidence rows;
- 0 item-level evidence-as-of dates;
- 0 item-level fresh-through dates.

Current blocker reasons:
- 84 `REPORTING_PERIOD_INVALID`;
- 53 `METRIC_CONTRACT_NOT_REVIEWED`;
- 34 `REPORTING_PERIOD_TYPE_NOT_PROVEN`;
- 9 `REQUIRED_EVIDENCE_MISSING`;
- 2 `CANONICAL_UNIT_MISMATCH`;
- 1 `DATED_REPORTING_PERIODS_NOT_PROVEN`.

The 174 retained normalized payloads reference 287 observation appearances across **183 distinct immutable source records**. Read-only inspection found:
- **0/183 source records with an explicit ISO reporting date in the retained payload**;
- **0/183 source records with a source publication timestamp**;
- scope words exist in some payloads, but scope alone cannot establish period/date/publication metadata.

Therefore these jobs cannot be made canonical by relabeling the existing observations. Retrieval dates, relative-year text, query wording, or generic Annual/Quarter labels must not be used as reporting-period proof. No normalization/write was attempted.

## 2. Existing review schema is insufficient for the required source-bound review contract

The approved tables were inspected read-only.

`fundamental_observation_decisions` can select an existing observation and store a decision basis, but it does not turn an undated observation into a source-proven dated fact. `research_documents` / `research_document_sources` preserve document identity/source lineage, but there is no current append-only requirement-level factual-review ledger carrying all of:

- portfolio/security/requirement;
- review kind and decision;
- immutable source-record/document anchor;
- source payload/content hash;
- exact supporting quote/citation;
- reviewer + review version + reviewed time;
- exact period start/end/type where applicable;
- unit, currency and reporting scope where applicable;
- publication/retrieval/freshness anchors;
- deterministic review hash and supersession lineage.

Do not repurpose classification review, source raw-record, or reconciliation tables to conceal this absence.

### Proposed additive schema — NOT APPLIED

Approval is requested for one additive append-only table, proposed name:

`research_evidence_requirement_reviews`

Minimum contract:

```
id uuid primary key default gen_random_uuid()
portfolio_id uuid not null
security_id uuid not null
requirement_code text not null
review_kind text not null
decision text not null
source_record_id uuid null
research_document_id uuid null
provider_document_id text null
source_payload_hash text null
supporting_quote text null
period_start date null
period_end date null
period_type text null
unit text null
currency text null
consolidation_scope text null
published_at timestamptz null
retrieved_at timestamptz null
fresh_through timestamptz null
review_version text not null
reviewed_by uuid null
reviewed_at timestamptz not null default now()
review_hash text not null
supersedes_review_id uuid null
metadata jsonb not null default '{}'::jsonb
created_at timestamptz not null default now()
```

Required controls if approved:
- append-only UPDATE/DELETE rejection;
- deterministic unique review hash/idempotency;
- owner-scoped read and trusted-server write only, preserving existing security model;
- source-record/document foreign-key validation where the anchor is present;
- no review may supply a missing factual field unless that fact is literally supported by the anchored source;
- `INSUFFICIENT` is a valid terminal factual review and must remain fail-closed;
- materializer may consume only a reviewed/versioned requirement record whose source hash and exact facts revalidate.

No migration was applied.

## 3. History authority — reusable P8 evidence exists, but current coverage is not complete

Read-only reuse analysis was performed without running P8 or writing R2.

Existing official-source archive registry:
- NSE cash-market bhavcopy archives: continuous stored archive coverage through **30 September 2026**;
- NSE corporate-action monthly archives: October 2023 through **30 September 2026**;
- NIFTY 500 TRI monthly archives: October 2023 through **30 September 2026**;
- all enumerated archive rows carry content hashes.

The completed R2 raw-price campaign record reports **744 trading-date partitions** through **30 September 2026** and no raw-price database writes during that campaign.

Frozen-cohort linkage:
- **111/111 frozen members** link to P8 historical identities;
- from 1 September 2025 onward, 147 corporate-action normalizations are linked to frozen members;
- 6 linked normalization rows are BLOCKED;
- 141 adjustment-factor events exist for the cohort in that window;
- **0 frozen members have a BLOCKED adjustment factor** in that window.

This proves that reusable adjustment evidence exists. It does **not** prove complete V1-4 adjustment coverage because the authority registry stops at 30 September while the frozen evaluation/source cutoff is 5 October.

Official NSE calendar evidence identifies **2 October 2026 as a trading holiday**; 3–4 October are weekend days. Therefore the authority gap after the archived September boundary is limited to trading sessions **1 October and 5 October 2026**. The active `market_price_history` cache is older still for most securities: 238 current securities end at 24 September, and among the frozen 111 the cached session counts range from 190 to 285; 110/111 have at least 252 rows, but 0 frozen members have adjusted-close rows or adjustment-methodology provenance in that active table.

No raw candle count was accepted as proof of adjustment/calendar alignment.

## 4. Benchmark reconciliation

Current Development `market_benchmarks` contains 10 VERIFIED Angel One mappings, including NIFTY 500, Auto, Bank, Financial Services, FMCG, Infrastructure, IT, Metal, Pharma and Realty.

The frozen selected snapshots still contain 32 `BENCHMARK_MAPPING_NOT_PROVEN` jobs because several methodology authorities require benchmark codes not present in that 10-code registry, including examples such as NIFTY Consumer Services, Consumer Durables, Capital Goods, Telecom, Oil & Gas, Services Sector, Transportation & Logistics, and Pharma subprofile authority resolution. Existing mapped codes must not be generalized to those missing authorities.

Therefore the 32 jobs are not a single stale-snapshot defect; some require an exact approved benchmark authority/token plus its history.

## 5. Provider execution contract — current 46-call list remains conditional

No provider request was executed.

The Phase 1 **46 Trendlyne raw requests remain conditional**. Cache inspection proved that the retained exact numeric payloads often lack the dated-period/publication metadata required for canonical normalization, but it did not prove that the existing Trendlyne parameter endpoint can supply those facts. A provider tool name or requested query text is not evidence that the response contract satisfies V1-4.

Before a campaign can be approved, execute only a separately owner-approved contract canary:

### Acquisition canary A — Trendlyne dated-field capability

- provider: Trendlyne MCP;
- attempts: **1**;
- member: one frozen member already having an exact-field job, chosen deterministically from the private plan;
- endpoint: existing `get_parameter_values_multi_stock`;
- purpose: verify whether one response can explicitly supply exact field value + dated reporting period + period type + reporting scope + unit/currency as applicable + publication/source metadata;
- raw source writes: max **1** immutable `data_source_records` row;
- provider-usage writes: exactly one attempt event plus the existing bounded run/item/budget/grant bookkeeping required by the dispatcher;
- canonical observation writes: **0** during canary;
- retries: **0**;
- stop: any identity mismatch, missing explicit date/scope, unsupported source authority, parser mismatch, bookkeeping overrun, or provider/control failure.

A successful canary authorizes only capability evidence, not the remaining 45 requests.

### Acquisition canary B — current official-session authority

A separate bounded source-acquisition contract is required for the official NSE session/corporate-action authority after 30 September. The exact missing exchange dates are **1 October and 5 October 2026**; 2 October is an official holiday and 3–4 October are weekend days.

This must use an approved V1-4 source path, not execute the paused P8 campaign. It must capture immutable source hash, retrieval/publication metadata available from the source, and prove both session existence and corporate-action coverage through the V1-4 cutoff. No Angel One candle request alone can prove corporate-action completeness.

Until that path is approved/implemented, history remains REVIEW_REQUIRED.

## 6. What was completed without approval escalation

- authoritative remote Development HEAD reverified;
- Phase 1 private 1,608-row ledger re-read and counts reconciled;
- live Development Edge versions reverified: `complete-research-refresh` v30 and `p7-ic2-materialize-readiness` v20;
- no source/evidence/readiness/provider write occurred;
- 183 cached numeric jobs audited against their immutable source records;
- current benchmark mappings reconciled against frozen benchmark blockers;
- P8/R2 source registries inspected read-only and frozen historical identity coverage reconciled 111/111;
- current history cache coverage and adjustment provenance measured;
- approved schema reviewed for a durable source-bound factual-review path;
- exact schema and external-execution boundaries defined.

## 7. Exact current stop condition

V1-4 cannot truthfully be marked PASS at this point.

The remaining member/requirement authority is still the private Phase 1 CSV. Its unresolved rows are not replaced or hidden by this record.

The next execution requires owner approval for:
1. the additive `research_evidence_requirement_reviews` schema contract (migration still prohibited until approved); and
2. the two minimal external capability/source canaries above, each separately bounded and fail-closed.

After those approvals, implementation must first prove the reviewed-fact persistence/materializer path and the two canaries before expanding any acquisition volume.

No V1-5, Production/main, provider campaign, P8 execution, R2 write, scheduler, Auth/RLS change, migration, or restore was performed in this reconciliation.
