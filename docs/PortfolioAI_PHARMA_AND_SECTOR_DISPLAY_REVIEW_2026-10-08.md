# Pharma and sector research display review — 8 October 2026

**Decision: corrections required before complete sector/subprofile integration is FINAL.**
The common shell and access to retained canonical contract results are working.
Pharma primary-subprofile summaries and deep methodology displays are inconsistent.
Most other held profiles expose contract results without a specialist overview.
This audit narrows the earlier Gate 5 acceptance: its passing layout and interaction
checks remain valid, but they did not establish complete integration of every
sector's methodology presentation. That broader acceptance was too broad.

## Scope and evidence

- Hosted Development revision: `a2e9aa1f17ad05e3bfd68e5084f7605c3eda29ab`.
- READY deployment: `dpl_AmgC8F3ckvFA9LP7W8t14VBHuuAE`.
- Authenticated browser review: 52 stock pages, one representative from each of the 45 held research profiles, all five Pharma subprofiles, an additional CDMO validation anchor and the intentionally unresolved BLUEJET case.
- Current canonical portfolio projection: 239 equity snapshots across 248 holdings; 26 Pharma holdings and all five Pharma primary codes are present. BLUEJET retains a null primary.
- All 50 main sample pages had matching canonical profile/authority in the header disclosure and selected-contract workspace, and no document overflow at 1440px. Runtime errors and blocked provider-execution attempts: zero across the main and additional runs.
- Source review compared Development with `r4n-pharma-subprofile-architecture` (`239c209005b549ce4c6eff260d284091afe972fc`), `pharma-research-integration` and `sector-research-profile-architecture`; the five-method authority map and the inspected Gate-J numeric methodology modules already exist in Development. The inspected API, Global Generics, Biosimilars and CDMO modules and authority map match the R4N branch content.
- 198 focused tests passed across 25 files: 103 routing/subprofile/display tests plus 95 Pharma portability and sector-methodology tests.
- Browsers accessed the hosted app only; no local application was started. No provider refresh, stored classification change, evidence approval, score execution or database mutation was performed.

[Sanitized profile review evidence](research-ui-sector-review-evidence/profile-display-review-2026-10-08.json)
contains the 45-profile matrix. Private screenshots, auth state and access URLs are
not committed. Representative screenshots were inspected by the agent; the other
sample pages were checked through rendered DOM and their selected read responses.
This is not a revalidation of every issuer disclosure or a claim that every
current financial value and methodology is score-ready. It covers all **held**
profiles, not hypothetical future sectors outside the current portfolio.

## Pharma results

These are primary research/business-model subprofiles, not replacements for
canonical exchange sector/industry labels. Primary and secondary exposures must
remain distinct, reviewed and versioned.

| Stock | Canonical primary in disclosure/workspace | Default top summary | Deep Pharma research |
| --- | --- | --- | --- |
| ALIVUS | `API_BULK_DRUGS` — RESOLVED | Awaiting reviewed assignment | Incorrectly blocked by older assignment source |
| TORNTPHARM | `DOMESTIC_FORMULATIONS` — RESOLVED | Domestic Formulations — Reviewed | Renders retained legacy specialist panel |
| AUROPHARMA | `GLOBAL_GENERICS` — RESOLVED | Awaiting reviewed assignment | Incorrectly blocked by older assignment source |
| BIOCON | `BIOPHARMA_BIOSIMILARS` — RESOLVED | Awaiting reviewed assignment | Incorrectly blocked by older assignment source |
| AKUMS | `CDMO_CRAMS` — RESOLVED | Awaiting reviewed assignment | Incorrectly blocked by older assignment source |
| SYNGENE | `CDMO_CRAMS` — RESOLVED | Awaiting reviewed assignment | Same inconsistent source path |
| PPLPHARMA | `CDMO_CRAMS` — RESOLVED | Awaiting reviewed assignment | Same inconsistent source path |
| BLUEJET | No canonical primary — REVIEW_REQUIRED | Awaiting reviewed assignment | Correctly blocked; do not guess a primary |

The four supplied URLs correspond, in order, to BIOCON, ALIVUS, AUROPHARMA and AKUMS.
All five intended codes exist and are selected in canonical data. The visible
contradiction is not evidence that their methodology work is absent.

