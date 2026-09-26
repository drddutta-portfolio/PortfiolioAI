# PortfolioAI — Post-D P1 Source-Code Integration Baseline Manifest

**Stage:** P1 — Source-Code Integration Baseline  
**Status:** COMPLETE / PASS / CLOSED — OWNER CHECKPOINT 2 APPROVED  
**Branch:** `PortfolioAI-Development`  
**Date:** 26 September 2026  
**P0 prerequisite:** COMPLETE / PASS / CLOSED

## 1. Purpose

P1 establishes one reviewed development codeline containing the approved PortfolioAI capability lineage without modifying `main` or blindly merging historical branches.

P1 follows the P0 freeze. Existing P2/P3 environment work is not repeated.

## 2. Current ancestry proof

Read-only GitHub comparison confirms:

- `program-a-evidence-coverage` is an ancestor of `PortfolioAI-Development`; Development is ahead by 292 commits and behind by 0.
- `program-c-portfolio-decision-engines` is an ancestor of `PortfolioAI-Development`; Development is ahead by 121 commits and behind by 0.
- `program-d-operations-optional-ai` is an ancestor of `PortfolioAI-Development`; Development is ahead by 16 commits and behind by 0.
- Program D itself descends from Program C; Program D is ahead of Program C by 105 commits and behind by 0.
- Program B validation/build artifacts are present in the Development tree and Program C was built after Program B; no evidence was found that the Development line dropped the Program B implementation lineage.

Therefore the active Development branch is the correct convergence codeline. No branch replacement or bulk merge is required.

## 3. Main-only commit disposition

At P1 review, `main` is four commits ahead of the common base relative to the Development lineage.

| Commit | Content | P1 disposition | Action |
|---|---|---|---|
| `d0cc52d` | Industry-first research methodology lock | REQUIRED SEMANTICS / ALREADY CONTAINED | Do not replay. Development already contains the industry-first invariant. |
| `2a7d323` | Final Vercel `/app` and `/app/:path*` SPA rewrites | REQUIRED / ALREADY CONTAINED | Do not replay. Development `vercel.json` already contains the required routes. |
| `f7e25d7` | Earlier catch-all Vercel rewrite | SUPERSEDED | Do not port. Later routing replaced it. |
| `147f36b` | Manual encrypted Production Supabase backup workflow | ENVIRONMENT-SPECIFIC / PRESERVE ON `main` | Do not copy into Development. It is a manual Production-operations workflow using Production/backup secrets and is intentionally isolated from the Development codeline. |

### Backup-workflow decision

The Production backup workflow is not an application capability required for Development execution. Copying it into the Development branch would increase the chance of a Development-context operator invoking Production backup infrastructure. P1 therefore records it as an intentional environment-specific `main` difference, not an omission.

No Production backup behavior is deleted or changed.

## 4. Open pull-request disposition

### PR #101 — R4N Pharma subprofile architecture

**Disposition: CONTAINED / HISTORICAL OPEN PR**

- PR head `239c209...` is an ancestor of `PortfolioAI-Development`.
- Development is ahead of the PR head and behind by 0.
- Its content must not be merged again.

**P1 action:** preserve history; no cherry-pick/merge.

### PR #99 — R4L PHARMA_V1 parent completion

**Disposition: FUNCTIONALLY CONTAINED / SUPERSEDED**

Direct comparison shows only one commit remains unique to the PR head:

- `5c34677...` — documentation sync of the canonical industry-first research architecture.

The industry-first semantics are already present in Development through the current canonical Research and Intelligence Architecture.

**P1 action:** no merge/cherry-pick.

### PR #98 — R4K Pharma business-model subprofiles

**Disposition: SUPERSEDED BY LATER R4N/GATE IMPLEMENTATION**

The older PR contains five unique commits defining early Pharma business-model contracts/routing. Those exact old filenames are not retained in Development, but the later Development tree contains the evolved authority:

- `pharmaSubprofileAssignment.ts`
- `pharmaSubprofileContracts.ts`
- `pharmaSubprofileCandidateRegistry.ts`
- `usePharmaSubprofileResolution.ts`
- later Gate G/H/J/K contracts and validations

The current implementation preserves the five approved Pharma subprofiles:

- API / Bulk Drugs
- Domestic Formulations
- Global Generics
- Biopharma / Biosimilars
- CDMO / CRAMS

and adds reviewed lifecycle, effective dating, conflict/fail-closed behavior, secondary exposures and later methodology contracts.

**P1 action:** do not reintroduce the older parallel routing implementation.

### PR #78 — D35 Position Sizing Health Dashboard

**Disposition: REQUIREMENT PRESERVED / OLD UI IMPLEMENTATION NOT PORTED**

The PR's old Dashboard component files are not present in Development. The later Development line does contain the canonical R1/D35B deterministic sizing engine and its fail-closed lineage contract.

The Post-D roadmap explicitly schedules UI consolidation at P7. Porting an older standalone Dashboard sizing component during P1 would create UI work outside P1 and risk reintroducing a pre-convergence presentation model.

**P1 action:** preserve the product requirement and canonical sizing engine; do not cherry-pick the old PR #78 UI. P7 must reconcile sizing into the final approved UI using the current engine/authority.

