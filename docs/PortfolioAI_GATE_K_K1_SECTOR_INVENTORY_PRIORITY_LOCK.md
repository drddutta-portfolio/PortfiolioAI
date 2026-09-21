# PortfolioAI — Gate K · K1 Sector Inventory & Priority Lock

**Status:** K1 TECHNICAL AUDIT COMPLETE / OWNER REVIEW LOCK PREPARED  
**Date:** 22 September 2026  
**Branch:** r4n-pharma-subprofile-architecture  
**PR:** #101 — KEEP OPEN / DRAFT / UNMERGED  
**Canonical plan:** docs/PortfolioAI_GATE_K_MULTI_SECTOR_RESEARCH_ENGINE_EXPANSION_PLAN.md

---

## 1. K1 scope and safety boundary

This K1 artifact performs inventory, grouping, priority and architecture decisions only.

It does **not** create a new sector scoring methodology, score curve, recommendation threshold, persistence path, production migration, provider refresh, scheduler change, deployment, merge, portfolio mutation, sizing action or trading action.

Safety state remains:

- score persistence: OFF;
- recommendation persistence: OFF;
- position sizing: OFF;
- AI interpretation: OFF;
- production Supabase mutation: NO;
- provider refresh: NO;
- scheduler mutation: NO;
- deployment: NO;
- PR merge: NO;
- automatic trading: NO.

All database work used to prepare K1 was read-only.

---

## 2. Canonical authorities inspected

K1 used the existing PortfolioAI contracts rather than inventing a new classification source:

- current_security_enrichment_v1 remains the canonical application authority for sector / industry / market-cap enrichment;
- current_holdings is the canonical current-position view used for the live portfolio inventory;
- market_price_latest supplied already-stored prices for the exposure snapshot; no market-data refresh was called;
- scoring_profiles, scoring_profile_sector_rules, scoring_profile_dimension_overrides and scoring_profile_metric_overrides were audited to distinguish specialised engines from older GENERAL-derived scaffolds;
- security_scoring_profile_assignments was inspected but not changed.

The canonical Gate K plan and the cumulative development handoff were inspected first.

---

## 3. Current portfolio inventory baseline

Active portfolio:

**Consolidated Portfolio**

Current open holdings:

**247**

Canonical enrichment state:

| State | Holdings |
| --- | ---: |
| AVAILABLE | 48 |
| PARTIAL | 189 |
| UNAVAILABLE | 10 |
| Industry present | 48 |
| Stored-price coverage | 245 / 247 |

Only 48 of 247 holdings currently have a canonical industry value. Therefore K1 must not infer detailed business-model subprofiles simply because a broad sector label exists.

The stored-price exposure snapshot below uses market_price_latest observations dated 21 September 2026. It is an architecture-priority aid, not a live portfolio valuation and not an investment recommendation.

---

## 4. Raw canonical sector inventory

The 247 open holdings currently span **33 non-null canonical sector labels plus 10 unclassified holdings**.

| Canonical sector | Holdings | Approx. priced exposure |
| --- | ---: | ---: |
| Pharma | 26 | 11.19% |
| Capital Goods | 22 | 7.71% |
| Information Technology | 19 | 7.69% |
| Banking | 14 | 7.29% |
| Financial Services | 21 | 7.02% |
| Automobile and Auto Components | 12 | 6.39% |
| UNCLASSIFIED | 10 | 6.06% |
| Chemicals | 14 | 4.56% |
| Waste Managment | 7 | 4.47% |
| Gems and Jewellery | 6 | 4.36% |
| Healthcare | 6 | 4.04% |
| Metals & Mining | 10 | 3.28% |
| Consumer Services | 11 | 2.76% |
| Industrial | 6 | 2.70% |
| Energy | 3 | 2.58% |
| Oil Gas & Consumable Fuels | 8 | 2.24% |
| Fast Moving Consumer Goods | 9 | 2.19% |
| Telecommunication | 2 | 1.75% |
| Consumer Durables | 7 | 1.50% |
| Power | 4 | 1.32% |
| Construction Materials | 1 | 0.99% |
| Textiles | 6 | 0.98% |
| Ship Building | 2 | 0.93% |
| Realty | 2 | 0.85% |
| Construction | 2 | 0.85% |
| Material | 4 | 0.78% |
| Textiles Apparels & Accessories | 1 | 0.71% |
| Consumer Discretionary | 2 | 0.68% |
| Services | 4 | 0.61% |
| Consumer Staples | 1 | 0.51% |
| Renewable Energy | 2 | 0.47% |
| FMCG | 2 | 0.34% |
| Defence | 1 | 0.22% |

