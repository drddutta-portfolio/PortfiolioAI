# P8-B Recovery Workstream C Closure — 2026-10-04

## Superseded status

**Workstream C = NOT CLOSED / FEASIBILITY STOP**

The earlier statement in this file that Workstream C was `COMPLETE / PASS / CLOSED` is superseded.

Reason: the governing recovery plan requires a feasibility decision before Workstream C bulk acquisition and recommends replay-ready coverage of at least 80% overall and 70% on every retained decision date before proceeding. The owner-approved exclusion ceiling remains `PENDING_OWNER_FREEZE`.

The latest alias-aware official NSE financial-metadata census shows:

- B2 eligible denominator: **121,956**
- covered pairs: **61,692**
- gaps: **60,264**
- overall coverage: **50.585457%**
- best decision-date coverage: **54.5980%**
- worst decision-date coverage: **44.2417%**
- decision dates meeting the recommended 70% floor: **0 / 32**

Official BSE automated fallback remains unproven/blocked. Trendlyne is secondary enrichment only and requires an official filing anchor; it cannot convert filing-absent pairs into replay-ready pairs.

Therefore explicit missingness is correctly preserved, but explicit missingness alone is not sufficient to close Workstream C as PASS.

## Preserved acquisition evidence

The source-acquisition work remains valid and reusable:

- original NSE manifest: 50,377 sources = 47,999 verified existing + 2,255 written + 123 initially unavailable;
- dated-alias acquisition inspected 64,828 NSE metadata rows;
- deterministic historical identity resolution via exact ISIN and dated NSE symbol/name;
- SHA-256 content hashes;
- deterministic R2 keys;
- no-refetch idempotency;
- provider calls 0;
- Production changes 0;
- performance/outcome reads 0.

No acquired evidence is invalidated or deleted by this status correction.

## Controlling decision

See:

- `docs/p8/PortfolioAI_P8_B_FEASIBILITY_DECISION_2026-10-04.md`
- `docs/p8/PortfolioAI_P8_B_CURRENT_EXPERIMENT_FEASIBILITY_STOP_2026-10-04.md`

Current disposition:

**NO-GO — CURRENT P8 EXPERIMENT NOT FEASIBLE UNDER THE GOVERNING RECOVERY STANDARD**

Workstreams D and E are not authorized under the current experiment. P8-C, holdout, forward returns, and performance remain untouched.
