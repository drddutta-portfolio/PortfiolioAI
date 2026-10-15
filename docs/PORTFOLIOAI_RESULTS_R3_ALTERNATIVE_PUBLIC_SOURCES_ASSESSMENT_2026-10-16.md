# PortfolioAI Results R3 — Alternative Public Sources Assessment

**Date:** 2026-10-16  
**Environment:** `PortfolioAI-Development` only; no `main`, Production, Results UI, or V1–4 score changes  
**Decision:** **BSE = priority original-filing discovery candidate; The Core = discovery cross-check; Upstox = earnings-alert context. No bulk third-party scraping or unqualified data admission approved by this assessment.**

## 1. Verified R3 baseline

Last independent eight-quarter readback (Development Supabase ref `lrgpjimipfkyoqbpsqzz`, portfolio `6193a4aa-3235-4057-bddc-209fcf443fc2`):
- 262 equities including closed holdings; 8 target quarter ends = 2,096 theoretical company-quarter slots.
- 1,721 stock-quarter slots with at least three selected core financial metrics (82.1%).
- 375 theoretical slots not yet selected; 207 are September/December 2024.
- September 2024: 157 selected; December 2024: 160 selected. These are the top recovery priority.
- Counts of selected financial trios are **not** evidence that every filing is available and not evidence that a stock had traded prior to listing.
- Genuine prelisting, missing original, restatement, scope-conflict and historical corporate-action ISIN exceptions must be justified individually. Never fabricate source facts or force a selector decision.

## 2. Source assessment

### A. The Core Earnings Tracker (https://earnings.thecore.in/sectors)

- Public homepage: https://earnings.thecore.in/
- Company view pattern: https://earnings.thecore.in/company/HDFCBANK.NS
- The site describes a free NSE/BSE filing-driven tracker of more than 1,000 Indian companies, with **up to eight quarters** on dedicated company pages, earnings metrics, and links to original filing PDFs.
- Sector view summarizes constituent revenue/profit growth. It does **not** by itself supply issuer-level quarterly core trios.
- The public HTML inspected for HDFCBANK, ASTRAL and RELIANCE showed a `Loading…` element rather than an already materialized historical-quarter table; a reliable authorized historical data API was **not verified**.
- **R3 use:** human/read-only discovery of quarter existence, issuer match, and a candidate official NSE/BSE filing URL; optionally compare already qualified results for anomaly identification.
- **Admission:** The Core's calculations/HTML do **not** become `SELECTED` facts directly. Download an appropriately licensed official issuer/exchange original, validate identity/period/units/scope/revision, then reuse R4.
- A no-paywall page is not proof of permission to bulk harvest, replicate, or redistribute its dataset. Check applicable access/reuse conditions before any automated extraction.

### B. Upstox earnings reporting (https://upstox.com/news/market-news/earnings/)

- Accessible news feed includes archived result announcements and often headline PAT, revenue, YoY and dividend context.
- News articles can mix reported facts with expectations/analyst estimates; single articles commonly omit standalone/consolidated basis, EPS split basis, accounting units, amendment chronology, or all three qualified core metrics.
- **R3 use:** discovery alert, list of dates/issuer names and targeted cross-check for genuinely missing stocks; where an article cites an original issuer/exchange PDF, follow that original after provenance validation.
- **Admission:** Never classify a journalist's summary, estimate or article percentage as an issuer-authored quarterly financial observation. Do not bulk clone news text; retain only permitted reference metadata / short descriptions and official-source URLs.

### C. BennyThadikaran/BseIndiaApi (https://github.com/BennyThadikaran/BseIndiaApi)

- Unofficial Python wrapper; PyPI package `bse` v3.3.3 in the inspected `pyproject.toml`; GPL-3.0 license.
- Relevant methods:
  - `getScripCode(symbol)`: BSE scrip-code lookup (must check ISIN and issuer, not trust name alone).
  - `announcements(page_no,from_date,to_date,scripcode,...)`: historical dated BSE filing announcement index, paginated, with possible `ATTACHMENTNAME`, `NEWSID`, date, issuer name, and `QUARTER_ID`; **most relevant for missing Sep/Dec 2024**.
  - `resultsSnapshot(scripcode)`: financial snapshot in crores/millions; published sample provides only **three columns** (typically two recent quarters and FY total). It is **not** an eight-quarter historic results API. Returned `period_links` may help locate the original BSE result page.
  - `resultCalendar`: forthcoming announcements/calendar, **not historical numeric filings**.