A one-engine-per-label design is rejected. These labels contain aliases, incomplete classifications and economically different businesses that must not silently share methodology.

---

## 5. Existing specialised-engine audit

### 5.1 PHARMA_V1 — existing specialised engine

Status:

**EXISTING / SPECIALISED / PORTABLE**

Gate J proved that PHARMA_V1 routes future Pharma securities through a reviewed primary subprofile without ticker-specific methodology code.

Current canonical Pharma holdings: **26**  
Approx. priced exposure: **11.19%**

Existing reviewed methodology authorities:

1. API_BULK_DRUGS
2. DOMESTIC_FORMULATIONS
3. GLOBAL_GENERICS
4. BIOPHARMA_BIOSIMILARS
5. CDMO_CRAMS

PHARMA_V1 is not a K4 package.

### 5.2 BANK_NBFC — existing specialised engine requiring K3 portability closure

Status:

**EXISTING / SPECIALISED / K3 RECONCILIATION REQUIRED**

Current canonical Banking holdings: **14**  
Approx. priced exposure: **7.29%**

A further **9 Financial Services holdings** are plausible lender / housing-finance / NBFC candidates for K3 review:

CGCL, HUDCO, IREDA, JIOFIN, LTF, MUTHOOTFIN, PNBHOUSING, SHRIRAMFIN, TATACAP.

Their approximate priced exposure is **1.93%**.

K1 does not reclassify or assign them. K3 must decide their BANK_NBFC eligibility from reviewed business identity and then prove portability. CHOLAFIN is also an obvious classification-review case, but its canonical enrichment is currently unavailable and K1 therefore does not silently route it.

BANK_NBFC is not a K4 package.

### 5.3 Older GENERAL-derived profile scaffolds are not specialised engines

The repository already contains active profile codes including:

- IT_TECH
- INDUSTRIALS_CAPITAL_GOODS
- CONSUMER_FMCG
- AUTO_COMPONENTS
- ENERGY_UTILITIES
- METALS_COMMODITIES
- INFRA_CONSTRUCTION
- REAL_ESTATE
- FIN_SERVICES_NON_LENDER
- PHARMA_HEALTHCARE

These were created as conservative GENERAL-derived sector overlays. Their dimension weights were initially copied from GENERAL, with only small applicability / weight overrides.

K1 therefore does **not** count these rows as completed specialised methodologies.

In particular:

- PHARMA_HEALTHCARE must not be used as a fallback for Pharma; PHARMA_V1 owns Pharma.
- ENERGY_UTILITIES is too broad to be promoted unchanged because it mixes power, oil, gas and utilities.
- FIN_SERVICES_NON_LENDER cannot safely absorb lenders simply because their broad sector says Financial Services.
- the presence of a profile row is not proof that its benchmark, evidence contract, valuation method, durability logic or recommendation policy has been validated.

---

## 6. Canonical classification conflicts / review-required cases

K1 found several holdings where current sector and industry identities do not form a trustworthy methodology-routing pair.

These are frozen as **REVIEW_REQUIRED** until classification / business identity is reconciled:

- AVALON — sector Information Technology; industry Heavy Electrical Equipment;
- MTARTECH — sector Information Technology; industry Aerospace & Defence;
- TDPOWERSYS — sector Energy; industry Heavy Electrical Equipment;
- SKYGOLD — sector Textiles Apparels & Accessories; industry Gems & Jewellery;
- ABCAPITAL — broad Financial Services identity is economically mixed and insufficient for lender vs non-lender routing;
- CHOLAFIN — canonical enrichment unavailable;
- IRMENERGY — broad Energy only; requires reviewed oil/gas / city-gas identity before routing;
- KPIGREEN — broad Energy only; requires reviewed renewable-power identity before routing.

This list is not a production correction request and no canonical data was mutated.

The portfolio also contains partially classified holdings with missing industries. They may remain sector-package candidates, but any future K4 runtime contract must fail closed when the business identity required by a subprofile cannot be resolved.

---

## 7. K4 build queue — exact package count

### K4 PACKAGE COUNT = 10

K4 will contain exactly **10 consolidated sector packages**.

PHARMA_V1 is already complete and BANK_NBFC is handled by K3, so neither counts toward K4.

The ten K4 packages are:

1. IT_TECH
2. INDUSTRIALS_CAPITAL_GOODS
3. AUTO_COMPONENTS
4. CHEMICALS_V1
5. HEALTHCARE_SERVICES_V1
6. FIN_SERVICES_NON_LENDER
7. METALS_COMMODITIES
8. CONSUMER_FMCG
9. OIL_GAS_V1
10. POWER_RENEWABLES_V1

