# PortfolioAI — G7.2 TORNTPHARM Explainable Read-only Preview V1

**Status:** PROPOSAL ONLY / OWNER VALIDATION REQUIRED  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Prerequisite:** G7.1 validated  
**Persistence:** NONE

## Purpose

G7.2 wires the reviewed TORNTPHARM Pharma architecture into the validated G7.1 read-only dimension adapter.

It deliberately shows the true current state rather than manufacturing a complete score.

## Reviewed architecture preserved

- Primary: `DOMESTIC_FORMULATIONS`
- Material Overlay: `GLOBAL_GENERICS`
- Emerging Watch: `CDMO_CRAMS`

The builder throws if those reviewed roles are not present.

## Dimension execution

All ten weighted PHARMA_V1 dimensions are passed through the G7.1 **dimension** adapter.

For each dimension G7.2 exposes:

- Primary evidence verified / total;
- methodology state;
- calculation state;
- Primary numeric score if available;
- Material Overlay readiness/effect if eligible;
- final numeric score if available;
- reason codes;
- methodology lineage.

## Why many rows are expected to remain unavailable

The current foreground Research model contains evidence and validated methodology contracts, but several curve artifacts are methodology definitions rather than executable dimension-score outputs.

G7.2 therefore does not duplicate curve mathematics inside the UI.

Evidence coverage alone cannot become a score.

A dimension needs a versioned numeric dimension-score output before G7.1 can emit a final number.

## Material Overlay behavior

For Global Generics, the preview identifies overlay-eligible dimensions from the existing methodology boundary.

Even when overlay evidence is READY, G7.2 does not invent:

- reviewed economic materiality percentage;
- normalized overlay signal;
- numeric modifier.

If the G7-P1 modifier inputs are not canonically resolved in the runtime model, overlay effect remains unavailable rather than neutral.

## Governance runtime boundary

TORNTPHARM has reviewed site-specific regulatory event evidence, including the historical Indrad warning-letter/closeout chain.

However, the foreground runtime model does not currently provide one canonical G4 input containing all required severity/materiality/remediation fields.

G7.2 therefore does **not** assume `CLEAR`.

It records:

`governanceRuntimeInputResolved = false`

and keeps the overall preview non-computable.

This avoids fabricating governance state.

## Overall result

Until every weighted dimension has a valid numeric final score **and** canonical governance runtime input is resolved:

> **Overall Pharma score: Not currently computable**

No hidden reweighting occurs.

No partial set of dimensions is scaled back to 100%.

## Safety

- score execution: **NO**
- persisted score run: **NO**
- recommendation change: **NO**
- position sizing: **NO**
- database write: **NO**
- evidence write: **NO**
- provider call: **NO**
- deployment: **NO**
- PR merge: **NO**

## Validation required

1. visually inspect the G7.2 TORNTPHARM preview;
2. focused Vitest for `pharmaTorntpharmG7ExplainablePreview.test.ts`;
3. focused Vitest for the G7.1 adapter;
4. focused ESLint;
5. `npm run typecheck`;
6. `npm run build`.

Only after owner validation should G7.3 begin.
