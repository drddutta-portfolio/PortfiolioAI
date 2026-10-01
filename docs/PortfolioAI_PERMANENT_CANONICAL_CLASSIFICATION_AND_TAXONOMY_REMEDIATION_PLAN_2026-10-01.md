# PortfolioAI permanent canonical classification and taxonomy remediation plan

Date: 1 October 2026  
Mode: planning and read-only audit only  
Repository: `drddutta-portfolio/PortfiolioAI`  
Branch audited: `PortfolioAI-Development`  
Repository audit began at `1fad7dfbc4a1be4e66d1ed9c850e420d9a34cc66`; concurrent P8-B3 work advanced the verified plan parent to `5885d488335fc95c9c231c011aa4293f1d7d8e85`.
Database audited: hosted `PortfolioAI Dev` (`lrgpjimipfkyoqbpsqzz`)  
Result: **A. PLAN READY FOR OWNER APPROVAL**

## 1. Executive decision

PortfolioAI should replace the current string-selection model with one versioned, hierarchical, evidence-backed classification authority. The permanent economic hierarchy must be:

```text
NSE/BSE official economic classification
Macro-Economic Sector → Sector → Industry → Basic Industry

PortfolioAI analytical classification
Business Model / Methodology Profile → Specialised Subprofile where required
```

These are connected by explicit, versioned mappings and assignments, but are not the same taxonomy. Economic classification describes what a company is in the exchange hierarchy. Methodology determines how PortfolioAI analyses that business. Neither may be inferred in a page, from a company name, by wildcard matching, or from the other layer alone.

The final current read authority should be `current_security_classification_v2`, consumed through one repository/service contract. `current_security_enrichment_v2` may compose this classification with market-cap facts, but must not own or recalculate classification. During cutover, V1 names may exist only as forwarding compatibility views over V2; they may not remain independent authorities.

## 2. Verified current-state audit

### 2.1 Repository and P8 state

- The ordinary local workspace is stale at `c567a3b` and contains unrelated untracked user files; it was not modified.
- Remote `PortfolioAI-Development` and the audited P8 verification worktree are at `1fad7df`.
- P8-B2 is COMPLETE / PASS / CLOSED.
- Hosted P8 historical evidence currently contains:
  - `p8_historical_security_identities`: 4,524 rows;
  - `p8_historical_source_archives`: 32 rows;
  - `p8_historical_listing_observations_v3`: 562,790 rows;
  - `p8_historical_universe_runs_v3`: 32 rows;
  - `p8_historical_universe_members_v3`: 144,768 rows.
- P8-B3 is ACTIVE at its separately authorized official-source canary boundary. Three of four local probes are proven; the NIFTY 500 TRI route is remediated but requires rerun. Its hosted migration and bulk acquisition remain unauthorized. This classification plan neither changes nor expands that authority.

### 2.2 Current portfolio classification

Read-only hosted queries verified:

```text
Open equities                         239
Classified by V1                      239
Distinct selected sector labels        32
Distinct selected industry labels      85
V1 projected conflicts                  0
Equities with >1 sector observation    43
SECTOR decisions                      239
INDUSTRY decisions                    239
```

Selected sector evidence is mixed:

```text
STOCK_MASTER                       207 observations
TRENDLYNE_MCP                       48 observations
OWNER_REVIEWED_CLASSIFICATION       31 observations
```

Selected/available industry evidence is also mixed:

```text
OWNER_REVIEWED_CLASSIFICATION      191 observations
TRENDLYNE_MCP                       48 observations
```

The current selected labels include spelling variants, synonyms and mixed levels, including `FMCG` versus `Fast Moving Consumer Goods`, `Aerospace & Defence` versus `Aerospace & Defense`, and broad sectors beside business types such as banks, NBFCs, AMCs, insurers and fintech platforms.

