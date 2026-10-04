# PortfolioAI P8 Execution-Capability Matrix

Date: 5 October 2026

| Capability layer | Edible Oil / BRANDED_CONSUMER_FMCG | Edible Oil / AGRI_PROCESSING | Steel Pipes / STEEL_FERROUS |
|---|---|---|---|
| Historical economic classification | Proven | Proven | Proven |
| Methodology-selection contract | Existing selector `VEGETABLE_OILS_PRODUCTS`, but mapping from `Edible Oil` unresolved | **Ambiguous / no equivalent K4A selector contract found** | **Existing exact selector `IRON_STEEL_PRODUCTS`** |
| Active application-taxonomy representation | Missing | Missing | Existing app has Metals & Mining / Iron & Steel, but using it would rewrite the approved historical economic hierarchy |
| Router exposure | Present for FMCG + vegetable-oils selector | **Absent** | Present only inside Metals/Mining sector branch |
| Sector-engine registry | Implemented `CONSUMER_FMCG` | **Absent** | Implemented `METALS_COMMODITIES` |
| Scoring methodology | Implemented K4B | **No dedicated canonical K4 implementation** | Implemented K4B |
| Generic scoring adapter | **PENDING_ADAPTER** | Not reachable | **PENDING_ADAPTER** |
| Persistence/consumer activation | Read-only/non-persistent under current K4 contracts | Not implemented | Read-only/non-persistent under current K4 contracts |
| Current authoritative route | 0 | 0 | 0 |

## Capability classification

- **BRANDED_CONSUMER_FMCG:** implemented methodology; missing mapping/application representation and adapter; selection mapping still requires owner decision.
- **AGRI_PROCESSING:** registry-only methodology capability; missing applicability selector, router, sector engine and executable scoring implementation. This is a genuine capability-extension problem, not wiring alone.
- **STEEL_FERROUS:** implemented methodology with applicability supported by the exact approved Basic Industry; missing canonical historical/application routing integration and scoring adapter.
