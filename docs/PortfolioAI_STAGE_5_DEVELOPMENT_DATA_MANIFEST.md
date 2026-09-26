# PortfolioAI — Stage 5 Development Data Manifest

**Date:** 26 September 2026
**Branch:** `PortfolioAI-Development`
**Decision:** COMPLETE / PASS
**Development Supabase:** `PortfolioAI Dev` (`lrgpjimipfkyoqbpsqzz`)
**Stable Development Preview:** `https://portfiolio-ai-git-portfolioai-development-dibyendu-dutta.vercel.app/`
**Production reference:** `Project-PortfolioAI` (`uxiyufbsbgzzdujzcdxe`), read-only

## Scope and safety

Stage 5 validated production-derived business data through the existing
PortfolioAI Development architecture. It did not rebuild the product, introduce
new business authority, or start Stage 6, Stage 7 or Post-D P0.

- Production was queried read-only and was not mutated.
- No Production deployment or environment variable was changed.
- No database migration was created or applied.
- No provider refresh, scheduler, paid AI, notification, trading or external
  financial action was activated.
- No credential or private source row is recorded in this manifest.

## Isolation and Auth

The Development Preview uses branch-scoped Vercel variables for the Development
Supabase URL, publishable browser key, application URL and market-data feature
flag. Repository-side Vite overrides that embedded a project key and forced the
feature flag off were removed. Production variables remain separate and
untouched.

The Development Auth user is `dr.d.dutta@gmail.com`, with Development-only UUID
`f9e48c4c-d796-424b-95f7-2a4a97149543`. All copied user-owned rows were remapped
to that UUID. Authenticated UI access to Dashboard, Holdings, Portfolio
Structure, Research, Transactions, Operations and Settings passed. RLS was not
weakened. A database role simulation confirmed the authenticated Development
owner can select all 248 cached latest-price rows and 251 mappings; the price
policy remains limited to securities present in the owner's active transaction
portfolio.

## Copied datasets

| Dataset | Development rows / state |
|---|---:|
| Portfolios | 1 (`Consolidated Portfolio`) |
| Transactions | 496 |
| Transaction security histories | 273 |
| Open holdings | 248 |
| Closed histories | 25 |
| Securities | 273 production-derived records plus retained orphan audit fixtures |
| Security identifiers | 22 |
| Listings | 271 |
| Brokers / broker accounts | 5 / 5 |
| Import batches / immutable source rows | 1 / 1,346 |
| Portfolio security settings | 5 |
| Themes / open memberships | 2 / 13 |
| Market-data mappings | 251 |
| Latest-price cache | 248 rows; 244 current open holdings covered in the reference scope |
| Market-price history | 274 |
| Current classified non-ETF holdings | 236 of 239 |
| Classification observations / decisions | 335 / 288 |
| Market-cap observations / assessments | 240 / 240 |
| Fundamental observations | 525 |
| External ratings | 20 |
| Market metric observations | 13 |
| Research documents / source links | 4 / 4 |
| Research subprofile assignments | 1 |
| Scoring profile assignments | 4 |
| Persisted score runs | 0 |
| Recommendation runs | 5 |
| News items | 251 |
| Identity observations | 25 |
| Company profiles | 1 |

Lineage-only ingestion-run and data-source records were copied without
activating ingestion. The copied import batch was remapped to a Development
identity; immutable raw rows and provenance were preserved.

## Validation findings

### Portfolio and accounting — PASS

The Development portfolio resolves 496 transactions into 273 histories, 248
open holdings and 25 closed histories. The UI reproduces the deterministic
calculable cost basis of ₹19,15,293.31 and supported realised P&L of ₹6,948.89,
with all 248 open histories accounting-covered and all 57 disposal histories
covered. Quantities, remaining cost, average-cost/FIFO support state, source-row
provenance, broker accounts and missing attribution retain Production semantics.

### Prices and performance — PASS after bounded integration fix

The canonical path remains:

