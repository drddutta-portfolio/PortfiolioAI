# Banking V1-4 — consolidated owner decision and execution contract

**Prepared:** 2026-10-09. **Status:** PROPOSED / NOT APPROVED. **Scope:** thirteen frozen BANK equities, shared NIFTY_BANK, Development `lrgpjimipfkyoqbpsqzz`. No production or V1-5 authority. This document is a decision package, not a new metric definition, migration, delegated acceptance, or activation grant.

## Verified starting point

Development branch `927181cf02d01d5f27d441dea6fac9d9b11a6d9b`; draft PR #124 remediation branch `dc8900a3edcfff04f0bf159fca20270618682bfa` before this document. Live canonical selected snapshots have **13 × 23 = 299** applicable requirements, **65 historical FRESH / 234 historically blocked**, selected **11 REVIEW_REQUIRED / 2 CONFLICTING / 0 READY**. The 26 approved delegated quarterly standalone Gross/Net NPA reviews are additional to the historical selected snapshots and must not be duplicated. No current owner-authenticated full replay or materialization is proven.

Authority: `AGENTS.md`; `PortfolioAI_Master_Blueprint.md`; `PortfolioAI_Research_and_Intelligence_Architecture.md`; `PortfolioAI_Single_Source_of_Truth_Architecture.md`; `PortfolioAI_Database_Architecture.md`; `PortfolioAI_Development_Rules.md`; `Stage_8_1C_Live_Bank_Metric_Mapping_Result.md`; `Stage_8_6D_HDFCBANK_Valuation_Self_History.md`; `Banking_13_Methodology_Contract_Decision_Package_2026-10-09.md` and `Banking_13_Continuous_Evidence_Maintenance_Contract_V1_2026-10-09.md`.

The actual active definitions found are `ADVANCES_GROWTH_YOY`, `DEPOSITS_GROWTH_YOY`, `EPS_GROWTH_YOY`, `ROE_ANNUAL`. The seven below have **no active registry rows**. Approval is needed for any new or broadened financial semantic contract. The recommendation is **source-first direct measurements** before discretionary derived variants.

## Seven methodology decisions — common proposed admission policy

Every admitted fact must carry security/ISIN and source identity, original URL/hash, supporting field or quoted excerpt, reported start/end, period type, as-reported unit/scale, denominator, standalone/consolidated/regulatory scope, disclosure and retrieval timestamps, revision/supersession identity, applicable freshness and reviewer authorization. Decimal percent is stored as percent points, not an unlabelled fraction; do not infer precision from display formatting. A newer retrieved record is not automatically a newer financial period. Exact stale or adverse conflicts remain blocked. Source unknown -> REVIEW_REQUIRED, not zero. No annualization or fallback computation without its own approved contract. The canonical requirement evaluator remains sole readiness authority.

