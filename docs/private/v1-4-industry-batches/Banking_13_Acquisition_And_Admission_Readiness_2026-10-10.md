# Banking V1-4 — acquisition closure, source authority, freshness and next controlled admissions
**Date:** 2026-10-10  **Scope:** PR #124 / Development only. **Status:** Factual admission NOT performed. M5–M7 deferred; O1 schedule OFF.

## 1. Freshness proposal: one decision, not activation

The governed BANK profile in `p7-ic-profile-contracts.ts` has no explicit M1–M4 BANK freshnessPolicy. Another profile convention `FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS` is a reference, not inherited authorization. The 120/90-day initial registered `freshness_seconds` remain **inactive**; earlier 4 registry rows are inactive with `BLOCKED_PENDING_EXPLICIT_FINANCIAL_FRESHNESS_POLICY`.

**Recommended owner-approved BANK policy candidate** (requires express approval and validation before activation):
- M1 source-certified true trailing four quarters, M2 Basel III CET1 regulatory and M3 Basel III *total* CRAR: **150 calendar-day reporting-age ceiling from actual period_end**. M4 directly audited full-year ROA: **550 calendar-day reporting-age ceiling from fiscal period_end**.
- Separate source verification time limit: at most **150 days** (M1–M3) and **550 days** (M4) from *last successful original-byte integrity reverification* of the exact issuer disclosure and authorized source binding; review status must independently remain valid. Mere API retrieval, cached page access, JSON refresh, or an unverified redirect does NOT restart verification.
- Proposed fact expiry `min(reporting_end + reporting_age_ceiling, last_verified_original_bytes_at + verification_ceiling, any earlier adverse-event/approved-supersession cutoff)`. Final expiry requires the canonical reviewer to confirm financial-period currency, scope, no newer qualifying or pending report, and currently valid review grant/authority. These ceilings **never guarantee applicability**. A newly published authoritative later period that is not yet reviewed forces current effective readiness into REVIEW_REQUIRED (or CONFLICTING when adverse), not retention of an older favourable fact until max age.
- Publication: original issuer/NSE broadcast time, not PDF CreationDate nor execution retrieved_at. `published_at <= evaluation_as_of` and `retrieved_at <= source_cutoff_at` with the existing permissible cutoffs; original reporting end must not be after publication. No reverse dating, delayed releases simply have less remaining reporting-age eligibility. Quarter start/end and FY start/end are source facts, not guessed from retrieval. For a regulatory point-in-time, `period_start=period_end`.
- Supersession: same issuer/security, financial metric, period and regulatory/accounting scope + amended source proof + explicit `supersedes_review_id` and review integrity. Different-period successor needs current-period preference and source evidence, preserving older records historically. Contradictory overlapping records with no authorized supersession remain CONFLICTING. No newest-retrieval-wins.
- Failed acquisition: record failure/monitor; keep immutable previous bytes and historical reviews, never extend expiry; if either clock or review eligibility fails then STALE/REVIEW_REQUIRED, no READY.

**Exact boundary examples (policy only):**
1. 30 June 2026 Pillar 3 downloaded 10 October 2026: reporting ceiling 27 November 2026 (date arithmetic under 150-day policy), regardless of fresh download.
2. September 30 2026 original published 25 October: pending new report vetoes relying on June as current immediately; reviewed exact scope/version selects September.
3. September 30 report first issued December 20: remaining age through February 27 2027 under 150-day cap, not May 19 2027.
4. A November 15 amendment revises September CET1: append old+new hashes; explicit adjudication/supersession; else CONFLICTING.
5. 31 March 2026 ROA awaiting next audited FY: 550-day ceiling calculated from 31 March 2026; more recent official FY release pending review vetoes older even inside 550.
6. Source re-verification fails October 10: do not reset verification timer; a previous valid and current source may still be used only within both clocks, with transport degraded status.

**Remaining explicit choices:** Approve/reject 150/550 dual clocks, last-successful-original-byte reverification semantics, calendar-day inclusion (recommended expiry after closing timestamp of end+N calendar days), pending-new-period veto, scope matching and mandatory supersession scheme. No activation or policy migration without that decision and tested canonical implementation.

## 2. Enforced source authority