## Findings

### 1. High priority: competing assignment reads contradict canonical routing

`ResearchAssignmentSummary` reads `scoring.data.canonicalRoute`, which carries the
approved P7 IC1 assignment authority/version. `PharmaSubprofileSummary` instead
calls `usePharmaSubprofileResolution` and reads `research_subprofile_assignments`
through `researchSubprofileRepository`. `PharmaResearchWorkspacePanel` uses the
same older read and blocks before displaying detailed research when it is empty.

The inspected read responses contained no older assignment rows for ALIVUS,
AUROPHARMA, BIOCON, AKUMS and PPLPHARMA. TORNTPHARM has a reviewed Domestic
Formulations row there. Thus canonical RESOLVED routes coexist with an incorrect
"Awaiting reviewed assignment" summary and misleading "Subprofile review required"
blocker. `buildProgramBR6ScoringPresentation` also depends on that older resolver;
its displayed prerequisite can be misleading even though current evidence still
legitimately blocks a score. No unsafe live numeric score was observed.

Source locations: `src/features/research/PharmaSubprofileSummary.tsx:16`,
`src/data/researchSubprofileRepository.ts:140`,
`src/features/research/PharmaResearchWorkspacePanel.tsx:170`,
`src/features/research/programBR6Presentation.ts:40`.

**Required correction:** one canonical assignment presentation/access contract
must supply the header, methodology route, deep research and readiness reasons.
Show the resolved primary directly in the top block, with readable name and code;
keep detailed lineage in a disclosure. Do not manufacture legacy rows, reviewed
provenance, effective dates or overlays to make components render. Missing richer
assignment metadata and a real conflict must remain explicit. A resolved primary
and missing mandatory evidence are separate states.

### 2. High priority: completed Gate-J methodology panels are disconnected

The R4N Research page renders `PharmaGateJPortabilityPanel` and
`PharmaGateJReferenceClassificationPanel`. Current Development's `ResearchPage`
does not import or render either. These components and the five-subprofile
`PHARMA_GATE_J_METHOD_AUTHORITIES` map still exist in Development. Their component
and portability tests pass in isolation, which does not prove page integration.

**Required correction:** restore the approved subprofile-to-methodology authority
presentation inside the stock-specific shell extension. Display existing authority
and version, applicable evidence families and explicit gaps for any correctly
assigned stock. Reference-company validation results belong in labelled historical
or validation disclosures; they must not become the current stock's live score.
Do not merge an older whole Research page over the shared shell or rebuild the
completed five methodologies.

### 3. High priority: complete subprofile evidence display is not proven

The six main Pharma samples all return the same 19 cached requirement codes,
including revenue/EPS growth, ROCE, cash conversion, leverage, valuation, regulatory
risk and market history. No distinct API customer/capacity, Biosimilars pipeline/
commercialization or CDMO visibility/client/capacity requirement identifiers appear
in those selected snapshot items. Their specific contracts do exist in
`pharmaSubprofileContracts.ts`, but the deeper contract-driven panel is blocked
for five of these six samples by finding 1.

This does not establish that raw evidence or methodology contracts are absent;
it establishes that these pages do not currently demonstrate the full distinct
subprofile requirements/results. The cache uses broader requirement identifiers,
so an explicit mapping/completeness audit is necessary before declaring a missing
business signal fully represented by a broad parent requirement.

**Required correction:** reconcile each existing subprofile's mandatory signal set
with the selected immutable snapshot and retained raw evidence. Display each
applicable requirement, its result or exact missing/review blocker, provenance,
period, unit and scope. Expose absent snapshot mappings explicitly; do not invent
results, coverage percentages or score readiness. Any cache materialization/write
needed later remains a separate implementation action.

### 4. Medium priority: 43 held profiles have retained-results-only presentation

Only canonical BANK and PHARMA have registered specialist snapshot adapters in
`researchProfileUiContract.ts`. The remaining 43 held parent profiles correctly
retain their own snapshot requirements and authority in `ProfileResearchBlocks`,
and disclose the missing specialist presentation. Their current overview is a
safe retained-results view rather than a complete business-model dashboard.
Financials and Quality/Growth also have broad evidence grouping paths outside the
registered specialist contracts; their existence does not prove complete
sector-specific metric selection.