`market_price_latest` → authenticated `refresh-market-data` `READ_CACHE` →
`supabaseMarketPriceProvider` → `loadPortfolioLedgerSnapshot()` → shared
portfolio view model → Dashboard/Holdings/Structure/Research consumers.

The data and RLS path were valid. The initial `0/248` UI result was caused by
`vite.config.ts` forcing the Development build flag to false. Removing that
override restores the existing canonical provider; no duplicate query or
fallback was added. Four copied current holdings remain legitimately unpriced.
Stale/fresh status, market value, unrealised P&L, weights, performance ranking
and contributor/detractor views continue to derive from the same price evidence.

### Classification and Portfolio Structure — PASS with intentional gaps

The industry-first classification path remains authoritative. Of 239 non-ETF
open holdings, 236 have reviewed classification and three remain explicitly
unclassified. Nine ETFs stay in the distinct ETF asset bucket.

Portfolio role is separate and owner-controlled. Only five Production owner
settings existed and were copied: four Core and one Other; the other 243 open
holdings correctly remain role-Unclassified. Two themes and 13 current theme
memberships resolve. No role, target, sector, industry or subprofile was inferred.

### Research, representative holdings and recommendations — PASS with sparse evidence

BIOCON, HDFCBANK, a normal non-Pharma equity, a missing-evidence holding and a
recommendation-backed holding were checked across holdings/research surfaces and
canonical database evidence. BIOCON uses its reviewed Pharma classification and
the single copied research-subprofile assignment where applicable; missing
methodology or selected evidence remains blocked/review-required. HDFCBANK keeps
its reviewed Banking / Private Sector Bank classification and copied Accumulate
recommendation evidence. No score or recommendation was manufactured: the
copied state contains zero persisted score runs and five recommendation runs.

The 525 fundamental observations and supporting documents remain immutable
evidence. A Research Coverage row can still be Missing where no applicable,
selected, current canonical evidence exists; raw row presence alone does not
constitute coverage.

### News — PASS

The 251 copied NSE news records match current holdings and render with category,
severity, sentiment, timestamp and source provenance. Browsing did not trigger a
live news fetch and no news scheduler was enabled.

### UI comparison

| Surface | Result |
|---|---|
| Dashboard | PASS after price flag fix |
| Holdings | PASS |
| Portfolio Structure | PASS; sparse owner roles are intentional |
| Research Coverage | PASS; sparse evidence remains explicit |
| Representative Research pages | PASS; fail-closed states preserved |
| Transactions | PASS |
| Direct `/app` routes | APPLICATION DEFECT fixed with Vercel SPA rewrites |

## Reproducibility and verification

The copy was performed with temporary, non-repository tooling. Stable identities,
foreign keys, immutable raw evidence and provenance were retained; Production
owner IDs were replaced only at Development ownership boundaries. Repeating a
copy must use the same source-to-Development identity map and must inspect
existing rows before any write.

Verification completed:

- architecture boundary check: PASS;
- TypeScript: PASS;
- production build: PASS;
- `git diff --check`: PASS;
- RLS/policy inspection: PASS;
- authenticated browser validation across required Development surfaces: PASS;
- full Vitest suite: 288 files / 1,685 tests PASS; the two D-FINAL failures are
  expected branch-name assertions frozen to `program-d-operations-optional-ai`,
  not Stage 5 regressions;
- repository-wide ESLint: pre-existing debt remains (77 errors, 3 warnings) in
  unrelated research/data files; neither changed Stage 5 file introduces an
  ESLint finding.

## Known limitations and next gate

- Four current holdings lack copied current-price coverage.
- Three non-ETF current holdings lack reviewed classification.
- 243 open holdings have no owner-assigned portfolio role because Production has
  no corresponding owner setting.
- Persisted score coverage is zero; recommendation coverage is five rows.
- Research evidence is intentionally sparse and fail-closed.
- Repository-wide historical ESLint debt remains outside this bounded closure.

These are documented real-data or pre-existing quality gaps, not permission to
invent values or start additional features. Stage 6 is next approved but has not
started. No later stage starts automatically.
