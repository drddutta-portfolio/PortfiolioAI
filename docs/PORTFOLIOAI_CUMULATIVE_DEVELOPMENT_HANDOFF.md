# PortfolioAI — ChatGPT Cumulative Development Handoff

**Purpose:** Persistent, cumulative engineering handoff between ChatGPT and Codex.  
**Rule:** This file preserves every development stage from the ChatGPT takeover checkpoint onward. Historical entries remain even when later sections supersede their stop points.  
**Owner:** Dr. Dibyendu Dutta  
**Repository:** `drddutta-portfolio/PortfiolioAI`  
**Created:** 16 September 2026  
**Current working line:** `r4n-pharma-subprofile-architecture` / PR #101

---

## 1. Permanent engineering rules

- One universal Stock Research workspace. Do not create symbol-specific or sector-specific page trees unless architecture explicitly requires it.
- `current_security_enrichment_v1` remains canonical for application sector / industry / market-cap classification.
- Research profile and research subprofile are separate canonical/versioned authorities and must not rewrite user-facing classification.
- Missing evidence is **not zero**.
- N/A is valid only when explicitly not applicable.
- Missing/provisional/disputed/conflicting required subprofile state must fail closed.
- Never invent scoring curves, thresholds, weights, recommendations, or methodology.
- HDFCBANK / BANK_NBFC is a visual/interaction reference, not universal methodology.
- PHARMA_V1 owns Pharma methodology.
- Core and Satellite are separate methodologies; failing a strict Core quality-growth screen does not automatically imply Satellite or Exit.

Current PHARMA_V1 subprofiles:
1. `API_BULK_DRUGS`
2. `DOMESTIC_FORMULATIONS`
3. `GLOBAL_GENERICS`
4. `BIOPHARMA_BIOSIMILARS`
5. `CDMO_CRAMS`

### Production safety
Never assume permission to merge, deploy, apply migrations, alter migration history, change cron/schedulers, call paid providers, ingest evidence, create assignments, write scores/recommendations/sizing, or modify production data. Every such action requires explicit owner authorization for that exact action.

Before a production-impacting action: verify repo state, verify live production state, state the next safe gate, and identify remaining approvals.

---

## 2. Inherited takeover baseline

### Entry 000 — Takeover from Codex
**Date:** 16 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**PR:** #101  
**Codex head:** `6e55c8e44e3dde3359f418715db60944c2abee36`

Inherited completed work:
- R4M universal profile-driven Research workspace.
- R4N Research contract freeze and Pharma subprofile architecture.
- Fail-closed assignment resolution for provisional/disputed overlap.
- PostgreSQL half-open `[from,to)` effective-interval semantics.
- Forward migration for complete secondary-exposure lifecycle/provenance authored but not assumed deployed.
- Local full migration replay passed.
- R4N pgTAP 41/41, app tests 446/446, Edge tests 140/140.
- TypeScript, Architecture Guard, focused lint, architecture lint, production build, schema diff, RLS checks, secret scan and `git diff --check` passed.
- 85/85 public tables with RLS.
- Assignments and secondary exposures empty at takeover.
- Three unrelated pre-existing Edge lint errors retained.

Unfinished at takeover: authenticated localhost Research UI proof for HDFCBANK and TORNTPHARM.

---

## 3. Entry 001 — LUI-1 fixture design and dependency audit

**Date:** 16 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Verified that the Research page requires an authenticated active portfolio plus transaction-derived open positions; securities alone are insufficient. Confirmed local frontend/Supabase endpoints and confirmed profile resolution for the no-assignment proof:
- Banking / bank industry -> `BANK_NBFC`
- Pharma / Pharmaceuticals -> `PHARMA_V1`

Created a disposable local-only fixture plan with one portfolio, local broker/account, HDFCBANK, TORNTPHARM, opening positions and canonical classification observations/decisions. Explicitly excluded subprofile assignments, secondary exposures, evidence, scores, recommendations, sizing, provider calls and scheduler activity.

Only read-only production schema/view inspection was used to make the local fixture schema-correct. Production writes: **NONE**.

---

## 4. Entry 002 — LUI-1 authenticated localhost proof

**Date:** 16 September 2026  
**Actor:** ChatGPT + owner-guided local Supabase/browser review

### Local setup and fixture behavior
- `.env.local` pointed Vite only to `http://127.0.0.1:54321` with local publishable key, `VITE_APP_URL=http://localhost:5173`, and `VITE_MARKET_DATA_ENABLED=false`.
- Initial fixture V1 deliberately aborted because local reset data already contained HDFCBANK/TORNTPHARM with different UUIDs; PostgreSQL rolled back completely and verification returned zero partial fixture rows.
- Existing local IDs confirmed:
  - HDFCBANK `a4000000-0000-0000-0000-000000000001`
  - TORNTPHARM `a4000000-0000-0000-0000-000000000002`
- Fixture V2 reused those IDs and committed successfully.
- Local portfolio `LOCAL UI Research Review` contained two active opening positions.
- HDFCBANK canonical classification: Banking / Private Sector Bank.
- TORNTPHARM canonical classification: Pharma / Pharmaceuticals.
- Market-cap evidence intentionally absent, therefore enrichment remained `PARTIAL` rather than being fabricated.
- No research-subprofile assignments, secondary exposures, evidence, persisted scores/recommendations/sizing, provider calls or scheduler activity were created.
- A local Auth ownership mismatch initially hid the fixture through RLS; the disposable local fixture portfolio was reassigned to the authenticated local user, after which the two holdings rendered. This validated ownership/RLS behavior and did not touch production.

### HDFCBANK verification — PASS
- Universal Research shell rendered.
- Resolved through BANK_NBFC / Banks & NBFCs sector rule.
- No Pharma terminology leakage.
- Missing price/cost/P&L/evidence remained `Unavailable`, not zero.
- No fabricated score or recommendation.

### TORNTPHARM verification — PASS
- Same universal Research shell rendered.
- PHARMA_V1 context visible with canonical Pharma / Pharmaceuticals classification.
- No BANK_NBFC leakage.
- No `DOMESTIC_FORMULATIONS` or other subtype silently inferred while assignments were empty.
- Recommendation remained `NOT READY` / pending.
- Scorecard showed 0% verified evidence and 0% score-ready while dimensions remained `No validated evidence`, not numeric zero scores.
- Business Durability rendered as a real Pharma dimension and was not incorrectly N/A.
- R&D Expenditure, R&D Intensity, and Pipeline / Launch / Approval Evidence remained `Unavailable` with no evidence.
- External ratings showed 0 rated instruments and treated absence as insufficient evidence rather than a negative signal.
- Pharma Research Readiness showed 0/13 ready.

### Browser/network isolation — PASS
- Actual Research request used `http://127.0.0.1:54321/rest/v1/...` and returned HTTP 200.
- Filtering Network by `supabase.co` returned zero requests.
- No paid-provider refresh was used.
- The only Console message observed was a Chrome async-listener/message-channel pattern without a PortfolioAI stack trace; treated as browser-extension noise for this gate.

