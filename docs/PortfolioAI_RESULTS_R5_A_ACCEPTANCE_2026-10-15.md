# PortfolioAI Results R5-A — four-quarter qualified source readback

**Decision:** PASS under the owner's 231-equity / four-quarter R5 scope freeze. **NOT** a claim of 231/231 four-quarter complete; there are eight accepted-in-scope exceptions.  
**Date:** 2026-10-15 IST  
**Environment:** Development Supabase `lrgpjimipfkyoqbpsqzz`; `PortfolioAI-Development`, no Production change.

## Canonical cohort and exact period boundary

The target is the 231 unique equity security IDs found in this portfolio's transactions with original issuer/exchange quarterly evidence in any of the four explicit reporting quarters. The wider portfolio contains 262 equities (current + closed), 31 of which are outside this source-qualified R5 cohort. Source qualification does not change portfolio membership.

Periods: **2025-09-30, 2025-12-31, 2026-03-31, 2026-06-30**. No auto-promoted 2026-09 quarter.

## Independent Development SQL readback

| Gate | Observed | Decision |
|---|---:|---|
| Scope cohort | 231 securities | PASS |
| Required quarter slots | 924 | Baseline |
| Source-selected, complete same-filing quarter trios with INR, explicit correct unit, exact three-month period and one accounting scope | **915** | PASS within frozen exception policy |
| Unselected quarter slots | **9** | 8 named exceptions; remain Not Available |
| Securities with 4 complete slots | **223 / 231** | Sufficient for approved R5 scope |
| Securities with 1–2 missing slots | **8 / 231** | Kept visible, ungraded where unsupported |
| Selected underlying financial observations | **2,797** | Selected only |
| Selected decision security/metric/period/scope mismatches | **0** | PASS |
| Selected facts linked to non-exchange sources | **0** | PASS |
| Selected decisions without a linked observation | **0** | PASS |

The 915 strict quarter slots were recomputed by joining selected observation IDs to immutable observations and requiring, within **one source record and one reporting scope**, the mandatory diluted EPS and PAT plus operating revenue for a nonbank or NII for a bank. Each financial observation required INR currency, expected INR-crore / INR-per-share units, numeric value and the correct quarter start. The test recognizes 13 known bank security symbols, not an inferred bank grouping. R4 originally verified the source manifests and document hashes before admitting selections; this readback does not re-admit or waive source evidence.

| Period | Companies with source-selected core quarter |
|---|---:|
| Sep 2025 | 229 |
| Dec 2025 | 229 |
| Mar 2026 | 226 |
| Jun 2026 | 231 |

## Nine unresolved source-specific quarter slots

| Symbol | Unselected period | Evidence disposition |
|---|---|---|
| BDL | Sep 2025 | Conflicting originals; retain review |
| COROMANDEL | Mar 2026 | Conflicting originals/units |
| DATAPATTNS | Mar 2026 | Conflicting reported EPS |
| MGL | Mar 2026 | Conflicting reported profit |
| VAML | Sep & Dec 2025 | Pre-demerger/prelisting financial statement eligibility unresolved |
| WELSPUNLIV | Dec 2025 | Competing issuer versions |
| YATRA | Mar 2026 | Competing issuer versions |
| ZAGGLE | Mar 2026 | Competing issuer versions |

**Closeout:** R5-A source inventory and exception qualification ACCEPTED for the narrowed release. The nine slots are not silently filled. R5-B/C/D/E may proceed using only selected, valid comparisons. A grade needs a valid prior sequential quarter and its industry-calibrated peer cohort; missing data remains Unavailable. The full R5 release still requires its remaining build and acceptance checks.
