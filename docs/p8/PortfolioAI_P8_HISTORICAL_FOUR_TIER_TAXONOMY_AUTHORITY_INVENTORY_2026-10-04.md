# PortfolioAI P8 Historical Four-Tier Taxonomy Authority Inventory and Gap Assessment

Date: 4 October 2026  
Environment: Development only

## Result

The required four-tier **field model exists**, but a complete materialized historical mapping authority does not.

### Existing authority surfaces

1. `scripts/k1-fetch-nse-primary-classification.mjs` explicitly normalizes NSE official quote classification into:
   `macroEconomicSector → sector → industry → basicIndustry`.
   This proves the intended official hierarchy and source field contract. No already-preserved historical K1 four-level snapshot was found in the repository or current R2 inventory during this task.

2. Development database taxonomy objects are partial. Read-only inspection found:
   - 2 active taxonomy rows, both declaring only `SECTOR, INDUSTRY`;
   - 8 sector rows;
   - 9 industry rows;
   - 9 verified source mappings.
   They do not contain Macro-Economic Sector or Basic Industry nodes.

3. `PORTFOLIOAI_GATE_K_INDUSTRY_RESEARCH_TAXONOMY_V1` is an analytical routing authority. Its own invariant says Industry is the methodology selector and Basic Industry is business-model refinement. It is not a complete exchange economic taxonomy.

4. The frozen P8 semantic canary already proves that historical official XML contains meaningful business descriptions. Therefore the current blocker is primarily **mapping authority absent**, not semantic evidence absent.

## Historical-version limitation

A retrospective algorithm can legitimately be newer than the historical decision if it only consumes company evidence available before that decision. However, the repository does not currently freeze whether a later NSE taxonomy vocabulary may be used retrospectively or whether each simulated date requires a contemporaneous taxonomy version. That is an owner-controlled policy decision and is not invented here.

## Existing exact authority vs proposed mapping

Exact matches to already materialized Sector/Industry labels may be recorded as **partial proof**. They cannot fill Macro-Economic Sector or Basic Industry.

Semantic phrases that require a synonym or business interpretation remain conditional. For example, `Hospital Business → Healthcare/Hospitals` is plausible and route-compatible, but is not currently an adopted canonical mapping rule.

The attached machine-readable candidate records the exact owner decisions required before such mappings can become authoritative.
