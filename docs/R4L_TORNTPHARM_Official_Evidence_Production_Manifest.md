# R4L — TORNTPHARM official-evidence production manifest

Status: **READY FOR OWNER REVIEW — NOT APPLIED**

This manifest freezes the exact Phase-A production write proposed to close the numeric PHARMA_V1 parent-evidence gaps for TORNTPHARM. It does not authorize execution.

## Safety boundary

- Security: `TORNTPHARM`
- Security id: `da69b3eb-0343-44f8-912c-288b826118cc`
- Canonical sector: `Pharma`
- Target profile: `PHARMA_V1`
- Official raw source code: `COMPANY_EXCHANGE_FILING`
- No new Trendlyne call is required for this manifest.
- No Angel One history call is part of Phase A.
- No score run, recommendation, position sizing, role change, scheduler change or subtype assignment is permitted.
- Existing canonical observations are preserved. Rows already present with the same semantic fact are not duplicated.

## Direct official source records to capture

Execution will create fresh `data_source_records` rows, using generated UUIDs rather than hard-coded ids, for these issuer documents:

1. Torrent Pharmaceuticals Integrated Annual Report 2025-26 — `https://www.torrentpharma.com/pdf/investors/AR-2025-26.pdf`
2. Torrent Pharmaceuticals Annual Report 2024-25 — `https://www.torrentpharma.com/pdf/investors/AR-2024-25.pdf`
3. Torrent Pharmaceuticals Annual Report 2023-24 — `https://www.torrentpharma.com/pdf/investors/AR-2023-24.pdf`
4. Torrent Pharma Q4 FY26 press release — `https://www.torrentpharma.com/docs/Torrent_Pharma_Press_release_Q4_25_26_e5822c6449.pdf`
5. Torrent Pharma Q3 FY25 official earnings/release evidence for quarter ended 31-Dec-2024.

Derived observations will not pretend to be directly issuer-reported. Where the schema requires a non-null `source_record_id`, execution will create a PortfolioAI-derived evidence record whose payload identifies the formula and the direct official input source-record ids.

## Exact canonical observation write set — 42 rows

All raw issuer values are consolidated/group values where the relevant issuer statement is consolidated. Annual periods use `period_type = YEAR`; quarterly periods use `period_type = QUARTER`; numeric currency values use INR / INR crore as defined by their metric definition. Historical immutable facts are not reinterpreted from generic provider substitutes.

### A. Revenue history — 2 new rows

The current canonical 2026 operating-revenue row `13,979.73` already exists and will not be duplicated.

| Metric | Period end | Value | Direct evidence |
|---|---:|---:|---|
| `REVENUE_ANNUAL` | 2025-03-31 | 11,516.09 Cr | AR 2025-26 consolidated statement of profit and loss |
| `REVENUE_ANNUAL` | 2024-03-31 | 10,728.00 Cr | AR 2024-25 / AR 2023-24 operating-revenue series |

Expected post-write contract: **3/3 annual periods**.

### B. Quarterly operating-margin completion — 3 new raw rows

Existing revenue/profit rows are retained. These three missing components close eight matched quarter pairs without choosing the previously conflicting provider value for Q6.

| Metric | Period end | Value | Direct evidence |
|---|---:|---:|---|
| `OPERATING_REVENUE_QUARTER` | 2026-03-31 | 4,197 Cr | Q4 FY26 issuer press release |
| `OPERATING_PROFIT_QUARTER` | 2025-03-31 | 964 Cr | Q4 FY25 comparator in Q4 FY26 release / Q4 FY25 issuer release |
| `OPERATING_PROFIT_QUARTER` | 2024-12-31 | 914 Cr | Q3 FY25 issuer evidence |

Expected post-write contract: **8/8 matched OPM periods**. OPM remains PortfolioAI-derived from matched operating revenue and operating profit.

### C. PAT attributable to owners + diluted EPS — 6 rows

| Metric | Period end | Value | Direct evidence |
|---|---:|---:|---|
| `PAT_ATTRIBUTABLE_ANNUAL` | 2026-03-31 | 2,163.37 Cr | AR 2025-26 consolidated P&L, attributable to owners |
| `PAT_ATTRIBUTABLE_ANNUAL` | 2025-03-31 | 1,911.25 Cr | AR 2025-26 / AR 2024-25 |
| `PAT_ATTRIBUTABLE_ANNUAL` | 2024-03-31 | 1,656.38 Cr | AR 2024-25 |
| `EPS_DILUTED_ANNUAL` | 2026-03-31 | 63.92 INR/share | AR 2025-26 consolidated EPS |
| `EPS_DILUTED_ANNUAL` | 2025-03-31 | 56.47 INR/share | AR 2025-26 / AR 2024-25 |
| `EPS_DILUTED_ANNUAL` | 2024-03-31 | 48.94 INR/share | AR 2024-25 |

