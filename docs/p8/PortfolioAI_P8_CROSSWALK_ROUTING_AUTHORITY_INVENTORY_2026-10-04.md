# PortfolioAI P8 Historical Taxonomy Crosswalk + Routing Authority Inventory

Date: 4 October 2026

## Routing chain

`Official NSE four-tier taxonomy → application Sector/Industry → RESEARCH_PROFILE_ROUTING_V2 → methodology profile → canonical required signals`

Development currently contains only **9 active application industries** and **9 verified source mappings**. None represents Edible Oil, Agricultural Food & other Products, Textiles, Automobile and Auto Components, Engineering Services, or the five other dominant descriptions in the frozen canary.

The canonical router is fail-closed and must receive an application Sector and Industry; no separate historical router is authorized.

## Important router/profile distinction

The router exposes `BRANDED_CONSUMER_FMCG` for FMCG/consumer-staples industries including `VEGETABLE_OILS_PRODUCTS`. The corresponding methodology requires branded-consumer evidence such as `BRAND_DISTRIBUTION_CATEGORY_DURABILITY`.

The methodology registry separately contains `AGRI_PROCESSING`, whose evidence requirements include product mix, procurement/processing moat, working capital and agricultural/input risks. However, `RESEARCH_PROFILE_ROUTING_V2` does not expose `AGRI_PROCESSING` as a route.

Therefore an official NSE Edible Oil classification does not currently reach exactly one semantically justified existing methodology without either changing application taxonomy or router/methodology authority—both prohibited in this task.
