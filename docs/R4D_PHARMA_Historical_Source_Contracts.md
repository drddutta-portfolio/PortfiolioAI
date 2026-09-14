# R4D — PHARMA_V1 Historical Source Contracts

Status: **REPOSITORY CONTRACT SLICE IN IMPLEMENTATION**

## 1. Purpose

R4D converts the PHARMA_V1 historical evidence requirements into explicit source-contract candidates using only already-stored PortfolioAI provider-discovery evidence.

This stage does **not** fetch new provider data and does not promote any historical requirement to READY merely because Trendlyne returned a provider-computed aggregate once.

The governing distinction is:

1. **requested field** — PortfolioAI asked a provider for a label;
2. **observed provider capability** — the stored response actually returned a matching or related label;
3. **approved canonical source contract** — period semantics, identity, normalization, freshness, raw-history lineage and idempotent ingestion are validated;
4. **PHARMA_V1 evidence readiness** — the profile's minimum observation/history requirement is actually satisfied.

Only step 4 may make the research-profile evidence requirement ready.

## 2. Why aggregate provider metrics are not enough

PHARMA_V1 intentionally requires longitudinal evidence for its core mandatory metrics. Examples include 3–5 years of revenue/ROCE/PAT/cash history and 8–12 quarters of margin history.

A provider field such as `Net Profit 3Y Growth %` is useful capability evidence, but it is still a provider-computed aggregate. It does not expose the underlying period-by-period observations needed for PortfolioAI to:

- verify period comparability;
- handle restatements;
- preserve raw evidence lineage;
- calculate deterministic consistency/trend measures;
- distinguish missing years from genuine zero values;
- reproduce the result independently.

Therefore every R4D candidate currently has `canSatisfyPharmaV1HistoryRequirement = false`.

## 3. Stored Trendlyne capability evidence already observed

The stored TORNTPHARM discovery work supports the following distinctions.

| PHARMA_V1 metric | Stored evidence state | Examples observed | Current conclusion |
| --- | --- | --- | --- |
| Revenue growth history | `OBSERVED_RELATED_FIELD_ONLY` | `Operating Rev. growth TTM %` | Exact comparable 3–5 year raw revenue history contract not proven |
| Operating-margin history | `OBSERVED_CURRENT_POINT_ONLY` | `OPM TTM %`, `OPM Ann. 1Y ago %` | Current/related margin capability exists; 8–12 quarter series contract not proven |
| ROCE history | `OBSERVED_CURRENT_POINT_ONLY` | `ROCE Ann. %`, related 3Y average | Current/aggregate capability exists; individual annual series contract not proven |
| PAT / EPS history | `OBSERVED_EXACT_AGGREGATE` | `Net Profit 3Y Growth %`, `Cash EPS 3Y Growth %` | Useful aggregate evidence; raw comparable history still required |
| Cash-conversion history | `OBSERVED_EXACT_AGGREGATE` | `Operating Cash Flow 3Y Growth %`, related 5Y/YoY fields | Cash-flow capability exists; CFO remains provisional and matched PAT/capex history is not proven |
| Balance-sheet leverage | `UNPROVEN_IN_STORED_DISCOVERY` | requested debt-equity / interest-cover labels were not validated in the stored exact TORNTPHARM response | New bounded source-contract discovery is required before any ingestion contract |

## 4. Canonical-source implications

Existing canonical metric definitions remain authoritative where reviewed.

Examples:

- `OPM_TTM` — reviewed current TTM operating-margin evidence;
- `ROCE_ANNUAL` — reviewed current annual ROCE evidence;
- `NET_PROFIT_TTM` — reviewed current TTM PAT evidence;
- `CFO_ANNUAL` — still provisional and cannot be promoted silently;
- `REVENUE_TTM` — still provisional for the historical PHARMA contract;
- quarantined or provider-adjusted valuation fields must not become authoritative by reuse in this stage.

R4D does not modify those canonical definitions.

## 5. What R4D deliberately does not cover

This slice addresses the unconditional mandatory **historical** PHARMA_V1 requirements only.

Separate source contracts are still required for:

- official regulatory manufacturing-site / inspection evidence;
- domestic/export/US segment revenue evidence where applicable;
- R&D intensity and productivity evidence;
- pipeline / launch / approval evidence;
- multi-quarter ownership/governance history;
- valuation history/peer context using authoritative PortfolioAI market price.

Those remain governed by PHARMA_V1 and the R4C source-readiness map.

## 6. Next bounded provider-discovery gate

If repository/stored-evidence review cannot prove raw historical retrieval semantics, the next live Trendlyne work should be a **small contract-discovery cohort**, not a 26-stock Pharma refresh.

The first discovery should validate only the unresolved history contract for a known Pharma reference security, including:

- exact provider labels/tool parameters;
- whether period-by-period annual/quarterly history can be requested directly;
- provider instrument identity;
- returned period labels/dates;
- units and null semantics;
- duplicate/idempotency identity;
- whether one call can retrieve multiple required metrics without unnecessary quota use.

No such provider call is authorized by this document. It requires the normal explicit production/provider approval gate.

## 7. Safety boundary

R4D is repository-only.

It does not:

- call Trendlyne, Angel One, NSE or OpenAI;
- reserve or consume provider budget;
- change production database/schema/RLS;
- persist research-profile assignments;
- create fundamental observations;
- create score, recommendation or sizing records;
- alter application sector/industry/market-cap classification.

## 8. Completion meaning

R4D may be called **SOURCE-CONTRACT CANDIDATE COMPLETE** when:

- all unconditional mandatory longitudinal PHARMA_V1 metrics have an explicit stored-evidence state;
- automated tests prevent aggregate/current capability from being mistaken for raw historical readiness;
- the Architecture Guard, TypeScript and production build are green;
- any unresolved live-provider contract discovery is listed explicitly rather than guessed.

It does **not** mean PHARMA research evidence is portfolio-wide complete or that any Pharma stock is READY for scoring.
