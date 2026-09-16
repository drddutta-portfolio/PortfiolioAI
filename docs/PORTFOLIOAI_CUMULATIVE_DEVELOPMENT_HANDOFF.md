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
- Active cron jobs remain unchanged:
  - `portfolioai-nse-announcements-20m` — `7,27,47 * * * *`
  - `portfolioai-news-reconcile-5m` — `3-59/5 * * * *`

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

## 8. Current production state and next gate

PR #101 remains **OPEN / DRAFT / UNMERGED**.

The next possible step is **Gate D execution — production schema reconciliation only** for:

`20260916100032_reconcile_r4n_secondary_exposure_contract.sql`

No production write has occurred. Gate D may proceed only after the exact owner authorization above.

---

## 9. Forward development path

- Gate D: production schema reconciliation only if explicitly authorized.
- Gate E: reviewed Pharma subprofile assignments with provenance/effective intervals; TORNTPHARM may become `DOMESTIC_FORMULATIONS` only after explicit review/approval.
- Gate F: TORNTPHARM official-evidence pilot; dry-run/validate first, ingest only after approval.
- Gate G: approve/version PHARMA_V1 scoring curves/thresholds/weights before numeric scoring.
- Gate H: deterministic TORNTPHARM scored pilot.
- Gate I: recommendation layer as a separate downstream gate.
- Gate J: controlled PHARMA_V1 rollout by subprofile cohorts.
- Gate K: add other sector/profile families through the same universal Research workspace.
- Gate L: keep Core Selection, Core Health, Satellite Opportunity, Exit Radar and Position Sizing as separate decision methodologies.
- Gate M: portfolio-wide coverage/automation only after the individual engines are proven and provider accounting/scheduler safety remains intact.

---

## 10. Codex handback instruction

When Codex credits return:

> Read this cumulative handoff first, then independently inspect the current GitHub branch/PR, canonical repository docs, and current Supabase state relevant to the next gate. Treat this handoff as historical context, not a substitute for current verification. Preserve all production-safety gates. Continue from the newest unfinished stage and append completed work back into this cumulative history rather than replacing it with a latest-state-only summary.

**CURRENT STOP POINT:** Gate D package is prepared and CI-green. No production write has occurred. Gate D execution requires exact owner authorization for migration `20260916100032_reconcile_r4n_secondary_exposure_contract.sql` only.