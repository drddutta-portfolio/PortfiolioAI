# BANK V1-4 — remaining decisions and grant handoff
**Date:** 2026-10-10  
**Scope:** Draft PR #124 / Development only. This document does not re-request already recorded approvals and does not authorize Production, V1-5 or any merge.

## Already approved / do not reopen

The recorded BANK V1-4 authority already covers the active direct-source M1–M4 definitions and 150/550-day dual clocks, M5/M7 historical comparison contract, Development-only source-review controls, and the bounded maintenance operating design including a one-missing-session canary and the recorded call ceiling. Those choices are not re-requested here.

The October 8 market-history discrepancy is closed separately: the October 8 NSE session was persisted and was misread as October 7 because the stored timestamp was interpreted in UTC rather than Asia/Kolkata.

## D1 — M6 exact methodology decision

**Recommended approval:** create a future versioned BANK methodology revision, suggested ID `BANK_NBFC_STAGE_8_BANK_V2`, that retires mandatory `PB_ADJUSTED_FOR_ROE` instead of activating an uncalibrated residual-income formula.

Authoritative current Valuation weights:
- M7 / P-E own-history: 60%
- M5 / generic P-B relative: 25%
- M6 / valuation relative to ROE: 15%

Proposed V2 Valuation weights after M6 retirement:
- M7: **70.588235%**
- M5: **29.411765%**
- M6: **0%**

Only the Valuation dimension is reweighted. Other dimensions, thresholds, mandatory requirements and historical V1 snapshots remain unchanged. The proposal does not promote the DRAFT BANK_NBFC recommendation policy.

The steady-state identity `Justified P/B = (ROE - g)/(Ke - g)` is **not** activated. It requires source-calibrated sustainable through-cycle ROE, long-run growth, `Ke > g`, clean-surplus consistency, payout/retention and capital-regime consistency, stable risk/cost of equity and matching book-value scope. Those inputs are not currently calibrated bank by bank.

**Immediate measured consequence if D1 alone is approved:** still **0/13 READY and ₹0 READY** because M5, M7 and other mandatory evidence remain unresolved. Once M5/M7 have genuine point-in-time evidence, perform one same-cutoff all-13 V1/V2 score, threshold and rank regression before activating V2.

## D2 — publication precision amendment

**Recommended approval:** allow the single canonical reviewer to consume immutable precision metadata without fabricating `published_at`.

A. **EXACT timestamp**  
Existing path. Exact issuer/exchange publication timestamp is stored and may admit a fact if every other source, scope, period, cutoff, freshness and review control passes.

B. **DATE_ONLY**  
- Keep `published_at = NULL`.
- Store `publication_precision = DATE_ONLY`, proven `publication_date`, exact provenance URL/hash and verification metadata.
- Derive a conservative factual-eligibility availability bound at **23:59:59.999 Asia/Kolkata** on that proven date.
- Do not admit an intraday historical observation earlier than that bound.
- If an exact timestamp is later proven for the same document/version, append/supersede precision evidence rather than overwrite history.

C. **UNKNOWN publication date, verified original bytes**  
- Keep `published_at = NULL`.
- Store `publication_precision = UNKNOWN` and exact `first_verified_available_at` from the first independently verified retrieval of the immutable original bytes.
- Retrieval proves the source was available **no later than that retrieval instant**; it is not an issuer publication claim.
- Permit current factual review only for evaluation cutoffs at or after that proven availability, subject to all other controls.
- **Never** use this to satisfy a historical observation before first verified retrieval. No historical point-in-time backfill or look-ahead.

This amendment must preserve the approved pending-new-disclosure veto, dual clocks, exact source hash/issuer identity, append-only supersession and the existing single canonical READY owner. It must not create a second review/materialization engine.

## D3 — AUBANK SFB regulatory mapping: direction already approved; applicability evidence advanced

