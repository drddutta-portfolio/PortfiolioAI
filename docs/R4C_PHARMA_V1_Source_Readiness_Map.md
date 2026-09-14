# R4C — PHARMA_V1 Source Readiness Map

**Status:** Repository source-contract planning — no production provider execution authorized  
**Date:** 14 September 2026  
**Profile:** `PHARMA_V1`

## 1. Purpose

R4C maps every PHARMA_V1 research requirement to current canonical evidence, already-stored provider-discovery evidence, and unresolved source/history contracts.

The goal is to reuse existing evidence before any new provider call and to prevent an observed provider label from being mistaken for an approved canonical source.

## 2. Governing distinction

Three things are deliberately different:

1. **Evidence exists in cache** — PortfolioAI already stores one or more observations.
2. **Provider capability was observed** — an earlier paid/controlled discovery response showed a field/label can be returned.
3. **Canonical source/history contract is approved** — PortfolioAI has reviewed semantics, period/history retrieval, normalization, freshness, conflict behavior, and idempotent ingestion.

Only item 3 can satisfy a PHARMA_V1 source contract.

## 3. Stored provider-discovery evidence reused

Read-only inspection of existing `TRENDLYNE_MCP` discovery records found that the previous non-financial contract work already requested fields including revenue/profit/EPS 3Y growth, ROCE/ROE, OPM, EBITDA, operating cash flow, debt-equity, interest coverage, PE and price-to-book.

The stored TORNTPHARM V2 exact-label discovery used `get_parameter_values_multi_stock` and recorded labels including:

- `ROCE Ann. %`
- `ROE Ann. %`
- `OPM TTM %`
- `EBITDA TTM`
- `Operating Cash Flow 3Y Growth %`
- `Net Profit 3Y Growth %`
- `Cash EPS 3Y Growth %`
- `Rev. Ann. 3Y ago`
- `PE 3Yr Average`
- ownership/pledge labels

The stored response itself also demonstrated historical context such as:

- Operating Cash Flow 3Y/5Y Growth %
- Net Profit 3Y Growth %
- Cash EPS 3Y Growth %
- OPM annual prior-period evidence
- ROCE 3Y average
- historical shareholder-fund and ownership observations

This is useful capability evidence, but it is not automatically canonical ingestion readiness.

## 4. Current source-readiness map

| PHARMA_V1 metric | Current state | Existing reusable evidence | Remaining gate |
| --- | --- | --- | --- |
| Revenue growth history | `HISTORY_CONTRACT_PENDING` | `REVENUE_TTM` snapshot + observed revenue-growth provider capability | Review exact multi-period history field/semantics and ingestion contract |
| Operating-margin history | `HISTORY_CONTRACT_PENDING` | reviewed `OPM_TTM`; historical OPM labels observed | Define comparable 8–12 quarter history retrieval |
| ROCE history | `HISTORY_CONTRACT_PENDING` | reviewed `ROCE_ANNUAL`; historical ROCE capability observed | Define exact annual 3–5 year series ingestion |
| PAT/EPS history | `HISTORY_CONTRACT_PENDING` | reviewed `NET_PROFIT_TTM`; EPS definitions; 3Y profit/EPS labels observed | Canonicalize PAT/EPS historical series semantics |
| Cash conversion history | `SOURCE_CONTRACT_PENDING` | provisional `CFO_ANNUAL`; cash-growth labels observed | Review CFO source plus capex/FCF and matched-period PAT contract |
| Balance-sheet leverage | `SOURCE_CONTRACT_PENDING` | generic discovery previously requested debt-equity/interest coverage | Security-specific exact field contract not validated; debt/cash semantics absent |
| Regulatory site status | `OFFICIAL_SOURCE_CONTRACT_PENDING` | none sufficient | Define official regulator/issuer evidence contract |
| Domestic revenue growth | `SOURCE_CONTRACT_PENDING` | none canonical | Define segment-specific disclosure/source contract |
| Export/US revenue growth | `SOURCE_CONTRACT_PENDING` | none canonical | Define segment-specific disclosure/source contract |
| R&D intensity | `SOURCE_CONTRACT_PENDING` | no canonical production metric | Define R&D expense/history source and productivity context |
| Pipeline/launch/approval evidence | `SOURCE_CONTRACT_PENDING` | research-document infrastructure exists generally | Define issuer/official event/document evidence contract |
| Ownership/governance | `CACHE_PARTIAL` | reviewed shareholding metrics and one current quarter for covered Pharma names | Obtain/reuse multi-quarter history and add governance-event overlay |
| Valuation context | `CACHE_PARTIAL` | authoritative Angel One price + reviewed `PE_TTM` | Add reviewed self/peer history and earnings/cash context; do not use quarantined PBV as canonical |

## 5. What can be done without new provider calls

The next repository work can safely:

- formalize exact canonical mappings for reviewed fields already present;
- parse and document stored provider-discovery labels;
- design historical-series normalization and idempotency contracts;
- identify which existing raw captures can be promoted without external fetches;
- define official-source contracts for regulatory evidence;
- calculate the precise missing-domain/provider-call plan for a small Pharma cohort.

It must not claim that stored discovery output itself satisfies PHARMA_V1 history.

## 6. What still requires future provider/official-source execution

Likely future external evidence work includes:

- retrieving approved historical revenue/margin/ROCE/PAT/EPS/cash series where not already stored;
- obtaining reviewed debt/cash/interest-cover inputs;
- obtaining segment domestic/export evidence where material;
- R&D history;
- official regulatory manufacturing-site evidence;
- issuer/official pipeline and approval evidence where required.

The physical call plan must be bounded by profile/domain and must reuse Stage 7 provider budget reservation, usage accounting, freshness, leases and kill switch.

No provider execution is authorized by this document.

## 7. Recommended next repository slice

Before asking for any production provider call, build `R4D / PHARMA source contracts` for the fields that prior stored discovery already suggests are available:

1. revenue history;
2. operating-margin history;
3. ROCE history;
4. PAT/EPS history;
5. CFO/cash-conversion inputs.

For each field, the contract must specify exact provider label/field, period semantics, required history, canonical metric code(s), normalization, freshness and idempotency.

Balance-sheet, R&D, segment and regulatory/event evidence can remain explicitly pending until their source contracts are proven.

## 8. Production approval boundary

The next time PortfolioAI needs to invoke Trendlyne or another external source to discover/fetch missing Pharma evidence, work must stop for explicit owner approval.

Repository design, tests and read-only inspection may continue without that provider-execution approval.