The 43 multi-sector evidence cases include HDFCBANK, CIPLA, RELIANCE, NHPC, TITAN, ASTRAMICRO, MTARTECH, WABAG and PAYTM. Some are harmless vocabulary differences; others are genuine hierarchy or business-meaning disputes. V1 does not distinguish those cases.

### 2.3 Exact V1 defect

`current_security_classification_v1` joins `security_attribute_decisions` to one `selected_observation_id` per attribute, then projects `max(selected value)`. Its `has_conflict` is:

```sql
bool_or(selected_observation.evidence_status = 'CONFLICTING')
```

It does not compare all applicable observations, source priorities, hierarchy paths, validity windows or contradictory values. Therefore a selected row marked `AVAILABLE` can yield `has_conflict = false` even when other stored observations disagree. This is selection without reconciliation.

`current_security_enrichment_v1` then republishes that projection as the application authority and combines it with market-cap state. It can report classification as available without exposing the unresolved evidence set.

### 2.4 Taxonomy registry is incomplete and not the active authority

Hosted Development contains:

```text
classification_taxonomies          2
sectors                             8
industries                          9
classification_source_mappings     9
```

Both taxonomies define only `SECTOR` and `INDUSTRY`. They do not model Macro-Economic Sector or Basic Industry, do not cover the portfolio, and are not the source used by the current V1 projection. One sector/industry pair is ETF-specific, further showing that these tables are a partial historical registry rather than the permanent equity hierarchy.

### 2.5 Methodology authorities are fragmented

The legacy database contains 13 scoring profiles, 31 active wildcard rules, only 4 reviewed `security_scoring_profile_assignments`, 5 Pharma subprofile contracts and 6 subprofile assignments (five development fixtures plus TORNTPHARM).

Wildcard rules include patterns such as `%IT%`, `BANK%`, `%FINANCIAL SERVICES%`, `%PHARMA%`, `%POWER%`, `%METAL%` and `%CONSUMER%`. They are unsafe as permanent routing because a spelling or mixed hierarchy label can select the wrong engine.

The application also has a newer hard-coded industry-first TypeScript router. It is safer and fail-closed in many cases, but still normalizes strings and enumerates label variants in code. This is another mapping surface that can drift from the database.

P7-IC1 is the most complete current analytical authority and must be preserved:

```text
Equities                           239
Methodology RESOLVED               238
REVIEW_REQUIRED                      1 (BLUEJET)
Deferred methodology engineering     0
Resolved with complete R7 policy    238
```

That registry is primarily a versioned repository artifact, not equivalent to the four legacy database assignments. It must be imported/referenced as a frozen starting version, then revalidated after economic classification correction.

### 2.6 Existing application consumers

The shared UI path is mostly sound structurally:

```text
current_security_enrichment_v1
→ loadSecurityEnrichment()
→ usePortfolioEnrichment() / usePortfolioView()
→ applySharedClassification()
→ Dashboard, Holdings, Portfolio Structure and other portfolio consumers
```

Direct current-classification/enrichment consumers found in the repository include:

- `src/data/enrichmentRepository.ts`;
- `src/data/researchRepository.ts`;
- `src/data/researchCoverageRepository.ts`;
- `src/features/portfolio/sharedClassification.ts`;
- `src/features/portfolio/usePortfolioView.ts`;
- Dashboard and `DashboardAllocationPerformance`;
- Research and Research Coverage;
- `src/data/scoringRepository.ts`;
- `researchProfileRouting.ts`, `scoringProfileResolution.ts`, coverage and materializer modules;
- `discover-trendlyne-pharma-history-contract`;
- `refresh-bank-benchmark`;
- `p7-ic2-materialize-readiness`;
- `refresh-trendlyne-classification`;
- P4B classification/portfolio rollout functions;
- `refresh-security-enrichment`;
- the machine-readable authority registry and architecture tests.

R8/R9/Movement/R10 currently consume downstream P7 canonical state rather than independently classifying companies, but their lineage must be changed to require the V2 classification and methodology assignment versions.

### 2.7 New-stock gap