Do **not** re-request the recorded owner approval of the AUBANK bank-specific SFB mapping direction. The remaining work is implementation/period-specific evidence.

Current official evidence now establishes the generic regulatory perimeter:
- RBI's ordinary Basel III commercial-bank framework excludes SFBs and points them to their SFB prudential framework.
- RBI's current prudential handbook identifies **Small Finance Banks** under a **Basel II norms generally applicable** framework, with reference minima **CET1 6%, Tier 1 7.5%, total CRAR 15%**.
- AU Small Finance Bank's official regulatory-disclosure directory lists **“Basel II - Pillar III Disclosures – 30th June 2026”**; its March 31, 2026 Pillar 3 disclosure explicitly states that AU Small Finance Bank is subject to the RBI `Small Finance Banks – Prudential Norms on Capital Adequacy Directions, 2025`.

Therefore the previously approved implementation direction remains:
- retain AUBANK in the frozen 13-bank population;
- retain the two frozen capital-safety positions rather than silently mark them N/A;
- use separately typed SFB regulatory facts, `SFB_PRUDENTIAL_CET1` and `SFB_PRUDENTIAL_TOTAL_CRAR`;
- map them to AUBANK's two capital-safety positions only with exact effective-date issuer evidence, RWA denominator, scope, original bytes/hash, and any bank-specific supervisory add-on or later amendment;
- never relabel the SFB/Basel-II-regime evidence as ordinary commercial-bank Basel III and never substitute Tier 1 for CET1;
- preserve a cross-framework comparability notice and complete the approved scoring-compatibility regression before canonical activation.

The generic SFB minima are now externally verified; what remains unproven is the **exact June-30-2026 AUBANK factual ratio package, original-byte/provenance admission and any bank-specific add-on**, not the existence of the SFB regulatory framework.

## G1 — fresh one-session Development grant, not a new policy decision

After the October 8 correction, the next completed-session gap is October 9, 2026. The previous Oct-8 P4 grant is consumed and cannot be reused. No current unconsumed/unexpired bank maintenance grant was found.

The already-approved bounded maintenance design can be exercised only after issuance of a **fresh one-time Development execution grant** tied to:
- project `lrgpjimipfkyoqbpsqzz`;
- the exact 13 frozen banks;
- NIFTY_BANK shared benchmark;
- exactly one missing completed NSE session;
- the recorded approved request ceiling and budget/accounting contract;
- the current execution/source cutoffs;
- canary only, no recurrence activation.

Grant issuance is an operational prerequisite, not permission to widen the maintenance policy. Provider authentication, final-session availability, budget reservation/accounting and source entitlement must still pass at execution time. If any precondition fails, stop without synthetic grant reuse or silent budget expansion.

## Current measured state before any D1-D3/G1 action

- Canonical validator: `p7-ic2-materialize-readiness` v51 ACTIVE, SHA-256 `260c202064096ac7f426b33feea1eff9ceccf6bc3180a8ff6c55438e14cbbe3d`.
- Current selected state: **0 READY / 11 REVIEW_REQUIRED / 2 CONFLICTING**.
- Frozen READY value: **₹0 / ₹2,05,138.62**.
- Existing accepted NPA reviews: **26**, retained.
- New M1–M4 factual ACCEPT in the present continuation: **0**.
- R2 B3 adjusted-series archive: **744 daily trade-date partitions, 2023-10-03 through 2026-09-30**; useful price-side evidence, but not the required five-year point-in-time M5/M7 package.
- Maintenance canary: **not executed**.
- Scheduler/recurrence: **not activated**.

## Owner action requested

A single owner response is needed only for **D1 and D2**. **D3's mapping direction is already approved**; its remaining implementation is evidence-gated as described above. G1 is an execution-grant issuance step under the already-approved maintenance limits, not a methodology approval. Until these remaining gates are satisfied, the system remains fail-closed and Gate A / Gate B remain NOT PROVEN.
