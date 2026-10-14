# Results R4 Exception Closeout — 2026-10-14

**Verdict: NOT FULLY COMPLETE.** Safe Development R4 implementation and R2/source verification operational; 19 companies remain blocked, not R5 performance grading.

| Measurement | Independent Dev result |
|---|---:|
| Target equities with at least one R4 selection | 231 |
| Equities with all four source-selected quarters | **212** |
| Equities incomplete | **19** |
| Source-selected facts | **2,743** |
| Source-selected company-quarters | **898 / 924** |
| Unselected company-quarters | **26** |

A four-quarter source selection only reconciles current-display evidence; original filing publication timestamps are generally UNKNOWN and original HTML bytes were not retained in the R3 compact manifests. R4 verification must not assert historical point-in-time availability, cross-scope mixing, V1-4 research scores, or R5 Strong/Mixed/Weak classifications.

The R4 [source verification workflow](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38602833841) passed, wrote 20 new decisions, and recovered five bank-quarter selections by using complete nonconflicting Standalone filings where Consolidated was incomplete. 209 → 212 equities became 4/4. Source R2 integrity verification checked 1,898 compact manifests. Targeted seven-equity original NSE collection workflows completed successfully but produced **zero admissible new financial facts**. Official original sources for several periods lack proven reported units; historical source ISIN mismatches also exist.

## Exact unresolved cases

| Category | Security | Unselected quarter(s) | Evidence requiring reconciliation |
|---|---|---|---|
| CONFLICT | BDL | 2025-09-30 | same-scope issuer versions differ in PAT |
| CONFLICT | COROMANDEL | 2026-03-31 | issuer versions show 100x revenue/PAT difference; reconcile original units |
| CONFLICT | DATAPATTNS | 2026-03-31 | reported diluted EPS 0 vs positive |
| CONFLICT | EXIDEIND | 2025-12-31 | reported diluted EPS 0 vs positive |
| CONFLICT | MGL | 2026-03-31 | same-scope PAT differs |
| CONFLICT | WELSPUNLIV | 2025-12-31 | original values inconsistent |
| CONFLICT | YATRA | 2026-03-31 | original values inconsistent |
| CONFLICT | ZAGGLE | 2026-03-31 | original values inconsistent |
| HISTORICAL_ISIN_AND_EPS | E2E | 2025-09-30; 2025-12-31; 2026-03-31 | pre-split identity and EPS share-basis evidence |
| HISTORICAL_ISIN_AND_EPS | POCL | 2025-09-30; 2025-12-31; 2026-03-31 | pre-split identity and EPS share-basis evidence |
| LEGACY_SOURCE_CONTRACT | HCLTECH | 2026-06-30 | legacy R2 checksum verified, but distinct contract/original-byte evidence unqualified |
| LEGACY_SOURCE_CONTRACT | HDFCBANK | 2026-06-30 | nonstandard SGX issuer original and cached NSE unit/original-byte lineage |
| MISSING_QUALIFIED_SOURCE | BECTORFOOD | 2025-09-30 | older INE495P01012 vs current INE495P01020 following 5:1 split; original unit unknown |
| MISSING_QUALIFIED_SOURCE | COFORGE | 2025-12-31 | original NSE filing not qualified; unrelated issuer with same ISIN reported |
| MISSING_QUALIFIED_SOURCE | HBLENGINE | 2025-09-30 | original unit declaration not proven |
| MISSING_QUALIFIED_SOURCE | KOTAKBANK | 2025-09-30; 2025-12-31 | older INE237A01028 vs current INE237A01036, Jan 2026 split, share basis unresolved |
| MISSING_QUALIFIED_SOURCE | SHAILY | 2025-09-30 | original unit declaration not proven |
| MISSING_QUALIFIED_SOURCE | V2RETAIL | 2025-09-30; 2025-12-31 | older INE945H01013 vs current INE945H01021, 10:1 split and unit unresolved |
| MISSING_QUALIFIED_SOURCE | VAML | 2025-09-30; 2025-12-31 | original issuer source not found; do not invent prelisting history |

### Remediation contract

- For eight conflicting original issuer/version cases, independently document the exact issuer correction/revision and original declared units before selecting any value. Later retrieval is not proof of earlier publication.
- For E2E, POCL, BECTORFOOD, V2RETAIL and KOTAKBANK, establish official stock split/ISIN historical identity and original vs adjusted EPS share basis. Never silently change V1-4 canonical mappings.
- For HCLTECH and HDFCBANK, independently qualify the alternate issuer-manifest/extraction source contract and original-byte provenance before admitting it as R4 VERIFIED. The HCLTECH legacy R2 compact manifest passed hash readback but is not the same approved R4 source schema.
- For companies with missing quarterly originals, acquire credible issuer/exchange disclosures with explicit reporting periods, labels and units; if the quarter did not exist, report Not Available.
- Re-run R4 and independently read back the exact selected observation and company-quarter counts. 231/231 source-selected quarters with explicit remaining publication precision is the portfolio-wide goal. Do not move these companies from pending to verified simply to meet a target.

**Isolation**: Supabase Dev `lrgpjimipfkyoqbpsqzz`, Cloudflare R2 Dev `portfolioai-history-dev`, Development branch only, no main/Production or V1-4 scores changed.
