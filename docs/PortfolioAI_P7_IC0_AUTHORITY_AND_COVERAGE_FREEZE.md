# PortfolioAI P7-IC IC0 — Authority and Coverage Freeze

**Audit date:** 28 September 2026

**Branch:** `PortfolioAI-Development`

**Reconciled Development HEAD:** `673dcc9ac9acc1a514df3e27a9f2e4b58c15925f`

**Environment:** Development only

**Verdict:** `IC0 = BLOCKED`

## 1. Scope and safety boundary

This was a read-only IC0 audit. It made zero Trendlyne calls, zero Angel One
historical calls, zero paid-AI calls, zero database writes, zero migrations and
zero Production changes. The Development branch and its remote were reconciled
at the same commit before evidence capture.

The machine-readable authority and coverage freeze is:

`docs/p7-ic/PortfolioAI_P7_IC0_PORTFOLIO_COVERAGE_MATRIX_2026-09-28.json`

The matrix contains one explicit record for each of the 248 open holdings. It
does not convert an unknown or unavailable fact to a ready state and does not
promote historical reference outputs into current portfolio results.

## 2. Universal stock-page shell lock

The Research stock page uses one shared `ResearchPage` shell. Classification
and methodology affect the content below the shared shell; they do not select a
different page layout. The locked shell contains:

- shared identity and classification context;
- About the Company;
- the compact eight-card position row, including Brokers / Demat;
- Decision Workspace and Key Insights;
- the shared tabs, glance, cockpit, refresh controls and research-health areas;
- methodology-specific panels only inside the common lower content region.

The shell was checked against the representative methodology families used by
HDFCBANK (Bank/NBFC), TORNTPHARM (Pharma), BEL (Industrials/Capital Goods), M&M
(Auto) and SRF (Chemicals specialist). The lock is supported by the single
shared component path, the existing authenticated cross-profile browser
evidence, and responsive coverage at 1440, 1280, 1024, 768, 430, 390 and 360
pixels. No corrective shell code was required in IC0.

Future methodology, subprofile or evidence work must remain inside this shared
shell. A base-shell fork requires explicit owner UI approval.

## 3. Portfolio totals

| Population | Count |
| --- | ---: |
| Open holdings | 248 |
| Equities | 239 |
| Non-equities / ETFs | 9 |

## 4. Methodology state

| State | Count |
| --- | ---: |
| RESOLVED | 110 |
| METHODOLOGY_NOT_AVAILABLE | 124 |
| REVIEW_REQUIRED | 5 |
| NOT_APPLICABLE | 9 |

## 5. Evidence state

| State | Count |
| --- | ---: |
| Conflicting | 66 |
| Missing | 142 |
| Review Required | 31 |
| N/A | 9 |
| Fresh | 0 |
| Stale | 0 |

These are current portfolio-level research readiness states, not a claim that
every underlying observation is absent. Ninety-eight equities have at least one
reusable fundamental observation in the canonical cache.

## 6. Engine and history state

- R6, R7 and sizing: 110 `BLOCKED_PREREQUISITE`, 124
  `METHODOLOGY_NOT_AVAILABLE`, 5 `REVIEW_REQUIRED`, 9 `NOT_APPLICABLE`; no
  current numeric score or ready recommendation was promoted.
- Market history: 237 `FRESH`, 2 `STALE`, 9 `MISSING` according to the current
  portfolio coverage registry.
- R8: 239 `BLOCKED_BY_CURRENT_R6_R7`, 9 `NOT_APPLICABLE`; recompute-only with no
  dedicated persistence table.
- R9: 239 `SESSION_ONLY_NO_DURABLE_BASELINE`, 9 `NOT_APPLICABLE`.
- Movement: 239 `NOT_AVAILABLE`, 9 `NOT_APPLICABLE`.
- R10: 239 `UPSTREAM_BLOCKED_RECOMPUTE_ONLY`, 9 `NOT_APPLICABLE`.

## 7. Persistence audit and blocking findings

Existing canonical persistence covers provider observations and decisions,
score runs, recommendation runs, sizing runs, owner decisions and provider
usage. The following capabilities required by the approved P7-IC completion
path are not currently sufficient:

1. The portfolio registry does not expose methodology-specific required-input
   counts per security. Required, fresh, stale and missing evidence counts are
   therefore `null`, not fabricated.
2. There is no materialized canonical current evidence snapshot matching the
   IC3 snapshot and lineage contract.
3. R9 has no durable cross-session baseline, acknowledgement or snooze state.
4. There is no durable multi-period Movement promotion/demotion history.
5. Basic industry and current owner target-price/stop-loss facts are not
   available in the audited shared read models and remain `null`.

Because the owner instruction requires IC0 to stop when schema/persistence
capability is insufficient, the audit cannot issue an IC0 PASS. No migration was
created or applied. The missing persistence must be resolved through an
owner-approved, additive, auditable schema/access-path design before execution
continues.

## 8. Provider planning estimate

Provider calls executed: **0**. All 239 equities may require some evidence
remediation under the current aggregate readiness states; 98 already contain
reusable fundamental cache data. The conservative planning ceiling remains
1,195 calls (239 × 5), or approximately four provider days at 320 planned calls
per day with an 80-call reserve. This is not an executable batch estimate. The
exact cache-first deficit and call plan can only be derived in IC2 after IC-B.

## 9. IC-A decision required

The next permitted action is owner review at IC-A. Approval is required for:

- the exact IC1 methodology and recommendation-policy remediation scope; and
- whether to authorize design of the additive persistence/migration work needed
  for canonical snapshots, durable R9 state and Movement history.

IC1 has not started. P8 remains unauthorized. Production remains unchanged.

## 10. Owner clarification after IC0 — strengthened IC-A scope

After reviewing the IC0 gap counts, the owner rejected a partial methodology-completion interpretation.

IC-A, when approved, must authorize IC1 against the strengthened portfolio-completion standard in the authoritative P7-IC plan:

- do not reopen Gate K;
- treat the 124 `METHODOLOGY_NOT_AVAILABLE` held equities as methodology-completion work items, subject to classification reconciliation;
- for every distinct held-equity business model, reuse a complete existing methodology where legitimately applicable or build and validate a complete methodology;
- complete every required held-portfolio R7 recommendation policy rather than leaving `...PENDING_THRESHOLDS`;
- permit only genuine factual/classification ambiguity to remain `REVIEW_REQUIRED`;
- make methodology evidence requirements machine-readable for the later IC2 cache-first provider plan.

This clarification changes the intended IC1 completion standard; it does not alter the historical IC0 read-only findings or convert IC0 to PASS.

`IC0 = BLOCKED` remains the current verdict until the owner approves IC-A and separately authorizes any required additive persistence/schema design boundary.

## 11. IC-A checkpoint and persistence decision boundary

IC-A, if approved later, must explicitly decide:

1. whether to authorize the strengthened IC1 held-portfolio methodology + complete R7-policy scope;
2. whether to authorize **design-only** work for additive persistence/access capabilities identified by IC0;
3. that migration creation and migration application remain separate owner approvals after exact design review;
4. that methodology requirement registries/read models must be available before provider-backed IC2 exact deficit planning;
5. that canonical current evidence-snapshot persistence/access must be resolved before IC3 can pass and before IC-C approval;
6. that durable R9 baseline/acknowledgement/snooze and durable multi-period Movement history must be resolved before IC6 can pass and before IC-E approval.

Checkpoint barriers are global:

```text
IC1       → STOP at IC-B
IC2 / IC3 → STOP at IC-C
IC4 / IC5 → STOP at IC-D
IC6       → STOP at IC-E
IC7 / IC-FINAL → Owner Checkpoint 6
```

Bounded cohorts may operate inside an approved checkpoint range but may not cross an unapproved owner checkpoint.

The canonical internal action enum is:

`ACCUMULATE / HOLD / WATCH / REDUCE / EXIT_REVIEW`

The UI may display “Buy / Accumulate” for `ACCUMULATE` and “Sell / Exit Review” for `EXIT_REVIEW`, but `BUY` and `SELL` are not additional internal recommendation/action states because they also identify transaction/accounting concepts.

This section is a governance clarification only. IC-A remains unapproved; IC1 remains unstarted; no build, migration, provider call, database write, deployment or Production change is authorized by this clarification.
