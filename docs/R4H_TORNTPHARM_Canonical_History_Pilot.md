# R4H — TORNTPHARM Canonical Pharma-History Ingestion Pilot

Status: **REPOSITORY PILOT PREPARED — PRODUCTION WRITE NOT APPROVED / NOT EXECUTED**

## Scope

R4H converts retained, already-paid Trendlyne Pharma-history discovery evidence into an exact, conflict-aware canonical write manifest for the reference holding `TORNTPHARM`. It makes **zero provider calls** and does not infer missing values.

The pilot preserves the PortfolioAI evidence layers:

1. retained provider records remain raw evidence;
2. semantically exact provider values may become canonical `fundamental_observations`;
3. PortfolioAI derives ratios such as quarterly OPM downstream from canonical raw inputs;
4. PHARMA_V1 readiness/scoring remains fail-closed until its full metric history contract is satisfied.

## Production baseline inspected read-only

Security:

- symbol: `TORNTPHARM`
- security_id: `da69b3eb-0343-44f8-912c-288b826118cc`

Retained source records:

| Record | Source record id | Retrieved at UTC | Payload hash |
|---|---|---|---|
| `PHARMA_HISTORY_CONTRACT_DISCOVERY_V2` | `e4c0c920-c3b2-47b9-bda4-26638b407237` | 2026-09-14 09:07:26.158 | `5320eb0d82e333fe47c6bba5db7be0b9cdb252caffb90e7fc9891d7c8855dbb9` |
| `PHARMA_HISTORY_CONTRACT_DISCOVERY_V3` | `2ba94f8c-d34e-4658-926c-5694c21cc9e5` | 2026-09-14 09:08:57.330 | `8bc12e898c251b3db099236e133ae11beccec6985b7d2ea53673967b2ad13486` |

`fundamental_observations` has one `source_record_id` FK per observation. Therefore the executable pilot chooses **one direct raw source record per row**. When V2 and V3 contain the same exact label/value, the later retained capture V3 is primary and V2 is recorded only as corroborating raw lineage in the repository preview. No synthetic provider record is created merely to combine provenance.

Read-only inspection also confirmed that production currently has no definitions for `REVENUE_ANNUAL`, `OPERATING_REVENUE_QUARTER`, or `OPERATING_PROFIT_QUARTER`; `CFO_ANNUAL` already exists. R4H therefore prepares an additive, separately gated metric-definition migration rather than misusing `REVENUE_TTM` or `OPM_TTM`.

## Period identity

`TORNTPHARM_PERIOD_IDENTITY_V1` is based on issuer/exchange evidence establishing:

- financial year: 01 April–31 March;
- latest completed annual period: 31 March 2026;
- latest completed quarter in the retained discovery context: 30 June 2026.

Therefore relative labels are mapped as:

- Y0 2026-03-31, Y1 2025-03-31, Y2 2024-03-31, Y3 2023-03-31, Y4 2022-03-31, Y5 2021-03-31;
- Q0 2026-06-30, Q1 2026-03-31, Q2 2025-12-31, Q3 2025-09-30, Q4 2025-06-30, Q5 2025-03-31, Q6 2024-12-31, Q7 2024-09-30, Q8 2024-06-30.

These dates are security-specific pilot evidence. PortfolioAI must not generalize the mapping to another issuer without proving that issuer's fiscal calendar and anchor period.

## Semantic revenue guard

The stored provider response mixes distinct concepts:

- `Operating Rev. Ann.` = operating revenue;
- `Total Rev. Ann. 1Y Ago` / generic `Rev. Ann.` history = not proven to be the same operating-revenue concept.

R4H therefore permits only exact `Operating Rev.` labels for the `REVENUE_ANNUAL` history. It does **not** use `Total Rev.` or generic `Rev. Ann.` values to manufacture a multi-year operating-revenue series.

Result: only Y0 annual operating revenue is currently eligible; PHARMA revenue-growth history remains pending.

## Exact candidate canonical write manifest

All 20 candidate rows use:

- `security_id = da69b3eb-0343-44f8-912c-288b826118cc`
- `source_code = TRENDLYNE_MCP`
- `source_record_id = 2ba94f8c-d34e-4658-926c-5694c21cc9e5` (V3)
- `numeric_value` only
- `unit = Cr`
- `currency = NULL` (matching existing retained Trendlyne crore-valued observations; the canonical metric definition owns the `INR_CRORE` semantic)
- `consolidation_scope = UNKNOWN`
- `evidence_status = AVAILABLE`
- `period_type` as shown below
- `retrieved_at = 2026-09-14 09:08:57.330+00` from the selected V3 raw record
- freshness derived from the metric definition at commit time

The production commit path must use the existing unique observation key:

`security_id, metric_code, source_code, period_end, period_type, consolidation_scope, source_record_id`

and `upsert(... ignoreDuplicates: true)` or an equivalent `ON CONFLICT DO NOTHING` against that exact key so replay is idempotent.