`create_manual_security_v1` verifies portfolio ownership and creates/resolves security identity. The UI allows an unresolved market mapping and a transaction can be recorded while CMP is unavailable. That is acceptable for ledger preservation, but there is no single mandatory classification/methodology onboarding state machine preventing the new equity from entering specialised research/scoring. Classification onboarding must therefore be an explicit downstream gate, not a hidden assumption of security creation.

## 3. Root causes

1. V1 stores flat attributes, not a versioned hierarchy path.
2. Selection and conflict detection are conflated; only the selected row controls conflict state.
3. Source priority is not enforced as a deterministic reconciliation contract.
4. Current labels come from different taxonomies and different hierarchy levels.
5. The partial taxonomy tables are disconnected from the active V1 projection.
6. Methodology routing exists in legacy wildcard SQL, TypeScript label matching, reviewed assignments and P7 artifacts.
7. Current decisions are upserted, so supersession history is weaker than append-and-select lineage.
8. New-stock creation has no mandatory classification/methodology readiness gate.
9. The current enrichment view owns too many facts and hides classification uncertainty.
10. Gate-K reconciliation artifacts were valuable, but their reconciled flat labels were materialized into V1 rather than a complete official hierarchy model.

## 4. Permanent target architecture

### 4.1 Canonical levels

| Layer | Level | Authority | Purpose |
|---|---|---|---|
| Economic | Macro-Economic Sector | NSE official; BSE fallback/cross-check | Highest exchange grouping |
| Economic | Sector | NSE official; BSE fallback/cross-check | Allocation and macro exposure |
| Economic | Industry | NSE official; BSE fallback/cross-check | Operating family |
| Economic | Basic Industry | NSE official; BSE fallback/cross-check | Most specific exchange classification |
| Analytical | Business Model / Methodology Profile | PortfolioAI versioned methodology registry | Exact research/scoring contract |
| Analytical | Specialised Subprofile | PortfolioAI evidence-backed assignment | Refinement where economics require it |

No `sub-sector` field should be introduced. Cross-cutting themes and exposures remain many-to-many overlays, not hierarchy nodes.

### 4.2 Proposed database objects

Names are design proposals; exact DDL requires a later approved migration design.

```text
classification_taxonomy_versions_v2
classification_nodes_v2
classification_node_edges_v2
classification_source_label_mappings_v2

security_classification_evidence_v2
security_classification_candidates_v2
security_classification_assignments_v2
security_classification_selection_events_v2
classification_review_cases_v2

methodology_registry_versions
security_methodology_assignments_v2
security_methodology_selection_events_v2
security_subprofile_assignments_v2 (or versioned extension of the existing table)

current_security_classification_v2
current_security_methodology_v2
current_security_analytical_readiness_v2
current_security_enrichment_v2
```

Key invariants:

- taxonomy nodes use stable IDs/codes; labels are presentation properties;
- a classification assignment references one complete path in one taxonomy version;
- evidence rows are immutable;
- candidate/review and canonical selection are separate;
- selection events are append-only and idempotent;
- correction supersedes a prior selection without deleting it;
- at most one selected current economic path per security and classification basis;
- unresolved material disagreement produces `REVIEW_REQUIRED`;
- methodology assignments reference the economic assignment, methodology version and evidence basis;
- current views use latest valid selection events, not latest row creation time;
- all exposed views are `security_invoker`; owner-scoped RLS protects user-owned review data;
- service write functions revoke `PUBLIC`/`anon`/`authenticated` execution unless explicitly required.

### 4.3 V2 current projection contract

`current_security_classification_v2` must expose at least:

```text
security_id
taxonomy_code / taxonomy_version
macro_sector_id / macro_sector_code / macro_sector_name
sector_id / sector_code / sector_name
industry_id / industry_code / industry_name
basic_industry_id / basic_industry_code / basic_industry_name
classification_status
assignment_id / selection_event_id
primary_source_code
primary_evidence_id
evidence_date / observed_at / retrieved_at
valid_from / valid_to
fresh_until / freshness_state
conflict_state / review_case_id / reason_codes
```

