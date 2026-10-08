# Stock Research Page Changes — Stage 1 Contract

**Date:** 8 October 2026 (UTC)
**Status:** Stage 1 specification complete; implementation verification pending.
**Scope:** Confirm the contracts for the six-stage page-change plan. This is not completion of taxonomy remediation C1 or C8, approval of changed company assignments, or a deployment.

## Authority and boundaries

Apply the [permanent classification/remediation plan](PortfolioAI_PERMANENT_CANONICAL_CLASSIFICATION_AND_TAXONOMY_REMEDIATION_PLAN_2026-10-01.md), especially C1 and C8, the [Research and Intelligence Architecture](PortfolioAI_Research_and_Intelligence_Architecture.md), the [Single Source of Truth Architecture](PortfolioAI_Single_Source_of_Truth_Architecture.md), and the [stock-page design plan](PortfolioAI_STOCK_RESEARCH_PAGE_DESIGN_PLAN_2026-10-06.md). This contract elaborates those rules; it creates no parallel taxonomy, mapping authority or scoring rule.

## 1.1 Official classification contract

| Level | Research-page role | Required semantics |
|---|---|---|
| Macro-Economic Sector | Broad contextual metadata | Official node identity and taxonomy version; never a methodology selector. |
| Sector | Context and portfolio grouping | Validated parentage; no sector-only methodology selection. |
| Industry | Primary framework selector and leading classification label | Exact versioned node mapping; display labels and ticker names cannot route. |
| Basic Industry | Further economic refinement | Required when the approved mapping needs it; missing required refinement blocks a new qualified assignment. |

Each supplied level must retain its node identity, label, source/version and effective-date context through the canonical projection. Parent-child validity is checked by the classification authority, not a page component. Missing levels stay unavailable. Aliases may normalize spelling only through approved equivalence; they cannot move a node between levels or repair contradictory parentage. Official classifications and analytical profiles are separate namespaces.

## 1.2 Analytical assignment contract

One approved canonical assignment identifies the security, methodology/profile, required primary subprofile, assignment identity/version/authority, methodology authority/version, effective date and applicable snapshot lineage. Business-model evidence and reviewer provenance must be retained where required by the approved contract. Secondary exposures are distinct from the primary assignment and do not activate extra scoring contracts by themselves.

The header, framework summary, tabs, specialist panels, evidence readiness and eligible R6/R7 outputs must consume this same effective assignment. The presentation registry only formats the selected contract. It cannot classify, score, promote provisional records or prefer an empty legacy assignment over a resolved canonical one.

Owner Core/Satellite role is separate from both classification and PortfolioAI's qualified role recommendation. Evidence readiness, engine availability, assessment and advisory state remain independently supplied facts.

## 1.3 Selection and revalidation rules

1. Resolve the security and official classification at the relevant taxonomy version/date.
2. Start candidate framework selection from the exact Industry node mapping.
3. Apply Basic Industry and reviewed business-model refinement where the approved mapping requires them. Industry alone cannot force a framework for a heterogeneous business group.
4. Select only a unique eligible, approved assignment with reproducible mapping and methodology lineage. Missing mappings do not imply GENERAL or another sector's framework.
5. For an existing approved assignment, retain its identity and history. A classification correction initiates revalidation; it does not silently reroute the stock. Record unchanged or proposed changed dispositions with reasons and evidence.
6. Append approved superseding assignments rather than overwrite history. Changed methodology/subprofile assignments remain subject to C8's owner checkpoint C-D.

Sector display-label changes cannot select a method. Healthcare Services and Equipment/Supplies cannot inherit Pharmaceuticals research merely through shared sector context. Banks, lenders, AMCs, insurers, brokers and fintech must use their approved business-specific contracts.

## 1.4 Unresolved and conflicting states

These are semantic requirements, not new database enums. Existing canonical state vocabularies must be adapted once in the shared projection, with their original reason and provenance retained.

