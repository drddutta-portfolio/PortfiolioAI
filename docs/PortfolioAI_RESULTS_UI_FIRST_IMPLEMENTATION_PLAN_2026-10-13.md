> **OWNER-APPROVED SCOPE AMENDMENT — 15 Oct 2026:** The final Results page still shows **FOUR** displayed quarters (Sep/Dec 2025; Mar/Jun 2026). R3/R4 acquisition and selection now cover **FOUR additional prior-year quarters** (Sep/Dec 2024; Mar/Jun 2025) across the full **262 open-and-closed portfolio equities**: 2,096 possible company-quarter slots, subject to issuer reporting applicability. The original broader UI timeline and older R1–R7 gating text below are historical design context; the controlling data/acceptance scope is [PortfolioAI_RESULTS_262_EQUITY_EIGHT_QUARTER_PLAN_AMENDMENT_2026-10-15.md](PortfolioAI_RESULTS_262_EQUITY_EIGHT_QUARTER_PLAN_AMENDMENT_2026-10-15.md). **Do not add historical quarters to the UI; keep all working layout and panels unchanged.** Existing earlier R5 stage passes must be remeasured against the expanded source coverage before full release acceptance.

# PortfolioAI Results — UI-first implementation plan
**Date:** 2026-10-13  
**Status:** R1 AND R2 IMPLEMENTED / VERIFIED IN DEVELOPMENT; R3–R8 PLANNED / GATED
**Repository/branch:** `drddutta-portfolio/PortfiolioAI` / `PortfolioAI-Development`  
**Development database:** `lrgpjimipfkyoqbpsqzz`  
**R2 candidate:** `portfolioai-history-dev` (existing bucket; access/usage rights require verification before writes)  
**Authority:** Subordinate to AGENTS.md and its enumerated canonical documents; Scope Freeze B and V1-4 remain unaffected.

## Objective and release boundary
Top navigation **Results**. Quarterly Results is the first enabled tab; Annual Results is reserved for a separately approved future phase. Coverage is the unique canonical equities ever held in open **or fully closed** transactions; selling must not erase results history. Do not hard-code universe counts or use the frozen V1-4 111/115 denominator as this module's universe. Derive stock identities, portfolio quantities, costs and P/L from canonical transactions/portfolio view models.

Visible quarterly history begins with the reporting period **January–March 2025** (generally Q4 FY2024–25 for March-year-end Indian companies) through the latest eligible reporting quarter. Period_start, period_end, fiscal-calendar convention, FY label and consolidated/standalone basis are explicit. Comparisons may acquire earlier periods where required for YoY without extending the default matrix timeline.

### Approved interaction
- Vertical stock rows, horizontally arranged quarter columns, **latest quarter on the left**; horizontally scroll older quarters, vertically scroll stocks, sticky stock header column and period header row; virtualize both directions for hundreds of securities.
- Compact result cells: industry-appropriate primary YoY metric (e.g. Revenue for non-lenders, NII for banks) and separate Strong/Mixed/Weak/Analysis Pending or Unavailable states. Newly reported is a separate marker, not a performance classification.
- **Hover:** quick, accessible tooltip with exact quarter, report basis, core YoY metric, PAT YoY, EPS and relevant industry metric; publication/source/quality when known. Keyboard focus and touch alternatives are mandatory.
- **Click:** select and highlight the stock-quarter, expand detail block **below the matrix**, remain on same page. Charts (quarterly bars by default), metric selector, QoQ/YoY, reported values, industry metrics, source links, holdings/closed-position context, earnings and confidence interpretation, thesis impact, and close/change-selection controls.
- Filters: search, All/Current/Closed, industry, status, new results; sorting by identity/portfolio weight/result date; user-friendly empty/loading/partial/failed states.
- Top operational status: last attempt, last successful scan, new results, failures, Run Scan Now (authorization required).
- Company/period values appearing in initial UI fixtures must be explicitly DEMO, isolated to tests/preview, never persisted, and never be presented as live facts. Follow existing PortfolioAI UI visual tokens and signed-gain/loss colors.

