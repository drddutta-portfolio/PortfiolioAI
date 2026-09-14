# R3/R4 Portfolio Priority and Research-Profile Routing Plan

**Status:** Repository planning/contract work only — no production provider execution authorized by this document  
**Date:** 14 September 2026  
**Scope:** R3 evidence-breadth prioritization and R4 research-profile routing foundation

## 1. Why R4 routing comes before broad R3 provider spend

R2D now gives PortfolioAI a safe read-only coverage spine. The next broad work is R3 research evidence expansion and R4 sector/profile research contracts.

The application must not spend provider budget before it knows which research contract applies to each holding. A Dashboard sector is an application classification, not automatically a research methodology.

Examples from the current portfolio show why this matters:

- `MTARTECH` is displayed under `Information Technology` while its current industry evidence is `Aerospace & Defence`.
- `AVALON` is displayed under `Information Technology` while its current industry evidence is `Heavy Electrical Equipment`.
- `Financial Services` contains materially different business models such as digital platforms, asset managers, brokers, insurers and lenders.
- `Automobile and Auto Components` contains both OEMs and component manufacturers.

Therefore the safe sequence is:

```text
canonical Dashboard classification
        ↓
fail-closed research-profile routing
        ↓
reviewed/versioned profile contract
        ↓
profile-specific evidence-gap plan
        ↓
bounded R3 provider execution
```

The routing layer must never change the sector/industry shown elsewhere in PortfolioAI.

## 2. Current portfolio impact baseline

Read-only production analysis of the 240 current equity holdings, using `current_security_enrichment_v1` and cached Angel One prices, found the largest current application sectors by priced equity value:

| Application sector | Holdings | Approx. share of priced equity value |
| --- | ---: | ---: |
| Pharma | 26 | 11.67% |
| Information Technology | 19 | 8.12% |
| Capital Goods | 22 | 8.10% |
| Banking | 15 | 8.01% |
| Financial Services | 22 | 7.67% |
| Automobile and Auto Components | 12 | 6.77% |
| Waste Managment | 7 | 4.87% |
| Chemicals | 14 | 4.73% |
| Gems and Jewellery | 6 | 4.57% |
| Healthcare | 6 | 3.97% |

These figures are prioritization metadata only. They do not change canonical portfolio weights or application classification.

## 3. R4A routing contract

`src/features/research/researchProfileRouting.ts` introduces `RESEARCH_PROFILE_ROUTING_V1`.

Routing states:

- `ROUTED` — current canonical classification contains enough reviewed evidence to propose a methodology;
- `PROFILE_PENDING` — classification is valid but the current evidence does not safely identify the business subtype;
- `REVIEW_REQUIRED` — classification evidence is missing or materially contradictory;
- `NOT_APPLICABLE` — non-equity asset outside the equity-research chain.

Routing is **not profile readiness**. A proposed route does not become `READY` until a reviewed/versioned research-profile contract and its mandatory evidence requirements are satisfied.

## 4. Initial fail-closed routing scope

R4A intentionally covers only high-confidence, high-impact routes already supported by the approved profile architecture:

- `BANK`
- `PHARMA`
- `IT_SERVICES`
- `INDUSTRIAL_CAPITAL_GOODS`
- `DEFENCE_AEROSPACE`
- `AUTO_OEM`
- `AUTO_COMPONENTS`
- `NBFC_LENDING`
- `CAPITAL_MARKET_FINANCIAL`
- `DIGITAL_PLATFORM`
- `HOSPITAL`
- `DIAGNOSTICS`

Unsupported/ambiguous holdings remain `PROFILE_PENDING` rather than receiving a generic profile.

## 5. Industry override rule

The application sector remains the Dashboard value from `current_security_enrichment_v1`.

However, research methodology may use more specific industry evidence to avoid a false profile. For example:

```text
Application sector: Information Technology
Industry: Aerospace & Defence
Displayed sector remains: Information Technology
Research methodology route: DEFENCE_AEROSPACE
```

This is not a classification correction. If the underlying application classification is considered wrong, that is a separate reviewed enrichment correction process. The routing layer only chooses the safest research methodology from current canonical evidence.

## 6. Current routable portfolio under R4A rules

A read-only projection of the current 240-equity portfolio using the R4A rules produced:

