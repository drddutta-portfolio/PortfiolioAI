# V1-4 research handoff: defer Banking and advance to G02

Owner direction, 14 October 2026 (Asia/Kolkata): preserve the banking research achieved, stop treating Banking/KVB closure as the prerequisite for other industries, and move to the next approved industry. This changes execution priority, not financial methodology, frozen membership or acceptance thresholds.

## 1. Disposition and boundaries

Banking is **PARTIAL RESEARCH / READINESS NOT PROVEN / ACTIVE CLOSURE DEFERRED**. It is not COMPLETE, not a failed build, and not investment-ready merely because its code passes. All 13 selected snapshots remain REVIEW_REQUIRED. Selected banking READY count/value: 0/13 and 0/20,513,862 paise (₹2,05,138.62). Frozen banking members remain in the frozen 111; they are neither removed nor counted as READY.

KVB is a reusable research reference, not a READY reference. Its selected snapshot `2af15b91-4924-4baf-ab1b-c91d62b095dc`, as-of 12 October, has three blockers: NIM_TTM, PE_TTM_RELATIVE and PB_RELATIVE. Existing accepted ROA review `51deb1ef-6105-4180-a139-30619ed6f5da` and valid historical evidence remain preserved. FRESH at that snapshot's evaluation time is not a claim of freshness today.

This handoff makes no new admission, factual review, provider call, materialization, deployment, migration, scheduler change, Production/main change or V1-5 claim. The existing Development banking scheduler remains configured; its outstanding operating limitations are carried explicitly below.

## 2. Banking research to retain and reuse

| Asset | Proven value | Reuse boundary |
|---|---|---|
| Canonical validator and owner-scoped admission | Existing review, validation and grant-scoped materialization paths; accepted ROA remains selected | Reuse infrastructure; each new stock still needs its own identity, sources, contract and authorized decision |
| Original document acquisition | Retained issuer/RBI originals, hashes and source records | Reuse original bytes; never reacquire unchanged originals simply to restart a chat |
| Ownership qualification | Native Institutional-series approach; direct aggregate qualification, no fabricated category sum | Recheck each stock's current source, denominator, four quarters and reporting semantics |
| KVB price history | 24 early NSE months plus actual 36-month R2 extraction, 60 source-linked monthly rows | Price coverage alone is not admitted valuation coverage |
| KVB valuation qualification | 52 historical P/B and 46 historical P/E candidates meet qualified coverage/exclusion rules | Not owner-admitted; do not apply bank valuation definitions automatically to another industry |
| Stable financial approval | Historical financial-source review survives price-only updates; new financial facts/basis require new review | One genuine owner action is still needed; chat permission is not an authenticated source-review event |
| Decimal/source/period safeguards | Exact calculations, publication-bounded denominators, corporate-action basis and fail-closed conflicts | Reuse helpers and tests; preserve each approved industry's metric definitions |
| Provider and scheduler safeguards | Reservations, accounting, single-use scope, session lease and bounded first-reservation wait | A cron submission is not proof that acquisition or ongoing readiness succeeded |

Verified code head `52bd0ba785dc99ca87aadfa28819b6880f1bce26` passed Architecture Guard, Banking Full Verification and Numeric Admission Guard. PR #124 remains the banking implementation handoff; later documentation commits do not imply merge into Development. Development valuation admission v4 and maintenance runner v5 are active; maintain their exact deployment/audit records in the PR documentation. Do not deploy an older branch over newer accepted runtime evidence.

## 3. Parked banking requirements and reopening triggers

| Work | Current boundary | Reopen only when |
|---|---|---|
| KVB P/B + P/E admission | Qualified 52/46 historical observations; no genuine owner approval/admission record found at latest readback | Real owner review is recorded, or an actual review-page error needs repair |
| KVB current valuation | Latest verified stored price session is October 12; current valuation/history proof must be source-qualified | A governed fresh capture and settled accounting exist, with a valid append-only history proof and corporate-action continuation |
| KVB NIM TTM | Retained 4.26% is explicitly an adjusted June-quarter figure, not certified TTM | A qualifying certified TTM source appears, or exact derivation inputs and a separately approved contract exist; alternatively an explicit versioned methodology amendment is approved |
| Other banks | Bank-specific financial, valuation and documentary gaps remain | A source/evidence event or bounded owner decision makes a specific requirement actionable |
| Maintenance | October 12 OPEN run succeeded; October 13 run failed ROLLING_LIMIT before calls. v5 bounded pre-reservation wait is deployed but not scheduled-run-proven | Observe an actual eligible scheduled run; do not infer success from cron status alone |

