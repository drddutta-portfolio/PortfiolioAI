# PortfolioAI — Gate K · K1 Sector Inventory & Priority Lock

**Status:** K1 SECTOR RECONCILIATION COMPLETE / PASS — INDUSTRY READINESS LOCK PENDING BEFORE K2
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

### 2.1 Exchange-primary classification authority — owner decision

K1 now adopts the following classification rule before any K4 package count is frozen:

1. **Official NSE / BSE industry classification is the Tier-1 authority for the holding's primary sector identity.**
2. A holding must have exactly one PortfolioAI primary sector identity for routing.
3. Where a company participates in multiple businesses, secondary business exposure does **not** create multiple primary sectors. Secondary economics may later be represented by a reviewed subprofile / overlay if methodology requires it.
4. For dual-listed securities, compare the latest official NSE and BSE classifications. If they agree at sector level, accept the common sector. If they materially disagree, mark the holding **REVIEW_REQUIRED** and resolve from the latest official exchange classification evidence and audited segment-revenue basis; do not choose the more convenient methodology.
5. Current PortfolioAI provider-derived sector / industry evidence may be used as supporting evidence, but it cannot overrule a current official exchange classification without reviewed evidence.
6. Holdings currently `UNCLASSIFIED` must be filled from official NSE/BSE classification evidence where available.
7. ETFs, index funds and similar pooled instruments remain outside operating-company sector routing even if an exchange page exposes a reference sectoral index.
8. Any exchange-classification refresh must update the canonical classification authority first. Runtime research routing continues to read the canonical PortfolioAI classification; application code must not scrape NSE/BSE ad hoc during scoring.

NSE Indices publishes a four-tier structure — Macro-Economic Sector, Sector, Industry and Basic Industry — and classifies multi-business companies primarily from audited segment revenue. That hierarchy is the preferred normalization model for PortfolioAI's canonical sector/industry fields.

**Consequence:** the 33-label raw inventory below is a pre-reconciliation snapshot. It is useful for identifying data-quality problems, but it is **not** the final K1 sector inventory.

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

## 7. K4 build queue — provisional candidate packages pending exchange reconciliation

### PROVISIONAL K4 CANDIDATE COUNT = 10 — NOT FROZEN

The first-pass audit identified **10 plausible consolidated sector packages**, but the owner has correctly required exchange-primary sector reconciliation before the exact K4 count is frozen.

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

These ten packages are therefore **candidate packages only**. After all current holdings are normalized to their official NSE/BSE primary sector identity and the unclassified set is resolved as far as official exchange evidence permits, K1 must rerun the inventory. Only that post-reconciliation result may freeze the exact K4 count. A later newly encountered sector still does not silently enlarge Gate K.

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

## 13. K1 provisional decisions pending exchange-primary reconciliation

### Existing engines

1. PHARMA_V1 — existing; Gate J complete.
2. BANK_NBFC — existing; K3 reconciliation/portability required.

### Current provisional K4 package count

**10 candidate packages — NOT YET FROZEN**

### Current provisional K4 order

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

### Total specialised-engine count

**NOT YET FROZEN.**

The earlier first-pass estimate was 12 total specialised engines = 2 existing + 10 candidate K4 packages. That estimate must now be recomputed after the NSE/BSE primary-sector reconciliation and must not be treated as a locked Gate K scope.

---

## 14. K1 current state

The initial live portfolio audit is complete, but K1 is **not yet at its freeze/exit point**.

Completed inside K1:

- live current-holdings inventory;
- first-pass sector grouping;
- existing-engine identification;
- legacy-scaffold audit;
- candidate reference-stock / benchmark / valuation / risk inventory;
- identification of obvious classification conflicts.

Still required inside the same consolidated K1 gate:

1. retrieve / reconcile official NSE/BSE primary classification for every current operating-company holding;
2. resolve the 10 currently unclassified holdings as far as official exchange evidence permits;
3. detect and review NSE-vs-BSE classification conflicts;
4. ensure every operating-company holding has one primary canonical sector only;
5. rerun sector counts from the reconciled canonical inventory;
6. reconsider candidate engine grouping / subprofile need from that corrected inventory;
7. freeze the exact K4 package count and order only then.

