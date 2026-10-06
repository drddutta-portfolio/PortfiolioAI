# PortfolioAI V1-4 Action B — approved boundary execution record

Date: 6 October 2026

## Disposition

**REVIEW LEDGER = COMPLETE / PASS. TRENDLYNE CAPABILITY CANARY = COMPLETE / FAIL-CLOSED. NSE HISTORY-AUTHORITY ACQUISITION = NOT EXECUTED DUE PRIOR CANARY FAILURE. V1-4 = IN PROGRESS / NOT PROVEN. V1-5 = NOT STARTED / NOT AUTHORIZED.**

Owner approved all three previously defined actions. The execution order was fixed:
1. additive requirement-review ledger;
2. one Trendlyne dated-field capability canary;
3. bounded official NSE current-session/corporate-action authority acquisition.

The execution contract required stopping immediately if an earlier contract failed. Step 2 failed its capability acceptance test, so Step 3 was intentionally not executed.

## 1. Requirement-level review ledger — COMPLETE / PASS

Repository migration:
`supabase/migrations/20261006034500_create_v14_requirement_review_ledger.sql`

Repository commit:
`98f5c72080d71e030c363309efd50dff50be1c85`

Applied only to Development Supabase:
`PortfolioAI Dev / lrgpjimipfkyoqbpsqzz`

Created:
`public.research_evidence_requirement_reviews`

The table is additive and append-only. It carries:
- portfolio/security/requirement;
- review kind and decision;
- immutable source-record and/or canonical research-document anchor;
- provider document identifier where available;
- source payload hash;
- exact supporting quote;
- period start/end/type;
- unit, currency and consolidation scope;
- publication/retrieval/freshness anchors;
- review version, reviewer, reviewed time;
- deterministic review hash;
- supersession lineage;
- metadata.

Controls:
- RLS enabled;
- owner-scoped authenticated SELECT only;
- service-role write authority;
- public/anon/authenticated write privileges revoked;
- UPDATE/DELETE rejected by the existing append-only research-evidence mutation guard;
- source/document foreign keys use RESTRICT;
- hash format and period-order checks;
- source anchor required unless the terminal factual decision is explicitly `INSUFFICIENT`.

No review row was inserted merely to prove the schema. Current row count after migration and canary: **0**.

The table is not a readiness override. A review can only become useful after its anchored source facts pass the V1-4 validator/materializer contract.

## 2. Trendlyne dated-field capability canary — COMPLETE / FAIL-CLOSED

Deterministic Phase 1 target:
- security: **AKUMS**
- security id: `89d94355-8c96-4d21-8bb7-1e3bcf096a93`
- provider instrument id: `2471889`
- requirement: `ROCE_OR_ROIC`
- tool: `get_parameter_values_multi_stock`

The exact Phase 1 request asked for:
- ROCE Ann. %;
- 3 distinct dated YEAR reporting periods;
- period start/end;
- unit/scale;
- currency where applicable;
- consolidated/standalone scope;
- publication dates;
- exact source field labels;
- no relative-year substitute as reporting-period proof.

One Development-only, run-once Edge canary was temporarily deployed using the existing Trendlyne MCP secret and Supabase provider controls. The invocation required a one-use custom secret and database idempotency guard. After the result was obtained, the function was immediately redeployed as a retired `410` responder with `verify_jwt:true`, so the execution surface cannot be reused.

Provider execution record:
- ingestion run: `9242df7e-8d6d-4f8f-b608-07f22864f609`
- raw source record: `cf7ac23d-7314-412a-81fc-71405df95c1e`
- response SHA-256: `1835639d2bc5138a52f185d3bce20f1c52375935e9fc9068f008c508f79f9919`
- provider attempts: **1**
- retries: **0**
- provider usage rows: **1**
- actual internal units: **1**
- raw evidence records appended: **1**
- canonical fundamental-observation writes: **0**
- review-ledger writes: **0**
- readiness/snapshot/selection/lineage writes: **0**

Transport/tool invocation itself succeeded. Capability acceptance did not.

Observed metadata contract:
- explicit ISO date count: **1**
- explicit date: **2026-10-06**
- period-type language: **present**
- reporting scope: **absent**
- unit metadata: **absent**
- publication metadata: **absent**
- capability result: **FAIL**

The one date is the current/provider-response date and does not establish three dated historical reporting periods. The response therefore cannot satisfy `normalizeReviewedField` or the approved V1-4 source-bound reporting-period contract.

No retry was allowed or attempted.

## 3. Official NSE current-session/corporate-action authority acquisition — STOPPED / NOT EXECUTED

This action was owner-approved but was third in the ordered execution chain. Because the Trendlyne capability canary failed, the fail-closed contract required stopping before any further external acquisition.

Therefore:
- no NSE network acquisition was executed;
- no 1 October / 5 October official-source record was written;
- no P8 workflow was run;
- no R2 write occurred;
- no Angel One history request occurred.

The previously identified history-authority gap remains explicit.

## 4. Final live Development reconciliation

After the schema migration and exactly one provider attempt:

- research evidence snapshots: **1,485** — unchanged;
- research evidence snapshot items: **22,401** — unchanged;
- research evidence snapshot selections: **956** — unchanged;
- research evidence snapshot lineage rows: **478** — unchanged;
- fundamental observations: **2,475** — unchanged;
- provider usage events: **1,721** — exactly +1;
- data source records: **4,817** — exactly +1 raw canary source;
- requirement review rows: **0**.

No readiness state was promoted.

## 5. Consequence for the 46 conditional Trendlyne requests

The canary proves that the existing `get_parameter_values_multi_stock` path cannot currently be treated as a metadata-complete dated-field acquisition source for V1-4.

Therefore:
- the remaining 45 planned Trendlyne raw requests are **not authorized for expansion** by this canary;
- the 46-row Phase 1 list remains a conditional discovery list, not a provider campaign;
- missing dated period/scope/publication facts must be obtained from another approved source path (for example authoritative issuer/exchange filing evidence) or remain fail-closed.

This does not prove that Trendlyne lacks the facts anywhere. It proves that this tested tool/response contract did not return the required metadata for the bounded canary.

## 6. Current stop boundary

V1-4 is still **IN PROGRESS / NOT PROVEN**.

The next work should not retry the same Trendlyne endpoint. It requires a new source-path decision for missing financial reporting metadata, while the separately approved NSE 1/5 October authority action remains unexecuted because the ordered execution chain stopped at the failed provider canary.

No Production/main, V1-5, P8 execution, R2 write, scheduler, Auth change, restore, or canonical-readiness mutation occurred.