**Required correction:** expand the presentation registry from existing approved
methodology contracts, using reusable cards and requirement families. Keep
classification, methodology authority, presentation capability, evidence readiness
and execution readiness separate. A pending score adapter is not the same as a
missing methodology. Verify all tabs against that profile's contract, not only
the overview's retained-item list.

### 5. Medium priority: detailed classification hierarchy is unavailable

All 50 main sample header disclosures explicitly say macro-economic sector,
basic industry, sub-sector and group are unavailable in the current shared
classification projection. Sector/industry are displayed, and Pharma research
subprofiles are available through canonical routing, but the complete requested
classification hierarchy is not currently exposed there.

**Required correction:** add only source-backed fields through the shared canonical
classification access path. Do not infer an exchange sub-sector from a research
subprofile, or reinterpret an unapproved provider label as canonical classification.

## Stock-name-card follow-up: jewellery classification mismatch

The supplied AKUMS/AUROPHARMA screenshots reproduce finding 1. An additional
hosted read-only inspection of TITAN, GOLDIAM and SKYGOLD completed with zero
runtime errors and zero provider-execution attempts.

| Card | Observed issue | Review disposition |
| --- | --- | --- |
| AKUMS | Canonical CDMO_CRAMS route, older summary says awaiting assignment | Pharma assignment-display contradiction; no extra primary subprofile inferred |
| AUROPHARMA | Canonical GLOBAL_GENERICS route, older summary says awaiting assignment | Same Pharma assignment-display contradiction |
| TITAN | Sector Gems and Jewellery; industry Gems & Jewellery; research profile JEWELLERY | Redundant/variant labels; no complete official four-tier classification is demonstrated |
| GOLDIAM | Sector Gems and Jewellery; industry Gems, Jewellery And Watches; research profile JEWELLERY | Mixed-level/normalization concern; not evidence of multiple reviewed sub-sectors |
| SKYGOLD | Sector Textiles Apparels & Accessories; industry Gems & Jewellery; research profile JEWELLERY | Known economic classification-pair mismatch requiring reconciliation |

SKYGOLD's sector/industry pair already appears as a REVIEW_REQUIRED case in
`PortfolioAI_GATE_K_K1_SECTOR_INVENTORY_PRIORITY_LOCK.md`, section 6, and is retained
in the older frozen portfolio snapshot. The current P7 research assignment is
RESOLVED to JEWELLERY. These are different dispositions: resolved methodology
routing does not certify that the economic hierarchy has been reconciled.

Research and the shared portfolio classification read
`current_security_enrichment_v1`. Its selected sector and industry values are
separate attributes; the V1 classification view's conflict flag only tests the
selected observations' statuses, rather than validating their complete hierarchy
or comparing all competing evidence. Thus a displayed "canonical" label is not
proof that an incoherent selected pair has been repaired.

The repository's frozen November 2022 NSE taxonomy identifies **Gems, Jewellery
And Watches** as a BASIC_INDUSTRY beneath Consumer Durables, not as an INDUSTRY.
This reference demonstrates the level ambiguity in GOLDIAM's card. It is not
sufficient evidence to overwrite any company's current classification with that
historical taxonomy path. Verify current issuer/exchange assignment, source,
effective date and taxonomy version before a canonical correction.

**Required correction:** keep official economic classification and research
methodology as distinct, clearly labelled parts of the card. Use source-backed
hierarchy codes/labels rather than merging synonyms by appearance. Show genuine
classification review/conflict states and provenance. Reconcile the shared
classification authority for SKYGOLD so all consuming pages agree; changing its
card alone or copying JEWELLERY into its sector would hide the defect. Do not infer
multiple primary subprofiles from different labels or fabricate secondary business
exposures. Owner role UNCLASSIFIED is a separate portfolio setting and is not a
sector-classification failure.

## All held research profiles: observed presentation matrix

Every row below has matching canonical profile and methodology authority in the
rendered disclosure/workspace, accessible retained requirement items and no
1440px document overflow. Counts describe the selected cached snapshot, not
validated evidence completeness. This matrix does not certify each financial
result or replace methodology approval.