The prior direct-source registry row had a contradiction: `provider=TRENDLYNE_MCP` while `source_priority` allowed issuer/NSE. That provider pin was removed only from inactive M1–M4 rows; the canonical `validateObservationSeries` still enforces membership in source_priority and requires a single compatible basis. The reviewed-evidence adapter also enforces source exact identity, hash, quote, period, numerical value and integrity chain. New code commits `59082b703c1dc762c3e5475426b2fc42650019ae` / `f077d3fb8b47a93d636c846385ef11b3e0d97782` require M1–M4 source code in the registered approved list and exact `raw_payload.security_id=securityId`; dynamic numeric-validator fixtures in `v14-bank-direct-source-enforcement.test.ts` reject unknown provider, missing/cutoff-invalid provenance, QUARTER/REGULATORY period mismatch, missing scope and mixed issuer+Trendlyne sources.
**CRITICAL admission authority distinction:** The preexisting approved `V1_4_BANK_PRIMARY_FILING_DELEGATION_V1` has M1–M4 codes in its requirements but `approvedBankOfficialFallback` is explicitly restricted to original `https://nsearchives.nseindia.com/corporate/` documents. Direct issuer-hosted originals are approved *metric candidates* but **NOT in the existing delegation's issuer-hosted URL scope**. Never relabel them as NSE or TRENDLYNE. Accept requires an authenticated individual owner review or a separately scoped and owner-authorized delegation amendment for these three exact issuer hosts/documents. No widening occurred.

## 3. Original bytes: new completed execution

Implemented one-shot `.github/workflows/banking-v14-original-pdf-acquisition.yml` and `scripts/banking-v14-original-pdf-acquisition.mjs`; it invoked no provider API or DB writes. GitHub Actions run **37977912532** / original artifact **11639583150** completed SUCCESS, fetching three HTTPS issuer-hosted PDF bytes via official URL with no redirect to a foreign host. Artifact URL `https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/37977912532/artifacts/11639583150`. The downloaded artifact ZIP was independently opened locally and actual contained PDFs rehashed. All SHA-256 values match runner manifest:

| Bank | Exact original issuer PDF URL | Bytes | Actual PDF SHA-256 |
|---|---|---:|---|
| ICICIBANK | https://www.icici.bank.in/content/dam/icicibank/missing-assets/basel-pillar-3-disclosureat-june-30-2026.pdf | 831504 | `fb01aa8597ecff1a2ddad6d24c993a71f04f643d2f86fd788ba1d1d5720f559c` |
| BANDHANBNK | https://www.bandhan.bank.in/sites/default/files/2026-07/Basel-III-Disclosure-as-on-June-30-2026.pdf | 670216 | `36fe252bcf987cb2fcbeeb40f35c5ff45d747123cac1c4fa5874ec674f79d11a` |
| KARURVYSYA | https://www.kvb.bank.in/docs/disclosure-of-june-2026.pdf | 786715 | `b008bfaec6a0fccf91aaab45a8ef2cd7f445a2b4968991146532a1c4525056d6` |

The artifact was initially retained 7 days; workflow revised to 90-day retention on subsequent one-shot execution. GitHub Actions artifact, even at 90 days, is **interim** and not canonical R2 storage. Permanent R2 upload with immutable content-addressed key, database source reference and exact hash readback remains necessary.

**PDF capital-table content independently inspected from these original bytes:**
- ICICI p3 (0-based index 2): 30 June 2026 Basel III consolidated CET1 16.11%, total CRAR 16.75%; standalone CET1 16.19%, total CRAR 16.84%. Consolidated and standalone values are **alternative scope records**, not interchangeable. Original PDF `pdfinfo` CreationDate July 18 2026 is *not* issuer publication proof.
- Bandhan p3 (index 2): literal Standalone capital ratio row at 30 June 2026, CET I 17.54%, TOTAL 18.15%, explicitly Basel III; PDF CreationDate July 21 2026 is not publication proof.
- Karur Vysya p3 (index 2): CET 1 Ratio 17.98%, Total CRAR (Basel III) 18.61%, 30 June 2026. Original scope says no subsidiaries requiring accounting consolidation; PDF CreationDate July 22 2026 is not publication proof.

Precise machine-readable candidate source package with URL/hash/scope/page/gaps: `docs/private/v1-4-industry-batches/Banking_13_Original_Bytes_Capital_Ratio_Qualification_2026-10-10.json`.

### Milestone states

The following classifications are per bank and metric; never use directory location as proof of a numeric field:

- **ICICIBANK, BANDHANBNK, KARURVYSYA:** M2 and M3 = `SOURCE_ROUTE_LOCATED`, `EXACT_METRIC_LOCATED`, `ORIGINAL_BYTES_CAPTURED` YES; `SOURCE_FACT_QUALIFIED` NO (issuer publication timestamp, permanent content-addressed source storage, BANK-specific expiry/scope rule and delegated issuer-host authority remain); `REVIEW_ACCEPTED` NO; `CANONICALLY_VALIDATED` NO.
- Same three M1 and M4: official regulatory PDFs do **not** provide acceptable source-certified M1 TTM and audited M4 annual ROA in examined sections; search quarterly/annual issuer materials independently. Do not call them qualified.
- **Ten other banks:** existing regulatory source routes verified from official directories, but no original Basel III file byte capture or exact M2/M3 source fact verified in this execution. Their M1/M4 remain to inspect at the appropriate issuer quarterly/annual reporting sources. Status `SOURCE_ROUTE_LOCATED` only where the exact relevant document was linked; elsewhere `NOT_YET_PROVEN`, not blanket B.
- **AUBANK:** regulatory special case described below; Basel III metric eligibility cannot be presumed.

