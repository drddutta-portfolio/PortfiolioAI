# Banking V1-4 — Approved Dual Clock, Durable Originals and Controlled Admission Execution
**Date:** 2026-10-10  **Scope:** PR #124, Development project `lrgpjimipfkyoqbpsqzz` ONLY

## Explicit owner authorization
The owner approved M1–M3 reporting age and verified original-source age ceilings **150 calendar days**; M4 **550 calendar days**; actual financial-period end independent from retrieval timestamp, earliest expiry; failed retrieval does not renew, new disclosures/amendments/adverse events require explicit fail-closed review/supersession. Owner separately approved extending the existing Development delegated factual-review pathway to verified official issuer-hosted originals for the same thirteen frozen bank security IDs, without blanket fact acceptance or arbitrary websites. M5–M7 DEFERRED, O1 planning/testing only, scheduler OFF. Existing 26 NPA reviews remain unchanged.

## Implementation and deployment
- Implemented `v14-bank-dual-clock.ts` and integrated the four-code expiry into the existing `p7-ic-input-validation.ts`. Numeric observations require actual `source_verified_at`, original publication date and reporting window, and `fresh_until` not greater than either clock. A newly downloaded old report cannot become current from retrieval age alone. Explicit `disqualifying_event_at` can shorten validity. Historic immutable source/review rows are preserved.
- Extended existing `v14-bank-approved-delegation.ts` using scoped `v14-bank-verified-issuer-delegation.json`: exact issuer domain, security identity, M1–M4 requirements, verified original SHA-256, verified Development R2 key, original byte verification timestamp, issuer publication, reported scope and full review authorization; does not extend NPA delegation. Official NSE fallback remains under the prior policy.
- Critical admission safeguard: four staged original PDF source records are labelled `factual_review_status=PENDING`. They are *not* eligible for delegated factual ACCEPT until fact-level original text attestation is verified and a later, append-only qualified source record carries `factual_review_status=SOURCE_FACT_QUALIFIED` and `source_text_attestation=VERIFIED_FROM_ORIGINAL_PDF_BYTES`. No inference from a row of manually extracted numerical candidates.
- Full Banking V1-4 and Architecture CI succeeded for original tested source commit `61dcf776190aaf62bc2d5ca63173553210a9eb50`. Canonical `p7-ic2-materialize-readiness` Development deployed **v49 ACTIVE**, bundle SHA-256 `6aa36d520ecd567c932224563f5f9ed10bfae09664665e8ea963e2e8c7e1498b`, with custom authentication setting preserved. Independent bundle readback verified dual clocks and issuer delegation.
- Four `fundamental_metric_definitions` rows (NIM_TTM/CET1_RATIO/CAPITAL_ADEQUACY_RATIO/ROA_ANNUAL) were activated under the owner's approved rules, with `freshness_seconds=12960000` (150 days) or `47520000` (550 days), `BANK_DIRECT_150D_550D_DUAL_CLOCK_V1` metadata. No schema migration or new valuation scoring.
- Latest added raw-source safeguard and SBI official Liferay PDF permalink are repository-only until final exact-code CI and Development redeployment; do not assume they are present in v49 until independently verified.

## Acquired official original PDFs — full original-byte / R2 verified
The established GitHub Actions acquisition path fetched issuer PDF bytes via HTTPS and used the approved Development Cloudflare R2 secret bindings, content-addressed keys and independent R2 download + SHA-256 readback. No paid market-data provider requests.

| Bank | Reported period | Original SHA-256 | Source record ID | Exact financial candidates (NOT ACCEPTED) |
| --- | --- | --- | --- | --- |
| ICICIBANK | 2026-06-30 | `fb01aa8597ecff1a2ddad6d24c993a71f04f643d2f86fd788ba1d1d5720f559c` | `ae753e77-38f2-46b0-8237-fb2a7b59de20` | Consolidated CET1 16.11 / total CRAR 16.75; standalone CET1 16.19 / CRAR 16.84 |
| BANDHANBNK | 2026-06-30 | `36fe252bcf987cb2fcbeeb40f35c5ff45d747123cac1c4fa5874ec674f79d11a` | `a1ef5183-e4f3-4501-8715-bce9bb9ad4c7` | Standalone CET1 17.54 / CRAR 18.15 |
| KARURVYSYA | 2026-06-30 | `b008bfaec6a0fccf91aaab45a8ef2cd7f445a2b4968991146532a1c4525056d6` | `5852a5b1-20a1-4481-b557-a7dc80209eb0` | Reported-bank CET1 17.98 / CRAR 18.61 |
| SBIN | 2026-06-30 | `6cb4b2e20a0e72dbdfc266b578e77873f8d46a98e9d950cb8a80719aaf20c426` | `7f6cda20-6eba-49d7-a4f1-85d826e9cb3d` | SBI Group CET1 13.10 / total 15.82; State Bank of India standalone CET1 12.89 / total 15.67 |

