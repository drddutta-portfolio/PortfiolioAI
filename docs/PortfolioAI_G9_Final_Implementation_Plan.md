# PortfolioAI — G9 Final Implementation Plan

**Stage:** G9 — Activation Approval Gate  
**Branch:** `r4n-pharma-subprofile-architecture`  
**PR:** #101 — OPEN / DRAFT / UNMERGED  
**Starting state:** G8 COMPLETE / SECOND-COMPANY PORTABILITY VALIDATED / NOT ACTIVE

## Hard cap

G9 contains exactly:

1. **G9.1 — AUROPHARMA Activation-Readiness & Authority Contract**
2. **G9.2 — AUROPHARMA Canonical Research Activation**
3. **G9.3 — Reciprocal PHARMA_V1 Normalization + Final Activation Validation**
4. then the next major stage.

There is **no G9.4** for routine follow-up.

## Core activation boundary

The following activation layers are independent and must never be treated as one switch:

1. parent `PHARMA_V1` profile;
2. canonical subprofile assignment;
3. research workspace;
4. numeric scoring;
5. recommendation;
6. position sizing.

AUROPHARMA may become canonically classified and research-active while numeric scoring, recommendation and sizing remain fail-closed.

## G9.1 — Activation-Readiness & Authority Contract

G9.1 is approval/readiness only. It writes nothing.

It must independently assess:

- parent Pharma profile authority;
- Primary `GLOBAL_GENERICS` authority;
- `API_BULK_DRUGS = EMERGING`;
- `BIOPHARMA_BIOSIMILARS = REVIEW_REQUIRED`;
- numeric scoring activation authority;
- recommendation and sizing authority.

Readiness denominator role-awareness must be re-confirmed on the G9.1 persistence candidate itself. Readiness must be based on company + active assignment + role + applicable requirement contract, not on subprofile name alone.

Expected G9.1 state:

- PHARMA_V1 research profile: READY;
- Primary assignment: READY FOR ACTIVATION;
- API Emerging: READY as research context, excluded from score/readiness denominator;
- Biosimilars: REVIEW REQUIRED;
- numeric score: BLOCKED;
- recommendation: BLOCKED;
- position sizing: BLOCKED;
- canonical persistence: OFF.

G9.1 closes only after localhost visual approval, full local validation and final handoff checkpoint.

## G9.2 — AUROPHARMA Canonical Research Activation

G9.2 replaces the temporary in-memory G8 architecture with the normal canonical assignment pathway in **local Supabase first**.

Expected local Primary assignment:

```text
AUROPHARMA
PHARMA_V1
GLOBAL_GENERICS
REVIEWED
HIGH confidence
effective_from 2026-03-31
```

Expected reviewed secondary exposure:

```text
API_BULK_DRUGS
EMERGING
REVIEWED
```

Biosimilars must not be persisted as an active reviewed Primary or active reviewed secondary exposure while its state remains unresolved.

### Required persistence tests

1. **Biosimilars active-row absence**
   - no active reviewed Primary Biosimilars assignment for AUROPHARMA;
   - no active reviewed Biosimilars secondary-exposure row attached to AUROPHARMA's active assignment.

2. **Security/assignment isolation + role binding**
   - AUROPHARMA Global Generics Primary has its own assignment authority;
   - TORNTPHARM Global Generics Material Overlay belongs only to TORNTPHARM's assignment;
   - no row/FK/reference is shared;
   - runtime interpretation resolves the different roles independently.

Canonical research activation must not enable numeric scoring, recommendation or sizing.

Production persistence remains separately gated behind explicit owner approval naming the exact production action.

## G9.3 — Reciprocal PHARMA_V1 Normalization + Final Activation Validation

G9.3 normalizes TORNTPHARM and AUROPHARMA into the same reusable PHARMA_V1 product architecture while preserving company-specific evidence and roles.

### TORNTPHARM receives the reusable three-layer architecture

- Common Core: PHARMA_V1
- Primary: DOMESTIC_FORMULATIONS
- Material Overlay: GLOBAL_GENERICS
- Emerging Watch: CDMO_CRAMS

A before/after **semantic-equivalence** snapshot must prove that the refactor does not change TORNTPHARM's assignment/role state, readiness, requirement states, dimension methodology/calculation states, dimension scores, overall state/score, governance/overlay states or reason codes.

### AUROPHARMA receives the shared G1–G7 methodology surfaces

Shared methodology includes Gate G, G1, G2, G3, applicable G4, G7-P1, G7-P2 and G7.1.

Company role state must drive applicability. In particular, AUROPHARMA has no reviewed Material Overlay, so overlay methodology must render as **NOT ENGAGED**, not zero, empty, unavailable or failed.

### Permanent product architecture

Both Pharma pages converge on:

```text
PHARMA_V1
  -> Common Pharma research
  -> Three-layer business-model architecture
  -> Primary research
  -> Secondary exposures
  -> Shared methodology
  -> Evidence / readiness
  -> Read-only preview if computable
  -> Research gaps
```

Historical TORNTPHARM and AUROPHARMA gate artifacts remain company-specific audit/history detail.

### Standing regression coverage

G9.3 must prove:

- TORNTPHARM remains Domestic Primary;
- AUROPHARMA remains Global Generics Primary;
- persisted Global Generics authorities remain security/assignment isolated;
- AUROPHARMA API Emerging cannot become Material;
- TORNTPHARM CDMO Emerging remains isolated;
- no active reviewed AUROPHARMA Biosimilars Primary/secondary row exists;
- common Pharma Core uses the same reusable architecture;
- evidence remains company scoped;
- assignments remain security scoped;
- readiness remains role-aware;
- score availability may legitimately differ by company;
- UI normalization cannot activate recommendation or sizing;
- TORNTPHARM semantic outputs remain unchanged by presentation normalization;
- AUROPHARMA NOT ENGAGED renders distinctly.

## Engine-change test

Reciprocal normalization should not require material redesign of the Pharma engine. If substantial scoring-engine redesign becomes necessary, stop and investigate before continuing.

## Safety boundaries

Until separately approved:

- production assignment write: NO;
- production evidence mutation: NO;
- production score persistence: NO;
- recommendation policy activation/persistence: NO;
- position-sizing activation/persistence: NO;
- provider refresh: NO;
- scheduler change: NO;
- automated trading: NO;
- production deployment: NO;
- PR #101 merge: NO.

## Non-goals

G9 does not finish Global Generics numeric calibration, solve every AUROPHARMA research gap, finish API Primary or Biosimilar methodology, invent a numeric score/recommendation/weight for completeness, activate D35B sizing, broaden to every Pharma holding, or reopen G6/G7/G8.

## Mandatory checkpoint workflow

```text
GitHub R4N branch
        ↓
Develop / update code
        ↓
Update PortfolioAI — ChatGPT Cumulative Development Handoff
        ↓
git pull
        ↓
Local code on owner Mac
        ↓
Local Supabase
        ↓
Local Vite app
        ↓
localhost UI
        ↓
Owner visual approval
        ↓
Full local validation
        ↓
Update cumulative handoff with final checkpoint
        ↓
Next checkpoint
```

No checkpoint completes merely because CI passes.

## G9 closure

G9 closes only after G9.1, G9.2 and G9.3 complete under the locked workflow.

Final intended state:

> **G9 = COMPLETE / PHARMA RESEARCH ACTIVATION ARCHITECTURE VALIDATED / NUMERIC ACTIVATION STILL FAIL-CLOSED WHERE METHODOLOGY IS INCOMPLETE**

There is **no G9.4**.