Allowed status should be finite and fail-closed, for example `RESOLVED`, `STALE`, `CONFLICTING`, `REVIEW_REQUIRED`, `SOURCE_UNAVAILABLE`, `NOT_APPLICABLE`.

Conflict detection compares all applicable authoritative candidates after exact source-label mapping. Different raw labels mapping to the same node are `NORMALIZED_AGREEMENT`, not a conflict. Different nodes at the same hierarchy level, invalid parentage, incomplete paths, or conflicting validity periods are explicit conflicts.

## 5. Evidence hierarchy

1. NSE official classification for NSE-listed equities, with full hierarchy and identity match.
2. BSE official classification for BSE-only equities, NSE cross-check and documented disagreement reconciliation.
3. Audited annual report, consolidated segment reporting, exchange filing, RHP/statutory disclosure, investor presentation, then official company site for business model/subprofile—not for silently replacing exchange classification.
4. Approved structured providers, cache first, for reconciliation or residual gaps only.
5. Owner review may select among evidenced candidates but may not invent a taxonomy path.

Every evidence record must retain raw labels/path, source URL/reference, exchange/security identity, source publication/effective date where available, retrieval time, payload/content hash, source record identity and terms/retention metadata.

## 6. End-state flowcharts

```text
CURRENT STOCK
    ↓
exact identity + exchange verified
    ↓
official classification evidence staged
    ↓
Macro Sector → Sector → Industry → Basic Industry reconciled
    ↓
one canonical V2 economic assignment selected
    ↓
business-model methodology revalidated
    ↓
specialised subprofile revalidated where required
    ↓
company evidence → R6 → R7 → R8/R9/Movement → Action → R10
```

```text
NEW STOCK
    ↓
identity verification
    ↓
NSE classification, or BSE authority for BSE-only stock
    ↓
canonical V2 hierarchy resolution
    ↓
methodology + specialised subprofile resolution
    ↓
analytical readiness gate
    ├── RESOLVED → normal research/scoring
    └── unavailable/conflicting → REVIEW_REQUIRED → scoring blocked
```

## 7. Stage-by-stage execution plan

### C0 — Immutable baseline

Produce a machine-readable baseline for all 239 equities containing identity, every SECTOR/INDUSTRY observation, selected decisions, source records, raw and normalized values, timestamps, V1 result, all four official hierarchy values available in Gate-K/cache, P7 methodology/R7 assignment, database profile assignment, subprofile assignment and every UI/backend consumer.

Include fingerprints of immutable evidence, selected V1 mapping and P8 table counts. Classify every legacy object into categories A–H in section 10.

**PASS:** 239 unique equities; no duplicate identity; all evidence and consumers inventoried; baseline fingerprint reproducible.  
**STOP:** any unexplained repository/database drift.

### C1 — Canonical taxonomy contract

Freeze level definitions, node identity, parent-child rules, source priority, validity semantics, normalization-only equivalence, conflict rules, freshness, review states and taxonomy version change procedure. Reconcile the Gate-K architecture with official NSE terminology. Do not preselect the number of nodes.

**PASS:** one approved contract and tests for hierarchy, synonym mapping, conflicts and invalid parentage.  
**Owner checkpoint C-A:** approve the contract and permission to design—not apply—the migration.

### C2 — Authoritative acquisition plan

Build a dry-run manifest from cache before calls:

1. reuse the frozen Gate-K official NSE/BSE artifacts where source identity, date and hierarchy are sufficient;
2. retrieve the current official NSE bulk classification once;
3. target only cache misses, incomplete hierarchy paths and changed identities;
4. use company/statutory evidence only for methodology/subprofile interpretation;
5. use Trendlyne only for unresolved reconciliation, never as a silent override.

**Initial call estimate from verified evidence:**

