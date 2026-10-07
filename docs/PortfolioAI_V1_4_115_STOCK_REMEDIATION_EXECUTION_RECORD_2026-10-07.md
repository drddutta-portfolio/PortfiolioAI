# PortfolioAI V1-4 — 115-Stock Remediation Execution Record — 7 October 2026

## Final disposition

**115-stock remediation execution = COMPLETE. V1-4 acceptance = NOT PROVEN. V1-5 = NOT AUTHORIZED.**

This record captures the completed evidence-remediation execution for the exact 115-stock population anchored to selection run `b2091394-4b6b-4016-bbe9-75c9d58f3e23`.

No Production/main, P8, scheduler, Auth/RLS or migration change was made.

## Exact population anchor

Private execution manifest:

`docs/private/PortfolioAI_V1_4_115_EXECUTION_MANIFEST_2026-10-07.json`

- exact stocks: **115**
- deterministic materializer offsets: **0–114**
- overlap with frozen 111 release cohort: **76**
- frozen 111 manifest hash preserved:
  `79f551558333adc1f37d6a26298d8088ee02db3161f03c6d6e59f9a19a93fc27`

The 115-stock remediation population and the frozen 111 release denominator remain separate.

## Starting canonical state

Original 115-stock run:

`b2091394-4b6b-4016-bbe9-75c9d58f3e23`

- REVIEW_REQUIRED: 113
- CONFLICTING: 1
- INSUFFICIENT: 1
- READY: 0

The original missing-evidence census contained 770 `REQUIRED_EVIDENCE_MISSING` requirement items across 113 stocks.

## Cache-first / provider coverage reconciliation

Before new Trendlyne acquisition:

- 79/115 stocks already retained all four research-domain captures.
- 36/115 lacked the full four-domain set.
- all 115 had matched Trendlyne identities.

The four research domains were:

1. overview / TTM fundamentals;
2. detailed fundamentals;
3. ownership;
4. document discovery.

Provider controls at start of acquisition were green:

- source: `TRENDLYNE_MCP`
- ingestion enabled: true
- entitlement verified: true
- retention rights verified: true
- quota status: VERIFIED
- daily internal attempt limit: 1,000
- per-run attempt limit: 40
- calls used before this remediation: 0.

## Trendlyne acquisition execution

A one-stock ALIVUS canary proved the existing `complete-research-refresh` path before broader acquisition.

The canary verified:

- exact Trendlyne identity;
- one-time scoped grant handling;
- raw capture retention;
- provider usage accounting;
- no metadata invention;
- review-required fallback where dated reporting period/scope was not proven.

The 36 no-capture stocks were then processed through the existing provider path using one-shot locks and fresh scoped grants.

Final acquisition state:

- **113/115 stocks**: all four research domains retained;
- **E2E**: 3/4 domains; document discovery remains rejected because of provider primary-entity mismatch;
- **ICEMAKE**: 3/4 domains; document discovery remains unresolved/fail-closed.

Trendlyne provider accounting for the day:

- actual provider attempts: **148**
- successful provider events: **148**
- failed provider events: **0**
- automatic retries: **0**

No covered stock was deliberately re-fetched once valid retained evidence was present.

## Canonical rerun

A new exact-115 canonical selection run was created:

`b88f4d34-287c-4974-b5b6-14f6e5a4b28a`

Evaluation/source cutoff:

`2026-10-07T09:53:53Z` / 15:23:53 IST, before NSE normal-market close.

The 115 stocks correspond exactly to materializer offsets 0–114 in deterministic symbol order.

The run was executed as 23 provider-free slices of five stocks.

Five slices initially failed safely because the concurrent submissions caused statement/connection-pool timeouts. Those five offsets were re-run sequentially under fresh grants and all completed HTTP 200. Failed/consumed grants were not reused.

## Result after remediation

Final canonical result for the 115-stock rerun:

- **READY: 0**
- **REVIEW_REQUIRED: 114**
- **CONFLICTING: 1**
- **INSUFFICIENT: 0**

The conflicting stock is:

- `HINDUNILVR`

No HOLD/default recommendation fallback was used.

## Remaining blocker census

Non-FRESH requirement items after the remediation rerun:

| Reason | Requirement items | Affected stocks |
|---|---:|---:|
| NORMALIZED_INPUT_CONTRACT_NOT_PROVEN | 346 | 113 |
| REQUIRED_EVIDENCE_MISSING | 460 | 112 |
| DOCUMENT_EVIDENCE_REQUIRES_REVIEW | 292 | 110 |
| HISTORY_LATEST_SESSION_STALE | 205 | 73 |
| DATED_REPORTING_PERIODS_NOT_PROVEN | 189 | 52 |
| REPORTING_PERIOD_INVALID | 50 | 39 |
| HISTORY_CONTRACT_NOT_PROVEN | 91 | 38 |
| REPORTING_PERIOD_TYPE_NOT_PROVEN | 31 | 23 |
| METRIC_CONTRACT_NOT_REVIEWED | 33 | 22 |
| BENCHMARK_OR_STOCK_HISTORY_MISSING | 11 | 11 |
| DISTINCT_SESSIONS_INSUFFICIENT | 4 | 2 |
| CORPORATE_ACTION_TREATMENT_NOT_PROVEN | 1 | 1 |
| METHODOLOGY_REVIEW_REQUIRED | 1 | 1 |
| BENCHMARK_MAPPING_NOT_PROVEN | 1 | 1 |

Important: these are **requirement-item counts, not stock counts**. A single stock may contain multiple blocker types.

## Owner-review contract is now the principal gating dependency

The latest run contains:

- 638 non-FRESH items whose remediation action is `REVIEW_DOCUMENT_EVIDENCE`;
- those review-dependent items affect 114/115 stocks.

The reviewed-evidence validator requires:

- review version `V1_4_REQUIREMENT_REVIEW_V2`;
- approved review kind (`OWNER_NUMERIC_REVIEW`, `OWNER_OWNERSHIP_REVIEW`, or `OWNER_DOCUMENT_REVIEW`);
- a valid source/document binding;
- exact source hash and quote/fragment binding;
- complete period/unit/scope metadata where applicable;
- integrity hash;
- and critically: `reviewed_by` must equal the PortfolioAI portfolio owner.

The repository contains no previously approved deterministic owner-review policy that can lawfully auto-sign these rows.

Therefore this execution did **not**:

- impersonate the portfolio owner;
- invent review decisions;
- fabricate period dates, units or consolidation scope;
- weaken the review validator;
- or mark review-required evidence FRESH automatically.

## Remaining automatic blockers

The rerun also still identifies history/benchmark/input-contract items. These remain fail-closed and can be remediated in further V1-4 work, but they cannot produce a READY release cohort while the owner-review gate remains unsatisfied across 114 stocks.

## Temporary function cleanup

Temporary 115-remediation execution functions were retired behind JWT protection / HTTP 410 after use:

- `v14-115-alivus-canary2`
- `v14-115-alivus-remainder`
- `v14-115-capture-batch`
- `v14-115-residual-capture`

## Final V1-4 status

**Evidence acquisition/remediation execution for the exact 115-stock population is complete.**

**V1-4 itself remains IN PROGRESS / NOT PROVEN because the canonical READY count is still 0 and the mandatory owner-review ledger has not been factually approved by the portfolio owner.**

The next legitimate step is not another blind provider campaign. It is to prepare/approve the owner-bound review ledger for the retained evidence, then re-run canonical materialization and continue only the residual automatic history/benchmark/input-contract repairs that remain after that review is applied.

V1-5 remains unauthorized.