**Result:** LUI-1 PASS.  
**Production touched:** NO.

Commit recording this localhost proof: `d6d0f1afa5e83b936c32ac23ebc3a11136b230fd`.

---

## 5. Entry 003 — Gate B: stabilize PR #101

**Date:** 16 September 2026  
**Actor:** ChatGPT  
**Verified head:** `d6d0f1afa5e83b936c32ac23ebc3a11136b230fd`

Repository/PR verification:
- PR #101 remained OPEN / DRAFT / UNMERGED and mergeable.
- Architecture Guard reran on the exact current head and passed.
- Detailed job inspection found no failed/skipped architecture-critical steps: presentation-boundary enforcement, canonical-contract checks, TypeScript, architecture lint, full lint diagnostic and production build all passed.
- No unresolved PR review comments or discussion threads.
- Localhost proof revealed no application-code defect requiring a code change.

PR description stabilization:
- The PR body was stale and still claimed no migration/schema change.
- It was corrected to describe the evolved R4N scope, the three earlier authorized/deployed reconciliation migrations, the later still-unapplied secondary-exposure reconciliation migration, the localhost proof, validation counts and remaining gates.
- This metadata edit did not merge or deploy anything.

**Result:** Gate B PASS.  
**Production touched:** NO.

---

## 6. Entry 004 — Gate C: fresh read-only production preflight

**Date:** 16 September 2026  
**Actor:** ChatGPT using connected Supabase/GitHub read-only inspection  
**Supabase project:** `uxiyufbsbgzzdujzcdxe`

### Migration ledger
Production contains exactly the expected earlier R4N reconciliation migrations:
1. `20260915190026_reconcile_r4n_research_subprofiles`
2. `20260915193011_reconcile_news_policy_final_state`
3. `20260915193024_reconcile_portfolio_weight_context`

`20260916100032_reconcile_r4n_secondary_exposure_contract` is absent and genuinely pending.

### Live preservation baseline
- research_subprofile_contracts: 5
- research_subprofile_assignments: 0
- research_subprofile_secondary_exposures: 0
- portfolios: 1
- transactions: 492
- securities: 273
- fundamental_observations: 458
- stock_recommendation_runs: 4

These match the documented post-R4N baseline.

### Pending-table shape
`research_subprofile_secondary_exposures` still has the pre-reconciliation 10-column shape; lifecycle/confidence/effective-interval/reviewer-provenance columns from `20260916100032` are absent. No partial application detected.

### RLS / grants
- RLS enabled on research_subprofile_contracts, research_subprofile_assignments and research_subprofile_secondary_exposures.
- Authenticated access remains SELECT-only.
- Mutation remains service-role-only.

### NEWS / cron preservation
- NSE NEWS V6 remains disabled/closed with disabled freshness semantics.
- NSE NEWS V7 remains current/enabled with 1800-second elapsed-time freshness.
- Active cron jobs were recorded here as:
  - `portfolioai-nse-announcements-20m` — `7,27,47 * * * *`
  - `portfolioai-news-reconcile-5m` — `3-59/5 * * * *`

**Historical-note correction:** Entry 007 below records that this cron-name/schedule snapshot was stale. The Gate D migration did not touch cron. Current live cron state was re-read after Gate D and is authoritative there.

### Backup / recovery readiness
- `Manual Supabase Database Backup` exists on `main` and uses PostgreSQL 17 pg_dump, pg_restore archive validation, AES-256-CBC/PBKDF2 encryption, private Supabase Storage upload, SHA-256 byte-for-byte verification and cleanup.
- Workflow run `35077675837`, attempt 4, completed successfully on 16 September 2026.
- Production bucket `portfolioai-db-backups` contains the matching encrypted object and `.sha256` object under `manual/2026-09-16T09-28-57Z/`.
- Encrypted object observed size: 4,599,872 bytes; checksum object: 65 bytes.

**Result:** Gate C read-only preflight PASS.  
**Production touched:** NO. All Gate C database queries were read-only.

---

## 7. Entry 005 — Gate D package prepared, not executed

**Date:** 16 September 2026  
**Actor:** ChatGPT  
**Prepared head before handoff update:** `ea88697ceb2ffe809cc2f3d5668220eb17e5207e`

Prepared exact production package for the still-pending migration:

`20260916100032_reconcile_r4n_secondary_exposure_contract.sql`

Pinned SHA-256:

`17715c03fe12ad0fa46d1b09a76bd5aae4828c39336e2f0d57db39d250918605`

Repository additions:
- `scripts/buildR4NSecondaryExposureProductionDeploymentBundle.mjs`
- `docs/R4N_Secondary_Exposure_Production_Gate.md`

Safety properties of the new single-migration bundle builder:
- verifies the exact source checksum before building anything;
- parses the linked remote migration ledger and refuses an unparseable ledger;
- requires the three known predecessor R4N migrations to already exist remotely;
- refuses if `20260916100032` is already applied;
- constructs an isolated temporary workdir with compatibility markers for already-applied remote versions;
- copies only `20260916100032_reconcile_r4n_secondary_exposure_contract.sql` as the new migration candidate;
- does not itself apply production changes.

Live production compatibility was rechecked read-only:
- `research_subprofile_secondary_exposures` has the expected pre-reconciliation columns, including `materiality_state`;
- row count remains 0, satisfying the migration's fail-closed precondition;
- no partial lifecycle/provenance reconciliation was detected.

CI validation on head `ea88697ceb2ffe809cc2f3d5668220eb17e5207e`:
- PortfolioAI Architecture Guard run `35097055921` completed successfully;
- presentation data boundaries passed;
- canonical authority contracts passed;
- strict TypeScript passed;
- architecture lint passed;
- full repository lint diagnostic passed;
- production build passed;
- no CI step failed.

**Result:** Gate D package is READY FOR EXPLICIT OWNER AUTHORIZATION, but Gate D has **not** been executed.  
**Production touched by this entry:** NO.

Exact authorization scope required for the next step:

> Authorize applying production migration `20260916100032_reconcile_r4n_secondary_exposure_contract.sql` only.

Even with that authorization, the execution must still perform a final immediate preflight and dry-run first, and must abort if the live ledger, table row count, checksum, predecessor state, or dry-run selection differs from the reviewed package.

That authorization does **not** authorize PR merge, application/Edge deployment, research-subprofile assignments, secondary-exposure row creation, evidence ingestion, scoring, recommendations, sizing, provider calls, or scheduler changes.

---

## 8. Entry 006 — Gate D authorized; immediate preflight passed; dry-run pending

**Date:** 16 September 2026  
**Actor:** ChatGPT + owner authorization

Owner explicitly authorized only:

`20260916100032_reconcile_r4n_secondary_exposure_contract.sql`

