# PortfolioAI — ChatGPT Cumulative Development Handoff

**Purpose:** Persistent, cumulative engineering handoff between ChatGPT and Codex.  
**Rule:** This file is append-only in spirit. It must preserve every development stage completed from this checkpoint onward, not merely the latest state.  
**Owner:** Dr. Dibyendu Dutta  
**Repository:** `drddutta-portfolio/PortfiolioAI`  
**Created:** 16 September 2026  
**Current working line:** `r4n-pharma-subprofile-architecture` / PR #101  
**Current verified PR head:** `6e55c8e44e3dde3359f418715db60944c2abee36`

---

## 1. How this file must be used

After every meaningful PortfolioAI build, fix, migration design, test cycle, UI review, deployment gate, pilot, or architecture decision performed with ChatGPT:

1. Update **Current State**.
2. Append a new entry to **Cumulative Build History**.
3. Update **Forward Development Path** only when the architecture or approved sequence changes.
4. Record exact branch / PR / commit identifiers when known.
5. Record verification results.
6. Record whether production was touched.
7. Record every remaining gate requiring owner approval.
8. Never delete prior completed-stage entries merely because they are superseded.
9. Mark superseded decisions explicitly instead of rewriting history.
10. Before handing work back to Codex, give Codex this entire file, not just the latest section.

This file is a handoff/history artifact, not a replacement for the repository’s canonical architecture documents. Where this file conflicts with canonical repository documents, the canonical hierarchy in the repository governs; the conflict must be surfaced and reconciled.

---

## 2. Permanent PortfolioAI engineering rules

### 2.1 Universal Research workspace
- PortfolioAI uses one universal Stock Research workspace.
- Do not create symbol-specific or sector-specific page trees unless architecture explicitly requires it.
- Sector / research profile / subprofile changes:
  - analytical content,
  - evidence requirements,
  - applicability,
  - refresh modules,
  - terminology where needed,
  - readiness contracts,
  - methodology.
- They do **not** change the shared Research page shell.

### 2.2 Canonical authorities
- `current_security_enrichment_v1` is the canonical authority for application sector / industry / market-cap classification.
- Research profile and research subprofile are separate canonical/versioned authorities.
- Research methodology must not rewrite user-visible sector/industry/market-cap classification.

### 2.3 Evidence and scoring semantics
- Missing evidence is **not zero**.
- N/A is allowed only when explicitly not applicable.
- Missing/provisional/disputed/conflicting required research-subprofile assignment must fail closed.
- Do not invent score curves, weights, thresholds, recommendations, or methodology.
- HDFCBANK / BANK_NBFC is a visual and interaction reference, not universal methodology.
- PHARMA_V1 owns Pharma methodology.
- Core and Satellite are separate methodologies.
- Modified Quality-Growth / QGVM-style diagnostic belongs to Core selection, not Satellite.

### 2.4 PHARMA_V1 subprofiles
Current V1 business-model subprofiles:
1. `API_BULK_DRUGS`
2. `DOMESTIC_FORMULATIONS`
3. `GLOBAL_GENERICS`
4. `BIOPHARMA_BIOSIMILARS`
5. `CDMO_CRAMS`

### 2.5 Production safety
Never assume permission to:
- merge PRs,
- deploy the application,
- deploy Edge Functions,
- apply Supabase migrations,
- alter migration history,
- change cron/schedulers,
- call external/paid providers,
- ingest evidence,
- create research assignments,
- write scores,
- write recommendations,
- write position sizing,
- modify production data.

Every such action requires explicit owner authorization for that exact action.

Before any production-impacting recommendation:
1. verify current repository state;
2. verify the exact production state relevant to the action;
3. state the safe next gate;
4. state what still requires explicit approval.

---

## 3. Current state — checkpoint at takeover

### 3.1 Git / PR
- Repository: `drddutta-portfolio/PortfiolioAI`
- Active development branch: `r4n-pharma-subprofile-architecture`
- PR: **#101 — R4N: freeze Research contracts and add Pharma subprofile foundation**
- PR status: **OPEN / DRAFT / UNMERGED**
- Verified PR head after Codex corrections:
  `6e55c8e44e3dde3359f418715db60944c2abee36`
- Architecture Guard on this head: **GREEN**
- `PORTFOLIOAI_CURRENT_STATE_AUDIT.md` remains unrelated/untracked and was intentionally not committed.

