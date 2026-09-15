# R4N — PHARMA_V1 Business-Model Subprofile Architecture

**Status:** final architecture candidate; owner approval pending; documentation only
**Parent profile:** `PHARMA_V1`
**Reference security for the first subprofile:** TORNTPHARM
**Proposed subprofile:** `DOMESTIC_FORMULATIONS`
**Scope:** contract design only; no schema change, evidence ingestion, scoring curve, provider execution or production mutation is authorized.

## Decision

The supplied plan and matrix identify a real methodology gap. A single common Pharma contract is a sound parent, but it is not sufficient as the complete analytical contract for API manufacturers, domestic branded formulations, global generics, biosimilars and CDMO/CRAMS businesses.

## Canonical assignment lifecycle

The proposed stored enum is:

- `PROVISIONAL`: candidate assignment with retained evidence, not canonical for production methodology.
- `REVIEWED`: owner/authorized reviewer accepted the assignment.
- `DISPUTED`: conflicting evidence prevents deterministic use.
- `RETIRED`: historical assignment closed by a later effective version.

`CANDIDATE` is workflow language represented by `PROVISIONAL`; it is not a second stored state. `ACTIVE` is derived, not stored: a `REVIEWED` assignment is active when its effective interval contains the evaluation date and no disputed/replacement version supersedes it.

Allowed transitions are `PROVISIONAL -> REVIEWED`, `PROVISIONAL -> DISPUTED`, `REVIEWED -> DISPUTED`, and `PROVISIONAL|REVIEWED|DISPUTED -> RETIRED`. Corrections create a new version and retire the old version; they do not overwrite history.

TORNTPHARM remains `PROVISIONAL` until explicit owner approval.

PortfolioAI should retain one parent profile and add a separate subprofile axis:

```text
canonical application classification
  -> profile_code = PHARMA_V1
  -> subprofile_code = one approved Pharma business model
  -> common PHARMA_V1 evidence foundation
  -> subprofile applicability and evidence requirements
  -> universal overlays
  -> standardized investment dimensions
```

The five business-model codes must not replace `PHARMA_V1` as independent top-level `profile_code` values. They are children of the parent:

- `API_BULK_DRUGS`
- `DOMESTIC_FORMULATIONS`
- `GLOBAL_GENERICS`
- `BIOPHARMA_BIOSIMILARS`
- `CDMO_CRAMS`

Application sector, industry and market-cap classification remain owned by `current_security_enrichment_v1`. A research subprofile interprets the operating model; it never rewrites those application facts.

## Review of the supplied matrix

### Accepted

1. The common financial foundation—revenue, margin, ROCE, PAT/EPS, cash conversion, leverage, ownership/governance and valuation context—travels across all five models.
2. Items 7–11 require subprofile-specific applicability and requirement levels.
3. Customer concentration and capacity utilization are material for API and CDMO businesses.
4. Domestic formulations require explicit franchise evidence: field-force productivity, brand/therapy leadership, launch contribution and therapy mix.
5. Global generics require price/ASP evidence separate from volume or reported revenue growth.
6. Biosimilars require molecule/geography approval stages and patent/litigation timing rather than a generic pipeline count.
7. CDMO/CRAMS requires contract-revenue visibility, client concentration, capacity and service mix.
8. Numeric scoring remains unapproved and must stay fail-closed.

### Required revisions

1. **Use a parent/subprofile key.** The supplied implementation step proposing five new `profile_code` values would flatten the hierarchy and duplicate the parent contract.
2. **Separate dimensions from evidence requirements.** “Brand leadership,” “order book,” and “litigation timeline” are evidence contracts that feed common output dimensions. They are not automatically new score dimensions.
3. **Do not declare exposure-sensitive requirements permanently not applicable.** `DOMESTIC_FORMULATIONS` may default regulatory/export evidence to conditional, but material US/export manufacturing exposure must reactivate it. Applicability must be driven by reviewed exposure evidence, not the company name.
4. **Allow mixed-model classification.** Some issuers combine branded formulations, exports, APIs or CDMO operations. Store one reviewed primary subprofile plus optional secondary business-model exposures/overlays. Do not calculate multiple profile scores until methodology explicitly defines aggregation.
5. **Version assignments.** Subprofile assignment needs effective dates, reviewer/provenance, confidence and a version. Historical assignments must not be overwritten silently.
6. **Use disclosure-aware readiness.** MR counts, therapy market share, customer concentration, ASP erosion and order book may not be disclosed consistently. Missing undisclosed evidence remains unavailable; it must not become zero or an adverse score.
7. **Specify units and calculation ownership.** Each new metric requires period type, unit, minimum/preferred history, source contract, freshness, normalization owner and deterministic derivation rules before ingestion.
8. **Treat valuation as a method contract.** The common `VALUATION` dimension remains shared, while the selected methods and evidence vary by subprofile. No multiple receives a score until its comparison basis and curve are approved.