Immediate preflight after authorization:
- remote migration ledger still contains predecessor versions `20260915190026`, `20260915193011`, and `20260915193024`;
- target version `20260916100032` is still absent;
- `research_subprofile_secondary_exposures` remains empty;
- `research_subprofile_assignments` remains 0;
- `research_subprofile_contracts` remains 5;
- transactions remain 492;
- securities remain 273;
- fundamental observations remain 458;
- recommendation runs remain 4;
- live secondary-exposure table still has the expected pre-reconciliation 10-column shape;
- exact migration content was re-read from the current PR branch;
- SHA-256 was recomputed as `17715c03fe12ad0fa46d1b09a76bd5aae4828c39336e2f0d57db39d250918605`, matching the prepared package.

Execution mechanism decision:
- the connected Supabase migration action was **not** used because it does not expose a way to preserve the repository migration version `20260916100032` explicitly;
- using that shortcut could create migration-ledger drift, which would violate the reviewed Gate D deployment contract;
- therefore Gate D execution remained on the isolated CLI bundle path documented in `docs/R4N_Secondary_Exposure_Production_Gate.md`.

**Current status at this historical checkpoint:** AUTHORIZED, PRE-FLIGHT PASS, NOT YET APPLIED.  
**Production touched by this entry:** NO.

The next required step at this checkpoint was the isolated bundle build plus `supabase db push --dry-run`.

---

## 9. Entry 007 — Gate D executed and post-deployment validated

**Date:** 16 September 2026  
**Actor:** ChatGPT + owner-executed isolated Supabase CLI push

### Dry-run
The checksum-pinned isolated production bundle was built successfully. `supabase db push --dry-run` selected exactly one pending migration:

`20260916100032_reconcile_r4n_secondary_exposure_contract.sql`

No other migration was selected.

### Authorized production push
From the same unchanged temporary bundle, the owner ran `supabase db push --yes`. The CLI applied only:

`20260916100032_reconcile_r4n_secondary_exposure_contract.sql`

### Immediate production validation
Connected production Supabase verification confirmed:
- migration ledger contains `20260916100032` exactly once as `reconcile_r4n_secondary_exposure_contract`;
- `research_subprofile_secondary_exposures` remains **0 rows**;
- `research_subprofile_assignments` remains **0 rows**;
- `research_subprofile_contracts` remains **5 rows**;
- preserved business counts remain:
  - transactions: 492;
  - securities: 273;
  - fundamental_observations: 458;
  - stock_recommendation_runs: 4;
- secondary-exposure table now has the seven intended lifecycle/provenance columns:
  - `assignment_status`
  - `confidence_state`
  - `effective_from`
  - `effective_to`
  - `reason_code`
  - `reviewed_by`
  - `reviewed_at`
- expected status, confidence, materiality, interval, reason, review-completeness and retirement-completeness constraints exist;
- `research_subprofile_secondary_reviewed_by_idx` exists;
- RLS remains enabled on `research_subprofile_secondary_exposures`;
- authenticated role remains SELECT-only on this table; service-role-only mutation posture remains intact.

### NEWS / cron preservation and Gate C correction
The migration SQL only alters `research_subprofile_secondary_exposures`; it does not schedule, unschedule, invoke or modify cron jobs. The current R4N NEWS reconciliation migration also explicitly states that it never schedules, unschedules or invokes a cron job.

Fresh production reads after Gate D confirmed:
- NEWS policy V6: disabled/closed with `freshness_basis = DISABLED`;
- NEWS policy V7: enabled/current with `freshness_basis = ELAPSED_TIME`;
- current active cron jobs are:
  - `portfolioai-n5-nse-news-30min` — `*/30 * * * *` — `select public.invoke_nse_news_pipeline_scheduled_v1();`
  - `portfolioai-news-evidence-classification-30min` — `5,35 * * * *` — `select public.reclassify_unclassified_news_from_stored_evidence_v1(100);`

These live cron names/schedules supersede the stale cron snapshot recorded in Entry 004. There is no evidence that Gate D changed cron state.

### Scope boundary preserved
Gate D did **not**:
- merge PR #101;
- deploy the application or Edge Functions;
- create any research-subprofile assignment or secondary-exposure business row;
- ingest evidence;
- execute paid/external providers;
- write scores, recommendations or sizing;
- change schedulers or cron definitions.

**Result:** Gate D COMPLETE / PASS.  
**Production touched:** YES, only the explicitly authorized schema migration `20260916100032_reconcile_r4n_secondary_exposure_contract.sql`.

---

## 10. Entry 008 — Gate E local review-package audit, implementation and validation

**Date:** 17 September 2026  
**Actor:** ChatGPT + owner-guided local validation  
**Implementation commit:** `82a5f9029203723acc79f35ad9a111b73c8f944a`

### Read-only audit findings
Gate E began with local/read-only inspection only. Local Supabase baseline remained:
- `research_subprofile_contracts`: 5 rows;
- `research_subprofile_assignments`: 0 rows;
- `research_subprofile_secondary_exposures`: 0 rows.

The provisional candidate registry remains owner-proposed only. TORNTPHARM is proposed as `DOMESTIC_FORMULATIONS` with `reviewState = PROVISIONAL`, `confidence = LOW`, no effective date, and no proposed secondary exposure.

The existing assignment resolver was preserved. It already fails closed for missing, provisional, disputed, conflicting, or inactive reviewed assignments and requires reviewer provenance/effective date for `REVIEWED` state.

The older TORNTPHARM canonical-history/retained-completion modules were confirmed to use historical production identity/evidence IDs from the R4H pilot. The local TORNTPHARM fixture uses a different environment-specific UUID. Those historical IDs were intentionally left untouched; Gate E must consume an environment-resolved `securityId` instead of hard-coding either production or local fixture identity.

Local `data_source_records` inspection found only a `LOCAL_UI_FIXTURE` / `SECURITY_CLASSIFICATION` record for TORNTPHARM. That record is identity/classification context only and does not provide business-model evidence sufficient to promote `DOMESTIC_FORMULATIONS` to `REVIEWED`.

### Review-package implementation
Added:
- `src/features/research/pharmaSubprofileReviewPackage.ts`
- `src/features/research/pharmaSubprofileReviewPackage.test.ts`

The review package is deliberately side-effect-free and performs no database/provider I/O. It sits between the provisional candidate registry and the canonical assignment write path.

Key behavior:
- accepts an environment-resolved `securityId`;
- separates promotion-eligible subprofile evidence from parent/context/identity-only evidence;
- returns one of `KEEP_PROVISIONAL`, `READY_FOR_REVIEW`, or `DISPUTED`;
- requires at least MEDIUM confidence, non-empty eligible subprofile evidence, an effective-date candidate, no primary-model conflict, resolved conditional materiality review, resolved secondary-exposure review, and a valid positive assignment version before `READY_FOR_REVIEW`;
- treats `LOCAL_IDENTITY_FIXTURE` evidence as contextual/non-promotional;
- retains secondary exposures as provisional review artifacts and never creates a blended score;
- even when a package is `READY_FOR_REVIEW`, any constructed assignment draft remains `PROVISIONAL` with `reviewedBy = null` and `reviewedAt = null`;
- never auto-promotes to `REVIEWED` and never writes to Supabase.