After owner acceptance of K1, this count is frozen. A new sector does not enlarge Gate K silently.

---

## 8. K4 priority and design inventory

The following rows are architecture inputs only. They identify likely benchmark and valuation families; they do not define scoring curves or recommendation thresholds.

| Order | K4 package | Current candidate footprint | Subprofile assessment | Reference-stock candidates | Likely benchmark family | Likely valuation family | Major sector risks |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | IT_TECH | 17 clean sector candidates; 2 IT-labelled conflicts held for review; approx. 4.57% clean exposure | **YES** — services vs product / digital-infrastructure economics are materially different | INFY, PERSISTENT; HCLTECH as additional services control; NETWEB as non-services control | Nifty IT; MidSmall IT & Telecom as size/context cross-check | P/E, EV/EBITDA, FCF yield; growth-adjusted valuation where evidence supports it | client concentration, discretionary tech spend, FX, margin/utilisation, talent, platform / AI disruption |
| 2 | INDUSTRIALS_CAPITAL_GOODS | 29 canonical Capital Goods / Industrial / Defence candidates; approx. 10.63% | **YES** — project/EPC, capital equipment/electronics and defence economics require separate applicability | LT, CGPOWER, BEL; ASTRAMICRO as defence control | Nifty Capital Goods; India Manufacturing context; India Defence for defence subset | EV/EBITDA, P/E, FCF / cash conversion, cycle-aware ROCE | order execution, working capital, receivables, capex cycle, input costs, customer / government concentration |
| 3 | AUTO_COMPONENTS | 12; approx. 6.39% | **YES** — OEM vs components is a genuine method distinction; EV transition should begin as exposure/risk metadata rather than an automatic third score | M&M, TVSMOTOR, MOTHERSON, SONACOMS | Nifty Auto; EV & New Age Automotive as transition context | P/E, EV/EBITDA, FCF, ROCE with cycle-normalised growth/margins | demand cycle, EV transition, regulation, commodity inputs, customer concentration, capex |
| 4 | CHEMICALS_V1 | 14; approx. 4.56% | **YES** — specialty, agro/fertiliser and commodity/process economics should not share one undifferentiated curve | PIIND, SRF, DEEPAKFERT; VINATIORGA as specialty control | Nifty Chemicals | EV/EBITDA, P/E, FCF; cycle-normalised margins and return on capacity | feedstock, China/global pricing, environmental regulation, utilisation, capex, FX/customer concentration |
| 5 | HEALTHCARE_SERVICES_V1 | 6 broad Healthcare holdings; approx. 4.04% | **NO initially for hospital operators**; any non-provider business identity must fail review rather than be forced into the hospital method | MAXHEALTH, NH, MEDANTA, YATHARTH | Nifty Hospitals primary; Nifty Healthcare secondary | EV/EBITDA, P/E, FCF; operating evidence may include occupancy / ARPOB / bed ramp | occupancy, clinician retention, pricing regulation, capex/bed ramp, payer mix, execution |
| 6 | FIN_SERVICES_NON_LENDER | 11 non-lender candidates after K3 lender separation; approx. 4.47% | **YES — mandatory**: capital-markets/AMC, insurance, and fintech/platform businesses need separate applicability and valuation treatment | NAM-INDIA/HDFCAMC, ANGELONE/CAMS, STARHEALTH, PAYTM/POLICYBZR | Nifty Financial Services Ex-Bank; Nifty Capital Markets; Nifty Insurance | subprofile-owned: P/E/AUM-yield for AMC/capital markets; embedded-value/VNB families for insurance where available; cash-flow / revenue economics for platforms | market/AUM cycle, regulation, operating/client-asset risk, claims/reserving, platform unit economics |
| 7 | METALS_COMMODITIES | 10; approx. 3.28% | **NO fixed subprofiles at K1**; commodity exposure metadata is mandatory and K4-A must prove whether steel/non-ferrous need separate curves | HINDALCO, JINDALSTEL, HINDZINC | Nifty Metal | EV/EBITDA, P/B, normalised FCF / ROCE; spot P/E must not be sole anchor | commodity cycle, China/global demand, energy/input costs, leverage, royalty/policy, environmental risk |
| 8 | CONSUMER_FMCG | 12 across Fast Moving Consumer Goods / FMCG / Consumer Staples labels; approx. 3.03% | **NO initially** for branded/staples scope; alcohol-specific excise risk remains explicit rather than silently becoming a universal curve | HINDUNILVR, VBL, LTFOODS; RADICO as risk-variant control | Nifty FMCG | P/E, EV/EBITDA, FCF yield, ROCE / cash conversion | raw-material inflation, demand mix, competition, distribution, brand concentration, excise/regulatory risk |
| 9 | OIL_GAS_V1 | 8 canonical Oil/Gas holdings; approx. 2.24%; IRMENERGY held for review | **YES — mandatory**: upstream, midstream/city gas, integrated/refining-petrochemical | ONGC, GAIL, MGL/IGL; RELIANCE as mixed-business control rather than sole anchor | Nifty Oil & Gas | subprofile-aware EV/EBITDA, P/B, FCF/dividend/DCF; normalised commodity/refining context | commodity prices, administered pricing/tax, refining spreads, FX, reserves/volume, energy transition |
| 10 | POWER_RENEWABLES_V1 | 6 canonical Power/Renewable candidates; approx. 1.80%; KPIGREEN held for review | **YES — mandatory**: regulated network, generation/integrated utility, renewable IPP | TATAPOWER, NHPC, POWERGRID; ACMESOLAR/KPIGREEN after identity review as renewable controls | Nifty Power; Nifty Energy / Infrastructure as context | subprofile-aware P/B/DCF/dividend for regulated networks; EV/EBITDA/DCF/FCF for generation and renewable assets | tariff/regulation, fuel/resource variability, interest rates/capex, offtaker/DISCOM risk, transmission constraints |

