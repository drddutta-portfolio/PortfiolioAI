# PortfolioAI P8-B Recovery — Workstream B Completion

**Date:** 2026-10-04  
**Branch:** `PortfolioAI-Development`  
**Workstream:** B — Historical identity/source adapter + metadata-only source census  
**Status:** **COMPLETE / PASS (bounded handoff to Workstream C)**

## Decision

Workstream B is complete under the controlling recovery plan.

This closure does **not** authorize Workstream C, filing-body acquisition, hosted B5/B6 mutation, B-FINAL rerun, P8-C, Production changes, or any provider call.

The remaining BSE work is an **acquisition-stage fallback requirement**, not an unresolved Workstream B identity/census requirement. Workstream B has deterministically identified and bounded those pairs for Workstream C.

## Completed deliverables

1. Recovery historical identity contract is independent of current `canonical_security_id`.
2. Historical alias/source resolution is built from canonical B2 R2 evidence.
3. NSE official-filing identity adapter is implemented with historical ISIN as primary identity anchor.
4. BSE fallback adapter is implemented and requires exact ISIN anchoring; no symbol-only guess is permitted.
5. Symbol-change, name-change, and historical-only/delisted-style identity canaries are proven against real B2 R2 evidence.
6. Full metadata-only source census is complete for the frozen B2-eligible population.
7. Census preserves strict point-in-time semantics: exchange dissemination time must be strictly before the simulated decision timestamp.
8. No present-day manual assignment, current-state fallback, cross-security imputation, or unknown-to-zero behavior was introduced.

## Frozen census facts

- Historical identities: **4,524**
- Full audit surface: **144,768 identity/date dispositions**
- B2-eligible candidate pairs: **121,956**
- NSE metadata candidate ready: **61,702**
- NSE metadata partial: **23**
- BSE fallback required: **60,231**
- NSE metadata requests: **287**
- Relevant NSE filing metadata rows: **69,582**
- Relevant rows with unusable timestamp: **0**

The 60,231 BSE-fallback pairs are **not exclusions** and are not treated as missing-by-policy. They are an explicit Workstream C source-acquisition queue.

## Real identity canary proof

The R2-backed canary audit proved:

- **116** historical identities with observed symbol changes.
- **1,000** historical identities with observed name changes.
- **4,262** identities with listing evidence and no current `canonical_security_id` link.
- A real multi-symbol historical identity under one historical ISIN.
- A real multi-name historical identity under one historical ISIN.
- A real historical-only candidate with `canonical_security_id = null`.

This proves recovery identity resolution does not depend on present-day security linkage.

## BSE transport boundary

The official BSE JSON API returned HTTP 403 from GitHub Actions, while the official BSE desktop and mobile announcement pages returned HTTP 200.

Workstream B therefore closes with the fallback population **deterministically identified and bounded**, but without bulk BSE acquisition. This is intentional: the controlling plan assigns actual official filing acquisition to Workstream C.

Workstream C must remain fail-closed:
- NSE official metadata/source first.
- BSE only for exact NSE gaps using deterministic ISIN mapping.
- If an official BSE transport cannot be proven for a required pair, that pair remains an explicit source blocker; it must not be guessed, silently excluded, or replaced by current data.

## Boundary checks

All of the following remain true at Workstream B closure:

- Provider calls: **0**
- Filing-body downloads: **0**
- XBRL downloads: **0**
- PDF downloads: **0**
- Filing CSV body downloads: **0**
- Supabase writes: **0**
- R2 writes: **0**
- Hosted B5/B6 mutations: **0**
- Performance/holdout reads: **0**
- Production/main changes: **0**

## Exclusion ceiling

The recovery exclusion ceiling remains:

`PENDING_OWNER_FREEZE`

No exclusion ceiling has been invented or frozen by this closure.

## Evidence

- `docs/p8/PortfolioAI_P8_B_RECOVERY_METADATA_CENSUS_AUDIT_2026-10-03.json`
- `docs/p8/PortfolioAI_P8_B_RECOVERY_METADATA_CENSUS_IDENTITY_SUMMARY_2026-10-03.csv`
- `docs/p8/PortfolioAI_P8_B_RECOVERY_IDENTITY_CANARIES_AUDIT_2026-10-03.json`
- `docs/p8/PortfolioAI_P8_B_RECOVERY_EXCHANGE_METADATA_CANARY_AUDIT_2026-10-03.json`
- `src/features/backtesting/p8BRecoverySourceAdapters.ts`
- `src/features/backtesting/p8BRecoveryB2R2Adapter.ts`

## Recovery position

`P8-B Recovery → Workstream A ✅ COMPLETE/PASS → Workstream B ✅ COMPLETE/PASS → Workstream C NOT STARTED / NOT AUTHORIZED → corrected B5 untouched → corrected B6 untouched → B-FINAL untouched`

No nested recovery plan is created by this closure.
