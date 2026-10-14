# PortfolioAI Results R4 — Verified issuer-PDF admission and unresolved evidence
**Date:** 15 Oct 2026 (IST). **Environment:** PortfolioAI Development only, Supabase `lrgpjimipfkyoqbpsqzz`, Cloudflare R2 `portfolioai-history-dev`.

## Status and acceptance verdict

**Partial R4 acceptance: 223 of 231 target equities have four source-selected quarters. Full R4 NOT PASS.**

| Control | Verified result |
| --- | ---: |
| Target securities | 231 |
| Equities with four selected quarters | **223** |
| Companies incomplete | **8** |
| Selected company-quarter combinations | **916 / 924** |
| Missing selected company-quarter positions | **9** |
| Selected normalized financial observations | **2,797** |
| Retained compact R2 evidence manifests independently checked | **1,915** |
| Existing selection conflicts during latest run | **0** |
| Original publication timestamp known for all records | **No** |
| R5 Strong/Mixed/Weak performance classification | **Not covered by R4** |

## Exact new admissible evidence

Each issuer original is retained and re-read byte-for-byte from Development Cloudflare R2 with SHA256 equality to an approved original digest. Each company/quarter financial trio is from a single Consolidated document; source URL, company identity, report date, currency, original unit and numeric values must match the recorded manifest. An original filed elsewhere is not silently adopted.

- COFORGE Dec 2025: `https://www.coforge.com/hubfs/Outcome-of-Board-Meeting-Q3-FY2026.pdf`. Hash `ccb413ab9307be7f44abe592987e97d762a2204f95057110dc1f5d8cc0ce3247`. Revenue ₹4,188.10 Cr, PAT ₹296.70 Cr, EPS ₹7.38.
- SHAILY Sep 2025: `https://static.shaily.com/y7GuSh95RsG5gOUUnd6i-covering-letter-reg-33-30092025-signed-pdf`. Hash `2fa03ceac4214c84169cbc9a6f7e05cb5b933a637a84b5fcae006ac2025594e5`. Revenue ₹256.6536 Cr, PAT ₹51.2516 Cr, EPS ₹11.12, originally INR lakh. Official issuer CIN/symbol document corroborated; the old alternative NSE source ISIN was not silently accepted.
- HBLENGINE Sep 2025: `https://www.hbl.in/reports/results_sep2025.pdf`. Hash `0983aeaa466d6c268652a412229508e23fd1ef3d70bbbe8f4ceed19f4a468ffe`. Revenue ₹1,222.90 Cr, period PAT ₹387.28 Cr, EPS ₹13.96. Original issuer PDF is scanned; exact original SHA binds independently reviewed values. The associate/minority-attributable PAT (₹387.27 Cr) is distinct and not substituted for the source's group period PAT.
- EXIDEIND Dec 2025: original correction notice `https://nsearchives.nseindia.com/corporate/EXIDEIND_17022026174032_sdClarification_letter_NSE.pdf`. Hash `0f62c1e6611a4ff318e53c725c2e3e117283547b5ff6b5f0628cbf6eba10d435`. Original typo EPS 0 corrected to 2.29. Approved original revised XBRL `INTEGRATED_FILING_INDAS_143825_17022026174051_iXBRL_WEB.html` selected for all three core metrics. Exact old source `383002e5-7e7c-4782-9906-5493eeae0fb1` filtered from this one quarter only when revised source `ace1b679-2cc7-46e9-854b-c117eb1ee37c` has certified identical Revenue/PAT and exact EPS 2.29, with retained notice hash. All other version conflicts stay quarantined.

## Remaining exceptions (9 unselected periods)

| Company | Quarter(s) | Verified blocker |
| --- | --- | --- |
| BDL | Sep 2025 | Two same-scope NSE original versions differ in PAT ₹215.8835 vs ₹215.8837 Cr; lack explicit authoritative correction relationship |
| COROMANDEL | Mar 2026 | Original issuer files report both 1x and 100x values; exact unit-version correction not yet independently established |
| DATAPATTNS | Mar 2026 | Original diluted EPS zero vs ₹24.71 conflicting later versions |
| MGL | Mar 2026 | Original Consolidated period PAT ₹129.62 vs ₹129.63 Cr in different files |
| WELSPUNLIV | Dec 2025 | Same-scope Consolidated PAT ₹2.53 vs ₹2.57 Cr in different versions |
| YATRA | Mar 2026 | Same-scope diluted EPS ₹0.52 vs ₹1.04 |
| ZAGGLE | Mar 2026 | Same-scope diluted EPS ₹3.03 vs ₹3.02 |
| VAML | Sep and Dec 2025 | VAML demerger effective May 1 2026; no standalone corporate quarterly statements for pre-demerger dates established. Do not manufacture earlier VAML quarters from Vedanta segment history |

Seven conflicting securities require an independently grounded **issuer correction or authoritative version history** before choosing one. VAML's pre-entity quarters should be shown as **Not Available — pre-demerger/no qualifying standalone issuer results** after explicit owner acceptance of non-applicability, instead of fabricated data. Full numeric 231/231 four-quarter selection may be intrinsically unattainable without changing the product's treatment of pre-demerger periods; do not relabel pending as approved merely to pass a gate.

The source verifier retains original publication precision UNKNOWN for most observations; byte retention proves retrieved source bytes at verification, not when issuer originally made them available to investors. No V1-4 research score or Production/main changes.

## Next action

Acquire/document precise exchange clarification and revised primary filing for each unresolved seven issuer-version conflicts. Preserve rejected versions. Record explicit not-applicable decisions for VAML only with approved R4 acceptance contract. Re-run same canonical verifier and independent selected-source/scope/core/readback checks. R5 earnings performance analysis remains separate.
