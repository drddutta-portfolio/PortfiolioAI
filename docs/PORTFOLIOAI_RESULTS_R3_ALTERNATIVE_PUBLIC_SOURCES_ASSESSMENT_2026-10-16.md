# PortfolioAI Results R3 — Alternative Public Sources Assessment

**Date:** 2026-10-16  
**Environment:** `PortfolioAI-Development` only; no `main`, Production, Results UI, or V1–4 score changes  
**Decision (updated after live package tests):** **BseIndiaApi is proven to return live BSE financial snapshots and, with the independently tested upstream PR #18 parameter fix, genuine 2024 corporate announcements and original PDF filings.** The Core remains a discovery cross-check; Upstox remains earnings-alert context. No bulk scraping, UI changes, R3 database writes or unqualified selection authorized by this proof.

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
- **Subsequent live proof supersedes initial 403 inference:** The initial hand-written `requests` pilot was not representative of using BseIndiaApi itself. Keep its historical diagnostic result as evidence of that failed method, but **do not claim BSE is inaccessible**.
  - [Pinned library live proof](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38790942383): installed `bse==3.3.3` in GitHub Actions without copying the library. `BSE.resultsSnapshot()` returned HTTP success and real period-labeled `Revenue`, `Net Profit`, `EPS` for HDFCBANK (code 500180), TCS (532540), and BEL (500049). Three of three live snapshots succeeded.
  - [Historical announcement proof](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38791198521): original unmodified `BSE.announcements()` still returned 403, but using the library's initialized session with the one-line PR #18 correction `strScrip` returned HTTP **200**. HDFCBANK retrieved **37** 2024-10-01 through 2024-11-30 announcement records and **22** 2025-01-01 through 2025-02-28 records, including Sep/Dec 2024 quarterly results and machine-readable PDFs. These are actual BSE response rows, not search snippets.
  - [Original BSE attachment proof](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38791409640): retrieved two issuer-original PDF documents via `https://www.bseindia.com/xml-data/corpfiling/AttachHis/`, with genuine `%PDF-` bytes and complete SHA-256. Sep 2024 attachment `c9b4cb4c-088b-4a88-a6b7-91087ba90d95.pdf` (1,546,203 bytes; SHA `ac876a6846f0866f5951ade7ebd323c4a6752e6dc9c4089d985185633b6023fc`); Dec 2024 attachment `8e326f69-8061-4281-bc39-d8ac639479bd.pdf` (1,352,209 bytes; SHA `cc5517b18572a7094b553d73d25245b91f56109d687985bbf6c959364789bc3e`).
  - [Original source financial-text proof](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38791627765): successfully extracted financial-result lines from both PDFs. The quarter-first numeric rows include total income 85,499.64 and net profit 16,820.97 in the Sep 2024 original, and total income 87,460.44 and net profit 16,735.50 in Dec 2024 original, subject to independent full table header, units, reporting-scope and per-quarter checks. **These PDF text-extraction examples are not yet accepted R3 observations.**
  - All proof workflows were **read-only** and confined to `PortfolioAI-Development`. No third-party source code has been copied into the repo and no new BSE numeric data has been persisted or selected in the canonical financial database by these tests.
- **Best use now demonstrated:** Use the corrected BSE announcement index to find original Sep/Dec 2024 issuer filings, download official original BSE PDF evidence, and apply identity/period/units/scope/source-sha/revision checks before admitting facts. BSE snapshots can provide rapid cross-checks and discovery for recent quarters, but do not replace qualified original statements.

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

- **BSE demonstrated viable:** the package’s results snapshots work, its announcement index works with the upstream `strScrip` correction, and original 2024 filings are retrievable in the Development runner. The remaining work is a tested reusable data adapter, issuer security identity and original financial table qualification, not generic BSE network access.
- **Targeted 2024 backlog:** target the 207 missing Sep/Dec 2024 stock-quarter slots; preserve historical ISIN conflict treatment from existing R3 program.
- **Limited-scope BSE adapter:** keep `bse==3.3.3` as a pinned test dependency pending the owner's copy/vendor decision; apply upstream PR #18 correction in an isolated adapter; strict scrip+ISIN+quarter mapping; original PDF/XBRL qualification; month/rate bounds and source readback; do not silently confuse snapshot and original results; no mass refetch.
- **The Core/Upstox:** start as read-only/manual discovery, and measure official filing lead usefulness before building a scalable scraper; do not rely on dynamic unverified private APIs.
- Keep existing R3 hourly completion watch active. Continue independent full readbacks. No Production, UI, or V1–4 modifications.

## 5. Provenance checked

- https://earnings.thecore.in/ and /sectors and company pages.
- https://upstox.com/news/market-news/earnings/
- https://github.com/BennyThadikaran/BseIndiaApi (README, `src/bse/BSE.py`, sample snapshot/announcements, `pyproject.toml`, GPL-3.0 license and open issue/PR).
- GitHub Actions read-only source diagnostics plus successful pinned-library live snapshots, corrected 2024 announcement queries, original BSE PDF downloads and PDF financial-text extraction (links above).
