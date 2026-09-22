# PortfolioAI — Gate H H2 Owner-Approved Domestic Formulations Peer Set

**Date:** 20 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Status:** OWNER-APPROVED H2 READ-ONLY COHORT / NO CANONICAL ASSIGNMENT WRITE

## Target

`TORNTPHARM`

## Owner-approved minimum peer cohort

| Peer | H2 Primary | Confidence | Secondary context |
|---|---|---|---|
| MANKIND | DOMESTIC_FORMULATIONS | HIGH | no H2 material secondary exposure required for peer eligibility |
| ERIS | DOMESTIC_FORMULATIONS | HIGH | no H2 material secondary exposure required for peer eligibility |
| EMCURE | DOMESTIC_FORMULATIONS | MEDIUM | material international / Global Generics exposure retained |

## Contract alignment

- target excluded from own cohort;
- same reviewed business-model identity required;
- minimum peer count = 3;
- preferred peer count = 5;
- aggregation = MEDIAN;
- PE_TTM and EV_EBITDA both mandatory;
- single-metric fallback prohibited;
- broad Pharma-sector substitution prohibited;
- provider peer labels non-authoritative.

## Persistence boundary

The owner approval applies to the H2 TORNTPHARM valuation work only.

It does not persist or activate canonical `research_subprofile_assignments` rows.

It does not authorize production mutation.

## Next evidence check

Before requesting any additional provider calls, run:

`bash scripts/h2-local-valuation-evidence-audit.sh`

The audit is read-only and reports:

- whether TORNTPHARM / MANKIND / ERIS / EMCURE exist in local securities;
- latest local PE_TTM;
- latest local EV_EBITDA;
- latest TORNTPHARM PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT;
- local freshness;
- whether each peer metric family already meets the minimum 3-peer requirement.

No provider call or write is made by the audit.