Expected post-write contract: **3/3 matched PAT/EPS periods**.

### D. Cash conversion — 7 rows

Existing canonical CFO rows for FY25 and FY24 are retained. FY26 CFO is added from the latest consolidated cash-flow statement.

| Metric | Period end | Value | Evidence / derivation |
|---|---:|---:|---|
| `CFO_ANNUAL` | 2026-03-31 | 3,022.71 Cr | AR 2025-26 consolidated cash flow |
| `CAPEX_ANNUAL` | 2026-03-31 | 677.39 Cr | AR 2025-26 PPE/intangible purchases definition |
| `CAPEX_ANNUAL` | 2025-03-31 | 611.87 Cr | AR 2025-26 / AR 2024-25 cash flow |
| `CAPEX_ANNUAL` | 2024-03-31 | 432.78 Cr | AR 2024-25 / AR 2023-24 cash flow |
| `FREE_CASH_FLOW_ANNUAL` | 2026-03-31 | 2,345.32 Cr | PortfolioAI: 3,022.71 - 677.39 |
| `FREE_CASH_FLOW_ANNUAL` | 2025-03-31 | 1,973.24 Cr | PortfolioAI: 2,585.11 - 611.87 |
| `FREE_CASH_FLOW_ANNUAL` | 2024-03-31 | 2,833.30 Cr | PortfolioAI: 3,266.08 - 432.78 |

The derived figures reconcile to the issuer's rounded FCF series of approximately 2,345 / 1,973 / 2,833 crore.

Expected post-write contract: **3/3 matched CFO + PAT + capex/FCF periods**.

### E. Capital efficiency / ROCE — 3 rows

Use the issuer's consistent management-reported ROCE series. Do not mix it with provider-calculated ROCE values whose methodology differs.

| Metric | Period end | Value |
|---|---:|---:|
| `ROCE_MANAGEMENT_ANNUAL` | 2026-03-31 | 26% |
| `ROCE_MANAGEMENT_ANNUAL` | 2025-03-31 | 31% |
| `ROCE_MANAGEMENT_ANNUAL` | 2024-03-31 | 28% |

Expected post-write contract: **3/3 period-resolvable ROCE periods**.

### F. Financial strength / leverage — 15 rows

#### Net debt / EBITDA

| Metric | Period end | Value |
|---|---:|---:|
| `NET_DEBT_EBITDA_ANNUAL` | 2026-03-31 | 2.3x |
| `NET_DEBT_EBITDA_ANNUAL` | 2025-03-31 | 0.6x |
| `NET_DEBT_EBITDA_ANNUAL` | 2024-03-31 | 0.9x |

#### Interest coverage

| Metric | Period end | Value |
|---|---:|---:|
| `INTEREST_COVERAGE_ANNUAL` | 2026-03-31 | 9.26x |
| `INTEREST_COVERAGE_ANNUAL` | 2025-03-31 | 12.43x |
| `INTEREST_COVERAGE_ANNUAL` | 2024-03-31 | 8.40x |

#### Total debt

R4L total-debt definition = long-term borrowings including current maturities + short-term borrowings. Lease liabilities and accrued interest are not silently added.

| Metric | Period end | Value | Calculation |
|---|---:|---:|---|
| `TOTAL_DEBT_ANNUAL` | 2026-03-31 | 14,798.24 Cr | 11,883.67 + 2,914.57 |
| `TOTAL_DEBT_ANNUAL` | 2025-03-31 | 3,026.09 Cr | 1,776.12 + 1,249.97 |
| `TOTAL_DEBT_ANNUAL` | 2024-03-31 | 3,937.42 Cr | 2,299.71 + 1,637.71 |

#### Cash and cash equivalents

| Metric | Period end | Value |
|---|---:|---:|
| `CASH_EQUIVALENTS_ANNUAL` | 2026-03-31 | 1,117.20 Cr |
| `CASH_EQUIVALENTS_ANNUAL` | 2025-03-31 | 573.48 Cr |
| `CASH_EQUIVALENTS_ANNUAL` | 2024-03-31 | 835.14 Cr |

#### Operating EBITDA

| Metric | Period end | Value |
|---|---:|---:|
| `EBITDA_ANNUAL` | 2026-03-31 | 4,559 Cr |
| `EBITDA_ANNUAL` | 2025-03-31 | 3,721 Cr |
| `EBITDA_ANNUAL` | 2024-03-31 | 3,368 Cr |

Expected post-write contract: **3/3 annual financial-strength periods**, with interest-cover context.

### G. Business durability — R&D numeric core — 6 rows