For the current TORNTPHARM local fixture-only evidence state, the expected result remains `KEEP_PROVISIONAL` with no promotable reviewed assignment.

### Validation
Owner ran local validation against the pulled R4N branch:
- focused Gate E test file: **7/7 passed**;
- full application suite: **453/453 tests passed across 83/83 files**;
- `npm run typecheck`: PASS;
- `npm run check:architecture`: PASS;
- GitHub `PortfolioAI Architecture Guard` run `35182282195`: SUCCESS;
- `npm run build`: PASS (only the existing Vite >500 kB chunk warning; no build failure).

Local tracked working tree remained clean after validation. Three pre-existing local-only untracked files remain outside Git:
- `PORTFOLIOAI_CURRENT_STATE_AUDIT.md`
- `PORTFOLIOAI_LUI1_LOCAL_FIXTURE.sql`
- `PORTFOLIOAI_LUI1_LOCAL_FIXTURE_V2.sql`

No local Supabase business-data write was performed during Gate E audit/implementation validation. No provider call was performed.

### Scope boundary preserved
Gate E implementation did **not**:
- create any local or production research-subprofile assignment row;
- create any local or production secondary-exposure row;
- ingest official/company/regulator evidence;
- call external/paid providers;
- write scores, recommendations, or sizing;
- deploy the application or Edge Functions;
- merge PR #101;
- modify production database/schema/data/schedulers.

**Result:** Gate E review-package implementation and local validation COMPLETE / PASS.  
**Production touched:** NO.

The next unfinished Gate E work is evidence-backed human review of TORNTPHARM's proposed `DOMESTIC_FORMULATIONS` assignment. Current local fixture evidence is insufficient for promotion, so the assignment must remain provisional until business-model provenance is gathered/reviewed and a separate assignment-write action is explicitly authorized.

---

## 11. Entry 009 — Gate E evidence review, owner decision and local persistence/UI proof

**Date:** 17 September 2026  
**Actor:** ChatGPT + owner human review + local Supabase/browser validation

### Evidence/materiality methodology and review outcome
The owner approved the Gate E V1 secondary-exposure materiality rule. The approved internal research rule uses comparable business-model-attributable revenue where possible, fails closed to `UNKNOWN` when numerator/denominator scope is not defensible, and allows only provenance-complete reviewed qualitative overrides. Numeric anchor states are `IMMATERIAL`, `EMERGING`, `MATERIAL`, `DOMINANT`, with `UNKNOWN` for unresolved cases.

TORNTPHARM's official-evidence review produced the owner-reviewed business-model decision:
- primary `DOMESTIC_FORMULATIONS` — `HIGH` confidence;
- secondary `GLOBAL_GENERICS` — `MATERIAL`, `MEDIUM` confidence;
- secondary `CDMO_CRAMS` — `EMERGING`, `MEDIUM` confidence;
- effective from `2026-03-31`;
- conditional export/regulatory/site evidence activation approved because the Global Generics exposure is material.

The owner explicitly approved the Gate E assignment as `REVIEWED` for the reviewed decision artifact. This approval did **not** authorize production persistence.

Supporting review artifacts on the R4N branch include:
- `docs/R4N_PHARMA_V1_Secondary_Exposure_Materiality_Proposal.md`
- `docs/R4N_TORNTPHARM_Gate_E_Secondary_Exposure_Evidence_Review.md`
- `docs/R4N_TORNTPHARM_Gate_E_Assignment_Review_Package.md`
- `docs/R4N_TORNTPHARM_Gate_E_Human_Review_Decision.md`

### Application consumption path
Added the local/read application path needed to consume canonical reviewed research-subprofile assignments and display them without overwriting canonical sector/industry classification:
- `src/data/researchSubprofileRepository.ts`
- `src/data/researchSubprofileRepository.test.ts`
- `src/features/research/usePharmaSubprofileResolution.ts`
- `src/features/research/PharmaSubprofileSummary.tsx`
- Research-page header wiring.

The Research header now keeps canonical classification separate from research methodology. For a resolved reviewed assignment it can show:
- primary subprofile + review state;
- reviewed secondary exposures + materiality;
- canonical sector / canonical industry unchanged beneath them.

### Local-only persistence fixture
Added `scripts/r4n_local_torntpharm_reviewed_assignment.sql` for local validation only. Safety characteristics:
- explicitly targets the known local TORNTPHARM security identity `a4000000-0000-0000-0000-000000000002`;
- resolves the explicitly reviewed local auth user and verifies that user owns a local portfolio containing TORNTPHARM;
- aborts on unexpected local identity/reviewer/contract/assignment state;
- creates no evidence, score, recommendation, sizing, provider-call or scheduler state;
- is idempotent for the exact expected reviewed local assignment/exposure shape.

Two initial fixture attempts failed closed and rolled back completely:
1. the first guard detected two local portfolio owners and created zero rows;
2. the hardened reviewer lookup then hit PostgreSQL's unsupported `min(uuid)` aggregate and again rolled back with zero rows.

The fixture was corrected to count the expected auth user separately and retrieve its UUID without `min(uuid)`. The third run committed successfully.

Local persisted reference state after successful execution:
- primary `DOMESTIC_FORMULATIONS` — `REVIEWED`, `HIGH`;
- effective from `2026-03-31`;
- secondary `GLOBAL_GENERICS` — `MATERIAL`, `REVIEWED`, `MEDIUM`;
- secondary `CDMO_CRAMS` — `EMERGING`, `REVIEWED`, `MEDIUM`.

### Local browser proof
Authenticated localhost Research UI was opened against local Supabase only. The TORNTPHARM Research header rendered:
- `Scoring profile: Pharmaceuticals · Sector-resolved`;
- `Primary subprofile: Domestic Formulations · Reviewed`;
- `CDMO / CRAMS · Emerging`;
- `Global Generics · Material`;
- `Canonical sector: Pharma`;
- `Canonical industry: Pharmaceuticals`.

This proves the intended authority separation end-to-end: canonical application classification remains Pharma/Pharmaceuticals, while the reviewed research-methodology layer independently exposes the primary and material/emerging secondary Pharma business models.

**Production touched:** NO. The assignment/exposure write was to local Supabase only.

---

## 12. Entry 010 — TORNTPHARM Gate E reference implementation fully locally validated

**Date:** 17 September 2026  
**Actor:** owner-run local validation + GitHub CI verification

