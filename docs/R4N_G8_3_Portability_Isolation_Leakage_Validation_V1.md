# PortfolioAI — G8.3 Portability / Isolation / Leakage Validation + Research-Gap Update V1

**Status:** IMPLEMENTED / OWNER VALIDATION REQUIRED  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Stage:** G8.3 only  
**Activation:** READ-ONLY / NON-PERSISTING / NOT ACTIVE

## Goal

Prove that PHARMA_V1 and G7.1 generalize from TORNTPHARM to AUROPHARMA without redesigning the engine and without cross-company, cross-role, BANK_NBFC or shared-state contamination.

## Twelve locked validation cases

1. Domestic → Global leakage: PASS.
2. Global → API leakage: PASS.
3. Global Generics Overlay → Primary role transition: PASS.
4. API secondary exposure cannot create an independent stock score: PASS.
5. Emerging exclusion: PASS.
6. BANK_NBFC isolation: PASS.
7. No denominator renormalization: PASS.
8. Governance anti-double-counting: PASS.
9. Cross-security evidence isolation: PASS.
10. Role-specific interpretation isolation: PASS.
11. Shared-state mutation isolation: PASS.
12. Company assignment isolation: PASS.

The validation uses the existing G7 invariants, TORNTPHARM G7.2 preview, AUROPHARMA G8.2 preview, reviewed-assignment resolver, security-scoped research repository contract and static mutation guards.

## Engine-change test

Result:

> **PORTABLE WITHOUT G7.1 REDESIGN**

TORNTPHARM and AUROPHARMA both consume the same G7.1 adapter version.

The difference in behavior comes from company assignment + role + applicable methodology, not a second adapter.

## Research-Gap Register update

G8.3 extends the existing G7 Research-Gap Register with AUROPHARMA-specific Global Generics Primary gaps.

The gaps include:

- current Growth evidence acquisition;
- Global Generics Operating Margin calibration;
- ROCE / Capital Efficiency calibration;
- Cash Conversion calibration;
- Balance Sheet / Leverage calibration;
- Business Durability aggregation;
- Valuation calibration;
- Momentum methodology/calibration;
- Ownership / Governance calibration;
- Regulatory / Market Risk normalization.

Each gap records:

- stable Gap ID;
- affected subprofile;
- role;
- dimension;
- methodology state;
- evidence state;
- whether it blocks AUROPHARMA overall preview;
- overlay participation effect;
- future stage;
- required evidence/decision;
- lineage;
- revisit trigger.

These gaps are not repaired inside G8.

## Safety

- production mutation: NO
- production migration: NO
- provider refresh: NO
- shared enrichment refresh/mutation: NO
- score persistence: NO
- recommendation change: NO
- position sizing change: NO
- scheduler change: NO
- deployment: NO
- PR merge: NO

## Closure boundary

G8.3 and G8 as a whole remain open until:

1. owner pulls this checkpoint;
2. localhost UI shows the G8.3 validation card;
3. owner visually approves it;
4. full local focused tests / ESLint / architecture / typecheck / build pass;
5. the cumulative handoff records that final validation result.

Only then may G8 be marked:

> **COMPLETE / SECOND-COMPANY PORTABILITY VALIDATED / NOT ACTIVE**

and only then may G9 begin.
