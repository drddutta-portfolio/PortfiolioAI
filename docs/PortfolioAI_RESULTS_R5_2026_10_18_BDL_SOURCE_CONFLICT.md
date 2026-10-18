# R5 historic source divergence: BDL March 2025

**Development only** — status `SOURCE_CONFLICT`, **NOT QUALIFIED** for R5 comparison.

On 18 October 2026, the issuer signed Q1 FY26 (quarter ended 30 June 2025) original PDF was inspected, exact hash `245c64bf766b99a5b62095fa1929bbe7f4a862547a98e3fbd45a6f87f2fd19b0`:
`https://www.bdl-india.in/sites/default/files/BDL_2025_26_Q1_Financial_Results.pdf`.
The March 2025 standalone quarter is explicitly given as balancing figures in the second financial column (note 4).

Same-period R5 prior raw observations already stored from official NSE integrated filings showed two **different profit after tax figures** in the same standalone quarter, while revenue and EPS match:

| Original XBRL filing | Q4 FY25 revenue (₹ crore) | Q4 FY25 PAT (₹ crore) | Diluted EPS |
|---|---:|---:|---:|
| 27 May 2025, `INTEGRATED_FILING_INDAS_1453824_27052025101051_WEB.xml` | 1,776.9764 | **217.6969** | ₹7.44 |
| 01 Aug 2025, `INTEGRATED_FILING_INDAS_1499830_01082025100913_WEB.xml` | 1,776.9764 | **272.7719** | ₹7.44 |
| Signed issuer June 2025 report comparative March column | 1,776.9764 | **272.7719** | ₹7.44 |

The exact source-retaining ingestion workflow [run 39146502321](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/39146502321) rejected the R5 alternative because the two independently original NSE values do not reconcile; `BDL_ALREADY_ADMITTED_DIFFERENT_SAME_SCOPE_VALUES`. **No new BDL comparison observation was admitted and no R4 decisions were changed.**

This is a genuine accounting/source revision to review, not a missing quarter. To resolve, obtain an official issuer/NSE signed correction or auditor clarification identifying the revised profit basis and its applicability to the quarter. Do not silently prefer a later filing, remove the old original, treat EPS agreement as proof of PAT equality, or accept a benchmark percentile without comparable history.

Release impact: BDL 2025-06-30 remains an R5 historical exception pending a proven source-consistent January–March 2025 quarter. The diagnostic may be reattempted only after new corroborating original evidence.