Fresh full local validation was run after the reviewed-assignment repository/UI integration and successful local persistence proof:
- `npm test`: **82/82 test files passed; 446/446 tests passed**;
- `npm run typecheck`: PASS;
- `npm run check:architecture`: PASS — presentation code contains no direct canonical storage access;
- `npm run lint:architecture`: PASS;
- `npm run build`: PASS;
- Vite build completed successfully; the only observed build diagnostic was the existing informational warning that some chunks exceed 500 kB after minification.

GitHub `PortfolioAI Architecture Guard` on the same development line also completed successfully (run #151 / workflow run `35227433349`).

This fresh validation is the authoritative current local-suite result for the current branch state and supersedes older historical test-count snapshots where counts differ.

### Locally validated reference implementation status
TORNTPHARM is now a complete **local Gate E reference implementation** covering:
1. reviewed business-model evidence decision;
2. approved secondary-exposure materiality handling;
3. human review provenance decision;
4. local canonical assignment/secondary-exposure persistence;
5. fail-closed repository resolution;
6. Research-header presentation of primary and secondary subprofiles;
7. preservation of canonical sector/industry authority;
8. full local test/typecheck/architecture-lint/build validation.

No production assignment row, production secondary-exposure row, evidence ingestion, score, recommendation, sizing write, provider call, scheduler change, PR merge or application deployment occurred in this validation step.

**Result:** TORNTPHARM Gate E reference implementation = **LOCALLY VALIDATED / PASS**.  
**Production persistence:** NOT AUTHORIZED / NOT PERFORMED.

---

## 13. Current production and repository state

- PR #101 remains **OPEN / DRAFT / UNMERGED**.
- Working branch remains `r4n-pharma-subprofile-architecture`.
- Latest pre-handoff implementation head validated locally was `7ad74955c455c2fdc78a5662b4a11d5616b7dea9`; this cumulative-handoff update is a later documentation-only commit on the same branch.
- Production contains the four R4N reconciliation migrations through `20260916100032`.
- PHARMA_V1 contract rows: 5.
- Production research-subprofile assignments: 0 rows.
- Production secondary-exposure rows: 0 rows.
- Local Supabase contains the reviewed TORNTPHARM reference assignment and its two reviewed secondary exposures for localhost validation only.
- TORNTPHARM's Gate E human-review decision is recorded as reviewed, and its end-to-end persistence/resolver/UI path is locally validated.
- The canonical UI separation is proven locally: `Pharma / Pharmaceuticals` remains canonical classification while `Domestic Formulations`, `Global Generics`, and `CDMO / CRAMS` are displayed as research-methodology facts.

Production assignment creation remains unauthorized.

---

## 14. Forward development path

- Gate E production boundary: before any production assignment persistence, perform a fresh read-only production preflight and prepare an exact idempotent persistence package. Do not write until the owner separately authorizes that exact production action.
- Gate F: TORNTPHARM official-evidence pilot; dry-run/validate first, ingest only after approval. Reuse the reviewed subprofile contract to activate only the applicable Domestic Formulations requirements plus approved secondary-exposure overlays/conditional regulatory requirements.
- Gate G: approve/version PHARMA_V1 scoring curves/thresholds/weights before numeric scoring.
- Gate H: deterministic TORNTPHARM scored pilot.
- Gate I: recommendation layer as a separate downstream gate.
- Gate J: controlled PHARMA_V1 rollout by subprofile cohorts; the TORNTPHARM Gate E reference flow should become reusable so routine cases do not require the owner to repeat a six-item manual review unless evidence is ambiguous/conflicting or a judgment override is required.
- Gate K: add other sector/profile families through the same universal Research workspace.
- Gate L: keep Core Selection, Core Health, Satellite Opportunity, Exit Radar and Position Sizing as separate decision methodologies.
- Gate M: portfolio-wide coverage/automation only after the individual engines are proven and provider accounting/scheduler safety remains intact.

---

## 15. Codex handback instruction

When Codex credits return:

> Read this cumulative handoff first, then independently inspect the current GitHub branch/PR, canonical repository docs, and current Supabase state relevant to the next gate. Treat this handoff as historical context, not a substitute for current verification. Preserve all production-safety gates. Continue from the newest unfinished stage and append completed work back into this cumulative history rather than replacing it with a latest-state-only summary.

**CURRENT STOP POINT:** TORNTPHARM's Gate E reference implementation is fully **locally validated** through reviewed decision, local persistence, fail-closed resolver consumption, Research-header rendering, and fresh full local validation. Production still has zero research-subprofile assignments and zero secondary-exposure rows. The next safe step is a fresh read-only production preflight plus preparation of the exact idempotent TORNTPHARM production-persistence package; do not write it, merge PR #101, deploy, ingest evidence, call paid providers, score, recommend, size, or modify schedulers without a new explicit owner authorization.

---

## 16. Entry 011 — Gate E production persistence explicitly authorized and validated

**Date:** 17 September 2026  
**Actor:** ChatGPT + owner explicit authorization

After localhost idempotency validation and a fresh read-only production preflight, the owner explicitly authorized only the reviewed TORNTPHARM Gate E assignment persistence.

The production write created exactly:
- one reviewed primary assignment: `DOMESTIC_FORMULATIONS`, `REVIEWED`, `HIGH`, effective from `2026-03-31`;
- one reviewed `GLOBAL_GENERICS` secondary exposure: `MATERIAL`, `MEDIUM`;
- one reviewed `CDMO_CRAMS` secondary exposure: `EMERGING`, `MEDIUM`.

Production assignment ID: `2833dec7-466c-4491-9a0a-47693dce3673`.

Immediate validation confirmed:
- TORNTPHARM PHARMA assignment count = 1;
- secondary exposure count = 2;
- unexpected secondary exposure count = 0;
- primary exact match = true;
- Global Generics exact match = true;
- CDMO / CRAMS exact match = true.

No PR merge, application deployment, Edge Function deployment, evidence ingestion, scoring, recommendation, sizing, provider call, migration, or scheduler change occurred in this persistence action.

**Result:** Gate E production persistence PASS for the exact owner-authorized TORNTPHARM reviewed assignment only.

---

## 17. Entry 012 — Local-first development workflow adopted for remaining R4N work

**Date:** 17 September 2026  
**Owner direction:** keep subsequent development explicitly local until meaningful visual changes are visible and reviewed.

The required working loop for remaining R4N development is:

```text
GitHub R4N branch
        ↓
Develop / update code
        ↓
Update cumulative development handoff at meaningful checkpoint
        ↓
Owner git pull
        ↓
Local code on owner's Mac
        ↓
Existing local Supabase
        ↓
Local Vite app
        ↓
localhost UI
        ↓
Owner visual approval
        ↓
Full local validation
        ↓
Update cumulative handoff with authoritative validation result
        ↓
Next gate
```

Fixed rules:
- `main` remains untouched during development;
- production Supabase remains untouched unless the owner explicitly authorizes a specific production action;
- existing local Supabase is reused rather than recreated unnecessarily;
- meaningful gates should produce visible localhost changes where applicable;
- visual review precedes completion of UI-facing gates;
- full local test/typecheck/architecture/build validation follows visual approval;
- the cumulative handoff must be updated at meaningful implementation and final-validation checkpoints.

---

## 18. Entry 013 — Gate F profile-driven Research workspace visual milestone

**Date:** 17 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate F began with a localhost-first visible workspace slice for TORNTPHARM. Added:
- `src/features/research/pharmaResearchWorkspaceModel.ts`
- `src/features/research/pharmaResearchWorkspaceModel.test.ts`
- `src/features/research/PharmaResearchWorkspacePanel.tsx`
- `src/features/research/PharmaResearchWorkspacePanel.css`
- Research Overview wiring in `src/pages/ResearchPage.tsx`.

The localhost Research Overview now visibly renders a **Business model research map** driven by the reviewed assignment rather than by generic Pharma assumptions.

Observed localhost behavior:
- primary model = `Domestic Formulations`;
- primary evidence lane count = 8 business-model-specific requirements;
- current local fixture state = `0/8 verified`, all missing requirements shown as `Unavailable` rather than zero;
- `GLOBAL_GENERICS / MATERIAL` activates a separate evidence overlay;
- `CDMO_CRAMS / EMERGING` renders as an explicit emerging watchlist and does not activate a full CDMO scorecard;
- the UI states that scoring methodology is not yet approved;
- secondary exposures remain separate and do not blend into a score.

The owner visually reviewed the first Gate F workspace and explicitly approved the **Gate F visual direction**.

Post-approval polish added:
- human-readable labels for Domestic Formulations, Global Generics and CDMO workspace metrics;
- stronger visual emphasis for the primary evidence summary;
- tighter secondary-exposure cards and overlay requirement spacing;
- focused test coverage for the friendly display labels.

Current polish head before local pull/validation: `d0e5fc6e89aefa5ccc501292c56510dddf37d70b`.

**Production touched by Gate F development:** NO.  
**Scoring methodology:** still unapproved / fail-closed.  
**Evidence ingestion:** not performed.  
**Full post-polish local validation:** PENDING.

**CURRENT STOP POINT:** Gate F visual direction is owner-approved and the minor polish is committed on the R4N branch. The next required step is owner `git pull`, localhost recheck of the polished workspace, then the full local validation suite. Do not perform any further production action.

---

## 19. Entry 014 — Gate F polished localhost workspace fully validated

**Date:** 18 September 2026  
**Actor:** owner-run localhost review + local validation + GitHub CI verification  
**Validated implementation head:** `d0e5fc6e89aefa5ccc501292c56510dddf37d70b`

After pulling the polished Gate F workspace, the owner reopened the TORNTPHARM Research Overview on localhost and confirmed the polished **Business model research map** renders correctly.

Visible localhost state confirmed:
- primary model remains `Domestic Formulations` with reviewed/high-confidence authority;
- primary evidence summary remains `0/8 verified` in the current local fixture;
- missing requirements remain explicitly `Unavailable` rather than numeric zero;
- `CDMO / CRAMS` remains an `EMERGING` watchlist and does not incorrectly activate a full CDMO scorecard;
- `Global Generics` remains a `MATERIAL` evidence overlay;
- scoring remains explicitly marked **not yet approved**;
- secondary exposures remain separate from the primary methodology and do not blend into a score.

The owner then ran the full chained local validation command:

```bash
npm test && npm run typecheck && npm run check:architecture && npm run lint:architecture && npm run build
```

The command chain reached the final Vite production build and returned successfully to the shell prompt, which confirms every preceding command in the `&&` chain passed:
- `npm test`: PASS;
- `npm run typecheck`: PASS;
- `npm run check:architecture`: PASS;
- `npm run lint:architecture`: PASS;
- `npm run build`: PASS.

Build details observed:
- Vite 8.2.2;
- 204 modules transformed;
- build completed in 247 ms;
- only the existing non-blocking warning about some chunks exceeding 500 kB after minification was shown.

GitHub `PortfolioAI Architecture Guard` for the polished implementation head also completed successfully: run #166 / workflow run `35258432651`.

**Result:** Gate F visual workspace slice = **LOCALLY VALIDATED / PASS**.  
**Production touched by this validation:** NO.  
**Evidence ingestion:** still not performed.  
**Scoring methodology:** still unapproved / fail-closed.  
**PR #101:** remains unmerged.

**CURRENT STOP POINT:** The first Gate F profile-driven Research workspace slice is owner-approved and fully locally validated. Continue Gate F locally only. The next development work should deepen the TORNTPHARM evidence workspace/readiness behavior without production writes, evidence ingestion, scoring, recommendation, sizing, provider calls, scheduler changes, PR merge, or deployment unless separately authorized.

---

## 20. Entry 015 — Gate F subprofile evidence-completeness slice prepared

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Implementation head before handoff update:** `ffb56f0fc4b5914224d52bf9cb03f3e6a649f3e9`

The next local-only Gate F slice deepens the existing Pharma Research Readiness panel so it can consume the same reviewed subprofile authority already used by the Business model research map.

Implementation changes:
- `ProfileResearchReadinessPanel` now receives the environment-resolved `securityId` and forwards it only to the PHARMA_V1 readiness path;
- `PharmaResearchReadinessPanel` now resolves the active reviewed Pharma subprofile assignment through the existing fail-closed repository hook;
- the readiness panel reuses `buildPharmaResearchWorkspaceModel` rather than creating a second subprofile interpretation path;
- a new **Reviewed business-model evidence / Subprofile evidence completeness** section summarizes the currently counted evidence requirements separately from the parent PHARMA_V1 readiness contract.

The new visible readiness summary is deliberately non-scoring:
- primary `Domestic Formulations` shows verified / total, unavailable, and attention counts;
- `GLOBAL_GENERICS / MATERIAL` contributes only its active evidence-overlay requirements to the displayed evidence-completeness denominator;
- `CDMO_CRAMS / EMERGING` is shown as an emerging watch and is explicitly excluded from the readiness denominator because no EMERGING-specific requirement contract has been approved;
- the panel states that this is **evidence completeness only** and does not define or imply a score, recommendation, Gate G weighting, threshold, or curve;
- Gate G remains the required owner-approved boundary before any numeric scoring methodology is introduced.

No local Supabase mutation is required for this slice; it consumes the already-reviewed local assignment and existing cached local research evidence.

**Production touched:** NO.  
**Evidence ingestion:** NO.  
**Scoring/recommendation/sizing:** NO.  
**Provider calls / scheduler changes / deployment / PR merge:** NO.

**CURRENT STOP POINT:** This second Gate F visual slice is committed and documented on the R4N branch but has not yet been pulled or visually validated on localhost. Next step: owner `git pull`, refresh the TORNTPHARM Overview against existing local Supabase, inspect the new **Subprofile evidence completeness** block, then approve/refine visually before the full local validation chain.

---

## 21. Entry 016 — Gate F readiness render-path hardening after localhost omission

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

After Entry 015, both local Vite dev and a fresh Vite preview still rendered the older Pharmaceuticals Research Readiness composition: the contracts disclosure was immediately followed by **Canonical Pharma financial history**, while neither the intended **Subprofile evidence completeness** section nor its fail-closed unavailable fallback appeared.

Repository/runtime-path inspection established:
- the current R4N source contained the new subprofile-readiness strings and the production build contained them in the generated ResearchPage bundle;
- `ProfileResearchReadinessPanel` selected the PHARMA_V1 readiness component for Pharma;
- `ResearchReadinessPanel` did render its generic React children;
- the visible canonical Pharma history is itself a child of that same shared readiness shell, so the defect was not a wholesale loss of the children collection;
- the existing tests covered BANK_NBFC profile selection and the shared readiness disclosure, but did not guard the Pharma subprofile supplementary slot/order.

To harden the exact failing composition boundary without changing evidence or scoring logic:
- `ResearchReadinessPanel` now exposes an explicit optional `supplementary` ReactNode slot immediately after the research-contract disclosure and before ordinary children;
- `PharmaResearchReadinessPanel` passes `subprofileReadiness` through that named slot;
- canonical Pharma financial history remains the ordinary child after the supplementary slot;
- `ResearchReadinessPanel.test.tsx` now asserts that supplementary readiness content renders visibly and precedes canonical Pharma history.

Repository-side checkpoint:
- shared-shell change commit: `222edab75c8120da065cc5a61ad7847327eb8481`;
- Pharma slot wiring commit: `f9b8011a140bde7b48f955f7271bee67ea5d838e`;
- render-order regression coverage commit: `76106f87a501bfbb11a4c1229b3fe9ae6d692589`;
- PortfolioAI Architecture Guard run #177 completed **SUCCESS** on `76106f87a501bfbb11a4c1229b3fe9ae6d692589`;
- Vercel branch status on that head was **SUCCESS**.

This repository-side success is not being treated as localhost visual proof. The exact browser-level mechanism behind the earlier first-child omission was not independently reproduced in the connector-only environment; instead, the failing UI boundary has been made explicit and covered by a regression test. Per the adopted local-first workflow, owner visual verification remains the next gate and the full local validation chain is intentionally deferred until after that visual result.

**Production touched:** NO.  
**Production Supabase:** unchanged.  
**Evidence ingestion / provider calls:** NO.  
**Scoring / recommendation / sizing:** NO.  
**Schedulers:** unchanged.  
**PR #101:** remains unmerged.

**CURRENT STOP POINT:** Pull the latest R4N branch locally, reuse the existing local Supabase/Vite setup, and inspect TORNTPHARM → Research → Overview. The required visual order is **View all Pharmaceuticals research contracts → Subprofile evidence completeness → Canonical Pharma financial history**. If the new block is visible, obtain owner visual approval first; only then run the full local validation chain and append its authoritative result to this cumulative handoff before the next gate.


---

## 22. Entry 017 — Gate F subprofile evidence-completeness visual approval and local validation

**Date:** 18 September 2026  
**Actor:** owner-run localhost review + local validation  
**Branch:** `r4n-pharma-subprofile-architecture`

After pulling the readiness render-path hardening, the owner restarted the local Vite dev process and reopened TORNTPHARM → Research → Overview against the existing local Supabase fixture.

### Localhost visual verification — PASS

The Pharmaceuticals Research Readiness panel now renders in the required order:

1. `View all Pharmaceuticals research contracts`
2. **Subprofile evidence completeness**
3. **Canonical Pharma financial history**

The visible reviewed business-model state is:
- primary model: **Domestic Formulations**;
- material overlays: **1**;
- emerging watches: **1**;
- emerging watch shown as **CDMO / CRAMS** and explicitly excluded from the readiness denominator;
- scoring state: **Not approved**;
- current evidence-completeness count: **0/14 counted requirements verified**.

This confirms that the supplementary subprofile-readiness slot is mounted in the intended runtime path and that the earlier localhost omission is resolved after restarting Vite on the pulled source. No browser-cache deletion, Supabase reset, port change, production deployment, or production data change was required.

### Local validation

The owner then ran the requested local validation sequence. The supplied terminal output confirms:
- Edge test suite: **27/27 test files passed; 140/140 tests passed**;
- production build: **PASS** under Vite 8.2.2;
- 204 modules transformed;
- build completed successfully;
- only the existing non-blocking warning that some chunks exceed 500 kB after minification remained.

The owner reported completion of the requested validation sequence without a failing command. This handoff records the owner-run local validation as PASS for this checkpoint; the visible terminal capture specifically preserves the Edge-suite and final build evidence.

### Scope boundary

- Production application deployment: **NO**
- Production Supabase mutation: **NO**
- Evidence ingestion: **NO**
- Paid/external provider calls: **NO**
- Numeric scoring / recommendation / sizing changes: **NO**
- Scheduler changes: **NO**
- PR #101 merge: **NO**

**Result:** Gate F subprofile evidence-completeness slice = **OWNER VISUALLY APPROVED / LOCALLY VALIDATED PASS**.

**CURRENT STOP POINT:** The second Gate F readiness slice is now visible and locally validated on the R4N development branch. PR #101 remains open/draft/unmerged. Continue only to the next explicitly agreed local development gate; do not deploy, merge, ingest evidence, call paid providers, introduce numeric scoring/recommendations/sizing, modify schedulers, or make production changes without the relevant explicit authorization.


---

## 23. Entry 018 — Gate F official-evidence pilot dry-run workspace prepared

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

The next local-only Gate F slice exposes the existing TORNTPHARM official-manifest pilot as a visible **dry-run preview** inside the shared Pharma Research workspace without performing any ingestion or database mutation.

### Architecture and safety

The existing TORNTPHARM official manifest contains 42 candidate observations intended primarily for canonical financial-history evidence. Its earlier preview used the historical production TORNTPHARM UUID. That production identity is retained only as a legacy fixture constant for existing validator coverage.

New runtime behavior:
- `buildTorntpharmIngestionPreview(securityId)` rebuilds the same immutable 42-row candidate set against the current environment-resolved security UUID;
- no runtime path infers or substitutes the production UUID;
- the existing pure ingestion validator is reused;
- the preview performs no repository, Supabase, provider, network, scoring, recommendation, sizing, or scheduler action.

Added:
- `src/features/research/pharmaEvidencePilotPreview.ts`
- `src/features/research/pharmaEvidencePilotPreview.test.ts`

Updated:
- `src/features/research/torntpharmIngestionPreview.ts`
- `src/features/research/PharmaResearchWorkspacePanel.tsx`
- `src/features/research/PharmaResearchWorkspacePanel.css`
- `src/pages/ResearchPage.tsx`

### Visible dry-run contract

For the TORNTPHARM pilot only, the universal Pharma workspace now exposes an **Evidence ingestion dry-run** section that shows:
- total candidate observations;
- validation-ready observations;
- direct-official lineage count;
- PortfolioAI-derived lineage count;
- quarantine count;
- projected impact against the counted business-model requirements.

The projection deliberately keeps canonical-history evidence separate from business-model evidence. The current 42-row manifest contains financial-history/raw evidence families and does **not** directly fulfill the 14 counted Domestic Formulations + Global Generics business-model requirements.

Expected current preview:
- candidate observations: **42**;
- validation-ready: **42**;
- direct official: **33**;
- PortfolioAI derived: **9**;
- quarantined: **0**;
- projected counted subprofile completeness from this manifest alone: **0/14**;
- Primary model: **0/8 projected**;
- Global Generics material overlay: **0/6 projected**.

This is intentionally informative rather than optimistic: a valid ingestion manifest does not become evidence for unrelated subprofile metrics merely because it is official or financially useful.

### Validation state

A focused pure-model regression test was added for the expected 42 / 33 / 9 / 0 and 0/14 projection contract.

Per the adopted local-first workflow, this implementation checkpoint is **not yet visually approved** and full local validation is intentionally deferred until after the owner pulls and inspects the localhost UI.

**Production touched:** NO.  
**Production Supabase:** unchanged.  
**Evidence ingestion:** NO.  
**Provider calls:** NO.  
**Scoring / recommendation / sizing:** NO.  
**Schedulers:** unchanged.  
**PR #101:** remains draft/open/unmerged.

**CURRENT STOP POINT:** Owner should `git pull`, restart/use the local Vite app against the existing local Supabase fixture, and inspect TORNTPHARM → Research → Overview. The new visible section should be **Gate F · Official evidence pilot / Evidence ingestion dry-run** and should show 42 candidates, 33 direct official, 9 derived, 0 quarantined, and 0/14 projected business-model completeness. Obtain visual approval before the full local validation chain.


---

## 24. Entry 019 — Gate F evidence-pilot localhost validation defect fixed

**Date:** 18 September 2026  
**Actor:** ChatGPT + owner localhost visual review  
**Branch:** `r4n-pharma-subprofile-architecture`

The owner pulled Entry 018 and visually inspected TORNTPHARM → Research → Overview.

The new **Evidence ingestion dry-run** panel rendered correctly, but the first localhost validation state was incorrect:
- candidate observations: 42;
- direct official: 33;
- PortfolioAI derived: 9;
- validation-ready: **0**;
- quarantined: **42**.

### Root cause

The environment-aware preview correctly rebound the manifest to the local TORNTPHARM security UUID:

`a4000000-0000-0000-0000-000000000002`

That value is accepted by PostgreSQL's `uuid` type and is the intentional local fixture identity. The ingestion validator, however, was stricter than the database contract: it required RFC version and variant nibbles and therefore rejected all local fixture rows as `INVALID_SECURITY_ID`.

This was a validator defect, not an evidence or ingestion defect.

### Fix

`researchEvidenceIngestionValidator.ts` now validates canonical UUID textual syntax:

`8-4-4-4-12 hexadecimal groups`

It no longer requires RFC-generated version/variant metadata that is not required by the canonical PostgreSQL UUID storage contract.

Regression coverage was added to prove that the known local fixture UUID is accepted without quarantine.

No evidence was ingested and no database write was performed.

**Production touched:** NO.  
**Production Supabase:** unchanged.  
**Evidence ingestion:** NO.  
**Provider calls:** NO.  
**Scoring / recommendation / sizing:** NO.  
**Schedulers:** unchanged.  
**PR #101:** remains draft/open/unmerged.

**CURRENT STOP POINT:** Pull the latest R4N branch and re-open the TORNTPHARM Evidence ingestion dry-run panel. The corrected localhost expectation is 42 validation-ready and 0 quarantined. Visual approval remains pending until that corrected state is observed; full local validation remains deferred until after visual approval.


---

## 25. Entry 020 — Gate F official-evidence pilot dry-run visually approved and locally validated

**Date:** 18 September 2026  
**Actor:** owner-run localhost review + local validation  
**Branch:** `r4n-pharma-subprofile-architecture`

After pulling the UUID-validation fix, the owner reopened TORNTPHARM → Research → Overview and visually confirmed the **Gate F · Official evidence pilot / Evidence ingestion dry-run** panel in its corrected state.

### Localhost visual verification — PASS

The visible dry-run state now shows:
- candidate observations: **42**;
- validation-ready: **42**;
- direct official lineage: **33**;
- PortfolioAI-derived lineage: **9**;
- quarantined: **0**;
- projected subprofile completeness: **0/14**;
- Primary model: **0/8 projected**;
- Global Generics: **0/6 projected**.

This confirms:
- the environment-aware local security UUID is accepted by the validator;
- the 42-row manifest is internally validation-ready;
- no row is quarantined;
- canonical financial-history observations remain correctly separated from the 14 counted Domestic Formulations + Global Generics business-model evidence requirements.

The owner visually approved this corrected dry-run presentation.

### Local validation

The owner then ran the requested local validation sequence:
- `git status`
- `git branch --show-current`
- `git rev-parse HEAD`
- `npm run typecheck`
- `npm run lint`
- `npm run check:architecture`
- `npm run lint:architecture`
- `npm run lint:edge`
- `npm run test`
- `npm run test:edge`
- `npm run build`

The supplied terminal capture directly confirms:
- Edge test suite: **27/27 test files passed; 140/140 tests passed**;
- production build: **PASS** under Vite 8.2.2;
- **208 modules transformed**;
- build completed successfully;
- only the existing non-blocking warning about chunks exceeding 500 kB after minification remained.

No failure was reported from the preceding owner-run commands in the requested sequence.

### Scope boundary

- Production application deployment: **NO**
- Production Supabase mutation: **NO**
- Evidence ingestion: **NO**
- Paid/external provider calls: **NO**
- Numeric scoring / recommendation / sizing changes: **NO**
- Scheduler changes: **NO**
- PR #101 merge: **NO**

**Result:** Gate F official-evidence pilot dry-run slice = **OWNER VISUALLY APPROVED / LOCALLY VALIDATED PASS**.

**CURRENT STOP POINT:** The TORNTPHARM official-manifest dry-run is now visible and locally validated. The next Gate F work should remain local-first and should prepare the business-model-specific evidence acquisition/manifest contract needed to address the 14 currently unmet Domestic Formulations + Global Generics requirements. Do not ingest evidence, deploy, merge PR #101, call paid providers, introduce scoring/recommendations/sizing, modify schedulers, or make production changes without the relevant explicit authorization.