### 3.2 Latest Codex correction set now pushed
Codex completed and pushed:
- fail-closed resolution for active disputed/provisional overlaps;
- effective interval semantics aligned with PostgreSQL half-open `[from, to)`;
- regression tests;
- a new forward migration for complete secondary-exposure lifecycle/provenance contract;
- stale deployment/status documentation corrections;
- whitespace cleanup in candidate baseline files.

### 3.3 Local verification already completed
Latest reported local verification:
- local Supabase reset + full migration replay: PASS
- R4N pgTAP: **41/41**
- application tests: **446/446**
- Edge tests: **140/140**
- TypeScript: PASS
- architecture guard: PASS
- focused lint: PASS
- architecture lint: PASS
- production build: PASS
- schema diff: PASS
- RLS checks: PASS
- database lint: PASS except known inherited volatility warning
- secret scan: PASS
- `git diff --check`: PASS
- public tables with RLS: **85/85**
- research assignments: empty
- secondary exposures: empty
- Edge lint retains three unrelated pre-existing errors
- local cron environment intentionally has zero jobs; the three production-cron assertions are not valid for the inert local environment.

### 3.4 Production-state caution
Do **not** infer exact production migration state solely from this handoff.

Current branch documentation states that the R4N production schema is deployed, while the newly added secondary-exposure reconciliation migration is production-unapplied.

The most recent Codex run described here made **no production migration, assignment, provider call, evidence ingestion, score, recommendation, sizing, or scheduler change**.

Therefore, before any future production action, perform a fresh read-only production preflight and determine:
- which R4N migrations are already in the production ledger;
- whether the new secondary-exposure reconciliation migration is absent/pending;
- current R4N table/contract/assignment/exposure state;
- NEWS policy/cron state where relevant;
- relevant business-row preservation counts;
- backup/recovery readiness.

---

## 4. Immediate unfinished work

### Stage LUI-1 — Authenticated localhost UI review

**Status:** NOT YET COMPLETED.

Codex stopped immediately before creating the minimum local-only fixtures required for authenticated UI review.

Required local-only fixture:
- one synthetic local authenticated owner;
- minimum portfolio/holding rows required by the application;
- HDFCBANK;
- TORNTPHARM;
- canonical application classification required for BANK_NBFC / PHARMA_V1 routing.

Must remain absent during the first review:
- research-subprofile assignments;
- secondary exposures;
- fundamental/research evidence;
- scores;
- recommendations;
- position sizing;
- provider calls;
- scheduler jobs.

### Localhost acceptance checks

#### HDFCBANK
- same universal Research page shell;
- resolves through BANK_NBFC;
- existing bank labels/metrics/applicability preserved;
- no Pharma terminology leakage;
- no regression in readiness/heatmap/refresh/presentation.

#### TORNTPHARM
- same universal Research page shell;
- resolves at PHARMA_V1 parent profile level;
- no BANK_NBFC metric leakage;
- PHARMA labels/applicability/Business Durability/external ratings render correctly;
- no subtype is silently inferred while assignment tables are empty.

#### Fail-closed semantics
With no reviewed subprofile assignment:
- no `DOMESTIC_FORMULATIONS` or other subtype may be fabricated;
- subtype-specific readiness/scoring must not become READY;
- missing evidence must not become zero;
- N/A only for explicit non-applicability;
- missing/provisional/disputed/conflicting assignment blocks downstream readiness/scoring/recommendation as designed.

#### Browser health
Inspect:
- console errors;
- React warnings relevant to this work;
- failed network requests;
- unexpected production URLs;
- external/provider calls;
- incorrect Supabase endpoint.

**Production must remain untouched.**

---

## 5. Forward development path from here

This is the current intended sequence. Each gate must be revalidated against the repository before execution.

### Gate A — Finish localhost UI proof
1. Prove frontend points only to local Supabase.
2. Create disposable minimum local fixtures.
3. Run authenticated localhost UI.
4. Compare HDFCBANK and TORNTPHARM.
5. Capture defects/screenshots.
6. Fix repository/UI defects only if needed.
7. Re-run relevant automated tests.
8. Owner visually approves localhost behavior.

### Gate B — Stabilize PR #101
1. Ensure all localhost-derived corrections are committed to PR #101.
2. Re-run Architecture Guard / CI.
3. Reconcile status documentation.
4. Keep PR draft until owner is satisfied.
5. Do not merge merely because CI is green.