### Why the order is not pure exposure order

The sequence balances:

1. portfolio materiality;
2. existence of a usable legacy scaffold;
3. benchmark and evidence clarity;
4. ability to test K2 portability with a comparatively clean first package;
5. methodological complexity;
6. K3 dependency for lender/non-lender separation.

IT_TECH is first because it is a strong test of the generic K2 engine contract with a clear benchmark and mature public evidence. INDUSTRIALS_CAPITAL_GOODS follows because it is the largest K4 candidate footprint but requires more explicit business-model branching.

---

## 9. Subprofile lock

K1 concludes that subprofiles are **not a Pharma-only concept**, but they must be created only where economics require different evidence/applicability/valuation logic.

### Subprofiles genuinely required in K4

- IT_TECH: services vs product/digital-infrastructure;
- INDUSTRIALS_CAPITAL_GOODS: project/EPC vs equipment/electronics vs defence/aerospace;
- AUTO_COMPONENTS: OEM vs components;
- CHEMICALS_V1: specialty vs agro/fertiliser vs commodity/process;
- FIN_SERVICES_NON_LENDER: capital-markets/AMC vs insurance vs fintech/platform;
- OIL_GAS_V1: upstream vs midstream/city gas vs integrated/refining;
- POWER_RENEWABLES_V1: regulated network vs generation/integrated vs renewable IPP.

### No mandatory subprofiles frozen at K1

- HEALTHCARE_SERVICES_V1 — hospital-provider method first; non-provider identities must fail review rather than be absorbed;
- METALS_COMMODITIES — use commodity/cycle metadata first; K4-A may prove a true method split;
- CONSUMER_FMCG — branded/staples method first; explicit special risks remain risks unless K4-A proves a separate methodology is necessary.

Exact subprofile codes, score curves and numeric thresholds are **not** created by K1. They belong to each K4 Checkpoint A.

---

## 10. Deferred / GENERAL / METHODOLOGY_NOT_AVAILABLE

The following areas are intentionally **not** added to K4.

They remain GENERAL / METHODOLOGY_NOT_AVAILABLE, REVIEW_REQUIRED, or a later controlled expansion item.

### 10.1 ETFs / funds / non-operating-company instruments

The unclassified set includes GOLDBEES, ITBEES, LOWVOL, MAFANG, MIDCAPETF, MON100, MONQ50, NIFTYBEES and SILVERBEES.

These should not be forced through an operating-company equity sector methodology.

Future treatment should be a separate FUND_ETF methodology project, not a K4 sector package.

CHOLAFIN is not part of this ETF exception; it is classification review required.

### 10.2 Consumer services / durables / discretionary

Deferred labels include:

- Consumer Services;
- Consumer Durables;
- Consumer Discretionary;
- Gems and Jewellery;
- Textiles Apparels & Accessories.

Reason: the current portfolio combines retail, hotels, restaurants, internet consumption, jewellery and durable-goods economics. A single broad “consumer” engine would be methodologically weak, while creating many small K4 packages now would violate the Gate K anti-proliferation goal.

The existing broad CONSUMER_FMCG scaffold is therefore narrowed for K4 to FMCG / staples rather than used as a universal consumer fallback.

### 10.3 Waste / environmental infrastructure

The current Waste Managment label has 7 holdings and material exposure, but it mixes water-treatment EPC/equipment, municipal/environmental services and adjacent utilities with sparse industry identity. WABAG alone is a large share of that bucket.

