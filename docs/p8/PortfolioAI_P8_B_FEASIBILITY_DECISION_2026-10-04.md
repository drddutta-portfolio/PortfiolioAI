# PortfolioAI P8-B Feasibility Decision — 2026-10-04

## Decision

**NO-GO — CURRENT P8 EXPERIMENT NOT FEASIBLE UNDER THE GOVERNING RECOVERY STANDARD**

This decision is outcome-blind. No P8-C result, holdout, forward return, or performance outcome was inspected.

The controlling plan is:

`docs/p8/PortfolioAI_P8_B_SINGLE_RECOVERY_PLAN_2026-10-03.md`

That plan requires feasibility to be established before Workstream C bulk acquisition and recommends, before any outcome inspection:

- at least 24 proven decision dates;
- 100% historical-identity resolution;
- at least 80% replay-ready coverage overall;
- at least 70% replay-ready coverage on every retained decision date;
- no major methodology sector below 60%;
- explicit exclusions and no silent cohort removal.

The owner-approved exclusion ceiling remains `PENDING_OWNER_FREEZE`. This document does not invent or claim owner approval.

## Authoritative evidence

Frozen B2 eligible denominator: **121,956 pairs**.

Latest alias-aware official NSE financial metadata census:

- covered pairs: **61,692**
- gap pairs: **60,264**
- overall coverage: **50.585457%**
- gap historical identities: **2,715**
- official NSE metadata rows inspected: **64,828**
- exact-ISIN resolutions: **54,043**
- dated NSE symbol + company-name resolutions: **1,044**
- unresolved metadata rows: **9,741**
- provider calls: **0**
- performance/outcome reads: **0**

Decision-date coverage ranges from:

- maximum: **54.5980%** on 2024-05-31
- minimum: **44.2417%** on 2026-09-29

Number of decision dates reaching the recommended 70% floor: **0 / 32**.

Therefore the current source surface cannot meet either the recommended 80% overall floor or the 70% per-date floor.

## Source-acquisition state

The acquisition system itself is substantially functional and remains reusable:

- original NSE manifest: **50,377** sources;
- **47,999** verified existing;
- **2,255** written;
- **123** initially source-unavailable;
- deterministic R2 object keys;
- SHA-256 content hashes;
- no-refetch idempotency;
- Development-only execution.

The dated-alias acquisition run also demonstrated large-scale source acquisition, but material source unavailability remains. This does not repair the feasibility shortfall.

The Workstream B closure had already bounded **60,231** pairs as requiring BSE fallback under its then-current census. Official BSE automated transport remains unproven/blocked in the available execution environment.

Under the recovery source hierarchy, Trendlyne is secondary enrichment only and requires an official filing anchor. It cannot legitimately convert pairs with no official filing evidence into replay-ready pairs.

Tier-3 official company/regulatory documents remain useful for classification/business-model evidence, but they do not establish a demonstrated path from ~50.6% official financial-metadata coverage to the required 80% replay-ready financial-evidence floor.

## Feasibility conclusion

The current experiment cannot legitimately proceed to a Workstream C PASS under the governing recovery plan.

The prior Workstream C closure statement that explicit missingness alone was sufficient for closure is superseded by this feasibility decision.

Explicit missingness is valid evidence of absence; it is **not** equivalent to sufficient replay-ready coverage.

## Preserved work

The following remain valid and should not be rebuilt merely because the current experiment is infeasible:

- Post-D P0-P7 / P7-IC work already closed;
- P8 B0/B1 experiment foundations;
- B2 historical universe and survivor-free identity model;
- B3 market-history / corporate-action / benchmark foundation;
- R2 historical-storage architecture;
- Workstream A semantic corrections;
- Workstream B historical identity/source adapters;
- dated NSE alias resolver;
- existing immutable source manifests and R2 objects;
- hashing and idempotent acquisition machinery;
- point-in-time dissemination-before-decision rule.

## Prohibited next actions

Until the owner explicitly chooses the next experiment path:

- do not resume bulk Workstream C acquisition;
- do not start Workstream D;
- do not rerun B5/B6/B-FINAL;
- do not run P8-C;
- do not inspect holdout or performance outcomes;
- do not lower the recommended coverage standard retrospectively;
- do not silently exclude missing cohorts.

## Next legitimate step

Per the controlling plan's irreducible-failure rule, the next owner decision is one of:

1. authorize design of a **separately versioned narrower P8 experiment before any outcome inspection**, preserving all valid existing data and infrastructure; or
2. declare the desired current historical-validation scope infeasible.

No nested remediation program is authorized by this decision.