- Trendlyne calls planned initially: **0**;
- official NSE bulk retrievals: **1 campaign request** plus at most one identity master retrieval if not already fresh;
- prior Gate-K evidence covered 200 of 238 equities through official NSE bulk and left 38 reviewed residuals; with 239 current equities, the conservative targeted official residual ceiling is therefore **39 securities**;
- company-document/provider calls cannot truthfully be fixed until C0/C4 identifies changed or unresolved methodology cases. The exact campaign count is `unresolved business-model cases after cache reuse`, bounded by 239 and expected to be far smaller because 238 P7 methodologies already exist;
- Trendlyne ceiling is the residual after official exchange + company evidence, not 239. It must be zero unless an owner-approved dry-run manifest proves a residual need.

The execution package must state exact cache hits and exact planned calls before approval. No uncontrolled web scraping is allowed.

**Owner checkpoint C-B:** approve sources, quotas and exact manifest before any external call.

### C3 — Evidence staging

Create the approved additive local migration and staging functions. All acquisition writes immutable evidence/candidates only; it cannot change V1 or application output. Use stable source identities/hashes and idempotency constraints.

**PASS:** local clean replay, RLS/security tests, append-only tests, duplicate replay creates zero rows, and no current view changes.  
**Owner checkpoint C-C:** separately approve hosted Development migration application.

### C4 — 239-equity canonical reconciliation

For every equity emit one or more explicit dispositions:

```text
UNCHANGED_CONFIRMED
NORMALIZED_LABEL
SECTOR_CORRECTED
INDUSTRY_CORRECTED
BASIC_INDUSTRY_CORRECTED
BUSINESS_MODEL_REFINED
SUBPROFILE_CONFIRMED
SUBPROFILE_CHANGED
REVIEW_REQUIRED
```

Each row records previous V1 values, official hierarchy, source/evidence, proposed V2 path, reason codes and reviewer state. Suspicious combinations named in the request are mandatory review cases. No canonical selection occurs until the complete matrix is reviewed.

**PASS:** 239/239 have an evidence-backed proposed path or explicit blocker; zero silent overwrite.

### C5 — Canonical taxonomy materialization

Only after C4, derive actual represented Macro Sectors, Sectors, Industries and Basic Industries from the approved paths. Materialize stable nodes and exact raw-source-label mappings. Counts are outputs, not targets.

**PASS:** every resolved path has four correctly parented nodes; raw variants map explicitly; no orphan/duplicate node.

### C6 — Permanent database architecture

Implement the approved append/version/select objects from section 4 locally, then hosted Development only after separate approval. Preserve V1 data and immutable evidence. Add audit triggers/constraints, RLS, grants, indexes, service-only writers and generated TypeScript types.

**PASS:** migration replay, schema diff, lint/advisors, RLS, privilege, append-only and idempotency tests pass; before/after preservation counts match.

### C7 — Canonical current projection

Create `current_security_classification_v2` and an enrichment composition that joins it without redefining it. Conflict state must be derived from the candidate set and selection contract, not a selected row flag.

**PASS:** exactly 239 current rows, no duplicate security, every unresolved case visible, deterministic fingerprint stable across replay.  
**STOP:** do not switch consumers yet.

### C8 — Methodology reassignment

Load the frozen P7-IC1 registry as the prior version. For all 239 produce:

```text
previous methodology / R7 authority
V2 economic assignment
proposed methodology
unchanged or changed
reason and evidence
subprofile requirement/result
methodology version and authority
```

Retain correct methodology assignments by reference; do not recreate them. Changed assignments append a superseding version. Exact taxonomy-node/business-model mappings replace wildcard routing.

**PASS:** 239 dispositions; 238 prior resolved methodologies accounted for; BLUEJET remains review-required until evidence resolves it; changed methodologies receive explicit owner review.  
**Owner checkpoint C-D:** approve changed methodology/subprofile assignments.

### C9 — Pharma reconciliation

Reconfirm each applicable company against the approved five specialised subprofiles:

```text
API_BULK_DRUGS
DOMESTIC_FORMULATIONS
GLOBAL_GENERICS
BIOPHARMA_BIOSIMILARS
CDMO_CRAMS
```

Economic hierarchy does not replace this layer. Use consolidated segments, filings and approved company evidence. Preserve TORNTPHARM and other correct assignments; supersede only with stronger evidence and owner approval. BLUEJET must be resolved from evidence or remain `REVIEW_REQUIRED`.

**PASS:** every Pharma-methodology security has one current subprofile or an explicit blocker; no generic Pharma fallback.

### C10 — Application migration to one source

Change the shared repository/view-model path first, then all direct consumers. Update the canonical authority registry and architecture guard. Convert Edge Functions and P7 materializers to require V2 assignment/version IDs. Remove runtime wildcard and label-variant routing after exact mapping coverage passes.

Compatibility rule: redefine V1 view names as read-only forwarders to V2 only if a staged deployment requires them. They must contain no independent selection logic and must carry a deprecation deadline.

**PASS:** Dashboard, Holdings, Structure, Research, Research Coverage, allocation, stock page and all R6–R10 lineage resolve the same V2 IDs/labels/status for each security; architecture scan finds no competing query or derivation.

### C11 — Permanent new-stock onboarding

Introduce an explicit onboarding state machine:

```text
IDENTITY_PENDING
→ CLASSIFICATION_PENDING
→ CLASSIFICATION_REVIEW_REQUIRED or CLASSIFICATION_RESOLVED
→ METHODOLOGY_PENDING
→ METHODOLOGY_REVIEW_REQUIRED or ANALYTICALLY_READY
```

Ledger creation/transaction preservation may remain possible when financially valid, but research readiness, specialised R6/R7 and downstream action generation must remain blocked until `ANALYTICALLY_READY`.

The workflow uses exact identity, official exchange classification, immutable evidence, idempotent retries, freshness/refresh policy, restructuring/corporate-action review, and owner-visible blockers. It never guesses or chooses the nearest profile.

**PASS:** onboarding tests in C14 and an operational retry/review queue pass.

### C12 — Legacy retirement

After V2 cutover and regression, freeze legacy writers first, then remove active reads, then retire structures. Preserve evidence and historical audit. Exact dispositions are in section 10.

**Owner checkpoint C-E:** approve destructive retirement only after evidence-preservation and dependency reports prove safety.

### C13 — Full 239-equity regression

Publish the required matrix:

```text
identity valid                       x/239
official classification evidence     x/239
canonical macro sector               x/239
canonical sector                     x/239
canonical industry                   x/239
canonical basic industry             x/239
methodology assigned                 x/239
methodology supported                x/239
subprofile required                  x
subprofile resolved                  x
review required                      x
unexpected failures                  x
Dashboard classification match       x/239
Holdings classification match        x/239
Research classification match        x/239
stock-page classification match      x/239
methodology routing valid            x/239
```

Every unresolved stock must have an explicit reason. Cross-surface comparisons must use IDs/version, not only matching display strings.

### C14 — New-stock simulations

Test one normal NSE equity, bank, NBFC, Pharma company, diversified company, newly listed incomplete case, BSE-only equity, source conflict, restructuring/industry change and merger/demerger. Also test stale evidence, retry idempotency, duplicate identity, provider failure and unavailable Basic Industry.

**PASS:** valid cases route deterministically; incomplete/conflicting cases become `REVIEW_REQUIRED`; no specialised score is produced from the wrong methodology.

### C15 — Final retirement and documentation

Update Development Status, Single Source of Truth, Research & Intelligence, Sector Research Profile, Database Architecture, Requirements Register, canonical authority registry, onboarding runbook and `AGENTS.md` only where the permanent invariant must be enforced.

Prominently record:

> PortfolioAI has exactly one current canonical company-classification authority. All analytical methodology is downstream of that authority.