### Gate C — Read-only production preflight
Before any migration/deployment:
1. inspect current remote migration ledger;
2. verify exact checksum of every pending forward migration;
3. verify current R4N tables/contracts/assignments/exposures;
4. verify RLS/grants;
5. verify business-row preservation baselines;
6. verify cron/NEWS state where affected;
7. verify backup/recovery state;
8. abort if production state differs materially from the approved package.

No write occurs in this gate.

### Gate D — Production schema reconciliation, only if separately authorized
If a forward R4N migration remains pending:
- apply only the explicitly authorized, checksum-verified forward migration(s);
- use the repository-approved production deployment mechanism;
- never use migration repair;
- never rewrite migration ledger/history;
- never use ordinary broad `db push` if the documented isolated deployment package is still required;
- validate expected state immediately afterward.

This authorization does not authorize assignment/evidence/scoring/recommendation work.

### Gate E — Reviewed Pharma subprofile assignments
After schema is stable:
1. review the owner’s Pharma stock mapping;
2. convert only reviewed decisions into canonical assignment records;
3. preserve effective intervals/provenance/reviewer state;
4. use secondary exposures only where explicitly justified;
5. keep provisional/disputed cases fail-closed;
6. verify resolver behavior.

Likely first reference:
- TORNTPHARM → reviewed `DOMESTIC_FORMULATIONS` only after explicit approval and canonical write.

### Gate F — TORNTPHARM official-evidence pilot
Use TORNTPHARM as the controlled PHARMA_V1 reference implementation:
1. validate official-source evidence package;
2. dry-run classifier/validator;
3. confirm parent vs subtype evidence mapping;
4. confirm derived metric lineage;
5. ingest only after explicit approval;
6. verify stored provenance and readiness;
7. no score invention.

### Gate G — PHARMA_V1 scoring methodology
Before numeric scoring:
1. finalize and approve methodology;
2. define evidence-to-score curves/thresholds/weights explicitly;
3. version the scoring contract;
4. test missing/conflicting evidence;
5. preserve evidence-only states where no numeric methodology is approved.

No generic BANK_NBFC scoring may be copied into Pharma.

### Gate H — TORNTPHARM scored pilot
After methodology approval:
1. compute deterministic score;
2. persist lineage only through approved path;
3. test UI scorecard/readiness;
4. verify reproducibility;
5. keep recommendation as a separate downstream gate.

### Gate I — Recommendation layer
Only after score lineage and readiness are valid:
1. define/confirm recommendation contract;
2. connect evidence + score lineage;
3. pilot on TORNTPHARM;
4. persist only with explicit owner approval;
5. preserve human decision authority.

### Gate J — Expand PHARMA_V1 coverage
Roll out by subprofile in controlled cohorts:
- Domestic Formulations;
- Global Generics;
- API/Bulk Drugs;
- CDMO/CRAMS;
- Biopharma/Biosimilars.

For each cohort:
- assignment review;
- evidence contract;
- official/provider source plan;
- ingestion validation;
- readiness;
- scoring only where methodology is approved;
- regression against universal Research UI.

### Gate K — Portfolio-wide Research profile expansion
After PHARMA_V1 is mature:
- add new profile families using the same universal workspace;
- do not create new page trees;
- register methodology/evidence/readiness contracts by profile;
- maintain `current_security_enrichment_v1` as classification authority.

### Gate L — Core/Satellite decision architecture
Keep distinct:
- Core Selection / QG(QGVM-style) diagnostic;
- Core Health;
- Satellite Opportunity methodology;
- Exit Radar;
- Position Sizing;
- Movement/rebalancing.

Do not classify a security as Satellite merely because it fails a Core quality-growth screen.

### Gate M — Coverage and automation
Only after individual engines are proven:
- controlled portfolio-wide evidence coverage;
- coverage/readiness registry integration;
- bounded refresh orchestration;
- scheduler activation only where separately approved;
- provider budget/accounting controls preserved;
- no background paid-provider activity from normal browsing.

---

## 6. Cumulative Build History

### Entry 000 — Takeover baseline
**Date:** 16 September 2026  
**Actor:** ChatGPT takeover from Codex  
**Branch:** `r4n-pharma-subprofile-architecture`  
**PR:** #101  
**Head:** `6e55c8e44e3dde3359f418715db60944c2abee36`

**Inherited completed work:**
- R4M universal profile-driven Research workspace.
- R4N Research contract freeze and Pharma subprofile architecture.
- assignment-resolution corrections for provisional/disputed overlap.
- PostgreSQL half-open effective interval semantics.
- secondary-exposure lifecycle/provenance forward migration authored but not assumed deployed.
- local migration replay and broad verification passed.
- PR Architecture Guard green.
- production untouched by the latest Codex correction run.

