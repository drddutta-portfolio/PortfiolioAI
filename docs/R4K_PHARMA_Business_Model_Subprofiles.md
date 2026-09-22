# R4K — Pharma Business-Model Subprofiles

Status: **PROFILE CONTRACT IMPLEMENTATION / NO PRODUCTION ACTIVATION**

## Purpose

PHARMA_V1 remains the parent research methodology for securities whose canonical application sector is exactly `Pharma`. R4K adds a business-model layer so unlike pharmaceutical businesses are not evaluated as though their operating economics and risks were identical.

The application-facing sector is **not changed**. All five contracts below remain children of the single canonical sector `Pharma`.

## Five subprofiles

1. `API_BULK_DRUGS` — API / Bulk Drug Manufacturers
2. `DOMESTIC_FORMULATIONS` — Domestic Formulations / Branded Generics
3. `GLOBAL_GENERICS_EXPORT` — Global Generics / Export-Oriented
4. `BIOPHARMA_BIOSIMILARS` — Biopharmaceuticals & Biosimilars
5. `CDMO_CRAMS` — CDMO / CRAMS

Examples discussed during design are illustrative only. Tickers/company names are **not** hard-coded routing rules.

## Shared PHARMA_V1 core

Every subtype retains the same parent foundation:

- revenue-growth history;
- operating-margin history;
- ROCE history;
- PAT/EPS history;
- cash conversion;
- balance-sheet/leverage;
- ownership/governance;
- valuation context.

The subprofile changes which additional evidence becomes mandatory, important or supplementary. It does not replace the parent financial core.

## Subtype emphasis

### API / Bulk Drugs

Adds explicit emphasis on raw-material/input-cost sensitivity, customer concentration, capacity utilization, backward integration, export exposure and relevant manufacturing/regulatory risk.

### Domestic Formulations

Makes domestic revenue growth and therapy mix central, with chronic/acute mix, brand franchise, R&D and launch evidence as important durability inputs. Export/US and site-regulatory evidence remain supplementary/conditional unless material exposure activates them.

### Global Generics / Export

Makes regulated-market/export growth, manufacturing-site regulatory evidence, filing/approval/launch pipeline and price erosion central. Geography concentration is assessed separately from growth.

### Biopharma / Biosimilars

Makes R&D, pipeline, regulatory/clinical milestones and site status central. Molecule concentration and specialized manufacturing scale are explicit risk/durability inputs.

### CDMO / CRAMS

Makes customer concentration, order/program visibility and capacity utilization mandatory. Client retention/program progression and capex-return efficiency are important supporting metrics.

## Routing rule

R4K deliberately fails closed.

A security reaches one of these subprofiles only through an explicit **reviewed business-model assignment**. The router does not accept ticker/name heuristics, page-local maps or company-name inference.

If canonical sector is `Pharma` but no reviewed subtype exists:

`PHARMA_V1 parent applies → subtype = REVIEW_REQUIRED`

This allows research to continue safely against the common parent contract while preventing a false subtype-specific score.

## Hybrid companies

R4K V1 models one reviewed primary subprofile. Material secondary activities are handled through parent conditional metrics/overlays. A future reviewed many-to-many exposure model may represent hybrid weights, but R4K does not invent exposure percentages.

## Scoring boundary

R4K defines research/evidence contracts only. It does not approve numeric subtype scoring curves. `scoreCurveVersion` remains null for new subtype metrics until threshold/normalization research is separately reviewed.

## Safety

Repository-only:

- no production schema/data change;
- no provider call;
- no automatic subtype assignment;
- no score/recommendation/position-sizing write;
- no scheduler change.

The branch targets `pharma-research-integration`, not `main`.