Object keys: `portfolioai-research/development/v1-4/bank-original-pdf/sha256/{sha256}.pdf` inside `portfolioai-history-dev`. Full SHA values above are actual original PDF byte hashes, not extracted text or ZIP hashes.

First three R2 readbacks confirmed in GitHub Actions run `37980115531`. Four-bank R2 upload and exact byte readback independently verified in run `37981975274`, artifact `11641445427` retained through 2027-01-07. These source records were appended using existing `data_source_records`, no migration; `published_at` deliberately NULL until authoritative issuer publication/broadcast identity is proven. A PDF CreationDate, directory listing, NSE quarter announcement for a different file, or retrieval timestamp is not accepted as original publication proof.

## Actual acceptance / readiness at execution time
- **4 original PDF source records newly inserted and independently read back**.
- **0 new M1–M4 ACCEPTED requirement reviews**; none may be fabricated from source discovery.
- **26/26 pre-existing ACCEPTED NPA reviews preserved** (13 Gross, 13 Net).
- **0 new normalized M1–M4 observations**; **0 new canonical selected snapshots**.
- Last independent persisted bank states: **0 READY / 11 REVIEW_REQUIRED / 2 CONFLICTING**, frozen READY value ₹0 / ₹2,05,138.62. No authenticated current 299-requirement handler acceptance run has been established by this execution. New code tests and source-row readback must not be relabelled as that run.

## Precise admission boundaries
1. Prove actual published/broadcast source date for the **specific same PDF bytes/version** and issuer author/scope. PDF metadata creation alone is insufficient. Explicit selected standalone/consolidated perimeter must be fixed consistently per bank; for ICICI and SBI both alternatives are currently preserved separately.
2. Reextract metric/source/period/Basel III/denominator fragments from the verified R2 PDF bytes with extract attestation and source-to-page mapping, then append source version with qualified status and original hash; *never rewrite an older source record to make it appear accepted*.
3. Append individual authorized immutable delegated reviews for fact-level evidence only after all checks, with review hash, required exact source binding, authorised executor and supersession context; independently read back every review.
4. Execute existing authenticated canonical handler at valid cutoffs, verify new reviews and old NPA reviews, report per-requirement states and only materialize completely passing banks. The three deferred mandatory valuation requirements independently prevent full Gate A, even if every M1–M4 fact is accepted.
5. Later unreviewed issuer disclosures and adverse events must enter the existing review/event control plane with explicit disqualifying-event time and documented authority. A live recurrence/event completeness proof remains outstanding; do not report Gate B passed.

## AUBANK / other independent requirements
RBI SFB capital directions rather than the general Basel III framework apply to AUBANK's June 2026 regulatory profile; separately proposed `SFB_PRUDENTIAL_CET1` / `SFB_PRUDENTIAL_TOTAL_CRAR` semantics with minima and denominator, worked synthetic examples, scoring/applicability alternatives in `Banking_13_AUBANK_SFB_Capital_Methodology_Decision_2026-10-10.md`. **NOT APPROVED/NOT ACTIVATED**, AUBANK remains in frozen cohort.
Institutional ownership denominator, quarterly revisions, ratings/governance substantive reviews, KARURVYSYA/KOTAKBANK corporate-action return basis, SBIN calendar adjustment and mandatory M5–M7 valuation methodology remain separate blocked requirements.

**No Production, PR merge, recurrent paid calls, scheduler activation, automatic issuer-document ACCEPT or V1-5 changes.**