| Metric | Period end | Value | Evidence / derivation |
|---|---:|---:|---|
| `RND_EXPENSE_ANNUAL` | 2026-03-31 | 650 Cr | issuer FY26 R&D spend |
| `RND_EXPENSE_ANNUAL` | 2025-03-31 | 581 Cr | issuer FY25 R&D spend |
| `RND_EXPENSE_ANNUAL` | 2024-03-31 | 527 Cr | issuer FY24 R&D spend |
| `RND_INTENSITY_PERCENT` | 2026-03-31 | 4.6496% | PortfolioAI: 650 / 13,979.73 * 100 |
| `RND_INTENSITY_PERCENT` | 2025-03-31 | 5.0451% | PortfolioAI: 581 / 11,516.09 * 100 |
| `RND_INTENSITY_PERCENT` | 2024-03-31 | 4.9124% | PortfolioAI: 527 / 10,728.00 * 100 |

The derived intensity is contextual evidence only; higher R&D spend is not automatically scored as better.

## Row-count reconciliation

- Revenue annual: 2
- Quarterly OPM components: 3
- PAT/EPS: 6
- Cash conversion: 7
- ROCE: 3
- Financial strength/leverage: 15
- R&D numeric core: 6

**Total proposed canonical observations = 42.**

## Official non-numeric evidence captured but not promoted by this numeric manifest

The FY26 annual report supports important Pharma-specific business/regulatory facts, including USFDA EIR/compliance discussion for manufacturing sites, dossier/approval activity, ANDA pipeline context and material product launches. These facts should be captured in the official raw evidence record, but this Phase-A manifest deliberately does **not** force them into `fundamental_observations` until the canonical event/text evidence target for regulatory and business-durability evidence is reviewed.

## Deliberate exclusions

- Generic `Total Rev.` / `Rev. Ann.` provider history is not substituted for operating revenue.
- `Cash EPS` is not substituted for diluted EPS.
- Net cash used in investing activities is not substituted for capex.
- Short-term debt is not substituted for total debt.
- Provider ROCE is not mixed with issuer ROCE without methodology equivalence.
- The previously conflicting provider operating-profit value is not silently chosen; issuer quarter evidence supplies the exact period value.
- No provider-derived OPM is persisted when it can be deterministically derived from matched raw revenue and operating profit.
- No market metric is included in this official-evidence manifest.

## Expected readiness immediately after Phase A

| Parent contract | Expected state after write |
|---|---|
| Revenue history | minimum satisfied: 3/3 |
| Operating margin history | minimum satisfied: 8/8 matched quarters |
| ROCE history | minimum satisfied: 3/3 |
| PAT / EPS history | minimum satisfied: 3/3 matched periods |
| Cash conversion | minimum satisfied: 3/3 matched periods |
| Financial strength / leverage | minimum satisfied: 3/3 periods |
| Business durability — R&D numeric history | 3 years available; event/pipeline overlay still separate |
| Ownership / governance | still incomplete: multi-quarter official history required |
| Valuation context | still incomplete beyond current P/E / existing context |
| Regulatory/site event contract | official facts available, canonical event linkage still required |
| Momentum / drawdown / volatility | still incomplete until Angel One daily history is acquired |
| Relative strength | still incomplete until benchmark series contract exists |

## Separate Angel One gate after Phase A

Production currently has no TORNTPHARM daily historical candles. The verified Angel One mapping is NSE `TORNTPHARM-EQ`, provider token `3518`. A later separately approved `refresh-market-history` execution will make one Angel One historical-data request and write approximately 400 days of daily candles plus deterministic 12M momentum, 6M momentum, 1Y maximum drawdown and 1Y volatility. Relative strength remains separately blocked on benchmark history.

## Idempotency / execution rules

When approved, execution must:

1. Apply only the additive R4L parent-metric-definition migration if it is still unapplied.
2. Create the enumerated official source records first and hash their retained payloads.
3. Insert only observations absent for the same security + metric + period + reviewed semantic source; do not duplicate existing identical canonical facts.
4. Use direct official `source_record_id` for raw facts and a dedicated PortfolioAI-derived evidence record for FCF, R&D intensity and any other formula-owned value.
5. Fail closed on any pre-existing conflicting value or incompatible metric definition.
6. Verify exact post-write row counts and values.
7. Replay the insertion and require zero additional inserted observations.
8. Verify zero `stock_score_runs`, zero recommendation runs, zero sizing actions and zero scheduler changes caused by this operation.
9. Make zero Trendlyne calls and zero Angel One calls during Phase-A execution.

## Approval boundary

This document is a manifest, not authorization. Production remains unchanged until the owner explicitly approves the bounded Phase-A operation.