**K1 status:** IN PROGRESS  
**K4 package count:** NOT FROZEN  
**New methodology implementation:** NOT STARTED  
**Production mutation:** NONE

The next safe K1 action is the consolidated **NSE/BSE primary-classification reconciliation pass**. K2 must not begin until that pass is complete and the resulting K1 scope is owner-approved.


---

## 15. K1 exchange-primary classification build checkpoint

The classification architecture has now been implemented without production mutation.

Canonical build artifact:

`docs/PortfolioAI_GATE_K_K1_EXCHANGE_PRIMARY_CLASSIFICATION_BUILD.md`

Implemented:

- `src/features/portfolio/exchangePrimaryClassification.ts`
- `src/features/portfolio/exchangePrimaryClassification.test.ts`
- `src/features/research/portfolioCoverageProjection.ts` fail-closed exchange-classification routing
- `src/features/research/portfolioCoverageProjection.test.ts` exchange-state regression coverage
- `src/contracts/canonicalDataAuthorities.ts` exchange-primary authority clarification
- `scripts/k1-current-nse-equities-2026-09-22.txt` — current 238-equity NSE cohort
- `scripts/k1-fetch-nse-primary-classification.mjs` — read-only official NSE snapshot fetcher
- `scripts/k1-validate-exchange-primary-classification.sh` — consolidated validator

### Corrected unclassified interpretation

The ten current `UNAVAILABLE` holdings are not ten unclassified operating companies.

```text
1 operating-company equity:
CHOLAFIN

9 ETFs:
GOLDBEES
ITBEES
LOWVOL
MAFANG
MIDCAPETF
MON100
MONQ50
NIFTYBEES
SILVERBEES
```

All current open holdings are NSE instruments:

```text
NSE EQUITY = 238
NSE ETF    = 9
```

Official NSE evidence identifies CHOLAFIN as basic industry `Non Banking Financial Company (NBFC)`, which belongs to:

```text
Macro-Economic Sector = Financial Services
Sector = Financial Services
Industry = Finance
Basic Industry = Non Banking Financial Company (NBFC)
```

This evidence has **not** been written to production by K1.

### Current stop point

```text
K1 exchange-primary resolver = IMPLEMENTED
New-stock fail-closed intake = IMPLEMENTED
Coverage routing safety fix = IMPLEMENTED
Current 238 NSE equity cohort snapshot = PREPARED
Read-only NSE classification fetcher = IMPLEMENTED
Consolidated validator = IMPLEMENTED

Official 238-stock exchange snapshot = PENDING EXECUTION
Current canonical-vs-exchange diff = PENDING
Final reconciled sector inventory = PENDING
Exact K4 package count = NOT FROZEN
K2 = BLOCKED
```

No new sector methodology has been built.


---

## 16. K1 reusable reconciliation path

The K1 build now includes both sides of the official-vs-canonical comparison.

Added:

- `scripts/k1-current-canonical-classification.sql`
- `scripts/k1-compare-nse-classification.mjs`
- `scripts/k1-compare-nse-classification.test.mjs`

The reconciliation output is deterministic and classifies every current NSE operating equity as:

```text
AGREE
DETAIL_MISSING
CHANGE_REQUIRED
REVIEW_REQUIRED
OFFICIAL_MISSING
```

This makes the same logic reusable when newer stocks are added. A newly added stock cannot route directly to a research methodology merely because it resembles an existing holding; official exchange classification must resolve first.

The exact K4 package count remains deliberately **NOT FROZEN** until the 238-current-equity official snapshot has been executed and reconciled.

---

## 17. K1 reconciliation-policy checkpoint — 22 September 2026

The first 10-stock official-NSE pilot exposed four genuine primary-sector changes plus one identity exception. K1 policy has now been tightened before any full-cohort run.

