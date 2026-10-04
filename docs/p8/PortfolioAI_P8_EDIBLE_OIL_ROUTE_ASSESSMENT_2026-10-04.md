# PortfolioAI P8 Edible Oil Existing-Route Assessment

Date: 4 October 2026

## Authoritative historical classification

The frozen canary proves:

`Fast Moving Consumer Goods (IN04) → Fast Moving Consumer Goods (IN0401) → Agricultural Food & other Products (IN040101) → Edible Oil (IN040101001)`

This is an exact official Basic-Industry classification under approved OD1/V3 evidence.

## Application taxonomy

Development has no active application sector/industry pair that exactly represents this official path.

The existing active application taxonomy includes Banking, Cement and Construction, Healthcare, Metals & Mining, Oil & Gas, Pharma, Realty and ETF categories; no FMCG/Agricultural Food/Edible Oil target exists.

## Methodology compatibility

A theoretical router input of FMCG + Vegetable Oils Products would select `BRANDED_CONSUMER_FMCG`, but this is not accepted as a crosswalk:

1. that application category does not exist in the active application taxonomy;
2. the BRANDED_CONSUMER_FMCG profile requires branded-consumer evidence that the official leaf `Edible Oil` does not establish;
3. using it would be convenient fallback routing.

The registry contains `AGRI_PROCESSING`, which is a more plausible family for an edible-oil processor, but the canonical router does not expose that profile. Adding such a route is outside authorization.

## Disposition

**UNSUPPORTED_EXISTING_METHODOLOGY**

This means the historical company classification is valid, but PortfolioAI currently lacks an existing application-taxonomy-to-methodology path that is both authorized and semantically justified.
