# PortfolioAI P8 Historical Classification / Methodology Route / Metric Contract Resolution Candidate

Date: 4 October 2026  
Environment: Development only  
Status: **CANDIDATE / PENDING OWNER APPROVAL**  
Contract version: `P8_HISTORICAL_CONTRACT_RESOLUTION_CANDIDATE_V1`  
Frozen candidate Git blob SHA: `f459a4bd01ff8d25bcabbcef2195249553ddeb87`

## Purpose

This candidate freezes the rules used by the authorized contract-resolution audit **before** the final coverage census. It is not an experiment freeze and does not modify live R6–R10 methodology.

## Historical classification

The historical analytical hierarchy is `Macro-Economic Sector → Sector → Industry → Basic Industry`. Classification must derive solely from official evidence available strictly before the decision instant.

Evidence priority is audited consolidated annual segment evidence, then semantically valid consolidated quarterly evidence, contemporaneous annual-report business description, RHP/information memorandum for newly listed companies, and official merger/demerger/material-business-change evidence.

A dominant segment may determine classification only when its business meaning is proven and it contributes more than 50% of eligible segment revenue. `DIVERSIFIED` requires semantically identified multiple businesses with no qualifying segment above 50%. Positional XBRL members such as `FourReportableSegmentRevenue01Member` are not a business classification.

Current classifications/manual assignments are never backdated. Revisions apply only from their own dissemination timestamps. Overlapping contradictory classifications fail closed.

## Methodology routing

The audit reuses the existing `RESEARCH_PROFILE_ROUTING_V2`, Gate-K sector-engine registry and P7-IC methodology registry. No parallel taxonomy or methodology family is created.

A pair must supply proven Sector + Industry values and resolve to exactly one existing profile with a registered non-pending methodology authority. Sector-only, nearest-profile and ticker-specific fallbacks are forbidden.

The frozen retrospective methodology may be applied to earlier historical company evidence; only the company facts themselves must have been point-in-time available.

## Metric input contract

The frozen candidate captures **47 existing profiles**, **26 methodology families** and **471 required signals** from the current P7-IC registry. **209** required signals carry evidence-code + minimum-period + freshness metadata directly in that registry; **262** depend on profile-specific scoring authorities for at least part of those details.

PortfolioAI Dev contains **47 active canonical fundamental metric definitions** at audit start. These provide useful canonical units, statement scope, freshness and semantic guards for covered metrics. They do **not** establish a universal raw-XBRL normalization mapping for all 471 route signals.

A valid historical input must preserve identity, source/hash, dissemination timestamp, period, statement scope, raw concept/value/unit/scale/currency and transformation version. Consolidated audited annual evidence is preferred, followed by valid consolidated quarterly evidence. Standalone evidence is permitted only when the canonical metric contract explicitly allows it or consolidated reporting is genuinely inapplicable.

Raw XBRL fact presence is not metric completeness. If the existing contracts do not define an exact source-concept/unit/period/derivation mapping for the available historical evidence, the required result is `METRIC_NORMALIZATION_CONTRACT_UNRESOLVED`.

A complete input snapshot requires proven classification, exactly one methodology route and every mandatory route input valid/fresh with required history. It does **not** require a positive R7/R8/R9/R10 investment recommendation.

## Governance

The proposed research standards—at least 24 dates, 80% overall replay-ready coverage, 70% on each retained date and 60% per major methodology sector—remain audit criteria only. They are not owner-frozen by this contract candidate.

Owner approval is required before authoritative adoption or any new experiment freeze.
