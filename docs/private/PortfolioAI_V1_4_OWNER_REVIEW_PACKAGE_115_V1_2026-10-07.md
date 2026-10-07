# PortfolioAI V1-4 Owner Review Package — Fixed 115 Stocks — V1

**Package:** `PAI-V1-4-115-OWNER-REVIEW-V1-2026-10-07`  
**JSON authority SHA-256:** `9821e5294a87e3a5cc3ed9af0e5acd423c67936d985f92afe9a0a6a18f6a374f`  
**CSV SHA-256:** `47dacf5bc18e908b60156aa08a990a397a2e51479aa1a497a8e80381b68e513e`  
**Canonical run:** `b88f4d34-287c-4974-b5b6-14f6e5a4b28a`  
**Review-dependent items:** 638 across 114 stocks  
**Frozen 111 cohort:** preserved separately; SHA-256 `79f551558333adc1f37d6a26298d8088ee02db3161f03c6d6e59f9a19a93fc27`

## Actionable classes

| Class | Items | Stocks | Result |
|---|---:|---:|---|
| A — mechanically acceptable | 0 | 0 | None |
| B — owner-approval-ready | 0 | 0 | None |
| C — unresolved / interpretive | 638 | 114 | DEFER |

Family split: **112 ownership**, **234 structured numeric**, **292 qualitative document**.

None of the 638 can lawfully become ACCEPT merely from owner approval in the current source state:
- ownership lacks an approved canonical series/basis;
- numeric evidence lacks complete period/unit/scope source binding;
- qualitative evidence lacks verified document identity + matching content hashes.

## Independent remediation completed

Stock history is current through 6-Oct for **111/115** stocks. Remaining Angel HTTP-403 residuals: **CHOLAFIN, GESHIP, HEXT, JIOFIN**. They were retried as fresh single-stock sessions and are not being repeated blindly.

No owner-review ledger rows were inserted.

## Worked examples

**Fully source-supported numeric:** HDFCBANK `ADVANCES_GROWTH_YOY` is already FRESH outside this review queue. Source record `2d487791-20fe-43bd-94bb-61d76615f1e7` binds `2026-06-30`, `15.4%`, unit `PERCENT`, scope `STANDALONE`; payload SHA-256 `09fac007ff9fb6cc9ab4901db3ec796a533aa860b9090cb39f4dca580a974ffa`.

**Ownership:** `ORP115-V1-0007` (ABCAPITAL) has retained series DII, FII, Institutional, MF, Promoter, Public but no approved canonical series/basis, so it is DEFER.

**Qualitative document:** `ORP115-V1-0456` (HINDUNILVR) has search/excerpt evidence but no validator-ready document identity/content-hash binding, so it is DEFER.

**Structured numeric:** `ORP115-V1-0009` (ACMESOLAR) contains provider numeric evidence but lacks a complete period/unit/scope source binding, so it is DEFER.

**HINDUNILVR:** remains CONFLICTING because `MOMENTUM_12M_RELATIVE` has `CORPORATE_ACTION_TREATMENT_NOT_PROVEN` for the demerger. Owner review cannot resolve that structural conflict.

## Approval boundary

This V1 package intentionally contains **zero ACCEPT items**. The JSON is authoritative; CSV contains the same 638 item IDs.

Current acknowledgment statement:

> “I acknowledge package PAI-V1-4-115-OWNER-REVIEW-V1-2026-10-07, JSON SHA-256 9821e5294a87e3a5cc3ed9af0e5acd423c67936d985f92afe9a0a6a18f6a374f. This version contains no ACCEPT decisions; all DEFER items remain unapproved.”

When a later version contains source-complete ACCEPT items:

> “I approve the ACCEPT decisions in package [identifier], JSON SHA-256 [hash], except item IDs [exceptions]. REJECT and DEFER items remain unapproved.”

A future application must resolve `reviewed_by` from the portfolio owner's existing `portfolios.user_id` binding after explicit package approval, never from a caller-supplied UUID. The review ledger is append-only; `review_hash` is unique/idempotent.