## Contract model

### Assignment contract

An implementation proposal should define, without yet migrating production:

```text
security_id
profile_code                 PHARMA_V1
subprofile_code
assignment_version
effective_from
effective_to                 nullable
assignment_state             REVIEWED | PROVISIONAL | DISPUTED
reviewed_by
reviewed_at
source_reference
reason_code
secondary_exposures          optional, non-scoring until approved
```

Secondary exposures must be typed child records, not opaque JSON:

```text
assignment_id
exposure_code
materiality                 IMMATERIAL | EMERGING | MATERIAL | DOMINANT | UNKNOWN
confidence                  LOW | MEDIUM | HIGH
assignment_state            PROVISIONAL | REVIEWED | DISPUTED | RETIRED
effective_from
effective_to                nullable
source_reference
reason_code
reviewed_by
reviewed_at
```

Only the reviewed primary subprofile anchors methodology. Secondary exposures can activate evidence requirements and risk overlays; they cannot generate or blend multiple scores until a mixed-model methodology is approved.

Assignment versions are immutable positive integers scoped to `security_id + profile_code`. Effective intervals may not overlap for two active reviewed primary assignments. Conflicts or an unknown subprofile fail closed to the parent profile and expose a review blocker.

The eventual canonical authority and shared repository path must be added to `src/contracts/canonicalDataAuthorities.ts` before or with implementation.

### Requirement contract

Each effective requirement is produced by deterministic composition:

```text
PHARMA_V1 parent requirement
  + subprofile override/addition
  + reviewed exposure condition
  + universal overlay requirement
  = effective security research contract
```

Every requirement must expose:

```text
requirement_code
metric_code or evidence_contract_code
profile_code
subprofile_code
applicability
requirement_level
condition_code
period_types
minimum_history
preferred_history
unit
normalization_method
calculation_owner
source_contract
freshness_policy
readiness_rule
score_curve_version          nullable until approved
reason_code_namespace
```

Composition must detect conflicts and fail closed. A subprofile may narrow or strengthen a parent rule only through an explicit versioned override.

## Subprofile contract revisions

### API_BULK_DRUGS

Keep the proposed additions, but distinguish customer concentration from molecule concentration and define capacity utilization at facility/product-line level where possible. Regulatory evidence is mandatory. Export geography is important. Valuation should permit a cycle-aware EV/EBITDA method, but no cycle adjustment or scoring curve is yet approved.

### DOMESTIC_FORMULATIONS

This is the first implementation target and the proposed primary subprofile for TORNTPHARM. Required additions:

- `PHARMA_DOMESTIC_REVENUE_HISTORY`
- `PHARMA_FIELD_FORCE_PRODUCTIVITY`
- `PHARMA_BRAND_THERAPY_LEADERSHIP`
- `PHARMA_NEW_LAUNCH_CONTRIBUTION`
- `PHARMA_CHRONIC_ACUTE_MIX`
- optional `PHARMA_INLICENSING_MA_EXECUTION`

Regulatory/site and export evidence should be `CONDITIONAL`, not permanently `NOT_APPLICABLE`. A reviewed materiality rule must determine activation. Field-force productivity must distinguish disclosed headcount from estimates; PortfolioAI must not infer MR counts. Third-party market-share data requires an approved licensing/source contract.

### GLOBAL_GENERICS