Do not repeatedly reacquire the same NIM presentation, reproduce blocker censuses without a changed input, or ask for ROA approval again. The rolling-24-hour 14-call cap can still cause accumulated scheduling drift beyond the 60-second wait bound; that case fails closed and needs an explicit operational-policy resolution. No limit is relaxed by this handoff.

### Last selected banking census, read back for this handoff

These are counts in stored selected snapshots, not a fresh authenticated handler replay and not a current freshness certification.

| Bank | Snapshot as-of | Mandatory blockers |
|---|---|---:|
| KARURVYSYA | 2026-10-12 | 3 |
| AUBANK | 2026-10-11 | 10 |
| BANDHANBNK | 2026-10-11 | 11 |
| HDFCBANK | 2026-10-11 | 11 |
| ICICIBANK | 2026-10-11 | 11 |
| SBIN | 2026-10-11 | 11 |
| BANKBARODA | 2026-10-11 | 12 |
| IDFCFIRSTB | 2026-10-11 | 12 |
| INDIANB | 2026-10-11 | 12 |
| AXISBANK | 2026-10-11 | 13 |
| IDBI | 2026-10-11 | 13 |
| KOTAKBANK | 2026-10-11 | 13 |
| FEDERALBNK | 2026-10-12 | 15 |

Do not reuse older lower blocker counts as the latest census. Preserve each snapshot's ID/evaluation date in the execution ledger.

## 4. Next approved industry: G02 — Heavy Electrical Equipment

Sequence authority: `Frozen_111_Owner_Approved_Execution_Order.csv`, positions 14–16. Banking groups G01/G20/G46/G48 are deferred, not removed. G02 proceeds before G03.

| Stock | Canonical security ID | Frozen value paise | Frozen value ₹ | Last selected snapshot / as-of | Blockers |
|---|---|---:|---:|---|---:|
| TDPOWERSYS | 7202b7b7-237c-439b-936d-c75bab806678 | 5,250,560 | 52,505.60 | 98f0f400-981e-46f7-83bb-2b0ffa686948 / 2026-10-07 | 10 |
| AVALON | 87132afb-e054-4ba2-adae-dc325637c001 | 3,177,160 | 31,771.60 | 624aa400-f50a-4234-b8fc-90ad2b6e74d8 / 2026-10-07 | 8 |
| CGPOWER | 5643737c-3c55-472d-af20-59d3121d6b9c | 1,236,410 | 12,364.10 | c5b2ab97-389f-4e38-ae57-0833f2d1ae56 / 2026-10-07 | 8 |
| Total | Three unchanged frozen members | 9,664,130 | 96,641.30 | 0 READY at selected baseline | 26 |

Recorded profile is CAPITAL_EQUIPMENT_ELECTRICAL for all three. Verify current effective industry/profile/subprofile and differing business models before admitting evidence. A planning group is not authority to impose identical economics, benchmarks or score thresholds.

### Source-linked baseline blockers

All three need BUSINESS_DURABILITY review; CFO_FCF_AND_WORKING_CAPITAL; NET_DEBT_AND_INTEREST_COVERAGE; OPERATING_MARGIN_HISTORY; OWNERSHIP_GOVERNANCE; REVENUE_AND_ORDER_GROWTH_MULTI_PERIOD; ROCE_OR_ROIC; and VALUATION.

- AVALON: five normalized-input failures have linked raw sources; operating-margin period is invalid; revenue/order evidence is missing; business durability needs document review.
- CGPOWER: four normalized-input failures have linked raw sources; operating-margin and revenue/order evidence are missing; ROCE/ROIC period is invalid; business durability needs review.
- TDPOWERSYS: four normalized-input failures have linked raw sources; margin period is invalid; debt/coverage and revenue/order evidence are missing; business durability needs review; two market-history requirements were STALE in its October 7 snapshot.

A missing selected source does not prove absence from all retained records. Inspect eligible originals and re-projection before acquisition. Do not treat October 7 market evidence as current for the other two simply because their selected snapshot did not flag it.

## 5. Four bounded execution phases

### Phase 1 — eligibility and source triage before new code

Read the three effective methodology assignments and exact mandatory contracts. Refresh provider-free prospective validation at the actual evaluation/source cutoff through the supported owner-authenticated route. Record every requirement's selected state, candidate source, original bytes/hash, reporting period/type, units, scope, publication/availability, freshness and conflict reason.

