# Results R3 — actual source recovery and R2 archive, 14 October 2026

**Environment:** `PortfolioAI-Development`; Supabase `lrgpjimipfkyoqbpsqzz`; R2 bucket `portfolioai-history-dev`. **Execution state: PARTIAL; 247 equities still have no date-qualified Results metric.** Do not report quarterly acquisition complete.

## Independently verified outcomes

- Canonical transaction-linked equity universe: **262**. Includes historically exited equities; no hardcoded 111/V1-4 research cohort.
- Previously stored 13-bank original filing recovery: **291 observations**; database cached scan logs 262 stock identities checked, not 262 source acquisitions.
- New issuer-backed **CGPOWER** recovery: **five** quarter-specific consolidated `OPERATING_REVENUE_QUARTER` observations from pre-existing verified originals in R2, and full SQL provenance. Values in INR crore: 2025-03-31 2752.77, 2025-09-30 2922.79, 2025-12-31 3175.35, 2026-03-31 3441.76, 2026-06-30 3280.81. Values came from literal, scoped source financial statements. The June amount is converted from original INR lakhs to INR crore (÷100); no source text is fabricated. Those observations remain Results review-pending and **do not** change V1-4 selections.
- Final independent readback: **318** dated observations for the nine Results metric codes, **15** distinct covered equities, **79** stock-quarter combinations. **247** remaining equities without a date-qualified Results metric.
- Original `data_source_records` preserved unchanged; no duplicate source metadata, no new database tables, no transaction or V1-4 research alterations.

## Cloudflare R2 archival readback

Prefix `portfolioai-results/development/v1/trendlyne-captures/`:

| Captured source record_kind | Exact original DB rows | R2 objects listed | R2 bytes |
|---|---:|---:|---:|
| `P8_B4_4_FUNDAMENTALS` | 236 | 236 | 2,943,392 |
| `COMPLETE_RESEARCH_STRUCTURED_METRICS` | 236 | 236 | 3,145,182 |
| `P8_B4_4_DOCUMENTS` | 236 | 236 | 7,540,472 |
| `COMPLETE_RESEARCH_DOCUMENT_SEARCH` | 225 | 225 | 8,007,853 |
| **Total** | **933** | **933** | **21,636,899** |

All groups' R2 listings returned no truncation and each page upload was checked against object-name and byte-size readback. **Object byte hash-readback from a GET was not independently executed; listing/size parity is not proof of byte-for-byte equality.** R2 capture keys use original source UUID and existing payload_hash. The source JSON values are archived, **not relabelled as historical quarter figures**.

Canonical 262-security missing-data manifest:
`portfolioai-results/development/v1/manifests/equity-quarterly-acquisition-2026-10-14.json` (41,078 bytes, object-list readback successful).
Original G02 issuer and official filings remain at their pre-existing R2 keys, without duplicate upload or overwrite.

## Unfinished source acquisition

**Not complete:** 247 companies still have no period-anchored Results numeric observations. The bulk of existing Trendlyne fundamentals capture text references relative quarters/TTM without both a defensible reporting-period end and accounting scope. Do not invent periods from retrieval times or merge standalone/consolidated data. The current Trendlyne MCP provider is configured inside the application with verified entitlement but a direct callable provider session is **not exposed to this chat**; no new provider calls were made during this archival run. Direct NSE download from the local execution container failed DNS resolution, so no NSE provider-download campaign was executed. The existing NSE source explicitly has `retention_rights_verified=false`; **do not add new NSE raw bytes to the R2 archive without resolving retention rights**. New issuer documents must preserve allowed storage rights and stable original link/hash.

The acquisition manifest is an input for a future bounded collector, **not evidence** of publication or results being fetched. A stock becomes covered only after a database readback of the dated, unit-validated, source-linked quarter observation; full stock coverage requires checking all required quarters and material industry-specific metrics.

## GitHub changes

- `scripts/results/r3-cgpower-issuer-quarterly-revenue-recovery.sql`
- `scripts/results/r3-cgpower-q1fy27-already-stored-ixbrl-facts.sql`
- Existing R3 source ingestion/Results UI PR #140 remains under review, not a claim of full pipeline completion.
- No Production/main changes. No scheduled collector enabled.


## Follow-on source recovery — 14 October 2026, Development only

**Updated canonical readback (subsequent to the 15/262 figures above):** **357** dated numeric observations across **28** distinct equities and **92** stock/quarter combinations. This includes **39 newly persisted observations** from **13 issuer Ind-AS Q1 FY2026–27 filings**: HCLTECH, INFY, BHARTIARTL, HINDUNILVR, RELIANCE, DRREDDY, AUROPHARMA, ETERNAL, HAL, BEL, GRASIM, HINDALCO and CIPLA. Each company received authentic **2026-06-30 consolidated revenue from operations, total profit for the period and diluted EPS**. Original financial amounts in INR lakhs were deterministically divided by 100 to produce INR crore; EPS retained INR per share. Fields came from the actual issuer filing table, never extrapolated from TTM or publication dates.

**Cloudflare first:** 13 additional content-addressed compact Results manifests were written to R2 at \`portfolioai-results/development/v1/quarterly/security_id=<ISIN>/period_end=2026-06-30/source_version=<SHA256>/manifest.json\`, with returned object-key/size list readback before corresponding 39 Supabase observations were committed. Original NSE iXBRL bytes were **not** retained or archived because the NSE_OFFICIAL source row has \`retention_rights_verified=false\`. The original URLs, financial reporting scope, source units, period, and R2 manifest keys/hashes are retained in the existing \`data_source_records\` rows. These remain **Results review pending**, not V1-4 READY or canonically selected; no pricing, accounting, scoring, or Production/main changes.

**As at this readback: 234 of 262 equities still have no dated Results observation,** and even the 28 covered equities are not claimed fully covered across all historic quarters or mandatory industry-specific metrics. Total cached Trendlyne archival remains 933 objects, separate from the 13 new Results manifests. No direct Trendlyne provider calls were spent in this recovery.

**Reproducible DB executions added to this same Development PR:**
- \`scripts/results/r3-five-issuer-q1fy27-ixbrl-facts.sql\`
- \`scripts/results/r3-five-more-issuer-q1fy27-ixbrl-facts.sql\`
- \`scripts/results/r3-three-additional-issuer-q1fy27-ixbrl-facts.sql\`

**Reusable acquisition (experimental, not yet accepted):** \`scripts/results/r3-live-public-filing-batch.py\`, \`scripts/results/test_r3_live_public_filing_batch.py\`, and \`.github/workflows/results-r3-original-filings-acquisition.yml\` implement a bounded development-only read/qualify/store loop using NSE-listed issuer links, strict identity and period checks, R2 hash readback and small Supabase observations. The first GitHub pilot found a test fixture decimal-scale mismatch and was corrected; execution acceptance depends on observed subsequent workflow results and a fresh independent database readback. It must NOT be counted complete solely from successful CI or source-discovery counts. The approved Results UI remains unchanged.