| Requirement | Recommended definition/measurement for approval | Unit / window / scope | Missing-data and conflict guard | Decision status |
| --- | --- | --- | --- | --- |
| `NIM_TTM` | **Direct reported trailing-four-quarter NIM**: net interest income over applicable average interest-earning assets only where original issuer/Trendlyne source expressly certifies trailing four quarters and denominator; otherwise wait for further approved formula and audited inputs | Percentage; four contiguous reported quarters ending on actual quarter-end; standalone or consolidated consistently as approved per bank and source | Reject an annual NIM label, Net Profit Margin TTM, mixed scopes, zero/nonpositive denominator, noncontiguous/missing quarterly basis, incompatible revisions | **NEW equivalence/applicability decision required** |
| `CET1_RATIO` | **Direct Basel III Common Equity Tier 1 ratio**, or explicitly disclosed CET1 capital / risk-weighted assets ×100 if the source itself certifies those Basel III numerator/denominator values | Percentage of RWA, a point-in-time bank regulatory-report date; bank-reported regulatory perimeter must be recorded, not silently mapped to accounting consolidation | Reject Tier 1 as substitute, Basel II fields, absent RWA/regime, ambiguity in regulatory perimeter, denominator ≤0, unresolved amended Pillar 3 statements | **NEW source/scope decision required** |
| `CAPITAL_ADEQUACY_RATIO` | **Direct Basel III total capital adequacy (CRAR/CAR)** from issuer Pillar 3/regulatory filing, or total eligible regulatory capital / RWA only with separately authorized calculation | Percentage; regulatory as-of date and disclosed regulatory perimeter | Reject zero-filled Basel II, Tier 1-only or CET1-only fields, unsupported regime and conflicting versions | **NEW source/scope decision required** |
| `ROA_ANNUAL` | Prefer exact source-native `roaa` *annual ROA* after proving the provider field's denominator, fiscal year and applicable accounting scope; audited annual income / average assets is an alternative **not authorized** by the existing contract | Percentage; full financial year start/end; explicitly proven standalone/consolidated; numerator/denominator basis must match declared source method | Reject undated provider data-date, annualized quarter, missing fiscal FY or incompatible income/assets basis | **NEW field/period/scope admission decision required** |
| `PB_RELATIVE` | Use **unadjusted trailing observed P/B against the same bank's own reviewed historical unadjusted P/B reference**, only after a concrete comparison window, sampling frequency and aggregation policy is separately fixed | Dimensionless ratio (current P/B divided by historical reference P/B), dated current price and matching book-value/share basis; positive denominators only | Exclude adjusted PBV, nonpositive book value, inconsistent corporate-action/share denominators, insufficient qualified observations and ambiguous peer comparators | **NEW comparator/window/aggregation decision required** |
| `PB_ADJUSTED_FOR_ROE` | **Do not manufacture an ROE-adjusted ratio.** Recommend approval of a transparent separate bank-quality valuation model only after owner selects the exact ROE normalization function, financial comparison period, baseline ROE, data exclusions and direction of adjustment. Retain this requirement blocked meanwhile | No operative numeric unit/scale until transformation, peer or self-history population, floor/cap and comparison benchmark approved | Reject any implicit multiplication/division of P/B by ROE, provider-adjusted PBV relabeling or division by zero/negative ROE; no invented score | **SUBSTANTIVE NEW FINANCIAL MODEL decision required** |
| `PE_TTM_RELATIVE` | Recommended candidate: **unadjusted current P/E TTM relative to a reviewed same-bank five-year P/E TTM reference**; do not substitute `PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT` (a different, separately approved 60%-weighted signal) | Dimensionless current/reference P/E ratio, dated TTM EPS and historical observations, same corporate-action/earnings basis | Reject nonpositive earnings, missing 5Y reference, changing basis, provider implied-upside-as-ratio, arbitrary interpolation | **NEW comparison/window/aggregation decision required** |

### Explicit choices that cannot be settled by data alone

1. **Fiscal and scope policy:** approve standalone versus consolidated for annual ROA/ROE and NIM and how regulatory CET1/CAR perimeters map to bank disclosures; no cross-scope blending.
2. **P/B and P/E historical comparison contract:** recommend same-bank history rather than peer mix to avoid invented comparator membership, *subject to verified sufficient observations*. Specify sampling convention (e.g. end-of-month), five-year interval, arithmetic/median aggregation, outlier handling, splits/corporate actions, and positive-only denominator rule. Those choices remain **unapproved** and must be decided with actual source coverage before implementation.
3. **ROE-adjusted P/B:** whether to introduce a reviewed deterministic model at all, or explicitly keep the existing requirement blocked until the Stage 8.6D 15%-weight valuation contract is approved. A cosmetic renaming is not an option.
4. **TTM NIM:** direct explicit TTM disclosure-only (recommended) versus a newly governed four-quarter derivation using NII and average interest-earning assets. An annual labelled NIM is not accepted automatically.

### Test fixtures required before activating any contract

- NIM: direct 4Q verified percent -> eligible; annual NIM 4.75 or Net Profit Margin TTM -> reject.
- CET1: issuer-reported CET1 12.40% from Basel III as-of period and scope -> eligible; Tier 1 13% with no CET1 -> reject.
- CAR: issuer Basel III CRAR 17.20% -> eligible; Basel II 18.93% or zero -> reject.
- ROA: `roaa` from source with verifiable full FY start/end and consolidation -> eligible; undated `roaa` or quarterly annualized ROA -> reject.
- PB relative: same-bank unadjusted P/B 2 / reviewed 5Y reference 2.5 would produce 0.8 **only if that ratio convention is approved**; adjusted PBV 3.57 or zero book value -> reject.
- PB/ROE: until specific formula/normalizer approved -> all synthetic numerics reject.
- PE TTM relative: P/E 18 / approved 5Y reference 15 would produce 1.2 **only if that ratio convention is approved**; a 75.51% implied upside -> reject.
All figures here are synthetic unit-test illustrations **not** issuer observations and must never be written to canonical evidence.

## Actual 23-code BANK requirement preservation