- Upstream repository issue https://github.com/BennyThadikaran/BseIndiaApi/issues/19 notes the limitation that `resultsSnapshot` provides too few recent periods for long history.
- Upstream open PR https://github.com/BennyThadikaran/BseIndiaApi/pull/18 reports the `announcements` stock-filter parameter requires `strScrip`, not `strscrip`; the latter can elicit HTTP 403.
- **Our actual Development-only HTTP feasibility**:
  - Workflow `.github/workflows/results-r3-bse-source-feasibility.yml`, [initial run](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38788202653), [corrected-param run](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38788480505).
  - Read-only samples targeted ASTRAL `532830`, BEL `500049`, HDFCBANK `500180` and 2024-10-01 through 2025-03-01.
  - Both `TabResults_PAR/w` (snapshot) and `AnnSubCategoryGetData/w` (announcements) responded HTTP **403** for all three issuers, including the corrected `strScrip` parameter.
  - Workflow success here means diagnostic completion, **not successful BSE data acquisition**. No observations, selected facts, BSE PDFs or R2 files were persisted by these runs. No bypass of BSE access controls attempted.
  - Possible IP/network/access policy differences cannot be resolved by guessing request headers; source access must be authorized and independently demonstrated. Do **not** use rotating proxies, CAPTCHAs bypass or other evasion to retrieve BSE records.
  - GPL-3.0: do not vendor/copy library implementation into PortfolioAI without evaluating redistribution/license obligations. A separately written compliant source adapter, or a compatible licensed integration, needs review.
- **Best use, once legitimate access works:** Use BSE announcement indices to identify **original** Sep/Dec 2024 issuer result filings and as-first-reported source versions, not numerical summary snapshots as final data. BSE financial snapshots can be an extra anomaly cross-check only.

## 3. R3 recovery waterfall and acceptance rules

1. For each of the 262 portfolio equities, derive remaining unselected quarter+metric slots from **canonical selected observations** and preexisting R2 manifests; reuse hashes and decisions without duplicate downloads.
2. Validate original security ISIN, historical ISIN and corporate-action lineage; establish BSE scrip code with issuer + ISIN matching (unverified ticker-only lookups remain quarantined).
3. Seek official issuer investor-relations original quarterly PDF/XBRL and already accessible NSE originals first. Add **BSE official original filing** discovery when authorized source access becomes operational.
4. Use The Core as a pointer to official filing URLs or anomaly signal; Upstox as an announcement lead. Neither becomes a selected primary financial source.
5. Use provisioned Trendlyne MCP as a conditional fallback, capped at the owner-authorized **1,000 calls/day**, with no calls for previously qualified data. Trendlyne values do not supersede issuer-original evidence requirements and no direct Trendlyne connection is assumed by this assessment.
6. Admit core metrics only when dates, accounting scope, currency/units, original publication availability, as-first-reported revision and source hash are proved; R4 selects without mixing conflicting same-scope facts.
7. Store compact facts and immutable provenance/manifest pointers in Dev Supabase and `portfolioai-history-dev` R2 under existing retention restrictions. Do not publish raw third-party content without appropriate rights.
8. Read back independent eight-quarter qualified coverage. R3 PASS only after all 262 holdings (including closed) have qualified results or defensible documented exceptions for each unavailable company-quarter. Do not count a green runner, news story, website listing, or 403 as collection success.

## 4. Next actionable engineering work (not marked complete)

- **BSE access blocker:** determine supported/authorized access to BSE original filing discovery; documented Dev runner sample returned 403 on both endpoints; stop rather than evade. Investigate official alternative issuer-hosted original PDFs for 2024 while this is unresolved.
- **Targeted 2024 backlog:** target the 207 missing Sep/Dec 2024 stock-quarter slots; preserve historical ISIN conflict treatment from existing R3 program.
- **Limited-scope BSE adapter only after access proof:** independent parser for official announcement metadata; strict scrip+ISIN+quarter mapping; original PDF/XBRL verification; month/rate bounds; source access failures observable; no mass refetch.
- **The Core/Upstox:** start as read-only/manual discovery, and measure official filing lead usefulness before building a scalable scraper; do not rely on dynamic unverified private APIs.
- Keep existing R3 hourly completion watch active. Continue independent full readbacks. No Production, UI, or V1–4 modifications.

## 5. Provenance checked

- https://earnings.thecore.in/ and /sectors and company pages.
- https://upstox.com/news/market-news/earnings/
- https://github.com/BennyThadikaran/BseIndiaApi (README, `src/bse/BSE.py`, sample snapshot/announcements, `pyproject.toml`, GPL-3.0 license and open issue/PR).
- GitHub Actions read-only source diagnostics (links above).