Inventory all eligible retained sources for each stock, not just the selected cached projection. Separate parser/integration failures, reviewable evidence, genuinely missing evidence and financial-methodology ambiguity. Check the existing global provider controls/reservations before proposing calls. The banking scheduler's 14-call allocation is not spare capacity for G02.

Deliverable: one three-stock requirement ledger and one acquisition/review package. No new UI, calculation framework or scheduler merely to produce this inventory.

### Phase 2 — reusable financial and documentary qualification

Re-project retained evidence through the existing canonical normalization path first. Use approved industry contracts for revenue/order growth, OPM history, cash flow/working capital, debt/interest coverage, ROCE/ROIC and valuation. Preserve exact periods and standalone/consolidated consistency. Share the established Decimal operating-margin owner; do not create another formula or borrow banking NIM/capital/valuation rules.

When evidence is genuinely absent, acquire exact current official issuer/exchange originals using the existing governed executor, with Trendlyne supplemental where contract-compatible. Request only unresolved items. Do not mistake retrospective figures for historical availability. Retain original hashes/URLs and source-linked factual extracts before review. Governance and durability remain documentary decisions, separate from ownership percentages.

Deliverable: admitted/reviewable facts or a precise source-bound blocker for each requirement. Repair only demonstrated defects and run meaningful targeted regressions; execute full required checks on the final changed implementation head.

### Phase 3 — close the most recoverable stock, then the remaining two

Choose the pilot after Phase 1 using actual admissible evidence and unresolved method decisions, not blocker count alone. AVALON is a provisional candidate because its eight-blocker baseline includes linked retained financial sources; CGPOWER is tied numerically and may be easier after source inspection. TDPOWERSYS has the largest frozen contribution and remains in this same three-stock batch.

Consolidate genuine owner decisions into one concrete source-review package with exact records/values/models/actions. Reuse prior genuine approvals only when their immutable financial scope matches. Run full-stock prospective canonical validation first, then supported scoped grants and authorized append-only materialization. Independently read selected snapshot, every mandatory requirement, selection lineage and frozen READY contribution.

Deliverable: one per-stock disposition: READY, EVIDENCE_BLOCKED, OWNER_DECISION_PENDING or EXECUTION_BLOCKED. Only a persisted canonical READY selection counts toward release totals. Partial research can be delivered, but never represented as complete scoring/recommendation or READY.

### Phase 4 — cumulative record and next batch

Append outcomes without changing original frozen rows or historical records. Report selected READY count/value and requirement admissions separately. If one stock is blocked, preserve its source-backed research package and continue the other two. G03 Aerospace & Defence follows G02 under the approved sequence; deferrals remain explicit and can be reopened by genuine new evidence without blocking the queue.

## 6. Rules that prevent another open-ended loop

1. Before building an admission path, prove that its required source facts exist or identify the exact decision needed. A green build is not evidence acceptance.
2. Each blocker gets one retained-source investigation and one targeted acquisition package. Retry only after a changed source, corrected request or demonstrated transport defect; obey existing retry/budget rules.
3. If the approved source set cannot supply the mandatory fact, issue a concrete blocked disposition and continue another stock. Do not fabricate substitutes or spend indefinitely.
4. No repeated full audit for unchanged inputs. Revalidate affected requirements and run full stock acceptance when a legitimate closure candidate exists.
5. One consolidated, reviewable owner checkpoint per batch where needed; no credential requests and no automatic impersonated acceptance.
6. End each execution slice with actual admissions/blocker reductions or a bounded handoff identifying missing fact, attempted sources, owner action and reopening trigger. Documentation/build passes are reported separately.

## 7. Acceptance and evidence authority

Architecture: existing canonical source ledger, observations/review ledger, registered industry profile, deterministic calculation modules, canonical materializer and selected snapshot view. No competing research database, speculative score or UI-local formula.

Frozen release still requires the approved count and value threshold (at least 100 frozen READY members and 119,327,127 paise). Banking deferral does not reduce it; successful G02 alone cannot satisfy it. With all 13 banking members deferred, only 98 other frozen members remain, so the unchanged 100-member acceptance minimum eventually requires at least two banks to become READY; the frozen-value test must also pass. This does not prevent other industries from progressing now. No V1-5 or Production work is implied.

This is a research preservation and execution-priority plan, not a promise that all three G02 stocks can pass using current retained data. The first next action is Phase 1 source triage and authenticated prospective validation, not another Banking continuation.
