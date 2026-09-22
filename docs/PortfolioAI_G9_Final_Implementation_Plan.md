# PortfolioAI — G9 Final Implementation Plan

**Stage:** G9 — COMPLETE / PHARMA RESEARCH ACTIVATION ARCHITECTURE VALIDATED  
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

## G9.3 — PHARMA_V1 Sector Workspace Completion + Reciprocal Feature Portability

G9.3 completes the reusable PHARMA_V1 sector workspace **without redesigning the shared PortfolioAI Research shell**.

### Frozen UI architecture

G9.3 must preserve the already-frozen R4M product rule:

- one common Research page for every security;
- one shared interaction grammar and page hierarchy;
- sector/profile-specific extension after the shared shell;
- no stock-specific page tree;
- no duplicated TORNTPHARM/AUROPHARMA mini-applications;
- no symbol-specific presentation branches as the permanent architecture.

The shared Research shell remains responsible for:

- security header / classification;
- company summary;
- portfolio / price context;
- Decision Workspace;
- PortfolioAI Suggestion;
- AI Interpretation;
- Key Insights;
- Research Refresh;
- common tabs;
- Research at a glance;
- score / heatmap / ratings / readiness shell;
- Documents / Evidence interaction grammar.

PHARMA_V1 owns the sector-specific deep-research extension.

### G9.3-A — Reciprocal Pharma capability inventory

First identify the validated Pharma capabilities currently split across the two reference companies.

**TORNTPHARM currently contributes the mature Pharma deep-research methodology stack**, including:

- reviewed Primary / secondary exposure summary;
- Gate G scoring-methodology design;
- G1 adaptive classification;
- G2 overlay contract;
- G3 readiness mapping;
- G4 governance/regulatory treatment;
- G5.1–G5.7 common Pharma dimension frameworks;
- G6.1–G6.45 subprofile/curve applicability and methodology outcomes;
- G7-P1 / G7-P2;
- G7.1 read-only adapter;
- G7.2 explainable TORNTPHARM preview;
- G7.3 validation / research-gap register;
- company-specific evidence acquisition, source discovery, document review and ingestion controls.

**AUROPHARMA currently contributes validated second-company/activation capabilities**, represented by:

- G8.1 classification & evidence lock;
- G8.2 three-layer same-engine read-only preview;
- G8.3 portability / isolation / leakage validation;
- G9.1 activation-readiness & authority;
- G9.2 canonical research-assignment state.

These capabilities must be treated as reusable Pharma capabilities where their semantics are profile-level or role-level, not copied as AUROPHARMA-labelled panels into another stock.

### G9.3-B — Generalize AUROPHARMA capabilities into PHARMA_V1 workspace features

The **capability semantics** of G8.1 / G8.2 / G8.3 / G9.1 / G9.2 become reusable PHARMA_V1 workspace modules:

1. **Classification & evidence lock**
   - reviewed Primary candidate / authority;
   - Material Overlay state;
   - Emerging Watch state;
   - unresolved exposure state;
   - evidence/comparability basis;
   - fail-closed classification boundary.

2. **Three-layer research architecture**
   - Common PHARMA_V1 Core;
   - reviewed Primary business model;
   - reviewed Material Overlay(s), if any;
   - Emerging Watch(es);
   - unresolved exposures;
   - role-aware methodology interpretation.

3. **Portability / isolation checkpoint**
   - cross-security evidence isolation;
   - assignment isolation;
   - role-specific interpretation isolation;
   - Emerging exclusion;
   - no BANK_NBFC leakage;
   - no denominator renormalization;
   - governance anti-double-counting;
   - no shared mutation state.

4. **Activation-readiness & authority**
   - parent profile authority;
   - Primary authority;
   - secondary-exposure authority;
   - unresolved-exposure blocker;
   - numeric-scoring authority;
   - recommendation authority;
   - sizing authority.

5. **Canonical assignment state**
   - resolver state;
   - current reviewed Primary;
   - reviewed secondaries and materiality;
   - unresolved exposures;
   - effective date / confidence;
   - downstream fail-closed state.

For TORNTPHARM these modules must render from TORNTPHARM's own canonical state:

- Primary: DOMESTIC_FORMULATIONS;
- Material Overlay: GLOBAL_GENERICS;
- Emerging: CDMO_CRAMS.

For AUROPHARMA:

- Primary: GLOBAL_GENERICS;
- Material Overlay: none;
- Emerging: API_BULK_DRUGS;
- unresolved: BIOPHARMA_BIOSIMILARS.

### G9.3-C — Complete the reusable Pharma Deep Research workspace

The current TORNTPHARM Pharmaceuticals deep research workspace becomes the **reference implementation of the reusable PHARMA_V1 sector workspace**, but not a TORNTPHARM-only permanent component tree.

It must be completed so that the reusable sector workspace contains:

1. Pharma model summary;
2. classification / evidence lock;
3. business-model & exposure architecture;
4. Gate G methodology design;
5. G1–G4 shared Pharma contracts;
6. G5.1–G5.7 shared parent-dimension frameworks;
7. role-selected G6 methodology contracts;
8. G7 overlay / governance / adapter contracts;
9. explainable read-only preview state where legitimate;
10. portability / isolation state;
11. activation-readiness & authority;
12. canonical assignment state;
13. evidence operations & review controls;
14. research gaps / unresolved methodology state.