**Final checkpoint C-F:** owner reviews the 239 regression, new-stock simulations, retirement report and P8 isolation proof before closure or any Production proposal.

## 8. Methodology revalidation rules

- Exact V2 node IDs and approved business-model mappings route methodology; display labels do not.
- Sector alone never selects a specialised methodology.
- Industry/Basic Industry may identify the candidate family, but company business-model evidence resolves economically heterogeneous groups.
- A prior P7 assignment is retained when corrected classification and company evidence still support it.
- A changed economic classification triggers revalidation, not automatic reassignment.
- Any methodology change appends a superseding assignment and records previous/new authority, reason and R7 contract.
- `GENERAL` is not a silent fallback for a missing specialised contract.
- R6/R7/R8/R9/Movement/R10 must retain the classification and methodology assignment versions used.

## 9. Migration and rollback strategy

### Forward migration

```text
design
→ owner C-A approval
→ additive local migration
→ clean local replay/tests
→ owner C-C approval
→ hosted Development schema canary
→ evidence staging/reconciliation
→ V2 shadow projection
→ methodology revalidation
→ consumer shadow comparison
→ owner cutover approval
→ V2 consumer switch
→ full regression
→ owner C-E retirement approval
→ legacy retirement
```

### Rollback

- Before cutover: drop/revert only unapplied local work or disable new Development writers; V1 remains untouched.
- After hosted additive migration but before cutover: stop campaigns, preserve staged evidence, revoke new writers if required, and keep consumers on V1.
- After consumer cutover: application rollback may point the compatibility view/repository back only if V1 was not retired and owner explicitly approves; no data rollback or evidence deletion.
- After retirement: restore application authority by selecting the prior V2 assignment/version, not by resurrecting wildcard or page-local logic.
- Every campaign has fixed run ID/cutoff, resumable slices, before/after counts and deterministic fingerprints.

## 10. Legacy object disposition

### A — Immutable raw/source evidence: retain

- `data_source_records` and linked raw provider/exchange/company evidence;
- `security_attribute_observations`, including wrong/conflicting values;
- identity observations and provenance records;
- Gate-K/P7 immutable repository artifacts;
- classification evidence added by V2.

### B — Historical point-in-time evidence: retain and do not rewrite

- all `p8_historical_*` tables, runs, members, archives and evidence links;
- historical research snapshots/items, lineage and IC2 selection history;
- historical scoring/recommendation/action evidence.

### C — Obsolete current decisions: supersede, then archive/lock

- `security_attribute_decisions` rows for SECTOR/INDUSTRY as current authority;
- P4B current classification selections;
- legacy current methodology assignments when superseded.

Do not delete their evidence. Freeze writes after V2 cutover and preserve a migration audit mapping V1 decisions to V2 assignments.

### D — Obsolete taxonomy registries: supersede, then retire

- `classification_taxonomies` two-level V1 rows;
- partial `sectors`, `industries`, `classification_source_mappings` authority.

Because `securities.sector_id/industry_id` and ETF fixtures reference these tables, first remove active dependencies or convert them to documented non-authoritative compatibility references. Drop only after a dependency scan and owner C-E approval. Preferred final state is V2 generic hierarchy nodes, not extension of the structurally two-level model.

### E — Obsolete views/read paths: replace

- `current_security_classification_v1` independent selection logic;
- classification portion of `current_security_enrichment_v1`;
- direct V1 reads in repositories and Edge Functions.

Temporary V1 compatibility views may forward to V2, read-only, with no separate logic.

### F — Obsolete routing: remove after replacement

- active `scoring_profile_sector_rules` wildcard routing;
- runtime substring/wildcard profile inference;
- duplicated TypeScript label-variant mappings once exact versioned mappings exist;
- generic fallback caused by label mismatch.

Retain a frozen audit export if needed; do not keep the rules active.

### G — Application conversion