Locked rules:

1. official NSE/BSE primary sector owns the canonical user-facing sector;
2. canonical sector differences become review-first `CHANGE_REQUIRED` proposals, never automatic writes;
3. research profile/subprofile is downstream and cannot rewrite exchange-primary sector;
4. unexplained ISIN mismatch remains `REVIEW_REQUIRED`;
5. an exact officially evidenced corporate-action ISIN rollover becomes an identity-scoped `CHANGE_REQUIRED`, not a waived mismatch;
6. ETFs remain outside operating-company sector methodology;
7. no nearest-looking research engine fallback is permitted.

AKUMS / ALIVUS coexistence is resolved architecturally:

```text
NSE sector Healthcare
+ pharmaceutical industry evidence
→ user-facing sector remains Healthcare
→ PHARMA research profile may still route
→ PHARMA_V1 subtype remains independently reviewed
```

ANGELONE mismatch cause is resolved as the NSE-notified 26-Feb-2026 ISIN change from `INE732I01013` to `INE732I01021` following share subdivision. The canonical identity still requires refresh; K1 itself performs no production mutation.

**Next action:** rerun the same 10-stock cohort under reconciliation V2. Full 238-stock reconciliation remains blocked until that bounded policy re-run passes.

**K4 package count/order:** NOT YET FROZEN.

---

## 18. Final reconciled sector inventory — PASS

The deterministic finalizer completed against the freeze-eligible 238-equity reconciliation.

Observed result:

```text
Rows: 238
Distinct sectors: 30

Financial Services                  36
Capital Goods                      31
Healthcare                         30
Chemicals                          17
Consumer Durables                  15
Information Technology            13
Metals & Mining                    12
Fast Moving Consumer Goods         11
Automobile and Auto Components      9
Consumer Services                   9
Construction                        6
Oil Gas & Consumable Fuels          6
Power                               6
Services                            4
Textiles                            4
Automobile & Ancillaries            3
FMCG                                3
Utilities                           3
Construction Materials              2
Diamond & Jewellery                 2
Hospitality                         2
Miscellaneous                       2
Oil & Gas                           2
Realty                              2
Telecommunication                   2
Textiles & Apparel                  2
Agri                                1
Diversified                         1
Plastic Products                    1
Software & IT Services              1
```

Reference-source split:

```text
NSE_INDICES_NIFTY_TOTAL_MARKET_CONSTITUENT  200
REVIEWED_SECONDARY_CLASSIFICATION           38
```

This is the final K1 planning inventory for the frozen current cohort.

## 19. Final K4 package scope — FROZEN

The corrected inventory does not justify one engine per exchange sector. The final methodology architecture remains consolidated by economics and routing identity.

### Existing specialised engines — not K4 packages

1. `PHARMA_V1` — existing / complete.
2. `BANK_NBFC` — existing / K3 portability reconciliation.

### Final K4 package count

**10 packages — FROZEN**

### Final K4 package order

1. `IT_TECH`
2. `INDUSTRIALS_CAPITAL_GOODS`
3. `AUTO_COMPONENTS`
4. `CHEMICALS_V1`
5. `HEALTHCARE_SERVICES_V1`
6. `FIN_SERVICES_NON_LENDER`
7. `METALS_COMMODITIES`
8. `CONSUMER_FMCG`
9. `OIL_GAS_V1`
10. `POWER_RENEWABLES_V1`

Machine-readable freeze artifact:

`docs/k1/PortfolioAI_K1_FINAL_K4_PACKAGE_SCOPE_2026-09-22.json`

### Why Healthcare 30 does not become one Healthcare engine

Exchange-primary `Healthcare` is a user-facing sector, not a methodology identity.

Pharmaceutical companies under Healthcare continue to route downstream into `PHARMA_V1` where industry/subprofile evidence supports that route.

`HEALTHCARE_SERVICES_V1` therefore covers only non-pharma provider/service identities such as hospitals/diagnostics and must fail closed for unsupported healthcare identities.

