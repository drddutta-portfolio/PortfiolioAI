# R4N — TORNTPHARM 42-Row Manifest Dry Run

**Status:** analysis only; manifest not applied
**Security:** TORNTPHARM (`da69b3eb-0343-44f8-912c-288b826118cc`)
**Candidate assignment:** `PHARMA_V1 + DOMESTIC_FORMULATIONS`, `PROVISIONAL`
**Source manifest:** `R4L_TORNTPHARM_Official_Evidence_Production_Manifest.md`

## Result

All 42 proposed observations map to parent PHARMA_V1 requirements. None directly satisfies the new mandatory domestic-revenue, field-force-productivity, brand/therapy-leadership or exposure-materiality-review requirements.

- rows mapped: 42/42;
- semantically compatible subject to execution-time source verification: 42;
- rows already present and deliberately excluded from insertion: 0 among the enumerated 42;
- duplicate candidates inside the manifest: 0;
- declared unresolved provider conflict: 1 historical operating-profit fact, resolved here only if the cited issuer value and source record verify;
- unsupported for promotion as specified: 0;
- derived rows requiring PortfolioAI-derived lineage rather than direct issuer lineage: 9 (3 FCF, 3 total debt, 3 R&D intensity);
- domestic-formulations mandatory requirements satisfied by these rows: 0/4, including the required materiality review;
- parent mandatory histories expected to become ready: 6/6.

Compatibility is a dry-run conclusion, not approval to promote. Every source record, period, unit, consolidated basis and existing canonical conflict must still pass execution-time validation.

## Row-level mapping