PR #78 remains untouched by P1.

## 5. Capability-omission check

P1 finds no evidence that approved Program A–D capability lineage is missing from `PortfolioAI-Development`.

Key proof:

- Program A branch tip is an ancestor of Development.
- Program C branch tip is an ancestor of Development.
- Program D closure tip is an ancestor of Development.
- Program D descends from Program C.
- Program B execution/validation artifacts and later Program C/D consumers are present in Development.
- PR #101 is already contained.
- PR #99 adds no unique current functionality.
- PR #98 is superseded by the later R4N/Gate implementation.
- PR #78 is a historical UI implementation whose underlying sizing authority is preserved and whose presentation is intentionally deferred to P7.

## 6. Intentional differences from main

After P1 disposition, the following differences are intentional and explained:

1. Production backup workflow remains on `main` only.
2. Development carries later Program A–D/Post-D code and documentation not present in `main`.
3. Development uses branch-scoped Vercel/Supabase configuration appropriate to the isolated Development environment.
4. Historical open PRs are not merged merely to make branch topology appear cleaner.

No unexplained `main`-only application capability remains.

## 7. Source-code change decision

P1 has not identified a source-code patch that is required merely to reconcile ancestry.

Therefore P1 does **not** introduce application-code changes at this point.

This is intentional:
- required main-only application semantics are already contained;
- the Production backup workflow is environment-specific;
- old PR #98 code would duplicate/supersede current Pharma authority;
- old PR #78 UI belongs in P7 consolidation, not P1.

## 8. Validation state

P1 documentation-only changes do not alter the validated Stage 5 application tree.

The latest Stage 5 closure already recorded:
- architecture guard PASS;
- TypeScript PASS;
- production build PASS;
- changed-file ESLint PASS;
- `git diff --check` PASS;
- secret scan PASS;
- browser validation PASS;
- 288/289 test files and 1,685/1,687 tests PASS, with two known historical Program-D branch-name assertions;
- repository-wide ESLint has pre-existing unrelated debt.

P1 still requires a final exact-head validation/review before Owner Checkpoint 2. P1 does not silently redefine the inherited test/lint debt as newly passing.

## 9. Final exact-head validation

P1 exact-head validation completed at Development commit `cab5b0f4059bb6858c4445a4b0f78f49dfd46a62`.

Results:

- Development branch HEAD matches the expected P1 documentation commit.
- `main` remains unchanged at `d0cc52dfcf61fc9a884f139fcc7931b3bd73c57b`.
- The P1 delta from the pre-P1 approved baseline contains exactly two documentation changes:
  - new `PortfolioAI_POST_D_P1_SOURCE_CODE_INTEGRATION_BASELINE_MANIFEST.md`;
  - updated `PortfolioAI_Development_Status.md`.
- No source-code, migration, workflow, environment, provider, scheduler, AI or trading file was changed by P1.
- Vercel reported **SUCCESS** for the exact P1 HEAD.
- The validated Stage 5 application tree remains unchanged by P1.
- Inherited validation debt remains unchanged and explicit:
  - two historical Program-D branch-name assertions remain the known test-suite exceptions from Stage 5;
  - repository-wide ESLint retains pre-existing unrelated debt.

## 10. P1 exit criteria

| Exit criterion | Result |
|---|---|
| One reviewed Development codeline identified | PASS |
| Program A ancestry preserved | PASS |
| Program B implementation lineage materially present | PASS |
| Program C ancestry preserved | PASS |
| Program D ancestry preserved | PASS |
| Main-only application changes dispositioned | PASS |
| Open PRs dispositioned without blind merge | PASS |
| No approved capability silently dropped | PASS |
| No duplicate/superseded code imported | PASS |
| Exact-head Development deployment succeeds | PASS |
| Main unchanged | PASS |
| P1 introduced source-code changes | NONE |
| Production mutation | NONE |

## 11. P1 closure state

```text
P1 integration baseline = COMPLETE / PASS / CLOSED
Owner Checkpoint 2 = APPROVED
P2 = AUTHORIZED / NOT STARTED
```

Owner Checkpoint 2 is specifically the approval of the Development baseline/ancestry and the intentional dispositions recorded in this manifest.

## 12. Safety boundary

P1 does not authorize or perform:

- bulk merge from `main`;
- PR merge/close/retarget;
- Production mutation;
- database migration;
- provider calls;
- paid AI;
- scheduler activation;
- production deployment;
- trading/order actions.



## 13. Owner Checkpoint 2 approval — 26 September 2026

The owner explicitly approved the P1 Development baseline and ancestry disposition.

This closes P1 as **COMPLETE / PASS / CLOSED** and authorizes **P2 — Isolated Development Environment & Schema Reconstruction** only.

P2 must recognize the substantial Stage 4/Stage 5 environment work already completed. It is limited to residual P2 verification/closure work and must not rebuild the Development environment without evidence of an unmet requirement.

P2 authorization does not authorize production mutation, production migration, provider execution, paid AI, scheduler activation, merge to `main`, production deployment, PR merge/closure, or trading.