- shared enrichment/classification repository and types;
- portfolio view projection and Dashboard allocation;
- Holdings, Structure, Research, Research Coverage and stock page;
- scoring repository and research routing;
- P7 evidence materializer and relevant Edge Functions;
- canonical authority registry, architecture guard and cross-surface tests.

### H — Temporary compatibility

- V1-named forwarding views over V2;
- adapters mapping V2 fields into old TypeScript shapes;
- shadow comparison reports.

They receive a release/deletion deadline and cannot accept writes or calculate classifications.

## 11. Test strategy

1. Pure taxonomy tests: hierarchy, stable identity, synonyms, invalid parentage, versioning.
2. Reconciliation tests: source priority, same-node normalized agreement, true conflict, stale evidence, partial path.
3. SQL tests: append-only evidence, one canonical selection, supersession, idempotency, RLS, privileges, `security_invoker`.
4. Migration tests: clean replay, existing-data backfill, preservation counts, schema diff, generated types.
5. Methodology tests: exact mapping, no sector-only routing, no wildcard fallback, Pharma specialisation, BLUEJET review.
6. Cross-surface tests: the same V2 assignment ID/version on Dashboard, Holdings, Structure, Research and stock page.
7. Downstream lineage tests: R6–R10 reject missing/stale/review-required classification or methodology.
8. New-stock and restructuring tests from C14.
9. Operational tests: cache-first manifest, quota, retry, resume, duplicate call/write prevention and safe failure.
10. Full checks: TypeScript, ESLint, architecture guard, production build, SQL lint/advisors, secret scan and authenticated Development browser verification.

## 12. P8 isolation controls

- No mutation of any `p8_historical_*` table or P8 run/member/evidence row.
- Never rewrite a historical classification with today’s V2 taxonomy.
- V2 is the current-state authority only; future P8 historical classification requires a separately approved point-in-time mapping/version contract.
- Baseline and final audits fingerprint P8 row counts and sampled content before/after.
- Classification migrations contain no foreign key, trigger or cascade into P8 tables.
- No P8-B3 canary/acquisition action and no P8-C work is authorized by this plan.
- If P8 work advances concurrently, classification work must rebase/audit without altering P8 execution state.

## 13. Production safety

- Hard-bind all execution tools/functions to Development project ref `lrgpjimipfkyoqbpsqzz` and explicitly refuse Production.
- No `main` branch change or merge.
- No broad `supabase db push`; apply only the exact reviewed migration after approval.
- Capture migration history before/after and avoid replaying aliased historical migrations.
- Provider campaigns require one-time grants, quota reservation, exact manifest and Development-only environment checks.
- Production consideration requires a later owner decision after C15; this plan provides no Production authorization.

## 14. Owner approval checkpoints

| Checkpoint | Approval |
|---|---|
| C-A | taxonomy/reconciliation contract and local migration design |
| C-B | exact evidence acquisition manifest, sources, calls and quota |
| C-C | exact migration application to hosted PortfolioAI Dev |
| C-D | changed methodology and Pharma/subprofile assignments |
| C-CUTOVER | switch all Development consumers to V2 |
| C-E | destructive legacy retirement after full dependency proof |
| C-F | final closure and any later Production proposal |

## 15. Completion standard

The program closes only when:

- all 239 current equities have one V2 economic assignment or explicit `REVIEW_REQUIRED` blocker;
- every resolved assignment contains the complete official hierarchy available under the approved authority;
- every equity has a valid methodology/subprofile disposition;
- all application and engine consumers use one canonical access path;
- V1 logic, wildcard routing and page-local derivation are no longer active;
- future equities fail closed until identity, classification and methodology readiness pass;
- immutable evidence and P8 history remain unchanged;
- full regression and simulation reports pass;
- the owner approves retirement and closure.

## 16. Audit safety statement

This audit performed read-only repository inspection and read-only SQL against hosted Development. It created no migration, made no database write, made no provider call, deployed nothing, and changed neither Production nor `main`.

**A. PLAN READY FOR OWNER APPROVAL**