| ID | Current code | Period | Unit | Target requirement | Class | Applicability | Provenance | Compatibility | Readiness impact | Duplicate/conflict | Promotion eligibility |
|---|---|---|---|---|---|---|---|---|---|---|---|
| A1 | `REVENUE_ANNUAL` | 2025-03-31 | INR Cr | `PHARMA_REVENUE_GROWTH_HISTORY` | parent | applicable | AR FY26 | compatible | annual revenue 2/3 | none declared | eligible after source validation |
| A2 | `REVENUE_ANNUAL` | 2024-03-31 | INR Cr | `PHARMA_REVENUE_GROWTH_HISTORY` | parent | applicable | AR FY25/FY24 | compatible | annual revenue 3/3 | none declared | eligible after validation |
| B1 | `OPERATING_REVENUE_QUARTER` | 2026-03-31 | INR Cr | `PHARMA_OPERATING_MARGIN_HISTORY` | parent | applicable | Q4 FY26 release | compatible | supplies matched OPM component | none declared | eligible after validation |
| B2 | `OPERATING_PROFIT_QUARTER` | 2025-03-31 | INR Cr | `PHARMA_OPERATING_MARGIN_HISTORY` | parent | applicable | issuer comparator/release | compatible | supplies matched OPM component | none declared | eligible after validation |
| B3 | `OPERATING_PROFIT_QUARTER` | 2024-12-31 | INR Cr | `PHARMA_OPERATING_MARGIN_HISTORY` | parent | applicable | Q3 FY25 issuer evidence | compatible if exact source verified | OPM reaches 8/8 | provider conflict exists; issuer source intended to resolve | eligible only after conflict/source check |
| C1 | `PAT_ATTRIBUTABLE_ANNUAL` | 2026-03-31 | INR Cr | `PHARMA_PAT_EPS_HISTORY` | parent | applicable | AR FY26 | compatible | PAT side FY26 | none declared | eligible after validation |
| C2 | `PAT_ATTRIBUTABLE_ANNUAL` | 2025-03-31 | INR Cr | `PHARMA_PAT_EPS_HISTORY` | parent | applicable | AR FY26/FY25 | compatible | PAT side FY25 | none declared | eligible after validation |
| C3 | `PAT_ATTRIBUTABLE_ANNUAL` | 2024-03-31 | INR Cr | `PHARMA_PAT_EPS_HISTORY` | parent | applicable | AR FY25 | compatible | PAT side FY24 | none declared | eligible after validation |
| C4 | `EPS_DILUTED_ANNUAL` | 2026-03-31 | INR/share | `PHARMA_PAT_EPS_HISTORY` | parent | applicable | AR FY26 | compatible | matched FY26 | none declared | eligible after validation |
| C5 | `EPS_DILUTED_ANNUAL` | 2025-03-31 | INR/share | `PHARMA_PAT_EPS_HISTORY` | parent | applicable | AR FY26/FY25 | compatible | matched FY25 | none declared | eligible after validation |
| C6 | `EPS_DILUTED_ANNUAL` | 2024-03-31 | INR/share | `PHARMA_PAT_EPS_HISTORY` | parent | applicable | AR FY25 | compatible | PAT/EPS reaches 3/3 | none declared | eligible after validation |
| D1 | `CFO_ANNUAL` | 2026-03-31 | INR Cr | `PHARMA_CASH_CONVERSION_HISTORY` | parent | applicable | AR FY26 cash flow | compatible | CFO FY26 component | none declared | eligible after validation |
| D2 | `CAPEX_ANNUAL` | 2026-03-31 | INR Cr | `PHARMA_CASH_CONVERSION_HISTORY` | parent | applicable | AR FY26 cash flow definition | compatible | capex FY26 | none declared | eligible after validation |
| D3 | `CAPEX_ANNUAL` | 2025-03-31 | INR Cr | `PHARMA_CASH_CONVERSION_HISTORY` | parent | applicable | AR FY26/FY25 | compatible | capex FY25 | none declared | eligible after validation |
| D4 | `CAPEX_ANNUAL` | 2024-03-31 | INR Cr | `PHARMA_CASH_CONVERSION_HISTORY` | parent | applicable | AR FY25/FY24 | compatible | capex FY24 | none declared | eligible after validation |
| D5 | `FREE_CASH_FLOW_ANNUAL` | 2026-03-31 | INR Cr | `PHARMA_CASH_CONVERSION_HISTORY` | parent-derived | applicable | PortfolioAI CFO-capex | compatible if inputs/linkage verify | matched FY26 | none declared | eligible only with derived source lineage |
| D6 | `FREE_CASH_FLOW_ANNUAL` | 2025-03-31 | INR Cr | `PHARMA_CASH_CONVERSION_HISTORY` | parent-derived | applicable | PortfolioAI CFO-capex | compatible if inputs/linkage verify | matched FY25 | none declared | eligible only with derived lineage |
| D7 | `FREE_CASH_FLOW_ANNUAL` | 2024-03-31 | INR Cr | `PHARMA_CASH_CONVERSION_HISTORY` | parent-derived | applicable | PortfolioAI CFO-capex | compatible if inputs/linkage verify | cash conversion reaches 3/3 | none declared | eligible only with derived lineage |
| E1 | `ROCE_MANAGEMENT_ANNUAL` | 2026-03-31 | percent | `PHARMA_ROCE_HISTORY` | parent | applicable | issuer management series | compatible | ROCE 1/3 | methodology must remain consistent | eligible after validation |
| E2 | `ROCE_MANAGEMENT_ANNUAL` | 2025-03-31 | percent | `PHARMA_ROCE_HISTORY` | parent | applicable | issuer management series | compatible | ROCE 2/3 | no provider mixing allowed | eligible after validation |
| E3 | `ROCE_MANAGEMENT_ANNUAL` | 2024-03-31 | percent | `PHARMA_ROCE_HISTORY` | parent | applicable | issuer management series | compatible | ROCE 3/3 | no provider mixing allowed | eligible after validation |
| F1 | `NET_DEBT_EBITDA_ANNUAL` | 2026-03-31 | multiple | `PHARMA_FINANCIAL_STRENGTH_HISTORY` | parent | applicable | issuer/reviewed series | compatible | leverage FY26 | none declared | eligible after validation |
| F2 | `NET_DEBT_EBITDA_ANNUAL` | 2025-03-31 | multiple | `PHARMA_FINANCIAL_STRENGTH_HISTORY` | parent | applicable | issuer/reviewed series | compatible | leverage FY25 | none declared | eligible after validation |
| F3 | `NET_DEBT_EBITDA_ANNUAL` | 2024-03-31 | multiple | `PHARMA_FINANCIAL_STRENGTH_HISTORY` | parent | applicable | issuer/reviewed series | compatible | leverage FY24 | none declared | eligible after validation |
| F4 | `INTEREST_COVERAGE_ANNUAL` | 2026-03-31 | multiple | `PHARMA_FINANCIAL_STRENGTH_HISTORY` | parent | applicable | issuer/reviewed derivation | compatible | cover FY26 | none declared | eligible after validation |
| F5 | `INTEREST_COVERAGE_ANNUAL` | 2025-03-31 | multiple | `PHARMA_FINANCIAL_STRENGTH_HISTORY` | parent | applicable | issuer/reviewed derivation | compatible | cover FY25 | none declared | eligible after validation |
| F6 | `INTEREST_COVERAGE_ANNUAL` | 2024-03-31 | multiple | `PHARMA_FINANCIAL_STRENGTH_HISTORY` | parent | applicable | issuer/reviewed derivation | compatible | cover FY24 | none declared | eligible after validation |
| F7 | `TOTAL_DEBT_ANNUAL` | 2026-03-31 | INR Cr | `PHARMA_FINANCIAL_STRENGTH_HISTORY` | parent-derived | applicable | PortfolioAI defined sum | compatible if components/linkage verify | debt FY26 | none declared | eligible only with derived lineage |
| F8 | `TOTAL_DEBT_ANNUAL` | 2025-03-31 | INR Cr | `PHARMA_FINANCIAL_STRENGTH_HISTORY` | parent-derived | applicable | PortfolioAI defined sum | compatible if components/linkage verify | debt FY25 | none declared | eligible only with derived lineage |
| F9 | `TOTAL_DEBT_ANNUAL` | 2024-03-31 | INR Cr | `PHARMA_FINANCIAL_STRENGTH_HISTORY` | parent-derived | applicable | PortfolioAI defined sum | compatible if components/linkage verify | debt FY24 | none declared | eligible only with derived lineage |
| F10 | `CASH_EQUIVALENTS_ANNUAL` | 2026-03-31 | INR Cr | `PHARMA_FINANCIAL_STRENGTH_HISTORY` | parent | applicable | AR FY26 | compatible | cash FY26 | none declared | eligible after validation |
| F11 | `CASH_EQUIVALENTS_ANNUAL` | 2025-03-31 | INR Cr | `PHARMA_FINANCIAL_STRENGTH_HISTORY` | parent | applicable | AR FY26/FY25 | compatible | cash FY25 | none declared | eligible after validation |
| F12 | `CASH_EQUIVALENTS_ANNUAL` | 2024-03-31 | INR Cr | `PHARMA_FINANCIAL_STRENGTH_HISTORY` | parent | applicable | AR FY25/FY24 | compatible | cash FY24 | none declared | eligible after validation |
| F13 | `EBITDA_ANNUAL` | 2026-03-31 | INR Cr | `PHARMA_FINANCIAL_STRENGTH_HISTORY` | parent | applicable | issuer FY26 | compatible | EBITDA FY26 | none declared | eligible after validation |
| F14 | `EBITDA_ANNUAL` | 2025-03-31 | INR Cr | `PHARMA_FINANCIAL_STRENGTH_HISTORY` | parent | applicable | issuer FY25 | compatible | EBITDA FY25 | none declared | eligible after validation |
| F15 | `EBITDA_ANNUAL` | 2024-03-31 | INR Cr | `PHARMA_FINANCIAL_STRENGTH_HISTORY` | parent | applicable | issuer FY24 | compatible | financial strength reaches 3/3 | none declared | eligible after validation |
| G1 | `RND_EXPENSE_ANNUAL` | 2026-03-31 | INR Cr | `PHARMA_RND_INTENSITY_CONTEXT` | parent supplementary | applicable | issuer FY26 | compatible | supplementary evidence | none declared | eligible after validation |
| G2 | `RND_EXPENSE_ANNUAL` | 2025-03-31 | INR Cr | `PHARMA_RND_INTENSITY_CONTEXT` | parent supplementary | applicable | issuer FY25 | compatible | supplementary evidence | none declared | eligible after validation |
| G3 | `RND_EXPENSE_ANNUAL` | 2024-03-31 | INR Cr | `PHARMA_RND_INTENSITY_CONTEXT` | parent supplementary | applicable | issuer FY24 | compatible | supplementary history 3/3 | none declared | eligible after validation |
| G4 | `RND_INTENSITY_PERCENT` | 2026-03-31 | percent | `PHARMA_RND_INTENSITY_CONTEXT` | parent-derived supplementary | applicable | PortfolioAI R&D/revenue | compatible if inputs/linkage verify | contextual only | none declared | eligible only with derived lineage |
| G5 | `RND_INTENSITY_PERCENT` | 2025-03-31 | percent | `PHARMA_RND_INTENSITY_CONTEXT` | parent-derived supplementary | applicable | PortfolioAI R&D/revenue | compatible if inputs/linkage verify | contextual only | none declared | eligible only with derived lineage |
| G6 | `RND_INTENSITY_PERCENT` | 2024-03-31 | percent | `PHARMA_RND_INTENSITY_CONTEXT` | parent-derived supplementary | applicable | PortfolioAI R&D/revenue | compatible if inputs/linkage verify | supplementary history 3/3 | none declared | eligible only with derived lineage |