## Staged implementation and gates
| Gate | Scope | Acceptance |
|---|---|---|
| R1 — UI shell | navigation, tabs, summary/status, sticky/virtualized matrix, filters, hover tooltip, selection panel shell, desktop/tablet/mobile, typed fixture/view model | Authenticated Development preview demonstrates all interactions; tests, typecheck, lint, build, architecture guard pass; no DB/R2/provider writes |
| R2 — Analysis UI | portfolio position visual, bank/IT/pharma/industrial templates, metric bar charts, QoQ/YoY tables, insight panel, source/quality labels, null/error states | Fixture-driven interactive acceptance for diverse industries and closed positions; no fabricated financial calculations |
| R3 — Read-only canonical wiring | actual transaction-derived open/closed universe, canonical identities/classification/positions, available existing financial facts and source references via approved repositories | Independently reconcile membership and selected fact displays against canonical readbacks; no parallel financial authority |
| R4 — Historical recovery/acquisition | enumerate cached Trendlyne and filings, per-security/per-quarter coverage matrix, recover proven periods, approved targeted provider/filing acquisition only for gaps | AVAILABLE/PARTIAL/MISSING/INVALID/CONFLICTING inventory, qualified source lineage, real metric coverage report; provider quota/terms gates |
| R5 — R2 operational storage | versioned large financial documents/JSON/Parquet objects, hash + immutable manifest, small Supabase catalog, read API, lifecycle and recovery | authorized test object write/read/hash, DB-R2 referential readback, storage budget and RLS/authorization tests; migrations require separate owner approval |
| R6 — daily operations | reliable 07:00 Asia/Kolkata scheduled discovery, incremental source checks, correction detection, bounded retries, idempotent jobs, manual scan | at least one observed scheduled run plus zero-change, revision, duplicate and failure/recovery proofs; no silent stale-success |
| R7 — decision intelligence/release | methodology-approved industry scoring, historical charts, price reaction/market controls, thesis-review, cross-page integration, performance/security and hosted acceptance | proven calculations and confidence, independent live readback, full tests, Dev release candidate only, no Production activation |

R1 and R2 are **complete in Development** at merge commit `a10191b85e4539308e13db9612af73a5aa83253c`; acceptance evidence is recorded in `PortfolioAI_RESULTS_R1_EXECUTION_ACCEPTANCE_2026-10-13.md`. The remaining gates describe the plan, not blanket permission for schema migrations, new external provider campaigns or deployments to Production. Before implementation read AGENTS.md and governing documents in authority order, inspect actual remote HEAD/working state, and identify architecture conflicts. Progress is reported by independent evidence, not by green builds alone.

## Financial semantics and intelligence
- Trendlyne MCP is the structured research source **for currently approved domains**; consult cached source rows before spending provider calls. NSE/BSE/company originals may qualify disclosures and publication availability. Angel One remains the market price authority under the existing research contract; do not silently substitute Trendlyne technical prices.
- Define canonical metric, numeric type/decimal precision, INR crore conversion, fiscal period, reporting basis, accounting standard, source, published_at (null if unproven), retrieved_at, revision and selected provenance. Never relabel TTM Revenue as quarterly Revenue; do not infer a missing reporting date, zero, share basis, margin or consensus.
- Bank cells should default to verified NII growth rather than generic revenue. Industry-specific results quality methods require review/calibration before Strong/Mixed/Weak labels become authoritative. New/result quality are separate axes. AI narrates deterministic facts and uncertainty but never computes or overrides numeric facts, recommendations or readiness.
- Result visibility and research V1-4 READY are distinct: valid reported facts may display while scoring/recommendation remains unproven. No changes to V1-4 cohort, banking contracts, frozen selections, grants or V1-5 authority.
- Historical selected-date views must not leak later restatements into earlier point-in-time assessments; preserve supersession and publication precision.

## Integration and deployment
Use existing canonical repositories/hooks/view models; business and DB logic may not live in page components. Reuse canonical security ID, transaction-derived holdings, researched industry assignments, selected observations, document authority and quote history. Update `src/contracts/canonicalDataAuthorities.ts` when introducing new authority in implementation, after architectural review.

Adopt additive, versioned migrations only with explicit owner approval; inspect database capacity and retention/cost before any data write. Keep R1/R2 fixtures outside production data. Keep production/main untouched until separate owner acceptance. See [Results Data Reuse, R2 and Daily Collection Contract](PortfolioAI_RESULTS_DATA_R2_AND_DAILY_COLLECTION_CONTRACT_2026-10-13.md).

## Delivery record required at each gate
Actual Development HEAD, PR/commit, preview hash/version, files affected, shared authorities, implemented behavior, provider calls and budgets, migration/deployment/readbacks, tests (architecture, TypeScript, ESLint, unit, security, build), exclusions, failed checks, known gaps, and next specifically authorized action.

## Annual Results (future R8)
Reserve the tab and extensible source/period schema now. Annual audited income statement, cash flow, balance sheet, ratios and 5–10 years where permitted are a separate implementation/acquisition/owner approval. Do not infer audited annual results by blindly summing quarters.
