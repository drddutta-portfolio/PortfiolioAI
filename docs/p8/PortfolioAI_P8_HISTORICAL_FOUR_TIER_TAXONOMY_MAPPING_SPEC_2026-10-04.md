# PortfolioAI P8 Historical Four-Tier Taxonomy Mapping Specification

Date: 4 October 2026  
Candidate: `P8_HISTORICAL_FOUR_TIER_TAXONOMY_MAPPING_CANDIDATE_V1`  
Status: **Frozen candidate / pending owner adoption**

## Purpose

Provide a deterministic, reviewable bridge from point-in-time official business evidence to the required economic hierarchy:

`Macro-Economic Sector → Sector → Industry → Basic Industry`

and only after complete authoritative classification, to exactly one existing PortfolioAI methodology route.

## Authority rules

- Historical company evidence must have been officially disseminated before the simulated decision.
- The mapping algorithm may be defined later, but its vocabulary/version must be disclosed.
- Exact matches to already materialized Development Sector/Industry authority may prove only those levels.
- Gate-K labels may confirm analytical route compatibility; they do not substitute for missing economic hierarchy levels.
- Positional XBRL members, company names, current assignments, portfolio membership, survival and model knowledge are prohibited classification proof.
- Broad labels such as `Pharma`, `Chemicals`, or `DIVERSIFIED` never imply child hierarchy levels.
- Missing Macro-Economic Sector or Basic Industry remains null/blocked.
- Conditional synonym proposals never count as authoritative proof until owner-approved in a versioned mapping catalog.
- Multi-business dominance and diversified treatment remain owner-controlled policies.

## Proof states

- `AUTHORITATIVE_EXACT_PARTIAL`: one or more levels exactly supported by existing canonical authority.
- `AUTHORITATIVE_COMPLETE`: all four levels have canonical IDs under an adopted authority.
- `CONDITIONAL_PENDING_OWNER`: mapping requires an unapproved synonym/policy.
- `AMBIGUOUS`: source semantics conflict or are too broad.
- `UNSUPPORTED`: no canonical mapping exists.
- `BLOCKED_MISSING_LEVELS`: partial proof exists but required hierarchy levels are absent.

A methodology route is authoritative only after complete four-tier classification. A unique Gate-K route found from partial Sector+Industry proof is reported only as `ROUTE_CANDIDATE_FROM_PARTIAL`.

## Owner-controlled decisions

The candidate intentionally does not decide: retrospective taxonomy-version policy, semantic synonym catalog adoption, dominant-business inference, or diversified-company analytical treatment. These remain in the owner decision package.

## Expansion gate

The prior frozen canary gate is preserved. Full 25,761-pair processing is permitted only after an adopted mapping authority exists and the canary contains at least one complete classification and one exact existing methodology route from that complete classification.