| # | Metric | Period | Period end | Value | Exact provider label |
|---:|---|---|---|---:|---|
| 1 | `REVENUE_ANNUAL` | Y0 | 2026-03-31 | 13979.73 | `Operating Rev. Ann.` |
| 2 | `CFO_ANNUAL` | Y1 | 2025-03-31 | 2585.11 | `Cash from Operating Act. Ann. 1Y Ago` |
| 3 | `CFO_ANNUAL` | Y2 | 2024-03-31 | 3266.08 | `Cash from Operating Act. Ann. 2Y Ago` |
| 4 | `CFO_ANNUAL` | Y3 | 2023-03-31 | 2368.13 | `Cash from Operating Act. Ann. 3Y Ago` |
| 5 | `CFO_ANNUAL` | Y4 | 2022-03-31 | 1802.99 | `Cash from Operating Act. Ann. 4Y Ago` |
| 6 | `CFO_ANNUAL` | Y5 | 2021-03-31 | 2010.69 | `Cash from Operating Act. Ann. 5Y Ago` |
| 7 | `OPERATING_REVENUE_QUARTER` | Q0 | 2026-06-30 | 4921.00 | `Operating Rev. Qtr` |
| 8 | `OPERATING_REVENUE_QUARTER` | Q2 | 2025-12-31 | 3303.00 | `Operating Rev. 2Q ago` |
| 9 | `OPERATING_REVENUE_QUARTER` | Q3 | 2025-09-30 | 3302.00 | `Operating Rev. 3Q ago` |
| 10 | `OPERATING_REVENUE_QUARTER` | Q4 | 2025-06-30 | 3178.00 | `Operating Rev. 4Q ago` |
| 11 | `OPERATING_REVENUE_QUARTER` | Q5 | 2025-03-31 | 2959.00 | `Operating Rev. 5Q ago` |
| 12 | `OPERATING_REVENUE_QUARTER` | Q6 | 2024-12-31 | 2809.00 | `Operating Rev. 6Q ago` |
| 13 | `OPERATING_REVENUE_QUARTER` | Q7 | 2024-09-30 | 2889.00 | `Operating Rev. 7Q ago` |
| 14 | `OPERATING_REVENUE_QUARTER` | Q8 | 2024-06-30 | 2859.00 | `Operating Rev. 8Q ago` |
| 15 | `OPERATING_PROFIT_QUARTER` | Q0 | 2026-06-30 | 1664.00 | `Operating Profit Qtr` |
| 16 | `OPERATING_PROFIT_QUARTER` | Q1 | 2026-03-31 | 1356.00 | `Operating Profit 1Q Ago` |
| 17 | `OPERATING_PROFIT_QUARTER` | Q2 | 2025-12-31 | 1088.00 | `Operating Profit 2Q Ago` |
| 18 | `OPERATING_PROFIT_QUARTER` | Q3 | 2025-09-30 | 1083.00 | `Operating Profit 3Q Ago` |
| 19 | `OPERATING_PROFIT_QUARTER` | Q4 | 2025-06-30 | 1032.00 | `Operating Profit 4Q Ago` |
| 20 | `OPERATING_PROFIT_QUARTER` | Q7 | 2024-09-30 | 939.00 | `Operating Profit 7Qtr Ago` |

Candidate canonical writes: **20**.

Executed production writes in this repository stage: **0**.

## Explicit blockers / exclusions

| Domain / point | State | Reason |
|---|---|---|
| annual operating revenue Y1–Y5 | BLOCKED | retained fields are `Total Rev.` / generic `Rev. Ann.` rather than proven operating revenue |
| annual CFO Y0 | MISSING | no unambiguous current annual CFO label in the retained discovery manifest |
| quarterly operating revenue Q1 | MISSING | exact `Operating Rev. 1Q ago` value is absent from both retained raw discovery records |
| quarterly operating profit Q5 | MISSING | no exact retained point |
| quarterly operating profit Q6 | CONFLICTING | retained V3 contains duplicate `Operating Profit 6Qtr Ago` values 964.00 and 914.00; neither may be selected implicitly |
| quarterly operating profit Q8 | MISSING | no exact retained point |
| quarterly OPM | DERIVED ONLY | never written as provider evidence; derive from matched canonical operating-profit/revenue periods |

The conflict at Q6 is a **local period blocker**. It does not invalidate independently exact CFO, revenue or other quarterly observations.

## Post-ingestion readiness behavior

Even if all 20 rows are later approved and inserted successfully:

- `PHARMA_REVENUE_GROWTH_HISTORY` remains `HISTORY_CONTRACT_PENDING`;
- `PHARMA_OPERATING_MARGIN_HISTORY` remains `HISTORY_CONTRACT_PENDING` because the required 8 matched quarters are not available conflict-free;
- `PHARMA_CASH_CONVERSION_HISTORY` remains `SOURCE_CONTRACT_PENDING` because CFO alone is insufficient without matched PAT and reviewed capex/FCF evidence;
- PHARMA_V1 scoring, recommendation and position sizing remain blocked by upstream evidence readiness.

This pilot improves canonical evidence breadth; it does not manufacture research readiness.

## Migration safety

`20260914123000_register_pharma_history_raw_metrics.sql` is additive and repository-only at this stage. It:

- defines `REVENUE_ANNUAL`, `OPERATING_REVENUE_QUARTER`, and `OPERATING_PROFIT_QUARTER`;
- augments the existing `CFO_ANNUAL` definition with reviewed history-label metadata;
- fails closed if any new code already exists with incompatible semantics;
- fails closed if the expected `CFO_ANNUAL` prerequisite is missing/incompatible;
- writes **no fundamental observations** and performs **no provider call**.

## Required production gate

Before any production write is permitted, obtain explicit owner approval for this separately bounded action:

1. apply `20260914123000_register_pharma_history_raw_metrics.sql`;
2. persist/review the official TORNTPHARM period-identity evidence needed for audit lineage;
3. insert exactly the 20 approved conflict-free candidate observations above using V3 as the direct `source_record_id` and idempotent conflict handling;
4. immediately reread and verify exact row counts, values, periods, source lineage and duplicate replay behavior;
5. reread PHARMA readiness and verify that incomplete domains remain blocked;
6. make **no provider calls**, **no score run**, **no recommendation**, **no position-sizing assessment**, and **no scheduler change**.

Until that explicit approval is given, R4H remains repository-only.