### Why Financial Services 36 does not become one Financial engine

Lender/NBFC identities continue through the existing `BANK_NBFC` path after K3 reconciliation.

`FIN_SERVICES_NON_LENDER` is limited to non-lender identities such as:
- capital markets / AMC;
- insurance;
- fintech / platform.

### Explicit deferred sectors

The following final primary sectors are **not** promoted into new K4 packages:

- Consumer Durables;
- Consumer Services;
- Construction;
- Services;
- Textiles;
- Utilities;
- Construction Materials;
- Diamond & Jewellery;
- Hospitality;
- Miscellaneous;
- Realty;
- Telecommunication;
- Textiles & Apparel;
- Agri;
- Diversified;
- Plastic Products.

These remain `METHODOLOGY_NOT_AVAILABLE`, `PROFILE_PENDING`, or later reviewed expansion candidates. No nearest-looking fallback is permitted.

### K1 exit state

```text
238-equity reconciliation          PASS / FREEZE ELIGIBLE
Final reconciled sector inventory  COMPLETE
K4 package count                   10 / FROZEN
K4 package order                   FROZEN
New methodology implementation     NOT STARTED
Production mutation                NONE
PR #101                            OPEN / DRAFT / UNMERGED
```

**K1 = COMPLETE / PASS.**

---

## 20. K1 Industry Readiness Lock — architecture invariant

K1 sector reconciliation remains COMPLETE / PASS. Before K2 begins, one final readiness lock is required to prevent PortfolioAI from drifting into sector-only micro-research.

### Permanent research invariant

```text
Sector          = macro context / portfolio classification
Industry        = minimum micro-research methodology selector
Basic Industry  = business-model refinement
Research Profile/Subprofile = metric applicability + valuation selector
Company Evidence = scoring evidence
Score            = company assessment
Recommendation   = action logic
```

**A sector label alone must never select a specialised research methodology.**

### Runtime enforcement

`RESEARCH_PROFILE_ROUTING_V2` now fails closed when a specialised profile would otherwise be inferred from sector alone.

Examples:

```text
Banking + industry missing
→ PROFILE_PENDING / BANKING_INDUSTRY_REQUIRED

Pharma + industry missing
→ PROFILE_PENDING / PHARMA_INDUSTRY_REQUIRED

Capital Goods + industry missing
→ PROFILE_PENDING / CAPITAL_GOODS_INDUSTRY_REQUIRED
```

Supported industry evidence still routes normally, including:

```text
Healthcare + Pharmaceuticals → PHARMA
Healthcare + Hospitals       → HOSPITAL
Financial Services + NBFC    → NBFC_LENDING
Capital Goods + Heavy Electrical Equipment → INDUSTRIAL_CAPITAL_GOODS
Aerospace & Defence industry → DEFENCE_AEROSPACE
```

### Machine-readable taxonomy authority

Added:

`docs/k1/PortfolioAI_GATE_K_INDUSTRY_RESEARCH_TAXONOMY.json`

This contract records:
- sector as macro context;
- industry as methodology selector;
- business-model/basic-industry refinement;
- currently supported profile routes;
- K4 methodology families whose detailed industry taxonomy must still be frozen in each package Checkpoint A;
- explicit prohibition on sector-only specialised routing.

### Industry readiness audit

Added:

`scripts/k1-industry-readiness-lock.mjs`

Input:
- `artifacts/k1-final-reconciled-sector-inventory.json`
- the machine-readable industry taxonomy.

Output:
- `artifacts/k1-industry-readiness-lock.json`

The audit reports:
- industry coverage across all 238 equities;
- basic-industry coverage;
- distinct industry count;
- exact industry counts;
- stocks with missing industry;
- stocks already routable with the current taxonomy;
- stocks with industry evidence but taxonomy still pending for future K4 methodology definition.

### K2 gate

K2 must not begin until this audit is executed and reviewed.

The Industry Readiness Lock is a readiness prerequisite, not a reopening of exchange-sector reconciliation and not a new scoring methodology.
