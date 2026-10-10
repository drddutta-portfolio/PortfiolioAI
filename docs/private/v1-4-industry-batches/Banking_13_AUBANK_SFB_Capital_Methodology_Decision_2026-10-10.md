# AUBANK — bank-specific SFB capital methodology decision (PROPOSED, NOT APPROVED)

**2026-10-10 | Development only | frozen cohort unchanged**. The owner expressly required a separate SFB decision. Nothing in this document approves changes to canonical requirements, score weights, or AUBANK membership.

## RBI authority / scope
- RBI *Master Circular Basel III Capital Regulations* dated 1 April 2024, `RBI/2024-25/08`, explicitly excludes Small Finance Banks. Official: https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12652.
- RBI *Small Finance Banks — Prudential Norms on Capital Adequacy Directions, 2025* updated 1 July 2026 applies to SFBs. Official: https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=13127.
- RBI reference minimum total CRAR **15% RWA**, CET1 **6% RWA**, Tier 1 **7.5% RWA** for SFBs, subject to prevailing amendments and any individual bank-specific add-on. This is a different regulatory framework from Basel III applied to regular commercial banks. Verify actual 2026 current text and any transitional status/permissions before enabling.
- AUBANK's June 2026 Pillar 3 directory is labelled **Basel II**. Official: https://www.au.bank.in/reports/regulatory-disclosures. Determine whether any RBI conversion approval or commercial-bank licensing change supersedes SFB classification for the relevant as-of date; if changed, a new explicit period-specific classification must be recorded.

## Proposed exact separate metric semantics

| Code | Proposed direct source | Denominator / unit | Period / scope | Minimum |
|---|---|---|---|---|
| `SFB_PRUDENTIAL_CET1` | AUBANK issuer/RBI-SFB-disclosed qualifying Common Equity Tier 1 capital | Regulatory RWA of matching SFB capital statement; percent points | Same effective regulatory reporting date, exact standalone SFB entity/perimeter | 6% baseline subject to amendments/add-ons |
| `SFB_PRUDENTIAL_TOTAL_CRAR` | AUBANK issuer/RBI-SFB-disclosed eligible Tier 1 + Tier 2 capital | Same RWA/scope; percent points | Same period | 15% baseline subject to amendments/add-ons |

No Tier 1 ratio substituted for CET1. No Basel II figure relabelled as Basel III. No provider annual ratio substituted for regulatory as-of data. Direct figures need issuer/RBI report, original bytes/hashes, date, denomination, effective-regime provenance, numerator and RWA basis, source-published date and approved review. The approved BANK 150-day reporting/verification dual clocks are a proposed reuse for these *new codes*, requiring an independent SFB methodology/freshness decision.

**Recommended path:** Keep both frozen M2/M3 required positions in the BANK contract but introduce an explicit profile-family regulatory applicability mapping keyed by `security_id`, verified `regulatory_entity_type=SFB`, and effective date. For AUBANK only, satisfy those positions with approved `SFB_PRUDENTIAL_CET1` / `SFB_PRUDENTIAL_TOTAL_CRAR` under an explicit cross-framework applicability mapping, with a published comparability notice. Do not simply mark the original Basel III requirements N/A, remove them, or silently reuse CET1_RATIO/CAPITAL_ADEQUACY_RATIO carrying Basel III provenance. Need scoring authority approval: either freeze the original risk weight with a risk-parity justified SFB scoring threshold, or propose explicit reweighting after comparative impact tests. Until approval, both positions remain REVIEW_REQUIRED, not READY.

**Worked synthetic illustration, not AUBANK financial evidence:** qualifying SFB CET1 ₹6,500 crore / RBI-SFB RWA ₹100,000 crore ×100 = **6.50%**, above 6% hypothetical baseline; qualifying total eligible capital ₹16,000 crore / same RWA ×100 = **16.00%**, above 15% hypothetical baseline. Does **not** establish the bank's actual ratios.

## Required approval / regression tests
1. Verify RBI SFB as-of-period authority; ordinary commercial-bank Basel III metric must fail for an SFB at that date.
2. Require source explicitly reports SFB regulatory framework and RWA (positive), exact period, issuer identity, scope, hashes and matching numerator; reject Basel III label substitution and Tier 1→CET1.
3. Reject a different bank's SFB values and any old regime after conversion.
4. Verify scoring equivalence or approved revised weights and thresholds, preserve frozen 13 bank IDs and baseline accounting value.
5. Old/new regulatory regime overlaps or issuer amendments cause conflict review; no automatic score boost.
6. Test existing canonical requirement owner and source-append invariants without modifying the 12 commercial-bank methods.

**Status:** decision required; no schema migration, score change, profile change, requirement waiver or new AUBANK factual admission authorized by the present M1–M4 approval.
