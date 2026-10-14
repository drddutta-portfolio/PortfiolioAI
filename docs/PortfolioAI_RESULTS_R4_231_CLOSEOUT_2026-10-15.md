# PortfolioAI Results R4 — 231-equity completion attempt and verified exception register
**Date**: 2026-10-15 IST. **Environment**: Development only, `PortfolioAI-Development`, Supabase `lrgpjimipfkyoqbpsqzz`, R2 `portfolioai-history-dev`.

## Final independently read-back position

**Portfolio-wide R4 acceptance: NOT COMPLETE.** R4 source selection is functionally operational, auditable and safely writes qualified observations; it is incorrect to describe all 231 equities as fully completed while the evidence issues below remain. The owner requests 231/231, but no source, accounting, publication or historical share-basis safeguards may be waived to force a PASS.

| Objective | Read-back |
|---|---:|
| Portfolio equities (current + closed) | 262 |
| Equities with any original filing observation | 231 |
| Equities with four quarterly original-filing observations (not necessarily qualified) | 227 / 262 |
| R4 231-target equities with four **selected, internally consistent** core quarters | **219 / 231 (94.8%)** |
| R4 target equities incomplete | **12** |
| Complete selected stock-quarter combinations | **911 / 924** |
| Missing selections | **13** |
| Selected fact observations | **2,785** |
| R2 compact source manifests checked in latest verifier | **1,912** |
| Conflicting decisions with previously accepted selections | **0** |
| Cross-scope, cross-source or incomplete core metric selections | **0** |

**Quarter ends**: 2025-09-30, 2025-12-31, 2026-03-31 and 2026-06-30. Ordinary equity core is Revenue/PAT/diluted EPS. Bank core is NII/PAT/diluted EPS. Sources must be same issuer filing and scope; R2 source compact manifest must hash-match Supabase. Publication timestamps are generally UNKNOWN, raw issuer HTML bytes not preserved in existing compact manifests. Selected evidence is suitable for *current display only*, not historical point-in-time research, not earnings-growth comparisons across share splits, not V1-4 scores, and not R5 Strong/Mixed/Weak classifications.

## Newly recovered source-verified positions

- E2E: Sep/Dec 2025 and Mar 2026, source-preserved, explicitly labelled **original pre-split share-basis**; 3 selected quarters.
- POCL: Sep/Dec 2025 and Mar 2026, source-preserved, original pre-split share-basis; 3 selected quarters.
- BECTORFOOD: Sep 2025 quarter from official NSE filing and documented Dec-2025 old/new ISIN, 3 selected metrics.
- V2RETAIL: Sep and Dec 2025 quarters from official NSE filings and documented March-2026 old/new ISIN, 3 metrics each.
- KOTAKBANK: Sep and Dec 2025 issuer Banking filings, NII/PAT/operating profit and original after-extraordinary *quarterly* EPS (not cumulative year-to-date), 4 selected metrics each. Pre-split share-basis flagged; no adjusted EPS or cross-split QoQ/YoY.
- Earlier R4 recoveries HCLTECH, HDFCBANK and complete Standalone nonconflicting banking filings are preserved.

The [latest verified acquisition/selection workflow](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38620339711) reports 8 new selected fact records, 2 complete bank quarters and zero prior-selection conflicts. Prior branch [PR #146](https://github.com/drddutta-portfolio/PortfiolioAI/pull/146) resolved six pre-split quarters. The current [PR #147](https://github.com/drddutta-portfolio/PortfiolioAI/pull/147) adds issuer/exchange identity gates and the safe packed Q2/Q3 Banking EPS parser. R3 acquisition, R4 verifier and Architecture Guard passed on commit `96cb96ae32e69a364e735bf39f6a4c153aa30ba2`. No Production/main changes.

## Still unselected: 12 equities / 13 quarters

| Company | Unselected quarter(s) | Reason / required evidence |
|---|---|---|
| BDL | Sep 2025 | Conflicting issuer-filed PAT `215.8835` vs `215.8837` ₹ crore; prove original correction/sequence |
| COROMANDEL | Mar 2026 | Conflicting same-scope issuer data, including a 100-fold apparent scaling discrepancy; prove original unit and revision |
| DATAPATTNS | Mar 2026 | Diluted EPS `0` vs `24.71` from separate original source versions; issuer correction necessary |
| EXIDEIND | Dec 2025 | Consolidated EPS `0` vs `2.29`; prove correction/revision and comparable reporting basis |
| MGL | Mar 2026 | Same-scope PAT conflict; prove issuer correction/revision |
| WELSPUNLIV | Dec 2025 | Conflicting original filing values |
| YATRA | Mar 2026 | Conflicting original filing values |
| ZAGGLE | Mar 2026 | Conflicting original filing values |
| COFORGE | Dec 2025 | No qualified same-scope original NSE financial trio for this reporting quarter; retrieve original filing or issuer IR source with units, quarter and provenance |
| HBLENGINE | Sep 2025 | Existing NSE financial HTML omitted a provable supported reporting unit; obtain issuer original with explicit units |
| SHAILY | Sep 2025 | Original unit/identity unqualified; some listed records contain obsolete ISIN during post-split quarter, need authoritative original identification |
| VAML | Sep & Dec 2025 | No corresponding qualified original quarterly statements discovered; demerged security began exchange trading only in 2026. Investigate historical accounting/prelisting presentation; **do not invent earlier-quarter issuer figures** |

### Acceptance path for the twelve

1. Reuse Supabase and R2 first; fetch only missing issuer/exchange correction notices, original full PDFs/iXBRL, and historical ISIN notices. Do not repeat approved source requests or overwrite accepted decisions.
2. For the eight original-filing conflicts: prove as-first-reported version and any authoritative correction, reporting unit, period, scope, and publication availability; quarantine if ambiguous. No “choose the latest/largest” shortcut.
3. For COFORGE, HBLENGINE, SHAILY: issuer/exchange primary filing with explicit periods, units, exact identity, original bytes/hash in Dev R2 and defensible provenance; no unit inference from magnitude.
4. For VAML: first determine whether Sep/Dec 2025 company-specific quarters genuinely exist. If nonexistent, display “Not Available — no qualifying issuer quarter” as a **documented R4 exception**; do not create synthetic quarterly selections merely to reach a numeric target. Product owner may revise 231/231 acceptance criterion for unreportable prelisting quarters explicitly.
5. Rerun strict R4 source-selecting workflow, independently read back source/identity/scope/core and mark only genuine fully qualified quarters as complete. Finally verify an authenticated Results page.
6. R5 performance analysis/classifications are independently pending, and cannot be claimed complete by R4 source selection.

**Status**: 219/231 with 4 selected quarters; 12 remain blocked; **full R4 acceptance NOT PASS**. The safe engineering patches are validated but this is not an assertion of a 231/231 source completion. Production remains untouched.