| Canonical profile | Selected retained requirements | Observed snapshot status | Specialist overview |
| --- | ---: | --- | --- |
| `AGRI_PROCESSING` | 19 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `AGRO_FERTILISER` | 11 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `AUTO_COMPONENTS` | 11 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `AUTO_OEM` | 11 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `BANK` | 23 | CONFLICTING | Registered |
| `BRANDED_CONSUMER_FMCG` | 11 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `BUSINESS_SERVICES` | 20 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `CAPITAL_EQUIPMENT_ELECTRICAL` | 11 | INSUFFICIENT | Not registered; own contract results retained |
| `CAPITAL_MARKETS_AMC` | 11 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `CEMENT_BUILDING_MATERIALS` | 19 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `COMMODITY_PROCESS_CHEMICALS` | 11 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `CONSUMER_DURABLES` | 19 | INSUFFICIENT | Not registered; own contract results retained |
| `DEFENCE_AEROSPACE` | 11 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `DIVERSIFIED_CHEMICALS_PETROCHEM` | 21 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `ENVIRONMENTAL_SERVICES` | 19 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `FINANCIAL_HOLDING_COMPANY` | 19 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `FINTECH_PLATFORM` | 11 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `GENERATION_INTEGRATED_UTILITY` | 11 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `HOSPITAL` | 11 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `HOSPITALITY_LEISURE` | 20 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `INDUSTRIAL_PRODUCTS` | 19 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `INSURANCE` | 11 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `INTEGRATED_REFINING_PETCHEM` | 11 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `IT_BPM_SERVICES` | 20 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `IT_DIGITAL_INFRA_HARDWARE` | 11 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `IT_SERVICES` | 11 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `IT_SOFTWARE_PRODUCTS_PLATFORMS` | 11 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `JEWELLERY` | 19 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `LOGISTICS` | 19 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `MIDSTREAM_CITY_GAS` | 11 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `NBFC_LENDING` | 24 | INSUFFICIENT | Not registered; own contract results retained |
| `NON_FERROUS_DIVERSIFIED_METALS` | 11 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `OIL_OPERATIONS` | 18 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `PHARMA` | 19 | REVIEW_REQUIRED | Parent adapter; Pharma findings above apply |
| `PROJECT_EPC` | 11 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `REAL_ESTATE_DEVELOPER` | 19 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `REGULATED_NETWORK` | 11 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `RENEWABLE_IPP` | 11 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `RETAIL_COMMERCE` | 20 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `SHIPPING` | 18 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `SOLID_FUELS_MINING` | 19 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `STEEL_FERROUS` | 11 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `TELECOM_INFRA` | 19 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `TELECOM_OPERATOR` | 18 | REVIEW_REQUIRED | Not registered; own contract results retained |
| `TEXTILES_APPAREL` | 20 | REVIEW_REQUIRED | Not registered; own contract results retained |

## Correction sequence and acceptance decision

1. Unify canonical assignment presentation; remove the false Pharma primary-review blockers while preserving true BLUEJET/unreviewed/conflict cases.
2. Reconnect the existing Gate-J methodology authority and reference-validation presentation to the shared shell.
3. Reconcile all five subprofiles' complete required-signal/result coverage, including overlays, with current immutable snapshots.
4. Complete registry-driven sector-specific presentation and verify Financials, Quality/Growth, Ownership, Valuation, Documents and Evidence against existing contracts.
5. Re-run authenticated hosted checks for all five Pharma classes, arbitrary additional stocks, the genuine unresolved case and representatives of all 45 held profiles. Add integration regressions where canonical assignments exist but older rows do not; tests must assert the page actually renders the selected authority and distinct required signals.

**Final decision:** keep the common shell; do not certify the complete sector/
subprofile presentation as FINAL yet. Fix integration and display independently
of ongoing research acquisition. Missing evidence must continue to block scores
and recommendations. The completed methodology work should be reused, not
recreated, and the previous Gate 5 PASS must not be interpreted as proof that
these newly identified integration gaps are closed.

This review changes no application code or stored research facts and does not
deploy or approve scoring, recommendations, evidence or methodology changes.
