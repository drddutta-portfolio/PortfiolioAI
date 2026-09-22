# R4N Gate F — TORNTPHARM Public / Official Source Discovery Dry Run

**Status:** Local-first source-discovery contract only  
**Profile:** PHARMA_V1  
**Primary subprofile:** DOMESTIC_FORMULATIONS  
**Material overlay:** GLOBAL_GENERICS  
**Discovery contract:** `TORNTPHARM_PUBLIC_OFFICIAL_DISCOVERY_V1`

## Purpose

Identify a public/official source spine for the 12 `PUBLIC_OFFICIAL_FIRST` business-model requirements without fetching evidence into PortfolioAI, reviewing it into a canonical evidence state, or ingesting any observation.

This stage deliberately separates:
1. **source discovery** — candidate artifact exists;
2. **content review** — artifact actually contains compatible evidence;
3. **history completion** — minimum/preferred observation counts are satisfied;
4. **ingestion** — a separately authorized write stage.

At this checkpoint only step 1 is performed.

## Public / official source spine

| Code | Artifact | Lane | Period / date | Discovery use |
| --- | --- | --- | --- | --- |
| `TORRENT_ANNUAL_REPORTS_HUB` | Torrent Pharmaceuticals Annual Reports | Issuer official | Historical archive through FY2025-26 | Enumerate annual history and older comparable disclosures |
| `TORRENT_AR_2025_26` | Integrated Annual Report 2025-26 | Issuer official | FY2025-26 | Current annual business, market, launch, manufacturing and geographic evidence candidate |
| `TORRENT_AR_2023_24` | Integrated Annual Report 2023-24 | Issuer official | FY2023-24 | Historical field-force, India therapy, licensing and market-context candidate |
| `TORRENT_QUARTERLY_RESULTS_HUB` | Torrent Pharmaceuticals Quarterly Results | Issuer official | Quarterly archive including FY2025-26 / FY2026-27 | Enumerate results releases, transcripts and period-by-period US/export evidence |
| `TORRENT_Q4_FY26_RELEASE` | Q4 FY26 Results Release | Issuer official | 22 May 2026 | Current results, market performance and launch candidate |
| `TORRENT_SEBI_DISCLOSURES_HUB` | SEBI / LODR Disclosures | Listed-company disclosure | Current + historical | Material transaction and event discovery |
| `FDA_INDRA_WARNING_2019` | FDA Warning Letter — Indrad | Regulator official | 8 Oct 2019 | Historical regulatory action state |
| `FDA_INDRA_CLOSEOUT_2024` | FDA Closeout Letter — Indrad | Regulator official | 4 Sep 2024 | Later regulator state needed so historical warning is not treated as current by itself |

## Requirement mapping

All 12 public/official-first rows have at least one candidate source family. Their state remains:

- `CANDIDATE_SOURCE_FOUND`
- `evidenceState = NOT_REVIEWED`

No source is treated as satisfying an evidence contract yet.

| Requirement | Candidate source families |
| --- | --- |
| Domestic Revenue Growth | annual-report archive, FY2025-26 annual report, quarterly-results archive |
| Field Force Productivity | annual-report archive, FY2023-24 annual report, FY2025-26 annual report |
| Domestic Exposure Materiality Review | FY2025-26 annual report, FDA warning, FDA closeout |
| New Launch Contribution | FY2025-26 annual report, Q4 FY26 release, quarterly-results archive |
| Domestic Pipeline Evidence | FY2025-26 annual report, quarterly-results archive, SEBI/LODR disclosures |
| In-licensing / M&A Execution | FY2023-24 annual report, FY2025-26 annual report, SEBI/LODR disclosures |
| Regulatory Site Status | FDA warning + FDA closeout + FY2025-26 annual report |
| Export / US Revenue Growth | annual-report archive, FY2025-26 annual report, quarterly-results archive, Q4 FY26 release |
| Pipeline / Launch / Approval Evidence | FY2025-26 annual report, quarterly-results archive, SEBI/LODR disclosures |
| US Generic Price Erosion | quarterly-results archive, annual-report archive |
| Generics Volume / Mix | quarterly-results archive, annual-report archive |
| Complex / Specialty Generics Mix | FY2025-26 annual report, annual-report archive, SEBI/LODR disclosures |

## Excluded from this dry run

The following are intentionally excluded from the 12-row public/official discovery scope:
- **Brand & Therapy Leadership** — `LICENSED_REQUIRED`;
- **Chronic / Acute Mix** — `PUBLIC_OR_LICENSED`.

Their licensed-source gates remain separately controlled.

## Safety state

- source fetch authorized: **false**
- content review completed: **false**
- evidence ingestion authorized: **false**
- paid/licensed provider call authorized: **false**
- production write authorized: **false**
- scoring/recommendation/sizing: **not part of this gate**

## Next safe step

After localhost visual approval and full local validation, the next Gate F slice should be **artifact-level content review planning** for the 12 public/official-first rows:
- enumerate exact periods/documents from the source hubs;
- mark whether each candidate artifact is likely to contain the required evidence shape;
- calculate history gaps;
- preserve `NOT_REVIEWED` until actual content is examined;
- still perform no ingestion.
