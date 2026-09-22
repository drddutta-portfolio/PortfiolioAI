# R4N Gate G6.5 — Local FCF-Yield Persisted Alias Preflight

**Status:** Prepared / read-only / not yet executed  
**Branch:** `r4n-pharma-subprofile-architecture`

## Purpose

G6.5 inspects the actual local Supabase state for `FCF_YIELD` and `FCF_YIELD_PERCENT` before any storage reconciliation or numeric FCF-yield score bands are considered.

## Safety

The runner resolves the local Supabase DB URL, refuses non-local hosts, executes inside `BEGIN TRANSACTION READ ONLY`, and ends with `ROLLBACK`. It performs zero writes.

## Run

```bash
bash scripts/r4n/run-g6-5-fcf-yield-alias-preflight.sh
```

The report shows definition state, TORNTPHARM observation state, alias duplicates/conflicts, global usage counts and a final preflight classification. No write is authorized.