**Unfinished at takeover:**
- authenticated localhost UI review with disposable local-only fixtures.

**Next safe action:**
- finish localhost UI proof without touching production or paid providers.

**Owner approvals still required later for:**
- any production migration;
- PR merge;
- production deployment;
- canonical subprofile assignment writes;
- evidence ingestion;
- scoring methodology/score writes;
- recommendation writes;
- sizing writes;
- scheduler/provider activity.

### Entry 001 — LUI-1 fixture design and repository dependency audit
**Date:** 16 September 2026  
**Actor:** ChatGPT  
**Branch inspected:** `r4n-pharma-subprofile-architecture`  
**PR:** #101  
**Verified head:** `6e55c8e44e3dde3359f418715db60944c2abee36`

**Goal:** Resume from Codex credit exhaustion and prepare the minimum authenticated localhost Research UI proof without touching production.

**Work completed:**
- Re-verified PR #101 is the active draft at head `6e55c8e...`.
- Inspected `ResearchPage`, portfolio loading, profile resolution, Pharma scoring repository, local Supabase config and application environment contract.
- Confirmed the Research page requires a real active portfolio plus transaction-derived open positions; securities alone are insufficient.
- Confirmed local frontend target is `http://localhost:5173` and local Supabase API/DB/Studio ports are 54321/54322/54323.
- Confirmed profile resolution is sector/industry driven for the initial no-assignment review:
  - Banking / bank industry -> `BANK_NBFC`
  - Pharma / Pharmaceuticals -> `PHARMA_V1`
- Confirmed `current_security_enrichment_v1` derives sector/industry from selected security-attribute observations, so the fixture uses that canonical path rather than relying only on legacy `securities.sector_id`.
- Performed read-only production schema introspection only to verify current columns/constraints needed to make the local fixture schema-correct.
- Authored `PORTFOLIOAI_LUI1_LOCAL_FIXTURE.sql` as a disposable local-only fixture:
  - one owner-bound portfolio,
  - one local broker/account,
  - HDFCBANK + TORNTPHARM,
  - two opening-position transactions,
  - canonical local classification observations/decisions,
  - no subprofile assignment,
  - no secondary exposure,
  - no research evidence,
  - no score/recommendation/sizing write,
  - no provider or scheduler activity.

**Production touched:** NO.  
Only read-only schema/view inspection was performed against production.

**Current required owner/local action:**
1. Start local Supabase on the PR #101 branch.
2. Create exactly one local Auth user in local Studio.
3. Run the LUI-1 local fixture SQL against the local database.
4. Configure the frontend to local Supabase only and run `npm run dev`.
5. Open the HDFCBANK and TORNTPHARM Research URLs and perform the browser-level acceptance review.

**Next safe gate:** Execute the local fixture and authenticated localhost visual/browser review.

**Explicit approvals still required:** all production migration/deployment/merge/assignment/evidence/scoring/recommendation/sizing/scheduler actions.

---

## 7. Update template for every future build

Copy this block and append it below the previous entry.

### Entry NNN — <stage name>
**Date:**  
**Actor:** ChatGPT / owner-guided Supabase / Codex  
**Branch:**  
**PR:**  
**Commit(s):**  

**Goal:**  

**Changes made:**  
- 

**Files/components/migrations affected:**  
- 

**Database/Supabase action:**  
- None / local-only / read-only production / authorized production write

**Production touched:** NO / YES  
If YES, exact authorization and action:

**Verification:**  
- tests:
- build:
- lint:
- schema:
- RLS:
- browser:
- network:
- other:

**Result:** PASS / PARTIAL / FAIL

**Known limitations / debt:**  
- 

**Canonical decisions added or changed:**  
- 

**Next safe gate:**  

**Explicit approvals still required:**  
- 

---

## 8. Codex handback instruction

When Codex credits return, provide Codex this entire file and instruct:

> Read this cumulative handoff first, then inspect the current GitHub branch, PR, canonical repository docs, and current Supabase state relevant to the next gate. Treat the handoff as historical context, not as a substitute for current verification. Preserve all production-safety gates. Continue from the newest unfinished stage and append your completed work back into this cumulative history rather than replacing it with a latest-state-only summary.

---

## 9. Current stop point

**STOP POINT:** Begin Stage LUI-1: disposable local fixture + authenticated localhost Research UI review.

No production action is authorized by this file.
