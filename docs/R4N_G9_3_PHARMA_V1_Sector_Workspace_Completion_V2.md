# R4N — G9.3 PHARMA_V1 Sector Workspace Completion V2

**Status:** ACTIVE IMPLEMENTATION PLAN — NO UI REDESIGN  
**Branch:** `r4n-pharma-subprofile-architecture`  
**PR:** #101 — OPEN / DRAFT / UNMERGED  
**Supersedes:** `R4N_G9_3_Reciprocal_PHARMA_V1_Normalization_V1.md`

## Purpose

Complete one reusable PHARMA_V1 sector workspace while preserving the frozen PortfolioAI Research shell and the restored pre-G9.3 visual designs.

G9.3 V2 is an additive capability-completion stage, not a page redesign.

## Product architecture

PortfolioAI has two UI standardization layers.

### Layer 1 — universal Research shell

Every security uses the same PortfolioAI Research page and interaction grammar.

The shared shell owns:

- header and classification;
- company summary;
- portfolio / price summary;
- Decision Workspace;
- PortfolioAI Suggestion;
- AI Interpretation;
- Key Insights;
- Research Refresh;
- common tabs;
- Research at a glance;
- score / heatmap / external ratings / readiness shells;
- Documents / Evidence interaction patterns.

This is the frozen R4M rule.

### Layer 2 — sector/profile workspace

A sector/profile supplies its own research extension inside the shared shell.

For Pharma, that extension is the PHARMA_V1 Pharmaceuticals deep research workspace.

All Pharma securities must consume the same sector-workspace architecture while company-specific roles, evidence, applicability, methodology state and readiness differ.

## Reference companies

### TORNTPHARM

- Primary: DOMESTIC_FORMULATIONS
- Material Overlay: GLOBAL_GENERICS
- Emerging: CDMO_CRAMS

### AUROPHARMA

- Primary: GLOBAL_GENERICS
- Material Overlay: none
- Emerging: API_BULK_DRUGS
- Unresolved: BIOPHARMA_BIOSIMILARS

## G9.3-A — Reciprocal capability inventory

The current Pharma capabilities are split across the two reference stocks.

### From TORNTPHARM

Reusable methodology and deep-research capabilities:

- Pharma model summary;
- Gate G;
- G1 adaptive classification;
- G2 overlay methodology;
- G3 readiness;
- G4 governance/regulatory treatment;
- G5.1–G5.7 parent dimension frameworks;
- G6.1–G6.45 methodology and applicability outcomes;
- G7-P1 / G7-P2;
- G7.1 read-only adapter;
- G7.2 explainable read-only preview;
- G7.3 validation and research-gap register;
- evidence/source/document/ingestion controls.

### From AUROPHARMA

Reusable portability and activation capabilities represented by:

- G8.1 classification & evidence lock;
- G8.2 three-layer same-engine preview;
- G8.3 portability/isolation/leakage validation;
- G9.1 activation-readiness & authority;
- G9.2 canonical assignment state.

## G9.3-B — Generalize AUROPHARMA gate capabilities

Do not copy AUROPHARMA-labelled cards verbatim into TORNTPHARM.

Instead, generalize the capabilities into reusable PHARMA_V1 modules:

1. Classification & evidence lock
2. Three-layer business-model architecture
3. Portability / isolation checkpoint
4. Activation-readiness & authority
5. Canonical assignment state

Each module must render from the selected company's canonical assignment and evidence state.

## G9.3-C — Complete the Pharma Deep Research workspace

The current TORNTPHARM Pharmaceuticals deep research workspace is the visual/reference implementation.

Complete it by adding the reusable modules above while preserving the existing methodology stack.

The finished reusable sector workspace should contain:

1. Pharma model summary
2. Classification & evidence lock
3. Business-model & exposure architecture
4. Gate G methodology
5. G1–G4 shared contracts
6. G5.1–G5.7 parent frameworks
7. role-selected G6 contracts
8. G7 overlay/governance/adapter contracts
9. explainable read-only preview state
10. portability / isolation state
11. activation-readiness & authority
12. canonical assignment state
13. evidence operations & review controls
14. unresolved methodology / research gaps

No validated Gate G–G7 methodology may be removed or hidden as obsolete history.

## G9.3-D — Apply the completed sector workspace to AUROPHARMA

AUROPHARMA then consumes the same PHARMA_V1 workspace component architecture.

The workspace must dynamically adapt by role:

- Global Generics is Primary for AUROPHARMA but Material Overlay for TORNTPHARM;
- Domestic Formulations is Primary only for TORNTPHARM;
- API/Bulk Drugs is Emerging for AUROPHARMA;
- CDMO/CRAMS is Emerging for TORNTPHARM;
- Biosimilars remains unresolved for AUROPHARMA.

No company may inherit another company's evidence or role state.

## G9.3-E — Methodology preservation

The entire validated methodology chain remains live research architecture:

- Gate G;
- G1–G4;
- G5.1–G5.7;
- G6.1–G6.45;
- G7-P1 / G7-P2 / G7.1 / G7.2 / G7.3.

Where a methodology is not engaged for a company/role, use an explicit applicability state.

Never replace absence/non-engagement with zero, neutral, default or hidden reweighting.

## G9.3-F — Regression requirements

Must prove:

- one shared Research shell remains intact;
- one reusable PHARMA_V1 sector workspace is consumed by both stocks;
- no permanent symbol-specific component tree is introduced;
- TORNTPHARM remains Domestic Primary;
- TORNTPHARM Global Generics remains Material;
- TORNTPHARM CDMO remains Emerging;
- AUROPHARMA remains Global Generics Primary;
- AUROPHARMA API remains Emerging;
- AUROPHARMA has no Material Overlay;
- AUROPHARMA Biosimilars remains unresolved;
- raw evidence remains security/company scoped;
- assignments remain security scoped;
- interpretation remains company + assignment + role scoped;
- Emerging exposures remain excluded from score/readiness denominators;
- no BANK_NBFC methodology leaks into Pharma;
- no Domestic methodology leaks into AUROPHARMA Global Generics Primary;
- Global Generics role interpretation differs correctly between Primary and Material Overlay;
- no score/recommendation/sizing activation occurs from workspace completion.

## UI rule

No visual redesign in G9.3 V2.

The restored pre-G9.3 designs are the visual baseline.

Allowed:

- add missing reusable Pharma modules;
- generalize company-specific capability cards into profile-level components;
- add collapsible sections to manage depth;
- preserve all established content.

Not allowed:

- replace the shared Research shell;
- remove TORNTPHARM methodology sections;
- flatten both pages into a new simplified layout;
- create separate permanent TORNTPHARM and AUROPHARMA mini-applications;
- change recommendation or sizing behavior.

## Workflow

For each implementation checkpoint:

```text
GitHub R4N branch
        ↓
Develop / update code
        ↓
Update cumulative handoff
        ↓
git pull
        ↓
Local Supabase + Local Vite
        ↓
localhost visual review
        ↓
owner approval
        ↓
full local validation
        ↓
final handoff checkpoint
```

## Closure

G9.3 closes only after both reference stocks consume the reusable PHARMA_V1 sector workspace without data, methodology or role leakage and without changing the shared PortfolioAI shell.

Then G9 closes as:

> **G9 = COMPLETE / PHARMA RESEARCH ACTIVATION ARCHITECTURE VALIDATED / NUMERIC ACTIVATION STILL FAIL-CLOSED WHERE METHODOLOGY IS INCOMPLETE**

There is no G9.4.