| Proposed route/state | Holdings | Approx. share of priced equity value |
| --- | ---: | ---: |
| PROFILE_PENDING | 159 | 56.35% |
| INDUSTRIAL_CAPITAL_GOODS | 29 | 14.23% |
| PHARMA | 26 | 11.67% |
| BANK | 15 | 8.01% |
| AUTO_OEM | 2 | 3.32% |
| DEFENCE_AEROSPACE | 2 | 2.44% |
| IT_SERVICES | 4 | 2.00% |
| DIGITAL_PLATFORM | 1 | 0.77% |
| CAPITAL_MARKET_FINANCIAL | 1 | 0.73% |
| AUTO_COMPONENTS | 1 | 0.48% |

This does **not** mean those routed holdings are research-ready. It means the methodology can be proposed without changing the application sector.

The 159 pending holdings are a useful result, not a failure: R4 must expand subtype contracts/classification evidence before R3 spends provider budget on profile-specific domains.

## 7. Recommended implementation order

The initial implementation priority should be determined by portfolio impact **and** contract maturity, not stock count alone.

### Priority 1 — BANK_V1 generalization

`BANK` already has the deepest validated reference through HDFCBANK. R4 should generalize the bank contract from HDFCBANK-specific controls into a profile-driven capability, then validate on additional bank holdings.

This unlocks 15 current holdings representing about 8.01% of priced equity value without inventing a new research methodology from scratch.

### Priority 2 — PHARMA_V1

Pharma is the largest current application sector by priced equity value: 26 holdings / about 11.67%.

It already has some structured evidence in current holdings such as TORNTPHARM and LAURUSLABS, making it a strong first non-bank profile.

PHARMA_V1 must separately define mandatory, important and supplementary evidence, including regulatory evidence semantics. Existing generic fundamental observations must not automatically make a Pharma holding READY.

### Priority 3 — INDUSTRIAL_CAPITAL_GOODS_V1

The initial routing identifies 29 holdings / about 14.23% of priced equity value because it includes Capital Goods/Industrial holdings plus high-confidence electrical-equipment industry overrides.

This profile needs an explicit order-book/execution/cash-conversion contract before provider rollout. `order book` alone must never become a quality score.

### Priority 4 — AUTO split

Implement `AUTO_OEM_V1` and `AUTO_COMPONENTS_V1` separately. The portfolio already contains clear examples such as M&M/TVSMOTOR for OEM and MOTHERSON for components.

### Priority 5 — IT_SERVICES_V1

Only holdings with compatible IT-service industry evidence should use IT_SERVICES. Broad `Information Technology` sector membership is insufficient.

### Priority 6 — Financial Services subprofiles

Do not create a generic `FINANCIAL_SERVICES` profile. Expand explicit contracts for lenders, AMCs/brokers/exchanges/depositories, insurers and digital financial platforms.

## 8. R3 evidence rollout rule

R3 provider execution should happen only after a target profile contract declares:

- mandatory metrics/evidence;
- important and supplementary evidence;
- source contract per metric/domain;
- minimum/preferred history;
- freshness policy;
- conflict/review behavior;
- deterministic normalization/calculation owner;
- readiness threshold;
- expected physical provider-call plan.

For each bounded cohort, R3 should then fetch only missing/stale approved domains and reuse the existing provider-control plane.

No blind `all equities × all domains` run is permitted.

## 9. First bounded validation cohorts

After repository contracts are complete, recommended pilot cohorts are:

### BANK

- HDFCBANK — reference reconciliation;
- ICICIBANK — additional large-cap bank;
- SBIN — PSU-bank structural variant;
- one deliberately insufficient bank to prove fail-closed behavior.

### PHARMA

- TORNTPHARM — currently has structured observations;
- LAURUSLABS — currently has structured observations;
- one Pharma holding without current observations;
- one regulatory-evidence edge case when available.

### AUTO

- M&M — OEM with existing evidence;
- TVSMOTOR — OEM subtype validation;
- MOTHERSON — component-company validation;
- one unresolved auto holding to prove `PROFILE_PENDING`.

These are proposed validation cohorts only. Executing provider calls remains a separate production approval gate.

## 10. R4A completion boundary

R4A repository work is complete when:

- deterministic routing exists and is tested;
- R2 coverage uses the routing result for proposed methodology only;
- routed methodology cannot make profile readiness `READY` by itself;
- application sector/industry remain unchanged;
- ambiguous broad sectors fail closed;
- the Architecture Guard/typecheck/lint/build pass;
- no production data/provider mutation is required.

R4A completion does **not** mean:

- profile metric contracts complete;
- portfolio-wide research evidence complete;
- any provider refresh authorized;
- profile assignment persisted in production;
- scoring/recommendation readiness portfolio-wide.
