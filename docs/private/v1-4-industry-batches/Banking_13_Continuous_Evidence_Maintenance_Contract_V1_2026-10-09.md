# PortfolioAI V1-4 BANK — Continuous Evidence Maintenance Contract V1

**Version:** V1_4_BANK_MAINTENANCE_V1
**Date:** 2026-10-09
**Scope:** 13 approved frozen BANK equities, shared NIFTY_BANK, Development project `lrgpjimipfkyoqbpsqzz`.
**Activation:** NOT AUTHORIZED / NOT ACTIVATED. **Gate A:** NOT PROVEN. **Gate B:** NOT PROVEN.
**Owner:** Existing canonical evidence/requirement validator, append-only snapshot-selection and provider-control systems. This contract adds no independent readiness engine.

## Two independent gates

**Gate A — initial qualification:** For each bank, ALL applicable requirements pass the existing authoritative validator, admitted evidence has sufficient source/period/semantic/review proof, and a persisted snapshot plus actual selected-snapshot readback is READY. Bank-by-bank admission is permitted under separately applicable grants, not inferred from this contract.

**Gate B — continued freshness:** Controlled daily-session and publication-event workflows are actually activated, have proven idempotency/locks/usage accounting/recovery, and revalidate both evidence changes and *expiry without changes*. The application must distinguish historical snapshot status from effective current readiness, including timestamp, pending review and stale/conflict details. A prior READY cannot appear current if its mandatory evidence expires.

## Existing capabilities to reuse

- Angel One market-history transport and mapping, `refresh-market-history`; existing classification/provider locks and reservations, `provider_budget_reservations`.
- Market-history canonical validation, `_shared/v14-history-readiness.ts`, with verified calendar/corporate-action/return-basis and existing **four-hour** daily-close evidence grace.
- Existing `p7-ic2-materialize-readiness` canonical handler (Development v46 at inspection), read-only validation `P7_IC3_VALIDATE_CANONICAL_INPUTS`, append-only `research_evidence_snapshot_selections`.
- Existing scoped primary-filing fallback `V1_4_BANK_PRIMARY_FILING_DELEGATION_V1`; `research_evidence_requirement_reviews` for provenance and bounded factual reviews.
- `plan-research-refresh`, `_shared/research-refresh-plan.ts` and `cohort-orchestrator.ts` for existing planning patterns; existing `refresh-bank-benchmark`, financial/ownership/document capture paths.
- This branch adds `_shared/v14-bank-maintenance-plan.ts`, a **read-only input-validated decision helper** that consumes verified completed-session and canonical expiry facts. It neither invokes providers nor grants READY.

## Refresh triggers / authority

| Family | Trigger | Authority | Admission boundary |
| --- | --- | --- | --- |
| BANK stock candles (13) | Each *verified completed NSE session* after provider publication eligibility | Existing Angel One mapping plus approved exchange calendar and corporate-action proof | Reuse existing history validator; append qualified tail, never rewrite silently |
| NIFTY_BANK (one shared benchmark) | Same completed session; acquire once, share verified identity/alignment | Existing benchmark control plane, NIFTY_BANK only | Confirm compatible return basis, provenance and cutoff |
| Banking quarterly results | New official issuer/NSE filing or bounded periodic discovery | Approved Trendlyne primary; independently scoped approved official-filing fallback | Source dates, definitions, units, denominator and standalone/consolidated scope before append-only review/admission |
| Promoter / Institutional histories | New officially disclosed quarter or revision | Direct selected Trendlyne series and approved official semantic proof | Four consecutive real quarters, total-equity denominator, overlap and revisions; never sum FII/DII/MF into Institutional |
| Annual / governance / rating events | New authoritative document or action, bounded discovery | Official issuer/exchange/rating authority with hashes/storage identity | Pending substantive review; no auto-ACCEPT |
| Required evidence expiry | At/before canonical freshness cutoff, even without any provider event | Per-requirement canonical policies; existing validator | Fail closed current-effective UI; retain historic snapshot for audit, not present as current READY |