## 4. AUBANK bank-specific regulatory applicability decision

RBI Basel III Master Circular of 1 April 2024 explicitly **excludes Small Finance Banks** and directs them to licensing/operating guidelines. RBI `Reserve Bank of India (Small Finance Banks – Prudential Norms on Capital Adequacy) Directions, 2025` (updated July 1, 2026) applies to SFBs and retains a dedicated capital adequacy regime generally described under Basel II norms. AU Small Finance Bank's issuer disclosure list explicitly labels its June 2026 Pillar 3 document `Basel II`. Source links:
- https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12652
- https://www.au.bank.in/reports/regulatory-disclosures
- https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=13127

**Finding:** `CET1_RATIO` and `CAPITAL_ADEQUACY_RATIO` under the frozen **Basel III-only semantics are potentially inapplicable to AUBANK's SFB prudential regime**, even though SFB disclosures can contain CET1 and CAR. Never manufacture Basel III compliance or silently replace it with Basel II; this is a methodology/applicability conflict, **not AUBANK exclusion from the 13-member frozen population**.

**Exact owner decision proposal:** add a narrow BANK-SFB regulatory-perimeter applicability profile *within the existing canonical research requirement owner*, retaining AUBANK in the manifest. Either (A) explicitly approve source-bound RBI-SFB CET1/total CRAR as separately typed `SFB_PRUDENTIAL_CET1` / `SFB_PRUDENTIAL_TOTAL_CAR` requirements with approved mapping and score impact, or (B) explicitly approve M2/M3 regulatory inapplicability for SFB plus an approved replacement safety check/weight rule. Default remains BLOCKED; neither option is authorized by the existing M1–M4 direct-source approval.

## 5. Valuation and other independent blocks

M5 PB_RELATIVE, M6 PB_ADJUSTED_FOR_ROE, M7 PE_TTM_RELATIVE are **mandatory for all 13** in the currently selected BANK snapshots and remain deferred. The registry currently has no `PB_RELATIVE`, `PB_ADJUSTED_FOR_ROE`, `PE_TTM_RELATIVE` normalized observations; isolated `PE_TTM`, `PBV_ADJUSTED_PROVIDER`, `ROE_ANNUAL` current values cannot prove qualified 5Y month-end point-in-time comparator coverage. Proposed same-bank 5-year median P/B, 5-year median positive-EPS P/E and explicitly reviewed ROE-normalization model remain unapproved. No requirements removed or substituted.

For ownership: direct Institutional 4Q percentage requires exact selected source quarter ends, revisions and total-equity denominator; do not sum FII+DII+MF categories. Ratings/governance must follow original rating issuer/official filing with hash and substantive finding; presence of a document is not favourable ACCEPT. KARURVYSYA/KOTAKBANK corporate action corrections remain independent history return-basis conflicts. No claim of independent blocker closure without exact evidence readback.

## 6. Execution accounting and persisted boundary

New qualified/admitted M1–M4 reviews: **0**. New observations: **0**. Existing 26 NPA ACCEPTED reviews preserved. No schema migration, PR merge, Production, provider paid calls, or recurring activation. v47 existing Development canonical deployment remains. No owner-authenticated current full 299-requirement run. Selected baseline remains **0 READY / 11 REVIEW_REQUIRED / 2 CONFLICTING**, ₹0/₹2,05,138.62 READY.

### Precise next authorized steps
1. Read back one-shot 90-day artifact, transfer original bytes into R2 `portfolioai-history-dev` content-addressed immutable keys, verify SHA and link `data_source_records` with issuer URL, publication provenance and scope; do not substitute GitHub ZIP SHA for PDF SHA.
2. Approve exact 150/550 dual-clock BANK policy and audited per-source scope selection.
3. Individually authorize narrowly scoped issuer-hosted original-PDF review under existing attribution controls OR obtain an exact NSE-hosted official copy satisfying the already approved fallback. Do not expand fallback secretly.
4. Only then activate registry rows through controlled existing mechanism, create and read back individual append-only reviews with source/citation/value and run genuine owner-authenticated canonical handler.
5. Independently decide AUBANK SFB capital semantics and M5–M7 models, then prove all other requirements and operational Gate B separately.
