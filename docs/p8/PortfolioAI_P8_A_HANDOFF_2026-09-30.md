# PortfolioAI P8-A handoff

## Result

P8-A is COMPLETE / PASS as a read-only historical data sufficiency inventory. Its result is deliberately fail-closed: the P8 execution gate remains **BLOCKED — DATA FOUNDATION** and no performance backtest is authorized.

The audit measured all 239 current equities in hosted PortfolioAI Dev without provider calls, migrations or database writes. Two domains are partial foundations and seven are blocked. The complete machine-readable evidence is `docs/p8/PortfolioAI_P8_A_HISTORICAL_DATA_SUFFICIENCY_AUDIT_2026-09-30.json`.

## Material findings

- Daily history covers 239/239 equities and 63,927 rows, but has at most 282 dates, no adjusted-close values and nine short histories.
- Ten benchmark series contain 271 dates each; this is not multi-cycle history.
- Fundamentals cover 114/239 equities. Only two of 2,428 rows have publication timestamps, and only one equity has eight or more periods.
- Documents cover 111/239 equities, begin in April 2026 and provide no equity with eight publication dates.
- The 1,246 canonical evidence snapshots cover all 239 equities but only one as-of date, 2026-09-29.
- Listing records have no validity dates, there are no inactive securities and no historical classification changes. Today's universe therefore cannot be treated as survivor-free history.
- There are zero historical score runs. Five legacy recommendation rows for one equity are not portfolio R6-R10 history.

## Governance boundary

P8-B has not started. Before it can begin, the owner must approve a bounded remediation scope covering the historical universe, minimum period, decision calendar, corporate-action authority, benchmark set, point-in-time evidence acquisition and classification/methodology validity history.

No return, alpha, drawdown, hit-rate or policy-improvement claim may be produced from the current data. No live R6-R10 policy, owner role, sizing, action or transaction state was changed.

## Current state

- P7: COMPLETE / PASS / CLOSED
- P8: ACTIVE
- P8-0: COMPLETE / PASS
- P8-A: COMPLETE / PASS
- P8-B: NOT STARTED / AWAITING OWNER-APPROVED REMEDIATION SCOPE
- P8-C+: NOT STARTED / NOT AUTHORIZED
- P8 execution gate: BLOCKED — DATA FOUNDATION
- Production/main: unchanged

## Exact next step after approval

Freeze the P8-B experiment/remediation contract before any acquisition or replay: name the survivor-free universe authority, eligible dates, minimum history, adjustment authority, benchmark mapping, point-in-time evidence rules and deterministic exclusion reasons. Then implement only the separately approved data remediation required by that frozen contract.