Keep regulatory/site, export/US revenue and pipeline evidence mandatory. Separate:

- reported US revenue growth;
- volume growth where disclosed;
- price/ASP erosion where disclosed;
- product-mix effects;
- complex/specialty-generics mix.

Do not derive ASP erosion as a residual unless the deterministic calculation and compatible inputs are approved.

### BIOPHARMA_BIOSIMILARS

Model pipeline evidence by molecule, geography and stage. Patent/exclusivity and litigation are dated event contracts with source provenance, not ordinary continuous metrics. Partner economics must distinguish upfront, milestone, royalty/revenue-share and commercialization responsibilities.

### CDMO_CRAMS

Keep the proposed contract-economics additions, but avoid assuming every issuer discloses a conventional order book or book-to-bill. The requirement should accept approved equivalents such as signed backlog, committed capacity, long-term contract coverage or management-disclosed revenue visibility. Gland Pharma and other hybrid issuers require reviewed classification rather than name-based assignment.

## TORNTPHARM pilot contract

For the first pilot, TORNTPHARM is reviewed against:

```text
profile_code: PHARMA_V1
primary_subprofile_code: DOMESTIC_FORMULATIONS
assignment_state: REVIEWED_CANDIDATE until owner approval
```

The existing 42-row manifest must first be treated as parent financial evidence and mapped against the effective `PHARMA_V1 + DOMESTIC_FORMULATIONS` contract. It must not be described as completing the subprofile unless the domestic-franchise requirements are also satisfied or explicitly unresolved.

The manifest review must classify every row as:

- parent requirement evidence;
- `DOMESTIC_FORMULATIONS` evidence;
- condition-activation evidence;
- contextual/non-readiness evidence;
- duplicate/conflicting evidence;
- unsupported for promotion.

Expected new gaps include field-force productivity, therapy/brand leadership, launch contribution, chronic/acute mix, and an explicit reviewed determination of export/regulatory materiality.

## Readiness and scoring boundary

The Research page continues to display one shared readiness shell. Its effective requirement list comes from the composed parent/subprofile contract.

- Parent mandatory gaps block parent readiness.
- Subprofile mandatory gaps block subprofile readiness.
- Conditional requirements count only when their reviewed condition is active.
- `NOT_APPLICABLE` requirements do not reduce readiness.
- Important gaps reduce coverage/confidence but do not masquerade as mandatory blockers.
- Supplementary gaps remain visible but non-blocking.
- Evidence readiness does not authorize a numeric score.

No Pharma score, recommendation, role suggestion or sizing range may be produced until separate methodology approval supplies versioned curves, weights, gates and regression cases.

### Exact readiness formulas

Let `E` be the effective requirements after parent/subprofile composition. Conditional requirements enter `E` only when a reviewed activation condition is `ACTIVE`; `NOT_APPLICABLE` requirements are excluded.

- `mandatory_readiness = ready mandatory requirements / active mandatory requirements`.
- `important_coverage = requirements with sufficient validated evidence / active important requirements`.
- `supplementary_coverage = requirements with sufficient validated evidence / active supplementary requirements`.
- `evidence_coverage = sum(validated_evidence_fraction for each requirement in E) / count(E)`, where each fraction is deterministically bounded from 0 to 1 by that requirement's readiness rule. No cross-requirement weights exist until explicitly approved.
- `score_readiness = score-ready scoring inputs / active scoring inputs`, calculated only by an approved versioned scoring contract. Until Pharma scoring methodology is approved, it is `0%`/not score-ready and never inferred from evidence readiness.

If a denominator is zero, the displayed state is `NOT_APPLICABLE`, not 0%. Mandatory readiness completion authorizes neither scoring nor recommendation.

## Acceptance gates

R4N architecture is ready for implementation only when the owner approves:

1. parent/subprofile terminology and codes;
2. assignment authority and versioning;
3. contract-composition precedence;
4. the revised five subprofile matrices;
5. the TORNTPHARM `DOMESTIC_FORMULATIONS` assignment;
6. materiality rules for conditional export/regulatory requirements;
7. source/licensing expectations for non-public franchise evidence;
8. explicit separation of evidence readiness from scoring readiness.
