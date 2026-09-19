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


---

## 26. Entry 021 — Gate F business-model evidence acquisition/manifest contract prepared

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

The next local-only Gate F slice converts the 14 currently unmet TORNTPHARM business-model requirements into an explicit acquisition/manifest planning contract without fetching or ingesting evidence.

### New reusable acquisition contract

Added:
- `src/features/research/pharmaBusinessModelEvidenceAcquisitionContract.ts`
- `src/features/research/pharmaBusinessModelEvidenceAcquisitionContract.test.ts`
- `docs/R4N_TORNTPHARM_Gate_F_Business_Model_Evidence_Acquisition_Contract.md`

Updated:
- `src/features/research/PharmaResearchWorkspacePanel.tsx`
- `src/features/research/PharmaResearchWorkspacePanel.css`

The acquisition layer derives requirement/history/source authority from the existing canonical PHARMA_V1 + subprofile contracts rather than redefining those contracts.

For each counted business-model metric it adds a planning-only acquisition strategy:
- source lanes;
- access gate;
- acquisition method;
- required evidence shape;
- explicit fail-closed rule.

### Access gates

The design distinguishes:
- `PUBLIC_OFFICIAL_FIRST` — issuer/exchange/regulator evidence first;
- `PUBLIC_OR_LICENSED` — issuer disclosure may satisfy the contract, with a licensed fallback only if separately approved;
- `LICENSED_REQUIRED` — issuer self-description alone cannot complete the evidence contract.

No licensed provider call is authorized.

### TORNTPHARM plan invariants

The current reviewed model produces exactly:
- **14** planned requirements;
- **8 mandatory**;
- **5 important**;
- **1 supplementary**;
- **12 public/official-first**;
- **1 public-or-licensed**;
- **1 licensed-source required**;
- **3 controlled derivations** from explicitly disclosed compatible inputs;
- **0 CDMO / CRAMS acquisition rows**, because the CDMO exposure remains Emerging-only and has no approved Emerging-specific requirement contract;
- `ingestionAuthorized = false`.

Important access boundaries:
- **Brand & Therapy Leadership** requires issuer evidence plus an approved licensed market source; issuer self-description alone is not sufficient.
- **Chronic / Acute Mix** may use issuer disclosure first, with a licensed source only as an approved fallback.
- Domestic Revenue Growth, Field Force Productivity and Export / US Revenue Growth may be derived only from explicitly disclosed, scope-compatible direct inputs.
- Qualitative commentary must not be converted into fabricated numeric observations.

### Visible localhost milestone

For TORNTPHARM only, the Pharma Research workspace now renders a planning-only **Gate F · Business-model evidence contract / Evidence acquisition plan** section after the official-manifest dry-run.

The panel exposes:
- the 14-requirement summary;
- public/official vs licensed access gates;
- controlled-derivation count;
- separate Domestic Formulations (8) and Global Generics (6) acquisition lists;
- per-requirement history target, acquisition method, source lanes, evidence shape and fail-closed rule;
- explicit **Planned · No ingestion** state.

No source-fetch, provider-call, ingest or scoring action is exposed.

### Validation state

Regression coverage asserts:
- 14 unique acquisition items;
- 8 primary + 6 material-overlay items;
- exact 8 / 5 / 1 requirement-level counts;
- exact 12 / 1 / 1 access-gate counts;
- 3 controlled derivations;
- licensed requirement for Brand & Therapy Leadership;
- public-or-licensed state for Chronic / Acute Mix;
- no CDMO rows while CDMO remains Emerging;
- ingestion authorization remains false.

Per the local-first workflow, this implementation checkpoint has **not yet been visually approved** and full local validation is intentionally deferred until after owner localhost review.

**Production touched:** NO.  
**Production Supabase:** unchanged.  
**Evidence ingestion:** NO.  
**Source acquisition/provider calls:** NO.  
**Scoring / recommendation / sizing:** NO.  
**Schedulers:** unchanged.  
**PR #101:** remains draft/open/unmerged.

**CURRENT STOP POINT:** Owner should `git pull`, reopen TORNTPHARM → Research → Overview, and inspect the new **Evidence acquisition plan** section. Expected summary: 14 planned requirements, 8 mandatory / 5 important / 1 supplementary, 12 public/official-first, 2 licensed-source gates (1 required + 1 optional fallback), and 3 controlled derivations. Obtain visual approval before full local validation.


---

## 27. Entry 022 — Gate F business-model evidence acquisition contract visually approved and locally validated

**Date:** 18 September 2026  
**Actor:** owner-run localhost review + local validation  
**Branch:** `r4n-pharma-subprofile-architecture`

After pulling Entry 021, the owner reopened TORNTPHARM → Research → Overview and visually reviewed the new **Gate F · Business-model evidence contract / Evidence acquisition plan**.

### Localhost visual verification — PASS

The rendered planning contract correctly shows:
- **14 planned requirements**;
- **8 mandatory / 5 important / 1 supplementary**;
- **12 public/official-first** acquisition lanes;
- **2 licensed-source gates** — 1 required + 1 optional fallback;
- **3 controlled derivations** from explicitly disclosed compatible inputs;
- separate **Domestic Formulations · 8 requirements** and **Global Generics · 6 requirements** columns;
- **Planned · No ingestion** state;
- per-requirement history target, acquisition method, source lanes, evidence shape and fail-closed rule;
- **Brand & Therapy Leadership** marked **Licensed source required**;
- **Chronic / Acute Mix** marked **Public or licensed**;
- no CDMO acquisition rows while CDMO / CRAMS remains Emerging-only.

The owner visually approved the contract presentation.

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
- **209 modules transformed**;
- build completed successfully;
- only the existing non-blocking warning about chunks exceeding 500 kB after minification remained.

No failure was reported from the preceding owner-run commands in the requested sequence.

### Scope boundary

- Production application deployment: **NO**
- Production Supabase mutation: **NO**
- Evidence ingestion: **NO**
- Source acquisition/provider calls: **NO**
- Paid/licensed provider calls: **NO**
- Numeric scoring / recommendation / sizing changes: **NO**
- Scheduler changes: **NO**
- PR #101 merge: **NO**

**Result:** Gate F business-model evidence acquisition/manifest contract = **OWNER VISUALLY APPROVED / LOCALLY VALIDATED PASS**.

**CURRENT STOP POINT:** The 14-requirement TORNTPHARM business-model evidence acquisition contract is designed, visible and locally validated. The next safe Gate F step is a **public/official source-discovery dry run** for the 12 PUBLIC_OFFICIAL_FIRST requirements only: identify candidate issuer/exchange/regulator artifacts and map them to requirement/history gaps without ingesting evidence or calling licensed providers. Keep Brand & Therapy Leadership licensed-source work separately gated, and do not use the Chronic / Acute Mix licensed fallback unless issuer evidence proves insufficient and separate approval is obtained.


---

## 28. Entry 023 — Gate F public / official source-discovery dry run prepared

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

The next local-only Gate F slice maps the 12 `PUBLIC_OFFICIAL_FIRST` TORNTPHARM business-model requirements to candidate public issuer/listed-company/regulator artifacts without reviewing or ingesting evidence.

### New discovery contract

Added:
- `src/features/research/torntpharmPublicOfficialSourceDiscovery.ts`
- `src/features/research/torntpharmPublicOfficialSourceDiscovery.test.ts`
- `docs/R4N_TORNTPHARM_Gate_F_Public_Official_Source_Discovery.md`

Updated:
- `src/features/research/PharmaResearchWorkspacePanel.tsx`
- `src/features/research/PharmaResearchWorkspacePanel.css`

The discovery contract is intentionally separate from acquisition planning and evidence ingestion. It records only that a candidate public/official source exists.

### Public / official artifact spine

The dry run currently records **8 discovered artifacts**:
- Torrent annual-reports archive;
- Torrent Integrated Annual Report 2025-26;
- Torrent Integrated Annual Report 2023-24;
- Torrent quarterly-results archive;
- Torrent Q4 FY26 results release;
- Torrent SEBI / LODR disclosure archive;
- FDA 2019 Indrad warning letter;
- FDA 2024 Indrad closeout letter.

The regulatory mapping preserves both the historical FDA action and the later closeout so an old warning cannot be treated as the current regulator state by itself.

### Discovery invariants

For the 12 public/official-first requirements:
- scoped requirements: **12**;
- mapped requirements: **12**;
- discovered artifacts: **8**;
- issuer/listed-company artifacts: **6**;
- regulator artifacts: **2**;
- source hubs: **3**;
- every requirement state = `CANDIDATE_SOURCE_FOUND`;
- every evidence state = `NOT_REVIEWED`;
- `sourceFetchAuthorized = false`;
- `ingestionAuthorized = false`.

The two licensed-gated requirements remain excluded:
- Brand & Therapy Leadership;
- Chronic / Acute Mix.

### Visible localhost milestone

For TORNTPHARM only, the Pharma Research workspace now renders:

**Gate F · Public / official discovery / Public / official source discovery**

The panel shows:
- 12 requirements in scope;
- 12 mapped;
- 8 official artifacts;
- 6 issuer/listed-company and 2 regulator artifacts;
- 3 source hubs;
- evidence reviewed = 0;
- compact artifact registry;
- per-requirement candidate artifact codes and remaining history/content-review gap;
- explicit **Discovery only · No fetch** state.

No source-fetch button, provider action, evidence promotion, or ingestion action is exposed.

### Validation state

Regression coverage asserts:
- 12/12 public/official-first mapping;
- exact 8 / 6 / 2 / 3 artifact summary;
- every mapped requirement remains NOT_REVIEWED;
- source fetch and ingestion authorization remain false;
- licensed-gated metrics are excluded;
- both FDA action and closeout artifacts remain linked to Regulatory Site Status.

Per the local-first workflow, this implementation checkpoint is **not yet visually approved** and full local validation is deferred until after owner localhost review.

**Production touched:** NO.  
**Production Supabase:** unchanged.  
**Evidence ingestion:** NO.  
**Source fetch/provider calls:** NO.  
**Paid/licensed provider calls:** NO.  
**Scoring / recommendation / sizing:** NO.  
**Schedulers:** unchanged.  
**PR #101:** remains draft/open/unmerged.

**CURRENT STOP POINT:** Owner should `git pull`, reopen TORNTPHARM → Research → Overview, and inspect the new **Public / official source discovery** section. Expected summary: 12 requirements in scope, 12 mapped, 8 official artifacts, 6 issuer/listed-company + 2 regulator, 3 source hubs, and 0 evidence reviewed. Obtain visual approval before the full local validation chain.


---

## 29. Entry 024 — Gate F public / official source-discovery dry run visually approved and locally validated

**Date:** 18 September 2026  
**Actor:** owner-run localhost review + local validation  
**Branch:** `r4n-pharma-subprofile-architecture`

After pulling Entry 023, the owner reopened TORNTPHARM → Research → Overview and visually reviewed the new **Gate F · Public / official discovery / Public / official source discovery** panel.

### Localhost visual verification — PASS

The rendered discovery panel correctly shows:
- **12 requirements in scope**;
- **12 mapped** to candidate public/official source families;
- **8 official artifacts**;
- **6 issuer/listed-company artifacts**;
- **2 regulator artifacts**;
- **3 source hubs**;
- **0 evidence reviewed**;
- explicit **Discovery only · No fetch** state.

The artifact registry visibly preserves:
- Torrent annual-report archive;
- Torrent Integrated Annual Report 2025-26;
- Torrent Integrated Annual Report 2023-24;
- Torrent quarterly-results archive;
- Torrent Q4 FY26 results release;
- Torrent SEBI / LODR disclosure archive;
- FDA 2019 Indrad warning letter;
- FDA 2024 Indrad closeout letter.

The lower discovery list also rendered correctly, including the remaining Global Generics rows:
- Export / US Revenue Growth;
- Pipeline / Launch / Approval Evidence;
- US Generic Price Erosion;
- Generics Volume / Mix;
- Complex / Specialty Generics Mix.

Each row remains **Candidate source found** with an explicit remaining history/content-review gap. The boundary message correctly keeps **Brand & Therapy Leadership** and **Chronic / Acute Mix** outside this 12-row public/official-first dry run because their licensed-source gates remain separately controlled.

The owner visually approved the discovery presentation.

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
- **210 modules transformed**;
- build completed successfully;
- only the existing non-blocking warning about chunks exceeding 500 kB after minification remained.

No failure was reported from the preceding owner-run commands in the requested sequence.

### Scope boundary

- Production application deployment: **NO**
- Production Supabase mutation: **NO**
- Evidence ingestion: **NO**
- Source fetch/provider calls: **NO**
- Paid/licensed provider calls: **NO**
- Numeric scoring / recommendation / sizing changes: **NO**
- Scheduler changes: **NO**
- PR #101 merge: **NO**

**Result:** Gate F public / official source-discovery dry-run slice = **OWNER VISUALLY APPROVED / LOCALLY VALIDATED PASS**.

**CURRENT STOP POINT:** The public/official source spine for all 12 PUBLIC_OFFICIAL_FIRST requirements is now visible and locally validated. The next safe Gate F step is **artifact-level content review planning**: enumerate exact periods/documents from the source hubs, classify whether each artifact is likely to contain the required evidence shape, and compute per-requirement history gaps while keeping every evidence state NOT_REVIEWED and performing no ingestion.


---

## 30. Entry 025 — Gate F artifact-level content review planning prepared

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

The next local-only Gate F slice converts the previously discovered public/official source hubs into an exact artifact-level content review queue for the 12 `PUBLIC_OFFICIAL_FIRST` TORNTPHARM business-model requirements.

### New artifact-level planning contract

Added:
- `src/features/research/torntpharmArtifactContentReviewPlan.ts`
- `src/features/research/torntpharmArtifactContentReviewPlan.test.ts`
- `docs/R4N_TORNTPHARM_Gate_F_Artifact_Content_Review_Plan.md`

Updated:
- `src/features/research/PharmaResearchWorkspacePanel.tsx`
- `src/features/research/PharmaResearchWorkspacePanel.css`

### Exact review queue

The plan freezes **12 exact public/official artifacts**:
- 4 annual reports: FY2022-23, FY2023-24, FY2024-25, FY2025-26;
- 5 quarterly releases: Q4 FY25, Q1 FY26, Q2 FY26, Q3 FY26, Q4 FY26;
- 2 FDA documents: 2019 Indrad warning letter and 2024 Indrad closeout letter;
- 1 listed-company filing: 21 January 2026 Regulation 30 filing for completion of the JB Chemicals acquisition.

Every artifact remains `NOT_REVIEWED`.

### Relevance planning

Artifact-to-requirement links are classified conservatively as:
- `LIKELY_RELEVANT`;
- `POSSIBLY_RELEVANT`.

These are planning labels only and do not promote evidence state.

Disclosure-sensitive requirements are intentionally conservative. For example, the five quarterly releases remain only `POSSIBLY_RELEVANT` for US Generic Price Erosion until explicit compatible price/ASP evidence is actually reviewed.

### Planning coverage vs reviewed evidence

The model separately tracks:
- candidate-document planning coverage;
- minimum planning gap;
- preferred planning gap;
- reviewed-observation count;
- minimum reviewed-evidence gap.

Current invariant:
- requirements planned: **12**;
- exact artifacts planned: **12**;
- annual reports: **4**;
- quarterly releases: **5**;
- regulator documents: **2**;
- exchange filings: **1**;
- requirements with minimum planning horizon covered: **12/12**;
- requirements with preferred planning horizon covered: **5/12**;
- evidence reviewed: **0**;
- all requirements remain `NOT_REVIEWED`.

Example: Export / US Revenue Growth has 5 quarterly candidate documents against a 4-quarter minimum / 8-quarter preferred contract, so minimum planning gap is 0 and preferred planning gap is 3; reviewed observations remain 0 and minimum reviewed-evidence gap remains 4.

### Safety invariants

- `contentFetchAuthorized = false`;
- `evidenceReviewAuthorized = false`;
- `ingestionAuthorized = false`;
- no paid/licensed provider call;
- no production write;
- no scoring/recommendation/sizing;
- no scheduler change.

### Visible localhost milestone

For TORNTPHARM only, the Pharma Research workspace now renders:

**Gate F · Artifact-level review planning / Exact document review plan**

The panel exposes:
- 12 exact planned artifacts;
- document-type counts;
- 12/12 minimum planning coverage;
- 5/12 preferred planning coverage;
- evidence reviewed = 0;
- exact document periods;
- per-requirement candidate-document count;
- minimum/preferred planning gaps;
- minimum reviewed-evidence gap;
- `LIKELY` vs `POSSIBLE` relevance labels;
- explicit **Planning only · 0 reviewed** state.

Per the local-first workflow, this implementation checkpoint is **not yet visually approved** and full local validation is deferred until after owner localhost review.

**Production touched:** NO.  
**Production Supabase:** unchanged.  
**Evidence ingestion:** NO.  
**Content fetch / evidence review:** NO.  
**Paid/licensed provider calls:** NO.  
**Scoring / recommendation / sizing:** NO.  
**Schedulers:** unchanged.  
**PR #101:** remains draft/open/unmerged.

**CURRENT STOP POINT:** Owner should `git pull`, reopen TORNTPHARM → Research → Overview, and inspect the new **Exact document review plan** section. Expected summary: 12 exact artifacts, 4 annual + 5 quarterly + 2 regulator + 1 exchange filing, 12/12 minimum planning coverage, 5/12 preferred planning coverage, and 0 evidence reviewed. Obtain visual approval before the full local validation chain.


---

## 31. Entry 026 — Gate F artifact-level content review planning visually approved and locally validated

**Date:** 18 September 2026  
**Actor:** owner-run localhost review + local validation  
**Branch:** `r4n-pharma-subprofile-architecture`

After pulling Entry 025, the owner reopened TORNTPHARM → Research → Overview and visually reviewed the new **Gate F · Artifact-level review planning / Exact document review plan**.

### Localhost visual verification — PASS

The rendered plan correctly shows:
- **12 exact artifacts planned**;
- **4 annual reports**;
- **5 quarterly result releases**;
- **2 regulator documents**;
- **1 exchange filing**;
- **12 requirements planned**;
- **12/12 minimum planning horizons covered**;
- **5/12 preferred planning horizons covered**;
- **0 evidence reviewed**;
- every requirement remains **NOT REVIEWED**.

The lower Global Generics rows also rendered correctly, including:
- Regulatory Site Status;
- Export / US Revenue Growth;
- Pipeline / Launch / Approval Evidence;
- US Generic Price Erosion;
- Generics Volume / Mix;
- Complex / Specialty Generics Mix.

The per-requirement gap model correctly keeps candidate-document planning separate from reviewed evidence. Example: Export / US Revenue Growth has 5 candidate quarterly documents against a 4-quarter minimum / 8-quarter preferred contract, therefore:
- minimum planning gap = 0;
- preferred planning gap = 3;
- reviewed observations = 0;
- minimum reviewed-evidence gap = 4.

The owner visually approved the artifact-level planning presentation.

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
- **211 modules transformed**;
- build completed successfully;
- only the existing non-blocking warning about chunks exceeding 500 kB after minification remained.

No failure was reported from the preceding owner-run commands in the requested sequence.

### Scope boundary

- Production application deployment: **NO**
- Production Supabase mutation: **NO**
- Evidence ingestion: **NO**
- Content fetch / evidence review: **NO**
- Paid/licensed provider calls: **NO**
- Numeric scoring / recommendation / sizing changes: **NO**
- Scheduler changes: **NO**
- PR #101 merge: **NO**

**Result:** Gate F artifact-level content review planning slice = **OWNER VISUALLY APPROVED / LOCALLY VALIDATED PASS**.

**CURRENT STOP POINT:** The 12 exact public/official artifacts are now planned and locally validated, but no document content has yet been reviewed into evidence. The next safe Gate F step is a separately authorized **read-only content-review dry run** against a small public/official subset, producing proposed evidence candidates and explicit rejection/gap reasons while performing no ingestion.


---

## 32. Entry 027 — Gate F read-only public content-review dry run prepared

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

A first read-only content-review dry run has now been prepared against a deliberately small public/official TORNTPHARM subset. The goal is to test whether actual source content can be converted into proposed evidence candidates and explicit rejection/gap reasons without writing anything to canonical evidence storage.

### Reviewed artifact subset

The pilot reviews exactly **6 public/official artifacts**:
- Torrent Q1 FY26 results release;
- Torrent Q2 FY26 results release;
- Torrent Q3 FY26 results release;
- Torrent Q4 FY26 results release;
- FDA 2019 Indrad warning letter;
- FDA 2024 Indrad closeout letter.

Added:
- `src/features/research/torntpharmReadOnlyContentReviewDryRun.ts`
- `src/features/research/torntpharmReadOnlyContentReviewDryRun.test.ts`
- `docs/R4N_TORNTPHARM_Gate_F_Read_Only_Content_Review_Dry_Run.md`

Updated:
- `src/features/research/PharmaResearchWorkspacePanel.tsx`
- `src/features/research/PharmaResearchWorkspacePanel.css`

### Pilot 1 — Export / US Revenue Growth

Issuer releases explicitly disclose US revenue growth of:
- Q1 FY26: **19% YoY**;
- Q2 FY26: **26% YoY**;
- Q3 FY26: **19% YoY**.

Q4 FY26 is deliberately normalized for scope:
- reported US revenue growth = **31% YoY**;
- the same release separately discloses **16% YoY base-business US growth**;
- Q4 FY26 consolidated results include JB Pharma from 21 January 2026.

The reported 31% claim is therefore **rejected from the comparable four-quarter candidate series**. The proposed Q4 observation uses the explicitly disclosed 16% base-business growth to preserve pre-acquisition scope compatibility with Q1-Q3.

Proposed candidate series:
- 2025-06-30: 19%;
- 2025-09-30: 26%;
- 2025-12-31: 19%;
- 2026-03-31: 16% base-business.

Dry-run state:
- proposed observations: **4**;
- minimum history requirement: **4 quarters**;
- proposed minimum gap: **0**;
- proposal state: `MINIMUM_CANDIDATE_HISTORY_PRESENT`;
- ingestion writes: **0**.

These remain proposals only and are not promoted to canonical evidence.

### Pilot 2 — Regulatory Site Status

The FDA chain is kept site-scoped:
- 8 October 2019 warning letter: significant CGMP violations at the Indrad facility after the April 2019 inspection;
- 4 September 2024 closeout letter: FDA states that, based on its evaluation, the firm appears to have addressed the violations in Warning Letter 320-20-03, while future inspections/regulatory activity will assess sustainability.

Proposed event candidates:
- 2019-10-08: `WARNING_LETTER_ACTIVE`;
- 2024-09-04: `WARNING_LETTER_CLOSED_OUT`.

Dry-run state:
- `PARTIAL_SCOPE_REVIEW`;
- the pilot does **not** assert company-wide regulatory clearance because other material US-facing manufacturing sites and any later regulator actions remain outside this small review subset.

### Dry-run invariants

- reviewed artifacts: **6**;
- proposed candidates: **6**;
- rejected claims: **1**;
- requirements piloted: **2**;
- ingestion writes: **0**;
- `ingestionAuthorized = false`.

Regression coverage asserts:
- exact 19 / 26 / 19 / 16 four-quarter candidate series;
- Q4 31% reported claim remains rejected from the comparable series;
- Q4 16% candidate is explicitly base-business;
- FDA warning + closeout remain two dated site-scoped events;
- regulatory result remains partial-scope rather than company-wide clearance;
- no ingestion authorization.

### Visible localhost milestone

For TORNTPHARM only, the Pharma Research workspace now renders:

**Gate F · Read-only content review / Public document content-review dry-run**

The panel shows:
- 6 reviewed artifacts;
- 6 proposed candidates;
- 1 rejected claim;
- 0 ingestion writes;
- two pilot requirement summaries;
- each proposed candidate with date, source artifact, value/state, basis and provenance summary;
- the rejected Q4 31% claim with its scope-compatibility reason;
- explicit **Read-only · No ingestion** state.

Per the local-first workflow, this implementation checkpoint is **not yet visually approved** and full local validation is deferred until after owner localhost review.

**Production touched:** NO.  
**Production Supabase:** unchanged.  
**Evidence ingestion:** NO.  
**Paid/licensed provider calls:** NO.  
**Scoring / recommendation / sizing:** NO.  
**Schedulers:** unchanged.  
**PR #101:** remains draft/open/unmerged.

**CURRENT STOP POINT:** Owner should `git pull`, reopen TORNTPHARM → Research → Overview, and inspect the new **Public document content-review dry-run** section. Expected summary: 6 reviewed artifacts, 6 proposed candidates, 1 rejected claim, 2 requirements piloted, and 0 ingestion writes. Obtain visual approval before the full local validation chain.


---

## 33. Entry 028 — Gate F read-only public content-review dry run visually approved and locally validated

**Date:** 18 September 2026  
**Actor:** owner-run localhost review + local validation  
**Branch:** `r4n-pharma-subprofile-architecture`

After pulling Entry 027, the owner reopened TORNTPHARM → Research → Overview and visually reviewed the new **Gate F · Read-only content review / Public document content-review dry-run**.

### Localhost visual verification — PASS

The rendered dry-run correctly shows:
- **6 artifacts reviewed**;
- **6 proposed candidates**;
- **1 rejected claim**;
- **0 ingestion writes**;
- Export / US Revenue Growth = **Minimum Candidate History Present**;
- Regulatory Site Status = **Partial Scope Review**;
- explicit **Read-only · No ingestion** state.

The proposed US-growth candidate series is visibly:
- Q1 FY26: **19%**;
- Q2 FY26: **26%**;
- Q3 FY26: **19%**;
- Q4 FY26: **16% base-business**.

The Q4 FY26 reported **31%** US-growth claim is visibly rejected from the comparable four-quarter series because Q4 consolidated results include JB Pharma from 21 January 2026; the same release's 16% base-business US-growth figure is used as the scope-compatible candidate instead.

The FDA Indrad chain is rendered as two site-scoped proposed events:
- 2019-10-08: `WARNING_LETTER_ACTIVE`;
- 2024-09-04: `WARNING_LETTER_CLOSED_OUT`.

The boundary text correctly keeps the regulatory result partial-scope and does not convert the Indrad closeout into a company-wide current regulatory-clearance claim.

The owner visually approved the dry-run presentation.

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
- **212 modules transformed**;
- build completed successfully;
- only the existing non-blocking warning about chunks exceeding 500 kB after minification remained.

No failure was reported from the preceding owner-run commands in the requested sequence.

### Scope boundary

- Production application deployment: **NO**
- Production Supabase mutation: **NO**
- Evidence ingestion: **NO**
- Paid/licensed provider calls: **NO**
- Numeric scoring / recommendation / sizing changes: **NO**
- Scheduler changes: **NO**
- PR #101 merge: **NO**

**Result:** Gate F read-only public content-review dry-run slice = **OWNER VISUALLY APPROVED / LOCALLY VALIDATED PASS**.

**CURRENT STOP POINT:** The first read-only source-content review is now proven end-to-end for two TORNTPHARM requirements. The next safe step should be a HDFCBANK ↔ TORNTPHARM Research-page consistency audit before expanding additional Pharma review UI, so the final product keeps a shared visual/UX grammar while retaining sector-specific evidence contracts. Separately, any candidate-to-ingestion proposal or actual evidence write remains approval-gated.


---

## 34. Entry 029 — HDFCBANK ↔ TORNTPHARM Research-page consistency audit and hierarchy correction prepared

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

A cross-profile Research-page consistency audit was performed after the first TORNTPHARM read-only content-review dry run.

### Owner design requirement

The page must follow this product rule:

> HDFCBANK and TORNTPHARM may have materially different research criteria and sector-specific research sections, but at a glance they must look like the same PortfolioAI product.

The audit therefore distinguishes **visual/product consistency** from **research-content sameness**.

### Audit result

Most top-level Research components are already shared across profiles:
- security/header shell;
- position dashboard;
- decision controls;
- Research Refresh placement;
- seven Research tabs;
- Research at a glance heading;
- three-card context strip;
- Investment Decision Cockpit / scorecard;
- Research Readiness shell;
- Investment heatmap visual grammar;
- snapshot/cockpit cards;
- Research Health;
- Documents / Evidence patterns.

The principal visual drift was ordering.

Before this correction, TORNTPHARM inserted the full Pharma deep-research workspace immediately after the context strip, before the shared scorecard/readiness/cockpit flow. HDFCBANK did not. This made the pages feel different at first glance even though the shared components themselves were reusable.

### R4N hierarchy correction

`src/pages/ResearchPage.tsx` now preserves this shared Overview spine for every profile:

1. Research at a glance
2. Context strip
3. Investment Decision Cockpit / ResearchScorecardPanel
4. Profile Research Readiness
5. Snapshot cockpit
6. Research Health

Only after that shared spine, TORNTPHARM adds:

**Sector research workspace**

followed by the existing Pharma-specific deep-research workspace.

No Pharma research content was removed or forced into BANK_NBFC structures.

### Allowed profile divergence

Sector/profile-specific content may continue to differ in:
- profile/subprofile identity;
- metric and evidence contracts;
- dimension labels/applicability;
- readiness details and counts;
- snapshot metrics;
- Financials / Quality & Growth content;
- refresh modules;
- source/acquisition/review workflows;
- Pharma subprofile/overlay logic;
- BANK_NBFC-specific evidence and completion workflows.

The governing rule is now documented in:
- `docs/R4N_HDFCBANK_TORNTPHARM_Research_Page_Consistency_Audit.md`

### Validation state

A source-level ordering check confirms the shared order is now:

`ResearchScorecardPanel → ProfileResearchReadinessPanel → research-cockpit → research-health → Sector research workspace → PharmaResearchWorkspacePanel`.

Per the established local-first workflow, this hierarchy correction is **not yet visually approved** and full local validation is intentionally deferred until after owner side-by-side localhost review.

**Production touched:** NO.  
**Production Supabase:** unchanged.  
**Evidence ingestion:** NO.  
**Paid/licensed provider calls:** NO.  
**Scoring / recommendation / sizing changes:** NO.  
**Schedulers:** unchanged.  
**PR #101:** remains draft/open/unmerged.

**CURRENT STOP POINT:** Owner should `git pull`, open both HDFCBANK and TORNTPHARM Research → Overview locally, and compare the first-glance hierarchy. The common Overview spine should now feel consistent while TORNTPHARM's sector-specific deep research begins only after Research Health under **Sector research workspace**. Obtain visual approval before full local validation.


---

## 35. Entry 030 — Pharma deep-research workspace compacted for cross-profile visual consistency

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

A second HDFCBANK ↔ TORNTPHARM visual consistency pass was performed after owner comparison screenshots.

### Owner rule preserved

The governing requirement remains:

> HDFCBANK and TORNTPHARM may differ materially in research criteria and sector-specific research sections, but at a glance they must look like the same PortfolioAI product.

The shared Overview spine already matched through Research Readiness / snapshot cockpit / Research Health. The remaining visual drift came from the Pharma-only workspace expanding into multiple full-height Gate F panels immediately after the shared Overview.

### R4N compacting change

Updated:
- `src/features/research/PharmaResearchWorkspacePanel.tsx`
- `src/features/research/PharmaResearchWorkspacePanel.css`
- `src/pages/ResearchPage.tsx`
- `docs/R4N_HDFCBANK_TORNTPHARM_Research_Page_Consistency_Audit.md`

The Pharma workspace now shows a compact always-visible header and model summary:

**Sector research workspace · Pharmaceuticals**  
**Pharmaceuticals deep research**

All deep content is grouped into two collapsed-by-default layers:

1. **Business model & exposure map**
   - primary Domestic Formulations evidence lanes;
   - reviewed secondary exposures;
   - Global Generics material overlay;
   - CDMO / CRAMS emerging watch.

2. **Evidence operations & review controls**
   - Evidence ingestion dry-run;
   - Evidence acquisition plan;
   - Public / official source discovery;
   - Exact document review plan;
   - Public document content-review dry-run.

The redundant large serif `Sector research workspace` page heading was removed.

### Important non-changes

No research logic was removed or altered.

Still preserved:
- Pharma subprofile resolution;
- 14 counted business-model requirements;
- acquisition/source contracts;
- artifact planning;
- read-only reviewed candidate series;
- Q4 US-growth scope rejection;
- site-scoped FDA regulatory chain;
- readiness contracts;
- scoring boundaries.

No panel is deleted; they are simply hidden behind explicit owner-expandable detail layers by default.

### Source-level verification

Confirmed on branch:
- `Pharmaceuticals deep research` header exists;
- both `pharma-deep-layer` sections exist;
- neither details layer is marked `open`, so both are collapsed by default;
- all five Gate F operational panel titles remain present;
- redundant outer Sector Research heading is absent;
- Pharma workspace still appears after Research Health.

Per the local-first workflow, this compacting checkpoint is **not yet visually approved** and full local validation is deferred until owner localhost review.

**Production touched:** NO.  
**Production Supabase:** unchanged.  
**Evidence ingestion:** NO.  
**Paid/licensed provider calls:** NO.  
**Scoring / recommendation / sizing changes:** NO.  
**Schedulers:** unchanged.  
**PR #101:** remains draft/open/unmerged.

**CURRENT STOP POINT:** Owner should `git pull`, reopen TORNTPHARM → Research → Overview, and inspect the compact Pharma workspace immediately below Research Health. The page should now show the small Pharma summary plus two collapsed detail rows instead of several full Gate F panels. Obtain visual approval before full local validation.


---

## 36. Entry 031 — HDFCBANK ↔ TORNTPHARM visual-consistency checkpoint visually approved and locally validated

**Date:** 18 September 2026  
**Actor:** owner-run localhost review + local validation  
**Branch:** `r4n-pharma-subprofile-architecture`

After pulling Entry 030, the owner reviewed the compact TORNTPHARM Research Overview beneath Research Health and confirmed that the cross-profile design objective had been achieved.

### Localhost visual verification — PASS

The shared first-glance PortfolioAI grammar now remains consistent between HDFCBANK and TORNTPHARM.

For TORNTPHARM, the Pharma-specific continuation now appears as a compact sector workspace:

- **Sector research workspace · Pharmaceuticals**
- **Pharmaceuticals deep research**
- always-visible four-card summary:
  - Primary model: Domestic Formulations
  - Primary evidence: 0/8 verified
  - Secondary exposures: 2
  - Effective from: 2026-03-31
- two collapsed-by-default detail layers:
  1. **Business model & exposure map**
  2. **Evidence operations & review controls**
- scoring-methodology boundary remains visible.

The previously expanded Gate F modules remain available inside the collapsed controls but no longer dominate the page at first glance.

The owner visually approved this presentation.

### Product rule confirmed

The cross-profile design contract is now:

> HDFCBANK and TORNTPHARM may differ materially in research criteria, metrics, evidence contracts and sector-specific research sections, but at a glance they must look like the same PortfolioAI product.

This means:
- shared page hierarchy and visual grammar remain consistent;
- sector research content is allowed to differ;
- Pharma-specific depth remains preserved without forcing BANK_NBFC structure/content symmetry.

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
- **212 modules transformed**;
- build completed successfully;
- only the existing non-blocking warning about chunks exceeding 500 kB after minification remained.

No failure was reported from the preceding owner-run commands in the requested sequence.

### Scope boundary

- Production application deployment: **NO**
- Production Supabase mutation: **NO**
- Evidence ingestion: **NO**
- Paid/licensed provider calls: **NO**
- Numeric scoring / recommendation / sizing changes: **NO**
- Scheduler changes: **NO**
- PR #101 merge: **NO**

**Result:** HDFCBANK ↔ TORNTPHARM Research-page visual-consistency checkpoint = **OWNER VISUALLY APPROVED / LOCALLY VALIDATED PASS**.

**CURRENT STOP POINT:** Shared cross-profile visual grammar is now stable enough to continue Pharma evidence work without further first-glance layout drift. The next safe R4N decision is whether to expand additional read-only Pharma evidence review or prepare a candidate-to-ingestion proposal contract for the already reviewed TORNTPHARM pilot candidates. Any actual evidence write remains separately approval-gated.


---

## 37. Entry 032 — Gate F candidate-to-ingestion proposal contract prepared

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

A proposal-only candidate-to-ingestion gate has now been prepared for the six already reviewed TORNTPHARM evidence candidates.

### Purpose

The goal is to determine whether reviewed evidence is actually compatible with the current canonical ingestion contracts before any write is attempted.

This gate deliberately performs no database mutation.

Added:
- `src/features/research/torntpharmCandidateToIngestionProposal.ts`
- `src/features/research/torntpharmCandidateToIngestionProposal.test.ts`
- `docs/R4N_TORNTPHARM_Gate_F_Candidate_To_Ingestion_Proposal.md`

Updated:
- `src/features/research/PharmaResearchWorkspacePanel.tsx`
- `src/features/research/PharmaResearchWorkspacePanel.css`

### Important architectural finding

The reviewed evidence is now ahead of the current ingestion schema.

The existing `researchEvidenceIngestionValidator` and official manifest support numeric evidence units:
- INR_CR
- INR_PER_SHARE
- PERCENT
- MULTIPLE

but the validator metric/unit registry currently covers the canonical financial-history metrics only.

It does **not** yet version:
- `PHARMA_EXPORT_US_REVENUE_GROWTH`;
- event-state evidence for `PHARMA_REGULATORY_SITE_STATUS`.

### Numeric candidate proposal

The four reviewed Export / US Revenue Growth candidates are projected into the existing numeric ingestion shape:

- 2025-06-30: 19%
- 2025-09-30: 26%
- 2025-12-31: 19%
- 2026-03-31: 16% base-business

They retain:
- direct official lineage;
- source artifact code;
- period-end date;
- PERCENT unit;
- current PHARMA_V1 + Domestic Formulations assignment version.

Under the current validator contract all four remain quarantined rather than silently accepted.

Disposition:
`VALIDATOR_CONTRACT_EXTENSION_REQUIRED`

### Regulatory event proposal

The two reviewed FDA Indrad events are intentionally **not** coerced into the numeric manifest:

- 2019-10-08: WARNING_LETTER_ACTIVE
- 2024-09-04: WARNING_LETTER_CLOSED_OUT

Disposition:
`EVENT_EVIDENCE_SCHEMA_REQUIRED`

A separately versioned event-evidence storage and validation contract is required before these events can be proposed for ingestion.

### Rejected claim protection

The Q4 FY26 reported US-growth claim of **31%** remains excluded from the ingestion proposal entirely.

Only the reviewed 16% base-business Q4 candidate appears in the comparable series.

### Current proposal summary

- reviewed candidates: **6**
- numeric candidates: **4**
- event candidates: **2**
- validator accepted: **0**
- validator quarantined: **4**
- event-schema blocked: **2**
- rejected claims excluded: **1**
- proposed writes: **0**
- `ingestionAuthorized = false`

### Visible localhost milestone

A new section now exists inside the collapsed:

**Evidence operations & review controls**

section:

**Gate F · Candidate-to-ingestion proposal**  
**Ingestion eligibility proposal**

The panel shows:
- reviewed candidate count;
- numeric/event split;
- validator accepted/quarantined counts;
- event-schema blockers;
- proposed writes = 0;
- per-candidate disposition and current validator issue codes;
- explicit proposal-only / zero-write boundary.

Because the parent Evidence Operations layer remains collapsed by default, this does not re-expand the top-level Research page.

### Source-level verification

Confirmed:
- proposal writes remain 0;
- ingestion authorization remains false;
- regulatory event evidence is absent from the numeric projection;
- rejected Q4 31% value is absent from the numeric projection;
- proposal UI remains inside the collapsed Evidence Operations layer.

Per the local-first workflow, this checkpoint is **not yet visually approved** and full local validation is deferred until after owner localhost review.

**Production touched:** NO.  
**Production Supabase:** unchanged.  
**Evidence ingestion:** NO.  
**Validator silently widened:** NO.  
**Regulatory events coerced to numeric values:** NO.  
**Paid/licensed provider calls:** NO.  
**Scoring / recommendation / sizing:** NO.  
**Schedulers:** unchanged.  
**PR #101:** remains draft/open/unmerged.

**CURRENT STOP POINT:** Owner should `git pull`, reopen TORNTPHARM → Research → Overview, expand **Evidence operations & review controls**, and inspect **Ingestion eligibility proposal**. Expected summary: 6 reviewed candidates, 4 numeric candidates, 2 event candidates, 0 validator accepted, 4 validator quarantined, 2 event-schema blocked, 1 rejected claim excluded, and 0 proposed writes.


---

## 38. Entry 033 — Candidate-to-ingestion validator blocker semantics corrected

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Owner localhost review of the new **Ingestion eligibility proposal** exposed one semantic issue in the displayed validator blocker.

### Issue found

The four reviewed Export / US Revenue Growth candidates use the correct `PERCENT` unit, but the current canonical validator does not yet register the metric code `PHARMA_EXPORT_US_REVENUE_GROWTH`.

Because the validator previously used a single unit-registry lookup, an unknown metric surfaced as:

`UNIT_MISMATCH`

This was technically misleading. The unit is not wrong; the metric is unsupported by the current validator contract.

### Correction

`researchEvidenceIngestionValidator.ts` now distinguishes:

- `UNSUPPORTED_METRIC` — metric code is absent from the approved metric/unit registry;
- `UNIT_MISMATCH` — metric is approved but the candidate unit does not match the approved unit.

No metric was added to the approved registry and no acceptance behavior was widened.

The four TORNTPHARM US-growth candidates therefore remain quarantined, but now for the correct reason:

`UNSUPPORTED_METRIC`

### Regression coverage

Tests now separately assert:
- an unknown Pharma metric with PERCENT unit → `UNSUPPORTED_METRIC`;
- a known canonical metric with the wrong unit → `UNIT_MISMATCH`;
- candidate-to-ingestion proposal rows surface `UNSUPPORTED_METRIC`;
- all prior zero-write / event-schema / rejected-claim protections remain intact.

### Scope boundary

- Validator acceptance widened: **NO**
- Evidence ingestion: **NO**
- Production Supabase mutation: **NO**
- Regulatory event schema added: **NO**
- Paid/licensed provider calls: **NO**
- Scoring / recommendation / sizing: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull` and re-open the same **Ingestion eligibility proposal** panel. The four Export / US Revenue Growth rows should now display **Current validator: UNSUPPORTED_METRIC** instead of **UNIT_MISMATCH**. Obtain visual confirmation before full local validation.


---

## 39. Entry 034 — Candidate-to-ingestion proposal visually approved and validation status resolved

**Date:** 18 September 2026  
**Actor:** owner-run localhost review + local validation  
**Branch:** `r4n-pharma-subprofile-architecture`

The owner visually reviewed the **Gate F · Candidate-to-ingestion proposal / Ingestion eligibility proposal** panel after the validator semantics correction.

### Localhost visual verification — PASS

The panel correctly shows:
- reviewed candidates: **6**;
- numeric candidates: **4**;
- regulatory event candidates: **2**;
- validator accepted: **0**;
- validator quarantined: **4**;
- event-schema blocked: **2**;
- rejected claims excluded: **1**;
- proposed writes: **0**;
- explicit **Proposal only · 0 writes** state.

The four Export / US Revenue Growth rows correctly display:

`Current validator: UNSUPPORTED_METRIC`

rather than the misleading `UNIT_MISMATCH` label.

The two FDA regulatory events remain blocked behind:

`EVENT_EVIDENCE_SCHEMA_REQUIRED`

and are not projected into the numeric manifest.

The Q4 FY26 reported 31% US-growth claim remains excluded from the proposal set.

### Validation results

Owner-run validation produced:

- Architecture Guard: **PASS**
- Edge tests: **27/27 test files passed; 140/140 tests passed**
- Production build: **PASS**
- Vite modules transformed: **213**
- Existing non-blocking >500 kB chunk warning only

Repository-wide lint still reports pre-existing unrelated debt. This was investigated before classifying the checkpoint.

The following files shown in the lint output were verified byte-identical to the earlier R4N baseline commit `d6d0f1afa5e83b936c32ac23ebc3a11136b230fd`:
- `supabase/functions/_shared/angel-one.ts`
- `supabase/functions/discover-trendlyne-bank-growth-contract/index.ts`
- `supabase/functions/run-nse-news-pipeline/index.ts`
- `src/features/research/useSecurityScoring.ts`

Therefore those repository-wide lint failures were not introduced by the present Gate F slice.

A focused lint was then run on the files changed by this slice:

- `src/features/research/torntpharmCandidateToIngestionProposal.ts`
- `src/features/research/torntpharmCandidateToIngestionProposal.test.ts`
- `src/features/research/researchEvidenceIngestionValidator.ts`
- `src/features/research/researchEvidenceIngestionValidator.test.ts`
- `src/features/research/PharmaResearchWorkspacePanel.tsx`

Focused changed-file lint result: **PASS with no output, errors or warnings**.

### Validation classification

This checkpoint is therefore classified as:

**OWNER VISUALLY APPROVED / FOCUSED CHANGED-FILE VALIDATION PASS**

with a documented repository-wide lint caveat due to pre-existing unrelated debt.

It is **not** correct to claim the entire repository is lint-clean.

### Scope boundary

- Evidence ingestion: **NO**
- Validator acceptance widened: **NO**
- Regulatory event schema deployed: **NO**
- Production Supabase mutation: **NO**
- Paid/licensed provider calls: **NO**
- Scoring / recommendation / sizing: **NO**
- Scheduler changes: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Candidate-to-ingestion proposal logic is now visually approved and locally validated at the changed-file scope. The next safe R4N step is to version the canonical numeric validator contract for `PHARMA_EXPORT_US_REVENUE_GROWTH` and separately design the regulatory event-evidence contract. Any actual ingestion remains separately approval-gated.


---

## 40. Entry 035 — Numeric validator V2 and Pharma regulatory event evidence V1 prepared

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

The next Gate F contract step has been prepared without performing any evidence write.

### Numeric evidence validator V2

The canonical numeric ingestion validator is now explicitly versioned:

`R4N_NUMERIC_EVIDENCE_V2`

The approved metric/unit registry now includes:

`PHARMA_EXPORT_US_REVENUE_GROWTH → PERCENT`

This metric already exists in the approved PHARMA_V1 research contract and is mandatory for the reviewed Global Generics material overlay.

The four reviewed TORNTPHARM US-growth candidates now pass numeric structural validation:

- 2025-06-30: 19%
- 2025-09-30: 26%
- 2025-12-31: 19%
- 2026-03-31: 16% base-business

They are no longer `UNSUPPORTED_METRIC`.

Their disposition is now:

`SEPARATE_INGESTION_APPROVAL_REQUIRED`

Structural acceptance does not authorize a write.

### Pharma regulatory event evidence V1

Added:
- `src/features/research/pharmaRegulatoryEventEvidenceContract.ts`
- `src/features/research/pharmaRegulatoryEventEvidenceContract.test.ts`

Contract version:

`PHARMA_REGULATORY_EVENT_EVIDENCE_V1`

The event contract validates site-specific regulatory evidence with:
- security identity;
- event date/state;
- regulator;
- facility identity;
- warning-chain identity;
- source artifact/reference;
- explicit `SITE_SPECIFIC` scope;
- chronological warning → closeout transition rules;
- duplicate protection;
- deterministic idempotency keys.

The reviewed Indrad chain is structurally accepted:
- 2019-10-08 — `WARNING_LETTER_ACTIVE`
- 2024-09-04 — `WARNING_LETTER_CLOSED_OUT`

The contract explicitly does not convert the site-specific closeout into company-wide regulatory clearance.

### Candidate-to-ingestion proposal state after contract versioning

The existing proposal now evaluates to:

- reviewed candidates: **6**
- numeric candidates: **4**
- numeric validator accepted: **4**
- numeric validator quarantined: **0**
- regulatory event candidates: **2**
- event contract accepted: **2**
- event contract quarantined: **0**
- event storage blocked: **2**
- rejected Q4 31% claim excluded: **1**
- proposed writes: **0**
- `ingestionAuthorized = false`

Regulatory event disposition is now:

`EVENT_STORAGE_IMPLEMENTATION_REQUIRED`

The event contract exists and accepts the two reviewed events, but no canonical event-evidence persistence/write path exists yet.

### Visible localhost milestone

Inside the collapsed **Evidence operations & review controls** layer, the **Ingestion eligibility proposal** summary now should show:

- Numeric validator accepted: **4**
- numeric quarantined: **0**
- Event contract accepted: **2**
- event storage blocked: **2**
- Proposed writes: **0**

Per-candidate dispositions should show:
- US-growth rows → separate ingestion approval required;
- FDA events → event storage implementation required.

### Documentation

Added:

`docs/R4N_TORNTPHARM_Gate_F_Numeric_Validator_V2_And_Regulatory_Event_Evidence_V1.md`

### Scope boundary

- Evidence ingestion: **NO**
- Production Supabase mutation: **NO**
- Event-evidence storage table/migration: **NO**
- Paid/licensed provider calls: **NO**
- Scoring / recommendation / sizing: **NO**
- Scheduler changes: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, reopen TORNTPHARM → Research → Overview → Evidence operations & review controls, and inspect the updated **Ingestion eligibility proposal**. Expected summary: numeric validator accepted 4, numeric quarantined 0, event contract accepted 2, event storage blocked 2, proposed writes 0. Obtain visual approval before focused/full validation.


---

## 41. Entry 036 — Numeric validator V2 and Pharma regulatory event evidence V1 visually approved and locally validated

**Date:** 18 September 2026  
**Actor:** owner-run localhost review + local validation  
**Branch:** `r4n-pharma-subprofile-architecture`

The owner visually reviewed the updated **Gate F · Candidate-to-ingestion proposal / Ingestion eligibility proposal** after versioning the numeric evidence validator and adding the Pharma regulatory event-evidence contract.

### Localhost visual verification — PASS

The proposal panel correctly shows:
- reviewed candidates: **6**;
- numeric candidates: **4**;
- numeric validator accepted: **4**;
- numeric validator quarantined: **0**;
- regulatory event candidates: **2**;
- event contract accepted: **2**;
- event contract quarantined: **0**;
- event storage blocked: **2**;
- rejected claims excluded: **1**;
- proposed writes: **0**;
- explicit **Proposal only · 0 writes** state.

Per-candidate dispositions are correct:
- four Export / US Revenue Growth observations → `SEPARATE_INGESTION_APPROVAL_REQUIRED`;
- two FDA Indrad events → `EVENT_STORAGE_IMPLEMENTATION_REQUIRED`.

The decision-gate text correctly states that structural acceptance does not authorize a write.

### Contract versions validated

Numeric evidence validator:
- `R4N_NUMERIC_EVIDENCE_V2`
- approved registry includes `PHARMA_EXPORT_US_REVENUE_GROWTH → PERCENT`.

Regulatory event evidence:
- `PHARMA_REGULATORY_EVENT_EVIDENCE_V1`
- site-specific US FDA warning → closeout chain validation;
- explicit facility and regulatory-chain identity;
- source provenance;
- chronological transition rules;
- duplicate protection;
- no company-wide scope inference.

### Local validation

The supplied terminal capture directly confirms:
- Edge test suite: **27/27 test files passed; 140/140 tests passed**;
- production build: **PASS** under Vite 8.2.2;
- **214 modules transformed**;
- only the existing non-blocking warning about chunks exceeding 500 kB after minification remained.

Focused ESLint was then run on all files changed by this contract slice:

- `src/features/research/researchEvidenceIngestionValidator.ts`
- `src/features/research/researchEvidenceIngestionValidator.test.ts`
- `src/features/research/pharmaRegulatoryEventEvidenceContract.ts`
- `src/features/research/pharmaRegulatoryEventEvidenceContract.test.ts`
- `src/features/research/torntpharmCandidateToIngestionProposal.ts`
- `src/features/research/torntpharmCandidateToIngestionProposal.test.ts`
- `src/features/research/PharmaResearchWorkspacePanel.tsx`

Focused changed-file lint result: **PASS with no output, errors or warnings**.

Repository-wide lint remains subject to the already-documented pre-existing unrelated debt and is not represented as clean.

### Validation classification

**OWNER VISUALLY APPROVED / FOCUSED CHANGED-FILE VALIDATION PASS**

### Scope boundary

- Numeric structural acceptance widened only for the already-approved PHARMA_V1 metric: **YES**
- Evidence ingestion: **NO**
- Local evidence write: **NO**
- Production Supabase mutation: **NO**
- Regulatory event storage table/migration: **NO**
- Paid/licensed provider calls: **NO**
- Scoring / recommendation / sizing: **NO**
- Scheduler changes: **NO**
- PR #101 merge: **NO**

**Result:** Numeric Validator V2 + Pharma Regulatory Event Evidence V1 checkpoint = **VALIDATED**.

**CURRENT STOP POINT:** The four reviewed US-growth observations are structurally eligible under Numeric Validator V2 but still require separate ingestion approval. The two reviewed FDA Indrad events are structurally valid under Regulatory Event Evidence V1 but remain blocked because canonical event persistence/write infrastructure does not yet exist. The next safe R4N step is to prepare, without executing, (1) the first local numeric ingestion package for the four US-growth rows and (2) a canonical regulatory-event persistence schema/migration proposal. Neither action authorizes a write.


---

## 42. Entry 037 — Local numeric ingestion package and regulatory-event persistence proposal prepared

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

The next two Gate F persistence artifacts have been prepared without executing either one.

### A. Local numeric ingestion package

Added:
- `src/features/research/torntpharmLocalNumericIngestionPackage.ts`
- `src/features/research/torntpharmLocalNumericIngestionPackage.test.ts`

Contract version:

`TORNTPHARM_LOCAL_NUMERIC_INGESTION_V1`

Prepared rows:
- 2025-06-30 — 19%
- 2025-09-30 — 26%
- 2025-12-31 — 19%
- 2026-03-31 — 16% base-business

Canonical target:

`public.fundamental_observations`

All four rows are:
- `PHARMA_EXPORT_US_REVENUE_GROWTH`;
- `QUARTER`;
- `PERCENT`;
- direct official lineage;
- source code `COMPANY_EXCHANGE_FILING`.

The rejected Q4 31% claim is absent.

The package deliberately keeps unresolved database prerequisites explicit:
- local security identity resolution;
- reviewed subprofile assignment match;
- database metric-definition registration;
- four immutable `data_source_records` provenance rows;
- existing-fact conflict/idempotency preflight;
- separate owner write approval.

The package proposes but does not apply the database metric-definition contract:
- code: `PHARMA_EXPORT_US_REVENUE_GROWTH`;
- value kind: `NUMERIC`;
- canonical unit: `PERCENT`;
- statement scope: `PHARMA_BUSINESS_MODEL`;
- freshness seconds: 10,368,000;
- mapping version: `PHARMA_V1_GLOBAL_GENERICS_V1`;
- source priority: `COMPANY_EXCHANGE_FILING`.

Current package state:
- validator-accepted rows: **4**;
- observation rows prepared: **4**;
- source records required: **4**;
- metric-definition registrations required: **1**;
- proposed writes: **0**;
- `dryRunOnly = true`;
- `writeAuthorized = false`.

### B. Regulatory-event persistence proposal

Added:
- `src/features/research/pharmaRegulatoryEventPersistenceProposal.ts`
- `src/features/research/pharmaRegulatoryEventPersistenceProposal.test.ts`
- `docs/sql/R4N_PHARMA_REGULATORY_EVENT_EVIDENCE_V1_MIGRATION_PROPOSAL.sql`

Proposal version:

`PHARMA_REGULATORY_EVENT_PERSISTENCE_PROPOSAL_V1`

The SQL is intentionally stored under `docs/sql`, not `supabase/migrations`, and deliberately ends in `ROLLBACK`.

Proposed canonical objects:
- table: `public.research_regulatory_event_observations`;
- current-state view: `public.current_research_regulatory_site_state_v1`;
- regulator source code: `US_FDA_OFFICIAL`.

The proposed FDA source registry remains:
- inactive;
- entitlement-unverified;
- retention-rights-unverified.

No source activation claim is made.

Proposed storage guarantees:
- append-only evidence;
- existing Stage 7 immutable-evidence trigger;
- security FK;
- source-record FK;
- source-code FK;
- site-specific scope only;
- US FDA regulator only for V1;
- warning-letter active / closeout event states;
- logical idempotency identity;
- authenticated held-security SELECT through RLS;
- authenticated mutation denied;
- service-role mutation only;
- security-invoker current-state view.

Current event proposal state:
- event contract accepted: **2**;
- event contract quarantined: **0**;
- canonical storage implemented: **false**;
- migration under Supabase migration directory: **false**;
- schema apply authorized: **false**;
- event write authorized: **false**.

### UI checkpoint

Inside the collapsed **Evidence operations & review controls** layer, a new compact panel now renders:

**Gate F · Prepared persistence packages**  
**Local write package & event-schema proposal**

Expected summary:
- Numeric rows prepared: **4**
- Metric registry needed: **1**
- Source records needed: **4**
- Event persistence: **Proposed**
- Write authorized: **NO**
- Schema apply authorized: **NO**
- Event write authorized: **NO**

### Documentation

Added:

`docs/R4N_TORNTPHARM_Gate_F_Prepared_Persistence_Packages.md`

### Scope boundary

- Local numeric evidence insert: **NO**
- Source-record materialization: **NO**
- Metric-definition database mutation: **NO**
- Regulatory event table creation: **NO**
- FDA source activation: **NO**
- Production Supabase mutation: **NO**
- Paid/licensed provider calls: **NO**
- Scoring / recommendation / sizing: **NO**
- Scheduler changes: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, reopen TORNTPHARM → Research → Overview → Evidence operations & review controls, and inspect **Local write package & event-schema proposal**. Obtain visual approval before focused/local validation. Any actual local write or migration conversion remains separately approval-gated.


---

## 43. Entry 038 — Prepared persistence packages visually approved and locally validated

**Date:** 18 September 2026  
**Actor:** owner-run localhost review + local validation  
**Branch:** `r4n-pharma-subprofile-architecture`

The owner visually reviewed the new **Gate F · Prepared persistence packages / Local write package & event-schema proposal** section and confirmed that the glass-box research-engine presentation is acceptable during development.

### Development-mode UX decision

The owner explicitly approved keeping the research engine visible during R4N so that:
- evidence acquisition logic can be inspected;
- source and compatibility errors can be detected early;
- validator and schema blockers remain transparent;
- persistence prerequisites can be verified before any write.

The intended later product state remains:
- research engine primarily backgrounded;
- investor-facing conclusions/results shown in the foreground;
- detailed research audit/evidence operations still available on demand.

### Localhost visual verification — PASS

The prepared persistence package panel correctly shows:
- Numeric rows prepared: **4**
- Metric registry needed: **1**
- Source records needed: **4**
- Event persistence: **Proposed**
- canonical numeric target: `fundamental_observations`
- proposed regulatory event table: `research_regulatory_event_observations`
- local numeric write authorized: **NO**
- regulatory schema apply authorized: **NO**
- regulatory event write authorized: **NO**
- explicit **Prepared only · 0 writes** state.

The SQL proposal remains under `docs/sql`, not `supabase/migrations`, and remains a review artifact rather than an executable migration.

### Local validation

The supplied terminal capture directly confirms:
- Edge test suite: **27/27 test files passed; 140/140 tests passed**;
- production build: **PASS** under Vite 8.2.2;
- **216 modules transformed**;
- only the existing non-blocking warning about chunks exceeding 500 kB after minification remained.

Focused ESLint was run on:
- `src/features/research/torntpharmLocalNumericIngestionPackage.ts`
- `src/features/research/torntpharmLocalNumericIngestionPackage.test.ts`
- `src/features/research/pharmaRegulatoryEventPersistenceProposal.ts`
- `src/features/research/pharmaRegulatoryEventPersistenceProposal.test.ts`
- `src/features/research/PharmaResearchWorkspacePanel.tsx`

Focused changed-file lint result: **PASS with no output, errors or warnings**.

Repository-wide lint remains subject to the already-documented pre-existing unrelated debt and is not represented as clean.

### Validation classification

**OWNER VISUALLY APPROVED / FOCUSED CHANGED-FILE VALIDATION PASS**

### Scope boundary

- Local numeric evidence insert: **NO**
- Metric-definition database mutation: **NO**
- Source-record materialization: **NO**
- Regulatory event migration apply: **NO**
- FDA source activation: **NO**
- Production Supabase mutation: **NO**
- Paid/licensed provider calls: **NO**
- Scoring / recommendation / sizing: **NO**
- Scheduler changes: **NO**
- PR #101 merge: **NO**

**Result:** Prepared Persistence Packages checkpoint = **VALIDATED**.

**CURRENT STOP POINT:** The next safe R4N step is to prepare a local-only preflight package for the four numeric rows and a migration-replay validation package for the regulatory-event schema proposal, without executing either one. These packages should resolve the exact local prerequisites (metric registry, source records, existing-fact conflicts, migration replay assertions) while preserving explicit owner approval before any write or schema application.


---

## 44. Entry 039 — Local numeric preflight and regulatory migration replay packages prepared

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

The next Gate F engine checkpoint has been prepared without querying or mutating the local database and without applying any migration.

### A. Local numeric preflight

Added:
- `src/features/research/torntpharmLocalNumericPreflight.ts`
- `src/features/research/torntpharmLocalNumericPreflight.test.ts`

Contract:
`TORNTPHARM_LOCAL_NUMERIC_PREFLIGHT_V1`

The preflight plan targets the real canonical local tables:
- `fundamental_metric_definitions`
- `data_source_records`
- `fundamental_observations`
- `research_subprofile_assignments`

The evaluator consumes a supplied local snapshot and classifies each of the four reviewed US-growth rows as:
- `INSERT_CANDIDATE`
- `ALREADY_PRESENT`
- `CONFLICT`
- `BLOCKED`

Fail-closed behavior:
- missing/mismatched metric definition blocks;
- missing source record blocks;
- exact existing fact becomes `ALREADY_PRESENT`;
- conflicting existing quarter value becomes `CONFLICT`;
- even a fully clean preflight only reaches `readyForSeparateWriteApproval = true`;
- `writeAuthorized` remains **false**.

No local DB snapshot has been queried yet.

### B. Regulatory migration replay preparation

Added:
- `src/features/research/pharmaRegulatoryEventMigrationReplayPlan.ts`
- `src/features/research/pharmaRegulatoryEventMigrationReplayPlan.test.ts`

Contract:
`PHARMA_REGULATORY_EVENT_MIGRATION_REPLAY_PLAN_V1`

Execution target:
`LOCAL_SUPABASE_ONLY`

The replay plan targets the non-migration review artifact:

`docs/sql/R4N_PHARMA_REGULATORY_EVENT_EVIDENCE_V1_MIGRATION_PROPOSAL.sql`

Prepared assertions:
- pre-existing object absent;
- canonical prerequisites present;
- proposed table created inside transaction;
- RLS enabled;
- authenticated mutation denied;
- service-role mutation allowed;
- immutable trigger present;
- site-specific / US FDA scope enforced;
- security-invoker current-state view;
- rollback removes proposed objects;
- migration history unchanged.

The proposal SQL remains outside `supabase/migrations` and no schema application is authorized.

### UI checkpoint

Inside **Gate F · Prepared persistence packages**, two new glass-box status cards now appear:

- **Local numeric preflight**
  - status: **PREPARED · NOT EXECUTED**
- **Regulatory migration replay**
  - status: **PREPARED · NOT EXECUTED**

### Documentation

Added:

`docs/R4N_TORNTPHARM_Gate_F_Local_Preflight_And_Migration_Replay.md`

### Scope boundary

- Local database query: **NO**
- Local numeric evidence insert: **NO**
- Source-record materialization: **NO**
- Metric-definition mutation: **NO**
- Regulatory migration replay execution: **NO**
- Regulatory schema apply: **NO**
- Production Supabase mutation: **NO**
- Production execution authorization: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, reopen TORNTPHARM → Research → Overview → Evidence operations & review controls, and inspect the two new prepared-status cards under **Local write package & event-schema proposal**. Obtain visual approval before local validation. After that, the next decision is whether to execute the preflight against local Supabase and separately replay the rollback-only regulatory SQL locally.


---

## 45. Entry 040 — Local preflight validation interrupted by readonly test mutation; test-only correction prepared

**Date:** 18 September 2026  
**Actor:** owner-run validation + ChatGPT correction  
**Branch:** `r4n-pharma-subprofile-architecture`

The owner visually approved the new **Local numeric preflight** and **Regulatory migration replay** prepared-status cards, then started the normal local validation sequence.

### Validation interruption

The build/typecheck stage failed in:

`src/features/research/torntpharmLocalNumericPreflight.test.ts`

with four TypeScript `TS2540` errors because the tests attempted to assign new values directly into readonly snapshot properties:

- `existingObservations`
- `sourceRecords`
- `metricDefinition`

The production preflight model is intentionally readonly and was correct. The defect was confined to test construction.

### Correction

The tests now create immutable modified snapshot copies using object spread instead of mutating readonly properties in place.

No production preflight logic changed.

Corrective commit:

`624d7b1119ddbfdc0284835e0e7c346c2b23a847`

### Scope boundary

- Production logic changed: **NO**
- Local database queried: **NO**
- Local evidence write: **NO**
- Migration replay executed: **NO**
- Schema applied: **NO**
- Production Supabase mutation: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull` and rerun the local validation sequence from `npm run typecheck` onward. No UI re-review is required because the correction is test-only.


---

## 46. Entry 041 — Local numeric preflight and regulatory migration replay checkpoint validated

**Date:** 18 September 2026  
**Actor:** owner-run localhost review + local validation  
**Branch:** `r4n-pharma-subprofile-architecture`

The owner visually approved the prepared **Local numeric preflight** and **Regulatory migration replay** cards, then completed the corrected local validation sequence after pulling the readonly-test fix.

### Corrective pull confirmation

Local HEAD was confirmed at:

`c32ce86d905167cb5c17fe219a121807ff3c8e52`

After that pull:

- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**
- Vite modules transformed: **218**
- only the existing non-blocking >500 kB chunk warning remained.

### Full test validation

The supplied terminal capture confirms:

- frontend/unit test suite: **97/97 test files passed**
- frontend/unit tests: **511/511 passed**
- Edge test suite: **27/27 test files passed**
- Edge tests: **140/140 passed**

### Focused changed-file lint

Focused ESLint was run on:

- `src/features/research/torntpharmLocalNumericPreflight.ts`
- `src/features/research/torntpharmLocalNumericPreflight.test.ts`
- `src/features/research/pharmaRegulatoryEventMigrationReplayPlan.ts`
- `src/features/research/pharmaRegulatoryEventMigrationReplayPlan.test.ts`
- `src/features/research/PharmaResearchWorkspacePanel.tsx`

Result: **PASS with no output, errors or warnings**.

Repository-wide lint remains subject to the already-documented pre-existing unrelated debt and is not represented as clean.

### Validation classification

**OWNER VISUALLY APPROVED / FOCUSED CHANGED-FILE VALIDATION PASS**

### Gate state

Local numeric preflight:
- contract: `TORNTPHARM_LOCAL_NUMERIC_PREFLIGHT_V1`
- status: **PREPARED · NOT EXECUTED**
- local DB queried: **NO**
- write authorized: **NO**

Regulatory migration replay:
- contract: `PHARMA_REGULATORY_EVENT_MIGRATION_REPLAY_PLAN_V1`
- status: **PREPARED · NOT EXECUTED**
- migration replay executed: **NO**
- schema apply authorized: **NO**
- production execution authorized: **NO**

### Scope boundary

- Local database query: **NO**
- Local evidence write: **NO**
- Source-record materialization: **NO**
- Metric-definition mutation: **NO**
- Regulatory migration replay execution: **NO**
- Regulatory schema apply: **NO**
- Production Supabase mutation: **NO**
- Production execution authorization: **NO**
- PR #101 merge: **NO**

**Result:** Local Numeric Preflight + Regulatory Migration Replay Preparation checkpoint = **VALIDATED**.

**CURRENT STOP POINT:** The next safe R4N decision is whether to execute, on local Supabase only, (1) the read-only numeric preflight queries and (2) the rollback-only regulatory migration replay. Neither action authorizes any evidence insert, source-record creation, metric-definition mutation, persistent schema change, or production change.


---

## 47. Entry 042 — Local-only numeric preflight and regulatory replay executors prepared after owner authorization

**Date:** 18 September 2026  
**Actor:** ChatGPT, following explicit owner authorization to execute the two local-only checks  
**Branch:** `r4n-pharma-subprofile-architecture`

The owner explicitly authorized execution of:

1. the read-only TORNTPHARM local numeric preflight; and
2. the rollback-only Pharma regulatory migration replay.

Because ChatGPT cannot directly execute commands inside the owner's Mac/local Supabase environment, guarded local runner scripts were prepared so the owner can execute the authorized checks with one command each.

### Added execution artifacts

- `scripts/r4n/torntpharm-local-numeric-preflight.sql`
- `scripts/r4n/run-torntpharm-local-numeric-preflight.sh`
- `scripts/r4n/run-regulatory-event-migration-replay.sh`

Added npm commands:

- `npm run r4n:preflight:numeric`
- `npm run r4n:replay:regulatory`

### Numeric preflight executor

The numeric preflight:

- resolves TORNTPHARM from local `public.securities`;
- requires exactly one active reviewed Domestic Formulations assignment;
- checks `PHARMA_EXPORT_US_REVENUE_GROWTH` in `fundamental_metric_definitions`;
- resolves the four reviewed Q1-Q4 FY26 artifacts against local `data_source_records`;
- checks existing `fundamental_observations` for exact facts or conflicts;
- classifies each row as `INSERT_CANDIDATE`, `ALREADY_PRESENT`, `CONFLICT`, or `BLOCKED`;
- runs inside `BEGIN TRANSACTION READ ONLY`;
- ends in `ROLLBACK`;
- performs **0 writes**.

The executor hard-refuses any DB URL that is not clearly local (`127.0.0.1` or `localhost`).

### Regulatory replay executor

The replay runner:

- hard-refuses non-local DB URLs;
- captures Supabase migration-history state before replay;
- captures pre-existing FDA source-registry/object state;
- refuses replay if the proposed event table/view already exists;
- runs the proposal SQL under `ON_ERROR_STOP=1`;
- relies on the proposal's own transaction + `ROLLBACK`;
- verifies after replay that:
  - migration history is unchanged;
  - `US_FDA_OFFICIAL` source-registry count is unchanged;
  - proposed event table is absent;
  - proposed current-state view is absent;
  - persistent schema changes = 0.

### Important schema correction

The local preflight executor was aligned to the actual canonical `data_source_records` schema. There is no dedicated `source_artifact_code` column in that table, so source-record resolution now uses exact `source_url`, `external_record_id`, or explicit artifact identifiers carried in `raw_payload`. No source record is invented.

### Scope boundary

Authorized:
- local read-only preflight query: **YES**
- local rollback-only migration replay: **YES**

Still NOT authorized:
- local evidence insert;
- source-record creation;
- metric-definition mutation;
- persistent regulatory schema application;
- production Supabase mutation;
- production migration replay;
- deployment;
- PR #101 merge.

**CURRENT STOP POINT:** Owner should `git pull`, then run `npm run r4n:preflight:numeric` and `npm run r4n:replay:regulatory`. Return the terminal outputs for interpretation. No additional approval is needed for these two checks because the owner has explicitly authorized them.


---

## 48. Entry 043 — First local execution: regulatory replay PASS; numeric preflight helper corrected

**Date:** 18 September 2026  
**Actor:** owner-run local execution + ChatGPT correction  
**Branch:** `r4n-pharma-subprofile-architecture`

The owner executed both explicitly authorized local-only checks.

### A. Regulatory migration replay — PASS

Command:

`npm run r4n:replay:regulatory`

Observed result:

- Local-only guard: **PASS**
- proposal SQL entered transaction successfully;
- proposed source registry insert executed inside transaction;
- proposed table/indexes/trigger/RLS/policy/grants/view were created inside transaction;
- proposal postcondition blocks completed;
- transaction ended in `ROLLBACK`;
- replay result: **PASS**
- migration history unchanged: **YES**
- proposed table absent after rollback: **YES**
- proposed view absent after rollback: **YES**
- `US_FDA_OFFICIAL` registry count unchanged: **YES**
- persistent schema changes: **0**

This validates the rollback-only regulatory schema proposal against local Supabase without leaving any persistent database change.

### B. Numeric read-only preflight — interrupted by SQL helper defect

Command:

`npm run r4n:preflight:numeric`

The local-only guard passed and the script entered a read-only transaction.

The initial prerequisite query showed:

- TORNTPHARM security rows: **1**
- active reviewed Domestic Formulations assignments: **1**
- metric definition rows: **0**
- metric-definition expected-contract match: **false**

The script then stopped before classifying the four rows because PostgreSQL does not provide a `min(uuid)` aggregate.

Observed error:

`ERROR: function min(uuid) does not exist`

This is a defect in the local preflight SQL helper, not a database evidence conflict and not a write failure.

### Correction

The two UUID-selection CTEs in:

`scripts/r4n/torntpharm-local-numeric-preflight.sql`

now select the single security UUID with:

`(array_agg(id ORDER BY id::text))[1]`

after separately counting matching security rows.

Corrective commit:

`52ee4b207556e40dc5acdb904ba6ba1057e64b89`

The preflight remains:
- local-only;
- `BEGIN TRANSACTION READ ONLY`;
- rollback-ended;
- zero-write;
- fail-closed.

### Important data-state signal already revealed

Even before the helper error, the local prerequisite query confirmed that the local database currently has **no registered `PHARMA_EXPORT_US_REVENUE_GROWTH` metric definition**.

Therefore a completed rerun is expected to classify the four rows as blocked unless/until that metric-definition prerequisite is separately prepared and approved. The rerun is still required to confirm source-record and existing-fact states.

### Scope boundary

- Local read-only query executed: **YES**
- Local evidence write: **NO**
- Metric-definition mutation: **NO**
- Source-record creation: **NO**
- Regulatory rollback-only replay executed: **YES**
- Persistent regulatory schema change: **NO**
- Production Supabase mutation: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull` and rerun only `npm run r4n:preflight:numeric`. The regulatory replay does not need to be repeated. Return the completed numeric preflight output for interpretation.


---

## 49. Entry 044 — Local numeric preflight executed successfully; exact blockers confirmed

**Date:** 18 September 2026  
**Actor:** owner-run local execution  
**Branch:** `r4n-pharma-subprofile-architecture`

The owner reran the corrected local-only numeric preflight:

`npm run r4n:preflight:numeric`

### Execution result — PASS as a read-only diagnostic

Local-only guard: **PASS**

The preflight ran inside:

`BEGIN TRANSACTION READ ONLY`

and completed with:

`ROLLBACK`

No insert, update or delete occurred.

### Canonical identity / contract prerequisites

Observed local state:

- TORNTPHARM active NSE security rows: **1**
- active reviewed Domestic Formulations assignments: **1**
- `PHARMA_EXPORT_US_REVENUE_GROWTH` metric-definition rows: **0**
- metric definition matches expected contract: **false**

### Four reviewed US-growth rows

All four reviewed rows were checked:

- 2025-06-30 — 19% — `TORRENT_Q1_FY26_RELEASE`
- 2025-09-30 — 26% — `TORRENT_Q2_FY26_RELEASE`
- 2025-12-31 — 19% — `TORRENT_Q3_FY26_RELEASE`
- 2026-03-31 — 16% — `TORRENT_Q4_FY26_RELEASE`

For each row:

- source record: **MISSING**
- exact existing observation count: **0**
- conflicting existing observation count: **0**
- disposition: **BLOCKED**

Blockers on every row:

- `METRIC_DEFINITION_MISSING_OR_MISMATCHED`
- `SOURCE_RECORD_MISSING`

### Preflight summary

- rows checked: **4**
- insert candidates: **0**
- already present: **0**
- conflicts: **0**
- blocked: **4**
- preflight state: **NOT_READY**
- write authorization: **NO**

### Interpretation

The preflight confirms there is no conflicting existing TORNTPHARM US-growth evidence locally.

The only current blockers are missing canonical prerequisites:

1. one `fundamental_metric_definitions` registration for `PHARMA_EXPORT_US_REVENUE_GROWTH`;
2. four immutable `data_source_records` rows corresponding to the reviewed Q1-Q4 FY26 issuer releases.

This is the expected fail-closed behavior.

### Scope boundary

- Local DB read executed: **YES**
- Local evidence insert: **NO**
- Metric-definition mutation: **NO**
- Source-record materialization: **NO**
- Conflicting existing facts detected: **NO**
- Production Supabase mutation: **NO**
- PR #101 merge: **NO**

**Result:** Local numeric preflight execution = **SUCCESSFUL READ-ONLY DIAGNOSTIC / NOT READY FOR WRITE**.

**CURRENT STOP POINT:** The next safe R4N gate is to prepare, without executing, (1) the canonical metric-definition registration package for `PHARMA_EXPORT_US_REVENUE_GROWTH` and (2) four immutable source-record materialization packages for the reviewed Q1-Q4 FY26 issuer releases. Both remain separately approval-gated before any local mutation.


---

## 50. Entry 045 — Canonical prerequisite package prepared after successful local preflight

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Following the successful local numeric preflight, the exact missing canonical prerequisites have now been prepared as a non-writing package.

### Local preflight context

The executed local read-only preflight had already confirmed:

- TORNTPHARM security identity: **present and unique**
- reviewed Domestic Formulations assignment: **present and unique**
- existing US-growth observations: **0**
- conflicting US-growth observations: **0**
- metric-definition rows for `PHARMA_EXPORT_US_REVENUE_GROWTH`: **0**
- reviewed issuer source records for Q1-Q4 FY26: **0**
- all four numeric rows: **BLOCKED**
- write authorization: **NO**

### Canonical prerequisite package

Added:

- `src/features/research/torntpharmCanonicalPrerequisitePackage.ts`
- `src/features/research/torntpharmCanonicalPrerequisitePackage.test.ts`

Contract:

`TORNTPHARM_CANONICAL_PREREQUISITE_PACKAGE_V1`

Prepared database prerequisites:

#### 1. Metric-definition registration proposal

Prepared:

- code: `PHARMA_EXPORT_US_REVENUE_GROWTH`
- name: `Export / US Revenue Growth`
- value kind: `NUMERIC`
- canonical unit: `PERCENT`
- statement scope: `PHARMA_BUSINESS_MODEL`
- freshness seconds: **10,368,000**
- provider: `COMPANY_EXCHANGE_FILING`
- selection: `REVIEWED`
- period type: `QUARTER`
- semantic guard: `SEPARATELY_DISCLOSED_US_OR_EXPORT_REVENUE_GROWTH_ONLY`
- mapping version: `PHARMA_V1_GLOBAL_GENERICS_V1`
- active: **true**

No database insert has occurred.

#### 2. Four immutable source-record proposals

Prepared artifacts:

- `TORRENT_Q1_FY26_RELEASE` → 2025-06-30 → 19%
- `TORRENT_Q2_FY26_RELEASE` → 2025-09-30 → 26%
- `TORRENT_Q3_FY26_RELEASE` → 2025-12-31 → 19%
- `TORRENT_Q4_FY26_RELEASE` → 2026-03-31 → 16% comparable base-business growth

Each proposed source record uses:

- source code: `COMPANY_EXCHANGE_FILING`
- record kind: `ISSUER_RESULTS_RELEASE`
- external record id: reviewed artifact code
- exact reviewed source URL
- canonical reviewed raw payload
- SHA-256 payload-hash requirement
- reviewed public-fact retention scope

The rejected Q4 31% claim is absent from the canonical source payloads.

### Payload-hash boundary

Immutable payload hashes are **not fabricated during preparation**.

Each source record currently has:

- hash algorithm: `SHA256`
- hash state: `COMPUTE_AT_MATERIALIZATION_FROM_CANONICAL_RAW_PAYLOAD`
- payload hash: `null`

Hash computation remains a later separately approved materialization step.

### Existing source registry

No new company/issuer source registry is required.

The existing canonical source:

`COMPANY_EXCHANGE_FILING`

is already defined as active, entitlement-verified and retention-rights-verified, with fundamentals and primary-evidence capability.

### Glass-box UI synchronization

The existing execution cards were corrected to reflect actual local execution state:

**Local numeric preflight**
- status: **EXECUTED · NOT READY · 4 BLOCKED · 0 CONFLICTS**

**Regulatory migration replay**
- status: **EXECUTED · PASS · 0 PERSISTENT CHANGES**

A new glass-box card now displays:

**Canonical prerequisite package**
- 1 metric-definition row prepared
- 4 immutable issuer source-record envelopes prepared
- payload hashes materialized: 0
- status: **PREPARED · NOT EXECUTED · 0 WRITES**
- mutation authorized: **NO**

### Documentation

Added:

`docs/R4N_TORNTPHARM_Gate_F_Canonical_Prerequisite_Package_V1.md`

### Source-level verification

Confirmed:

- metric definitions prepared: **1**
- source records prepared: **4**
- payload hashes materialized: **0**
- proposed writes: **0**
- mutation authorized: **false**
- rejected Q4 31% claim absent
- local numeric execution status shown accurately
- regulatory replay execution status shown accurately

### Scope boundary

- Metric-definition insert: **NO**
- Payload-hash materialization: **NO**
- Source-record insert: **NO**
- Fundamental-observation insert: **NO**
- Local mutation: **NO**
- Production Supabase mutation: **NO**
- Deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, reopen TORNTPHARM → Research → Overview → Evidence operations & review controls → **Local write package & event-schema proposal**, and visually verify the new **Canonical prerequisite package** card plus the corrected execution-status cards. Obtain visual approval before local validation.


---

## 51. Entry 046 — Canonical prerequisite package validation interrupted by candidate-union typing; safe type guard added

**Date:** 18 September 2026  
**Actor:** owner-run validation + ChatGPT correction  
**Branch:** `r4n-pharma-subprofile-architecture`

The owner visually approved the canonical prerequisite package and started local validation.

### Validation interruption

The build/typecheck stage failed in:

`src/features/research/torntpharmCanonicalPrerequisitePackage.ts`

with two TypeScript `TS2322` errors because `TorntpharmProposedEvidenceCandidate` is typed broadly enough to include both:

- `PHARMA_EXPORT_US_REVENUE_GROWTH`
- `PHARMA_REGULATORY_SITE_STATUS`

and both:

- `PERCENT`
- `EVENT_STATE`

The runtime filter selected only US-growth candidates, but TypeScript did not preserve the narrower metric/unit relationship through the ordinary filter.

### Correction

A dedicated type guard was added:

`isTorntpharmUsGrowthCandidate(...)`

It requires both:
- `metricCode === "PHARMA_EXPORT_US_REVENUE_GROWTH"`
- `unit === "PERCENT"`

The prerequisite package now filters through that guard before building canonical source-record payloads.

This is a type-safety correction only:
- research values unchanged;
- source URLs unchanged;
- 16% Q4 comparable value unchanged;
- rejected 31% claim remains excluded;
- no DB behavior changed;
- no mutation added.

Corrective commit:

`cce364b6749f41c004295bc643e8691449fe78f2`

### Scope boundary

- Production logic semantics changed: **NO**
- Database mutation: **NO**
- Local evidence write: **NO**
- Production Supabase mutation: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull` and rerun `npm run typecheck` and `npm run build`. If both pass, continue with the focused prerequisite-package validation. No UI re-review is required because the correction is type-narrowing only.


---

## 52. Entry 047 — Canonical prerequisite package validation completed

**Date:** 18 September 2026  
**Actor:** owner-run local validation  
**Branch:** `r4n-pharma-subprofile-architecture`

Following the type-narrowing correction in `torntpharmCanonicalPrerequisitePackage.ts`, the owner completed the requested local validation sequence successfully.

### Owner-confirmed validation

Completed successfully:

- `npm run typecheck`
- `npm run build`
- `npm run test`
- `npm run test:edge`
- focused ESLint on:
  - `src/features/research/torntpharmCanonicalPrerequisitePackage.ts`
  - `src/features/research/torntpharmCanonicalPrerequisitePackage.test.ts`
  - `src/features/research/PharmaResearchWorkspacePanel.tsx`

No further UI re-review was required because the corrective change was type-narrowing only.

### Validated package state

`TORNTPHARM_CANONICAL_PREREQUISITE_PACKAGE_V1`

remains:

- metric definitions prepared: **1**
- source records prepared: **4**
- payload hashes materialized: **0**
- proposed writes: **0**
- mutation authorized: **false**
- rejected Q4 31% claim excluded
- Q4 comparable base-business value retained at **16%**

### Scope boundary

- Metric-definition insert: **NO**
- Payload-hash materialization: **NO**
- Source-record insert: **NO**
- Fundamental-observation insert: **NO**
- Local mutation: **NO**
- Production Supabase mutation: **NO**
- Deployment: **NO**
- PR #101 merge: **NO**

**Result:** Canonical Prerequisite Package V1 checkpoint = **VALIDATED**.

**CURRENT STOP POINT:** The next safe R4N gate is to prepare a local-only prerequisite materialization dry-run/executor that deterministically serializes the four canonical source payloads, computes their SHA-256 hashes, and shows the exact metric-definition/source-record rows that would be inserted. The gate must remain non-writing until separately approved.


---

## 53. Entry 048 — Prerequisite materialization dry-run executor prepared

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

The next Gate F checkpoint has been prepared at the top of the standard workflow: code first, HANDOFF second, then owner `git pull` and localhost visual review.

### Added dry-run materialization manifest

Added:

`scripts/r4n/torntpharm-prerequisite-materialization-manifest.json`

Contract:

`TORNTPHARM_PREREQUISITE_MATERIALIZATION_DRY_RUN_V1`

The manifest contains:

- one validated metric-definition proposal for `PHARMA_EXPORT_US_REVENUE_GROWTH`;
- four reviewed Q1-Q4 FY26 issuer source-record proposals;
- exact reviewed source URLs;
- exact reviewed canonical raw payloads;
- explicit execution policy:
  - database connection allowed: **false**
  - writes allowed: **false**
  - hash algorithm: `SHA256`
  - serialization: `RECURSIVE_LEXICOGRAPHIC_KEY_SORT_V1`.

### Added non-writing executor

Added:

`scripts/r4n/torntpharm-prerequisite-materialization-dry-run.mjs`

Added npm command:

`npm run r4n:dry-run:prerequisites`

The executor:

- opens **no database connection**;
- recursively sorts object keys lexicographically;
- serializes each canonical raw payload deterministically;
- computes SHA-256 hashes over UTF-8 canonical JSON;
- prints each artifact/date/value/hash/canonical payload;
- prints exact proposed SQL for:
  - one `fundamental_metric_definitions` row;
  - four `data_source_records` rows;
- executes **0 SQL statements**;
- performs **0 writes**.

The executor fails closed if:
- DB connections are not explicitly prohibited by the manifest;
- writes are not explicitly prohibited;
- metric code changes unexpectedly;
- source-record count is not four;
- any materialization payload contains the rejected Q4 31% value.

### Manifest drift protection

Added:

`src/features/research/torntpharmPrerequisiteMaterializationManifest.test.ts`

The test requires the materialization manifest to remain aligned with the already validated:

`TORNTPHARM_CANONICAL_PREREQUISITE_PACKAGE_V1`

and separately asserts:
- DB connection policy = false;
- write policy = false;
- four source records;
- rejected 31% value absent;
- Q4 reviewed value remains 16%.

### Glass-box UI checkpoint

Inside **Gate F · Prepared persistence packages**, a new pair of cards now appears:

**Prerequisite materialization dry-run**
- contract: `TORNTPHARM_PREREQUISITE_MATERIALIZATION_DRY_RUN_V1`
- 4 canonical payloads
- 4 SHA-256 hashes to be computed on execution
- exact metric/source SQL preview
- status: **PREPARED · NOT EXECUTED · 0 WRITES**

**Dry-run execution boundary**
- command: `npm run r4n:dry-run:prerequisites`
- database connection: **NO**
- mutation authorized: **NO**

### Documentation

Added:

`docs/R4N_TORNTPHARM_Gate_F_Prerequisite_Materialization_Dry_Run_V1.md`

### Scope boundary

- Dry-run executor prepared: **YES**
- Dry-run executed: **NO**
- Payload hashes computed: **NO**
- Database connection: **NO**
- Metric-definition insert: **NO**
- Source-record insert: **NO**
- Fundamental-observation insert: **NO**
- Local DB mutation: **NO**
- Production Supabase mutation: **NO**
- Deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, run the local Vite app, reopen TORNTPHARM → Research → Overview → Evidence operations & review controls → **Local write package & event-schema proposal**, and visually verify the new **Prerequisite materialization dry-run** and **Dry-run execution boundary** cards. Do not execute the dry-run command yet. Obtain visual approval before full local validation.


---

## 54. Entry 049 — Prerequisite materialization dry-run validation interrupted by focused lint; test-only correction prepared

**Date:** 18 September 2026  
**Actor:** owner-run validation + ChatGPT correction  
**Branch:** `r4n-pharma-subprofile-architecture`

The owner visually approved the prerequisite materialization dry-run cards and started full local validation.

### Validation results before interruption

Confirmed from the supplied terminal output:

- Edge test suite: **27/27 files passed**
- Edge tests: **140/140 passed**
- production build: **PASS**
- Vite modules transformed: **219**
- only the existing non-blocking >500 kB chunk warning remained
- `node --check scripts/r4n/torntpharm-prerequisite-materialization-dry-run.mjs` → **PASS**

### Focused lint interruption

Focused ESLint failed only in:

`src/features/research/torntpharmPrerequisiteMaterializationManifest.test.ts`

with five `@typescript-eslint/no-unused-vars` errors caused by destructuring package-only fields into unused underscore-prefixed variables:

- `_payloadHash`
- `_algorithm`
- `_state`
- `_terms`
- `_authorized`

### Correction

The drift test now explicitly maps each validated source record to the exact manifest shape:

- `sourceCode`
- `recordKind`
- `externalRecordId`
- `sourceUrl`
- `rawPayload`

This removes unused variables while preserving the same drift-protection semantics.

No production logic changed.

Corrective commit:

`df1dbc1dc27210bc378c8bbdb1cce4cfba8f03e9`

### Scope boundary

- Dry-run execution: **NO**
- Database connection: **NO**
- Database mutation: **NO**
- Production code semantics changed: **NO**
- Production Supabase mutation: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, rerun focused ESLint for the dry-run slice, and rerun `npm run typecheck` if desired. No UI re-review is required because the correction is test-only.


---

## 55. Entry 050 — Prerequisite materialization dry-run checkpoint validated

**Date:** 18 September 2026  
**Actor:** owner-run local validation  
**Branch:** `r4n-pharma-subprofile-architecture`

Following the test-only focused-lint correction, the owner reran the requested validation and confirmed completion.

### Owner-confirmed validation

- focused ESLint for the prerequisite materialization slice: **PASS**
- `npm run typecheck`: **PASS**

Previously confirmed in the same checkpoint:

- Edge test suite: **27/27 files passed**
- Edge tests: **140/140 passed**
- production build: **PASS**
- Vite modules transformed: **219**
- `node --check scripts/r4n/torntpharm-prerequisite-materialization-dry-run.mjs`: **PASS**
- only the existing non-blocking >500 kB chunk warning remained

### Validated gate state

`TORNTPHARM_PREREQUISITE_MATERIALIZATION_DRY_RUN_V1`

remains:

- dry-run executor prepared: **YES**
- dry-run executed: **NO**
- canonical payloads prepared: **4**
- SHA-256 hashes computed: **NO**
- exact proposed metric/source SQL prepared by executor: **YES**
- database connection: **NO**
- writes executed: **0**
- mutation authorized: **NO**

### Scope boundary

- Dry-run execution: **NO**
- Metric-definition insert: **NO**
- Source-record insert: **NO**
- Fundamental-observation insert: **NO**
- Local DB mutation: **NO**
- Production Supabase mutation: **NO**
- Deployment: **NO**
- PR #101 merge: **NO**

**Result:** Prerequisite Materialization Dry Run V1 preparation checkpoint = **VALIDATED**.

**CURRENT STOP POINT:** The next safe R4N decision is whether to execute the non-writing command `npm run r4n:dry-run:prerequisites`. That command has no database connection and would only compute the four SHA-256 hashes and print the exact proposed SQL; it would still perform zero writes.


---

## 56. Entry 051 — Prerequisite materialization dry-run executed successfully

**Date:** 18 September 2026  
**Actor:** owner-run local execution  
**Branch:** `r4n-pharma-subprofile-architecture`

The owner executed the validated non-writing command:

`npm run r4n:dry-run:prerequisites`

### Execution result

Observed header state:

- `DATABASE_CONNECTION=NO`
- `WRITES_EXECUTED=0`
- serialization: `RECURSIVE_LEXICOGRAPHIC_KEY_SORT_V1`
- hash algorithm: `SHA256`

The executor deterministically serialized and hashed all four canonical reviewed issuer payloads.

### Materialized dry-run hashes

- `TORRENT_Q1_FY26_RELEASE` — 2025-06-30 — 19%  
  SHA-256: `b8a8b87c01a1ea1ade5f1d7bc158804a793caeed8d02f1652e885b94deae8788f`

- `TORRENT_Q2_FY26_RELEASE` — 2025-09-30 — 26%  
  SHA-256: `3847fc6cadca356c5d1d0b07da2a584a9f90b2c7c3cbaa83237bd5d05fceec5f2`

- `TORRENT_Q3_FY26_RELEASE` — 2025-12-31 — 19%  
  SHA-256: `3df20aaafb6be4e2f9f2f070489feb8937c97f0d47f6997a3c6c5910224caeb7`

- `TORRENT_Q4_FY26_RELEASE` — 2026-03-31 — 16% comparable base-business growth  
  SHA-256: `d08cf8f86694557b5391ff9085e9e98a1667d4d4fab8994e2626e990922998b53`

The rejected Q4 31% claim remained excluded.

### SQL preview

The executor printed the exact proposed SQL for:

1. one `public.fundamental_metric_definitions` row; and
2. four `public.data_source_records` rows.

No SQL was executed.

### Dry-run summary

- metric-definition rows: **1**
- source-record rows: **4**
- payload hashes computed: **4**
- database connections: **0**
- writes executed: **0**
- mutation authorized: **NO**

### Scope boundary

- Hash computation: **YES**
- SQL preview generation: **YES**
- Database connection: **NO**
- Metric-definition insert: **NO**
- Source-record insert: **NO**
- Fundamental-observation insert: **NO**
- Local DB mutation: **NO**
- Production Supabase mutation: **NO**
- PR #101 merge: **NO**

**Result:** Prerequisite Materialization Dry Run V1 execution = **PASS / ZERO-WRITE**.

**CURRENT STOP POINT:** The next safe R4N gate is to prepare a local-only prerequisite mutation proposal/executor that would insert exactly one metric-definition row and four immutable source-record rows using the verified hashes above, but must remain non-executed until separately approved by the owner.


---

## 57. Entry 052 — Local prerequisite mutation proposal prepared

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Following successful zero-write prerequisite materialization dry-run execution, the next Gate F checkpoint has been prepared at the top of the standard workflow.

### Prepared local-only mutation executor

Added:

- `scripts/r4n/torntpharm-local-prerequisite-mutation.sql`
- `scripts/r4n/run-torntpharm-local-prerequisite-mutation.sh`
- `src/features/research/torntpharmLocalPrerequisiteMutationProposal.ts`
- `src/features/research/torntpharmLocalPrerequisiteMutationProposal.test.ts`

Added npm command:

`npm run r4n:mutate:prerequisites`

### Exact mutation scope

Maximum local persistent inserts:

- `fundamental_metric_definitions`: **1**
- `data_source_records`: **4**
- `fundamental_observations`: **0**

No evidence observations are inserted by this gate.

### Explicit approval boundary

The runner refuses execution unless the environment contains:

`PORTFOLIOAI_ALLOW_LOCAL_PREREQUISITE_MUTATION=YES`

This approval check occurs **before local DB discovery**.

Without the flag:
- no Supabase DB URL lookup;
- no database connection;
- no SQL execution.

The runner separately refuses any DB URL not clearly using `localhost` or `127.0.0.1`.

### Fail-closed database checks

Before mutation, the SQL requires:

- `COMPANY_EXCHANGE_FILING` registry exists in the expected approved state;
- source is active;
- entitlement verified;
- retention rights verified;
- no conflicting existing metric-definition semantics;
- no same-artifact source record with a different hash, payload or URL.

Any conflict aborts the transaction.

### Idempotency

Canonical DB protections confirmed:

- `fundamental_metric_definitions` primary key = `code`;
- `data_source_records` dedup key =
  `(source_code, record_kind, external_record_id, payload_hash)`.

Additional application-level conflict checks prevent silent version drift for the same issuer artifact identity.

### Verified hashes carried into the proposal

- Q1: `b8a8b87c01a1ea1ade5f1d7bc158804a793caeed8d02f1652e885b94deae8788f`
- Q2: `3847fc6cadca356c5d1d0b07da2a584a9f90b2c7c3cbaa83237bd5d05fceec5f2`
- Q3: `3df20aaafb6be4e2f9f2f070489feb8937c97f0d47f6997a3c6c5910224caeb7`
- Q4: `d08cf8f86694557b5391ff9085e9e98a1667d4d4fab8994e2626e990922998b53`

Q4 remains the reviewed comparable **16%** base-business value. The rejected 31% claim remains excluded.

### Postconditions

Before commit, the local SQL verifies:

- one matching metric-definition row exists;
- four matching source records exist;
- this gate has no fundamental-observation write path.

### Glass-box UI checkpoint

A new pair of cards now appears under **Prepared persistence packages**:

**Local prerequisite mutation proposal**
- local Supabase only;
- up to 1 metric-definition + 4 immutable source-record inserts;
- fundamental observations: 0;
- status: **PREPARED · NOT APPROVED · NOT EXECUTED**.

**Mutation execution boundary**
- command: `npm run r4n:mutate:prerequisites`;
- approval flag required before DB discovery;
- local-only guard;
- source-registry, conflict, idempotency and postcondition guards;
- execution approved: **NO**.

### Documentation

Added:

`docs/R4N_TORNTPHARM_Gate_F_Local_Prerequisite_Mutation_Proposal_V1.md`

### Scope boundary

- Local mutation proposal prepared: **YES**
- Execution approved: **NO**
- Executor executed: **NO**
- Metric-definition insert: **NO**
- Source-record insert: **NO**
- Fundamental-observation insert: **NO**
- Production Supabase mutation: **NO**
- Deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, run the local Vite app, and visually inspect the new **Local prerequisite mutation proposal** and **Mutation execution boundary** cards. Do not run the mutation command. After visual approval, run full local validation; only then can actual local mutation be separately considered.


---

## 58. Entry 053 — Mutation-proposal validation mostly passed; non-writing SQL contract test added

**Date:** 18 September 2026  
**Actor:** owner-run validation + ChatGPT validation correction  
**Branch:** `r4n-pharma-subprofile-architecture`

The owner completed the requested local validation for the prepared local prerequisite mutation proposal.

### Confirmed results

From the supplied terminal output:

- Edge test suite: **27/27 files passed**
- Edge tests: **140/140 passed**
- production build: **PASS**
- Vite modules transformed: **220**
- focused ESLint for the mutation-proposal slice: **PASS**
- shell syntax check:
  - `bash -n scripts/r4n/run-torntpharm-local-prerequisite-mutation.sh`
  - **PASS**
- only the existing non-blocking >500 kB chunk warning remained.

### Validation correction

The attempted command:

`psql ... --file scripts/r4n/torntpharm-local-prerequisite-mutation.sql --help >/dev/null 2>&1 || true`

did **not** parse or exercise the SQL because `--help` causes `psql` to exit after showing help.

Therefore SQL validation was not falsely recorded as complete.

### Added non-writing SQL safety contract test

Added:

`src/features/research/torntpharmLocalPrerequisiteMutationSql.test.ts`

This test statically verifies, without any DB connection:

- exactly one `fundamental_metric_definitions` insert path;
- one `data_source_records` insert path;
- no `fundamental_observations` insert;
- approved-source precondition;
- metric-definition conflict abort;
- source-record conflict abort;
- idempotency guards;
- postcondition checks;
- all four verified payload hashes;
- Q4 reviewed value remains 16%;
- rejected Q4 31% value absent;
- explicit `BEGIN` / `COMMIT` transaction boundary.

### Scope boundary

- SQL safety test added: **YES**
- Database connection for this correction: **NO**
- Local mutation: **NO**
- Mutation execution approved: **NO**
- Production Supabase mutation: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, run the new focused test `npx vitest run src/features/research/torntpharmLocalPrerequisiteMutationSql.test.ts`, and rerun focused ESLint including that test. If both pass, this mutation-proposal preparation checkpoint can be closed and actual local prerequisite mutation can be separately considered.


---

## 59. Entry 054 — Local prerequisite mutation proposal checkpoint validated

**Date:** 18 September 2026  
**Actor:** owner-run local validation  
**Branch:** `r4n-pharma-subprofile-architecture`

Following the SQL validation correction, the owner reran the requested focused validation and confirmed the checkpoint clean.

### Owner-confirmed validation

- `npx vitest run src/features/research/torntpharmLocalPrerequisiteMutationSql.test.ts` → **PASS**
- focused ESLint including:
  - `torntpharmLocalPrerequisiteMutationProposal.ts`
  - `torntpharmLocalPrerequisiteMutationProposal.test.ts`
  - `torntpharmLocalPrerequisiteMutationSql.test.ts`
  - `PharmaResearchWorkspacePanel.tsx`
  → **PASS**

Previously confirmed in the same checkpoint:

- Edge test suite: **27/27 files passed**
- Edge tests: **140/140 passed**
- production build: **PASS**
- focused mutation-proposal lint: **PASS**
- shell syntax check for the guarded runner: **PASS**
- existing non-blocking >500 kB Vite chunk warning only.

### Validated mutation proposal state

`TORNTPHARM_LOCAL_PREREQUISITE_MUTATION_PROPOSAL_V1`

remains:

- target: **LOCAL_SUPABASE_ONLY**
- metric-definition rows maximum: **1**
- immutable source-record rows maximum: **4**
- fundamental-observation rows: **0**
- explicit approval flag required before DB discovery;
- local DB guard required;
- source-registry approval required;
- metric conflict abort;
- source-record conflict abort;
- idempotent insert behavior;
- postcondition verification;
- execution approved: **false**
- executed: **false**

### Scope boundary

- Local prerequisite mutation proposal: **VALIDATED**
- Local DB mutation executed: **NO**
- Metric-definition insert: **NO**
- Source-record insert: **NO**
- Fundamental-observation insert: **NO**
- Production Supabase mutation: **NO**
- Deployment: **NO**
- PR #101 merge: **NO**

**Result:** Local Prerequisite Mutation Proposal V1 checkpoint = **VALIDATED**.

**CURRENT STOP POINT:** The next safe R4N action is the separately approval-gated execution of the local-only prerequisite mutation: at most one `fundamental_metric_definitions` row and four immutable `data_source_records` rows, with zero `fundamental_observations` writes. Do not execute unless the owner explicitly approves this exact local mutation.


---

## 60. Entry 055 — Owner explicitly authorized local-only prerequisite mutation

**Date:** 18 September 2026  
**Actor:** owner explicit authorization  
**Branch:** `r4n-pharma-subprofile-architecture`

The owner explicitly authorized this exact local-only mutation:

- insert at most **1** `fundamental_metric_definitions` row;
- insert at most **4** immutable `data_source_records` rows;
- insert **0** `fundamental_observations` rows;
- target **local Supabase only**;
- make **no production changes**.

Authorized command contract:

`PORTFOLIOAI_ALLOW_LOCAL_PREREQUISITE_MUTATION=YES npm run r4n:mutate:prerequisites`

The prepared runner still enforces:
- approval flag before DB discovery;
- localhost / 127.0.0.1 database only;
- approved `COMPANY_EXCHANGE_FILING` source-registry state;
- metric-definition conflict abort;
- source-record conflict abort;
- idempotent inserts;
- postcondition verification.

### Scope boundary

Authorized:
- local prerequisite metric/source materialization only.

Still NOT authorized:
- any `fundamental_observations` insert;
- scoring;
- recommendation;
- position sizing;
- production Supabase mutation;
- deployment;
- PR #101 merge;
- scheduler changes;
- paid-provider calls.

**CURRENT STOP POINT:** Owner should `git pull` to receive this recorded authorization checkpoint, then execute exactly `PORTFOLIOAI_ALLOW_LOCAL_PREREQUISITE_MUTATION=YES npm run r4n:mutate:prerequisites` against the running local Supabase. Return the complete terminal output before any next mutation is considered.


---

## 61. Entry 056 — First authorized local prerequisite mutation failed closed on malformed copied hashes; transaction rolled back

**Date:** 18 September 2026  
**Actor:** owner-run authorized local execution + ChatGPT correction  
**Branch:** `r4n-pharma-subprofile-architecture`

The owner executed the explicitly authorized command:

`PORTFOLIOAI_ALLOW_LOCAL_PREREQUISITE_MUTATION=YES npm run r4n:mutate:prerequisites`

### Guard results

- explicit local mutation approval flag: **PASS**
- local-only database guard: **PASS**
- target scope announced correctly:
  - one metric-definition row;
  - four immutable source-record prerequisites;
  - zero fundamental observations.

### Execution failure

The transaction entered `BEGIN`, passed the preflight block, and attempted the metric/source prerequisite inserts.

PostgreSQL then rejected the first `data_source_records` insert with:

`data_source_records_payload_hash_check`

because the copied payload hash did not satisfy the canonical `^[a-f0-9]{64}$` constraint.

The process stopped under `ON_ERROR_STOP` before `COMMIT`.

Therefore the transaction did **not** persist the earlier metric-definition insert or any source-record insert.

### Root cause

The mutation SQL had manually copied hash strings from the earlier dry-run output/HANDOFF.

Recomputation directly from the canonical manifest showed that all four copied hashes were incorrect; three were 65 characters long and one was 64 characters but still did not match the canonical payload hash.

Correct manifest-derived SHA-256 values are:

- Q1: `bd8ab87c01a1e1ade5f1d7bc158804a793caeed8d02f1652e885b94deae8788f`
- Q2: `3847fc6cadca356c5d1d0b07da2a584a9f90b2c7c3cbaa83237bd5d05fcec5f2`
- Q3: `3df20aaaff6be4e2f9f2f070489feb8937c97f0d47f6997a3c6c5910224caeb7`
- Q4: `dd80f6f86694557b5391ff9085e9e98a1667d4d4fab8994e2626e90922998b53`

### Correction

Updated:

- `scripts/r4n/torntpharm-local-prerequisite-mutation.sql`
- `src/features/research/torntpharmLocalPrerequisiteMutationSql.test.ts`

The SQL now carries the correct manifest-derived hashes.

The safety test no longer trusts duplicated hash literals. It now:

1. imports the canonical materialization manifest;
2. recursively canonicalizes each raw payload;
3. recomputes SHA-256;
4. requires every hash to match `^[a-f0-9]{64}$`;
5. requires the mutation SQL to contain the recomputed hash;
6. still verifies Q4 = 16% and rejected Q4 31% absent.

### Scope boundary

- First authorized local mutation attempt: **FAILED CLOSED**
- Persistent local metric-definition write: **NO**
- Persistent local source-record write: **NO**
- Fundamental-observation write: **NO**
- Production mutation: **NO**
- Existing authorization scope changed: **NO**

The owner's prior authorization remains limited to this exact local-only prerequisite mutation (1 metric-definition row maximum, 4 immutable source records maximum, 0 fundamental observations, no production changes).

**CURRENT STOP POINT:** Owner should `git pull`, run `npx vitest run src/features/research/torntpharmLocalPrerequisiteMutationSql.test.ts` and focused ESLint for that test. If clean, the already-authorized guarded local mutation may be retried with `PORTFOLIOAI_ALLOW_LOCAL_PREREQUISITE_MUTATION=YES npm run r4n:mutate:prerequisites`.


---

## 62. Entry 057 — Local sync was correct; mutation-hash test serializer aligned with dry-run executor

**Date:** 18 September 2026  
**Actor:** owner local verification + ChatGPT correction  
**Branch:** `r4n-pharma-subprofile-architecture`

The owner verified:

- current branch: `r4n-pharma-subprofile-architecture`;
- local HEAD: `97eed734283001b99824e00101ed3f4ad5723dab`;
- tracked working tree: clean;
- only unrelated untracked local fixture/audit files were present.

Therefore the prior suspicion of a local pull/sync mismatch was incorrect.

### Actual cause of focused hash-test failure

The dry-run executor canonicalizes JSON objects with:

`Object.keys(record).sort()`

The mutation SQL safety test had been recomputing hashes with:

`localeCompare`

Those are not guaranteed to produce the same ordering for this contract, so the test could derive a different canonical byte sequence and reject the correct SQL hashes.

### Correction

Updated:

`src/features/research/torntpharmLocalPrerequisiteMutationSql.test.ts`

The test now uses the exact same recursive lexicographic key-sort implementation as:

`scripts/r4n/torntpharm-prerequisite-materialization-dry-run.mjs`

Correct canonical SHA-256 values remain:

- Q1: `bd8ab87c01a1e1ade5f1d7bc158804a793caeed8d02f1652e885b94deae8788f`
- Q2: `3847fc6cadca356c5d1d0b07da2a584a9f90b2c7c3cbaa83237bd5d05fcec5f2`
- Q3: `3df20aaaff6be4e2f9f2f070489feb8937c97f0d47f6997a3c6c5910224caeb7`
- Q4: `dd80f6f86694557b5391ff9085e9e98a1667d4d4fab8994e2626e90922998b53`

All four are 64-character lowercase hexadecimal SHA-256 values derived from the canonical manifest payloads.

### Scope boundary

- Local tracked code unexpectedly stale: **NO**
- Test serializer mismatch: **YES, corrected**
- Database mutation during this correction: **NO**
- Existing owner authorization for the exact local prerequisite mutation remains in force.

**CURRENT STOP POINT:** Owner should `git pull`, rerun `npx vitest run src/features/research/torntpharmLocalPrerequisiteMutationSql.test.ts` and focused ESLint for that test. If clean, retry the already-authorized local-only prerequisite mutation command.


---

## 63. Entry 058 — Authorized local prerequisite mutation succeeded

**Date:** 18 September 2026  
**Actor:** owner-run authorized local execution  
**Branch:** `r4n-pharma-subprofile-architecture`

The owner reran the corrected mutation flow after the manifest-derived hash serializer test was aligned with the dry-run executor.

### Focused safety validation before execution

- `npx vitest run src/features/research/torntpharmLocalPrerequisiteMutationSql.test.ts` → **PASS**
- test files: **1/1 passed**
- tests: **5/5 passed**
- focused ESLint for the SQL safety test → **PASS**

### Authorized local-only mutation

Command:

`PORTFOLIOAI_ALLOW_LOCAL_PREREQUISITE_MUTATION=YES npm run r4n:mutate:prerequisites`

Observed guards:

- explicit local mutation approval flag: **PASS**
- local-only database guard: **PASS**

Observed transaction:

- `BEGIN`
- preflight block: **PASS**
- metric-definition insert: **1 row**
- immutable source-record insert: **4 rows**
- postcondition verification: **PASS**
- `COMMIT`

### Persisted local prerequisite state

Persisted to local Supabase only:

- `fundamental_metric_definitions`: **1** row for `PHARMA_EXPORT_US_REVENUE_GROWTH`
- `data_source_records`: **4** immutable issuer source records
- `fundamental_observations`: **0** rows inserted

Verified postconditions:

- metric-definition target count: **1**
- source-record target count: **4**
- fundamental observations inserted: **0**

### Scope boundary

- Local prerequisite mutation: **SUCCESS**
- Persistent local prerequisite rows: **5 maximum / 5 inserted on this first successful run**
- Fundamental-observation write: **NO**
- Production Supabase mutation: **NO**
- Deployment: **NO**
- PR #101 merge: **NO**
- Scoring/recommendation/position-sizing changes: **NO**

**Result:** Local prerequisite materialization = **SUCCESS / LOCAL-ONLY / 0 EVIDENCE-OBSERVATION WRITES**.

**CURRENT STOP POINT:** The next safe R4N action is to rerun the read-only numeric preflight. Expected result: the metric-definition and source-record blockers should clear, with the four reviewed US-growth rows becoming `INSERT_CANDIDATE` if no existing-fact conflicts are present. No observation insert is authorized yet.


---

## 64. Entry 059 — Read-only numeric preflight now fully ready for separate observation-write approval

**Date:** 18 September 2026  
**Actor:** owner-run local execution  
**Branch:** `r4n-pharma-subprofile-architecture`

The owner reran:

`npm run r4n:preflight:numeric`

after successful local prerequisite materialization.

### Canonical prerequisite state

Observed:

- TORNTPHARM security rows: **1**
- active reviewed Domestic Formulations assignments: **1**
- `PHARMA_EXPORT_US_REVENUE_GROWTH` metric-definition rows: **1**
- metric-definition matches expected contract: **true**

### Four reviewed US-growth rows

All four rows resolved to immutable local source records and had no existing-fact conflict:

- 2025-06-30 — 19% — `TORRENT_Q1_FY26_RELEASE` → `INSERT_CANDIDATE`
- 2025-09-30 — 26% — `TORRENT_Q2_FY26_RELEASE` → `INSERT_CANDIDATE`
- 2025-12-31 — 19% — `TORRENT_Q3_FY26_RELEASE` → `INSERT_CANDIDATE`
- 2026-03-31 — 16% — `TORRENT_Q4_FY26_RELEASE` → `INSERT_CANDIDATE`

For all four rows:

- exact existing count: **0**
- conflicting existing count: **0**
- blockers: **none**

### Preflight summary

- rows checked: **4**
- insert candidates: **4**
- already present: **0**
- conflicts: **0**
- blocked: **0**
- preflight state: **READY_FOR_SEPARATE_WRITE_APPROVAL**
- write authorization: **NO**

The preflight remained read-only and ended in `ROLLBACK`.

### Scope boundary

- Prerequisites materialized locally: **YES**
- Four observation rows eligible: **YES**
- Observation write authorized: **NO**
- Fundamental-observation insert performed: **NO**
- Production Supabase mutation: **NO**
- PR #101 merge: **NO**

**Result:** Numeric preflight = **READY FOR SEPARATE OBSERVATION-WRITE APPROVAL**.

**CURRENT STOP POINT:** The next safe R4N gate is to prepare a local-only 4-row `fundamental_observations` insertion proposal/executor using the reviewed values and the now-resolved immutable source-record ids. The package must remain non-executed until separately approved by the owner.


---

## 65. Entry 060 — Local 4-row evidence observation mutation proposal prepared

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Following the clean read-only numeric preflight state `READY_FOR_SEPARATE_WRITE_APPROVAL`, the final Gate F local evidence-write proposal has been prepared.

### Prepared local-only observation executor

Added:

- `scripts/r4n/torntpharm-local-observation-mutation.sql`
- `scripts/r4n/run-torntpharm-local-observation-mutation.sh`
- `src/features/research/torntpharmLocalObservationMutationProposal.ts`
- `src/features/research/torntpharmLocalObservationMutationSql.test.ts`

Added npm command:

`npm run r4n:mutate:observations`

### Exact proposed observation scope

Metric:

`PHARMA_EXPORT_US_REVENUE_GROWTH`

Prepared values:

- Q1 FY26 / 2025-06-30 → **19%**
- Q2 FY26 / 2025-09-30 → **26%**
- Q3 FY26 / 2025-12-31 → **19%**
- Q4 FY26 / 2026-03-31 → **16%**

The rejected Q4 31% claim remains excluded.

Maximum local observation inserts:

- `fundamental_observations`: **4**

No production mutation is part of this proposal.

### Explicit approval boundary

The runner refuses before DB discovery unless:

`PORTFOLIOAI_ALLOW_LOCAL_OBSERVATION_MUTATION=YES`

is explicitly supplied.

Without the flag:
- no Supabase DB URL lookup;
- no database connection;
- no SQL execution.

The runner separately refuses non-local DB URLs.

### Fail-closed SQL checks

The transaction requires:

- exactly one active NSE TORNTPHARM security row;
- exactly one current reviewed PHARMA_V1 / Domestic Formulations assignment;
- one active `PHARMA_EXPORT_US_REVENUE_GROWTH` metric contract with NUMERIC/PERCENT/PHARMA_BUSINESS_MODEL semantics;
- all four immutable issuer-result source records;
- zero conflicting existing quarter observations.

Any mismatch aborts.

### Canonical observation semantics

The proposed rows use:

- source-record ids dynamically resolved from local immutable source records;
- source code `COMPANY_EXCHANGE_FILING`;
- numeric value only;
- unit `PERCENT`;
- period type `QUARTER`;
- consolidation scope `UNKNOWN`;
- source retrieved_at copied into observation retrieved_at;
- fresh_until derived from source retrieved_at plus registered metric freshness;
- evidence status `AVAILABLE`.

### Idempotency/postconditions

- exact matching observations are skipped;
- conflicting same-quarter values/units abort;
- observations are never overwritten;
- postconditions require exactly four exact reviewed observations;
- postconditions require zero conflicts.

### Glass-box UI checkpoint

A new pair of cards now appears under **Prepared persistence packages**:

**Local evidence observation proposal**
- up to 4 reviewed US-growth observations;
- Q1 19%, Q2 26%, Q3 19%, Q4 16%;
- status: **PREPARED · NOT APPROVED · NOT EXECUTED**.

**Observation execution boundary**
- command: `npm run r4n:mutate:observations`;
- separate approval required before DB discovery;
- local-only DB, identity, assignment, metric, source-record, conflict, idempotency and postcondition guards;
- execution approved: **NO**.

### Documentation

Added:

`docs/R4N_TORNTPHARM_Gate_F_Local_Observation_Mutation_Proposal_V1.md`

### Scope boundary

- Observation mutation proposal prepared: **YES**
- Execution approved: **NO**
- Executor executed: **NO**
- Local fundamental-observation writes: **0**
- Production Supabase mutation: **NO**
- Deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, run local Vite, and visually verify the new **Local evidence observation proposal** and **Observation execution boundary** cards. Do not run the observation mutation command. After visual approval, run full local validation and only then separately consider authorizing the exact four-row local observation mutation.


---

## 66. Entry 061 — Numeric preflight glass-box card refreshed to latest verified state

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

During localhost visual review of the prepared local observation mutation proposal, the owner identified that the older **Local numeric preflight** card still displayed the historical blocked state from before prerequisite materialization.

The underlying read-only preflight had already been rerun successfully and verified:

- rows checked: **4**
- insert candidates: **4**
- already present: **0**
- conflicts: **0**
- blocked: **0**
- preflight state: **READY_FOR_SEPARATE_WRITE_APPROVAL**
- write authorization: **NO**

### UI correction

Updated:

`src/features/research/PharmaResearchWorkspacePanel.tsx`

The glass-box card now states:

- all four reviewed US-growth rows resolve to immutable source records;
- existing facts: **0**
- conflicts: **0**
- blockers: **0**
- status: **EXECUTED · READY FOR SEPARATE WRITE APPROVAL**
- insert candidates: **4**

This is a presentation-state correction only. It does not re-run the database preflight and does not alter any persistence or authorization behavior.

### Scope boundary

- UI glass-box state corrected: **YES**
- Database read/write performed by this correction: **NO**
- Observation mutation approved: **NO**
- Observation mutation executed: **NO**
- Production Supabase mutation: **NO**
- Deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull` and visually confirm the refreshed **Local numeric preflight** card on localhost together with the prepared **Local evidence observation proposal**. After visual approval, run full local validation for the observation-mutation proposal; only then may the exact four-row local observation mutation be separately authorized.


---

## 67. Entry 062 — Local observation mutation proposal checkpoint validated

**Date:** 18 September 2026  
**Actor:** owner-run local validation  
**Branch:** `r4n-pharma-subprofile-architecture`

The owner completed the full local validation for the prepared four-row TORNTPHARM observation-write proposal.

### Owner-confirmed validation

- Edge test suite: **27/27 files passed**
- Edge tests: **140/140 passed**
- production build: **PASS**
- Vite modules transformed: **221**
- focused SQL safety test:
  - `npx vitest run src/features/research/torntpharmLocalObservationMutationSql.test.ts`
  - **1/1 file passed**
  - **6/6 tests passed**
- focused ESLint for:
  - `torntpharmLocalObservationMutationProposal.ts`
  - `torntpharmLocalObservationMutationSql.test.ts`
  - `PharmaResearchWorkspacePanel.tsx`
  → **PASS**
- runner syntax:
  - `bash -n scripts/r4n/run-torntpharm-local-observation-mutation.sh`
  → **PASS**
- only the existing non-blocking >500 kB Vite chunk warning remained.

### Validated observation mutation proposal

`TORNTPHARM_LOCAL_OBSERVATION_MUTATION_PROPOSAL_V1`

Prepared rows:

- 2025-06-30 → 19%
- 2025-09-30 → 26%
- 2025-12-31 → 19%
- 2026-03-31 → 16%

Validated safeguards:

- approval flag before DB discovery;
- local database only;
- unique TORNTPHARM security identity;
- current reviewed Domestic Formulations assignment required;
- active matching metric contract required;
- all four immutable source records required;
- conflicting existing fact abort;
- exact existing fact idempotent skip;
- postcondition verification;
- rejected Q4 31% value excluded.

### Scope boundary

- Observation mutation proposal: **VALIDATED**
- Observation execution approved: **NO**
- Observation mutation executed: **NO**
- Local fundamental-observation writes: **0**
- Production Supabase mutation: **NO**
- Deployment: **NO**
- PR #101 merge: **NO**

**Result:** Local Observation Mutation Proposal V1 checkpoint = **VALIDATED**.

**CURRENT STOP POINT:** The next safe R4N action is the separately approval-gated local-only insertion of up to four reviewed `fundamental_observations` rows for TORNTPHARM. Do not execute unless the owner explicitly authorizes these exact four local evidence writes.


---

## 68. Entry 063 — Owner explicitly authorized local-only TORNTPHARM observation mutation

**Date:** 18 September 2026  
**Actor:** owner explicit authorization  
**Branch:** `r4n-pharma-subprofile-architecture`

The owner explicitly authorized this exact local-only evidence mutation:

- insert up to **4** `fundamental_observations` rows for TORNTPHARM;
- metric: `PHARMA_EXPORT_US_REVENUE_GROWTH`;
- Q1 FY26 / 2025-06-30 → **19%**;
- Q2 FY26 / 2025-09-30 → **26%**;
- Q3 FY26 / 2025-12-31 → **19%**;
- Q4 FY26 / 2026-03-31 → **16%**;
- target **local Supabase only**;
- make **no production changes**.

Authorized command contract:

`PORTFOLIOAI_ALLOW_LOCAL_OBSERVATION_MUTATION=YES npm run r4n:mutate:observations`

The prepared runner still enforces:

- approval flag before DB discovery;
- localhost / 127.0.0.1 database only;
- unique active NSE TORNTPHARM identity;
- reviewed PHARMA_V1 / Domestic Formulations assignment;
- active matching metric contract;
- all four immutable issuer-result source records;
- conflict abort;
- idempotent exact-fact skip;
- postcondition verification.

### Scope boundary

Authorized:
- the exact four local reviewed US-growth evidence observations above.

Still NOT authorized:
- any production Supabase mutation;
- any additional evidence rows;
- regulatory event persistence;
- scoring;
- recommendation;
- position sizing;
- deployment;
- PR #101 merge;
- scheduler changes;
- paid-provider calls.

**CURRENT STOP POINT:** Owner should `git pull` to receive this recorded authorization checkpoint, then execute exactly `PORTFOLIOAI_ALLOW_LOCAL_OBSERVATION_MUTATION=YES npm run r4n:mutate:observations` against the running local Supabase. Return the complete terminal output before any next action is considered.


---

## 69. Entry 064 — Authorized local TORNTPHARM observation mutation succeeded

**Date:** 18 September 2026  
**Actor:** owner-run authorized local execution  
**Branch:** `r4n-pharma-subprofile-architecture`

The owner executed the explicitly authorized local-only observation mutation:

`PORTFOLIOAI_ALLOW_LOCAL_OBSERVATION_MUTATION=YES npm run r4n:mutate:observations`

### Guard results

Observed:

- explicit local observation mutation approval flag: **PASS**
- local-only database guard: **PASS**
- production database reachability through runner: **NO**

### Transaction result

Observed:

- `BEGIN`
- preflight block: **PASS**
- `INSERT 0 4`
- postconditions: **PASS**
- exact reviewed observation count: **4**
- conflicting observation count: **0**
- `COMMIT`

### Persisted local observations

Inserted into local Supabase only:

- 2025-06-30 → **19%**
- 2025-09-30 → **26%**
- 2025-12-31 → **19%**
- 2026-03-31 → **16%**

Metric:

`PHARMA_EXPORT_US_REVENUE_GROWTH`

Canonical semantics:

- unit: `PERCENT`
- period type: `QUARTER`
- consolidation scope: `UNKNOWN`
- evidence status: `AVAILABLE`
- immutable source-record lineage preserved

The rejected Q4 31% claim remained excluded.

### Scope boundary

- Local fundamental-observation insert: **SUCCESS**
- Local observation rows inserted: **4**
- Conflicting local observations: **0**
- Production Supabase mutation: **NO**
- Additional evidence rows: **NO**
- Regulatory event persistence: **NO**
- Scoring/recommendation/position-sizing changes: **NO**
- Deployment: **NO**
- PR #101 merge: **NO**

**Result:** TORNTPHARM local US-growth observation materialization = **SUCCESS / LOCAL-ONLY / 4 REVIEWED ROWS / 0 CONFLICTS**.

**CURRENT STOP POINT:** The next safe R4N action is to verify that the Research page now reads and displays these canonical local observations correctly, then rerun the read-only numeric preflight to confirm the four rows transition from `INSERT_CANDIDATE` to `ALREADY_PRESENT`. After localhost evidence display verification and final local validation, Gate F can be closed.


---

## 70. Entry 065 — Canonical TORNTPHARM US-growth evidence wired into foreground Pharma Research UI

**Date:** 18 September 2026  
**Actor:** ChatGPT after owner screenshot review  
**Branch:** `r4n-pharma-subprofile-architecture`

After successful local insertion of the four reviewed TORNTPHARM US-growth observations, localhost screenshots confirmed that the Gate F review engine still displayed the reviewed 19% / 26% / 19% / 16% values, but the normal PHARMA_V1 foreground presentation did not yet surface the new canonical metric.

### Root cause

The canonical loader was already correct:

`src/data/researchRepository.ts`

loads all `fundamental_observations` rows for the security and maps `PHARMA_EXPORT_US_REVENUE_GROWTH` through the registered metric definition into `research.metrics`.

However, the PHARMA_V1 presentation contract did not include `PHARMA_EXPORT_US_REVENUE_GROWTH` in:

- Overview → **Growth at a glance**
- Quality & Growth → **Growth & earnings**

Therefore the canonical evidence existed in `research.metrics` but was not selected for those foreground cards.

### Presentation-only correction

Updated:

`src/features/research/researchProfileUiContract.ts`

Added `PHARMA_EXPORT_US_REVENUE_GROWTH` to:

1. PHARMA_V1 **Growth at a glance** snapshot group;
2. PHARMA_V1 **Growth & earnings** Quality & Growth workspace section.

No scoring weights, scoring curves, evidence contracts, database state, or Gate G methodology changed.

### Regression coverage

Added:

`src/features/research/researchProfileUiContract.pharmaUsGrowth.test.ts`

The test asserts that PHARMA_V1 exposes the canonical US-growth metric in both foreground locations.

### Existing Evidence ledger behavior

No change was needed for the Evidence tab because it already renders the complete `research.metrics` collection. Once the canonical rows are loaded, they are available there automatically.

### Scope boundary

- Canonical local observations already persisted: **YES**
- Foreground presentation wiring corrected: **YES**
- Database mutation in this correction: **NO**
- Scoring/recommendation change: **NO**
- Production Supabase mutation: **NO**
- Deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, refresh localhost, and visually verify:
1. Overview → Growth at a glance shows **Export / US Revenue Growth = 16%** as the latest quarter;
2. Quality & Growth → Growth & earnings shows the same latest canonical metric and its Evidence History exposes the four quarter series;
3. Evidence tab contains the four `PHARMA_EXPORT_US_REVENUE_GROWTH` rows. After visual confirmation, run focused validation and close Gate F.


---

## 71. Entry 066 — Foreground Research UI visually verified against canonical TORNTPHARM observations

**Date:** 18 September 2026  
**Actor:** owner localhost visual verification  
**Branch:** `r4n-pharma-subprofile-architecture`

Following the PHARMA_V1 foreground presentation wiring correction, the owner visually verified the canonical TORNTPHARM US-growth observations on localhost.

### Verified foreground surfaces

**Overview → Growth at a glance**
- `Export / US Revenue Growth`
- latest value: **16%**
- period: **Quarter · 31 Mar 2026**
- status: **VERIFIED**

**Quality & Growth → Growth & earnings**
- `Export / US Revenue Growth`
- latest value: **16%**
- period: **Quarter · 31 Mar 2026**
- provider: `COMPANY_EXCHANGE_FILING`
- status: **VERIFIED**

**Evidence ledger**
All four canonical quarter observations are visible:

- 30 Jun 2025 → **19%**
- 30 Sep 2025 → **26%**
- 31 Dec 2025 → **19%**
- 31 Mar 2026 → **16%**

All four display **VERIFIED** status.

### Selection-state note

The Evidence ledger currently displays the four observations as **Competing / unselected** because no `fundamental_observation_decisions` selection row was created by Gate F.

This does not prevent the rows from being VERIFIED because the registered metric contract is reviewed and the persisted observations use evidence_status `AVAILABLE`.

No observation-selection policy or scoring decision was authorized in Gate F. Any later requirement to select a canonical observation explicitly should be handled by a separate decision/scoring contract rather than silently added to the evidence-write gate.

### Gate F outcome now demonstrated end to end

- reviewed source claim → **YES**
- incompatible Q4 31% claim rejected → **YES**
- canonical prerequisite metric/source records → **YES**
- canonical four-quarter observations → **YES**
- read-only preflight sees 4 `ALREADY_PRESENT` / 0 conflicts / 0 blockers → **YES**
- foreground Overview reads latest canonical value → **YES**
- foreground Quality & Growth reads latest canonical value → **YES**
- Evidence ledger exposes all four canonical quarter rows → **YES**
- production mutation → **NO**
- scoring/recommendation change → **NO**

**CURRENT STOP POINT:** Run final focused validation for the PHARMA_V1 US-growth foreground presentation and the Gate F observation contracts. If clean, record the final validation checkpoint and close Gate F.


---

## 72. Entry 067 — Gate F closed after end-to-end local evidence verification

**Date:** 18 September 2026  
**Actor:** owner-run final validation + ChatGPT closure  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate F for the TORNTPHARM PHARMA_V1 pilot is now complete.

### Final focused validation

Owner executed:

- `npx vitest run src/features/research/researchProfileUiContract.pharmaUsGrowth.test.ts src/features/research/torntpharmLocalObservationMutationSql.test.ts`
  - test files: **2/2 passed**
  - tests: **8/8 passed**
- focused ESLint across the PHARMA_V1 foreground wiring and observation-mutation slice → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**
- build transformed **221 modules**
- only the known non-blocking >500 kB Vite chunk warning remained.

Earlier Gate F validation had already confirmed:

- full app tests: **97/97 files / 511/511 tests passed**
- Edge tests: **27/27 files / 140/140 tests passed**
- architecture/data-boundary guards: **PASS**
- local-only prerequisite and observation mutation runners: guarded and validated
- local regulatory migration replay: **PASS / rollback clean**
- canonical prerequisite materialization: **SUCCESS**
- four reviewed canonical observation inserts: **SUCCESS / local-only**
- production writes: **0**

### Final local canonical evidence state

Metric:

`PHARMA_EXPORT_US_REVENUE_GROWTH`

Canonical reviewed observations now present in local Supabase:

- 30 Jun 2025 → **19%**
- 30 Sep 2025 → **26%**
- 31 Dec 2025 → **19%**
- 31 Mar 2026 → **16%**

Rejected scope-incompatible Q4 31% claim remains excluded.

Read-only numeric preflight after insertion confirmed:

- rows checked: **4**
- insert candidates: **0**
- already present: **4**
- conflicts: **0**
- blocked: **0**
- write authorization: **NO**
- read-only rollback: **PASS**

### Foreground Research UI verified on localhost

Owner visually verified:

**Overview → Growth at a glance**
- Export / US Revenue Growth = **16%**
- status: **VERIFIED**

**Quality & Growth → Growth & earnings**
- Export / US Revenue Growth = **16%**
- period: Quarter · 31 Mar 2026
- provider: `COMPANY_EXCHANGE_FILING`
- status: **VERIFIED**

**Evidence ledger**
- all four canonical quarter rows visible;
- all four display **VERIFIED**.

The ledger currently labels them **Competing / unselected** because Gate F did not create `fundamental_observation_decisions` rows. This is intentionally left for a later selection/scoring contract and is not a Gate F blocker.

### Gate F completion criteria satisfied

- public/official discovery contract: **YES**
- exact document planning: **YES**
- read-only content review: **YES**
- rejected incompatible claim retained outside canonical series: **YES**
- candidate-to-ingestion validation: **YES**
- prerequisite schema/package preparation: **YES**
- local prerequisite preflight and materialization: **YES**
- canonical metric/source prerequisite persistence: **YES**
- local observation proposal and guarded execution: **YES**
- four reviewed canonical observations persisted locally: **YES**
- post-write preflight confirms already-present/no-conflict state: **YES**
- foreground Research page reads canonical observations: **YES**
- final focused validation: **PASS**
- production mutation: **NO**
- scoring/recommendation/position-sizing changes: **NO**

## Gate F status: CLOSED

Gate F is complete for the TORNTPHARM PHARMA_V1 pilot.

### Next gate

The next planned stage is **Gate G — PHARMA_V1 scoring methodology**.

Gate G must define and version the scoring curves, thresholds and weights that translate approved Pharma evidence into deterministic dimension scores. Gate G must not silently reuse BANK_NBFC scoring logic and must remain profile/subprofile aware.

No Gate G scoring methodology has been approved or executed by this closure.

### Scope boundary at closure

- Gate F: **CLOSED**
- local TORNTPHARM canonical evidence pilot: **COMPLETE**
- PR #101 merge: **NO**
- production deploy: **NO**
- production Supabase mutation: **NO**
- Gate G scoring: **NOT STARTED / NOT APPROVED**


---

## 73. Entry 068 — Gate G scoring methodology design checkpoint prepared

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate F is closed. Gate G has now started with a design-only methodology checkpoint.

### Repository inspection findings

The existing PHARMA_V1 scoring architecture already provides the correct foundation:

- R4I registered a dedicated PHARMA_V1 scoring profile;
- R4L later completed the parent profile to **10 weighted dimensions**, including Business Durability;
- current PHARMA_V1 dimension weights total 100%;
- existing score-readiness gates remain 60% per weighted dimension and 70% for overall read-only preview, with all weighted dimensions required to cross their own gates;
- existing Pharma history/evidence rules intentionally carry `score_curve_state = PENDING` where numeric normalization has not been approved.

Current PHARMA_V1 parent dimension weights:

- QUALITY 13%
- GROWTH 15%
- CAPITAL_EFFICIENCY 10%
- CASH_FLOW 10%
- BALANCE_SHEET_CREDIT 10%
- BUSINESS_DURABILITY 10%
- VALUATION 12%
- MOMENTUM 8%
- OWNERSHIP_GOVERNANCE 6%
- RISK 6%

### Gate G design model

Added:

- `src/features/research/pharmaGateGScoringMethodProposal.ts`
- `src/features/research/pharmaGateGScoringMethodProposal.test.ts`

Proposal version:

`PHARMA_V1_GATE_G_SCORING_METHOD_PROPOSAL_V1`

State:

`DESIGN_ONLY`

### TORNTPHARM subprofile participation

Primary:

- Domestic Formulations
- role: **PRIMARY_SCORE_DRIVER**
- included in PHARMA_V1 scoring requirements.

Material overlay:

- Global Generics
- role: **MATERIAL_EVIDENCE_OVERLAY**
- may change approved evidence composition inside affected dimensions;
- must not create or blend a second independent stock score;
- denominator effect: **WITHIN_DIMENSION_ONLY**.

Emerging watch:

- CDMO / CRAMS
- role: **EMERGING_WATCH_EXCLUDED**
- remains visible in research;
- excluded from score readiness and scoring denominator until a separately versioned emerging-specific scoring contract is approved.

### Preserved safety gates

- dimension minimum score-ready coverage: **60%**
- overall minimum score-ready coverage: **70%**
- every weighted dimension must be ready before an overall preview can appear.

### Explicit non-activation state

- numeric curve approval: **PENDING_APPROVAL**
- score execution enabled: **NO**
- recommendation enabled: **NO**
- position sizing enabled: **NO**

### Glass-box UI

Added a compact collapsed layer:

**Gate G · Scoring methodology design**

inside the Pharmaceuticals deep-research workspace.

It displays:

- weighted dimension count and total;
- dimension and overall readiness gates;
- current curve-approval state;
- primary scoring model;
- material scoring overlay;
- emerging scoring watch;
- preserved dimension weights;
- score/recommendation/position-sizing execution boundary.

### Documentation

Added:

`docs/R4N_TORNTPHARM_Gate_G_Scoring_Methodology_Design_V1.md`

### Scope boundary

- Gate G started: **YES**
- scoring architecture proposal prepared: **YES**
- numeric normalization curves approved: **NO**
- score run executed: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- production Supabase mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, open localhost TORNTPHARM Research, expand **Gate G · Scoring methodology design**, and visually review the dimension weights, readiness gates, primary/material/emerging participation model, and execution boundary. After visual approval, run focused local validation before any numeric scoring curve is proposed.


---

## 74. Entry 069 — Gate G methodology-design checkpoint validated

**Date:** 18 September 2026  
**Actor:** owner-run local validation  
**Branch:** `r4n-pharma-subprofile-architecture`

The owner completed the focused local validation for the Gate G PHARMA_V1 scoring-methodology design checkpoint.

### Validated artifacts

- `src/features/research/pharmaGateGScoringMethodProposal.ts`
- `src/features/research/pharmaGateGScoringMethodProposal.test.ts`
- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### Owner-confirmed validation

- focused Vitest for the Gate G methodology proposal: **PASS**
- focused ESLint for the Gate G methodology slice: **PASS**
- `npm run typecheck`: **PASS**
- `npm run build`: **PASS**
- no new blocking build issue reported.

### Visually verified methodology state

- 10 PHARMA_V1 weighted dimensions;
- total dimension weight = 100%;
- dimension score-ready gate = 60%;
- overall preview gate = 70%;
- every weighted dimension must also be score-ready;
- Domestic Formulations = **PRIMARY_SCORE_DRIVER**;
- Global Generics = **MATERIAL_EVIDENCE_OVERLAY**;
- CDMO / CRAMS = **EMERGING_WATCH_EXCLUDED**;
- numeric curve approval = **PENDING**;
- score run = **NO**;
- recommendation = **NO**;
- position sizing = **NO**.

### Scope boundary

- Gate G methodology-design checkpoint: **VALIDATED**
- numeric normalization curves approved: **NO**
- score execution: **NO**
- persisted score run: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- production Supabase mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** The next safe Gate G slice is to define the first versioned PHARMA_V1 normalization-curve contracts as reviewable methodology artifacts only. Curves must remain non-executable and score runs disabled until separately approved.


---

## 75. Entry 070 — Gate G first PHARMA_V1 normalization-curve proposal prepared

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

The next Gate G slice has been prepared as a methodology-only proposal for the first numeric Pharma curve family.

### First proposed curve family

Proposal version:

`PHARMA_SEGMENT_GROWTH_CURVE_V1_PROPOSAL`

Applies to:

- `PHARMA_DOMESTIC_REVENUE_GROWTH`
- `PHARMA_EXPORT_US_REVENUE_GROWTH`

The curve remains **PROPOSAL_ONLY** and is not wired into score execution.

### Required history

- minimum comparable reviewed quarters: **4**
- preferred comparable reviewed quarters: **8**
- latest completed quarter required;
- rejected/scope-incompatible claims excluded before scoring;
- broken comparable series fails closed and produces no score.

### Proposed composite

**Growth level — 60%**

Statistic: median of latest 4 comparable YoY segment-growth quarters.

Bands:
- >=20% → 100
- >=15% and <20% → 85
- >=10% and <15% → 70
- >=5% and <10% → 55
- >=0% and <5% → 40
- <0% → 20

**Consistency — 25%**

Statistic: positive-growth quarters among latest 4.

Scores:
- 4/4 → 100
- 3/4 → 75
- 2/4 → 50
- 1/4 → 25
- 0/4 → 0

**Trend — 15%**

Statistic: latest quarter growth minus median of prior 3 comparable growth rates.

Bands:
- >=+5 percentage points → 100
- >=0 and <+5 → 75
- >=-5 and <0 → 50
- >=-10 and <-5 → 25
- <-10 → 0

### Repository artifacts

Added:

- `src/features/research/pharmaSegmentGrowthCurveProposal.ts`
- `src/features/research/pharmaSegmentGrowthCurveProposal.test.ts`
- `docs/R4N_TORNTPHARM_Gate_G_Segment_Growth_Curve_Proposal_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

The Gate G glass-box now displays:
- **First proposed curve family**
- **History & fail-closed boundary**

### Explicit non-activation boundary

- activation approved: **NO**
- scoring adapter implementation: **NO**
- scoring-rule migration: **NO**
- score execution: **NO**
- persisted score run: **NO**
- recommendation impact: **NO**
- position-sizing impact: **NO**
- production mutation: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, open localhost TORNTPHARM Research → **Gate G · Scoring methodology design**, and visually review the new proposed segment-growth curve cards. After visual approval, run focused local validation before any curve can move toward approval or implementation.


---

## 76. Entry 071 — Gate G segment-growth curve proposal validated

**Date:** 18 September 2026  
**Actor:** owner-run local validation  
**Branch:** `r4n-pharma-subprofile-architecture`

The owner completed focused local validation for the first PHARMA_V1 normalization-curve proposal.

### Validated curve proposal

`PHARMA_SEGMENT_GROWTH_CURVE_V1_PROPOSAL`

Applies to:

- `PHARMA_DOMESTIC_REVENUE_GROWTH`
- `PHARMA_EXPORT_US_REVENUE_GROWTH`

Composite design:

- growth level: **60%**
- positive-quarter consistency: **25%**
- latest-versus-prior-three trend: **15%**

History boundary:

- minimum comparable quarters: **4**
- preferred comparable quarters: **8**
- latest period required;
- rejected/scope-incompatible claims excluded;
- broken comparable series fails closed.

### Owner-confirmed validation

- `pharmaGateGScoringMethodProposal.test.ts`: **6/6 passed**
- `pharmaSegmentGrowthCurveProposal.test.ts`: **6/6 passed**
- focused test total: **12/12 passed**
- focused ESLint: **PASS**
- `npm run typecheck`: **PASS**
- `npm run build`: **PASS**
- build transformed **223 modules**
- only the existing non-blocking >500 kB Vite chunk warning remained.

### Activation boundary remains unchanged

- curve proposal validated: **YES**
- curve activation approved: **NO**
- scoring adapter implementation: **NO**
- scoring-rule migration: **NO**
- score execution: **NO**
- persisted score run: **NO**
- recommendation impact: **NO**
- position-sizing impact: **NO**
- production mutation: **NO**

**CURRENT STOP POINT:** The segment-growth curve proposal is validated as a methodology artifact. The next Gate G slice should define the next Pharma curve family as proposal-only, without activating any score execution.


---

## 77. Entry 072 — Gate G operating-margin curve proposal prepared

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

The second Gate G PHARMA_V1 normalization-curve proposal has been prepared.

### Proposal

`PHARMA_OPERATING_MARGIN_CURVE_V1_PROPOSAL`

Applies to:

- metric: `PHARMA_OPERATING_MARGIN_HISTORY`
- primary subprofile: **DOMESTIC_FORMULATIONS** only.

Other primary Pharma subprofiles fail closed until separate margin-level contracts are versioned.

### Evidence boundary

The parent Pharma research contract requires:

- minimum comparable quarters: **8**
- preferred comparable quarters: **12**
- latest completed period required;
- matched operating-revenue and operating-profit periods required;
- semantically incompatible periods excluded.

### Proposed composite

**Margin level — 50%**

Statistic: median of latest 8 compatible operating-margin quarters.

Domestic Formulations V1 bands:
- >=25% → 100
- >=20% and <25% → 85
- >=16% and <20% → 70
- >=12% and <16% → 55
- >=8% and <12% → 35
- <8% → 15

**Margin stability — 30%**

Statistic: interquartile range of latest 8 operating-margin quarters.

Bands:
- <2 pp → 100
- >=2 and <4 pp → 80
- >=4 and <6 pp → 60
- >=6 and <9 pp → 40
- >=9 pp → 20

**Margin trend — 20%**

Statistic: median(latest 4 quarters) minus median(prior 4 quarters).

Bands:
- >=+3 pp → 100
- >=+1 and <+3 pp → 80
- >=-1 and <+1 pp → 60
- >=-3 and <-1 pp → 40
- <-3 pp → 20

### Why subprofile-specific

The Pharma parent contract marks operating margin as `RANGE`, not a universal higher-is-better signal.

Therefore Domestic Formulations level bands must not silently become universal thresholds for Global Generics, API/Bulk Drugs, CDMO/CRAMS, Biopharma/Biosimilars or other Pharma primary models.

### Repository artifacts

Added:

- `src/features/research/pharmaOperatingMarginCurveProposal.ts`
- `src/features/research/pharmaOperatingMarginCurveProposal.test.ts`
- `docs/R4N_TORNTPHARM_Gate_G_Operating_Margin_Curve_Proposal_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

The Gate G glass-box now shows:

- **Second proposed curve family**
- **Margin curve fail-closed boundary**

### Activation boundary

- proposal prepared: **YES**
- activation approved: **NO**
- scoring adapter implementation: **NO**
- scoring-rule migration: **NO**
- score execution: **NO**
- persisted score run: **NO**
- recommendation impact: **NO**
- position-sizing impact: **NO**
- production mutation: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually review the new Operating Margin proposal cards in **Gate G · Scoring methodology design**, and then run focused local validation before this methodology artifact can be marked validated.


---

## 78. Entry 073 — Gate G operating-margin curve proposal validated

**Date:** 18 September 2026  
**Actor:** owner-run local validation  
**Branch:** `r4n-pharma-subprofile-architecture`

The owner completed focused local validation for the second PHARMA_V1 normalization-curve proposal.

### Validated curve proposal

`PHARMA_OPERATING_MARGIN_CURVE_V1_PROPOSAL`

Scope:

- metric: `PHARMA_OPERATING_MARGIN_HISTORY`
- primary subprofile: **DOMESTIC_FORMULATIONS** only.

Composite design:

- margin level: **50%**
- margin stability: **30%**
- margin trend: **20%**

History boundary:

- minimum comparable quarters: **8**
- preferred comparable quarters: **12**
- latest period required;
- matched operating-revenue and operating-profit periods required;
- incompatible periods excluded;
- unsupported primary Pharma subprofiles fail closed to **NO SCORE**.

### Owner-confirmed validation

- focused Vitest across:
  - `pharmaOperatingMarginCurveProposal.test.ts`
  - `pharmaSegmentGrowthCurveProposal.test.ts`
  - `pharmaGateGScoringMethodProposal.test.ts`
  → **PASS**
- focused ESLint for the Gate G methodology/curve slice → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**
- no new blocking build issue reported.

### Activation boundary remains unchanged

- operating-margin proposal validated: **YES**
- segment-growth proposal validated: **YES**
- curve activation approved: **NO**
- scoring adapter implementation: **NO**
- scoring-rule migration: **NO**
- score execution: **NO**
- persisted score run: **NO**
- recommendation impact: **NO**
- position-sizing impact: **NO**
- production mutation: **NO**

**CURRENT STOP POINT:** Two Gate G curve families are now validated as methodology artifacts. The next safe Gate G slice should define another core Pharma curve family as proposal-only, with score execution remaining disabled.


---

## 79. Entry 074 — Canonical PHARMA_V1 adaptive scoring/classification plan adopted

**Date:** 18 September 2026  
**Actor:** owner plan + ChatGPT adaptation  
**Branch:** `r4n-pharma-subprofile-architecture`

A new canonical alignment document has been added:

`docs/PORTFOLIOAI_PHARMA_V1_ADAPTIVE_SCORING_CLASSIFICATION_PLAN.md`

### Why this document is canonical

This document governs future PHARMA_V1 work for:

- business-model classification;
- Primary / Material Overlay / Emerging Watch layering;
- materiality thresholds;
- promotion/demotion rules;
- readiness behavior;
- overlay score mechanics;
- governance gate;
- regulatory-event materiality;
- curve-sharing vs subprofile-specific thresholds;
- Gate G sequencing.

### Alignment precedence

Future Pharma implementation should use this precedence:

1. adaptive scoring/classification plan;
2. versioned PHARMA_V1 parent/subprofile contracts;
3. validated Gate G curve proposals;
4. cumulative HANDOFF;
5. UI glass-box panels.

The UI must reflect the methodology; it must not redefine it.

### Preserved validated methodology

The plan preserves the two already-validated Gate G proposals:

- `PHARMA_SEGMENT_GROWTH_CURVE_V1_PROPOSAL`
- `PHARMA_OPERATING_MARGIN_CURVE_V1_PROPOSAL`

Both remain **VALIDATED / NOT ACTIVE**.

### Gate G sequence changed by owner architecture

Do **not** continue immediately to ROCE or additional curve families.

The next required sequence is:

- **G1 Classification Contract**
- **G2 Overlay Modifier Contract**
- **G3 Readiness Mapping Contract**
- **G4 Governance / Regulatory Gate Contract**

Only after G1–G4 are defined and validated should Gate G continue with additional normalization-curve families.

### Mandatory alignment safeguards

Future work must not:

- revert to one generic Pharma methodology;
- average independent Primary and Overlay stock scores;
- score Emerging Watch exposures;
- reuse Domestic Formulations thresholds automatically for other subprofiles;
- treat missing evidence as zero/neutral;
- silently blend contradictions;
- infer materiality without evidence;
- double-count governance/regulatory penalties;
- reclassify Primary from a single anomalous period;
- activate scoring/recommendation/position sizing without separate approval.

### Scope boundary

- canonical adaptive plan added: **YES**
- scoring activation: **NO**
- score run: **NO**
- production mutation: **NO**
- recommendation/position sizing: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Read the canonical adaptive scoring/classification plan before further PHARMA_V1 Gate G implementation. Next safe development task is G1 — version the classification/materiality contract. G2–G4 follow before any additional scoring curve family is added.


---

## 80. Entry 075 — Gate G1 adaptive Pharma classification contract prepared

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G1 has been implemented as a **proposal-only adaptive classification contract** under the canonical PHARMA_V1 adaptive scoring/classification architecture.

### New contract

`PHARMA_V1_ADAPTIVE_CLASSIFICATION_V1_PROPOSAL`

Repository artifacts:

- `src/features/research/pharmaAdaptiveClassificationContract.ts`
- `src/features/research/pharmaAdaptiveClassificationContract.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G1_Adaptive_Classification_Contract_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### Classification rules encoded

- Primary requires stable leadership across **2 consecutive annual periods**.
- Material Overlay requires at least **15%** of consolidated revenue or profit for **2 consecutive annual periods**.
- Emerging Watch begins at **5%**, or from separately reviewed evidence explicitly showing growth toward materiality.
- One year above 15% is not enough for Material Overlay; it remains Emerging Watch.
- Below 5% normally remains below scoring materiality, while independent governance/regulatory/risk events remain eligible for Interpretation.
- Revenue-share and profit-share evidence are preserved separately.
- Materiality basis is explicit: `REVENUE`, `PROFIT`, `BOTH`, or `NONE`.
- Provisional/disputed/unreviewed evidence cannot classify.
- Effective dating remains required for any eventual accepted assignment.

### Fail-closed rules encoded

Gate G1 returns `REVIEW_REQUIRED` or `INSUFFICIENT_EVIDENCE` instead of inferring a classification when:

- reviewed classification evidence is absent;
- fewer than two annual periods exist;
- annual periods are not consecutive;
- revenue and profit imply different Primary leaders;
- Primary leadership is unstable across the two required periods;
- a proposed Primary reassignment lacks separately confirmed structural-change evidence;
- usable revenue/profit materiality evidence is missing.

### Existing assignment architecture preserved

The existing effective-dated reviewed assignment model remains authoritative.

Gate G1 sits **above** it as a deterministic proposal layer. It does not write, replace, or silently mutate canonical assignments.

### UI review surface

Gate G now includes:

- **G1 · Adaptive classification contract**
- **G1 · Fail-closed classification boundary**

### Explicit boundary

- classification proposal: **YES**
- classification assignment write: **NO**
- schema migration: **NO**
- overlay modifier execution: **NO**
- score execution: **NO**
- persisted score run: **NO**
- recommendation / position sizing: **NO**
- production mutation: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the new G1 cards in TORNTPHARM → Research → Gate G, and run focused local validation. Only after G1 validation should development proceed to **G2 — Overlay Modifier Contract**.


---

## 81. Entry 076 — Gate G1 adaptive Pharma classification contract validated

**Date:** 18 September 2026  
**Actor:** owner visual review + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G1 has completed its required localhost visual and focused validation checkpoint.

### Owner visual review

TORNTPHARM → Research → Gate G was reviewed on localhost.

The two G1 glass-box cards are visible and aligned with the existing Gate G methodology surface:

- **G1 · Adaptive classification contract**
- **G1 · Fail-closed classification boundary**

The cards correctly preserve the proposal-only / fail-closed interpretation and do not imply score activation or assignment mutation.

### Focused validation

Owner-confirmed commands and results:

- focused Vitest across:
  - `pharmaAdaptiveClassificationContract.test.ts`
  - `pharmaGateGScoringMethodProposal.test.ts`
  - `pharmaSegmentGrowthCurveProposal.test.ts`
  - `pharmaOperatingMarginCurveProposal.test.ts`
  → **4 test files passed / 26 tests passed**

- focused ESLint across the G1 contract/test, Gate G methodology proposal, segment-growth proposal/test, operating-margin proposal/test, and `PharmaResearchWorkspacePanel.tsx`
  → **PASS**

- `npm run typecheck`
  → **PASS**

- `npm run build`
  → **PASS**

Build emitted only the existing non-blocking Vite large-chunk advisory; no build failure occurred.

### G1 status

- adaptive classification contract designed: **YES**
- owner visual review: **PASS**
- focused tests: **PASS**
- focused lint: **PASS**
- strict TypeScript: **PASS**
- production build: **PASS**
- G1 methodology status: **VALIDATED / NOT ACTIVE**

### Safety boundary remains unchanged

- canonical assignment write: **NO**
- schema migration: **NO**
- overlay modifier execution: **NO**
- score execution: **NO**
- persisted score run: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**
- paid-provider call: **NO**
- scheduler change: **NO**

**CURRENT STOP POINT:** G1 is now validated. The next permitted Gate G design task is **G2 — Overlay Modifier Contract**, still proposal-only and non-executable. Before implementing G2, inspect the canonical adaptive plan and current G1/Gate G contracts at the then-current branch head.


---

## 82. Entry 077 — Gate G2 Pharma overlay modifier contract prepared

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G2 has been implemented as a **proposal-only overlay modifier contract** under the canonical PHARMA_V1 adaptive scoring/classification architecture.

### New contract

`PHARMA_V1_OVERLAY_MODIFIER_V1_PROPOSAL`

Repository artifacts:

- `src/features/research/pharmaOverlayModifierContract.ts`
- `src/features/research/pharmaOverlayModifierContract.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G2_Overlay_Modifier_Contract_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### Overlay dimension eligibility

A Material Overlay may affect only dimensions touched by its **versioned PHARMA_V1 subprofile evidence contract**.

Eligibility is derived from subprofile additions and overrides instead of assuming every secondary business can modify every common dimension.

For the current `GLOBAL_GENERICS` overlay contract the derived eligible dimensions are:

- `GROWTH`
- `BUSINESS_DURABILITY`
- `RISK`

Dimensions outside the overlay evidence contract fail closed as:

`NOT_ELIGIBLE_DIMENSION`

### Required modifier inputs

Before a Material Overlay can even become eligible for a future numeric modifier, Gate G2 requires:

- reviewed economic materiality;
- evidence completeness;
- evidence confidence;
- normalized overlay signal;
- contradiction state.

Missing completeness/confidence/signal resolves to:

`PARTIAL_EVIDENCE`

Missing or incompatible materiality resolves to:

`REVIEW_REQUIRED`

Missing evidence is never converted to a neutral modifier.

### Contradiction handling

Unresolved contradictions return:

`REVIEW_REQUIRED`

Contradictory evidence is not silently averaged.

Only a contradiction explicitly resolved by a versioned methodology contract may continue toward a future modifier.

### Combined cap rule

All Material Overlays affecting the same dimension must eventually share **one combined per-dimension cap**.

Encoded boundaries:

- combined per-dimension cap required: **YES**
- independent overlay-cap stacking allowed: **NO**
- exact cap value: **UNAPPROVED / null**
- exact numeric modifier formula: **UNAPPROVED**
- numeric modifier output: **null**

No arbitrary ±10%, ±15%, or other cap has been invented.

### Emerging Watch remains non-scoring

`EMERGING_WATCH` always resolves to:

`EXCLUDED_EMERGING_WATCH`

for numeric modifier purposes.

It remains visible for Research interpretation/evidence collection only and does not participate in numeric modifier or score denominator logic.

### UI review surface

Gate G now includes:

- **G2 · Overlay modifier contract**
- **G2 · Combined-cap & contradiction boundary**

### Explicit boundary

- overlay architecture proposal: **YES**
- second stock score: **NO**
- Primary/Overlay score averaging: **NO**
- numeric modifier formula approved: **NO**
- exact combined cap approved: **NO**
- modifier execution: **NO**
- score execution: **NO**
- persisted score run: **NO**
- schema migration: **NO**
- recommendation / position sizing: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the new G2 cards in TORNTPHARM → Research → Gate G, then run focused G2 validation. Only after G2 validation should development proceed to **G3 — Readiness Mapping Contract**.


---

## 83. Entry 078 — Gate G2 Pharma overlay modifier contract validated

**Date:** 18 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G2 has completed its required localhost visual and focused validation checkpoint.

### Owner visual review

TORNTPHARM → Research → Gate G was reviewed on localhost.

The two G2 glass-box cards are visible and aligned with the existing Gate G methodology surface:

- **G2 · Overlay modifier contract**
- **G2 · Combined-cap & contradiction boundary**

The cards correctly preserve proposal-only behavior, one combined cap per dimension, unresolved-contradiction review, and Emerging Watch numeric exclusion.

### Focused validation

Owner-confirmed results:

- focused Vitest across:
  - `pharmaOverlayModifierContract.test.ts`
  - `pharmaAdaptiveClassificationContract.test.ts`
  - `pharmaGateGScoringMethodProposal.test.ts`
  - `pharmaSegmentGrowthCurveProposal.test.ts`
  - `pharmaOperatingMarginCurveProposal.test.ts`
  → **5 test files passed / 34 tests passed**

- focused ESLint across the G2 contract/test, G1 contract/test, Gate G methodology proposal, segment-growth proposal/test, operating-margin proposal/test, and `PharmaResearchWorkspacePanel.tsx`
  → **PASS**

- `npm run typecheck`
  → **PASS**

- `npm run build`
  → **PASS**

### G2 status

- overlay modifier architecture contract: **VALIDATED / NOT ACTIVE**
- eligible-dimension derivation: **VALIDATED**
- missing-evidence fail-closed behavior: **VALIDATED**
- unresolved-contradiction fail-closed behavior: **VALIDATED**
- Emerging Watch numeric exclusion: **VALIDATED**
- one combined per-dimension cap requirement: **VALIDATED**
- exact cap value: **UNAPPROVED**
- exact modifier formula: **UNAPPROVED**

### Safety boundary remains unchanged

- second stock score: **NO**
- Primary/Overlay score averaging: **NO**
- numeric modifier execution: **NO**
- score execution: **NO**
- persisted score run: **NO**
- schema migration: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**
- paid-provider call: **NO**
- scheduler change: **NO**

**CURRENT STOP POINT:** G2 is now validated. The next permitted Gate G design task is **G3 — Readiness Mapping Contract**, still proposal-only and non-executable. Before implementing G3, inspect the canonical adaptive plan and current G1/G2/Gate G contracts at the then-current branch head.


---

## 84. Entry 079 — Gate G3 Pharma readiness mapping contract prepared

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G3 has been implemented as a **proposal-only readiness mapping contract** under the canonical PHARMA_V1 adaptive scoring/classification architecture.

### New contract

`PHARMA_V1_READINESS_MAPPING_V1_PROPOSAL`

Repository artifacts:

- `src/features/research/pharmaReadinessMappingContract.ts`
- `src/features/research/pharmaReadinessMappingContract.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G3_Readiness_Mapping_Contract_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### Visible readiness states formalized

Gate G3 maps deterministic internal conditions to:

- `READY`
- `PARTIAL`
- `INSUFFICIENT_EVIDENCE`
- `PROFILE_PENDING`
- `BLOCKED_REVIEW`
- `NOT_APPLICABLE`

### Dimension readiness

The existing **60%** dimension score-ready coverage gate is preserved.

A dimension can become `READY` only when:

- it is applicable;
- Pharma profile resolution is complete;
- no review blocker exists;
- mandatory blocking conditions are satisfied;
- score-ready coverage is at least 60%;
- relevant Material Overlay evidence does not leave the dimension incomplete.

A non-applicable dimension is excluded from the denominator.

### Material Overlay readiness

Missing or incomplete Material Overlay evidence does not become neutral.

If an affected dimension otherwise has sufficient Primary/base evidence but the Material Overlay remains incomplete:

`PARTIAL`

and numeric score readiness remains false.

### Emerging Watch readiness boundary

Emerging Watch is excluded from readiness effects.

It cannot:

- improve readiness;
- reduce readiness;
- enter dimension denominator logic;
- enter overall score-ready denominator logic.

### Overall readiness

The existing **70%** overall score-ready coverage gate is preserved but is explicitly treated as necessary, not sufficient.

Overall PHARMA_V1 preview requires:

- resolved profile;
- common PHARMA_V1 core = `READY`;
- Primary subprofile = `READY`;
- every weighted dimension = `READY`;
- overall score-ready coverage >= 70%;
- no governance/review blocker.

Primary failure therefore remains company-level fail-closed regardless of aggregate coverage.

### Governance boundary preserved for G4

G3 accepts a governance/review blocker only as an input to fail readiness closed.

It does **not** define:

- critical governance-event classification;
- high-risk cap mechanics;
- regulatory materiality;
- remediation handling;
- anti-double-counting rules.

Those remain reserved for G4.

### UI review surface

Gate G now includes:

- **G3 · Readiness mapping contract**
- **G3 · Overall fail-closed readiness gate**

### Explicit boundary

- readiness architecture proposal: **YES**
- score preview execution: **NO**
- score execution: **NO**
- persisted score run: **NO**
- schema migration: **NO**
- recommendation / position sizing: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the new G3 cards in TORNTPHARM → Research → Gate G, then run focused G3 validation. Only after G3 validation should development proceed to **G4 — Governance / Regulatory Gate Contract**.


---

## 85. Entry 080 — Gate G3 Pharma readiness mapping contract validated

**Date:** 18 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G3 has completed its required localhost visual and focused validation checkpoint.

### Owner visual review

TORNTPHARM → Research → Gate G was reviewed on localhost.

The two G3 glass-box cards are visible and aligned with the existing Gate G methodology surface:

- **G3 · Readiness mapping contract**
- **G3 · Overall fail-closed readiness gate**

The cards correctly preserve the visible readiness vocabulary, the 60% dimension gate, the 70% overall gate, Emerging Watch exclusion, and the requirement that the common PHARMA_V1 core, Primary subprofile, and every weighted dimension be READY before overall preview readiness.

### Focused validation

Owner-confirmed results:

- focused Vitest across:
  - `pharmaReadinessMappingContract.test.ts`
  - `pharmaOverlayModifierContract.test.ts`
  - `pharmaAdaptiveClassificationContract.test.ts`
  - `pharmaGateGScoringMethodProposal.test.ts`
  - `pharmaSegmentGrowthCurveProposal.test.ts`
  - `pharmaOperatingMarginCurveProposal.test.ts`
  → **6 test files passed / 44 tests passed**

- focused ESLint across the G3 contract/test, G2 contract/test, G1 contract/test, Gate G methodology proposal, segment-growth proposal/test, operating-margin proposal/test, and `PharmaResearchWorkspacePanel.tsx`
  → **PASS**

- `npm run typecheck`
  → **PASS**

- `npm run build`
  → **PASS**

Build emitted only the existing non-blocking Vite large-chunk advisory; no build failure occurred.

### G3 status

- readiness mapping architecture contract: **VALIDATED / NOT ACTIVE**
- 60% dimension score-ready gate: **VALIDATED**
- 70% overall preview gate: **VALIDATED**
- every weighted dimension must be READY: **VALIDATED**
- common PHARMA_V1 core must be READY: **VALIDATED**
- Primary subprofile must be READY: **VALIDATED**
- incomplete Material Overlay may keep affected dimension PARTIAL: **VALIDATED**
- Emerging Watch readiness exclusion: **VALIDATED**
- NOT_APPLICABLE denominator exclusion: **VALIDATED**
- governance detailed mechanics: **DEFERRED TO G4**

### Safety boundary remains unchanged

- score preview execution: **NO**
- numeric score execution: **NO**
- persisted score run: **NO**
- schema migration: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**
- paid-provider call: **NO**
- scheduler change: **NO**

**CURRENT STOP POINT:** G3 is now validated. The next permitted Gate G design task is **G4 — Governance / Regulatory Gate Contract**, still proposal-only and non-executable. Before implementing G4, inspect the canonical adaptive plan and the current G1/G2/G3/Gate G contracts at the then-current branch head.


---

## 86. Entry 081 — Gate G4 Pharma governance / regulatory gate contract prepared

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G4 has been implemented as a **proposal-only governance / regulatory gate contract** under the canonical PHARMA_V1 adaptive scoring/classification architecture.

### New contract

`PHARMA_V1_GOVERNANCE_REGULATORY_GATE_V1_PROPOSAL`

Repository artifacts:

- `src/features/research/pharmaGovernanceRegulatoryGateContract.ts`
- `src/features/research/pharmaGovernanceRegulatoryGateContract.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G4_Governance_Regulatory_Gate_Contract_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### Governance blocking rules

Gate G4 now formalizes the pre-aggregation governance gate:

- explicit governance blocked-review state → `BLOCKED_REVIEW`
- reviewed critical governance event → `BLOCKED_REVIEW`
- reviewed high-risk governance event → `HIGH_RISK`

High risk remains:

- non-blocking by default;
- prominent in Interpretation;
- only eligible for a future separately versioned transparent constraint.

Exact high-risk cap value remains:

`null / UNAPPROVED`

### Regulatory materiality rules

A regulatory event cannot influence the gate until the affected facility/product/geography is established.

If regulatory economic materiality is unknown:

`REVIEW_REQUIRED`

PortfolioAI must not infer or invent exposure.

After scope and materiality are established:

- critical + known material → `BLOCKED_REVIEW`
- high + known material → `HIGH_RISK`

### Remediation handling

Remediation does not erase the historical regulatory event.

A closeout state is retained as separate evidence and requires subsequent outcome context before PortfolioAI treats the chain as resolved for gate interpretation.

Therefore:

`CLOSED_OUT` + missing subsequent outcome context → `REVIEW_REQUIRED`

Historical event retention remains explicit.

### Anti-double-counting

Ownership / Governance already remains a weighted PHARMA_V1 dimension.

Gate G4 therefore emits no hidden additional numeric governance/regulatory penalty.

Encoded boundaries:

- hidden double-counting allowed: **NO**
- additional numeric penalty enabled: **NO**
- high-risk cap value: **UNAPPROVED / null**
- score execution: **NO**

Any future high-risk cap must be separately versioned and transparent.

### Relationship to G3

G3 already consumes a governance/review blocker as a fail-closed readiness input.

G4 defines the upstream governance/regulatory gate states that may supply that blocker.

No scoring adapter is activated.

### UI review surface

Gate G now includes:

- **G4 · Governance / regulatory gate**
- **G4 · Materiality, remediation & anti-double-counting**

### Explicit boundary

- governance/regulatory architecture proposal: **YES**
- high-risk numeric cap approved: **NO**
- additional numeric penalty: **NO**
- score preview execution: **NO**
- numeric score execution: **NO**
- persisted score run: **NO**
- schema migration: **NO**
- regulatory event write: **NO**
- recommendation / position sizing: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the new G4 cards in TORNTPHARM → Research → Gate G, then run focused G4 validation. Only after G4 validation should Gate G proceed to **G5 — additional core scoring curves**.


---

## 87. Entry 082 — Gate G4 Pharma governance / regulatory gate contract validated

**Date:** 18 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G4 has completed its required localhost visual and focused validation checkpoint.

### Owner visual review

TORNTPHARM → Research → Gate G was reviewed on localhost.

The two G4 glass-box cards are visible and aligned with the existing Gate G methodology surface:

- **G4 · Governance / regulatory gate**
- **G4 · Materiality, remediation & anti-double-counting**

The cards correctly preserve critical blocking, non-blocking high-risk treatment, unknown regulatory materiality review, remediation history retention, and the anti-double-counting boundary.

### Focused validation

Owner-confirmed results:

- focused Vitest across:
  - `pharmaGovernanceRegulatoryGateContract.test.ts`
  - `pharmaReadinessMappingContract.test.ts`
  - `pharmaOverlayModifierContract.test.ts`
  - `pharmaAdaptiveClassificationContract.test.ts`
  - `pharmaGateGScoringMethodProposal.test.ts`
  - `pharmaSegmentGrowthCurveProposal.test.ts`
  - `pharmaOperatingMarginCurveProposal.test.ts`
  → **7 test files passed / 54 tests passed**

- focused ESLint across the G4 contract/test, G3 contract/test, G2 contract/test, G1 contract/test, Gate G methodology proposal, segment-growth proposal/test, operating-margin proposal/test, and `PharmaResearchWorkspacePanel.tsx`
  → **PASS**

- `npm run typecheck`
  → **PASS**

- `npm run build`
  → **PASS**

Build emitted only the existing non-blocking Vite large-chunk advisory; no build failure occurred.

### G4 status

- governance / regulatory gate architecture contract: **VALIDATED / NOT ACTIVE**
- critical governance blocking: **VALIDATED**
- high-risk non-blocking treatment: **VALIDATED**
- unknown regulatory materiality review boundary: **VALIDATED**
- no inferred exposure: **VALIDATED**
- remediation history retention: **VALIDATED**
- closeout requires subsequent outcome context: **VALIDATED**
- hidden double-counting prohibition: **VALIDATED**
- high-risk numeric cap: **UNAPPROVED**
- additional numeric penalty: **NO**

### G1–G4 architecture sequence

The adaptive architecture lock sequence is now complete:

- G1 Classification Contract: **VALIDATED / NOT ACTIVE**
- G2 Overlay Modifier Contract: **VALIDATED / NOT ACTIVE**
- G3 Readiness Mapping Contract: **VALIDATED / NOT ACTIVE**
- G4 Governance / Regulatory Gate Contract: **VALIDATED / NOT ACTIVE**

This completes the architecture prerequisites required before resuming additional core scoring-curve design.

### Safety boundary remains unchanged

- score preview execution: **NO**
- numeric score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- regulatory event write: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**
- paid-provider call: **NO**
- scheduler change: **NO**

**CURRENT STOP POINT:** G1–G4 are now validated. The next permitted Gate G task is **G5 — additional core scoring curves**, beginning with a fresh inspection of the canonical adaptive plan and existing validated curve proposals. Any new curve remains proposal-only / not active until separately validated.


---

## 88. Entry 083 — Gate G5.1 ROCE / Capital Efficiency framework prepared

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G5 has started with **G5.1 — ROCE / Capital Efficiency** as a proposal-only common parent curve framework.

### Canonical alignment check

Before implementation, the current `PORTFOLIOAI_PHARMA_V1_ADAPTIVE_SCORING_CLASSIFICATION_PLAN.md` was re-read from the active branch head.

The plan requires G5 to begin with:

- ROCE / Capital Efficiency;
- then Cash Conversion;
- Balance Sheet / Leverage;
- Valuation;
- Ownership / Governance;
- Risk;
- Momentum.

The plan also explicitly permits shared methodology shapes while requiring subprofile-specific thresholds where economics differ.

### Existing ROCE evidence contract preserved

Existing parent metric:

`PHARMA_ROCE_HISTORY`

Preserved requirements:

- minimum **3** comparable annual periods;
- preferred **5** comparable annual periods;
- latest annual period required;
- consistent calculation semantics required;
- single snapshot insufficient.

### Dimension alignment gap discovered and surfaced

The canonical adaptive architecture assigns ROCE to:

`CAPITAL_EFFICIENCY`

However, the older lower-level parent evidence contract still records:

`PHARMA_ROCE_HISTORY.dimension = QUALITY`

and the current lower-level `ResearchMetricContract` taxonomy does not yet expose `CAPITAL_EFFICIENCY`.

G5.1 does not silently reinterpret this.

The new proposal records:

- canonical dimension: `CAPITAL_EFFICIENCY`
- current parent-contract dimension: `QUALITY`
- alignment state: `REQUIRES_VERSIONED_PARENT_RECONCILIATION`

No score path is activated.

### ROCE methodology framework

New proposal:

`PHARMA_ROCE_CAPITAL_EFFICIENCY_CURVE_V1_PROPOSAL`

The candidate shared methodology shape is:

`Level + Stability + Trend`

But G5.1 deliberately leaves the following unapproved:

- component weights;
- level bands;
- stability bands;
- trend bands.

### Subprofile threshold boundary

No universal numeric ROCE thresholds are created.

All five canonical Pharma subprofiles currently have explicit null threshold slots:

- `DOMESTIC_FORMULATIONS`
- `GLOBAL_GENERICS`
- `API_BULK_DRUGS`
- `CDMO_CRAMS`
- `BIOPHARMA_BIOSIMILARS`

This preserves the canonical rule that shared methodology does not imply shared thresholds.

### Repository artifacts

Added:

- `src/features/research/pharmaRoceCurveProposal.ts`
- `src/features/research/pharmaRoceCurveProposal.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G5_1_ROCE_Capital_Efficiency_Framework_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### UI review surface

Gate G now includes:

- **G5.1 · ROCE / Capital Efficiency framework**
- **G5.1 · Dimension alignment & threshold boundary**

### Explicit boundary

- ROCE framework proposal: **YES**
- dimension reconciliation applied: **NO**
- universal ROCE numeric bands: **NO**
- subprofile ROCE thresholds approved: **NO**
- component weights approved: **NO**
- numeric curve ready: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the new G5.1 cards in TORNTPHARM → Research → Gate G, then run focused G5.1 validation. Do not proceed to the next G5 family until this checkpoint is validated and the dimension-alignment boundary is accepted.


---

## 89. Entry 084 — Gate G5.1 ROCE / Capital Efficiency framework validated

**Date:** 18 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G5.1 has completed its validation checkpoint as a **proposal-only ROCE / Capital Efficiency framework**.

### Validation

Owner-confirmed results:

- focused Vitest covering G5.1 ROCE plus the validated G1–G4 and existing Gate G curve proposals → **PASS**
- focused ESLint for the G5.1/G1–G4/Gate G methodology slice → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**

### G5.1 status

- ROCE / Capital Efficiency framework: **VALIDATED / NOT ACTIVE**
- minimum 3 / preferred 5 annual-history contract: **VALIDATED**
- latest annual period requirement: **VALIDATED**
- consistent calculation semantics requirement: **VALIDATED**
- candidate methodology shape `Level + Stability + Trend`: **VALIDATED AS FRAMEWORK ONLY**
- component weights: **UNAPPROVED**
- universal ROCE numeric bands: **NO**
- subprofile-specific ROCE thresholds: **UNAPPROVED**
- numeric ROCE curve ready: **NO**

### Dimension-alignment boundary remains open

The canonical PHARMA_V1 architecture assigns ROCE to:

`CAPITAL_EFFICIENCY`

while the older parent evidence contract still records:

`PHARMA_ROCE_HISTORY.dimension = QUALITY`

This mismatch remains intentionally unresolved.

G5.1 validation confirms that the mismatch is visible and fail-closed; it does **not** authorize a silent remap.

A separate versioned reconciliation is required before any active scoring path can treat ROCE as Capital Efficiency.

### Safety boundary remains unchanged

- parent dimension reconciliation applied: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** G5.1 is validated. The next permitted G5 parent curve family is **Cash Conversion**, but implementation must first inspect the existing `PHARMA_CASH_CONVERSION_HISTORY` evidence contract and reconcile any legacy-to-canonical dimension mismatch before defining methodology.


---

## 90. Entry 085 — Gate G5.2 Cash Conversion framework prepared

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G5 has continued with **G5.2 — Cash Conversion** as a proposal-only common parent curve framework.

### Existing Cash Conversion evidence contract preserved

Existing parent metric:

`PHARMA_CASH_CONVERSION_HISTORY`

Preserved requirements:

- minimum **3** comparable annual periods;
- preferred **5** comparable annual periods;
- latest annual period required;
- matched-period CFO, PAT and capex/FCF evidence required;
- CFO alone is insufficient;
- single snapshot insufficient.

### Dimension alignment gap surfaced

The canonical adaptive architecture assigns Cash Conversion to:

`CASH_FLOW`

However, the older lower-level parent evidence contract records:

`PHARMA_CASH_CONVERSION_HISTORY.dimension = EARNINGS_CASH_QUALITY`

and the current lower-level `ResearchMetricContract` taxonomy does not expose `CASH_FLOW`.

G5.2 records:

- canonical dimension: `CASH_FLOW`
- current parent-contract dimension: `EARNINGS_CASH_QUALITY`
- alignment state: `REQUIRES_VERSIONED_PARENT_RECONCILIATION`

No silent remapping is applied.

### Cash Conversion methodology framework

New proposal:

`PHARMA_CASH_CONVERSION_CURVE_V1_PROPOSAL`

Candidate shared framework:

- `CFO_TO_PAT_CONVERSION`
- `FCF_CONVERSION`
- `CONSISTENCY_AND_TREND`

The following remain unapproved:

- component weights;
- CFO/PAT bands;
- FCF-conversion bands;
- consistency/trend bands.

### Subprofile and capex-context boundary

No universal numeric Cash Conversion thresholds are created.

All five canonical Pharma subprofiles retain null threshold slots.

G5.2 additionally requires **capex-intensity context** before FCF conversion can be normalized, preventing investment-heavy models from being mechanically penalized and preventing CFO-only evidence from being over-rewarded.

### Repository artifacts

Added:

- `src/features/research/pharmaCashConversionCurveProposal.ts`
- `src/features/research/pharmaCashConversionCurveProposal.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G5_2_Cash_Conversion_Framework_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### UI review surface

Gate G now includes:

- **G5.2 · Cash Conversion framework**
- **G5.2 · Dimension alignment & capex-context boundary**

### Explicit boundary

- Cash Conversion framework proposal: **YES**
- dimension reconciliation applied: **NO**
- universal numeric Cash Conversion bands: **NO**
- subprofile thresholds approved: **NO**
- component weights approved: **NO**
- numeric curve ready: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the new G5.2 cards in TORNTPHARM → Research → Gate G, then run focused G5.2 validation. Do not proceed to Balance Sheet / Leverage until G5.2 is validated.


---

## 91. Entry 086 — Gate G5.2 Cash Conversion framework validated

**Date:** 18 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G5.2 has completed its validation checkpoint as a **proposal-only Cash Conversion framework**.

### Validation

Owner-confirmed results:

- focused Vitest covering G5.2 Cash Conversion plus G5.1, G1–G4, and existing Gate G curve proposals → **PASS**
- focused ESLint for the G5.2/G5.1/G1–G4/Gate G methodology slice → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**

### G5.2 status

- Cash Conversion framework: **VALIDATED / NOT ACTIVE**
- minimum 3 / preferred 5 annual-history contract: **VALIDATED**
- matched CFO, PAT and capex/FCF requirement: **VALIDATED**
- CFO alone insufficient: **VALIDATED**
- candidate framework `CFO_TO_PAT_CONVERSION + FCF_CONVERSION + CONSISTENCY_AND_TREND`: **VALIDATED AS FRAMEWORK ONLY**
- capex-intensity context requirement: **VALIDATED**
- component weights: **UNAPPROVED**
- universal Cash Conversion numeric bands: **NO**
- subprofile-specific thresholds: **UNAPPROVED**
- numeric Cash Conversion curve ready: **NO**

### Dimension-alignment boundary remains open

The canonical PHARMA_V1 architecture assigns Cash Conversion to:

`CASH_FLOW`

while the older parent evidence contract still records:

`PHARMA_CASH_CONVERSION_HISTORY.dimension = EARNINGS_CASH_QUALITY`

This mismatch remains intentionally unresolved.

G5.2 validation confirms that the mismatch is visible and fail-closed; it does **not** authorize a silent remap.

A separate versioned reconciliation is required before any active scoring path can treat this metric as canonical Cash Flow.

### Safety boundary remains unchanged

- parent dimension reconciliation applied: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** G5.2 is validated. The next permitted G5 parent curve family is **Balance Sheet / Leverage**, but implementation must first inspect `PHARMA_BALANCE_SHEET_LEVERAGE`, its evidence inputs, and the legacy-to-canonical dimension mapping before defining methodology.


---

## 92. Entry 087 — Gate G5.3 Balance Sheet / Leverage framework prepared

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G5 has continued with **G5.3 — Balance Sheet / Leverage** as a proposal-only common parent curve framework.

### Existing Balance Sheet / Leverage evidence contract preserved

Existing parent metric:

`PHARMA_BALANCE_SHEET_LEVERAGE`

Preserved requirements:

- minimum **3** comparable annual periods;
- preferred **5** comparable annual periods;
- latest balance-sheet period required;
- reviewed debt, cash and operating-earnings evidence with matched periods required;
- a point-in-time snapshot alone is insufficient for the proposed curve;
- lower leverage remains directionally better.

### Dimension alignment gap surfaced

The canonical adaptive architecture assigns this family to:

`BALANCE_SHEET_CREDIT`

However, the older lower-level parent evidence contract records:

`PHARMA_BALANCE_SHEET_LEVERAGE.dimension = FINANCIAL_STRENGTH`

and the current lower-level `ResearchMetricContract` taxonomy does not expose `BALANCE_SHEET_CREDIT`.

G5.3 records:

- canonical dimension: `BALANCE_SHEET_CREDIT`
- current parent-contract dimension: `FINANCIAL_STRENGTH`
- alignment state: `REQUIRES_VERSIONED_PARENT_RECONCILIATION`

No silent remapping is applied.

### Balance Sheet / Leverage methodology framework

New proposal:

`PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_V1_PROPOSAL`

Candidate shared framework:

- `NET_DEBT_LEVERAGE`
- `INTEREST_COVERAGE`
- `BALANCE_SHEET_TREND_AND_RESILIENCE`

The following remain unapproved:

- component weights;
- leverage bands;
- interest-cover bands;
- trend/resilience bands.

### Cash semantics and context boundary

G5.3 explicitly requires:

- reviewed cash/cash-equivalent definitions before cash offsets debt;
- explicit treatment of net-cash cases;
- no automatic best score merely because net debt is negative;
- acquisition/expansion context before leverage trend is interpreted.

No universal numeric leverage or interest-cover thresholds are created.

All five canonical Pharma subprofiles retain null threshold slots.

### Repository artifacts

Added:

- `src/features/research/pharmaBalanceSheetLeverageCurveProposal.ts`
- `src/features/research/pharmaBalanceSheetLeverageCurveProposal.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G5_3_Balance_Sheet_Leverage_Framework_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### UI review surface

Gate G now includes:

- **G5.3 · Balance Sheet / Leverage framework**
- **G5.3 · Dimension alignment & leverage-context boundary**

### Explicit boundary

- Balance Sheet / Leverage framework proposal: **YES**
- dimension reconciliation applied: **NO**
- universal leverage bands: **NO**
- universal interest-cover bands: **NO**
- subprofile thresholds approved: **NO**
- component weights approved: **NO**
- numeric curve ready: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the new G5.3 cards in TORNTPHARM → Research → Gate G, then run focused G5.3 validation. Do not proceed to Valuation until G5.3 is validated.


---

## 93. Entry 088 — Gate G5.3 Balance Sheet / Leverage framework validated

**Date:** 18 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G5.3 has completed its validation checkpoint as a **proposal-only Balance Sheet / Leverage framework**.

### Validation

Owner-confirmed results:

- focused Vitest covering G5.3 Balance Sheet / Leverage plus G5.2, G5.1, G1–G4, and existing Gate G curve proposals → **10 test files passed / 74 tests passed**
- focused ESLint for the G5.3/G5.2/G5.1/G1–G4/Gate G methodology slice → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**

Build emitted only the existing non-blocking Vite large-chunk advisory; no build failure occurred.

### G5.3 status

- Balance Sheet / Leverage framework: **VALIDATED / NOT ACTIVE**
- minimum 3 / preferred 5 annual-history contract: **VALIDATED**
- matched debt, cash and operating-earnings requirement: **VALIDATED**
- point-in-time-only evidence insufficient: **VALIDATED**
- candidate framework `NET_DEBT_LEVERAGE + INTEREST_COVERAGE + BALANCE_SHEET_TREND_AND_RESILIENCE`: **VALIDATED AS FRAMEWORK ONLY**
- reviewed cash semantics requirement: **VALIDATED**
- explicit net-cash treatment requirement: **VALIDATED**
- acquisition/expansion context requirement: **VALIDATED**
- component weights: **UNAPPROVED**
- universal leverage bands: **NO**
- universal interest-cover bands: **NO**
- subprofile-specific thresholds: **UNAPPROVED**
- numeric Balance Sheet / Leverage curve ready: **NO**

### Dimension-alignment boundary remains open

The canonical PHARMA_V1 architecture assigns this family to:

`BALANCE_SHEET_CREDIT`

while the older parent evidence contract still records:

`PHARMA_BALANCE_SHEET_LEVERAGE.dimension = FINANCIAL_STRENGTH`

This mismatch remains intentionally unresolved.

G5.3 validation confirms that the mismatch is visible and fail-closed; it does **not** authorize a silent remap.

A separate versioned reconciliation is required before any active scoring path can treat this family as canonical Balance Sheet / Credit.

### Safety boundary remains unchanged

- parent dimension reconciliation applied: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** G5.3 is validated. The next permitted G5 parent curve family is **Valuation**, but implementation must first inspect `PHARMA_VALUATION_CONTEXT`, its current evidence semantics, and whether the canonical `VALUATION` dimension already aligns without a taxonomy reconciliation.


---

## 94. Entry 089 — Gate G5.4 Valuation framework prepared

**Date:** 18 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G5 has continued with **G5.4 — Valuation** as a proposal-only common parent curve framework.

### Dimension alignment

Unlike G5.1–G5.3, the Valuation parent contract already aligns with the canonical Gate G dimension:

`PHARMA_VALUATION_CONTEXT.dimension = VALUATION`

Canonical dimension:

`VALUATION`

Alignment state:

`ALIGNED`

No dimension reconciliation layer is required.

### Existing Valuation evidence contract preserved

Existing parent metric:

`PHARMA_VALUATION_CONTEXT`

Preserved requirements:

- TTM / point-in-time / annual evidence;
- minimum **1** annual observation;
- preferred **5** annual observations for self-history context;
- current authoritative market price required;
- current reviewed earnings/cash evidence required;
- provider valuation labels are evidence only and cannot override price authority;
- normalization semantics remain `pe_ev_ebitda_fcf_yield_vs_history_and_peers`.

### Valuation methodology framework

New proposal:

`PHARMA_VALUATION_CONTEXT_CURVE_V1_PROPOSAL`

Candidate shared framework:

- `SELF_HISTORY_RELATIVE_VALUATION`
- `PEER_RELATIVE_VALUATION`
- `CASH_FLOW_CORROBORATION`

Supported evidence families:

- P/E
- EV/EBITDA
- FCF yield

Component weights remain unapproved.

### Absolute-band and peer-context boundary

No universal absolute Pharma valuation bands are created.

Encoded boundaries:

- universal absolute multiple bands: **NO**
- peer cohort must respect business model: **YES**
- subprofile threshold/context contracts: **UNAPPROVED**
- price-to-book included: **NO**
- negative/non-meaningful denominators require explicit handling: **YES**
- acquisition/one-off earnings normalization required: **YES**

The existing PHARMA_V1 profile exclusion of `PBV_ADJUSTED_PROVIDER` remains preserved.

### Repository artifacts

Added:

- `src/features/research/pharmaValuationCurveProposal.ts`
- `src/features/research/pharmaValuationCurveProposal.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G5_4_Valuation_Framework_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### UI review surface

Gate G now includes:

- **G5.4 · Valuation framework**
- **G5.4 · Price authority, peer-context & denominator boundary**

### Explicit boundary

- Valuation framework proposal: **YES**
- dimension reconciliation required: **NO**
- universal absolute valuation bands: **NO**
- component weights approved: **NO**
- subprofile threshold/context contracts approved: **NO**
- numeric valuation curve ready: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the new G5.4 cards in TORNTPHARM → Research → Gate G, then run focused G5.4 validation. Do not proceed to Ownership / Governance until G5.4 is validated.


---

## 95. Entry 090 — Gate G5.4 Valuation framework validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G5.4 has completed its validation checkpoint as a **proposal-only Valuation framework**.

### Validation

Owner-confirmed results:

- focused Vitest covering G5.4 Valuation plus G5.3, G5.2, G5.1, G1–G4, and existing Gate G curve proposals → **PASS**
- focused ESLint for the G5.4/G5.3/G5.2/G5.1/G1–G4/Gate G methodology slice → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**

### G5.4 status

- Valuation framework: **VALIDATED / NOT ACTIVE**
- canonical/current dimension alignment `VALUATION`: **VALIDATED / ALIGNED**
- authoritative market price requirement: **VALIDATED**
- reviewed earnings/cash input requirement: **VALIDATED**
- provider valuation labels cannot override price authority: **VALIDATED**
- candidate framework `SELF_HISTORY_RELATIVE_VALUATION + PEER_RELATIVE_VALUATION + CASH_FLOW_CORROBORATION`: **VALIDATED AS FRAMEWORK ONLY**
- supported evidence families P/E, EV/EBITDA, FCF yield: **VALIDATED**
- peer cohort must respect business model: **VALIDATED**
- P/BV excluded from Pharma valuation: **VALIDATED**
- negative/non-meaningful denominator handling requirement: **VALIDATED**
- acquisition/one-off earnings normalization requirement: **VALIDATED**
- component weights: **UNAPPROVED**
- universal absolute multiple bands: **NO**
- subprofile threshold/context contracts: **UNAPPROVED**
- numeric Valuation curve ready: **NO**

### Safety boundary remains unchanged

- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** G5.4 is validated. The next permitted G5 parent curve family is **Ownership / Governance**, but implementation must first inspect `PHARMA_OWNERSHIP_GOVERNANCE`, its ownership-history and governance-event semantics, and its relationship to the already validated G4 governance gate so hidden double-counting is not introduced.


---

## 96. Entry 091 — Gate G5.5 Ownership / Governance framework prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G5 has continued with **G5.5 — Ownership / Governance** as a proposal-only common parent curve framework.

### Existing evidence contract preserved

Existing parent metric:

`PHARMA_OWNERSHIP_GOVERNANCE`

Preserved requirements:

- minimum **4** comparable shareholding quarters;
- preferred **8** comparable quarters;
- latest completed shareholding quarter required;
- current material governance events required;
- promoter absence is not automatically negative.

Existing normalization semantics remain:

`ownership_trend_pledge_and_governance_event_overlay`

### Dimension alignment gap surfaced

Canonical adaptive architecture:

`OWNERSHIP_GOVERNANCE`

Older lower-level parent evidence contract:

`GOVERNANCE`

G5.5 records:

- canonical dimension: `OWNERSHIP_GOVERNANCE`
- current parent-contract dimension: `GOVERNANCE`
- alignment state: `REQUIRES_VERSIONED_PARENT_RECONCILIATION`

No silent remapping is applied.

### Ownership / Governance methodology framework

New proposal:

`PHARMA_OWNERSHIP_GOVERNANCE_CURVE_V1_PROPOSAL`

Candidate framework:

- `OWNERSHIP_STRUCTURE_AND_STABILITY`
- `PLEDGE_AND_CONTROL_RISK`
- `GOVERNANCE_EVENT_CONTEXT`

The following remain unapproved:

- component weights;
- ownership bands;
- pledge bands;
- event-context bands.

### G4 separation and anti-double-counting

G4 remains the sole owner of:

- critical governance blocking;
- high-risk gate treatment;
- any future separately versioned transparent governance cap.

G5.5 therefore prohibits:

- a second hidden penalty for a G4 critical/blocked event;
- a second hidden penalty for a G4 high-risk event;
- an additional gate cap embedded inside the weighted Ownership / Governance dimension.

Governance-event context may remain visible for explainability only.

### Mechanical ownership scoring prohibited

G5.5 explicitly rejects automatic assumptions that:

- higher promoter ownership is always better;
- promoter absence is automatically negative;
- zero promoter pledge automatically earns the best score;
- higher institutional ownership is automatically positive.

Ownership must be interpreted through stability, control structure, pledge history, dilution/concentration and reviewed governance events.

### Repository artifacts

Added:

- `src/features/research/pharmaOwnershipGovernanceCurveProposal.ts`
- `src/features/research/pharmaOwnershipGovernanceCurveProposal.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G5_5_Ownership_Governance_Framework_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### UI review surface

Gate G now includes:

- **G5.5 · Ownership / Governance framework**
- **G5.5 · G4 separation & anti-double-counting boundary**

### Explicit boundary

- Ownership / Governance framework proposal: **YES**
- dimension reconciliation applied: **NO**
- component weights approved: **NO**
- ownership numeric bands approved: **NO**
- pledge numeric bands approved: **NO**
- governance-event numeric bands approved: **NO**
- G4 second hidden penalty: **NO**
- hidden double-counting: **NO**
- numeric curve ready: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the new G5.5 cards in TORNTPHARM → Research → Gate G, then run focused G5.5 validation. Do not proceed to Risk until G5.5 is validated.


---

## 97. Entry 092 — Gate G5.5 Ownership / Governance framework validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G5.5 has completed its validation checkpoint as a **proposal-only Ownership / Governance framework**.

### Validation

Owner-confirmed results:

- focused Vitest covering G5.5 Ownership / Governance plus G5.4, G5.3, G5.2, G5.1, G1–G4, and existing Gate G curve proposals → **PASS**
- focused ESLint for the G5.5/G5.4/G5.3/G5.2/G5.1/G1–G4/Gate G methodology slice → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**

### G5.5 status

- Ownership / Governance framework: **VALIDATED / NOT ACTIVE**
- minimum 4 / preferred 8 shareholding-quarter history contract: **VALIDATED**
- latest shareholding quarter required: **VALIDATED**
- current material governance events required: **VALIDATED**
- promoter absence not automatically negative: **VALIDATED**
- candidate framework `OWNERSHIP_STRUCTURE_AND_STABILITY + PLEDGE_AND_CONTROL_RISK + GOVERNANCE_EVENT_CONTEXT`: **VALIDATED AS FRAMEWORK ONLY**
- mechanical promoter/institutional/pledge scoring prohibition: **VALIDATED**
- G4 event second hidden penalty: **NO**
- hidden double-counting: **NO**
- additional embedded governance cap inside dimension: **NO**
- component weights: **UNAPPROVED**
- ownership/pledge/event-context numeric bands: **UNAPPROVED**
- numeric Ownership / Governance curve ready: **NO**

### Dimension-alignment boundary remains open

The canonical PHARMA_V1 architecture assigns this family to:

`OWNERSHIP_GOVERNANCE`

while the older parent evidence contract still records:

`PHARMA_OWNERSHIP_GOVERNANCE.dimension = GOVERNANCE`

This mismatch remains intentionally unresolved.

G5.5 validation confirms that the mismatch is visible and fail-closed; it does **not** authorize a silent remap.

### Safety boundary remains unchanged

- parent dimension reconciliation applied: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** G5.5 is validated. The next permitted G5 parent curve family is **Risk**, but implementation must first inspect `PHARMA_REGULATORY_SITE_STATUS`, the broader PHARMA_V1 Risk evidence lanes, and the relationship to G4 so regulatory risk is not double-counted.


---

## 98. Entry 093 — Gate G5.6 Regulatory & Market Risk framework prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G5 has continued with **G5.6 — Regulatory & Market Risk** as a proposal-only common parent curve framework.

### Dimension alignment

Unlike several earlier G5 families, the parent regulatory-risk metric already aligns with canonical Gate G:

`PHARMA_REGULATORY_SITE_STATUS.dimension = RISK`

Canonical dimension:

`RISK`

Alignment state:

`ALIGNED`

No taxonomy reconciliation is required.

### Regulatory risk evidence preserved

Existing conditional parent metric:

`PHARMA_REGULATORY_SITE_STATUS`

Preserved requirements:

- applies when `REGULATED_EXPORT_EXPOSURE` exists;
- official regulator/issuer evidence required;
- current unresolved regulatory actions represented;
- latest material inspection/remediation state represented;
- site/product/geography scope discipline preserved;
- single-site closeout cannot imply company-wide regulatory clearance.

### Market-risk evidence incorporated as candidate inputs

The existing market-data foundation already stores deterministic derived evidence in:

`market_metric_observations`

from canonical daily OHLCV in:

`market_price_history`

Candidate Risk inputs:

- `MAX_DRAWDOWN_1Y`
- `VOLATILITY_1Y`

Existing definitions are preserved:

- drawdown = trailing-one-year maximum peak-to-trough daily-close decline;
- volatility = annualized sample standard deviation of daily log returns using `sqrt(252)`.

These derivations are already auditable and provider-independent.

However, reviewed numeric market-risk scoring rules currently belong to the BANK_NBFC pilot, not PHARMA_V1.

Therefore:

`PHARMA market-risk score rule state = UNAPPROVED`

No BANK/NBFC threshold or score rule is inherited.

### Risk methodology framework

New proposal:

`PHARMA_REGULATORY_MARKET_RISK_CURVE_V1_PROPOSAL`

Candidate framework:

- `REGULATORY_RISK_CONTEXT`
- `MARKET_DRAWDOWN`
- `MARKET_VOLATILITY_CONTEXT`

The following remain unapproved:

- component weights;
- regulatory-risk bands;
- drawdown bands;
- volatility bands.

Volatility requires approved Pharma peer/benchmark context before numeric normalization.

### G4 separation and anti-double-counting

G4 remains the owner of:

- critical regulatory/governance blocking;
- high-risk gate treatment;
- unknown regulatory materiality review;
- remediation gate interpretation;
- any future transparent governance/regulatory cap.

G5.6 therefore prohibits:

- a second hidden penalty for a G4 blocked/critical event;
- a second hidden penalty for a G4 high-risk event;
- an additional regulatory cap embedded inside the weighted Risk dimension.

Regulatory event context may remain visible for explainability only.

### Missing-evidence boundary

Missing regulatory or market-risk evidence cannot silently become neutral.

No numeric Pharma Risk score is available when required evidence or methodology remains incomplete.

### Repository artifacts

Added:

- `src/features/research/pharmaRiskCurveProposal.ts`
- `src/features/research/pharmaRiskCurveProposal.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G5_6_Regulatory_Market_Risk_Framework_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### UI review surface

Gate G now includes:

- **G5.6 · Regulatory & Market Risk framework**
- **G5.6 · G4 separation & market-rule boundary**

### Explicit boundary

- Risk framework proposal: **YES**
- dimension alignment: **ALIGNED**
- Pharma market-risk score rules reviewed: **NO**
- BANK/NBFC risk thresholds inherited: **NO**
- component weights approved: **NO**
- drawdown bands approved: **NO**
- volatility bands approved: **NO**
- regulatory bands approved: **NO**
- G4 second hidden penalty: **NO**
- numeric Risk curve ready: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the new G5.6 cards in TORNTPHARM → Research → Gate G, then run focused G5.6 validation. Do not proceed to Momentum until G5.6 is validated.


---

## 99. Entry 094 — Gate G5.6 Regulatory & Market Risk framework validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G5.6 has completed its validation checkpoint as a **proposal-only Regulatory & Market Risk framework**.

### Validation

Owner-confirmed results:

- focused Vitest covering G5.6 Risk plus G5.5, G5.4, G5.3, G5.2, G5.1, G1–G4, and existing Gate G curve proposals → **PASS**
- focused ESLint for the G5.6/G5.5/G5.4/G5.3/G5.2/G5.1/G1–G4/Gate G methodology slice → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**

### G5.6 status

- Regulatory & Market Risk framework: **VALIDATED / NOT ACTIVE**
- canonical/current dimension alignment `RISK`: **VALIDATED / ALIGNED**
- regulated-export conditionality: **VALIDATED**
- official regulatory evidence requirement: **VALIDATED**
- current unresolved-action + latest remediation-state requirement: **VALIDATED**
- single-site closeout cannot imply company-wide clearance: **VALIDATED**
- candidate market-risk inputs `MAX_DRAWDOWN_1Y` + `VOLATILITY_1Y`: **VALIDATED AS EVIDENCE LANES ONLY**
- market raw authority `market_price_history`: **VALIDATED**
- derived evidence store `market_metric_observations`: **VALIDATED**
- BANK/NBFC risk thresholds inherited into Pharma: **NO**
- Pharma market-risk score rule: **UNAPPROVED**
- volatility peer/benchmark context requirement: **VALIDATED**
- G4 blocked/critical event second hidden penalty: **NO**
- G4 high-risk event second hidden penalty: **NO**
- additional embedded regulatory cap inside Risk: **NO**
- component weights / regulatory bands / drawdown bands / volatility bands: **UNAPPROVED**
- numeric Risk curve ready: **NO**

### Safety boundary remains unchanged

- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** G5.6 is validated. The final permitted G5 parent curve family is **Momentum**, but implementation must first inspect the existing market-momentum evidence, current BANK_NBFC pilot rules, and confirm that no bank-specific threshold or benchmark assumption is inherited into PHARMA_V1.


---

## 100. Entry 095 — Gate G5.7 Momentum framework prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G5 has continued with its final parent family, **G5.7 — Momentum**, as a proposal-only framework.

### Canonical dimension and parent-contract gap

Canonical Gate G dimension:

`MOMENTUM`

Current dedicated PHARMA_V1 parent Momentum metric contract:

`NONE`

State:

`MISSING_DEDICATED_PHARMA_PARENT_CONTRACT`

The repository already contains deterministic market-momentum evidence, but `pharmaResearchProfile.ts` has no dedicated Pharma Momentum metric entry.

G5.7 therefore preserves the missing-parent-contract condition as a fail-closed prerequisite rather than silently inventing or activating one.

### Existing market evidence reused as candidate inputs

Candidate Momentum evidence already available in the market-data foundation:

- `PRICE_MOMENTUM_12M`
- `PRICE_MOMENTUM_6M`
- `RELATIVE_STRENGTH_12M`

Raw authority:

`market_price_history`

Derived evidence store:

`market_metric_observations`

Existing absolute-return derivation semantics are preserved:

- close-to-close return;
- calendar lookback target;
- first trading day on/after target;
- 14-day tolerance.

Relative-strength semantics remain:

`stock return - approved benchmark return`

### Momentum methodology framework

New proposal:

`PHARMA_MARKET_MOMENTUM_CURVE_V1_PROPOSAL`

Candidate framework:

- `ABSOLUTE_MOMENTUM_12M`
- `ABSOLUTE_MOMENTUM_6M`
- `BENCHMARK_RELATIVE_STRENGTH_12M`

The following remain unapproved:

- component weights;
- absolute-momentum bands;
- relative-strength bands.

### BANK_NBFC pilot separation

Existing BANK_NBFC reviewed rules are not inherited.

Explicitly prohibited:

- Bank 12M weight inheritance;
- Bank 6M weight inheritance;
- NIFTY Bank benchmark inheritance;
- Trendlyne technical Momentum score use.

Current Pharma benchmark state:

`PHARMA_BENCHMARK_UNAPPROVED`

Relative-strength scoring remains disabled until a Pharma benchmark contract is explicitly approved.

### Missing-evidence boundary

Missing relative-strength evidence cannot become neutral.

No denominator substitution or silent zero is allowed.

### G5 family coverage

All seven G5 core parent families now have proposal frameworks:

1. G5.1 ROCE / Capital Efficiency
2. G5.2 Cash Conversion
3. G5.3 Balance Sheet / Leverage
4. G5.4 Valuation
5. G5.5 Ownership / Governance
6. G5.6 Regulatory & Market Risk
7. G5.7 Momentum

This does not activate G5 scoring.

Outstanding prerequisites remain, including:

- legacy dimension reconciliation for G5.1/G5.2/G5.3/G5.5;
- missing dedicated Pharma Momentum parent metric contract;
- unapproved component weights and numeric bands;
- unapproved Pharma benchmark;
- G6 subprofile-specific thresholds.

### Repository artifacts

Added:

- `src/features/research/pharmaMomentumCurveProposal.ts`
- `src/features/research/pharmaMomentumCurveProposal.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G5_7_Momentum_Framework_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### UI review surface

Gate G now includes:

- **G5.7 · Momentum framework**
- **G5.7 · Parent-contract & benchmark boundary**

### Explicit boundary

- Momentum framework proposal: **YES**
- dedicated Pharma parent Momentum contract: **MISSING**
- Pharma benchmark approved: **NO**
- BANK/NBFC weights inherited: **NO**
- NIFTY Bank benchmark inherited: **NO**
- Trendlyne technical Momentum score used: **NO**
- component weights approved: **NO**
- numeric bands approved: **NO**
- numeric Momentum curve ready: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the new G5.7 cards in TORNTPHARM → Research → Gate G, then run focused G5.7 validation. Only after G5.7 validation should Gate G advance to **G6 — Subprofile-Specific Curves**.


---

## 101. Entry 096 — Gate G5 core parent curve families validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G5 has completed its final validation checkpoint. All seven core parent curve-family proposals are now **VALIDATED / NOT ACTIVE**.

### Final G5.7 validation

Owner-confirmed results:

- focused Vitest covering G5.7 Momentum plus G5.6, G5.5, G5.4, G5.3, G5.2, G5.1, G1–G4, and existing Gate G curve proposals → **PASS**
- focused ESLint for the complete G5/G1–G4/Gate G methodology slice → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**

### G5.7 Momentum status

- Momentum framework: **VALIDATED / NOT ACTIVE**
- canonical dimension `MOMENTUM`: **VALIDATED**
- dedicated PHARMA_V1 parent Momentum metric contract: **MISSING**
- parent contract required before activation: **YES**
- candidate inputs `PRICE_MOMENTUM_12M`, `PRICE_MOMENTUM_6M`, `RELATIVE_STRENGTH_12M`: **VALIDATED AS EVIDENCE LANES ONLY**
- raw authority `market_price_history`: **VALIDATED**
- derived evidence store `market_metric_observations`: **VALIDATED**
- BANK_NBFC 12M/6M weights inherited: **NO**
- NIFTY Bank benchmark inherited: **NO**
- Trendlyne technical Momentum score used: **NO**
- Pharma benchmark: **UNAPPROVED**
- component weights / absolute bands / relative-strength bands: **UNAPPROVED**
- numeric Momentum curve ready: **NO**

### Gate G5 family status

All seven core parent families are now validated as proposal frameworks:

1. G5.1 — ROCE / Capital Efficiency → **VALIDATED / NOT ACTIVE**
2. G5.2 — Cash Conversion → **VALIDATED / NOT ACTIVE**
3. G5.3 — Balance Sheet / Leverage → **VALIDATED / NOT ACTIVE**
4. G5.4 — Valuation → **VALIDATED / NOT ACTIVE**
5. G5.5 — Ownership / Governance → **VALIDATED / NOT ACTIVE**
6. G5.6 — Regulatory & Market Risk → **VALIDATED / NOT ACTIVE**
7. G5.7 — Momentum → **VALIDATED / NOT ACTIVE**

### Outstanding prerequisites before any numeric execution

The following remain intentionally unresolved:

- G5.1 parent taxonomy reconciliation:
  `QUALITY → CAPITAL_EFFICIENCY`
- G5.2 parent taxonomy reconciliation:
  `EARNINGS_CASH_QUALITY → CASH_FLOW`
- G5.3 parent taxonomy reconciliation:
  `FINANCIAL_STRENGTH → BALANCE_SHEET_CREDIT`
- G5.5 parent taxonomy reconciliation:
  `GOVERNANCE → OWNERSHIP_GOVERNANCE`
- dedicated PHARMA_V1 parent Momentum metric contract: **MISSING**
- Pharma benchmark contract: **UNAPPROVED**
- G5 numeric component weights: **UNAPPROVED**
- G5 numeric level/band thresholds: **UNAPPROVED**
- G6 subprofile-specific thresholds: **NOT YET DESIGNED**

### Safety boundary remains unchanged

- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Gate G5 is complete and validated as architecture only. The next permitted stage is **G6 — Subprofile-Specific Curves**. Before implementing G6, re-read the canonical adaptive scoring/classification plan and inspect the current Primary/Material/Emerging subprofile contracts so each threshold family is tied to the correct business model and no Domestic Formulations threshold is silently reused for other Pharma subprofiles.


---

## 102. Entry 097 — Gate G6.1 Subprofile Curve Applicability Lock prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6 has started with **G6.1 — Subprofile Curve Applicability Lock**.

### Canonical plan re-read

Before implementation, the current `PORTFOLIOAI_PHARMA_V1_ADAPTIVE_SCORING_CLASSIFICATION_PLAN.md` was re-read from the active branch head.

The plan requires G6 to complete missing thresholds for every Pharma primary model and explicitly prohibits automatic reuse of Domestic Formulations thresholds across other subprofiles.

### Subprofile contracts inspected

The current five canonical Primary contracts were inspected:

- `DOMESTIC_FORMULATIONS`
- `GLOBAL_GENERICS`
- `API_BULK_DRUGS`
- `CDMO_CRAMS`
- `BIOPHARMA_BIOSIMILARS`

Their mandatory evidence lanes materially differ, confirming that G6 must remain business-model-specific.

Examples:

- Domestic Formulations: Domestic Revenue Growth, Field Force Productivity, Brand/Therapy Leadership, Domestic Exposure Materiality Review
- Global Generics: Export/US Revenue Growth, Regulatory Site Status, Pipeline/Approval evidence, US Generic Price Erosion
- API/Bulk Drugs: Regulatory Site Status, Customer Concentration, Capacity Utilization, cycle-aware Valuation
- CDMO/CRAMS: Regulatory Site Status, Revenue Visibility, Client Concentration, Capacity Utilization
- Biopharma/Biosimilars: mandatory R&D/productivity, molecule/geography/stage pipeline evidence, Patent/Litigation Timeline

### Existing validated numeric proposals preserved

#### Segment Growth

`PHARMA_SEGMENT_GROWTH_CURVE_V1_PROPOSAL`

Permitted metric scope:

- Domestic Formulations → `PHARMA_DOMESTIC_REVENUE_GROWTH`
- Global Generics → `PHARMA_EXPORT_US_REVENUE_GROWTH`

No Segment Growth numeric curve is approved for API/Bulk Drugs, CDMO/CRAMS or Biopharma/Biosimilars.

#### Operating Margin

`PHARMA_OPERATING_MARGIN_CURVE_V1_PROPOSAL`

Permitted Primary scope:

- Domestic Formulations → **VALIDATED / NOT ACTIVE**
- all other Primary subprofiles → **UNSUPPORTED / FAIL CLOSED**

Domestic margin bands are not reusable outside Domestic Formulations.

### G5 parent-family status inside G6

For all five Primary subprofiles, the seven G5 parent families remain:

`SUBPROFILE_THRESHOLDS_REQUIRED`

for:

- ROCE / Capital Efficiency
- Cash Conversion
- Balance Sheet / Leverage
- Valuation
- Ownership / Governance
- Regulatory & Market Risk
- Momentum

G6.1 creates no new numeric bands.

### Layering boundary preserved

Primary:
- uses the applicable subprofile curve contract.

Material Overlay:
- may affect approved evidence inside relevant dimensions through G2;
- does not create a second independent stock score.

Emerging Watch:
- remains excluded from score readiness and numeric scoring;
- cannot create an independent stock score.

### TORNTPHARM

Current reviewed assignment remains:

- Primary: Domestic Formulations
- Material Overlay: Global Generics
- Emerging Watch: CDMO / CRAMS

Therefore Domestic Formulations remains the Primary curve driver. Global Generics may only act through approved overlay mechanics, while CDMO/CRAMS remains non-scoring while Emerging.

### Repository artifacts

Added:

- `src/features/research/pharmaG6SubprofileCurveApplicability.ts`
- `src/features/research/pharmaG6SubprofileCurveApplicability.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G6_1_Subprofile_Curve_Applicability_Lock_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### UI review surface

Gate G now includes:

- **G6.1 · Subprofile curve applicability lock**
- **G6.1 · Primary / Overlay / Emerging boundary**

### Explicit boundary

- applicability registry: **YES**
- new numeric thresholds: **NO**
- Domestic thresholds auto-reused: **NO**
- Material Overlay independent score: **NO**
- Emerging Watch numeric scoring: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the new G6.1 cards in TORNTPHARM → Research → Gate G, then run focused G6.1 validation. Only after this applicability lock is validated should G6 introduce the first new subprofile-specific numeric threshold family.


---

## 103. Entry 098 — Gate G6.1 Subprofile Curve Applicability Lock validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6.1 has completed validation as a **proposal-only subprofile curve applicability lock**.

### Validation

Owner-confirmed results:

- focused Vitest covering G6.1 plus all validated G5/G1–G4/Gate G proposal contracts → **PASS**
- focused ESLint for the G6.1/G5/G1–G4/Gate G methodology slice → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**

### G6.1 status

- five canonical Pharma Primary subprofiles covered: **VALIDATED**
- Domestic Formulations Segment Growth applicability: **VALIDATED / NOT ACTIVE**
- Global Generics Export/US Segment Growth applicability: **VALIDATED / NOT ACTIVE**
- Domestic Formulations Operating Margin scope: **VALIDATED / NOT ACTIVE**
- Operating Margin reuse outside Domestic Formulations: **PROHIBITED / FAIL CLOSED**
- Segment Growth reuse for API/Bulk Drugs, CDMO/CRAMS, Biopharma/Biosimilars: **PROHIBITED / FAIL CLOSED**
- all seven G5 parent families remain `SUBPROFILE_THRESHOLDS_REQUIRED`
- Domestic thresholds auto-reused for other primaries: **NO**
- Material Overlay independent stock score: **NO**
- Emerging Watch independent/numeric score: **NO**

### TORNTPHARM layering remains unchanged

- Primary: `DOMESTIC_FORMULATIONS`
- Material Overlay: `GLOBAL_GENERICS`
- Emerging Watch: `CDMO_CRAMS`

Primary remains the curve driver. Material Overlay remains within-dimension only under G2. Emerging Watch remains excluded from score readiness and numeric scoring.

### Safety boundary remains unchanged

- new numeric threshold family activated: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** G6.1 is validated. The next permitted G6 task is the first genuinely new subprofile-specific numeric threshold family. Before choosing and implementing it, inspect the validated G5 parent frameworks and the active Primary contract so the first threshold family is economically defensible and does not bypass unresolved parent-taxonomy prerequisites.


---

## 104. Entry 099 — Gate G6.2 Domestic Valuation Self-History curve prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6 has continued with the first genuinely new subprofile-specific numeric threshold family:

**G6.2 — Domestic Formulations Valuation Self-History**

### Why this family was selected first

Several G5 parent families still have unresolved taxonomy prerequisites:

- ROCE / Capital Efficiency
- Cash Conversion
- Balance Sheet / Leverage
- Ownership / Governance

Momentum still lacks a dedicated Pharma parent metric contract and approved Pharma benchmark.

Valuation already aligns directly with canonical `VALUATION`, so it is the safest G6 numeric family to extend without bypassing an unresolved parent-taxonomy prerequisite.

### Scope

Primary subprofile:

`DOMESTIC_FORMULATIONS`

Metric:

`PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT`

Subcomponent:

`SELF_HISTORY_RELATIVE_VALUATION`

This is a proposal-only subcomponent curve. It does not make the whole Valuation dimension score-ready.

### Domestic Formulations V1 self-history bands

Proposed score curve:

- implied upside >= 25% → 100
- >= 10% and <25% → 80
- >= -5% and <10% → 60
- >= -20% and <-5% → 40
- < -20% → 20

These bands use the company’s own five-year P/E history and deliberately avoid absolute Pharma P/E cutoffs.

### Evidence boundary

Required:

- current authoritative market price;
- current reviewed earnings base;
- preferred five-year self-history;
- stale price prohibited;
- provider valuation labels cannot override price authority.

G5.4 distorted-denominator handling remains in force.

### BANK_NBFC separation

The BANK_NBFC self-history implementation was inspected as an internal precedent for deterministic self-history evidence.

G6.2 does **not** inherit:

- the Bank/NBFC 60/25/15 Valuation dimension weighting;
- bank P/B logic;
- valuation-to-ROE logic;
- bank benchmark assumptions.

The Domestic Formulations curve is separately versioned.

### Incomplete-dimension boundary

G5.4 also requires:

- `PEER_RELATIVE_VALUATION`
- `CASH_FLOW_CORROBORATION`

Those components remain **UNAPPROVED**.

Therefore:

- whole Valuation dimension ready: **NO**
- peer-relative component approved: **NO**
- FCF corroboration approved: **NO**
- numeric score execution: **NO**

### Cross-subprofile boundary

This curve applies only to `DOMESTIC_FORMULATIONS`.

It must fail closed for:

- `GLOBAL_GENERICS`
- `API_BULK_DRUGS`
- `CDMO_CRAMS`
- `BIOPHARMA_BIOSIMILARS`

### Repository artifacts

Added:

- `src/features/research/pharmaDomesticValuationSelfHistoryCurveProposal.ts`
- `src/features/research/pharmaDomesticValuationSelfHistoryCurveProposal.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G6_2_Domestic_Valuation_Self_History_Curve_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### UI review surface

Gate G now includes:

- **G6.2 · Domestic valuation self-history curve**
- **G6.2 · Scope & incomplete-dimension boundary**

### Explicit boundary

- numeric self-history threshold family: **PROPOSED**
- whole Valuation dimension ready: **NO**
- absolute P/E bands used: **NO**
- BANK/NBFC dimension weights inherited: **NO**
- unsupported Pharma primaries receive Domestic thresholds: **NO**
- activation approved: **NO**
- score execution: **NO**
- persisted score run: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the new G6.2 cards in TORNTPHARM → Research → Gate G, then run focused G6.2 validation. Only after validation should the next Domestic Formulations G6 threshold slice be selected.


---

## 105. Entry 100 — Gate G6.2 Domestic Valuation Self-History curve validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6.2 has completed validation as a **proposal-only Domestic Formulations Valuation self-history curve**.

### Validation

Owner-confirmed results:

- focused Vitest covering G6.2 plus G6.1 and all validated G5/G1–G4/Gate G proposal contracts → **PASS**
- focused ESLint for the G6.2/G6.1/G5/G1–G4/Gate G methodology slice → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**

### G6.2 status

- supported Primary: `DOMESTIC_FORMULATIONS`
- metric: `PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT`
- self-history relative valuation bands: **VALIDATED / NOT ACTIVE**
- >=25% → 100
- >=10% and <25% → 80
- >=-5% and <10% → 60
- >=-20% and <-5% → 40
- <-20% → 20
- absolute P/E bands used: **NO**
- current authoritative market price required: **VALIDATED**
- current reviewed earnings required: **VALIDATED**
- stale price allowed: **NO**
- provider valuation label may override price authority: **NO**
- BANK_NBFC 60/25/15 Valuation weighting inherited: **NO**
- bank P/B or valuation-to-ROE logic inherited: **NO**
- peer-relative valuation component: **UNAPPROVED**
- FCF corroboration component: **UNAPPROVED**
- whole Valuation dimension ready: **NO**
- unsupported Pharma primaries receive Domestic bands: **NO / FAIL CLOSED**
- activation approved: **NO**
- score execution: **NO**

### Safety boundary remains unchanged

- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** G6.2 is validated. The next permitted G6 task is to select the next Domestic Formulations-specific threshold slice. Before implementation, inspect which G5 parent family is both canonically aligned and supported by sufficiently mature evidence so the next numeric curve does not bypass unresolved taxonomy, benchmark, or missing-parent-contract prerequisites.


---

## 106. Entry 101 — Gate G6.3 Domestic Valuation FCF identity lock prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6 has continued with **G6.3 — Domestic Valuation Cash-Flow Corroboration Evidence Identity Lock**.

### Why G6.3 is a blocker rather than a numeric curve

The intended next Valuation lane was FCF-yield corroboration.

Repository inspection confirmed:

- `PHARMA_VALUATION_CONTEXT` semantically includes FCF yield;
- G5.4 validates FCF yield as a supported Valuation evidence family;
- Pharma UI references `FCF_YIELD_PERCENT`;
- `pharmaScoringEvidence.ts` references `FCF_YIELD`;
- `pharmaResearchProfile.ts` does not bind `PHARMA_VALUATION_CONTEXT` to a concrete FCF-yield metric code;
- no current canonical metric definition was found reconciling those identifiers.

### Current state

`currentMetricIdentityState = AMBIGUOUS`

Observed concrete identifiers:

- `FCF_YIELD`
- `FCF_YIELD_PERCENT`

### Fail-closed requirement

Numeric FCF-yield thresholds are prohibited until a versioned canonical contract defines:

- canonical metric code;
- formula;
- canonical unit;
- FCF period/scope;
- price or market-cap authority;
- negative-FCF treatment;
- freshness semantics;
- alias reconciliation.

### Relationship to G6.2

G6.2 remains valid:

- Domestic Formulations P/E self-history curve: **VALIDATED / NOT ACTIVE**
- whole Valuation dimension ready: **NO**

G6.3 records the evidence-identity blocker for the Cash-Flow Corroboration lane.

### Repository artifacts

Added:

- `src/features/research/pharmaG6DomesticValuationFcfIdentity.ts`
- `src/features/research/pharmaG6DomesticValuationFcfIdentity.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G6_3_Domestic_Valuation_FCF_Identity_Lock_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### UI review surface

Gate G now includes:

- **G6.3 · FCF-yield evidence identity lock**
- **G6.3 · Numeric-threshold blocker**

### Explicit boundary

- FCF-yield concept inside Valuation: **VALID**
- concrete canonical metric identity: **AMBIGUOUS**
- numeric thresholds allowed: **NO**
- whole Valuation dimension ready: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the G6.3 blocker cards, then run focused G6.3 validation. Only after validation should the project either reconcile the FCF-yield metric identity or select another subprofile-specific family.


---

## 107. Entry 102 — Gate G6.4 canonical FCF-yield metric contract prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6 has continued with **G6.4 — PHARMA FCF Yield Canonical Metric Contract**.

### G6.3 blocker review

G6.3 confirmed an identity mismatch:

- Pharma UI: `FCF_YIELD_PERCENT`
- scoring evidence: `FCF_YIELD`

The parent Valuation contract references FCF yield semantically but does not name one concrete metric code.

### Canonical identity selected

G6.4 proposes:

`FCF_YIELD_PERCENT`

as the canonical PHARMA_V1 cash-flow-corroboration metric.

Legacy alias:

`FCF_YIELD`

Alias behavior:

- maps to the canonical percent identity;
- must not create a second independent observation;
- conflicting duplicates must not be averaged silently.

### Canonical formula

`(FREE_CASH_FLOW_ANNUAL / CURRENT_MARKET_CAP) * 100`

Calculation owner:

`PORTFOLIOAI`

Numerator:

- `FREE_CASH_FLOW_ANNUAL`
- existing reviewed formula: `CFO_ANNUAL - CAPEX_ANNUAL`
- latest completed annual period required;
- negative FCF preserved as negative evidence.

Denominator:

- concept: current market cap;
- must preserve current authoritative market-price semantics;
- stale market-cap evidence is prohibited;
- provider market-cap labels may not override price authority.

### What G6.4 does not authorize

- storage migration: **NO**
- historical observation rewrite: **NO**
- numeric FCF-yield score bands: **NO**
- Valuation component weights: **NO**
- whole Valuation dimension readiness: **NO**
- score execution: **NO**

### Repository artifacts

Added:

- `src/features/research/pharmaFcfYieldMetricContract.ts`
- `src/features/research/pharmaFcfYieldMetricContract.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G6_4_FCF_Yield_Canonical_Metric_Contract_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### UI review surface

Gate G now includes:

- **G6.4 · Canonical FCF-yield metric**
- **G6.4 · Formula & authority boundary**

### Explicit boundary

- canonical metric selected: **YES — FCF_YIELD_PERCENT**
- legacy alias retained: **YES — FCF_YIELD**
- canonical formula proposed: **YES**
- storage/alias migration approved: **NO**
- numeric thresholds approved: **NO**
- whole Valuation dimension ready: **NO**
- score execution: **NO**
- persisted score run: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, inspect the G6.4 cards, then run focused G6.3 + G6.4 validation. Only after validation should the project decide whether to define Domestic FCF-yield numeric bands or first implement the persisted alias reconciliation.


---

## 108. Entry 103 — Gate G6.3 + G6.4 FCF-yield identity contract validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6.3 and G6.4 have completed validation as **proposal-only evidence-identity / canonical-metric contracts**.

### Validation

Owner-confirmed results:

- focused Vitest covering G6.3 + G6.4 plus G6.2, G6.1 and all validated G5/G1–G4/Gate G proposal contracts → **PASS**
- focused ESLint for the same methodology slice → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**

### G6.3 status

- Domestic Valuation cash-flow corroboration concept: **VALIDATED**
- previously observed identifier ambiguity: **VALIDATED**
- `FCF_YIELD` vs `FCF_YIELD_PERCENT`: **EXPLICITLY SURFACED**
- numeric thresholds while identity ambiguous: **PROHIBITED**
- whole Valuation dimension ready: **NO**

### G6.4 status

Canonical metric identity:

`FCF_YIELD_PERCENT`

Legacy alias:

`FCF_YIELD`

Canonical unit:

`PERCENT`

Canonical formula:

`(FREE_CASH_FLOW_ANNUAL / CURRENT_MARKET_CAP) * 100`

Numerator authority:

- `FREE_CASH_FLOW_ANNUAL`
- existing reviewed formula `CFO_ANNUAL - CAPEX_ANNUAL`
- negative FCF remains negative evidence

Denominator authority:

- current market-cap concept must reflect authoritative current-price semantics
- stale market-cap evidence prohibited
- provider-only market-cap labels cannot override price authority

Alias behavior:

- legacy alias may map to the canonical percent code
- duplicate economic evidence must not be double-counted
- conflicting values must not be silently averaged

### Still not approved

- persisted alias/storage reconciliation: **NO**
- historical observation rewrite: **NO**
- numeric FCF-yield score bands: **NO**
- Valuation component weights: **NO**
- peer-relative Valuation component: **UNAPPROVED**
- whole Valuation dimension ready: **NO**
- score execution: **NO**

### Safety boundary remains unchanged

- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** G6.3 and G6.4 are validated. Before introducing Domestic FCF-yield numeric score bands, first inspect the actual persisted/local metric definitions and observations for `FCF_YIELD` / `FCF_YIELD_PERCENT` and determine whether alias reconciliation is needed in storage. Numeric thresholds must not be layered on top of duplicate or unresolved persisted identities.


---

## 109. Entry 104 — Gate G6.5 local FCF-yield alias preflight prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6 has continued with **G6.5 — Local FCF-Yield Persisted Alias Preflight**.

### Purpose

Before any persisted alias reconciliation or Domestic FCF-yield numeric score bands, the actual local Supabase state must be inspected for:

- `FCF_YIELD`
- `FCF_YIELD_PERCENT`

### Prepared read-only artifacts

Added:

- `scripts/r4n/g6-5-fcf-yield-alias-preflight.sql`
- `scripts/r4n/run-g6-5-fcf-yield-alias-preflight.sh`
- `docs/R4N_PHARMA_V1_Gate_G6_5_Local_FCF_Yield_Alias_Preflight.md`

### Safety

The runner:

- resolves `DB_URL` from local Supabase CLI state;
- refuses non-local hosts;
- allows only `127.0.0.1` or `localhost`;
- executes the SQL inside `BEGIN TRANSACTION READ ONLY`;
- ends with `ROLLBACK`;
- performs zero writes.

### Preflight outputs

The report inspects:

- TORNTPHARM security identity;
- both metric definitions;
- TORNTPHARM observations under both identifiers;
- exact alias duplicates;
- alias conflicts;
- global observation usage counts;
- final preflight classification.

Possible classifications include:

- `NO_PERSISTED_OBSERVATIONS`
- `LEGACY_ONLY_RECONCILIATION_REQUIRED`
- `CANONICAL_ONLY_NO_ALIAS_OBSERVATION_MIGRATION_NEEDED`
- `RECONCILIATION_REQUIRED_EXACT_DUPLICATES`
- `BLOCKED_ALIAS_CONFLICT`
- `REVIEW_REQUIRED`

### Explicit boundary

- preflight prepared: **YES**
- local execution performed by ChatGPT: **NO**
- write authorized: **NO**
- persisted alias reconciliation: **NO**
- numeric FCF-yield score bands: **NO**
- production mutation: **NO**
- deployment: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, then run `bash scripts/r4n/run-g6-5-fcf-yield-alias-preflight.sh` from the repository root and share the output. Do not run any write/migration step until the read-only result is reviewed.


---

## 110. Entry 105 — Gate G6.5 local FCF-yield alias preflight completed

**Date:** 19 September 2026  
**Actor:** owner local execution + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6.5 read-only local preflight has completed.

### Execution safety

Owner executed:

`bash scripts/r4n/run-g6-5-fcf-yield-alias-preflight.sh`

Confirmed output:

- local-only guard: **PASS**
- transaction mode: **READ ONLY**
- final transaction action: **ROLLBACK**
- writes performed: **0**
- write authorization: **NO**

### Local persisted state

TORNTPHARM identity:

- symbol: `TORNTPHARM`
- exchange: `NSE`
- active security row: **1**

Metric definitions:

- `FCF_YIELD`: **0 rows**
- `FCF_YIELD_PERCENT`: **0 rows**
- definition state: `NO_FCF_YIELD_DEFINITIONS`

TORNTPHARM observations:

- `FCF_YIELD`: **0**
- `FCF_YIELD_PERCENT`: **0**
- observation state: `NO_PERSISTED_FCF_YIELD_OBSERVATIONS`

Alias comparison:

- exact duplicate pairs: **0**
- conflicting pairs: **0**

Global usage across all securities:

- `FCF_YIELD`: **0 observations**
- `FCF_YIELD_PERCENT`: **0 observations**

Final preflight state:

`NO_PERSISTED_OBSERVATIONS`

### Architectural conclusion

No persisted alias reconciliation or historical observation migration is required.

The prior mismatch was a code/contract identity inconsistency only:

- UI referenced `FCF_YIELD_PERCENT`
- scoring evidence referenced `FCF_YIELD`
- no persisted definition or observation existed under either code

Therefore the next safe step is to introduce one canonical repository metric definition/derivation for:

`FCF_YIELD_PERCENT`

under the validated G6.4 formula/authority contract.

### Explicit boundary

- alias observation migration required: **NO**
- duplicate cleanup required: **NO**
- conflicting observation remediation required: **NO**
- canonical metric definition currently persisted locally: **NO**
- numeric FCF-yield bands approved: **NO**
- local mutation authorized: **NO**
- production mutation authorized: **NO**
- score execution: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** G6.5 preflight is complete. The next permitted task is a repository-only proposal for canonical `FCF_YIELD_PERCENT` metric registration/derivation. Do not execute any local or production migration without a separate approval checkpoint.


---

## 111. Entry 106 — Gate G6.6 canonical FCF-yield registration & derivation proposal prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6 has continued with **G6.6 — Canonical FCF_YIELD_PERCENT Registration & Derivation Proposal**.

### G6.5 prerequisite confirmed

The completed local read-only G6.5 preflight established:

- `FCF_YIELD` definition rows: **0**
- `FCF_YIELD_PERCENT` definition rows: **0**
- TORNTPHARM observations under either identity: **0**
- global observations under either identity: **0**
- alias duplicate pairs: **0**
- alias conflict pairs: **0**

Therefore no persisted alias migration or cleanup is required before a canonical definition can be proposed.

### Canonical definition proposal

Canonical metric:

`FCF_YIELD_PERCENT`

Proposed registration semantics:

- value kind: `NUMERIC`
- canonical unit: `PERCENT`
- statement scope: `VALUATION`
- calculation owner: `PORTFOLIOAI`
- freshness: 86400 seconds
- mapping version: `PHARMA_FCF_YIELD_PERCENT_V1`

Legacy alias:

`FCF_YIELD`

The alias is compatibility-only and must never create a second Valuation component.

### Deterministic derivation proposal

Formula:

`(FREE_CASH_FLOW_ANNUAL / CURRENT_MARKET_CAP) * 100`

Numerator:

- `FREE_CASH_FLOW_ANNUAL`
- reviewed parent formula `CFO_ANNUAL - CAPEX_ANNUAL`

Derivation behavior:

- finite positive market cap required;
- zero/negative/non-finite market cap fails closed;
- negative free cash flow remains negative yield;
- no clamping to zero/neutral.

### Evidence adapter reconciliation

`pharmaScoringEvidence.ts` now treats Valuation cash-flow corroboration as one alias group:

- canonical: `FCF_YIELD_PERCENT`
- legacy fallback: `FCF_YIELD`

If both identifiers are present, they still count as one Valuation evidence component.

This changes evidence identity handling only; it does not execute a numeric Pharma score.

### SQL proposal safety

Added:

`docs/sql/R4N_PHARMA_FCF_YIELD_PERCENT_V1_REGISTRATION_PROPOSAL.sql`

The SQL is intentionally outside `supabase/migrations/`.

It:

- begins a transaction;
- checks prerequisites and alias conflicts;
- proposes one canonical metric definition;
- verifies postconditions;
- deliberately ends with `ROLLBACK`.

It is not an executable migration checkpoint.

### Repository artifacts

Added:

- `src/features/research/pharmaFcfYieldDerivationProposal.ts`
- `src/features/research/pharmaFcfYieldDerivationProposal.test.ts`
- `docs/sql/R4N_PHARMA_FCF_YIELD_PERCENT_V1_REGISTRATION_PROPOSAL.sql`
- `docs/R4N_PHARMA_V1_Gate_G6_6_FCF_Yield_Registration_Derivation_Proposal_V1.md`

Updated:

- `src/features/research/pharmaScoringEvidence.ts`
- `src/features/research/pharmaScoringEvidence.test.ts`
- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### UI review surface

Gate G now includes:

- **G6.6 · Canonical FCF-yield registration proposal**
- **G6.6 · Deterministic derivation & alias-safe evidence**

### Explicit boundary

- canonical repository definition proposed: **YES**
- deterministic derivation proposed: **YES**
- evidence adapter canonicalized: **YES**
- local DB mutation: **NO**
- production DB mutation: **NO**
- observations created: **NO**
- numeric FCF-yield score bands: **NO**
- whole Valuation dimension ready: **NO**
- score execution: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the G6.6 cards in TORNTPHARM → Research → Gate G, then run focused G6.6 validation. No local or production SQL should be executed from the proposal artifact without a separate approval checkpoint.


---

## 112. Entry 107 — Gate G6.6 canonical FCF-yield registration & derivation proposal validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6.6 has completed validation as a **proposal-only canonical FCF-yield registration and derivation contract**.

### Validation

Owner-confirmed results:

- focused Vitest covering G6.6 plus G6.4/G6.3/G6.2/G6.1 and all validated G5/G1–G4/Gate G proposal contracts → **PASS**
- focused ESLint for the same methodology slice → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**

### Canonical metric state

Canonical code:

`FCF_YIELD_PERCENT`

Canonical unit:

`PERCENT`

Statement scope:

`VALUATION`

Calculation owner:

`PORTFOLIOAI`

Legacy alias:

`FCF_YIELD`

Alias behavior:

- compatibility fallback only;
- may not create a second Valuation evidence component;
- canonical and legacy identities together still count once.

### Deterministic derivation state

Canonical formula:

`(FREE_CASH_FLOW_ANNUAL / CURRENT_MARKET_CAP) * 100`

Numerator:

- `FREE_CASH_FLOW_ANNUAL`
- reviewed parent formula `CFO_ANNUAL - CAPEX_ANNUAL`

Fail-closed behavior:

- non-finite FCF → no derived value;
- zero/negative/non-finite market cap → no derived value;
- negative FCF → preserved as negative FCF yield;
- no clamping to zero or neutral.

### Evidence adapter state

`pharmaScoringEvidence.ts` now recognizes the Valuation cash-flow corroboration component through the alias group:

- `FCF_YIELD_PERCENT`
- `FCF_YIELD`

This identity reconciliation changes evidence counting only.

It does **not** activate numeric Pharma scoring.

### SQL proposal status

Repository proposal:

`docs/sql/R4N_PHARMA_FCF_YIELD_PERCENT_V1_REGISTRATION_PROPOSAL.sql`

Safety state:

- stored outside `supabase/migrations/`: **YES**
- transaction wrapped: **YES**
- preflight guards: **YES**
- postcondition guards: **YES**
- deliberate `ROLLBACK`: **YES**
- executed locally: **NO**
- executed in production: **NO**

### G6.6 status

- canonical metric registration proposal: **VALIDATED / NOT APPLIED**
- deterministic derivation proposal: **VALIDATED / NOT ACTIVE**
- evidence alias handling: **VALIDATED**
- local metric definition persisted: **NO**
- production metric definition persisted: **NO**
- FCF-yield observations created: **NO**
- numeric FCF-yield score bands: **UNAPPROVED**
- whole Valuation dimension ready: **NO**
- score execution: **NO**

### Safety boundary remains unchanged

- local DB mutation: **NO**
- production DB mutation: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** G6.6 is validated. The next permitted task is to choose between (A) a local rollback-only execution proof of the G6.6 SQL proposal, or (B) designing the Domestic Formulations FCF-yield numeric threshold proposal while keeping persistence unapplied. The safer sequence is to prove the SQL proposal locally first, then design numeric bands only after the canonical definition has passed that local dry-run checkpoint.


---

## 113. Entry 108 — Gate G6.7 local rollback-only FCF-yield registration proof prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6 has continued with **G6.7 — Local Rollback-Only Execution Proof** for the canonical FCF-yield registration proposal.

### Purpose

G6.7 is designed to prove that:

`docs/sql/R4N_PHARMA_FCF_YIELD_PERCENT_V1_REGISTRATION_PROPOSAL.sql`

is compatible with the current local Supabase schema while leaving no persisted metric-definition state behind.

### Prepared artifacts

Added:

- `scripts/r4n/run-g6-7-fcf-yield-registration-rollback-proof.sh`
- `docs/R4N_PHARMA_V1_Gate_G6_7_FCF_Yield_Local_Rollback_Proof.md`

### Safety behavior

The runner:

- resolves the database URL from local Supabase CLI state;
- refuses non-local database URLs;
- permits only localhost / 127.0.0.1;
- captures counts for `FCF_YIELD` and `FCF_YIELD_PERCENT` before execution;
- executes the exact G6.6 SQL proposal;
- relies on the proposal's deliberate `ROLLBACK`;
- captures counts again after rollback;
- fails if persisted definition counts changed.

### Expected current baseline

From G6.5:

- `FCF_YIELD` definitions: **0**
- `FCF_YIELD_PERCENT` definitions: **0**

Expected clean G6.7 result:

- proposal preflight: **PASS**
- proposal postconditions inside transaction: **PASS**
- rollback: **PASS**
- persisted `FCF_YIELD` definitions after run: **0**
- persisted `FCF_YIELD_PERCENT` definitions after run: **0**
- write authorization: **NO**

### Explicit boundary

- rollback-only proof prepared: **YES**
- executed by ChatGPT: **NO**
- persistent local metric registration: **NO**
- production metric registration: **NO**
- observation creation: **NO**
- numeric FCF-yield bands: **NO**
- score execution: **NO**
- deployment: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, then run `bash scripts/r4n/run-g6-7-fcf-yield-registration-rollback-proof.sh` from the repository root and share the complete terminal output. Do not execute any persistent migration or production action.


---

## 114. Entry 109 — Gate G6.7 local rollback-only FCF-yield registration proof completed

**Date:** 19 September 2026  
**Actor:** owner local execution + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6.7 local rollback-only proof has completed successfully.

### Owner execution

Executed:

`bash scripts/r4n/run-g6-7-fcf-yield-registration-rollback-proof.sh`

### Safety result

- local-only guard: **PASS**
- pre-execution `FCF_YIELD` definition count: **0**
- pre-execution `FCF_YIELD_PERCENT` definition count: **0**
- proposal transaction started: **YES**
- proposal preflight block: **PASS**
- proposal insert inside transaction: **PASS**
- proposal postcondition block: **PASS**
- deliberate `ROLLBACK`: **PASS**
- post-rollback `FCF_YIELD` definition count: **0**
- post-rollback `FCF_YIELD_PERCENT` definition count: **0**
- persisted definition state changed: **NO**
- write authorization: **NO**

### Architectural conclusion

The canonical registration proposal:

`docs/sql/R4N_PHARMA_FCF_YIELD_PERCENT_V1_REGISTRATION_PROPOSAL.sql`

is locally schema-compatible and satisfies its own preflight/postcondition guards.

It still has **not** been persisted as a local migration and has **not** been applied to production.

### Explicit boundary

- rollback proof: **PASS**
- canonical SQL proposal locally executable: **YES**
- local persistent registration: **NO**
- production persistent registration: **NO**
- observations created: **NO**
- numeric FCF-yield score bands: **NO**
- whole Valuation dimension ready: **NO**
- score execution: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** G6.7 is complete. The next permitted G6 task is to design the Domestic Formulations FCF-yield numeric threshold proposal, using the now-validated canonical metric identity and derivation contract, while keeping all persistence and score execution disabled.


---

## 115. Entry 110 — Gate G6.8 Domestic Formulations FCF-yield corroboration curve prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6 has continued with **G6.8 — Domestic Formulations FCF-Yield Corroboration Curve**.

### Prerequisites completed

Before G6.8:

- G6.4 canonical FCF-yield metric identity validated;
- G6.5 local persisted-alias preflight completed with no definitions/observations;
- G6.6 canonical registration + deterministic derivation proposal validated;
- G6.7 rollback-only local schema execution proof passed.

Therefore the FCF-yield identity and formula are sufficiently stable for a proposal-only numeric corroboration curve.

### Scope

Primary:

`DOMESTIC_FORMULATIONS`

Dimension:

`VALUATION`

Component:

`CASH_FLOW_CORROBORATION`

Metric:

`FCF_YIELD_PERCENT`

### Proposed V1 bands

- >= 5.0% → 100
- >= 3.0% and <5.0% → 80
- >= 1.5% and <3.0% → 60
- >= 0% and <1.5% → 40
- <0% → 20

### Economic interpretation

Approximate inverse FCF-multiple context:

- 5% yield ≈ 20x annual FCF
- 3% yield ≈ 33.3x annual FCF
- 1.5% yield ≈ 66.7x annual FCF

The curve is deliberately broad and acts only as cash-flow corroboration.

It is **not** an intrinsic valuation model or standalone cheap/expensive verdict.

### Negative FCF handling

Negative FCF remains adverse evidence.

It is not clamped to zero, treated as missing, or neutralized.

### Incomplete Valuation boundary

After G6.8:

- Domestic self-history subcurve: **PROPOSED / VALIDATED EARLIER**
- Domestic FCF-yield corroboration subcurve: **PROPOSED**
- peer-relative Valuation component: **UNAPPROVED**
- component weights: **UNAPPROVED**
- whole Valuation dimension ready: **NO**

### Cross-subprofile boundary

The G6.8 bands apply only to Domestic Formulations.

They must fail closed for:

- Global Generics
- API/Bulk Drugs
- CDMO/CRAMS
- Biopharma/Biosimilars

### Repository artifacts

Added:

- `src/features/research/pharmaDomesticFcfYieldCurveProposal.ts`
- `src/features/research/pharmaDomesticFcfYieldCurveProposal.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G6_8_Domestic_FCF_Yield_Curve_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### UI review surface

Gate G now includes:

- **G6.8 · Domestic FCF-yield corroboration curve**
- **G6.8 · Corroboration-only boundary**

### Explicit boundary

- numeric FCF-yield bands proposed: **YES**
- standalone Valuation verdict: **NO**
- component weights approved: **NO**
- peer-relative Valuation approved: **NO**
- whole Valuation dimension ready: **NO**
- persistent FCF-yield registration: **NO**
- score execution: **NO**
- persisted score run: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the G6.8 cards in TORNTPHARM → Research → Gate G, then run focused G6.8 validation. Only after validation should the next Domestic Formulations-specific G6 slice be selected.


---

## 116. Entry 111 — Gate G6.8 Domestic Formulations FCF-yield corroboration curve validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6.8 has completed validation as a **proposal-only Domestic Formulations FCF-yield corroboration curve**.

### Validation

Owner-confirmed results:

- focused Vitest covering G6.8 plus G6.6/G6.4/G6.3/G6.2/G6.1 and all validated G5/G1–G4/Gate G proposal contracts → **PASS**
- focused ESLint for the same methodology slice → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**

### G6.8 status

Supported Primary:

`DOMESTIC_FORMULATIONS`

Dimension:

`VALUATION`

Component:

`CASH_FLOW_CORROBORATION`

Metric:

`FCF_YIELD_PERCENT`

Validated proposal bands:

- >=5.0% → 100
- >=3.0% and <5.0% → 80
- >=1.5% and <3.0% → 60
- >=0% and <1.5% → 40
- <0% → 20

### Interpretation boundary

The curve is corroboration-only.

It does not:

- create a standalone cheap/expensive verdict;
- replace self-history valuation;
- replace peer-relative valuation;
- activate the 12% Valuation dimension by itself.

Negative FCF remains adverse evidence and is not neutralized.

### Remaining Valuation prerequisites

- self-history subcurve: **VALIDATED / NOT ACTIVE**
- FCF-yield corroboration subcurve: **VALIDATED / NOT ACTIVE**
- peer-relative Valuation component: **UNAPPROVED**
- component weights: **UNAPPROVED**
- whole Valuation dimension ready: **NO**

### Cross-subprofile boundary

The G6.8 bands remain Domestic Formulations only.

They must not automatically apply to:

- Global Generics
- API/Bulk Drugs
- CDMO/CRAMS
- Biopharma/Biosimilars

### Safety boundary remains unchanged

- persistent FCF-yield registration: **NO**
- local DB mutation: **NO**
- production DB mutation: **NO**
- score execution: **NO**
- persisted score run: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** G6.8 is validated. The next permitted G6 task is to select the next subprofile-specific threshold slice. For Domestic Formulations Valuation, the remaining missing lane is peer-relative valuation; alternatively, G6 may move to another aligned family if peer-cohort methodology is not yet mature enough.


---

## 117. Entry 112 — Gate G6.9 Domestic peer-relative valuation cohort methodology lock prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6 has continued with **G6.9 — Domestic Formulations Peer-Relative Valuation Cohort Methodology Lock**.

### Repository inspection result

The remaining Domestic Formulations Valuation lane is:

`PEER_RELATIVE_VALUATION`

Repository inspection found no existing versioned peer-cohort builder, approved minimum cohort size, approved peer aggregation statistic, approved outlier policy or numeric peer-relative score curve.

G5.4 only establishes the high-level rule that the peer cohort must respect the Pharma business model.

Therefore G6.9 deliberately does not invent numeric peer bands.

### Scope

Primary:

`DOMESTIC_FORMULATIONS`

Dimension:

`VALUATION`

Component:

`PEER_RELATIVE_VALUATION`

### Cohort eligibility lock

Required:

- reviewed Primary subprofile;
- same Primary subprofile `DOMESTIC_FORMULATIONS`;
- effective-dated assignment;
- active security.

Not sufficient:

- Pharma sector match alone;
- industry match alone;
- Material Overlay match alone;
- provider-defined peer lists.

Emerging Watch cannot define peer eligibility.

### Comparability lock

Peer observations require:

- same metric semantics;
- same period basis;
- current authoritative market-price semantics;
- non-stale valuation evidence;
- explicit exclusion/treatment of negative or non-meaningful denominators;
- acquisition/one-off normalization where material.

### Candidate peer evidence families

Candidate only:

- `PE_TTM`
- `EV_EBITDA`

The final metric set remains unapproved.

### Explicitly unresolved

- approved peer metric set: **NO**
- minimum eligible peer count: **NO**
- aggregation statistic: **NO**
- outlier treatment: **NO**
- relative premium/discount bands: **NO**
- PE vs EV/EBITDA weighting: **NO**
- Valuation component weights: **NO**
- cohort builder implementation: **NO**
- numeric peer curve ready: **NO**
- whole Valuation dimension ready: **NO**

### Relationship to existing Domestic Valuation work

Validated / not active:

- G6.2 self-history relative valuation
- G6.8 FCF-yield cash-flow corroboration

Still incomplete:

- peer-relative valuation methodology

### Repository artifacts

Added:

- `src/features/research/pharmaDomesticPeerValuationContract.ts`
- `src/features/research/pharmaDomesticPeerValuationContract.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G6_9_Domestic_Peer_Valuation_Cohort_Lock_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### UI review surface

Gate G now includes:

- **G6.9 · Domestic peer-cohort methodology lock**
- **G6.9 · Peer-relative numeric blocker**

### Safety boundary remains unchanged

- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the G6.9 cards in TORNTPHARM → Research → Gate G, then run focused G6.9 validation. Only after validation should the project define the peer-cohort implementation/minimum-comparability contract or move to another G6 family.


---

## 118. Entry 113 — Gate G6.9 Domestic peer-relative valuation cohort methodology lock validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6.9 has completed validation as a **proposal-only Domestic Formulations peer-relative valuation cohort methodology lock**.

### Validation

Owner-confirmed results:

- focused Vitest covering G6.9 plus the active Domestic Valuation/G6 methodology slice → **PASS**
- focused ESLint for the same slice → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**

### G6.9 status

Supported Primary:

`DOMESTIC_FORMULATIONS`

Dimension:

`VALUATION`

Component:

`PEER_RELATIVE_VALUATION`

Validated cohort rules:

- reviewed Primary subprofile required;
- same Primary subprofile `DOMESTIC_FORMULATIONS` required;
- effective-dated active assignment required;
- active security required;
- Pharma sector/industry membership alone is insufficient;
- Material Overlay membership alone is insufficient;
- Emerging Watch cannot define peer eligibility;
- provider peer labels are not authoritative.

### Comparability rules validated

Peer valuation evidence must preserve:

- same metric semantics;
- same period basis;
- current authoritative market-price semantics;
- non-stale valuation evidence;
- explicit treatment/exclusion of negative or non-meaningful denominators;
- acquisition/one-off normalization where material.

### Candidate evidence families

Candidate only:

- `PE_TTM`
- `EV_EBITDA`

Still unapproved:

- final peer metric set;
- minimum peer count;
- cohort aggregation statistic;
- outlier treatment;
- premium/discount normalization bands;
- PE vs EV/EBITDA weighting;
- Valuation component weights.

### Domestic Valuation state

Validated / not active:

- G6.2 — self-history relative valuation
- G6.8 — FCF-yield cash-flow corroboration
- G6.9 — peer-cohort methodology lock

Still incomplete:

- peer-cohort builder implementation
- minimum-comparability contract
- peer-relative numeric curve
- Valuation component weights

Therefore:

`whole Valuation dimension ready = NO`

### Safety boundary remains unchanged

- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** G6.9 is validated. The next safe G6 task is to define the peer-cohort implementation/minimum-comparability contract for Domestic Formulations, unless a different aligned G6 family is chosen first.


---

## 119. Entry 114 — Gate G6.10 Domestic peer-cohort builder prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6 has continued with **G6.10 — Domestic Formulations Peer-Cohort Builder & Minimum-Comparability Boundary**.

### Purpose

G6.9 locked the methodology prerequisites for peer-relative Valuation.

G6.10 now implements the deterministic **peer eligibility builder** without inventing a minimum peer count or numeric peer score.

### Cohort algorithm

A candidate security is eligible only when:

- it is not the target security;
- it is active;
- its PHARMA_V1 assignment resolves successfully on the evaluation date;
- the active assignment is reviewed;
- Primary is exactly `DOMESTIC_FORMULATIONS`.

The implementation reuses the existing fail-closed assignment resolver.

### Deterministic exclusions

Explicit exclusion reasons:

- `TARGET_SECURITY`
- `INACTIVE_SECURITY`
- `SUBPROFILE_UNRESOLVED`
- `PRIMARY_MISMATCH`

Provider peer labels, broad Pharma sector membership, Material Overlay and Emerging Watch do not override Primary eligibility.

### Minimum-comparability boundary

No numeric minimum peer count was invented.

Current state:

- minimum peer count: **UNAPPROVED**
- minimum comparable evidence per peer: **UNAPPROVED**
- aggregation statistic: **UNAPPROVED**
- outlier treatment: **UNAPPROVED**
- premium/discount curve: **UNAPPROVED**

Therefore:

- cohort builder implemented: **YES / PROPOSAL ONLY**
- cohort score-ready: **NO**
- numeric peer curve: **NO**
- whole Valuation dimension ready: **NO**

### Repository artifacts

Added:

- `src/features/research/pharmaDomesticPeerCohortBuilder.ts`
- `src/features/research/pharmaDomesticPeerCohortBuilder.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G6_10_Domestic_Peer_Cohort_Builder_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### UI review surface

Gate G now includes:

- **G6.10 · Domestic peer-cohort builder**
- **G6.10 · Minimum-comparability boundary**

### Safety boundary remains unchanged

- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the G6.10 cards in TORNTPHARM → Research → Gate G, then run focused G6.10 validation. Only after validation should a separate contract decide minimum peer count / comparable-evidence requirements / aggregation statistics.


---

## 120. Entry 115 — Gate G6.10 Domestic peer-cohort builder validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6.10 has completed validation as a **proposal-only deterministic Domestic Formulations peer-cohort builder**.

### Validation

Owner-confirmed results:

- focused Vitest covering G6.10 plus G6.9 and the active Domestic Valuation methodology slice → **PASS**
- focused ESLint for the same slice → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**

### G6.10 status

The deterministic peer builder is validated to admit only candidates that:

- are not the target security;
- are active securities;
- have a PHARMA_V1 assignment that resolves successfully on the evaluation date;
- have an active reviewed assignment;
- have Primary exactly `DOMESTIC_FORMULATIONS`.

### Validated exclusion reasons

- `TARGET_SECURITY`
- `INACTIVE_SECURITY`
- `SUBPROFILE_UNRESOLVED`
- `PRIMARY_MISMATCH`

The builder reuses the existing fail-closed subprofile assignment resolver.

### Still unapproved

- minimum eligible peer count: **NO**
- minimum comparable valuation evidence per peer: **NO**
- aggregation statistic: **NO**
- outlier treatment: **NO**
- premium/discount normalization bands: **NO**
- PE vs EV/EBITDA weighting: **NO**
- numeric peer-relative score: **NO**
- whole Valuation dimension ready: **NO**

### Domestic Valuation state

Validated / not active:

- G6.2 — self-history relative valuation
- G6.8 — FCF-yield cash-flow corroboration
- G6.9 — peer-cohort methodology lock
- G6.10 — deterministic peer eligibility builder

Remaining before peer-relative numeric scoring:

- minimum peer-count contract
- comparable-evidence contract
- aggregation/outlier contract
- relative premium/discount curve
- Valuation component weights

### Safety boundary remains unchanged

- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** G6.10 is validated. The next permitted G6 task is to define the minimum peer-count / comparable-evidence / aggregation-statistic contract for Domestic Formulations peer-relative Valuation, while keeping numeric peer scoring disabled until that methodology is explicitly approved.


---

## 121. Entry 116 — Gate G6.11 Domestic peer minimum-comparability contract prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6 has continued with **G6.11 — Domestic Formulations Peer Minimum-Comparability & Aggregation Contract**.

### Purpose

G6.10 implemented deterministic peer eligibility.

G6.11 now proposes the minimum cohort/comparability requirements and aggregation statistic needed before any numeric peer-relative curve can exist.

### Proposed cohort size

- minimum eligible comparable peers: **3**
- preferred eligible comparable peers: **5**

Fewer than three comparable peers for a metric family resolves to:

`INSUFFICIENT_EVIDENCE`

Broad-sector substitutes remain prohibited.

### Aggregation

Proposed statistic:

`MEDIAN`

Outlier policy:

`NO_WINSORIZATION_V1_MEDIAN_ONLY`

Rationale:

- deterministic;
- robust to one unusually high/low multiple;
- avoids introducing an arbitrary winsorization percentile;
- remains simple to explain and audit.

### Candidate peer metrics

- `PE_TTM`
- `EV_EBITDA`

Each metric family is aggregated independently.

The full peer-relative component requires both metric families to satisfy minimum comparability.

One metric family alone does not make the component complete.

### Comparability requirements

Required:

- same metric code within aggregation;
- same period basis;
- same consolidation scope;
- fresh evidence;
- selected/reviewed evidence;
- explicit exclusion of negative or economically meaningless denominators;
- acquisition/one-off distortions require review.

### Still unapproved

- PE versus EV/EBITDA weighting: **NO**
- premium/discount calculation convention: **NO**
- premium/discount score bands: **NO**
- peer-relative numeric score: **NO**
- whole Valuation dimension ready: **NO**

### Repository artifacts

Added:

- `src/features/research/pharmaDomesticPeerComparabilityContract.ts`
- `src/features/research/pharmaDomesticPeerComparabilityContract.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G6_11_Domestic_Peer_Comparability_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### UI review surface

Gate G now includes:

- **G6.11 · Peer minimum-comparability contract**
- **G6.11 · Median aggregation boundary**

### Safety boundary remains unchanged

- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the G6.11 cards in TORNTPHARM → Research → Gate G, then run focused G6.11 validation. Only after validation should G6 define the peer premium/discount calculation and numeric normalization curve.


---

## 122. Entry 117 — Gate G6.11 Domestic peer minimum-comparability contract validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6.11 has completed validation as a **proposal-only Domestic Formulations peer minimum-comparability and aggregation contract**.

### Validation

Owner-confirmed results:

- focused Vitest covering G6.11 plus G6.10/G6.9 and the active Domestic Valuation methodology slice → **PASS**
- focused ESLint for the same slice → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**

### G6.11 validated methodology

Minimum eligible comparable peers:

`3`

Preferred eligible comparable peers:

`5`

Aggregation statistic:

`MEDIAN`

Outlier treatment:

`NO_WINSORIZATION_V1_MEDIAN_ONLY`

### Comparability requirements

Validated requirements include:

- same metric code within aggregation;
- same period basis;
- same consolidation scope;
- fresh evidence;
- selected/reviewed evidence;
- negative or economically meaningless denominators excluded;
- acquisition/one-off distortions require review.

### Candidate peer metric families

- `PE_TTM`
- `EV_EBITDA`

Each metric family is aggregated independently.

The full peer-relative component requires both metric families to satisfy the minimum comparability contract.

One qualifying metric family alone is not sufficient.

### Still unapproved

- PE versus EV/EBITDA weighting: **NO**
- premium/discount calculation convention: **NO**
- premium/discount score bands: **NO**
- peer-relative numeric score: **NO**
- overall Valuation component weights: **NO**
- whole Valuation dimension ready: **NO**

### Domestic Valuation state

Validated / not active:

- G6.2 — self-history relative valuation
- G6.8 — FCF-yield cash-flow corroboration
- G6.9 — peer-cohort methodology lock
- G6.10 — deterministic peer eligibility builder
- G6.11 — minimum-comparability and median aggregation contract

Remaining before peer-relative numeric scoring:

- premium/discount calculation convention
- peer-relative numeric normalization curve
- PE vs EV/EBITDA weighting
- overall Valuation component weights

### Safety boundary remains unchanged

- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** G6.11 is validated. The next permitted G6 task is to define the peer premium/discount calculation convention and numeric normalization proposal for Domestic Formulations, while keeping score execution disabled.


---

## 123. Entry 118 — Gate G6.12 Domestic peer premium/discount normalization prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6 has continued with **G6.12 — Domestic Formulations Peer Premium/Discount & Numeric Normalization Proposal**.

### G6.11 post-validation type-safety fix

After G6.11 validation, strict TypeScript identified possible undefined indexed access inside the `median()` helper.

The helper was corrected with explicit guarded access.

Owner reran:

- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**

No methodology or median output changed.

### G6.12 calculation convention

For each peer valuation family:

`(PEER_MEDIAN_MULTIPLE / TARGET_MULTIPLE - 1) * 100`

Sign convention:

- positive → target discount to peer median;
- zero → at peer median;
- negative → target premium to peer median.

Applies independently to:

- `PE_TTM`
- `EV_EBITDA`

### Fail-closed requirements

Target and peer median multiples must both be:

- finite;
- positive;
- economically meaningful under G6.11.

Invalid/non-positive multiples do not produce a relative valuation observation.

### Proposed per-metric normalization bands

- >= +25% → 100
- >= +10% and < +25% → 80
- >= -5% and < +10% → 60
- >= -20% and < -5% → 40
- < -20% → 20

These match the broad relative-value percentage ladder used by the Domestic self-history curve while preserving separate evidence lanes.

### Still unapproved

- simple PE/EV averaging: **NO**
- PE vs EV/EBITDA weighting: **NO**
- combined peer-component score: **NO**
- self-history vs peer vs FCF component weights: **NO**
- whole Valuation dimension ready: **NO**

### Repository artifacts

Added:

- `src/features/research/pharmaDomesticPeerPremiumDiscountProposal.ts`
- `src/features/research/pharmaDomesticPeerPremiumDiscountProposal.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G6_12_Domestic_Peer_Premium_Discount_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### UI review surface

Gate G now includes:

- **G6.12 · Peer premium/discount normalization**
- **G6.12 · Cross-metric combination boundary**

### Safety boundary remains unchanged

- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the G6.12 cards in TORNTPHARM → Research → Gate G, then run focused G6.12 validation. Only after validation should G6 define the PE-vs-EV/EBITDA combination rule and then the overall Domestic Valuation component weights.


---

## 124. Entry 119 — Gate G6.12 Domestic peer premium/discount normalization validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6.12 has completed validation as a **proposal-only Domestic Formulations peer premium/discount calculation and per-metric normalization contract**.

### Validation

Owner-confirmed results after correcting two test-only boundary expectations:

- focused Vitest covering G6.12 plus G6.11/G6.10/G6.9 and the active Domestic Valuation methodology slice → **PASS**
- focused ESLint for the same slice → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**

### Test corrections recorded

Two test assertions were corrected without changing implementation or methodology:

1. floating-point result `-19.999999999999996` for the mathematical `-20%` case now uses a close comparison;
2. exact inclusive band edges now match the approved ranges:
   - `-5%` → 60
   - `-20%` → 40
   - only values `< -20%` → 20

### G6.12 validated calculation convention

For each comparable peer multiple:

`(PEER_MEDIAN_MULTIPLE / TARGET_MULTIPLE - 1) * 100`

Sign convention:

- positive → target discount to peer median
- zero → at peer median
- negative → target premium to peer median

Validated independently for:

- `PE_TTM`
- `EV_EBITDA`

### Validated per-metric normalization bands

- >= +25% → 100
- >= +10% and < +25% → 80
- >= -5% and < +10% → 60
- >= -20% and < -5% → 40
- < -20% → 20

### Fail-closed denominator behavior

Target and peer median multiples must both be:

- finite;
- positive;
- economically meaningful under the G6.11 comparability contract.

Invalid or non-positive multiples produce no relative valuation observation.

### Still unapproved

- PE vs EV/EBITDA combination rule: **NO**
- PE vs EV/EBITDA weighting: **NO**
- combined peer-component score: **NO**
- self-history vs peer vs FCF Valuation weights: **NO**
- whole Valuation dimension ready: **NO**

### Domestic Valuation state

Validated / not active:

- G6.2 — self-history relative valuation
- G6.8 — FCF-yield cash-flow corroboration
- G6.9 — peer-cohort methodology lock
- G6.10 — deterministic peer eligibility builder
- G6.11 — minimum-comparability and median aggregation
- G6.12 — peer premium/discount calculation and per-metric normalization

Remaining before a complete Domestic Valuation methodology:

- PE vs EV/EBITDA combination rule
- peer-component score contract
- self-history / peer-relative / FCF component weights
- final Valuation readiness closure

### Safety boundary remains unchanged

- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** G6.12 is validated. The next permitted G6 task is to define the PE-vs-EV/EBITDA combination rule for the Domestic peer-relative component, while keeping the overall Valuation dimension inactive.


### Final post-fix validation confirmation

After the two G6.12 test-only assertion corrections, the owner reran the remaining validation stages:

- focused ESLint for the G6.12 Domestic Valuation slice → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**

The final validated state therefore reflects the corrected tests and a clean lint/type/build pass on the resulting branch head.


---

## 125. Entry 120 — Gate G6.13 Domestic peer cross-metric combination lock prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6 has continued with **G6.13 — Domestic Formulations Peer Cross-Metric Combination Approval Lock**.

### Canonical methodology search

Repository search found no approved PE-vs-EV/EBITDA weighting rule for PHARMA_V1.

The permanent R4N engineering rule prohibits inventing scoring weights.

Therefore G6.13 explicitly avoids a hidden 50/50 average or any other unstated combination.

### Required normalized peer inputs

Both are required:

- `PE_TTM` normalized peer-relative score
- `EV_EBITDA` normalized peer-relative score

Both must already satisfy G6.9–G6.12.

### Fail-closed behavior

If either input is missing or invalid:

`INSUFFICIENT_EVIDENCE`

Single-metric substitution is prohibited.

### Combination methods explicitly unapproved

- equal-weight mean: **NO**
- weighted mean: **NO**
- best-of: **NO**
- worst-of: **NO**
- fallback to single metric: **NO**

Current explicit weights:

- PE: `null`
- EV/EBITDA: `null`

When both normalized inputs exist, the state is only:

`READY_FOR_WEIGHTING_DECISION`

Combined peer score remains:

`null`

### Repository artifacts

Added:

- `src/features/research/pharmaDomesticPeerCombinationContract.ts`
- `src/features/research/pharmaDomesticPeerCombinationContract.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G6_13_Domestic_Peer_Combination_Lock_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### UI review surface

Gate G now includes:

- **G6.13 · Peer cross-metric combination lock**
- **G6.13 · Explicit weighting blocker**

### Domestic Valuation state

Validated / not active through G6.12:

- self-history relative curve
- FCF-yield corroboration
- peer cohort methodology
- deterministic peer builder
- minimum comparability + median aggregation
- premium/discount normalization

G6.13 now adds the explicit cross-metric combination boundary.

Still unresolved:

- PE-vs-EV/EBITDA weighting
- combined peer-relative score
- self-history vs peer-relative vs FCF component weights
- whole Valuation readiness

### Safety boundary remains unchanged

- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the G6.13 cards in TORNTPHARM → Research → Gate G, then run focused G6.13 validation. A later methodology checkpoint must explicitly approve PE-vs-EV/EBITDA weighting before a combined peer-relative score can exist.


---

## 126. Entry 121 — Gate G6.13 Domestic peer cross-metric combination lock validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6.13 has completed validation as a **proposal-only Domestic Formulations peer cross-metric combination approval lock**.

### Validation

Owner-confirmed results:

- focused Vitest covering G6.13 plus G6.12/G6.11/G6.10/G6.9 and the active Domestic Valuation methodology slice → **PASS**
- focused ESLint for the same slice → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**

### G6.13 validated combination boundary

Required normalized peer inputs:

- `PE_TTM`
- `EV_EBITDA`

Validated rules:

- both metric families required;
- neither metric may substitute for the other;
- missing input fails closed;
- invalid input fails closed;
- single-metric fallback prohibited.

### Explicitly unapproved combination methods

- equal-weight arithmetic mean: **NO**
- weighted mean: **NO**
- best-of: **NO**
- worst-of: **NO**
- fallback to one metric: **NO**

Current explicit weights:

- PE weight: `null`
- EV/EBITDA weight: `null`

When both normalized inputs are present, the state is only:

`READY_FOR_WEIGHTING_DECISION`

The combined peer score remains:

`null`

### Domestic Valuation state

Validated / not active:

- G6.2 — self-history relative valuation
- G6.8 — FCF-yield cash-flow corroboration
- G6.9 — peer-cohort methodology lock
- G6.10 — deterministic peer eligibility builder
- G6.11 — minimum-comparability and median aggregation
- G6.12 — peer premium/discount calculation and per-metric normalization
- G6.13 — peer cross-metric combination readiness lock

Still unresolved:

- PE-vs-EV/EBITDA weighting rule
- combined peer-relative score contract
- self-history vs peer-relative vs FCF component weights
- final Domestic Valuation readiness closure

Therefore:

`whole Valuation dimension ready = NO`

### Safety boundary remains unchanged

- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** G6.13 is validated. The next permitted G6 task is to explicitly define and justify the PE-vs-EV/EBITDA weighting rule for the Domestic peer-relative component, while keeping the overall Valuation dimension inactive.


---

## 127. Entry 122 — Gate G6.14 Domestic peer weighting approval gate prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6 has continued with **G6.14 — Domestic Formulations Peer Weighting Approval Gate**.

### Canonical methodology inspection

The canonical PHARMA_V1 plan and repository contain no approved PE-vs-EV/EBITDA weighting rule.

The permanent engineering rule prohibits inventing scoring weights.

Therefore G6.14 does not silently assign 50/50 or any other default.

### Current weighting state

Required normalized inputs:

- `PE_TTM`
- `EV_EBITDA`

Approved weighting method:

`null`

Current weights:

- PE: `null`
- EV/EBITDA: `null`

### Structural rules for a future weighting decision

Any candidate future weighting must:

- use finite non-negative weights;
- keep each weight within [0,1];
- sum to one within deterministic tolerance;
- be separately versioned;
- receive explicit owner approval.

A structurally valid candidate remains:

`approved = false`

until that explicit methodology approval exists.

### Explicitly prohibited defaults

- hidden default weighting: **NO**
- automatic equal weighting: **NO**
- single-metric fallback: **NO**
- unversioned weighting: **NO**

### Repository artifacts

Added:

- `src/features/research/pharmaDomesticPeerWeightingGate.ts`
- `src/features/research/pharmaDomesticPeerWeightingGate.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G6_14_Domestic_Peer_Weighting_Approval_Gate_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### UI review surface

Gate G now includes:

- **G6.14 · Peer weighting approval gate**
- **G6.14 · No implicit 50/50 rule**

### Domestic Valuation state

Validated / not active through G6.13:

- self-history relative valuation
- FCF-yield corroboration
- peer cohort methodology and builder
- peer comparability / median aggregation
- peer premium/discount normalization
- cross-metric combination readiness

G6.14 now formalizes the explicit weighting approval boundary.

Still unresolved:

- PE-vs-EV/EBITDA approved weights
- combined peer-component score
- self-history / peer-relative / FCF component weights
- final Domestic Valuation readiness closure

### Safety boundary remains unchanged

- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the G6.14 cards in TORNTPHARM → Research → Gate G, then run focused G6.14 validation. After validation, an explicit PE-vs-EV/EBITDA weighting methodology decision is required before the peer-relative component can emit a combined score.


---

## 128. Entry 123 — Gate G6.14 Domestic peer weighting approval gate validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6.14 has completed validation as a **proposal-only Domestic Formulations peer weighting approval gate**.

### Validation

Owner-confirmed results:

- focused Vitest covering G6.14 plus G6.13/G6.12/G6.11/G6.10/G6.9 and the active Domestic Valuation methodology slice → **PASS**
- focused ESLint for the same slice → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**

### G6.14 validated approval boundary

Required normalized peer inputs:

- `PE_TTM`
- `EV_EBITDA`

Approved weighting method:

`null`

Current weights:

- PE: `null`
- EV/EBITDA: `null`

### Validated structural requirements for any future weighting

Any candidate weighting must:

- use finite non-negative weights;
- keep each weight within [0,1];
- sum to one within deterministic tolerance;
- be separately versioned;
- receive explicit owner approval.

A structurally valid candidate remains:

`approved = false`

until that explicit methodology approval exists.

### Explicit defaults remain prohibited

- hidden default weighting: **NO**
- automatic equal weighting: **NO**
- single-metric fallback: **NO**
- unversioned weighting: **NO**

A 50/50 candidate may be structurally valid, but it is not implicitly approved.

### Domestic Valuation state

Validated / not active:

- G6.2 — self-history relative valuation
- G6.8 — FCF-yield cash-flow corroboration
- G6.9 — peer-cohort methodology lock
- G6.10 — deterministic peer eligibility builder
- G6.11 — minimum-comparability and median aggregation
- G6.12 — peer premium/discount calculation and per-metric normalization
- G6.13 — peer cross-metric combination readiness lock
- G6.14 — explicit peer weighting approval gate

Still unresolved:

- approved PE-vs-EV/EBITDA weights
- combined peer-component score
- self-history / peer-relative / FCF component weights
- final Domestic Valuation readiness closure

Therefore:

`whole Valuation dimension ready = NO`

### Safety boundary remains unchanged

- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** G6.14 is validated. The next methodology step requires an explicit PE-vs-EV/EBITDA weighting decision before a combined peer-relative score can exist. Until then, the peer-relative component and overall Domestic Valuation dimension remain fail closed.


---

## 129. Entry 124 — Gate G6.15 Domestic peer combined score contract prepared

**Date:** 19 September 2026  
**Actor:** owner methodology approval + ChatGPT implementation  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6 has continued with **G6.15 — Domestic Formulations Peer Combined Score Contract**.

### Explicit owner methodology approval

The owner approved the following starting methodology:

- PE peer-relative normalized score weight: **50%**
- EV/EBITDA peer-relative normalized score weight: **50%**

The owner also required explicit revisit triggers so the 50/50 split does not become a silent permanent default.

### Combined peer formula

When both normalized inputs are valid:

`Combined Peer Score = (PE Score × 0.50) + (EV/EBITDA Score × 0.50)`

Both inputs remain mandatory.

Missing/invalid input returns:

`INSUFFICIENT_EVIDENCE`

with no combined score.

### Rationale

The approved 50/50 starting point is evidence-first because:

- both peer metrics are already mandatory;
- both are independently normalized;
- no current evidence supports a systematic preference for either metric.

The contract explicitly does **not** claim that 50/50 is permanently optimal.

### Mandatory revisit trigger 1 — score divergence

Revisit the weighting if later backtesting shows material divergence between PE-based and EV/EBITDA-based peer-relative scores for the Domestic Formulations peer set.

Current boundary:

- trigger present: **YES**
- automatic numeric divergence threshold: **NO / NOT INVENTED**

A future threshold may be versioned only when backtesting evidence supports one.

### Mandatory revisit trigger 2 — leverage heterogeneity

Revisit the weighting if meaningfully different leverage enters the Domestic peer cohort.

Examples:

- M&A-funded entrant
- materially different net-debt profile

This acknowledges that EV/EBITDA's debt-neutrality may become more informative when capital structures materially diverge.

### Anti-drift rules

- single-metric fallback: **NO**
- hidden reweighting: **NO**
- silent replacement of 50/50: **NO**
- later weight change requires explicit versioned methodology revision: **YES**

### Peer component readiness

The Domestic peer-relative component now has a complete proposal calculation path when all G6.9–G6.12 prerequisites are satisfied.

However:

- activation approved: **NO**
- score execution enabled: **NO**
- persisted score run: **NO**

### Whole Domestic Valuation state

Still unresolved:

- weighting across self-history relative valuation;
- peer-relative valuation;
- FCF-yield cash-flow corroboration.

Therefore:

`whole Valuation dimension ready = NO`

### Repository artifacts

Added:

- `src/features/research/pharmaDomesticPeerCombinedScoreContract.ts`
- `src/features/research/pharmaDomesticPeerCombinedScoreContract.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G6_15_Domestic_Peer_Combined_Score_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### UI review surface

Gate G now includes:

- **G6.15 · Peer combined score — 50/50 approved**
- **G6.15 · Mandatory weighting revisit triggers**

### Safety boundary remains unchanged

- whole Valuation dimension ready: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the G6.15 cards in TORNTPHARM → Research → Gate G, then run focused G6.15 validation. After validation, the next Domestic Valuation step is to define weights across self-history, peer-relative, and FCF-yield corroboration.


---

## 130. Entry 125 — Gate G6.15 Domestic peer combined score contract validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6.15 has completed validation as an **owner-approved but not active Domestic Formulations peer combined score contract**.

### Validation

Owner-confirmed results:

- focused Vitest covering G6.15 plus G6.14/G6.13/G6.12/G6.11/G6.10/G6.9 and the active Domestic Valuation methodology slice → **PASS**
- focused ESLint for the same slice → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**

### Owner-approved peer combination methodology

Approved weights:

- PE peer-relative normalized score: **50%**
- EV/EBITDA peer-relative normalized score: **50%**

Combined formula:

`Combined Peer Score = (PE Score × 0.50) + (EV/EBITDA Score × 0.50)`

Both normalized inputs remain mandatory.

Missing or invalid input fails closed with no combined score.

### Mandatory revisit trigger 1 — backtest divergence

The weighting must be revisited if later backtesting shows material divergence between PE-based and EV/EBITDA-based peer-relative scores for the Domestic Formulations peer set.

Current state:

- revisit trigger: **YES**
- automatic numeric divergence threshold: **NO / NOT INVENTED**

A later threshold may be versioned only when actual backtesting evidence supports one.

### Mandatory revisit trigger 2 — leverage heterogeneity

The weighting must be revisited if meaningfully different leverage enters the Domestic peer cohort.

Examples:

- M&A-funded entrant
- materially different net-debt profile

This recognizes that EV/EBITDA's debt-neutrality may become more informative when capital structures materially diverge.

### Anti-drift rules

- single-metric fallback: **NO**
- hidden reweighting: **NO**
- silent replacement of the 50/50 rule: **NO**
- any future weight change requires explicit versioned methodology revision: **YES**

### Peer-relative component state

The Domestic peer-relative component now has a complete proposal calculation path when all G6.9–G6.12 evidence/comparability prerequisites are met.

Methodology status:

- combined peer score contract: **VALIDATED**
- owner-approved weights: **YES**
- activation: **NO**
- score execution: **NO**
- persisted score run: **NO**

### Whole Domestic Valuation state

Still unresolved:

- weighting across self-history relative valuation;
- peer-relative valuation;
- FCF-yield cash-flow corroboration.

Therefore:

`whole Valuation dimension ready = NO`

### Safety boundary remains unchanged

- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** G6.15 is validated. The next permitted Domestic Valuation methodology step is to define and justify the weights across the three validated components: self-history relative valuation, peer-relative valuation, and FCF-yield cash-flow corroboration.


---

## 131. Entry 126 — Gate G6.16 Domestic Valuation component weighting approval gate prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6 has continued with **G6.16 — Domestic Formulations Valuation Component Weighting Approval Gate**.

### Canonical methodology inspection

Repository search found no approved split across the three Domestic Valuation components:

- self-history relative valuation
- peer-relative valuation
- FCF-yield cash-flow corroboration

Therefore G6.16 deliberately does not invent a 40/40/20, equal-thirds, or any other hidden component weighting.

### Current state

Parent PHARMA_V1 Valuation dimension weight:

`12%`

Required components:

- `SELF_HISTORY_RELATIVE_VALUATION`
- `PEER_RELATIVE_VALUATION`
- `CASH_FLOW_CORROBORATION`

Approved component weighting method:

`null`

Current component weights:

- self-history: `null`
- peer-relative: `null`
- cash-flow corroboration: `null`

### Structural requirements for a future approved split

Any candidate future split must:

- use finite non-negative weights;
- keep each weight within [0,1];
- sum to one within deterministic tolerance;
- be separately versioned;
- receive explicit owner approval.

### Explicitly prohibited defaults

- hidden default weighting: **NO**
- automatic equal-thirds weighting: **NO**
- missing-component renormalization: **NO**
- unversioned weighting: **NO**

A candidate such as 40/40/20 may be structurally valid, but is not approved by G6.16.

### Repository artifacts

Added:

- `src/features/research/pharmaDomesticValuationWeightingGate.ts`
- `src/features/research/pharmaDomesticValuationWeightingGate.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G6_16_Domestic_Valuation_Weighting_Gate_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### UI review surface

Gate G now includes:

- **G6.16 · Valuation component weighting gate**
- **G6.16 · No implicit equal-thirds rule**

### Domestic Valuation state

Validated / not active through G6.15:

- self-history relative valuation
- FCF-yield corroboration
- peer cohort methodology and builder
- peer comparability / median aggregation
- peer premium/discount normalization
- peer cross-metric readiness
- owner-approved 50/50 PE-vs-EV/EBITDA peer combination

G6.16 now formalizes the final component-weight approval boundary.

Still unresolved:

- self-history / peer-relative / FCF approved component split
- final Domestic Valuation combined score contract
- whole Valuation readiness closure

### Safety boundary remains unchanged

- whole Valuation dimension ready: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the G6.16 cards in TORNTPHARM → Research → Gate G, then run focused G6.16 validation. After validation, an explicit methodology decision is required for the three-component Domestic Valuation split.


---

## 132. Entry 127 — Gate G6.16 Domestic Valuation component weighting approval gate validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6.16 has completed validation as a **proposal-only Domestic Formulations Valuation component weighting approval gate**.

### Validation

Owner-confirmed results:

- focused Vitest covering G6.16 plus G6.15/G6.14/G6.13/G6.12/G6.11/G6.10/G6.9 and the active Domestic Valuation methodology slice → **PASS**
- focused ESLint for the same slice → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**

### G6.16 validated weighting boundary

Parent PHARMA_V1 Valuation dimension weight:

`12%`

Required Domestic Valuation components:

- `SELF_HISTORY_RELATIVE_VALUATION`
- `PEER_RELATIVE_VALUATION`
- `CASH_FLOW_CORROBORATION`

Approved component weighting method:

`null`

Current component weights:

- self-history: `null`
- peer-relative: `null`
- cash-flow corroboration: `null`

### Validated structural requirements for any future component split

Any candidate split must:

- use finite non-negative weights;
- keep each weight within [0,1];
- sum to one within deterministic tolerance;
- be separately versioned;
- receive explicit owner approval.

### Explicit defaults remain prohibited

- hidden component weighting: **NO**
- automatic equal-thirds weighting: **NO**
- missing-component renormalization: **NO**
- unversioned weighting: **NO**

A candidate such as 40/40/20 may be structurally valid, but remains unapproved.

### Domestic Valuation state

Validated / not active:

- G6.2 — self-history relative valuation
- G6.8 — FCF-yield cash-flow corroboration
- G6.9 — peer-cohort methodology lock
- G6.10 — deterministic peer eligibility builder
- G6.11 — minimum-comparability and median aggregation
- G6.12 — peer premium/discount calculation and per-metric normalization
- G6.13 — peer cross-metric combination readiness lock
- G6.14 — peer weighting approval gate
- G6.15 — owner-approved 50/50 PE-vs-EV/EBITDA peer combined score
- G6.16 — final Valuation component weighting approval gate

Still unresolved:

- approved self-history / peer-relative / FCF component split
- final combined Domestic Valuation score contract
- whole Domestic Valuation readiness closure

Therefore:

`whole Valuation dimension ready = NO`

### Safety boundary remains unchanged

- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** G6.16 is validated. The next methodology step requires an explicit owner-approved split across self-history relative valuation, peer-relative valuation, and FCF-yield cash-flow corroboration before the Domestic Formulations Valuation dimension can be completed.


---

## 133. Entry 128 — Gate G6.17 Domestic Valuation combined score contract prepared

**Date:** 19 September 2026  
**Actor:** owner methodology approval + ChatGPT implementation  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6 has continued with **G6.17 — Domestic Formulations Valuation Combined Score Contract**.

### Explicit owner methodology approval

The owner approved:

- self-history relative valuation: **40%**
- peer-relative valuation: **40%**
- FCF-yield cash-flow corroboration: **20%**

The owner also required explicit revisit triggers and an explicit upstream cross-reference to the G6.15 peer-combination assumption.

### Combined Valuation formula

When all three component scores are valid:

`Valuation Score = (Self-History × 0.40) + (Peer-Relative × 0.40) + (FCF Corroboration × 0.20)`

All three inputs are mandatory.

Missing or invalid component evidence returns:

`INSUFFICIENT_EVIDENCE`

No missing-component renormalization is allowed.

### Upstream G6.15 dependency

The 40% peer-relative component inherits:

- PE peer-relative normalized score: **50%**
- EV/EBITDA peer-relative normalized score: **50%**

Canonical upstream contract:

`PHARMA_DOMESTIC_PEER_COMBINED_SCORE_V1_OWNER_APPROVED`

Cross-reference:

`G6.15_TO_G6.17`

This dependency is explicit for future auditability.

### Rationale

Self-history and peer-relative valuation are co-equal primary lenses because:

- own multi-year valuation history is meaningful for a durable branded-formulations business;
- genuinely similar branded-formulations peers exist;
- current evidence does not establish that either relative lens is systematically superior.

FCF-yield is capped at 20% because it is corroboration rather than a standalone valuation verdict, and annual FCF may be distorted by:

- working-capital timing;
- one-off capex;
- launch-related inventory build;
- acquisition/M&A cash-flow effects.

### Mandatory revisit trigger 1 — persistent three-component disagreement

Revisit 40/40/20 if self-history, peer-relative and FCF corroboration persistently disagree.

Current state:

- trigger present: **YES**
- automatic numeric disagreement threshold: **NO / NOT INVENTED**

### Mandatory revisit trigger 2 — FCF structural distortion

Revisit the FCF 20% weight if the cash-flow signal becomes structurally distorted by capex or M&A cycles.

### Mandatory revisit trigger 3 — peer comparability changes

Revisit the peer-relative 40% weight if peer comparability materially becomes weaker or stronger.

### Anti-drift rules

- hidden component reweighting: **NO**
- missing-component renormalization: **NO**
- silent replacement of 40/40/20: **NO**
- future changes require explicit versioned methodology revision: **YES**

### Domestic Valuation methodology state

The Domestic Formulations Valuation methodology is now **calculation-ready / not active** when all upstream evidence prerequisites are satisfied.

- combined Valuation score contract: **OWNER-APPROVED**
- activation: **NO**
- score execution: **NO**
- persisted score run: **NO**
- recommendation impact: **NO**
- position-sizing impact: **NO**

### Repository artifacts

Added:

- `src/features/research/pharmaDomesticValuationCombinedScoreContract.ts`
- `src/features/research/pharmaDomesticValuationCombinedScoreContract.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G6_17_Domestic_Valuation_Combined_Score_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### UI review surface

Gate G now includes:

- **G6.17 · Domestic Valuation combined score — 40/40/20 approved**
- **G6.17 · Valuation revisit & upstream dependency**

### Safety boundary remains unchanged

- activation: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the G6.17 cards in TORNTPHARM → Research → Gate G, then run focused G6.17 validation. If validation passes, Domestic Formulations Valuation can be treated as methodology-complete / not active, and G6 can move to the next remaining subprofile-specific curve family.


---

## 134. Entry 129 — Gate G6.17 Domestic Valuation combined score contract validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6.17 has completed validation as an **owner-approved but not active Domestic Formulations Valuation combined score contract**.

### Validation

Owner-confirmed results:

- focused Vitest covering G6.17 plus the complete Domestic Valuation methodology chain → **PASS**
- focused ESLint for the same slice → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**

### Owner-approved Domestic Valuation weighting

Approved component weights:

- self-history relative valuation: **40%**
- peer-relative valuation: **40%**
- FCF-yield cash-flow corroboration: **20%**

Combined formula:

`Valuation Score = (Self-History × 0.40) + (Peer-Relative × 0.40) + (FCF Corroboration × 0.20)`

All three component scores are mandatory.

Missing or invalid component evidence fails closed with no renormalization.

### Explicit upstream dependency

The 40% peer-relative component inherits the G6.15 owner-approved internal peer weighting:

- PE peer-relative normalized score: **50%**
- EV/EBITDA peer-relative normalized score: **50%**

Canonical upstream contract:

`PHARMA_DOMESTIC_PEER_COMBINED_SCORE_V1_OWNER_APPROVED`

Cross-reference:

`G6.15_TO_G6.17`

### Mandatory revisit triggers

1. **Persistent three-component disagreement**
   - revisit if self-history, peer-relative and FCF corroboration persistently disagree;
   - automatic numeric disagreement threshold remains **NOT APPROVED**.

2. **FCF structural distortion**
   - revisit the FCF weight if capex, M&A, working-capital or similar recurring cash-flow effects materially distort the corroboration signal.

3. **Peer comparability materially changes**
   - revisit the peer-relative weight if the Domestic peer set becomes materially weaker or stronger.

### Anti-drift rules

- hidden component reweighting: **NO**
- missing-component renormalization: **NO**
- silent replacement of 40/40/20: **NO**
- future changes require explicit versioned methodology revision: **YES**

### Domestic Formulations Valuation methodology status

The Domestic Formulations Valuation methodology is now:

**METHODOLOGY-COMPLETE / NOT ACTIVE**

Completed methodology chain:

- G6.2 — self-history relative valuation
- G6.8 — FCF-yield corroboration
- G6.9 — peer cohort methodology
- G6.10 — deterministic peer builder
- G6.11 — peer minimum comparability and median aggregation
- G6.12 — peer premium/discount normalization
- G6.13 — peer cross-metric readiness lock
- G6.14 — peer weighting approval gate
- G6.15 — owner-approved 50/50 PE-vs-EV/EBITDA peer combined score
- G6.16 — Valuation component weighting approval gate
- G6.17 — owner-approved 40/40/20 Domestic Valuation combined score

### Still not active

- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- recommendation impact: **NO**
- position-sizing impact: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

### Gate G6 broader status

Domestic Formulations Valuation is now methodology-complete, but Gate G6 itself is **not complete** because additional subprofile-specific curve families remain for the other PHARMA_V1 primary models.

**CURRENT STOP POINT:** G6.17 is validated. Domestic Formulations Valuation is methodology-complete / not active. The next safe G6 task is to select the next remaining subprofile-specific curve family, beginning with the highest-priority non-Domestic PHARMA_V1 primary model.


---

## 135. Entry 130 — Gate G6.18 Global Generics US price-erosion curve prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6 has moved to the next non-Domestic primary model with **G6.18 — Global Generics US Generic Price-Erosion Curve**.

### Why Global Generics is next

Global Generics is already a material overlay in the TORNTPHARM reference implementation and its contract contains a mandatory pricing-pressure metric:

`PHARMA_US_GENERIC_PRICE_EROSION`

The shared Segment Growth proposal already covers:

`PHARMA_EXPORT_US_REVENUE_GROWTH`

Therefore the next missing structurally important Global Generics Growth lane is price erosion.

### Evidence boundary

The metric requires disclosed price/ASP evidence.

Prohibited:

- residual derivation from revenue and volume without an approved method;
- inferred price erosion from scope-incompatible claims;
- reuse of Domestic thresholds.

History:

- minimum comparable quarters: **4**
- preferred comparable quarters: **8**
- latest comparable period required: **YES**

### Proposed methodology

Composite:

- level: **70%**
- trend: **30%**

Level statistic:

`MEDIAN_LATEST_4_COMPARABLE_PRICE_EROSION_PERCENT`

Proposed level bands:

- <0% → 100
- 0% to <3% → 85
- 3% to <5% → 70
- 5% to <8% → 55
- 8% to <12% → 35
- >=12% → 15

Trend statistic:

`LATEST_MINUS_MEDIAN_PRIOR_3_PERCENTAGE_POINTS`

Lower / more negative is better.

Proposed trend bands:

- <-3 pp → 100
- -3 pp to <0 pp → 80
- 0 pp to <3 pp → 60
- 3 pp to <6 pp → 40
- >=6 pp → 20

### Global Generics Growth boundary

Revenue growth and price erosion remain separate signals.

Strong Export/US Revenue Growth must not erase severe pricing pressure.

Improving pricing must not substitute for missing growth evidence.

### Applicability registry

Added a Global Generics-specific G6 family:

`US_GENERIC_PRICE_EROSION`

Registered as:

`VALIDATED_NOT_ACTIVE`

for:

`GLOBAL_GENERICS`

with no automatic cross-subprofile threshold reuse.

### Repository artifacts

Added:

- `src/features/research/pharmaGlobalGenericPriceErosionCurveProposal.ts`
- `src/features/research/pharmaGlobalGenericPriceErosionCurveProposal.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G6_18_Global_Generics_Price_Erosion_Curve_V1.md`

Updated:

- `src/features/research/pharmaG6SubprofileCurveApplicability.ts`
- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### UI review surface

Gate G now includes:

- **G6.18 · Global Generics US price-erosion curve**
- **G6.18 · Global-only evidence boundary**

### Explicit boundary

- Global Generics price-erosion numeric curve proposed: **YES**
- activation: **NO**
- score execution: **NO**
- persisted score run: **NO**
- cross-subprofile threshold reuse: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the G6.18 cards in TORNTPHARM → Research → Gate G, then run focused validation. G6 remains open after G6.18.


---

## 136. Entry 131 — Gate G6.18 Global Generics US price-erosion curve validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6.18 has completed validation as a **proposal-only Global Generics US Generic Price-Erosion curve**.

### Validation

Owner-confirmed results:

- focused Vitest covering G6.18 plus Segment Growth and G6 applicability → **PASS**
- focused ESLint for the same slice → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**

### G6.18 validated methodology

Metric:

`PHARMA_US_GENERIC_PRICE_EROSION`

Supported Primary:

`GLOBAL_GENERICS`

Canonical dimension:

`GROWTH`

Direction:

`LOWER_BETTER`

### Evidence boundary

Validated requirements:

- disclosed ASP/price evidence required;
- residual price-erosion inference from revenue and volume prohibited;
- minimum comparable history: **4 quarters**;
- preferred comparable history: **8 quarters**;
- latest comparable period required.

### Validated component structure

- level: **70%**
- trend: **30%**

Level statistic:

`MEDIAN_LATEST_4_COMPARABLE_PRICE_EROSION_PERCENT`

Validated level bands:

- <0% → 100
- 0% to <3% → 85
- 3% to <5% → 70
- 5% to <8% → 55
- 8% to <12% → 35
- >=12% → 15

Trend statistic:

`LATEST_MINUS_MEDIAN_PRIOR_3_PERCENTAGE_POINTS`

Lower / more negative is better.

Validated trend bands:

- <-3 pp → 100
- -3 pp to <0 pp → 80
- 0 pp to <3 pp → 60
- 3 pp to <6 pp → 40
- >=6 pp → 20

### Global Generics Growth boundary

Price erosion remains separate from:

`PHARMA_EXPORT_US_REVENUE_GROWTH`

Strong revenue growth does not erase severe pricing pressure.

Improved pricing does not substitute for missing growth evidence.

### Applicability state

Global Generics G6 family:

`US_GENERIC_PRICE_EROSION`

State:

`VALIDATED_NOT_ACTIVE`

Domestic and other Pharma Primary thresholds remain isolated.

### Safety boundary remains unchanged

- activation: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** G6.18 is validated. Global Generics now has validated Export/US Revenue Growth and US Generic Price-Erosion methodologies, both not active. The next safe G6 task is the next structurally important Global Generics-specific evidence family.


---

## 137. Entry 132 — Gate G6.19 Global Generics pipeline evidence contract prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6 has continued with **G6.19 — Global Generics Pipeline / Launch / Approval Evidence Contract**.

### Why this slice is next

The Global Generics subprofile elevates:

`PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE`

to a **MANDATORY** Business Durability input.

The parent contract is event-based and informational, so a count-only numeric curve would be premature.

### Evidence identity requirements

Every material pipeline/launch/approval event must establish:

- product or molecule;
- geography;
- dated stage;
- materiality;
- economic relevance;
- source/reference.

Permitted source classes:

- official regulator;
- issuer;
- reviewed research.

### Canonical event stages

- `FILED_OR_SUBMITTED`
- `TENTATIVE_APPROVAL`
- `FINAL_APPROVAL`
- `LAUNCHED`
- `COMMERCIAL_TRACTION_CONFIRMED`
- `DELAYED_OR_BLOCKED`
- `WITHDRAWN_OR_DISCONTINUED`

These are explicitly non-equivalent.

### History boundary

- minimum material events: **1**
- preferred material events: **4**
- latest material events required: **YES**

### Numeric blocker

Current state:

`numericNormalizationState = UNAPPROVED`

Explicitly prohibited:

- approval count automatically positive;
- launch count automatically positive;
- tentative approval treated as commercial launch;
- missing materiality/economic relevance treated as neutral.

### Adverse evidence retention

Delayed, blocked, withdrawn and discontinued events remain in the evidence history.

They are not erased by later unrelated successes.

### Regulatory anti-double-counting

G6.19 does not apply a second regulatory-site numeric penalty.

Regulatory-site severity remains governed by the separate G4 governance/regulatory gate and future Global Generics regulatory-risk methodology.

### Repository artifacts

Added:

- `src/features/research/pharmaGlobalGenericsPipelineEvidenceContract.ts`
- `src/features/research/pharmaGlobalGenericsPipelineEvidenceContract.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G6_19_Global_Generics_Pipeline_Evidence_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### UI review surface

Gate G now includes:

- **G6.19 · Global Generics pipeline evidence contract**
- **G6.19 · Count-only scoring blocker**

### Safety boundary remains unchanged

- numeric pipeline curve: **NO**
- activation: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the G6.19 cards in TORNTPHARM → Research → Gate G, then run focused G6.19 validation. Only after validation should a separate pipeline normalization methodology decide how stage, commercial traction, materiality and adverse events become numeric.


---

## 138. Entry 133 — Gate G6.19 Global Generics pipeline evidence contract validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6.19 has completed validation as a **proposal-only Global Generics Pipeline / Launch / Approval Evidence Contract**.

### Validation

Owner-confirmed results:

- focused Vitest covering G6.19 plus G6.18, Segment Growth and G6 applicability → **PASS**
- focused ESLint for the same slice → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**

### G6.19 validated evidence identity

Metric:

`PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE`

Supported Primary:

`GLOBAL_GENERICS`

Canonical dimension:

`BUSINESS_DURABILITY`

Requirement level:

`MANDATORY`

Every material event must establish:

- product or molecule;
- geography;
- dated stage;
- materiality;
- economic relevance;
- source/reference.

### Validated event stages

- `FILED_OR_SUBMITTED`
- `TENTATIVE_APPROVAL`
- `FINAL_APPROVAL`
- `LAUNCHED`
- `COMMERCIAL_TRACTION_CONFIRMED`
- `DELAYED_OR_BLOCKED`
- `WITHDRAWN_OR_DISCONTINUED`

These states remain explicitly non-equivalent.

### History boundary

- minimum material events: **1**
- preferred material events: **4**
- latest material events required: **YES**

### Validated numeric blocker

Current state:

`numericNormalizationState = UNAPPROVED`

Explicitly prohibited:

- approval count automatically positive;
- launch count automatically positive;
- tentative approval treated as commercial launch;
- missing materiality/economic relevance treated as neutral.

### Adverse evidence retention

Delayed, blocked, withdrawn and discontinued events remain in the evidence history.

### Regulatory anti-double-counting

G6.19 does not apply a regulatory-site numeric penalty.

Regulatory-site severity remains governed by the separate G4 governance/regulatory gate and any future Global Generics regulatory-risk methodology.

### Safety boundary remains unchanged

- numeric pipeline curve: **NO**
- activation: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** G6.19 is validated. The next safe Global Generics step is to define a separate pipeline normalization methodology for stage, commercial traction, materiality and adverse events while keeping score execution disabled.


---

## 139. Entry 134 — Gate G6.20 Global Generics pipeline stage normalization prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6 has continued with **G6.20 — Global Generics Pipeline Stage Normalization**.

### Purpose

G6.19 validated the evidence identity contract.

G6.20 now proposes per-event numeric stage normalization while keeping multi-event aggregation blocked.

### Proposed stage scores

- `FILED_OR_SUBMITTED` → 40
- `TENTATIVE_APPROVAL` → 55
- `FINAL_APPROVAL` → 70
- `LAUNCHED` → 85
- `COMMERCIAL_TRACTION_CONFIRMED` → 100
- `DELAYED_OR_BLOCKED` → 20
- `WITHDRAWN_OR_DISCONTINUED` → 0

### Eligibility boundary

An event normalizes only if:

- product/molecule identity exists;
- geography exists;
- event date exists;
- source/reference exists;
- materiality is established;
- economic relevance is established.

### Materiality treatment

Materiality acts only as an eligibility gate.

G6.20 does **not** approve a numeric materiality multiplier or inferred exposure percentage.

### Aggregation blocker

Explicitly unapproved:

- event-count bonus;
- simple average across events;
- median across events;
- recency-weighted aggregation;
- materiality-weighted aggregation.

Therefore:

`combinedPipelineScoreReady = false`

### Adverse-event visibility

Delayed, blocked, withdrawn and discontinued events receive explicit adverse stage scores.

An unrelated positive event may not silently cancel an adverse material event.

### Repository artifacts

Added:

- `src/features/research/pharmaGlobalGenericsPipelineStageNormalization.ts`
- `src/features/research/pharmaGlobalGenericsPipelineStageNormalization.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G6_20_Global_Generics_Pipeline_Stage_Normalization_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### UI review surface

Gate G now includes:

- **G6.20 · Global Generics pipeline stage normalization**
- **G6.20 · Multi-event aggregation blocker**

### Safety boundary remains unchanged

- combined pipeline score: **NO**
- activation: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the G6.20 cards in TORNTPHARM → Research → Gate G, then run focused G6.20 validation. Only after validation should a separate multi-event aggregation contract be considered.


---

## 140. Entry 135 — Gate G6.20 Global Generics pipeline stage normalization validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6.20 has completed validation as a **proposal-only Global Generics Pipeline Stage Normalization contract**.

### Validation

Owner-confirmed results:

- focused Vitest covering G6.20 plus G6.19/G6.18 and Segment Growth → **PASS**
- focused ESLint for the same slice → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**

### G6.20 validated per-event stage normalization

- `FILED_OR_SUBMITTED` → 40
- `TENTATIVE_APPROVAL` → 55
- `FINAL_APPROVAL` → 70
- `LAUNCHED` → 85
- `COMMERCIAL_TRACTION_CONFIRMED` → 100
- `DELAYED_OR_BLOCKED` → 20
- `WITHDRAWN_OR_DISCONTINUED` → 0

### Eligibility boundary

An event receives a normalized stage score only when:

- product/molecule identity is established;
- geography is established;
- dated stage is established;
- evidence source/reference exists;
- materiality is established;
- economic relevance is established.

### Materiality boundary

Materiality is an eligibility gate only.

Still unapproved:

- numeric materiality multiplier;
- inferred exposure percentages;
- provider-derived materiality scaling.

### Multi-event aggregation remains blocked

Explicitly unapproved:

- event-count bonus;
- simple average;
- median;
- recency weighting;
- materiality-weighted aggregation.

Therefore:

`combinedPipelineScoreReady = false`

### Contradictory/adverse evidence boundary

An unrelated positive event may not silently offset a delayed, blocked, withdrawn or discontinued material event.

### Safety boundary remains unchanged

- combined pipeline score: **NO**
- activation: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** G6.20 is validated. The next safe Global Generics step is G6.21 — a separate multi-event pipeline aggregation contract that defines how multiple identified material pipeline events combine without hiding adverse evidence or inventing materiality weights.


---

## 141. Entry 136 — Gate G6.21 Global Generics multi-event pipeline aggregation approval gate prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6 has continued with **G6.21 — Global Generics Multi-Event Pipeline Aggregation Approval Gate**.

### Repository-state prerequisite

G6.20 was first re-verified from the active branch and cumulative HANDOFF.

Confirmed:

- `## 140. Entry 135 — Gate G6.20 Global Generics pipeline stage normalization validated` already exists;
- no duplicate G6.20 validation entry was added;
- G6.20 remains **VALIDATED / NOT ACTIVE**;
- per-event normalization remains the only approved numeric pipeline method so far.

### Aggregation-precedent review

Repository methodology precedents were inspected before introducing G6.21.

Existing approved weighted-mean precedents include:

- Domestic Formulations peer-relative Valuation: 50% PE / 50% EV/EBITDA;
- Domestic Formulations final Valuation: 40% self-history / 40% peer-relative / 20% FCF corroboration.

These are **not** treated as transferable event-aggregation precedents.

Reason:

- G6.20 explicitly preserves adverse pipeline-event visibility;
- unrelated positive pipeline events may not silently cancel delayed, blocked, withdrawn or discontinued material events;
- no approved event-specific aggregation contract was found.

Therefore G6.21 deliberately creates an **approval gate**, not a numeric combiner.

### New G6.21 contract

Added:

`src/features/research/pharmaGlobalGenericsPipelineAggregationGate.ts`

Contract:

`PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_GATE_V1_PROPOSAL`

Scope:

- Primary: `GLOBAL_GENERICS`
- metric: `PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE`
- dimension: `BUSINESS_DURABILITY`

Upstream dependencies:

- G6.19 pipeline evidence contract;
- G6.20 per-event stage normalization.

### Decisions still explicitly unapproved

G6.21 requires later explicit methodology approval for:

1. aggregation method;
2. recency treatment;
3. adverse-event treatment;
4. event-offset policy;
5. whether economic relevance ever becomes numeric or remains eligibility-only.

### Candidate methods are not defaults

Recorded only as candidates:

- median;
- weighted mean;
- adverse floor/cap;
- another explicitly versioned method.

No candidate is approved by this gate.

### Safeguards locked

- all included events must be individually eligible: **YES**
- all included events must normalize under G6.20: **YES**
- adverse events remain visible: **YES**
- event-count bonus: **NO**
- simple average: **NOT APPROVED**
- median: **NOT APPROVED**
- recency weighting: **NOT APPROVED**
- materiality weighting: **NOT APPROVED**
- economic-relevance numeric multiplier: **NOT APPROVED**
- unrelated positive event silently offsets adverse event: **NO**
- combined pipeline score ready: **NO**

### Proposal-only readiness helper

Added a non-scoring readiness helper.

Possible states:

- `INSUFFICIENT_EVIDENCE`
- `REVIEW_REQUIRED`
- `AWAITING_METHODOLOGY_APPROVAL`

Behavior:

- empty event set → `INSUFFICIENT_EVIDENCE`;
- any event failing G6.20 normalization → `REVIEW_REQUIRED`;
- all events individually eligible/normalized → `AWAITING_METHODOLOGY_APPROVAL`.

Even when all events normalize successfully:

`combinedScore = null`

No aggregation method is executed.

### Tests

Added:

`src/features/research/pharmaGlobalGenericsPipelineAggregationGate.test.ts`

Focused assertions cover:

- every aggregation method remains unapproved;
- combined scoring remains blocked;
- adverse events remain counted/visible;
- positive and adverse normalized events are retained without combination;
- ineligible events fail closed to review;
- empty event sets remain insufficient evidence.

### Documentation

Added:

`docs/R4N_PHARMA_V1_Gate_G6_21_Global_Generics_Pipeline_Aggregation_Gate_V1.md`

### Glass-box UI

Updated:

`src/features/research/PharmaResearchWorkspacePanel.tsx`

Gate G now includes:

- **G6.21 · Multi-event pipeline aggregation approval gate**
- **G6.21 · Adverse visibility & offset boundary**

The cards explicitly show:

- approved aggregation method: none;
- combined pipeline score: no;
- adverse visibility required;
- hidden offset prohibited;
- methodology approval required.

### Anti-double-counting boundary

G6.21 does not introduce any regulatory-site numeric penalty.

G4 remains authoritative for governance/regulatory gating, and the same regulatory event must not be counted again as a hidden pipeline penalty.

### Safety boundary remains unchanged

- aggregation method approved: **NO**
- combined pipeline score: **NO**
- activation: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the new G6.21 cards in TORNTPHARM → Research → Gate G, then run focused G6.21 Vitest and ESLint followed by `npm run typecheck` and `npm run build`. Only after validation should any explicit numeric aggregation methodology be proposed or approved.


---

## 142. Entry 137 — Gate G6.21 Global Generics multi-event pipeline aggregation approval gate validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6.21 has completed validation as a **proposal-only Global Generics multi-event pipeline aggregation approval gate**.

### Automated validation

Owner-confirmed results:

- focused Vitest:
  - `src/features/research/pharmaGlobalGenericsPipelineAggregationGate.test.ts`
  - **PASS — 4/4 tests**
- focused ESLint covering:
  - `src/features/research/pharmaGlobalGenericsPipelineAggregationGate.ts`
  - `src/features/research/pharmaGlobalGenericsPipelineAggregationGate.test.ts`
  - `src/features/research/PharmaResearchWorkspacePanel.tsx`
  - **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**
- production Vite build completed successfully;
- only the existing non-blocking >500 kB chunk-size warning remained.

### Visual validation

Owner supplied a TORNTPHARM → Research → Gate G screenshot.

Visually confirmed:

- **G6.21 · Multi-event pipeline aggregation approval gate** renders correctly;
- **G6.21 · Adverse visibility & offset boundary** renders correctly;
- approved aggregation method is visibly **NONE**;
- combined pipeline score is visibly **NO**;
- activation is visibly **NO**;
- adverse visibility is visibly **REQUIRED**;
- hidden offset is visibly **NO**;
- methodology approval is visibly **REQUIRED**.

No unexpected foreground Research redesign was introduced.

### G6.21 validated methodology boundary

Contract:

`PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_GATE_V1_PROPOSAL`

Status:

**VALIDATED / NOT ACTIVE**

Validated rules:

- all included events must be individually eligible: **YES**
- all included events must normalize under G6.20: **YES**
- adverse events remain visible: **YES**
- event-count bonus: **NO**
- simple average: **NOT APPROVED**
- median: **NOT APPROVED**
- recency weighting: **NOT APPROVED**
- materiality weighting: **NOT APPROVED**
- economic-relevance numeric multiplier: **NOT APPROVED**
- unrelated positive event silently offsets adverse event: **NO**
- combined pipeline score ready: **NO**

### Validated readiness behavior

Possible non-scoring states remain:

- `INSUFFICIENT_EVIDENCE`
- `REVIEW_REQUIRED`
- `AWAITING_METHODOLOGY_APPROVAL`

Even when every event is individually eligible and normalized:

`combinedScore = null`

No aggregation method is executed.

### G4 anti-double-counting boundary preserved

G6.21 does not add a regulatory-site numeric penalty.

G4 remains authoritative for governance/regulatory gating, and pipeline aggregation cannot duplicate the same regulatory event as a hidden numeric penalty.

### Safety boundary remains unchanged

- numeric aggregation method approved: **NO**
- combined pipeline score: **NO**
- activation: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**Result:** G6.21 = **VALIDATED / NOT ACTIVE**.

**CURRENT STOP POINT:** The next Global Generics methodology step is an explicit aggregation-method approval decision. No numeric combined pipeline score may be implemented until the owner explicitly approves the aggregation method, adverse-event treatment, recency policy, event-offset policy, and any numeric role for economic relevance.


---

## 143. Entry 138 — Gate G6.22 Global Generics pipeline aggregation method proposal prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6 has continued with **G6.22 — Global Generics Pipeline Aggregation Method Proposal**.

### Starting state

Verified branch HEAD before G6.22:

`c8fd226de3dab4d73b5eeb3920f535029a793e1c`

G6.21 was already:

**VALIDATED / NOT ACTIVE**

The G6.21 approval gate required explicit decisions for:

1. aggregation method;
2. recency treatment;
3. adverse-event treatment;
4. event-offset policy;
5. economic-relevance numeric role.

### Repository precedent review

The repository was searched for an approved event-specific adverse floor/cap, worst-of, recency-weighted or similar event aggregation precedent.

No suitable approved event-aggregation precedent was found.

Existing weighted-mean precedents remain limited to other methodology families such as Domestic Valuation and are not treated as transferable defaults for pipeline events.

### Proposed method

Contract:

`PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_V1_PROPOSAL`

Method:

`LATEST_STATE_PER_PIPELINE_IDENTITY_THEN_MEDIAN_IF_NO_ADVERSE`

This remains:

**PROPOSAL ONLY / OWNER APPROVAL PENDING**

No executable combined-score function is introduced.

### Pipeline identity

A distinct pipeline identity is defined as:

- product or molecule;
- geography.

The same molecule in different geographies remains a distinct identity because regulatory and commercial status may differ by geography.

### Lifecycle de-duplication

For each product/molecule + geography identity:

- all historical stages remain visible for audit;
- only the latest reviewed material state would enter aggregation;
- older filing/approval/launch stages do not get counted repeatedly after a later state exists.

This prevents one opportunity from receiving a mechanical event-count advantage simply by progressing through multiple lifecycle stages.

Same-date contradictory latest stages require:

`REVIEW_REQUIRED`

### Proposed adverse-event treatment

Adverse latest states:

- `DELAYED_OR_BLOCKED`
- `WITHDRAWN_OR_DISCONTINUED`

If any distinct pipeline identity has one of these as its latest reviewed material state:

`REVIEW_REQUIRED`

No numeric aggregate is proposed in that state.

No adverse cap/floor is invented.

Unrelated positive pipeline identities cannot numerically offset the adverse latest state.

### Proposed non-adverse aggregation

Only when all distinct latest states are non-adverse:

- each latest state remains normalized under G6.20;
- proposed statistic: **MEDIAN**.

Minimum distinct identities:

- **1**

Preferred:

- **4**

These counts inherit the G6.19 minimum/preferred material-event boundary.

### Why median is proposed

The proposal records median because it:

- avoids a direct event-count bonus;
- reduces sensitivity to one unusually advanced positive pipeline identity;
- does not require unapproved materiality/economic magnitude weights;
- is deterministic and auditable.

Median is not allowed to hide adverse events because any adverse latest state blocks numeric aggregation before median calculation.

### Proposed recency policy

Age-based numeric recency weighting:

**NO**

Recency acts only through latest-state selection per pipeline identity.

Older lifecycle events remain visible for audit.

### Materiality and economic relevance

Both remain:

**ELIGIBILITY GATES ONLY**

Not proposed:

- materiality multiplier;
- inferred exposure weight;
- economic-relevance multiplier;
- provider-derived numeric scaling.

### Repository artifacts

Added:

- `src/features/research/pharmaGlobalGenericsPipelineAggregationMethodProposal.ts`
- `src/features/research/pharmaGlobalGenericsPipelineAggregationMethodProposal.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G6_22_Global_Generics_Pipeline_Aggregation_Method_Proposal_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### Glass-box UI

Gate G now includes:

- **G6.22 · Pipeline aggregation method proposal**
- **G6.22 · Adverse-state review rule**

The cards explicitly state:

- latest state per identity: yes;
- non-adverse statistic: median;
- owner approval: pending;
- adverse latest state: review required;
- recency weight: no;
- executable combiner: no.

### Execution boundary

- executable combined-score function: **NO**
- combined pipeline score ready: **NO**
- owner methodology approval: **PENDING**
- activation: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the two G6.22 cards in TORNTPHARM → Research → Gate G, then run focused G6.22 Vitest and ESLint followed by `npm run typecheck` and `npm run build`. After validation, the owner must explicitly approve or modify the G6.22 methodology before any executable G6.23 combined pipeline score contract can be implemented.


---

## 144. Entry 139 — Gate G6.22 Global Generics pipeline aggregation method proposal validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6.22 has completed validation as a **proposal-only Global Generics pipeline aggregation methodology proposal**.

### Visual validation

Owner supplied a TORNTPHARM → Research → Gate G screenshot.

Visually confirmed:

- **G6.22 · Pipeline aggregation method proposal** renders correctly;
- **G6.22 · Adverse-state review rule** renders correctly;
- latest state per identity: **YES**;
- non-adverse statistic: **MEDIAN**;
- owner approval: **PENDING**;
- adverse latest state: **REVIEW REQUIRED**;
- recency weight: **NO**;
- executable combiner: **NO**.

No unexpected foreground Research redesign was introduced.

### Owner-completed local validation

Owner confirmed completion of the requested G6.22 validation sequence:

- focused Vitest for `pharmaGlobalGenericsPipelineAggregationMethodProposal.test.ts`;
- focused ESLint for the G6.22 methodology slice and `PharmaResearchWorkspacePanel.tsx`;
- `npm run typecheck`;
- `npm run build`.

Checkpoint status recorded as:

**PASS / VALIDATED**

### Validated proposed methodology

Contract:

`PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_V1_PROPOSAL`

Status:

**VALIDATED / NOT ACTIVE / OWNER APPROVAL STILL REQUIRED**

Validated proposal:

1. pipeline identity = **product or molecule + geography**;
2. retain all historical lifecycle stages for audit;
3. only the **latest reviewed material state** per identity is eligible for aggregation;
4. same-date contradictory latest states require **REVIEW_REQUIRED**;
5. any latest state of:
   - `DELAYED_OR_BLOCKED`
   - `WITHDRAWN_OR_DISCONTINUED`
   blocks numeric aggregation and returns **REVIEW_REQUIRED**;
6. if all latest states are non-adverse, proposed cross-identity statistic = **MEDIAN**;
7. no age-based recency weighting;
8. materiality remains eligibility-only;
9. economic relevance remains eligibility-only;
10. no event-count bonus;
11. no materiality/economic-relevance multiplier;
12. no unrelated positive-event offset against an adverse latest state.

### Why no executable combiner yet

G6.22 validates the proposal contract only.

Owner methodology approval has not yet been recorded.

Therefore:

- executable combined-score function: **NO**
- combined pipeline score ready: **NO**
- activation: **NO**
- score execution: **NO**

### Safety boundary remains unchanged

- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**Result:** G6.22 proposal = **VALIDATED / NOT ACTIVE**.

**CURRENT STOP POINT:** An explicit owner methodology decision is now required. The owner must approve or modify the five proposed choices — pipeline identity, adverse-event treatment, non-adverse median aggregation, recency treatment, and eligibility-only treatment of materiality/economic relevance — before G6.23 may implement an executable combined pipeline score contract.


---

## 145. Entry 140 — Owner approved G6.22 Global Generics pipeline aggregation methodology

**Date:** 19 September 2026  
**Actor:** owner explicit methodology approval  
**Branch:** `r4n-pharma-subprofile-architecture`

Following G6.22 validation, the owner instructed ChatGPT to **proceed** with the exact methodology presented for approval.

This is recorded as approval of the G6.22 methodology only.

### Approved methodology

1. Pipeline identity = **product/molecule + geography**.
2. Retain historical lifecycle stages for audit.
3. Only the **latest reviewed material state** per pipeline identity enters cross-identity aggregation.
4. Same-date contradictory latest states require **REVIEW_REQUIRED**.
5. If any latest state is:
   - `DELAYED_OR_BLOCKED`; or
   - `WITHDRAWN_OR_DISCONTINUED`
   then numeric aggregation is blocked and the result is **REVIEW_REQUIRED**.
6. If all latest states are non-adverse, combine their G6.20 normalized stage scores using the **MEDIAN**.
7. No age-based recency weighting.
8. Materiality remains an eligibility gate only.
9. Economic relevance remains an eligibility gate only.
10. No event-count bonus.
11. No materiality multiplier.
12. No economic-relevance multiplier.
13. No unrelated positive-event offset against an adverse latest state.

### Authorization boundary

This approval authorizes implementation of a versioned **G6.23 combined pipeline score contract** reflecting the approved methodology.

It does **not** authorize:

- application score activation;
- persisted score runs;
- scoring-rule DB migration;
- schema migration;
- local DB mutation;
- production mutation;
- recommendation change;
- position-sizing change;
- deployment;
- PR #101 merge.

**CURRENT STOP POINT:** Implement G6.23 as an owner-approved but not active code contract, with focused tests, methodology documentation and glass-box UI. Validate locally before treating G6.23 as validated.


---

## 146. Entry 141 — Gate G6.23 Global Generics combined pipeline score contract prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6 has continued with **G6.23 — Global Generics Combined Pipeline Score Contract**.

### Owner-approved upstream methodology

G6.22 methodology approval was first recorded separately in Entry 140.

Approved method:

`LATEST_STATE_PER_PIPELINE_IDENTITY_THEN_MEDIAN_IF_NO_ADVERSE`

### Combined score contract

Added:

`src/features/research/pharmaGlobalGenericsPipelineCombinedScoreContract.ts`

Contract:

`PHARMA_GLOBAL_GENERICS_PIPELINE_COMBINED_SCORE_V1_OWNER_APPROVED`

State:

`OWNER_APPROVED_NOT_ACTIVE`

### Pipeline identity and lifecycle de-duplication

Identity:

- product or molecule;
- geography.

For each distinct identity:

- historical events remain retained for audit;
- only the latest reviewed state enters cross-identity aggregation;
- older lifecycle stages do not receive repeated score credit.

The implementation returns per-identity audit output including:

- product/molecule;
- geography;
- latest event date;
- latest stage;
- normalized score;
- historical event count.

### Fail-closed behavior

The combiner returns no numeric score when:

- event set is empty → `INSUFFICIENT_EVIDENCE`;
- any event fails G6.20 eligibility/normalization → `REVIEW_REQUIRED`;
- the same pipeline identity has contradictory stages on the same latest date → `REVIEW_REQUIRED`;
- any distinct pipeline identity has latest state:
  - `DELAYED_OR_BLOCKED`; or
  - `WITHDRAWN_OR_DISCONTINUED`
  → `REVIEW_REQUIRED`.

In all review-required states:

`combinedScore = null`

### Non-adverse aggregation

When all distinct latest states are eligible, normalized and non-adverse:

- aggregate statistic: **MEDIAN**;
- one latest normalized score per distinct product/molecule + geography identity;
- even-cardinality median = midpoint of the two central ordered scores.

### Preserved methodology boundaries

- age-based recency weighting: **NO**
- event-count bonus: **NO**
- materiality multiplier: **NO**
- economic-relevance multiplier: **NO**
- unrelated positive-event offset against adverse identity: **NO**
- G4 regulatory-site penalty duplication: **NO**

### Tests

Added:

`src/features/research/pharmaGlobalGenericsPipelineCombinedScoreContract.test.ts`

Coverage includes:

- owner-approved / not-active contract state;
- lifecycle de-duplication;
- same molecule across different geographies treated as distinct identities;
- median across non-adverse latest states;
- later non-adverse state superseding older adverse lifecycle state for the same identity;
- adverse latest-state blocking;
- same-date contradiction blocking;
- ineligible-event blocking;
- empty-event insufficient evidence.

### Documentation

Added:

`docs/R4N_PHARMA_V1_Gate_G6_23_Global_Generics_Combined_Pipeline_Score_V1.md`

### Glass-box UI

Updated:

`src/features/research/PharmaResearchWorkspacePanel.tsx`

Gate G now includes:

- **G6.23 · Combined pipeline score contract**
- **G6.23 · Fail-closed combined-score boundary**

The UI explicitly shows:

- methodology owner-approved;
- combined score function present;
- activation: no;
- adverse offset: no;
- persisted score run: no;
- recommendation impact: no.

### Safety boundary remains unchanged

- calculation-ready contract: **YES**
- application score activation: **NO**
- score execution wiring: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the two G6.23 cards in TORNTPHARM → Research → Gate G, then run focused G6.23 Vitest and ESLint followed by `npm run typecheck` and `npm run build`. Only after validation should G6.23 be marked VALIDATED / NOT ACTIVE.


---

## 147. Entry 142 — Gate G6.23 validation interrupted by strict TypeScript indexing; corrective hardening prepared

**Date:** 19 September 2026  
**Actor:** owner-run validation + ChatGPT correction  
**Branch:** `r4n-pharma-subprofile-architecture`

The owner started G6.23 local validation.

### Validation interruption

`npm run build` / TypeScript compilation failed under strict indexed-access checking.

Observed errors were limited to the newly added G6.23 combined pipeline contract and its focused test:

- median helper indexed array elements without proving they existed;
- latest sorted event accessed `sorted[sorted.length - 1]` without an explicit non-empty guard;
- latest same-date event accessed `latestEntries[0]` without proving presence;
- final combined score could be inferred as `number | undefined`;
- focused test accessed `latestIdentityStates[0]` directly.

### Interpretation

This was a compile-time safety failure, not a methodology failure.

The approved G6.22/G6.23 aggregation logic remains unchanged.

No score execution, DB mutation, persistence or production action occurred.

### Correction

Updated:

- `src/features/research/pharmaGlobalGenericsPipelineCombinedScoreContract.ts`
- `src/features/research/pharmaGlobalGenericsPipelineCombinedScoreContract.test.ts`

Corrective behavior:

- median now returns `number | null` and explicitly guards empty input;
- upper/lower median elements are checked before use;
- latest sorted event uses an explicit `.at(-1)` presence guard;
- latest same-date event is explicitly checked before dereference;
- impossible/empty internal states fail closed rather than relying on array-shape assumptions;
- final combined score is proved non-null before READY is returned;
- test assertion now uses `.find(...)` plus optional chaining instead of unsafe index access.

### Methodology unchanged

Still exactly:

- pipeline identity = product/molecule + geography;
- latest reviewed state per identity only;
- same-date contradictory latest stages → `REVIEW_REQUIRED`;
- any latest adverse identity → `REVIEW_REQUIRED`;
- all non-adverse latest states → MEDIAN;
- no age weighting;
- no event-count bonus;
- no materiality/economic-relevance multiplier;
- no unrelated positive offset against an adverse identity.

### Scope boundary

- methodology changed: **NO**
- score activation: **NO**
- persisted score run: **NO**
- DB/schema mutation: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, rerun focused G6.23 Vitest and ESLint, then `npm run typecheck` and `npm run build`. No UI re-review is required for this correction because only strict type-safety handling and the focused test assertion changed.


---

## 148. Entry 143 — Gate G6.23 Global Generics combined pipeline score contract validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6.23 has completed validation as an **owner-approved but not active Global Generics combined pipeline score contract**.

### Final validation

Following the strict-indexing correction recorded in Entry 142, the owner reran the requested validation and confirmed all checks passed:

- focused Vitest for:
  - `src/features/research/pharmaGlobalGenericsPipelineCombinedScoreContract.test.ts`
  - **PASS**
- focused ESLint for:
  - `src/features/research/pharmaGlobalGenericsPipelineCombinedScoreContract.ts`
  - `src/features/research/pharmaGlobalGenericsPipelineCombinedScoreContract.test.ts`
  - `src/features/research/PharmaResearchWorkspacePanel.tsx`
  - **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**

The earlier G6.23 glass-box UI review remains valid because the corrective changes affected strict type-safety handling and one focused test assertion only; no UI or methodology behavior changed.

### Validated contract

Contract:

`PHARMA_GLOBAL_GENERICS_PIPELINE_COMBINED_SCORE_V1_OWNER_APPROVED`

Status:

**VALIDATED / NOT ACTIVE**

### Validated aggregation methodology

Pipeline identity:

- product/molecule + geography

Lifecycle treatment:

- historical stages retained for audit;
- only latest reviewed state per identity enters aggregation;
- older lifecycle stages are not repeatedly counted.

Same-date contradiction:

- contradictory latest stages for one identity → `REVIEW_REQUIRED`;
- `combinedScore = null`.

Adverse latest-state rule:

- `DELAYED_OR_BLOCKED`;
- `WITHDRAWN_OR_DISCONTINUED`;

Any latest adverse identity → `REVIEW_REQUIRED` with no combined score.

Non-adverse aggregation:

- statistic: **MEDIAN**;
- one latest normalized G6.20 score per distinct identity;
- even-cardinality median uses the midpoint of the two central ordered scores.

### Validated fail-closed states

- empty event set → `INSUFFICIENT_EVIDENCE`;
- any event ineligible for G6.20 normalization → `REVIEW_REQUIRED`;
- same-date contradictory latest stage → `REVIEW_REQUIRED`;
- any latest adverse identity → `REVIEW_REQUIRED`;
- only a fully eligible, normalized, non-adverse latest-state set returns `READY` with a numeric combined score.

### Preserved boundaries

- age-based recency weighting: **NO**
- event-count bonus: **NO**
- materiality multiplier: **NO**
- economic-relevance multiplier: **NO**
- unrelated positive offset against adverse identity: **NO**
- hidden G4 regulatory double-counting: **NO**

### Activation boundary remains unchanged

- executable combined-score function: **YES**
- methodology calculation-ready: **YES**
- application score activation: **NO**
- score execution wiring: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**Result:** G6.23 = **VALIDATED / NOT ACTIVE**.

**CURRENT STOP POINT:** The Global Generics pipeline-evidence methodology chain is now calculation-ready through G6.23 but remains inactive. The next safe G6 step is to inspect the remaining Global Generics-specific mandatory evidence families and choose the next uncompleted subprofile-specific curve family without reusing Domestic Formulations thresholds or activating scoring.


---

## 149. Entry 144 — Gate G6.24 Global Generics regulatory-site treatment lock prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6 has continued with **G6.24 — Global Generics Regulatory Site Status Treatment / Anti-Double-Counting Lock**.

### Starting state

Verified branch HEAD before G6.24:

`5e9e3235d2b92059113597179fc8c02e2d193de6`

G6.23 remained:

**VALIDATED / NOT ACTIVE**

### Why regulatory-site treatment is next

The current Global Generics-specific methodology chain already covers:

- Export / US Revenue Growth;
- US Generic Price Erosion;
- Pipeline / Launch / Approval Evidence.

The remaining Global Generics-specific mandatory lane is:

`PHARMA_REGULATORY_SITE_STATUS`

where regulated export exposure exists.

However this metric is already intertwined with:

- G4 governance/regulatory gating;
- G5.6 Regulatory & Market Risk;
- the permanent anti-double-counting rule.

Therefore G6.24 deliberately does **not** introduce a new numeric regulatory score.

### New treatment contract

Added:

`src/features/research/pharmaGlobalGenericsRegulatorySiteTreatmentContract.ts`

Contract:

`PHARMA_GLOBAL_GENERICS_REGULATORY_SITE_TREATMENT_V1_PROPOSAL`

Scope:

- Primary: `GLOBAL_GENERICS`
- metric: `PHARMA_REGULATORY_SITE_STATUS`
- canonical dimension: `RISK`

### Evidence boundary

Required:

- official regulatory/issuer evidence;
- affected facility/product/geography established;
- regulatory materiality established;
- current unresolved actions represented;
- latest material inspection/remediation state represented.

Explicitly prohibited:

- inferring company-wide clearance from one site closeout;
- treating missing regulatory evidence as neutral.

### G4 authority preserved

G4 remains authoritative for:

- `BLOCKED_REVIEW`;
- `REVIEW_REQUIRED`;
- `HIGH_RISK`;
- materiality review;
- remediation/history retention.

G6.24 may surface the same regulatory context inside the Risk dimension but may not re-score it numerically.

### Anti-double-counting lock

Validated proposal boundaries:

- second numeric penalty for G4 blocked review: **NO**
- second numeric penalty for G4 high risk: **NO**
- regulatory numeric score inside Risk: **NO**
- regulatory numeric cap inside Risk: **NO**
- remediation erases historical event: **NO**
- regulatory context remains visible: **YES**

### Risk-dimension separation

The parent Risk methodology still contains distinct lanes for:

- regulatory context;
- trailing 1-year drawdown;
- trailing 1-year volatility context.

G6.24 addresses regulatory treatment only.

Still unresolved:

- Pharma drawdown normalization bands;
- Pharma volatility/benchmark context;
- component weighting.

Therefore:

`wholeRiskDimensionReady = false`

### Projection helper

Added a proposal-only helper that maps an existing G4 result into Global Generics Risk context:

- `BLOCKED_REVIEW` → `BLOCKED_REVIEW`
- `REVIEW_REQUIRED` → `REVIEW_REQUIRED`
- `HIGH_RISK` → `HIGH_RISK_CONTEXT`
- `CLEAR` → `CLEAR_CONTEXT`

It always preserves:

- `regulatoryNumericScore = null`
- `additionalNumericPenalty = null`
- `wholeRiskDimensionReady = false`

### Tests

Added:

`src/features/research/pharmaGlobalGenericsRegulatorySiteTreatmentContract.test.ts`

Coverage includes:

- G4 authority and no second numeric penalty;
- critical material event → blocked review with no numeric score;
- high-risk context visible without a second deduction;
- unknown materiality remains review-required;
- closed-out historical event retained;
- whole Risk dimension remains incomplete.

### Documentation

Added:

`docs/R4N_PHARMA_V1_Gate_G6_24_Global_Generics_Regulatory_Site_Treatment_Lock_V1.md`

### Glass-box UI

Updated:

`src/features/research/PharmaResearchWorkspacePanel.tsx`

Gate G now includes:

- **G6.24 · Global Generics regulatory-site treatment lock**
- **G6.24 · Risk-dimension separation boundary**

### Safety boundary remains unchanged

- numeric regulatory curve: **NO**
- second G4 penalty: **NO**
- whole Risk dimension ready: **NO**
- activation: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the two G6.24 cards in TORNTPHARM → Research → Gate G, then run focused G6.24 Vitest and ESLint followed by `npm run typecheck` and `npm run build`. Only after validation should G6.24 be marked VALIDATED / NOT ACTIVE.


---

## 150. Entry 145 — Gate G6.24 Global Generics regulatory-site treatment lock validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6.24 has completed validation as a **proposal-only Global Generics regulatory-site treatment / anti-double-counting lock**.

### Validation

Owner confirmed all requested validation passed:

- focused Vitest for `pharmaGlobalGenericsRegulatorySiteTreatmentContract.test.ts` → **PASS**
- focused ESLint for the G6.24 slice and `PharmaResearchWorkspacePanel.tsx` → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**

The earlier visual review of both G6.24 cards also passed.

### Validated contract

`PHARMA_GLOBAL_GENERICS_REGULATORY_SITE_TREATMENT_V1_PROPOSAL`

Status:

**VALIDATED / NOT ACTIVE**

### Validated treatment boundary

- G4 remains authoritative for regulatory block/review/high-risk state;
- no second numeric penalty for G4 blocked review;
- no second numeric penalty for G4 high risk;
- regulatory numeric score inside Risk: **NO**;
- regulatory numeric cap inside Risk: **NO**;
- remediation does not erase historical events;
- single-site closeout cannot imply company-wide clearance;
- missing regulatory evidence cannot become neutral;
- regulatory context may remain visible inside Risk.

### Risk-dimension state

Still unresolved:

- Pharma-specific trailing 1-year drawdown normalization;
- Pharma-specific volatility normalization / benchmark context;
- Risk component weighting.

Therefore:

`wholeRiskDimensionReady = false`

### Safety boundary remains unchanged

- score activation: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**Result:** G6.24 = **VALIDATED / NOT ACTIVE**.

**CURRENT STOP POINT:** The next safe Global Generics Risk step is to define the market-risk normalization boundary for trailing 1-year drawdown and volatility without inheriting BANK_NBFC thresholds.


---

## 151. Entry 146 — Gate G6.25 Global Generics market-risk normalization gate prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6 has continued with **G6.25 — Global Generics Market-Risk Normalization Gate**.

### Starting state

G6.24 was first closed as:

**VALIDATED / NOT ACTIVE**

The remaining Global Generics Risk methodology gaps were confirmed as:

- Pharma-specific trailing 1-year drawdown normalization;
- Pharma-specific 1-year volatility normalization / peer or benchmark context;
- component weighting.

### Why G6.25 is an approval gate rather than a numeric curve

Repository inspection found no approved Pharma market-risk threshold contract that would justify importing BANK_NBFC bands.

Therefore G6.25 freezes metric identity, authority and fail-closed evidence semantics without inventing numeric thresholds.

### New contract

Added:

`src/features/research/pharmaGlobalGenericsMarketRiskNormalizationGate.ts`

Contract:

`PHARMA_GLOBAL_GENERICS_MARKET_RISK_NORMALIZATION_GATE_V1_PROPOSAL`

Scope:

- Primary: `GLOBAL_GENERICS`
- canonical dimension: `RISK`

### Drawdown identity

Metric:

`MAX_DRAWDOWN_1Y`

Definition:

`TRAILING_1Y_MAX_PEAK_TO_TROUGH_DAILY_CLOSE`

Authority:

- raw: `MARKET_PRICE_HISTORY`
- derived: `MARKET_METRIC_OBSERVATIONS`

Unit:

`PERCENT`

Structural semantics:

- expected range: -100% to 0%;
- smaller absolute loss is directionally better;
- numeric Pharma bands: **UNAPPROVED**.

### Volatility identity

Metric:

`VOLATILITY_1Y`

Definition:

`ANNUALIZED_SAMPLE_STDDEV_DAILY_LOG_RETURNS_SQRT_252`

Authority:

- raw: `MARKET_PRICE_HISTORY`
- derived: `MARKET_METRIC_OBSERVATIONS`

Unit:

`PERCENT`

Structural semantics:

- volatility must be non-negative;
- lower is directionally better only with appropriate context;
- peer/benchmark context required;
- peer/benchmark contract: **UNAPPROVED**;
- numeric Pharma bands: **UNAPPROVED**.

### Explicit non-inheritance

- BANK_NBFC thresholds inherited: **NO**
- absolute drawdown bands approved: **NO**
- absolute volatility bands approved: **NO**
- relative-volatility bands approved: **NO**
- Pharma benchmark approved: **NO**
- Risk component weights approved: **NO**

### Fail-closed evidence helper

Added a structural evidence-readiness helper.

Possible states:

- `INSUFFICIENT_EVIDENCE`
- `REVIEW_REQUIRED`
- `READY_FOR_METHODOLOGY`

Behavior:

- either input missing → `INSUFFICIENT_EVIDENCE`;
- invalid metric semantics → `REVIEW_REQUIRED`;
- both structurally valid → `READY_FOR_METHODOLOGY`.

`READY_FOR_METHODOLOGY` is explicitly not score readiness.

### Tests

Added:

`src/features/research/pharmaGlobalGenericsMarketRiskNormalizationGate.test.ts`

Coverage includes:

- metric identity / formula lock;
- no BANK_NBFC threshold inheritance;
- no benchmark or component-weight default;
- missing evidence fails closed;
- invalid drawdown/volatility semantics require review;
- structurally valid evidence advances only to methodology readiness.

### Documentation

Added:

`docs/R4N_PHARMA_V1_Gate_G6_25_Global_Generics_Market_Risk_Normalization_Gate_V1.md`

### Glass-box UI

Updated:

`src/features/research/PharmaResearchWorkspacePanel.tsx`

Gate G now includes:

- **G6.25 · Global Generics market-risk normalization gate**
- **G6.25 · Benchmark & weighting blocker**

### Safety boundary remains unchanged

- Pharma drawdown curve: **NO**
- Pharma volatility curve: **NO**
- benchmark approved: **NO**
- component weights approved: **NO**
- whole Risk dimension ready: **NO**
- activation: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the two G6.25 cards in TORNTPHARM → Research → Gate G, then run focused G6.25 Vitest and ESLint followed by `npm run typecheck` and `npm run build`. Only after validation should G6.25 be marked VALIDATED / NOT ACTIVE.


---

## 152. Entry 147 — Gate G6.25 Global Generics market-risk normalization gate validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6.25 has completed validation as a **proposal-only Global Generics market-risk normalization gate**.

### Validation

Owner confirmed all requested checks passed:

- focused Vitest for `pharmaGlobalGenericsMarketRiskNormalizationGate.test.ts` → **PASS**
- focused ESLint for the G6.25 methodology slice and `PharmaResearchWorkspacePanel.tsx` → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**

The earlier glass-box UI review of both G6.25 cards remains the expected review surface.

### Validated contract

`PHARMA_GLOBAL_GENERICS_MARKET_RISK_NORMALIZATION_GATE_V1_PROPOSAL`

Status:

**VALIDATED / NOT ACTIVE**

### Validated evidence identities

#### MAX_DRAWDOWN_1Y

Definition:

`TRAILING_1Y_MAX_PEAK_TO_TROUGH_DAILY_CLOSE`

Authority:

- raw: `MARKET_PRICE_HISTORY`
- derived: `MARKET_METRIC_OBSERVATIONS`

Unit:

`PERCENT`

Structural range:

- -100% to 0%

Direction:

- smaller absolute loss is directionally better.

#### VOLATILITY_1Y

Definition:

`ANNUALIZED_SAMPLE_STDDEV_DAILY_LOG_RETURNS_SQRT_252`

Authority:

- raw: `MARKET_PRICE_HISTORY`
- derived: `MARKET_METRIC_OBSERVATIONS`

Unit:

`PERCENT`

Structural semantics:

- volatility must be non-negative;
- lower is directionally better only with approved peer/benchmark context.

### Validated non-inheritance / blockers

- BANK_NBFC thresholds inherited: **NO**
- absolute drawdown bands approved: **NO**
- absolute volatility bands approved: **NO**
- relative-volatility bands approved: **NO**
- Pharma benchmark approved: **NO**
- Risk component weights approved: **NO**
- missing evidence becomes neutral: **NO**
- whole Risk dimension ready: **NO**

### Validated evidence-readiness states

- missing either input → `INSUFFICIENT_EVIDENCE`
- invalid metric semantics → `REVIEW_REQUIRED`
- both structurally valid → `READY_FOR_METHODOLOGY`

`READY_FOR_METHODOLOGY` is not score readiness.

### Safety boundary remains unchanged

- Pharma drawdown score curve: **NO**
- Pharma volatility score curve: **NO**
- benchmark approval: **NO**
- component weights: **NO**
- score activation: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**Result:** G6.25 = **VALIDATED / NOT ACTIVE**.

**CURRENT STOP POINT:** The next safe Global Generics Risk methodology step is the first actual market-risk curve decision. Drawdown should be considered first because it has a stable absolute economic interpretation, while volatility still explicitly requires peer/benchmark context.


---

## 153. Entry 148 — Gate G6.26 Global Generics drawdown method approval gate prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6 has continued with **G6.26 — Global Generics Drawdown Method Approval Gate**.

### Starting state

G6.25 remained:

**VALIDATED / NOT ACTIVE**

Current branch head before G6.26 work was:

`f004129cdcdee34184005f6228222e4f1e9c3c78`

### Why G6.26 is an approval gate

The repository contains no approved Pharma-specific drawdown threshold contract that would justify importing BANK_NBFC bands.

Therefore G6.26 does not invent numeric cutoffs.

Instead it enumerates evidence-backed methodology candidates and the prerequisites each would require.

### Candidate methods

- `ABSOLUTE_BANDS`
- `SAME_SUBPROFILE_PEER_RELATIVE`
- `BENCHMARK_RELATIVE`
- `SELF_HISTORY_RELATIVE`
- `HYBRID_EXPLICITLY_VERSIONED`

No candidate is approved by default.

### Method prerequisites

#### Absolute bands
Require empirical Pharma evidence supporting the cutoffs.

#### Same-subprofile peer-relative
Requires a reviewed Global Generics Primary cohort.

#### Benchmark-relative
Requires an explicitly approved Pharma benchmark.

#### Self-history-relative
Requires sufficient comparable drawdown history.

#### Hybrid
Requires at least two independently eligible methods plus explicit versioned weights.

### Prohibited defaults

- BANK_NBFC bands inherited: **NO**
- missing evidence → zero/neutral: **NO**
- generic Pharma percentile without reviewed same-primary cohort: **NO**
- silent benchmark selection: **NO**
- hidden hybrid weighting: **NO**

### New artifacts

Added:

- `src/features/research/pharmaGlobalGenericsDrawdownMethodGate.ts`
- `src/features/research/pharmaGlobalGenericsDrawdownMethodGate.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G6_26_Global_Generics_Drawdown_Method_Approval_Gate_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### Glass-box UI

Gate G now includes:

- **G6.26 · Global Generics drawdown method approval gate**
- **G6.26 · No silent market-risk default**

### Execution boundary

- approved drawdown method: **NO**
- numeric drawdown curve ready: **NO**
- whole Risk dimension ready: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the two G6.26 cards in TORNTPHARM → Research → Gate G, then run focused G6.26 Vitest and ESLint followed by `npm run typecheck` and `npm run build`. After validation, inspect which candidate drawdown methods are actually evidence-backed before any G6.27 numeric method is approved.


---

## 154. Entry 149 — Gate G6.26 Global Generics drawdown method approval gate validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6.26 has completed validation as a **proposal-only Global Generics drawdown methodology approval gate**.

### Validation

Owner confirmed all requested validation passed:

- focused Vitest for `pharmaGlobalGenericsDrawdownMethodGate.test.ts` → **PASS**
- focused ESLint for the G6.26 slice and `PharmaResearchWorkspacePanel.tsx` → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**
- visual inspection of the two G6.26 cards → **PASS**

### Validated contract

`PHARMA_GLOBAL_GENERICS_DRAWDOWN_METHOD_GATE_V1_PROPOSAL`

Status:

**VALIDATED / NOT ACTIVE**

### Validated candidate-method boundary

Candidate methods remain:

- `ABSOLUTE_BANDS`
- `SAME_SUBPROFILE_PEER_RELATIVE`
- `BENCHMARK_RELATIVE`
- `SELF_HISTORY_RELATIVE`
- `HYBRID_EXPLICITLY_VERSIONED`

No candidate is approved by default.

### Validated prerequisites

- absolute bands require empirical Pharma evidence;
- peer-relative requires a reviewed Global Generics Primary cohort;
- benchmark-relative requires an explicitly approved Pharma benchmark;
- self-history-relative requires sufficient comparable history;
- hybrid requires at least two independently eligible methods plus explicit versioned weights.

### Validated prohibited defaults

- BANK_NBFC bands inherited: **NO**
- missing evidence → zero/neutral: **NO**
- generic Pharma percentile without reviewed same-primary cohort: **NO**
- silent benchmark selection: **NO**
- hidden hybrid weighting: **NO**

### Safety boundary remains unchanged

- approved drawdown method: **NO**
- numeric drawdown curve ready: **NO**
- whole Risk dimension ready: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**Result:** G6.26 = **VALIDATED / NOT ACTIVE**.

**CURRENT STOP POINT:** Inspect current repository evidence and architecture to determine which drawdown methodology candidate is actually supportable before any G6.27 numeric drawdown contract is proposed.


---

## 155. Entry 150 — Gate G6.27 Global Generics drawdown evidence sufficiency deferral gate prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6 has continued with **G6.27 — Global Generics Drawdown Evidence Sufficiency / Deferral Gate**.

### Starting state

G6.26 was validated as a drawdown methodology approval gate.

The current repository was then inspected for evidence sufficient to support any of the approved candidate-method paths.

### Evidence-sufficiency conclusion

No G6.26 candidate is currently supportable.

Blockers:

- `ABSOLUTE_BANDS` → empirical Pharma drawdown bands not established;
- `SAME_SUBPROFILE_PEER_RELATIVE` → reviewed Global Generics Primary peer cohort not established;
- `BENCHMARK_RELATIVE` → approved Pharma benchmark not established;
- `SELF_HISTORY_RELATIVE` → sufficient comparable self-history not established;
- `HYBRID_EXPLICITLY_VERSIONED` → fewer than two independently eligible methods.

### Why numeric deferral is required

The canonical architecture prohibits:

- BANK_NBFC threshold inheritance;
- generic Pharma peer substitution;
- silent benchmark selection;
- invented absolute cutoffs;
- hidden hybrid weighting.

Therefore no numeric drawdown curve is introduced.

### New artifacts

Added:

- `src/features/research/pharmaGlobalGenericsDrawdownEvidenceSufficiency.ts`
- `src/features/research/pharmaGlobalGenericsDrawdownEvidenceSufficiency.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G6_27_Global_Generics_Drawdown_Evidence_Sufficiency_Deferral_Gate_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### Glass-box UI

Gate G now includes:

- **G6.27 · Drawdown evidence sufficiency / deferral gate**
- **G6.27 · Explicit drawdown blockers**

### Safety boundary remains unchanged

- approved drawdown method: **NO**
- numeric drawdown curve ready: **NO**
- whole Risk dimension ready: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the two G6.27 cards in TORNTPHARM → Research → Gate G, then run focused G6.27 Vitest and ESLint followed by `npm run typecheck` and `npm run build`. After validation, move to the other unresolved market-risk lane — volatility normalization / peer or benchmark context — while preserving the same evidence-sufficiency discipline.


---

## 156. Entry 151 — Gate G6.27 Global Generics drawdown evidence sufficiency deferral gate validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6.27 has completed validation as a **proposal-only Global Generics drawdown evidence-sufficiency / deferral gate**.

### Validation

Owner confirmed all requested validation passed:

- focused Vitest for `pharmaGlobalGenericsDrawdownEvidenceSufficiency.test.ts` → **PASS**
- focused ESLint for the G6.27 slice and `PharmaResearchWorkspacePanel.tsx` → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**
- visual inspection of the two G6.27 cards → **PASS**

### Validated contract

`PHARMA_GLOBAL_GENERICS_DRAWDOWN_EVIDENCE_SUFFICIENCY_V1_PROPOSAL`

Status:

**VALIDATED / NOT ACTIVE**

### Validated drawdown-method conclusion

No G6.26 candidate method is currently evidence-sufficient:

- `ABSOLUTE_BANDS` → empirical Pharma bands not established;
- `SAME_SUBPROFILE_PEER_RELATIVE` → reviewed Global Generics peer cohort not established;
- `BENCHMARK_RELATIVE` → approved Pharma benchmark not established;
- `SELF_HISTORY_RELATIVE` → sufficient comparable self-history not established;
- `HYBRID_EXPLICITLY_VERSIONED` → fewer than two independently eligible methods.

Therefore:

- approved drawdown method: **NONE**
- numeric drawdown curve: **NO**
- deferral required: **YES**
- BANK/NBFC fallback: **NO**
- whole Risk dimension ready: **NO**

### Safety boundary remains unchanged

- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**Result:** G6.27 = **VALIDATED / NOT ACTIVE**.

**CURRENT STOP POINT:** Move to Global Generics volatility normalization / peer-benchmark context and apply the same evidence-sufficiency discipline before any numeric volatility curve is proposed.


---

## 157. Entry 152 — Gate G6.28 Global Generics volatility context method approval gate prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6 has continued with **G6.28 — Global Generics Volatility Context Method Approval Gate**.

### Starting state

G6.27 was first closed as:

**VALIDATED / NOT ACTIVE**

The remaining unresolved market-risk lane is:

`VOLATILITY_1Y`

The parent Risk framework explicitly requires volatility peer or benchmark context.

### Why standalone absolute volatility scoring is excluded

The architecture already states:

- lower volatility is meaningful only with context;
- BANK/NBFC bands are not inherited;
- missing evidence cannot become neutral.

Therefore G6.28 does not include a standalone absolute-band candidate.

### Candidate methods

- `SAME_SUBPROFILE_PEER_RELATIVE`
- `BENCHMARK_RELATIVE`
- `SELF_HISTORY_WITH_EXTERNAL_CONTEXT`
- `HYBRID_EXPLICITLY_VERSIONED`

No method is approved by default.

### Method prerequisites

- peer-relative → reviewed Global Generics Primary cohort required;
- benchmark-relative → explicitly approved Pharma benchmark required;
- self-history → sufficient comparable history plus external context required;
- hybrid → at least two independently eligible methods plus explicit versioned weights.

### Prohibited defaults

- BANK_NBFC thresholds inherited: **NO**
- standalone absolute-volatility scoring: **NO**
- generic Pharma peer set without reviewed Primary: **NO**
- silent benchmark selection: **NO**
- hidden hybrid weighting: **NO**
- missing evidence → neutral: **NO**

### New artifacts

Added:

- `src/features/research/pharmaGlobalGenericsVolatilityContextMethodGate.ts`
- `src/features/research/pharmaGlobalGenericsVolatilityContextMethodGate.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G6_28_Global_Generics_Volatility_Context_Method_Approval_Gate_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### Glass-box UI

Gate G now includes:

- **G6.28 · Global Generics volatility context method gate**
- **G6.28 · Context prerequisite blocker**

### Safety boundary remains unchanged

- approved volatility method: **NO**
- numeric volatility curve ready: **NO**
- whole Risk dimension ready: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the two G6.28 cards in TORNTPHARM → Research → Gate G, then run focused G6.28 Vitest and ESLint followed by `npm run typecheck` and `npm run build`. After validation, inspect whether any context method is actually evidence-backed; if none is, defer numeric volatility scoring.


---

## 158. Entry 153 — Gate G6.28 Global Generics volatility context method approval gate validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6.28 has completed validation as a **proposal-only Global Generics volatility context methodology approval gate**.

### Validation

Owner confirmed all requested validation passed:

- focused Vitest for `pharmaGlobalGenericsVolatilityContextMethodGate.test.ts` → **PASS**
- focused ESLint for the G6.28 slice and `PharmaResearchWorkspacePanel.tsx` → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**
- visual inspection of the two G6.28 cards → **PASS**

### Validated contract

`PHARMA_GLOBAL_GENERICS_VOLATILITY_CONTEXT_METHOD_GATE_V1_PROPOSAL`

Status:

**VALIDATED / NOT ACTIVE**

### Validated context rule

Standalone absolute volatility scoring remains prohibited.

Candidate methods remain:

- `SAME_SUBPROFILE_PEER_RELATIVE`
- `BENCHMARK_RELATIVE`
- `SELF_HISTORY_WITH_EXTERNAL_CONTEXT`
- `HYBRID_EXPLICITLY_VERSIONED`

No candidate is approved by default.

### Validated prerequisites

- peer-relative requires a reviewed Global Generics Primary cohort;
- benchmark-relative requires an explicitly approved Pharma benchmark;
- self-history requires sufficient comparable history plus external context;
- hybrid requires at least two independently eligible context methods plus explicit versioned weights.

### Validated prohibited defaults

- BANK_NBFC thresholds inherited: **NO**
- standalone absolute-volatility scoring: **NO**
- generic Pharma peer set without reviewed Primary: **NO**
- silent benchmark selection: **NO**
- hidden hybrid weighting: **NO**
- missing evidence → neutral: **NO**

### Safety boundary remains unchanged

- approved volatility method: **NO**
- numeric volatility curve ready: **NO**
- whole Risk dimension ready: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**Result:** G6.28 = **VALIDATED / NOT ACTIVE**.

**CURRENT STOP POINT:** Inspect current repository evidence for a reviewed Global Generics cohort, approved Pharma benchmark, and sufficient self-history plus external context. If no candidate is supportable, defer numeric volatility normalization explicitly.


---

## 159. Entry 154 — Gate G6.29 Global Generics volatility context evidence sufficiency deferral gate prepared

**Date:** 19 September 2026  
**Actor:** ChatGPT  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6 has continued with **G6.29 — Global Generics Volatility Context Evidence Sufficiency / Deferral Gate**.

### Starting state

G6.28 was first closed as:

**VALIDATED / NOT ACTIVE**

Repository inspection then found no evidence-backed volatility-context path:

- reviewed Global Generics Primary peer cohort: **NOT ESTABLISHED**
- approved Pharma benchmark: **NOT ESTABLISHED**
- sufficient comparable self-history plus external context: **NOT ESTABLISHED**

### Evidence-sufficiency conclusion

No G6.28 candidate is currently supportable.

Blockers:

- `SAME_SUBPROFILE_PEER_RELATIVE` → reviewed Global Generics peer cohort not established;
- `BENCHMARK_RELATIVE` → approved Pharma benchmark not established;
- `SELF_HISTORY_WITH_EXTERNAL_CONTEXT` → self-history plus external context not established;
- `HYBRID_EXPLICITLY_VERSIONED` → fewer than two independently eligible context methods.

### Why numeric deferral is required

The parent Risk framework requires volatility context.

The canonical architecture prohibits:

- BANK_NBFC threshold inheritance;
- generic Pharma peers without reviewed Primary classification;
- silent benchmark selection;
- self-history-only volatility scoring;
- hidden hybrid weighting;
- missing evidence → neutral.

Therefore no numeric volatility curve is introduced.

### New artifacts

Added:

- `src/features/research/pharmaGlobalGenericsVolatilityContextEvidenceSufficiency.ts`
- `src/features/research/pharmaGlobalGenericsVolatilityContextEvidenceSufficiency.test.ts`
- `docs/R4N_PHARMA_V1_Gate_G6_29_Global_Generics_Volatility_Context_Evidence_Sufficiency_Deferral_Gate_V1.md`

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

### Glass-box UI

Gate G now includes:

- **G6.29 · Volatility context evidence sufficiency / deferral gate**
- **G6.29 · Explicit volatility blockers**

### Risk slice status

- regulatory context treatment: validated / non-numeric;
- drawdown normalization: deferred;
- volatility normalization: deferred;
- component weights: unapproved;
- whole Risk dimension ready: **NO**

### Safety boundary remains unchanged

- approved volatility method: **NO**
- numeric volatility curve ready: **NO**
- whole Risk dimension ready: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- production mutation: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**CURRENT STOP POINT:** Owner should `git pull`, visually inspect the two G6.29 cards in TORNTPHARM → Research → Gate G, then run focused G6.29 Vitest and ESLint followed by `npm run typecheck` and `npm run build`. After validation, the Global Generics Risk slice can be closed as explicitly incomplete/fail-closed and G6 can move to the next unresolved Global Generics family.


---

## 160. Entry 155 — Gate G6.29 Global Generics volatility context evidence sufficiency deferral gate validated

**Date:** 19 September 2026  
**Actor:** owner validation + ChatGPT checkpoint  
**Branch:** `r4n-pharma-subprofile-architecture`

Gate G6.29 has completed validation as a **proposal-only Global Generics volatility context evidence-sufficiency / deferral gate**.

### Validation

Owner confirmed all requested validation passed:

- focused Vitest for `pharmaGlobalGenericsVolatilityContextEvidenceSufficiency.test.ts` → **PASS**
- focused ESLint for the G6.29 slice and `PharmaResearchWorkspacePanel.tsx` → **PASS**
- `npm run typecheck` → **PASS**
- `npm run build` → **PASS**
- visual inspection of the two G6.29 cards → **PASS**

### Validated contract

`PHARMA_GLOBAL_GENERICS_VOLATILITY_CONTEXT_EVIDENCE_SUFFICIENCY_V1_PROPOSAL`

Status:

**VALIDATED / NOT ACTIVE**

### Validated volatility conclusion

No G6.28 context method is currently evidence-sufficient:

- `SAME_SUBPROFILE_PEER_RELATIVE` → reviewed Global Generics peer cohort not established;
- `BENCHMARK_RELATIVE` → approved Pharma benchmark not established;
- `SELF_HISTORY_WITH_EXTERNAL_CONTEXT` → self-history plus external context not established;
- `HYBRID_EXPLICITLY_VERSIONED` → fewer than two independently eligible context methods.

Therefore:

- approved volatility method: **NONE**
- numeric volatility curve: **NO**
- deferral required: **YES**
- silent benchmark/peer fallback: **NO**

### Global Generics Risk slice status

The Global Generics Risk methodology slice is now explicitly bounded:

- regulatory-site treatment: **VALIDATED / NON-NUMERIC**
- drawdown evidence identity: **VALIDATED**
- drawdown numeric normalization: **DEFERRED / FAIL-CLOSED**
- volatility evidence identity: **VALIDATED**
- volatility numeric normalization: **DEFERRED / FAIL-CLOSED**
- Risk component weights: **UNAPPROVED**
- whole Risk dimension numeric score: **NOT READY**

This is an intentional incomplete/fail-closed state, not a neutral score.

### Safety boundary remains unchanged

- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- local DB mutation: **NO**
- production mutation: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- deployment: **NO**
- PR #101 merge: **NO**

**Result:** G6.29 = **VALIDATED / NOT ACTIVE**.

**CURRENT STOP POINT:** Global Generics Risk is explicitly incomplete/fail-closed. Move to the next unresolved Global Generics curve family without forcing a Risk score.