Company-specific evidence/source/ingestion tooling may remain company-scoped inside the sector workspace, but the surrounding component architecture must be reusable.

### G9.3-D — Replicate the completed PHARMA_V1 workspace to AUROPHARMA through contracts, not copying

After the reusable Pharma workspace is complete, AUROPHARMA must consume the **same PHARMA_V1 workspace component architecture**.

No visual shell redesign is required.

The same modules must resolve different content according to the company + active reviewed assignment + role.

Examples:

- GLOBAL_GENERICS
  - TORNTPHARM: Material Overlay;
  - AUROPHARMA: Primary.
- DOMESTIC_FORMULATIONS
  - TORNTPHARM: Primary;
  - AUROPHARMA: not active.
- API_BULK_DRUGS
  - AUROPHARMA: Emerging;
  - excluded from score/readiness denominator.
- CDMO_CRAMS
  - TORNTPHARM: Emerging;
  - excluded from score/readiness denominator.
- BIOPHARMA_BIOSIMILARS
  - AUROPHARMA: unresolved / REVIEW_REQUIRED;
  - no active reviewed authority.

### G9.3-E — No methodology loss

G9.3 must explicitly preserve the entire validated methodology chain already built through G6.45.

The reusable workspace must not hide or discard:

- Gate G;
- G1–G4;
- G5.1–G5.7;
- G6.1–G6.45;
- G7-P1 / G7-P2 / G7.1 / G7.2 / G7.3.

Where a contract is not applicable to the selected company/role, the UI/model must state the correct applicability state rather than silently omit it or manufacture a neutral value.

### G9.3-F — Shared shell / sector workspace boundary regression

G9.3 must prove two different standardizations at once.

**Standardization A — all-stock Research shell**

The Research shell remains common across BANK_NBFC, PHARMA_V1 and future profiles.

**Standardization B — PHARMA_V1 sector workspace**

All Pharma securities use the same Pharma sector-workspace architecture while business-model roles, evidence, applicability, readiness and methodology outcomes differ by company.

The regression suite must reject:

- a separate TORNTPHARM Research page;
- a separate AUROPHARMA Research page;
- duplicated permanent stock-specific component trees;
- new symbol-driven layout branching;
- BANK_NBFC metrics/methodology leaking into Pharma;
- Domestic Formulations methodology leaking into AUROPHARMA Global Generics Primary;
- Global Generics Primary semantics leaking into TORNTPHARM Material Overlay interpretation;
- Emerging exposure entering score/readiness denominators;
- unresolved Biosimilars becoming active authority.

### G9.3-G — Standing two-company validation

G9.3 must prove:

- TORNTPHARM remains Domestic Primary;
- TORNTPHARM Global Generics remains Material Overlay;
- TORNTPHARM CDMO remains Emerging;
- AUROPHARMA remains Global Generics Primary;
- AUROPHARMA API remains Emerging;
- AUROPHARMA has no reviewed Material Overlay;
- AUROPHARMA Biosimilars remains unresolved;
- raw evidence remains security/company scoped;
- assignment interpretation remains company + active assignment + role scoped;
- the same reusable Pharma workspace consumes both companies;
- score availability may legitimately differ;
- no recommendation or sizing activation occurs from workspace completion;
- no production persistence is implied.

### Presentation rule for G9.3

G9.3 is **not a visual redesign stage**.

The current restored page designs are the visual baseline.

Implementation should:

- preserve the shared R4M Research shell;
- preserve the established Pharma deep-research visual language;
- add missing reusable Pharma modules/features;
- avoid moving or removing established sections unless necessary for correctness;
- use collapsible depth where needed to control page length;
- require owner screenshot approval before full validation.
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


## G9 closure record — 20 September 2026

G9 is **COMPLETE**.

Final state:

> **G9 = COMPLETE / PHARMA RESEARCH ACTIVATION ARCHITECTURE VALIDATED / NUMERIC ACTIVATION STILL FAIL-CLOSED WHERE METHODOLOGY IS INCOMPLETE**

Closure evidence:

- G9.1 activation-readiness & authority completed;
- G9.2 AUROPHARMA canonical local research activation completed;
- G9.3 reusable PHARMA_V1 sector-workspace portability completed across TORNTPHARM and AUROPHARMA;
- owner visual approval completed for both G9.3 reference-company checkpoints;
- final local cross-company validation passed:
  - `npm run typecheck`
  - `npm test`
  - `npm run test:edge`
  - `npm run check:architecture`
  - `npm run lint:architecture`
  - `npm run build`
  - `git diff --check`

G9 closure does **not** authorize or imply:

- production assignment changes;
- production evidence writes;
- numeric Pharma scoring activation or persistence;
- recommendation activation or persistence;
- position-sizing activation or persistence;
- provider refresh;
- scheduler changes;
- deployment;
- PR merge;
- automatic trading.

PR #101 remains OPEN / DRAFT / UNMERGED.

There is **no G9.4**.
