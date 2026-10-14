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