Current historical selected snapshots include (13 each): ADVANCES_GROWTH_YOY, CAPITAL_ADEQUACY_RATIO, CET1_RATIO, DEPOSITS_GROWTH_YOY, EPS_GROWTH_YOY, EXTERNAL_LONG_TERM_RATING, GOVERNANCE_EVENT_SIGNAL, GROSS_NPA, IC3_SNAPSHOT_LINEAGE, INSTITUTIONAL_OWNERSHIP_TREND_4Q, MAX_DRAWDOWN_1Y, NET_NPA, NIM_TTM, PB_ADJUSTED_FOR_ROE, PB_RELATIVE, PE_TTM_RELATIVE, PRICE_MOMENTUM_12M, PRICE_MOMENTUM_6M, RATING_TREND, RELATIVE_STRENGTH_12M, ROA_ANNUAL, ROE_ANNUAL, VOLATILITY_RELATIVE.

**Historical selected-state census**: 299 applicable items, 65 FRESH, 234 blocked; not a current replay. The 26 already-accepted NPA reviews remain outside the old snapshot and must be evaluated once through the live canonical owner, not added arithmetically to 65.

**Other independent work:** prove four consecutive direct Institutional ownership quarters and total-equity denominator without FII/DII/MF reconstruction; investigate reviews and negative findings in EXTERNAL_LONG_TERM_RATING, RATING_TREND and GOVERNANCE_EVENT_SIGNAL; qualify latest completed stock/NIFTY_BANK session and corporate-action/return bases for KARURVYSYA, KOTAKBANK and SBIN. An unresolved source is not a positive assertion.

## Maintenance Gate B: one consolidated policy proposal (NOT ACTIVATION)

| Setting | Proposed rule | Approval/evidence still needed |
| --- | --- | --- |
| Clock / trigger | Daily **19:00 Asia/Kolkata** as a proposed eligibility-check time, **not** an assumption that candle publication is complete | Owner approves time; provider exchange-final-bar publication policy and observed availability must be verified |
| Calendar | NSE official verified session calendar, including declared special sessions; compare exact returned completed-session list, never weekdays arithmetic | Authority/source record, holiday/special-session ingestion and signed-off proof |
| Candle release | Acquire only after independently verified completed market session **and** final provider candle availability; otherwise defer | Measured publication lag and whether 19:00 is sufficient for specific provider |
| Daily call ceiling | **No unconditional recurring paid calls.** Suggested ceiling for a single fully missing session: at most thirteen stock-history calls plus **one** shared NIFTY_BANK request, *subject to actual provider quotas*, no automatic retries before approval | Provider quotas, rate limits, failed-unit billing, daily usage across the whole app and owner’s maximum recurring internal units |
| Authentication | Development-only service identity with scoped, single-use grants and existing provider leases/reservation settlement; no user JWT spoofing | Authorized issuance route and scope, expiration and rotation procedure |
| Revalidation | Current canonical effective validation at evidence arrival *and* expiry, with zero-provider expiry sweep; historical selected snapshot remains immutable | Approve scheduler's permission to run read-only; automatic materialization remains separately unauthorized |
| Publication changes | Detect quarterly results, ownership revisions and governance/rating documents; append immutable capture and queue substantive reviews | Approved bounded discovery cadence/provider calls; no automatic favourable documentary ACCEPT |
| Retry/failures | Default **no automatic paid retry** pending explicit cap; release leases, settle actual attempts, report failed/subset outcomes; use idempotency by security/session/source hash | Owner-approved retry/backoff and budget; live fault injection |
| Monitoring | Owner-only existing Development operational surface plus run/error/lease/budget/stale-reason indicators; suppress current READY if expiry proven or unknown | Authenticated UI, permitted notifications, monitoring ownership and alerts |
| Rollback | Keep scheduler OFF until canary; later pause job/kill-switch, settle in-flight units, preserve immutable evidence, independently verify readback; no destructive data removal | Approved activation and tested disable procedures |

**Gate B canary acceptance:** missing-session incrementality; one shared benchmark; duplicate idempotency; provider budget settlement; concurrent correction quarantine; no-call expiry; quarterly/ownership event revalidation; documentary review routing; partial failure and recovery; owner-authorized selection readback; real scheduled invocation and demonstrated disable. Simulated fixture tests are not live acceptance. One manual run or cron entry alone is insufficient.

## One consolidated owner decision

**Request authorization only when supporting source excerpts and final registry/mapping diff have been reviewed:**

- Approve/reject each of the seven proposed direct-source and valuation contracts individually; in particular, expressly decide TTM NIM input basis, ROA scope, historical P/B and P/E comparator windows/aggregation, and whether a new ROE-adjusted P/B model should exist.
- Separately approve/reject the specific **Development** maintenance policy and provider-call ceiling after actual quota verification.
- Separately approve the exact scoped recurring schedule only after audited dry-run and live canary. This document itself gives no permission to activate cron, spend recurrently or materialize observations.

No bank may be made READY by waiving a requirement or claiming that this **proposal** was approved. Deployment/readiness and Production remain isolated.