Status:

**DEFER — later ENVIRONMENTAL_INFRA / WATER review**

A single Waste methodology is not frozen in K1.

### 10.4 Construction / infrastructure / real estate

INFRA_CONSTRUCTION and REAL_ESTATE remain legacy GENERAL-derived scaffolds, not approved specialised engines.

Current dedicated raw exposure is too small and classification overlap with Industrials/EPC remains unresolved for a K4 package in this gate.

Status:

**GENERAL / METHODOLOGY_NOT_AVAILABLE**

### 10.5 Telecom, textiles, services, shipping, materials

Deferred because of low current breadth and/or heterogeneous economics:

- Telecommunication;
- Textiles;
- Services;
- Ship Building;
- Material;
- Construction Materials;
- Realty.

GESHIP vs GRSE illustrates why the Ship Building label should not itself be treated as proof of one methodology.

---

## 11. Coverage effect of the K1 lock

Using the stored 21 September 2026 price snapshot:

- existing PHARMA_V1: approx. 11.19%;
- canonical Banking already in BANK_NBFC scope: approx. 7.29%;
- Financial Services lender candidates for K3 review: approx. 1.93%;
- ten K4 package candidate buckets: approx. 45.01%;
- explicitly REVIEW_REQUIRED identities: approx. 7.04%;
- deferred GENERAL / METHODOLOGY_NOT_AVAILABLE: approx. 27.56%.

These percentages are architecture planning figures only and may not sum exactly to 100% because of rounding and two holdings without stored prices.

The important K1 result is not “100% of holdings must receive a methodology.” The safe result is:

**every current holding receives an explicit engine state, review state, or METHODOLOGY_NOT_AVAILABLE state, with no nearest-looking fallback.**

---

## 12. Benchmark-family verification

K1 verified that NSE Indices currently publishes sectoral benchmark families suitable for the proposed queue, including Nifty Auto, Bank, Capital Goods, Chemicals, Financial Services Ex-Bank, FMCG, Healthcare, Hospitals, IT, Metal, Oil and Gas, Pharma, Power, Realty and Telecommunications.

Thematic benchmark families also exist for Capital Markets, India Defence, India Manufacturing, EV & New Age Automotive, Infrastructure and related themes.

K4 must still verify benchmark composition and fit before freezing a methodology. K1 benchmark names are candidates, not automatic authorities.

Official references:

- https://www.niftyindices.com/indices/equity/sectoral-indices
- https://www.niftyindices.com/resources/index-methodology

---

## 13. K1 frozen decisions

### Existing engines

1. PHARMA_V1 — existing; Gate J complete.
2. BANK_NBFC — existing; K3 reconciliation/portability required.

### Exact K4 package count

**10**

### Exact K4 order

1. IT_TECH
2. INDUSTRIALS_CAPITAL_GOODS
3. AUTO_COMPONENTS
4. CHEMICALS_V1
5. HEALTHCARE_SERVICES_V1
6. FIN_SERVICES_NON_LENDER
7. METALS_COMMODITIES
8. CONSUMER_FMCG
9. OIL_GAS_V1
10. POWER_RENEWABLES_V1

### Explicit non-K4 states

- ETFs/funds: METHODOLOGY_NOT_AVAILABLE pending separate fund/ETF architecture;
- broad heterogeneous consumer groups: deferred;
- waste/environmental infrastructure: deferred;
- infra/construction and real estate: deferred;
- telecom/textiles/services/shipping/materials: deferred;
- classification conflicts: REVIEW_REQUIRED;
- no unrelated-sector fallback is permitted.

### Total intended specialised-engine architecture after K3 + K4

If K3 and all ten K4 packages later pass:

**12 specialised sector engines total**

= 2 existing (PHARMA_V1 + BANK_NBFC)  
+ 10 K4 packages.

This is an architecture count only. It does not mean every portfolio holding will be score-computable.

---

## 14. K1 exit state

K1 has now produced the required **Gate K Sector Build Queue** with:

- complete live portfolio sector inventory;
- existing-engine identification;
- explicit new-engine candidates;
- explicit deferred states;
- genuine subprofile assessment;
- reference-stock candidates;
- benchmark-family candidates;
- valuation-family candidates;
- major risk families;
- exact K4 package count;
- exact development order.

No methodology implementation has begun.

**K1 technical lock:** PREPARED  
**Owner acceptance:** REQUIRED before marking K1 COMPLETE / PASS and before beginning K2.

The next safe gate after owner acceptance is:

**K2 — Universal Sector-Engine Contract**