## Expected mandatory-readiness delta

Using the effective-contract formula and current retained-evidence description:

| State | Ready mandatory | Active mandatory denominator | Mandatory readiness |
|---|---:|---:|---:|
| Before manifest | 0 | 10 | 0% |
| After hypothetical validated application | 6 | 10 | 60% |

The six newly ready requirements are parent revenue, operating margin, ROCE, PAT/EPS, cash conversion and financial strength. If an approved materiality review activates mandatory regulatory/site evidence, the denominator becomes 11 and the hypothetical result remains 6 ready (54.5%).

This delta does not imply total evidence coverage or score readiness. Exact evidence coverage requires the effective requirement-level evidence fractions. Score readiness remains 0/not-ready because no Pharma scoring methodology is approved.

## Remaining gaps after hypothetical application

### Mandatory

1. domestic revenue history separate from consolidated revenue;
2. field-force/MR productivity with disclosed MR counts;
3. brand and therapy-area leadership with approved evidence/licensing;
4. reviewed export/regulatory materiality determination;
5. regulatory/site status if that determination activates the condition.

### Important

- multi-quarter official ownership/governance history and event overlay;
- approved valuation history/peer context;
- new-launch contribution history;
- chronic/acute therapy mix;
- domestic brand/therapy launch evidence.

### Other profile/overlay gaps

- market history for momentum, drawdown and volatility;
- benchmark-relative strength contract;
- canonical event/text targets for official USFDA/site, ANDA and launch evidence;
- approved source contracts for any licence-restricted therapy/brand data.

## Safety conclusion

The manifest is useful and internally reconciles to 42 proposed rows, but it is a parent-financial completion manifest—not a `DOMESTIC_FORMULATIONS` completion manifest. It must not be applied or promoted under this dry run.
