# V1-4 Action A — cache-only materialization execution record

Date: 5 October 2026. Branch: `PortfolioAI-Development`. **ACTION A = COMPLETE / PASS against its bounded execution contract. V1-4 = NOT PROVEN. Action B and V1-5 were not executed.**

## Authority and fixed run

Owner explicitly approved all six cache-only slices as one action. Starting authoritative Development HEAD: `3f3a98a8f046fe51b4d04fa6650919be33c3c162`. No application/configuration change or new function deployment was necessary.

Target only **PortfolioAI Dev / lrgpjimipfkyoqbpsqzz**. Existing function `p7-ic2-materialize-readiness`, ACTIVE version **19**, action `P7_IC3_MATERIALIZE_CANONICAL_SNAPSHOTS`, materializer version `P7_IC3_CANONICAL_SNAPSHOT_V2_INPUT_VALIDATION`.

One selection run: `4d6ef6d6-ca7c-4fbc-8362-827edcfc6075`.
Exact evaluation and source cutoff, both unchanged: **2026-10-05T19:25:54.019754+00:00**.
Preflight reproduced all 239 approved diagnostic hashes/items/states exactly against read-only run `996411b5-44c9-41e3-b1e4-c51da09c7093`. Six existing-format, slice-scoped, one-time P4 grants were issued under this approval and consumed once. Existing unrelated unused grants were not consumed.

## Slice results

| Offset / limit | Equities | REVIEW_REQUIRED | INSUFFICIENT | Snapshot / selection appends | Item appends | Provider calls |
|---|---:|---:|---:|---:|---:|---:|
| 0 / 40 | 40 | 40 | 0 | 40 / 40 | 642 | 0 |
| 40 / 40 | 40 | 39 | 1 | 40 / 40 | 610 | 0 |
| 80 / 40 | 40 | 40 | 0 | 40 / 40 | 675 | 0 |
| 120 / 40 | 40 | 37 | 3 | 40 / 40 | 590 | 0 |
| 160 / 40 | 40 | 39 | 1 | 40 / 40 | 632 | 0 |
| 200 / 40 | 39 | 36 | 3 | 39 / 39 | 595 | 0 |
| **Total** | **239** | **231** | **8** | **239 / 239** | **3,744** | **0** |

Each slice's persisted hash, status, item count, fixed cutoff and immutable assignment lineage matched its preflight. All snapshots/selections were new; none were reused. The existing V3 append design also created **239 lineage rows**, one per snapshot. This is lineage recording, not an assignment change.

For each slice, provider usage and retained source/observation/history fingerprints stayed unchanged. Historical snapshot/item/selection/lineage fingerprints, holdings, transactions, canonical profile/methodology assignment projections and provider-control fingerprints matched the baseline. Development database cron jobs remained empty and cron run count stayed zero. No destructive write, inferred evidence, HOLD fallback or unexpected lineage was observed.

## Final reconciliation

| Component | Before | After | Delta |
|---|---:|---:|---:|
| Canonical snapshots | 1,246 | 1,485 | +239 |
| Snapshot items | 18,657 | 22,401 | +3,744 |
| Selection events | 717 | 956 | +239 |
| Immutable lineage rows | 239 | 478 | +239 |
| P4 issued grants | 1,203 | 1,209 | +6 |
| P4 consumed-grant audits | 1,196 | 1,202 | +6 |
| Provider usage events | 1,720 | 1,720 | **0** |
| Database cron runs | 0 | 0 | **0** |

Current canonical view: **239/239** equities, all **239** current snapshots match this run. Exactly one cutoff/version/basis contract; six distinct consumed grants.
All equities: **231 REVIEW_REQUIRED / 8 INSUFFICIENT / 0 READY**.
Frozen cohort: **111/111 present; 111 REVIEW_REQUIRED / 0 READY**.
These are now **persisted, selected canonical states**, not prospective diagnostics.

Frozen membership and per-member values are unchanged. Total **132,585,696 paise**. Approved JSON SHA-256 remains `79f551558333adc1f37d6a26298d8088ee02db3161f03c6d6e59f9a19a93fc27`; remote Git blob remains `6583d106d7b53b0f4adcdca3f6f4d600f742658f`. Original frozen 109 REVIEW_REQUIRED + 2 STALE capture is preserved; current validation does not rewrite that historical manifest. All 239 equities / 248 holdings remain visible, including the previously excluded 128-equity intelligence group.

Release minimum is unchanged: **100 of the same 111 AND 119,327,127 paise** from those same successful members at the full deterministic endpoint. Action A removed no underlying blocker and is **not evidence remediation or usable-intelligence progress**.

## Hosted acceptance and boundaries

Authenticated Development Research Overview/Evidence and expanded provenance loaded successfully with the DEVELOPMENT marker, canonical profile consistency, no JavaScript errors and no alerts. The previously count-based price-history row now visibly reports **ADJUSTMENT_CALENDAR_ALIGNMENT_NOT_PROVEN / REVIEW_REQUIRED**; missing and document-review reasons remain explicit. Current snapshot lineage is shown. Browser operations were read-only, including two READ_CACHE price reads.

Frontend source remains the tested READY Preview application at `94c9ff092adc8f46710b30ada8ece23962702ce0`; later repository changes are documentation only. No application redeployment or repeated general audit is required by this action.

Production/main access or mutation: none in this action. Provider calls/acquisition, P8, R2 writes, scheduler actions, Auth/RLS changes, migrations, historical source mutations and restore: **none**. The authorized Development snapshot/item/selection/lineage and scoped grant/audit appends above are the only database writes performed.

Next deliverable: [one consolidated Action B matrix](PortfolioAI_V1_4_ACTION_B_REMEDIATION_MATRIX_2026-10-05.md). Provider execution remains separately unauthorized. Restore proof remains mandatory at V1-9. V1-1/2/3 remain closed.
