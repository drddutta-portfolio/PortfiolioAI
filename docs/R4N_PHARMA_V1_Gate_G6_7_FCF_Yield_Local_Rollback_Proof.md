# R4N Gate G6.7 — Local Rollback-Only Execution Proof for FCF Yield Registration

**Status:** Prepared / local-only / rollback-only / not yet executed  
**Branch:** `r4n-pharma-subprofile-architecture`

## Purpose

G6.7 proves that the G6.6 registration SQL is compatible with the current local schema while leaving no persisted state behind.

Target proposal:

`docs/sql/R4N_PHARMA_FCF_YIELD_PERCENT_V1_REGISTRATION_PROPOSAL.sql`

## Safety

The runner:

- requires local Supabase and `psql`;
- resolves the DB URL from local Supabase state;
- refuses non-local hosts;
- captures pre-execution counts for `FCF_YIELD` and `FCF_YIELD_PERCENT`;
- executes the exact proposal SQL;
- relies on the proposal's deliberate `ROLLBACK`;
- captures post-execution counts;
- fails if persisted counts changed.

It does not authorize a local migration, production migration, observation insert, score run or deployment.

## Run

From the repository root:

```bash
bash scripts/r4n/run-g6-7-fcf-yield-registration-rollback-proof.sh
```

Expected clean result from the current G6.5 baseline:

```text
Before execution: FCF_YIELD=0, FCF_YIELD_PERCENT=0
...
After rollback: FCF_YIELD=0, FCF_YIELD_PERCENT=0
G6.7 rollback proof: PASS
Persisted definition state unchanged.
WRITE_AUTHORIZED=NO
```

A SQL error, preflight exception, or changed post-rollback count means the proof fails closed.
