# BHARTIARTL Results scope repair — 8 November 2026 (IST)

BHARTIARTL's December 2025 quarter selected a valid standalone filing between consolidated September 2025 and March 2026 filings. R5 correctly refused those mixed-scope comparisons, leaving December 2025, March 2026 and June 2026 Not Rated. The ordinary missing-quarter campaign already considered December covered, so it did not recover its consolidated counterpart.

## Verified source and explicit correction

The NSE integrated-filing catalogue identifies one original consolidated December 2025 submission. The original XML and iXBRL independently reproduce the same issuer/ISIN, quarterly duration, consolidated scope, currency and complete financial trio:

| December 2025 selection | Before: standalone | After: consolidated |
| --- | ---: | ---: |
| Operating revenue, ₹ crore | 30,854.80 | 53,981.60 |
| Total profit for the period, ₹ crore | 4,090.70 | 8,502.80 |
| Diluted EPS, ₹ per share | 6.80 | 11.02 |

- [Original consolidated iXBRL](https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_INDAS_140636_05022026194814_iXBRL_WEB.html)
- [Original consolidated XML](https://nsearchives.nseindia.com/corporate/xbrl/INTEGRATED_FILING_INDAS_1619556_05022026074814_WEB.xml)
- Canonical selected source: `5648e6c5-2ed6-4f6f-9ad3-b8fc0fc702ac`.
- Preserved standalone source: `b5928597-5290-4f43-9286-3e917a7aab1c` (all three original observations independently confirmed intact).
- Private correction proof SHA-256: `9c9d8880aa802f389a7e13b213bfa056aafb52586d19ec062a0c54b5568a8c99`.

Only the three December selection rows changed, atomically, with decision basis `CORRECTION`. The existing database audit trigger recorded the updates. The complete before selection, original XML, source catalogue and correction proof are retained in private R2. The ordinary HTML financial record retains the established compact manifest plus original HTML hash; it does not claim to retain HTML bytes. The paired retained XML independently supports the exact new figures. The original standalone figures remain immutable observations. Other BHARTIARTL selections are unchanged.

The first hosted attempt timed out on the public NSE catalogue before financial writes. Its successfully captured full catalogue was retained under SHA-256 `190d98e43d30dd4576690625acaecb18f03a301698f166fc459fb1aa1bf081a6`. Hosted replay requires that exact archive and still downloads and independently parses both financial renditions. Missing/mutated catalogue, conflicting renditions, wrong issuer/scope/duration, stale selections or incomplete trios fail closed. A repeated repair recognizes the already corrected source and makes no further decision changes.

## Actual application-engine readback

Successful correction run [42405151274](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/42405151274) verified the initial three Not Rated recoveries. Successful complete-window/idempotence run [42405590454](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/42405590454), job `128502476057`, verified every visible quarter with the unchanged application comparison and grading engine:

| Quarter ended | Verified grade | Revenue QoQ | Total PAT QoQ |
| --- | --- | ---: | ---: |
| March 2025 | Mixed | 6.09% | -22.68% |
| June 2025 | Mixed | 3.31% | -40.51% |
| September 2025 | Mixed | 5.42% | 16.56% |
| December 2025 | Mixed | 3.52% | -1.71% |
| March 2026 | Strong | 2.60% | 8.76% |
| June 2026 | Strong | 5.70% | 8.26% |
| September 2026 | Strong | 3.99% | 6.98% |

These are the existing company-only quarterly operating-trend grades. Industry peer ranking and investment-action inference are unchanged. No grade was hardcoded or forced.

## Read-only audit omission corrected

The shared census exporter stopped at June 2026, although the seven-column audit and UI include September 2026 and that quarter already has canonical selections. The exporter now includes September 2026 and its existing QoQ/YoY baselines. This changes audit input completeness only; it adds no financial observations or grading rule. A regression guards the rolling quarter and both baseline periods.

Successful full census [42405590742](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/42405590742) now reports **228 Not Rated cells across seven columns**, including **84** for September 2026. The earlier 409-cell report overstated the count because it omitted selected September inputs. This correction must not be reported as newly fetched or newly source-qualified quarters. Of 1,777 qualified company-quarters in this seven-column census, 1,606 are rated and 171 remain unrated; another 57 lack complete qualified inputs. The R4 eight-quarter missing-data backlog is a separate measure.

## Validation and boundaries

All 613 local Results Python regressions pass. The hosted run passed 11 repair/export regressions and 33 TypeScript actual-engine/comparison/grading tests, architecture checks, TypeScript, ESLint and the production build. Separate Supabase reads confirmed the new exact consolidated trio and preservation of all three standalone observations. The rerun reported `BHARTI_SCOPE_REPAIR_ALREADY_APPLIED`.

Changed implementation files are the dedicated repair script and workflow, Python guard tests, the live BHARTIARTL engine regression and the read-only census exporter. Canonical authorities remain `fundamental_observations` and `fundamental_observation_decisions`, consumed through the existing Results repository and R5 engine. No UI components, layout, styles, grading model, financial formulas, schema, migrations, RLS, holdings, transactions, main or Production were changed. No authenticated browser visual-acceptance claim is made; verification covers live database state, actual application engine and build. Refresh the Development Results page to load the corrected selections.