| Condition | Display and execution rule |
|---|---|
| Required classification missing or invalid parentage | Show unavailable/review-required classification; no guessed new assignment or dependent analytical action. |
| Required primary business model missing, provisional, disputed or conflicting | Show assignment review/blocker explicitly; no generic parent checklist presented as specialised coverage. |
| Unique active approved assignment | Display its canonical resolved state; resolution alone does not establish classification verification, evidence sufficiency or a recommendation. |
| Resolved prior assignment with classification under review | Preserve assignment/history and expose the classification review separately. Do not claim revalidation passed; dependent new execution remains subject to canonical eligibility safeguards. |
| Canonical projection unavailable/error | Show unavailable/loading/error; do not substitute a legacy route as an approved assignment. |
| Optional refinement not applicable | Show not applicable, distinguishable from required-but-missing. |
| Valid methodology but insufficient evidence or missing engine | Show the valid framework and retained evidence with their actual readiness/capability limits; no invented score or advice. |

## Stage 1 acceptance cases handed to Stage 2

| ID | Required deterministic proof |
|---|---|
| S1-A | Four official levels remain distinct from methodology/subprofile; node versions and invalid parentage are preserved. |
| S1-B | Same-sector stocks with different Industry mappings retain distinct approved frameworks. Sector-label changes alone cannot change routing. |
| S1-C | A heterogeneous Industry requires its approved Basic Industry/business-model refinement; absent or ambiguous refinement fails closed. |
| S1-D | Header, summary, tabs, deep panel and readiness agree on assignment identity/version; an empty legacy read cannot contradict resolution. |
| S1-E | All five Pharma codes resolve to their own approved requirements: API_BULK_DRUGS, DOMESTIC_FORMULATIONS, GLOBAL_GENERICS, BIOPHARMA_BIOSIMILARS and CDMO_CRAMS. Secondary exposures are not additional primary assignments. |
| S1-F | Missing, provisional, disputed, conflicting, retired and out-of-date required assignments preserve approved effective-date/review semantics. |
| S1-G | A known classification conflict such as SKYGOLD remains distinguishable from its research assignment; no display-only correction or silent reassignment. |
| S1-H | Correct prior P7 assignments are retained by reference; proposed changes have explicit evidence, lineage and required review. |
| S1-I | Assignment resolution cannot promote evidence readiness, engine availability, scores, Core/Satellite suggestions or downstream advice. Ordinary browsing remains read-only. |

## Existing implementation observations and handoff

Repository inspection confirms `ResearchAssignmentSummary.tsx` already distinguishes assignment lineage from classification, but its unavailable-level disclosure still combines official and non-official terms. `scoringTypes.ts` exposes canonical route identity and independent route state. `pharmaSubprofileAssignment.ts` defines all five Pharma codes and blocks missing/provisional/disputed/conflicting assignments using reviewed effective-date semantics. These semantics must be preserved.

`researchProfileRouting.ts` still exposes compatibility bases including SECTOR_AND_INDUSTRY and REVIEWED_SECTOR_ONLY and takes display-string inputs. Their existence is not evidence that they select the current page's final assignment. Stage 2 must trace callers and distinguish legacy compatibility from authoritative routes before changing consumers; the target contract prohibits sector-only or display-label assignment creation.

The [hosted display review](PortfolioAI_PHARMA_AND_SECTOR_DISPLAY_REVIEW_2026-10-08.md) records contradictory Pharma legacy reads and incomplete classification projection. Those findings remain open. Stage 2 must identify the approved shared access path for each missing field and implement/test the common assignment projection without creating page-local queries or a competing router.

**Decision:** Stage 1's four specification sub-stages are complete and provide the implementation contract. S1-A through S1-I are required verification cases, not claimed passing tests. Full C1 taxonomy acceptance and C8's portfolio-wide reassignment campaign retain their original gates and owner checkpoints. No application code, database, assignments, provider calls or deployment changed in Stage 1.