**Undefined requirements that must not be guessed:** exchange calendar source and special-session verification for recurring future dates; final-bar publication delay/eligibility policy; permitted daily schedule and time zone; current-evidence expiry-trigger timing for each financial/document class; material event effect on readiness; exact provider/benchmark per-run limits; delegated operator/grant scope for unattended operations; permitted per-run/day and recurring paid calls; allowed automatic canonical materialization upon change; alert destination and recipient permissions.

**Market close is not itself bar availability.** Job must not acquire today's incomplete candle as completed. Weekends/holidays are determined by the supplied verified trading-calendar records, never by date arithmetic.

## Idempotency / resilience requirements

- Plan by `security_id + exchange + interval + session` and `NIFTY_BANK + session`; compare qualified existing evidence before any call. One benchmark request per eligible session shared by the cohort. Publisher corrections append superseding provenance rather than silently overwrite.
- Existing leases/locks must protect per-source and per-session work against concurrent runners. Replay after failure should not duplicate source rows, budget units, or selection events.
- **Verified existing-executor incompatibility:** `refresh-market-history` currently UPSERTs `market_price_history` on `(security_id,provider_code,interval,period_start)` and `refresh-bank-benchmark` UPSERTs `market_benchmark_price_history` on `(benchmark_code,provider_code,interval,period_start)`. Both also write derived metric observations. Consequently neither legacy function may be assumed append-only or safely invoked by the recurring banking workflow as-is. Implement a qualified-tail-only, versioned correction/supersession path in the existing canonical owner, audit the unique-index/lineage contract, and independently test old-row preservation before any scheduler activation. Do not silently replace the historical price evidence.
- Reserve provider budget **before** calls, track attempted/successful/failed calls, settle consumed/failed/released units on all paths. Expired Angel One sessions produce a recorded recoverable authentication failure without extending freshness.
- Bounded retry/backoff is allowed only under a documented provider quota, no implicit unbounded loops. Recover abandoned leases and expired reservations through existing approved recovery, not an unreviewed scheduler.
- Each bank may progress independently. A failed bank does not cancel successful independent banks.
- Every nonqualified source/candle remains explicit BLOCKED, STALE, REVIEW_REQUIRED or CONFLICTING. A failed job never advances `freshnessThrough`.
- New disclosure or revision must cause re-evaluation, not preference for stale favourable versions. A document may create a review dependency rather than automatic favourable decision.

## Fail-closed status presentation and effective readiness

Store/return separately: selected snapshot and selection IDs; persisted status; evaluated-at and source-cutoff times; last qualified evidence update; current effective freshness/review status and reason; provider-job status. **Do not silently equate historical READY with current READY.** Must invoke canonical validator for effective requirement status; the planning helper only raises a veto when evidence expiry/absence, review dependencies or unverified calendar are detected. Wiring to the existing stock/coverage UI remains unimplemented and must be verified browser → API → selected evidence → displayed state.

## Scheduler activation / rollback package — approval required

1. Approve named Development-only execution identity with proper RLS/service boundaries, grant and review scope; prohibit Production and unrelated securities.
2. Approve exact time-of-day, NSE calendar authority and special-session handling, provider publication delay, per-run/day quotas and retry budgets; separate no-cost expiry monitoring from paid acquisition.
3. Deploy audited implementation, run one dry-run and one bounded live canary, validate source hashes, provider usage/grants, canonical evaluator and append-only readbacks, then enable recurring schedules.
4. Monitor missing-session gap, last successful run, provider failures, lock age, reservation settlement, stale evidence and pending factual review in the existing operational surface.
5. Rollback: disable schedule/kill switch, allow in-flight reservations to settle safely, revert Development deployment only, preserve evidence and reviews append-only, invalidate or supersede any incorrect selection, and verify current-effective UI cannot display expired READY.

## Acceptance evidence still required

Controlled end-to-end tests must show completed-session incrementality, one benchmark request, repeated idempotency, weekends/holidays, failures/retries/accounting, quarterly facts and ownership revisions, pending governance review, expiry with no calls, scoped authorized materialization and independent readback, partial failures and recovery monitoring. Mock/unit tests cannot substitute for live authenticated and persisted readback. Until both Gate A and Gate B pass, Banking V1-4 operational status is **NOT PROVEN**.
