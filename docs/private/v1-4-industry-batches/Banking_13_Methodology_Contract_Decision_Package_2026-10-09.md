# Banking V1-4 — source-bound unresolved methodology decisions (2026-10-09)

**Status:** Decision package / NOT APPROVED. No formulas or new materialization authorized by this proposal. **Gate A** remains NOT PROVEN until every applicable canonical requirement is satisfied. Retain all 13 bank identities and original methodology authority `BANK_NBFC_STAGE_8_BANK_V1`.

## Existing approved authority / source anchors

- `docs/Stage_8_1C_Live_Bank_Metric_Mapping_Result.md` approves native Trendlyne quarterly Gross/Net NPA ratio and EPS Qtr YoY Growth fields. It explicitly leaves **NIM, CET1, CAR, ROA, advances and deposits growth** as `PENDING_SOURCE`. The provider's Tier 1 is not CET1; Basel II zero must not be accepted as Basel III CAR.
- `docs/Stage_8_6D_HDFCBANK_Valuation_Self_History.md` reviews `PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT` (60% of valuation dimension) as a *relative self-history implied-upside signal*. The generic P/B relative pathway (25%) and valuation relative to ROE (15%) remain pending. No valuation or bank-readiness substitution is implied by the scoring dimension reaching a 60% threshold.
- `docs/private/v1-4-industry-batches/Banking_13_Fresh_Trendlyne_Financial_Result_2026-10-09.md` retains exact native token `roea` (annual ROE) / `roaa` (annual ROA) research, with provider identity but still missing independently certified fiscal-period and consolidation-scope applicability.
- `docs/private/v1-4-industry-batches/Banking_13_Approved_Delegated_Admission_Result_2026-10-09.md` proves the approved 26/26 quarterly standalone Gross/Net NPA reviews; **do not repeat** their admission or present the old selected snapshots as current READY.

## Decisions requiring authority / objective admission contracts

| Canonical requirement | Proposed safe evidence contract for owner review, not an active substitution | Nonnegotiable missing proof |
| --- | --- | --- |
| `NIM_TTM` | An *explicitly reported TTM* NIM % with trailing-four-quarter identity and consistent interest-earning-assets denominator; absent a native qualified TTM, a separately reviewed trailing-4Q interest-income/expense and average earning-assets derivation would be a **new calculation decision**, not implied by an annual field | Exact 4Q inputs, earning-assets basis, group/standalone and comparable period |
| `CET1_RATIO` | Basel III Common Equity Tier 1 capital / risk-weighted assets ×100 at stated reporting date from bank Pillar 3/regulatory publication | CET1 capital, RWA, Basel III, regulatory consolidation scope, date, original issuer PDF/hash |
| `CAPITAL_ADEQUACY_RATIO` | Basel III total regulatory capital / RWA ×100 with reported CRAR; never substitute Basel II, Tier 1 or CET1 | Regulatory capital definition, denominator, risk regime and period/scope |
| `ROA_ANNUAL` | Reviewed exact `roaa` native annual % or audited full-year profit / reviewed average-assets denominator *only if a separate derivation is approved* | Provider/fiscal FY start/end, annual not quarterly annualized, consolidated vs standalone, source/hash |
| `ROE_ANNUAL` | Reviewed `roea` native annual %; no conversion of undated cached ratios | Four-dimensional period/scope/provider/denominator proof |
| `PB_RELATIVE` | Generic unadjusted P/B relative to a **reviewed** bank-comparable reference (self-history or peers), with correct book value/share denomination; no `PBV_ADJUSTED_PROVIDER` | Exact unadjusted P/B, reporting date, reference universe/window/aggregation and exclusions |
| `PB_ADJUSTED_FOR_ROE` | Use only if a financial interpretation, precise ROE/PB window and reviewed transformation is explicitly approved; do not infer formula from the requirement name | Governing calculation and comparative reference, accounting scope and denominator |
| `PE_TTM_RELATIVE` | Retain approved `PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT` for its own reviewed scoring signal, not as a generic P/E ratio; a generic relative P/E requirement needs separately qualified P/E TTM, own 5Y reference and allowed comparison contract | Ratio-vs-upside semantic equivalence, FY window, negative/zero earnings behavior |
| `ADVANCES_GROWTH_YOY`, `DEPOSITS_GROWTH_YOY` | Use two equal reporting-period bank advances/deposits stocks and the approved YoY growth contract, where directly reported ratios are absent | Fiscal quarter/date alignment, gross/net deposits or advances basis, standalone/combined and unadjusted denomination |
| `EPS_GROWTH_YOY` | Approved native `EPS Qtr YoY Growth %`; keep specific quarter-to-corresponding-prior-quarter source | Quarter end, official EPS basis (basic/diluted), consolidation scope, revision lineage |

## Worked expectations and blockers (not invented values)

- 4Q NIM: a native `NIM Ann. % = 4.75` (previous AUBANK response) must **fail** `NIM_TTM` until reviewed equivalence to trailing four quarters and denominator is proven.
- CET1: a 13% Tier 1 ratio must **not** pass CET1 without the corresponding explicitly identified CET1 / RWA fact.
- CAR: an old Basel II 18.93% figure must **not** pass a Basel III adequacy requirement because the regulation and capital definition differ.
- ROA: an annual-labelled token without verified fiscal year and consolidation scope remains **REVIEW_REQUIRED**, not auto-valid ROA.
- P/B: adjusted PBV 3.57 must **not** qualify generic unadjusted P/B, nor justify a PB/ROE valuation decision.
- Future full-quarter filing supersedes an older favourable quarter according to approved applicability, not retrieval timestamp.

**Decision requested only when fully evidence-backed:** select exact approved input fields, fiscal and consolidation policy, any deterministic derivation, comparison reference and handling of zero/missing/negative denominators. Then version each changed metric contract and add source-faithful before/after regression fixtures; never backfill missing factual periods.

## Documentary and correction admission (independent of formula decisions)

Require the exact official issuer/rating agency source URL, stored original bytes/hash, affected bank/ISIN, publication/effective dates, financial period, supporting excerpt, negative-event handling, actual delegated reviewer authority and append-only supersession lineage. Governance absence must never be inferred from an empty source list.

History correction requires immutable original candle and raw provider captures, official corporate-action ratios, adjusted/unadjusted return basis, benchmark alignment, a valid revised projection selected through the approved canonical engine and an independent before/after readback. Rejecting a difference does not complete supersession.

## Execution boundary

The existing 14 Oct-8 candles and 26 approved NPA reviews are already retained and source-bound. Avoid repeated acquisition. No currently unexpired, unconsumed P4 grant was found at investigation time; the exact historical Oct-8 action cannot be repurposed for any newer session. New provider calls need a current approved grant and exact published-session eligibility; no personal owner token or synthetic issuer is supplied by this proposal.
