## Frozen cohort recovery — 5 October 2026

**Private 111-equity manifest: RECOVERED / RECONCILED / OWNER REVIEW PENDING.**
**V1-3: NOT STARTED / NOT AUTHORIZED.**
This supersedes the earlier statement that no retrievable row-level baseline evidence had been established. It does not treat recovery as owner review, does not change the cohort or release contract, and does not authorize implementation.

Read-only inspection of PortfolioAI Dev (`lrgpjimipfkyoqbpsqzz`) recovered historical cohort membership from the latest append-only snapshot selections at or before the original dated audit cutoff **2026-10-05 09:18:25.508110 UTC**. It did not use current-readiness views to choose a new cohort.

The database enforces append-only research snapshots and selections through a trigger rejecting UPDATE/DELETE. There are 1,246 preserved snapshots and 717 selections across 3 historical selection runs, all pre-dating the freeze. The recovered cohort uses one selected historical run, dated 30 September; snapshot as-of date is 29 September. All member snapshot hashes, canonical identities, selected snapshot/selection references, assignment versions and effective transaction lineage were recovered privately.

Owner transaction audit timestamps show zero rows created or updated after the audit cutoff. Effective baseline quantities are recovered from active ledger/source evidence, not guessed from current readiness. Retained ANGEL_ONE price rows used for valuation all have retrieval timestamps before the cutoff.

Exact reconciliation:
| Frozen state | Equities | Frozen value (INR) |
| --- | ---: | ---: |
| REVIEW_REQUIRED | 109 | 1,240,361.16 |
| STALE | 2 | 85,495.80 |
| Initial remediation cohort | **111** | **1,325,856.96** |
| Excluded INSUFFICIENT equity group | 128 | 761,261.55 |
| Full equity population | 239 | 2,087,118.51 |

Each cohort value is exactly integral in paise; summing all 111 per-member values gives **132,585,696 paise**, with no rounding residue. Canonical member IDs are distinct. The approved minimums remain **100 members and 119,327,127 paise from the same successful members**.

Private artifact identifier: `PortfolioAI_V1_FROZEN_COHORT_2026-10-05`.
Authoritative recovered JSON SHA-256: `79f551558333adc1f37d6a26298d8088ee02db3161f03c6d6e59f9a19a93fc27`.
A companion private CSV and owner-review table were prepared in the owner's execution workspace outside the repository. Row-level holding/account identities and private values are not committed. These files require owner retention; public GitHub contains only this non-sensitive aggregate evidence and integrity reference.

**Price provenance limitation:** market_price_latest is mutable, unlike the append-only selections. Its retained timestamps and all original group totals reconcile, but no independent immutable per-price baseline audit copy was located. Recovery is corroborated from retained pre-cutoff records; it is not claimed to be a byte-for-byte retrieval of an originally saved 111-row manifest. Current symbol/name/ISIN are display references; canonical IDs and preserved snapshot selections define membership.

**Next boundary:** owner review of the exact private manifest and its disclosed provenance is required before V1-3. Record approval against the JSON SHA-256, retaining the recovered file unchanged. If the owner does not accept the recovery evidence, obtain additional frozen-baseline evidence; do not silently substitute a current cohort. Separate V1-3 execution authorization is still required.

No application code, runtime configuration, Production/main, database mutation/migration/Auth/RLS, provider execution, scheduler action, R2/storage write, P8 execution or restore action occurred. Local private review-artifact creation is the only non-documentation file output.

---

## Owner-approved sequencing amendment and V1-2 execution — 5 October 2026

**Scope Freeze B: FROZEN / OWNER APPROVED, with this owner-approved sequencing amendment.**
**V1-2: AUTHORIZED; accounting verification completed as recorded in the focused V1-2 artifact.**
**V1-3: NOT STARTED / NOT AUTHORIZED; private manifest is a hard entry prerequisite.**

Following explicit discussion of the accounting/intelligence distinction, the owner instructed “Please proceed”. This approves moving the private-manifest prerequisite from before V1-2 coding to **before ANY V1-3 work starts**, and authorizes continuation of V1-2 only.

V1-2 covers all **248 open holdings plus relevant closed histories**, independently of the later 111-equity intelligence cohort. This supersedes every earlier statement requiring the private manifest before accounting verification or repairs. It does not change accounting methods, evidence standards, cohort membership or release measurement.

Before V1-3, the 111-member private manifest must be fully recovered from the accepted frozen baseline, reconciled and owner-reviewed, including canonical identities, per-member frozen values, valuation/source and snapshot lineage, and integrity reference. It must total **111 members / INR 1,325,856.96**. If row-level baseline evidence cannot be recovered, stop before V1-3; do not regenerate membership from current readiness or substitute members.

Release criteria remain unchanged: attempt all 111; require **at least 100 of those same 111** at the full deterministic endpoint AND **at least INR 1,193,271.27** of the SAME successful members' frozen cohort value. All 239 equities and all 248 holdings remain visible, including the 128 INSUFFICIENT equities. Missing evidence never becomes HOLD. Isolated restore proof remains mandatory in V1-9; Baseline Freeze remains PARTIAL.

The initial prerequisite stop was correct under the previous wording and remains historical evidence below. The manifest itself remains NOT ESTABLISHED. This amendment removes it as a V1-2 blocker only.

V1-2 verification record: `docs/PortfolioAI_V1_2_ACCOUNTING_INTEGRITY_PREIMPLEMENTATION_AUDIT_2026-10-05.md`. No later gate is authorized by accounting completion. Final release hosted interaction/security/restore acceptance remains mandatory.

---

## Scope Freeze B owner approval — 5 October 2026

**Scope Freeze B: FROZEN / OWNER APPROVED.**
**V1-2 execution: NOT AUTHORIZED — separate owner instruction required.**

The owner explicitly approved the exact proposal presented at commit `e23b049d8639cacb23fd70a2f7b74551f0955b13` by answering “Yes” to approval of Scope Freeze B with its thresholds and measurement rules.

Approved contract:
- Attempt full deterministic usable intelligence for all **111 initial cohort equities**.
- Require **at least 100/111 successful equities** AND **at least INR 1,193,271.27 of their combined frozen baseline value**, against the fixed cohort value **INR 1,325,856.96**. The same successful members must satisfy both measures.
- Preserve the complete endpoint, fixed membership/denominators, exact paise arithmetic, explicit unsuccessful reasons and no conversion of missing evidence into HOLD.
- Keep all **239 equities and 248 holdings** visible. Other release gates remain mandatory.
- Defer isolated restore rehearsal to **V1-9**, keeping successful restore proof mandatory before release and Baseline Freeze PARTIAL.
- Preserve the accepted measurement contract: reconcile and preserve the private owner-reviewed membership/value manifest before implementation; do not claim that approval itself verifies that manifest.
- Preserve the disclosed evidence/engine/history feasibility uncertainty. Approval of the target is not proof of attainability or provider-budget authorization.

The bounded owner-supplied screenshot baseline is accepted as documented; interactive and final hosted acceptance remain for their existing gates.

This approval supersedes earlier pending-review, all-or-fail 111/111 and INCOMPLETE proposal status statements retained below. The approved proposal is preserved at the cited commit for traceability. This record authorizes no V1 implementation, migration, provider campaign, scheduler action, storage write or Production/main change.

Next: obtain separate V1-2 execution authorization and satisfy the frozen pre-implementation manifest reconciliation requirement before coding.

---

## Owner-directed cohort and minimum acceptance amendment — 5 October 2026

**Scope Freeze B: PROPOSED / OWNER REVIEW REQUIRED — NOT FROZEN.**
**Minimum thresholds: PROPOSED, awaiting explicit owner approval.**
**V1 implementation / V1-2 execution: NOT AUTHORIZED.**

This amendment records the owner's cohort and restore decisions and supersedes ALL earlier present-tense 111/111 all-or-fail requirements, readiness statements and restore-decision requests below. Earlier records are retained as historical evidence only. No release threshold has yet been approved.

### Accepted owner direction

Attempt to bring **all 111 equities** in the initial remediation cohort (109 REVIEW_REQUIRED + 2 STALE in the frozen canonical snapshot) to the complete deterministic usable-intelligence endpoint. The target is 111; release does not require 111/111 if the separately approved minimum thresholds and every other release condition pass.

Keep **all 239 equities and all 248 open holdings** visible in readiness and applicability reporting. Cohort membership and denominators must not be changed after observing implementation results. Unsuccessful members retain explicit BLOCKED, REVIEW_REQUIRED, STALE or other not-ready states with documented reasons. Missing evidence must never become HOLD or any other invented investment opinion.

The owner has accepted **isolated restore rehearsal deferral to V1-9**. Baseline Freeze remains PARTIAL. Successful isolated restore proof remains mandatory before final V1 release; deferral is not a waiver.

### Exact proposed minimums — BOTH must pass

| Measure | Frozen denominator | Proposed minimum |
| --- | --- | --- |
| Successful cohort stock count | 111 equities | **100 equities** (100/111 = 90.09%; ceiling of 90% × 111) |
| Successful cohort frozen priced-equity value | INR 1,325,856.96 | **INR 1,193,271.27** (at least 90.00% of cohort frozen value, rounded UP to the nearest paise) |

Use exact integer paise: cohort denominator 132,585,696 paise; 90% = 119,327,126.4 paise; minimum = **119,327,127 paise**. Do not round a displayed percentage to determine acceptance.

For context only, these minimums correspond to **100/239 = 41.84% of all equities by count** and approximately **57.17% of the frozen total priced-equity value INR 2,087,118.51**. The 90% value threshold applies to the selected cohort, NOT to the entire 239-equity portfolio. Display both cohort and full-portfolio coverage distinctly.

The SAME set of fully successful cohort members must satisfy both measures. Count cannot be met by one set and value by a different set. At most 11 cohort members may remain not-ready by count, and their combined frozen baseline value may not exceed **INR 132,585.69**. Thus 100 low-value successes alone cannot pass if their combined value is below the minimum; even 110 successes may fail the value condition.

A release pass is:
- successful cohort count >= 100;
- sum of frozen baseline values of those same successful members >= 119,327,127 paise;
- every other V1 gate, scenario, full-portfolio reporting, security, operational and restore acceptance requirement passes.

Neither 100 successes nor 90% value is sufficient alone. Passing these minimums does not justify abandoning the remaining target members or hiding their remediation backlog.

### What counts as successful

Preserve the full endpoint without weakening any prerequisite:

**identity → approved methodology → mandatory evidence/history → deterministic assessments → eligibility → portfolio context → applicable Fit/Sizing/Exit → persisted advisory action with reproducible lineage.**

A stock counts once only when its full applicable endpoint is demonstrated and current under approved freshness/invalidation rules at release acceptance. READY evidence, assigned methodology, an engine score, a fixture, an unpersisted result or a blocked action alone does not count. Applicability exclusions require the approved contract; they cannot be introduced to inflate coverage. Synthetic fixtures never add to real-stock count/value success.

### Frozen measurement contract and privacy

Before implementation starts, reconcile and preserve a private owner-reviewed 111-member manifest containing canonical identity, snapshot membership, each member's frozen baseline priced value, valuation date/source and reproducible lineage, with an auditable manifest identifier/integrity reference. The sum must reconcile exactly to INR 1,325,856.96. Membership comes from the accepted baseline, not a new moving status query. Keep holding identities, account details and private per-stock values out of public GitHub documentation.

These values originate from the existing frozen audit valuation; this amendment does not claim a new valuation or private-manifest verification. If reconciliation cannot be demonstrated, report it before implementation; do not guess, substitute members or change the denominator. Freeze the exact thresholds and measurement contract through explicit Scope Freeze B approval before coding. The private acceptance record must be reviewable to the owner.

Use fixed baseline values for contractual acceptance so price changes, transactions or a falling denominator cannot manufacture a pass. Also report live portfolio readiness/value with its actual current denominator separately. Holdings disposed of or otherwise unable to satisfy the approved endpoint do not silently disappear from the frozen contract. Changes require an explicit owner amendment before adopting a revised contract, never a retroactive adjustment after results are known.

### Evidence-based recommendation and remaining uncertainty

Recommend these dual 90% minimums as a practical INITIAL acceptance proposal aligned with the owner's preference. They permit a bounded residual of up to 11 members while protecting high-value coverage. This is an acceptance-policy recommendation, **not a proven feasibility forecast**.

Existing read-only evidence shows overlapping mandatory-input gaps affecting 103 cohort members, document review affecting 108, benchmark gaps affecting 32, stale evidence affecting 2 and insufficient listing history affecting 1. The stored readiness snapshot is dated 2026-09-29. The one structural history blocker makes 111/111 especially uncertain, but the available aggregate evidence does not establish which 100 members or 90% of value can succeed. Stock-level dependency/engine/source feasibility and provider budget estimates remain unproven; no new acquisition or provider execution is authorized by this proposal. V1 must preserve approved history/methodology requirements rather than relax them to meet the minimums.

### Owner-supplied hosted baseline evidence

The owner supplied authenticated screenshots of Dashboard, Holdings (/app/holdings), Portfolio Structure (/app/structure), Research (/app/research) and Intelligence (/app/intelligence), all showing the Development alias and DEVELOPMENT marker. Together these close the **bounded owner-supplied visual page-rendering baseline**; no additional screenshot is requested for that baseline.

Holdings shows 248 open positions and 25 closed histories, with explicit accounting limitations and stale price evidence. Structure renders roles/themes/weights. Research renders stored coverage: 248 open holdings, 0 fresh, 0 stale, 127 missing, 52 conflicting and 60 review-required; displayed categories must not be assumed to be an exhaustive disjoint partition of all holdings. Intelligence shows 239/239 canonical equity coverage, 9 ETFs outside equity methodology and zero scored/candidacy-ready/actions, with explicit blocked/review states.

This is screenshot evidence supplied by the owner, not agent-operated interaction or network verification. No visible login/page-load error appears in the supplied views. Filters, drill-downs, persisted workflow behavior, full accounting correctness and final hosted acceptance remain for their existing gates, including V1-9. Research evidence coverage and canonical intelligence readiness are different views and their labels/counts are not interchangeable.

The previously verified READY Preview source/configuration SHA remains `3125f03ae91cddc33bcc3c0135fc005a50cb823f`, deployment `dpl_CeFoJttcGwnfYwbRk78nqehr7HZM`. Screenshot capture SHA/time is not independently attested. Subsequent documentation-only changes preserve that application baseline and do not require another deployment.

### Approval and execution boundary

Present the exact **100/111 and INR 1,193,271.27 / INR 1,325,856.96** proposal to the owner for explicit Scope Freeze B approval, including the measurement contract and disclosed uncertainty. The earlier owner's cohort/restore instruction is recorded above; it is not approval of these newly proposed numbers.

Only after Scope Freeze B approval, pre-execution manifest reconciliation and **separate V1-2 execution authorization** may implementation begin. Reuse and upgrade the same PortfolioAI; preserve existing accounting, architecture, pilots and paused P8. Sequence remains V1-2 → V1-3 → V1-4 → V1-5 → V1-6 → V1-7 → V1-8 → V1-9.

This amendment changes documentation only. No runtime, Production/main, Supabase data/Auth/schema, provider call, migration, scheduler, storage or restore action occurred.

---

## Superseded historical proposal records

## Bounded baseline closure and V1 proposal evidence — 5 October 2026

**Scope Freeze B: INCOMPLETE / OWNER REVIEW NOT READY. V1 implementation: NOT AUTHORIZED.**
This dated reconciliation supersedes earlier deployment and browser statements below. It completes the available bounded assessment; no additional general audit or build-repair campaign is proposed.

### Development runtime and browser evidence

Remote Development HEAD inspected: `3125f03ae91cddc33bcc3c0135fc005a50cb823f`. Stable alias https://portfiolio-ai-git-portfolioai-development-dibyendu-dutta.vercel.app resolves to READY Development Preview `dpl_CeFoJttcGwnfYwbRk78nqehr7HZM`, at that same Git SHA, in project `portfiolio-ai` / `prj_Vp1QUuF63cnfuAl8ULYuHW44EbXU`. Unique deployment: https://portfiolio-oto6ttuuh-dibyendu-dutta.vercel.app. The previous build/deployment mismatch is closed.

The owner confirmed that the emailed password-reset flow works following the authentication deep-link routing repair. The supplied authenticated Dashboard screenshot visibly shows the DEVELOPMENT marker, 248/248 priced open holdings, current value INR 2,217,451.55, cost basis INR 1,915,293.31, unrealised P&L INR 302,158.24, supported realised P&L INR 6,948.89 and canonical equity coverage 239/239, with zero scored/candidacy-ready/actions. This is owner-supplied visual evidence, not an agent-operated browser test. It does not establish navigation, interactions, Holdings, Portfolio Structure, Research or Intelligence workflow acceptance. Screenshot capture SHA/time is not independently attested; deployment mapping was separately verified.

Codex cannot control the owner's authenticated session in this environment: its browser runtime requires a platform-provisioned activation token. A separate unauthenticated browser is redirected to Vercel login. No login bypass, password/cookie extraction or protection change is authorized or attempted.

Use this READY application/configuration SHA as the baseline. A later documentation-only commit does not invalidate it; disclose and verify that comparison. Reverify deployment after any application/configuration change. Do not trigger deployments merely to align documentation.

### Read-only Development cohort findings

Inspection used only PortfolioAI Dev, project ref `lrgpjimipfkyoqbpsqzz`, and owner-scoped existing canonical snapshots/evidence. Snapshot as-of date is **2026-09-29**; these are stored snapshot classifications inspected on 5 October, not a newly refreshed readiness assessment.

The 239 equities reconcile to 128 INSUFFICIENT, 109 REVIEW_REQUIRED and 2 STALE. The proposed 111-member cohort spans **39 profile codes and 29 methodology authority identifiers**. Mandatory evidence rows within this cohort show:

| Condition | Affected equities | Planning consequence |
| --- | ---: | --- |
| Required evidence missing | 103 | Acquisition/input completeness must be proven; no providers executed |
| Document evidence requires review | 108 | Factual/document review remains mandatory |
| Required benchmark history not ready | 32 | Exact approved benchmark coverage must be established |
| Required evidence stale | 2 | Freshness remedy must be authorized and validated |
| Insufficient listing history | 1 | Time-dependent structural blocker; cannot manufacture history |
| Methodology factual review required | 1 | Resolve applicable methodology before counting usable output |

These counts overlap and must not be added. Eight cohort members lack the missing-evidence flag; this does not make them usable or prove they form a feasible smaller release cohort. The short-history case also has missing mandatory evidence.

The current methodology registry is byte-identical by Git blob SHA `a42da0465b2b06eae9a206e2210af620de7145f0` to the registry at recorded owner-approved IC1 commit `8bd8a971ae31812e503217d06c6c3cc9098d4061`. The IC1 completion document records COMPLETE / PASS / CLOSED after owner approval. Its preserved original candidate label must not be mistaken for absence of subsequent approval. Approval/assignment still does not prove implemented engines, mandatory evidence availability or downstream action readiness for all represented profiles.

The existing canonical current projection returns `actionState: null`. Preserve that fail-closed behavior and the zero-usable baseline until full deterministic lineage and downstream acceptance are demonstrated.

### Concrete proposal and owner decisions

Retain **111 equities / 46.44% count / INR 1,325,856.96 / 63.53% equity value** as a proposed all-or-fail minimum, with explicit delivery uncertainty. Values and denominators are the previously frozen audit valuation, not a newly remeasured SQL valuation. The cohort must be privately frozen before implementation; public documents contain aggregate evidence only.

Feasibility assumptions are now explicit: authorized sources can supply missing mandatory evidence for 103 members; 108 document reviews can be completed; 32 benchmark gaps can be closed under approved contracts; implemented engines can serve all represented authorities; stale inputs can be refreshed; and the one insufficient-listing-history member can legitimately satisfy the approved contract by the release date. **None of these outcomes is guaranteed.** The history requirement must not be shortened or waived to hit 111 without an explicit owner-approved methodology/scope amendment. Provider volume/budget and engineering estimates remain NOT PROVEN.

The proposal therefore needs three bounded owner decisions, rather than another open-ended audit:
1. Supply the remaining read-only browser smoke evidence (Holdings, Portfolio Structure, Research and Intelligence), or explicitly accept the limited Dashboard evidence as sufficient to enter Development and record that exception. Full hosted acceptance remains required before release.
2. Accept the 111 all-or-fail target with these feasibility risks, or choose a smaller preselected private cohort whose membership, count/value and methodology obligations are frozen before implementation. No arbitrary smaller target or retrospective denominator reduction is approved.
3. Accept isolated restore rehearsal deferral to V1-9, preserving Baseline Freeze as PARTIAL and restore proof as a release requirement.

After those decisions are recorded, amend this same Scope Freeze B to PROPOSED / OWNER REVIEW REQUIRED and obtain explicit owner approval. **V1-2 execution requires separate authorization after approval.** Preserve the sequence V1-2 → V1-3 → V1-4 → V1-5 → V1-6 → V1-7 → V1-8 → V1-9 and reuse existing PortfolioAI architecture, accounting, pilots and paused P8 work.

No application code, runtime configuration, Supabase data/Auth/schema, Production/main, provider execution, migration, scheduler, storage or restore change occurred in this evidence/planning pass. Full lint remains historical FAIL (84 errors, 4 warnings); it is not relabelled PASS.

---

## Current Codex verification and owner-review decisions — 5 October 2026

**Scope Freeze B:** INCOMPLETE / OWNER REVIEW NOT READY.
**V1 implementation:** NOT AUTHORIZED.
**Development build/runtime source equivalence:** VERIFIED.
**Authenticated hosted workflow acceptance:** PARTIAL OWNER-REPORTED REACHABILITY; full smoke NOT PROVEN.
**111-equity delivery feasibility:** NOT PROVEN; candidate target for owner review.

This section supersedes earlier present-tense deployment and proposal-readiness claims below. Previous dated reports remain history.

### Verified Development runtime

Inspected remote Development HEAD: `953575ebbfac4fd5c0c76157a6317531965a5057`.

The stable Development alias now resolves to READY Preview deployment `dpl_DbjnpyyEYHg8bDWDYgJKuCaaFCwE`, Git SHA `10d740fb76f218ad8db04c4494714c998045c1d2`, branch `PortfolioAI-Development`, project `portfiolio-ai` / `prj_Vp1QUuF63cnfuAl8ULYuHW44EbXU`, Preview (`target: null`).

Unique URL: https://portfiolio-4v8jelttm-dibyendu-dutta.vercel.app
Stable alias: https://portfiolio-ai-git-portfolioai-development-dibyendu-dutta.vercel.app

GitHub comparison of the deployed SHA to inspected HEAD reports exactly one changed file: `docs/PortfolioAI_Development_Status.md`. Application source, dependencies, build configuration and committed runtime configuration are identical. No new deployment is necessary to resolve an application-source mismatch. This proves source equivalence, not deployment of the documentation-only HEAD or browser acceptance. Connected platform configuration was not changed.

For baseline inspection, use this positively identified READY Development Preview and record its exact SHA. Later documentation-only commits must be compared and disclosed; they do not invalidate this source-equivalence proof. Any application/configuration change requires new deployment evidence. Final release deployment/version acceptance remains required in V1-9.

The owner reports that the Development Dashboard is open at `/app#dashboard-daily-move`. This is owner-reported reachability; no marker, data correctness or other route result has yet been supplied. The agent's separate fresh browser request reached Vercel's login page, not an authenticated PortfolioAI workflow. The Codex browser tab was requested for owner access; opening a tab is not authentication or successful inspection. No protection bypass or credentials were used. Dashboard, Holdings, Portfolio Structure, Research and Intelligence remain unverified in an authenticated hosted session. Owner-performed evidence must be explicitly attributed to the owner, with date, deployment identity, checked routes, DEVELOPMENT marker and errors/limitations; it must not be labelled agent-observed.

### What the 111-equity proposal establishes

The reported frozen cohorts reconcile arithmetically:
- 109 REVIEW_REQUIRED + 2 STALE = 111 equities;
- INR 1,240,361.16 + INR 85,495.80 = INR 1,325,856.96;
- 111 / 239 = 46.44% by count;
- INR 1,325,856.96 / INR 2,087,118.51 = 63.53% by frozen priced equity value.

This continuation checks the arithmetic and repository evidence; it does not independently remeasure private holdings or change the dated database snapshot.

The cohort is reproducibly defined by status, but that does not demonstrate lower remediation cost, complete mandatory inputs, approved methodology coverage or deliverability. REVIEW_REQUIRED can reflect unresolved review/conflict, and STALE requires an accepted freshness remedy. These are not executable-engine readiness guarantees.

The existing `src/features/decision/p7Ic6CurrentProjection.ts` exposes blocked prerequisites and returns `actionState: null`; even READY evidence alone does not create R7 candidacy or complete portfolio/action intelligence. This supports preserving the measured zero-usable baseline and planning real downstream engineering, rather than converting a readiness label into an action.

### Candidate acceptance contract and delivery assumptions

Retain 111 equities / INR 1,325,856.96 as a **candidate minimum**, not an approved or evidence-proven delivery forecast. Preserve the complete deterministic endpoint, scenario tests, 248/248 explicit status coverage, unchanged denominators, fail-closed semantics and private-identity boundary.

Before claiming that this candidate is feasible, the existing V1-3/V1-4 planning work must supply a private frozen member manifest and non-sensitive aggregate matrix covering:
1. methodology/profile distribution within the selected cohort;
2. approved contract/version and implemented reusable versus missing engine for each represented methodology;
3. mandatory evidence/history/freshness gaps and review/conflict reasons;
4. permissible acquisition paths, external dependencies and provider volume/budget assumptions, without executing providers;
5. engineering work/effort per methodology and shared downstream integration;
6. expected count/value gains with uncertainty and explicit unremediable cases.

This is bounded inspection/planning inside the existing gates, not a new gate or authorization to implement them. If evidence is unavailable, mark it NOT PROVEN. Do not claim that all 111 are achievable solely because they are non-INSUFFICIENT.

Owner choices, once the remaining evidence is available:
- adopt the 111 candidate with its documented assumptions and all-or-fail acceptance, accepting the disclosed delivery uncertainty;
- select a smaller named private cohort with measured count/value and method coverage before implementation, then amend the threshold explicitly;
- require all 239 equities, accepting the wider evidence/engine scope.

No smaller threshold, provider authorization or feasibility exception is inferred here. Once approved, a target must not be lowered after seeing implementation results without an explicit owner amendment.

### Remaining actions and decisions

1. Obtain attributed read-only authenticated baseline smoke evidence from the verified READY Preview. Do not use refresh/save/import or other write/provider controls.
2. Resolve cohort feasibility assumptions and freeze the private membership/count/value contract, or obtain explicit owner acceptance of the disclosed target uncertainty. No live provider acquisition or implementation is required to review the plan.
3. Present the isolated-restore deferral to V1-9 for explicit owner decision; Baseline Freeze remains PARTIAL and restore remains a release requirement.
4. Only then present Scope Freeze B for explicit approval. V1-2 requires separate execution authorization.

Full lint remains reported FAIL (84 errors, 4 warnings); previous build/TypeScript/architecture/focused-test results are preserved historical verification, not newly rerun in this documentation-only continuation.

No main/Production change, application implementation, provider call, database mutation/migration, scheduler action, storage write, backup/restore, runtime configuration change or manual deployment occurred.

---

## Historical proposal and verification records

The sections below preserve previous proposals and observations. Current status and qualifications above control; earlier claims that only two evidence gaps remained or that the 111 target was fully justified are superseded.

## Concrete V1 release acceptance contract — 5 October 2026

**Proposal status:** COMPLETE AS A PLAN / NOT YET REVIEW-READY BECAUSE HOSTED ACCEPTANCE EVIDENCE REMAINS MISSING  
**V1 implementation:** NOT AUTHORIZED

### Recommended minimum usable-intelligence release target

Use the frozen 2026-10-05 equity denominator of **239 equities / INR 2,087,118.51 priced equity value**.

The proposed bounded remediation cohort is the entire current **non-INSUFFICIENT** equity cohort:
- 109 `REVIEW_REQUIRED`;
- 2 `STALE`;
- total proposed cohort: **111 equities**;
- count share: **46.44%** of 239;
- priced equity value represented by the cohort: **INR 1,325,856.96**;
- value share: **63.53%** of the frozen priced-equity denominator.

This is a **proposed minimum V1 acceptance target**, not current achieved coverage. Current measured usable intelligence remains **0/239 equities and INR 0 value**.

The reason for selecting this cohort is objective and reproducible: it includes every equity that is not currently classified `INSUFFICIENT` under the frozen readiness snapshot, while leaving the 128 `INSUFFICIENT` equities visible in the denominator and explicitly blocked from usable-intelligence counting until later remediation.

### Mandatory acceptance conditions for the 111-equity cohort

Every one of the 111 equities counted toward release must reach the full deterministic endpoint:

`identity -> approved applicable methodology -> mandatory evidence/history -> deterministic assessments -> eligibility -> portfolio context -> applicable Fit/Sizing/Exit -> persisted advisory action with reproducible lineage`.

A readiness label alone does not count. `BLOCKED`, `REVIEW_REQUIRED`, `STALE`, unsupported, unresolved, conflicting or missing-evidence states do not count as usable. Missing evidence never defaults to HOLD.

The 111 target is all-or-fail for this proposed minimum: if fewer than 111 reach the endpoint, V1 does not satisfy this proposed release threshold unless the owner explicitly approves a later Scope Freeze amendment. The denominator must not be reduced after implementation to manufacture a pass.

### Methodology coverage rule

The release cohort must support every canonical methodology/profile actually represented among the selected 111 equities. Shared engines may serve multiple profile codes where the approved architecture says so. A profile may not be counted merely because it has an assignment row; applicable methodology approval, implemented deterministic engine support and mandatory evidence readiness must all be proven.

Methodology profiles represented only among the 128 `INSUFFICIENT` equities may remain explicitly blocked for V1 release, provided their holdings remain visible in the 239-equity denominator and their status is not misrepresented as usable intelligence.

### Scenario acceptance coverage

The private acceptance suite must cover, using real Development holdings where available:
- Core;
- bank/financial;
- pharma/specialized;
- non-financial;
- ETF/accounting applicability boundary;
- missing/review-required evidence;
- partial-sale accounting;
- multi-broker/unknown-attribution accounting.

Additionally validate with clearly labelled deterministic fixtures where a genuine READY Development case does not exist:
- supported Satellite;
- role mismatch;
- high-quality overweight;
- underweight/ADD;
- deterioration/EXIT-review;
- conflicting evidence.

Fixture success validates behavior; it does **not** add to the 111-equity or INR 1,325,856.96 real-portfolio usable coverage.

### Full-portfolio protections required even outside the 111 usable cohort

- 248/248 open securities must have an explicit applicability/readiness state.
- 239/239 equities must remain visible under the canonical assignment/readiness authority.
- The 128 `INSUFFICIENT` equities remain explicit blocked/non-usable states; they are not removed from reporting.
- All 9 ETFs remain outside equity stock-selection scoring but must retain correct accounting/status handling.
- Accounting, valuation and weights must remain canonical and cross-surface consistent.
- Missing/conflicting/stale evidence must remain fail-closed.
- Owner roles/settings and final human decision authority must be preserved.
- Maintenance/invalidation/provider-outage behavior must prevent stale derived outputs from appearing current.
- Security/RLS and operational checks remain release requirements.
- Full repository lint is **not PASS**: 84 errors and 4 warnings remain explicit technical debt. Broad cleanup is not part of this acceptance plan; any lint issue touching release-critical changed code must still be resolved before that code closes its gate.

### Gate-specific delivery justification

- **V1-2:** reuse existing ledger/accounting authority; verify partial sales, reopen, multi-broker, corrections, P&L and cross-surface exactness. Estimated engineering effort: Small–Medium.
- **V1-3:** reuse 239/239 methodology assignments; verify application-router compatibility and approval/engine mapping. Estimated effort: Small–Medium to Medium.
- **V1-4:** remediate the 111 selected `REVIEW_REQUIRED/STALE` equities first; separately preserve the 128 `INSUFFICIENT` cohort as explicit blocked states. Evidence/provider work is separate from engineering effort. Estimated engineering effort: Large.
- **V1-5:** implement/generalize only the deterministic engines required by methodology profiles represented in the 111 cohort, while preserving existing pilots. Estimated effort: Large.
- **V1-6:** current eligibility and role-fit for the accepted cohort; unsupported temporal movement may remain V1.1. Estimated effort: Medium.
- **V1-7:** complete Portfolio Fit, Position Sizing, Exit Risk and action precedence for every usable cohort member. Estimated effort: Large.
- **V1-8:** minimal thesis/snapshot/owner-decision linkage and optional grounded AI. Estimated effort: Medium.
- **V1-9:** maintenance/invalidation, exact hosted browser acceptance, security/ops checks and isolated restore rehearsal. Estimated effort: Medium–Large.

Provider/evidence acquisition volume, cooldowns and external availability are not included in engineering effort and require their own execution authorization/budget controls.

### Fallback owner options

If the owner considers the recommended 111 / 63.53%-value minimum too broad before implementation, the only defensible fallback is to approve a smaller **explicitly preselected private cohort** with a frozen count and measured value before V1-4 begins. It must not be selected after seeing implementation results.

If the owner instead requires comprehensive V1 intelligence, the alternative is **239/239 equities / 100% count and 100% priced equity value**, with all 128 currently `INSUFFICIENT` holdings included in remediation. This is materially higher scope and should be treated as Large+ evidence/engine work, not as the default minimum.

**Recommended owner choice:** approve the 111-equity / INR 1,325,856.96 minimum real-portfolio usable-intelligence target plus 248/248 explicit status coverage.

### Recovery decision for owner review

Proposed decision:

> **Defer the isolated restore rehearsal to V1-9 while retaining it as a mandatory requirement before V1 release.**

Supporting evidence: the Development backup has strong integrity/read-back/decrypt/hash/archive-validation evidence and R2/runtime mapping has been verified. Remaining uncertainty: there has been no isolated live restore into a disposable target, so application/schema/data recovery compatibility has not been proven end-to-end. Baseline Freeze therefore remains **PARTIAL** until the recovery requirement is satisfied or explicitly redefined by the owner.

This proposal does not approve the deferral by itself and performs no restore.

---

## Current Scope Freeze B review status — 5 October 2026

**Status: INCOMPLETE / OWNER REVIEW NOT READY**  
**V1 implementation: NOT AUTHORIZED**  
**Current Development HEAD: `fb067e01b64344c5279ceb65ead5ad7b3516a616`**  
**Browser-tested/READY Preview SHA: `ba8c9e9ddbc0e2658a213af178f0f8922e86639d`**  
**READY deployment: `dpl_5p9Daac7UqGSL8y6qP3dawqF1Hzx`**

Current HEAD is one documentation-only commit ahead of the verified READY Preview. Git comparison shows no application-source or runtime-configuration difference between those SHAs. Vercel currently returns no deployment for the exact current HEAD, so exact-current-HEAD Preview acceptance remains unproven and the older READY deployment is not substituted for it.

Authenticated hosted browser verification also remains unavailable because no existing authorized owner browser session is exposed to this execution environment and the Preview is protected by Vercel SSO. No protection bypass, credential request, or write-capable browser action is permitted.

Proposal content is otherwise complete enough to define the intended V1 implementation plan without prematurely executing V1-4/V1-5/V1-7.

### Frozen measured baseline for the proposal

- 248 open securities: 239 equities + 9 ETFs.
- Priced equity denominator: INR 2,087,118.51.
- Current methodology assignment census: 239/239 equities across 45 profiles.
- Methodology assignment is not equivalent to approved executable engine readiness or evidence readiness.
- Current evidence/readiness states: 128 INSUFFICIENT, 109 REVIEW_REQUIRED, 2 STALE, 0 READY.
- Current usable-intelligence baseline: 0/239 equities and INR 0 / INR 2,087,118.51 under the frozen minimum V1 endpoint.
- Capability totals: 22 V1 BLOCKER / 23 V1 IMPORTANT / 3 V1.1 / 8 NO CHANGE.

### Bounded remediation plan

The plan remains the existing V1 gate sequence with no new sub-gate hierarchy:

- **V1-2 Accounting Integrity:** verify/reconcile current accounting and broker attribution; do not rebuild proven ledger authority.
- **V1-3 Identity / Classification / Routing:** reuse the 239/239 assignment census, verify compatibility with current application routing, and fail closed on any genuine mismatch.
- **V1-4 Evidence / Current-History Readiness:** remediate the measured INSUFFICIENT / REVIEW_REQUIRED / STALE cohorts, method-specific current-history sufficiency, freshness/conflicts and benchmark alignment.
- **V1-5 Deterministic Engines:** generalize valid pilots and complete only genuinely missing engines.
- **V1-6 Eligibility / Movement:** implement current eligibility first; defer unsupported temporal movement rather than infer it.
- **V1-7 Portfolio Intelligence / Actions:** integrate Portfolio Fit, Position Sizing, Exit Risk and final action precedence.
- **V1-8 Thesis / Decisions / Optional AI:** persist owner thesis and reviewed recommendation/decision linkage; AI remains optional and downstream.
- **V1-9 Maintenance / Release:** invalidation/recompute, outage behavior, exact-SHA browser acceptance and recovery rehearsal.

### Proposed acceptance cohorts

Repository documentation will not publish private holding identities. The private acceptance set should use the smallest real Development cohort that covers:
- Core;
- bank/financial;
- pharma/specialized;
- non-financial;
- ETF;
- missing/review-required evidence;
- partial-sale accounting;
- multi-broker/unknown attribution.

Where a genuine Development case does not exist at acceptance time (for example a supported Satellite or a specific final ADD/EXIT condition), use a clearly labelled deterministic fixture instead of misclassifying a real holding.

### Proposed coverage contract

No arbitrary usable-intelligence percentage is frozen before implementation.

The proposal instead freezes:
1. **status coverage:** 248/248 open securities must have an explicit current applicability/readiness state;
2. **equity methodology-state coverage:** 239/239 equities remain explicitly assigned or explicitly blocked/review-required under the canonical authority;
3. **usable intelligence:** every equity counted as READY at release must reach the complete frozen endpoint (identity + applicable method + mandatory evidence/history + deterministic assessments + eligibility/portfolio context + Fit/Sizing/Exit where applicable + persisted advisory action);
4. unsupported, unresolved, stale or blocked securities remain visible in the denominator and never silently become HOLD;
5. the final count/value release threshold is measured from the implemented remediation cohorts before V1 release acceptance, not guessed in Scope Freeze B.

This is a planning contract, not a claim that any non-zero usable-intelligence coverage is currently achieved.

### Effort / dependency proposal

- V1-2: Small–Medium.
- V1-3: Small–Medium to Medium; 239/239 assignment census is reusable.
- V1-4: Large; dominant dependencies are evidence breadth/freshness, 9 sub-252-day history cases, and profile-specific benchmark/readiness rules.
- V1-5: Large; depends on V1-4 accepted inputs and pilot generalization.
- V1-6: Medium.
- V1-7: Large; depends on Fit/Sizing/Exit/action integration.
- V1-8: Medium.
- V1-9: Medium–Large; depends on invalidation, exact-SHA hosted browser proof and recovery rehearsal.

These are engineering ranges, not calendar promises or provider-call estimates.

### Owner decisions required once deployment/browser acceptance is available

1. Approve this bounded V1-2–V1-9 implementation plan and retain the no-sub-gate discipline.
2. Approve the coverage contract above rather than an arbitrary pre-implementation percentage.
3. Approve use of labelled deterministic fixtures for acceptance scenarios that do not exist as genuine READY Development holdings.
4. Approve deferral of the isolated restore rehearsal to **V1-9**, while keeping Baseline Freeze PARTIAL and retaining restore rehearsal as a release requirement.
5. Approve the proposed action semantics and precedence already documented in this file: BUY / ADD / HOLD / REDUCE / EXIT / WATCH, with BLOCKED as readiness rather than investment opinion.

Until exact-current-HEAD Preview and authenticated hosted browser evidence are available, this file remains **INCOMPLETE / OWNER REVIEW NOT READY**. No V1 implementation may start.

---

# PortfolioAI V1 Scope Freeze B and Build Plan — 5 October 2026

**Status:** INCOMPLETE PROPOSAL / OWNER REVIEW NOT READY  
**V1 IMPLEMENTATION:** NOT AUTHORIZED  
**Repository:** drddutta-portfolio/PortfiolioAI  
**Branch:** PortfolioAI-Development  
**Pre-audit source SHA:** `a116cec4ab0939238c02a5480d283a09186b274b`

## 1. Why this is incomplete

The authorized V1-1 audit is complete for available read-only repository and Development-database evidence, but Scope Freeze B cannot yet be honestly presented as ready for approval because four critical proof classes remain incomplete:

1. Development Preview deployment ID/SHA and repository-to-runtime match are unverified.
2. Authenticated browser end-to-end behavior is unverified.
3. Live Cloudflare/R2 runtime/bucket/catalog state and cross-layer recovery compatibility were not independently inspected.
4. A complete 239-equity methodology-route/readiness census has not yet been produced from the current contracts and evidence.

This proposal therefore freezes the build direction and known facts, but it does not authorize V1-2–V1-9.

## 2. Verified environment statement

Verified:
- repository: drddutta-portfolio/PortfiolioAI;
- authoritative branch: PortfolioAI-Development;
- pre-audit HEAD: `a116cec4ab0939238c02a5480d283a09186b274b`;
- Development Supabase: PortfolioAI Dev / `lrgpjimipfkyoqbpsqzz`, distinct from Project-PortfolioAI.

Unresolved:
- Vercel Development Preview deployment/ref/SHA;
- authenticated browser session;
- live R2 target/catalog/binding verification;
- isolated restore proof.

No unresolved item is converted into a PASS by name, historical status, or assumption.

## 3. Development/P8 baseline

Baseline report:
`docs/PortfolioAI_CURRENT_DEVELOPMENT_BASELINE_FREEZE_2026-10-05.md`

Status: **PARTIAL**.

P8 is **PRESERVED / PAUSED FOR FUTURE V2** during V1/V1.1. Existing P8 code/data/docs/manifests are not deleted or rebuilt. P8 Step 1 and Step 2 historical records remain preserved; Step 2's historical feasibility conclusion is NO-GO under its frozen experiment contract. That historical result is not a V1 blocker unless a V1 current-analysis dependency genuinely reuses the same preserved evidence.

## 4. Dated inventory

Measured from verified Development:

| Inventory | Count / value |
|---|---:|
| Open consolidated securities | 248 |
| Equities | 239 |
| ETFs | 9 |
| Other assets | 0 |
| Priced holdings | 248 |
| Unpriced holdings | 0 |
| Total priced market value | INR 2,217,451.55 |
| Priced equity value | INR 2,087,118.51 |
| Priced ETF value | INR 130,333.04 |
| Quantity-complete holdings | 248 |
| Holdings with missing broker attribution | 46 rows |

Current evidence breadth among 239 held equities:
- fundamental observation presence: 114;
- research-document presence: 111;
- current classification: 239;
- persisted recommendations: 1;
- persisted position-sizing assessments: 0.

These counts are evidence presence, not method-ready intelligence coverage.

## 5. Supported/unsupported methodology routes

**Not yet finalizable.**

Application classification covers 239/239 equities, but a complete current methodology-route/readiness census is still required because classification and analytical method are separate authorities. The census must derive each holding's route from the approved versioned contracts, then test mandatory metric, freshness, history, benchmark, engine and action prerequisites.

Until that census exists:
- SUPPORTED count: AUDIT_PENDING
- PARTIALLY SUPPORTED count: AUDIT_PENDING
- UNSUPPORTED count: AUDIT_PENDING
- AMBIGUOUS / UNRESOLVED count: AUDIT_PENDING

No release percentage is inferred from classification coverage alone.

## 6. Acceptance cohort contract

The committed repository must not expose the owner's private holding identities. Therefore the release cohort is defined here by classes and objective selection rules; the exact holding IDs/symbols must be recorded in an owner-private review artifact or local acceptance record when V1 implementation is authorized.

Required real cases, where present:
- supported Core;
- supported Satellite;
- role mismatch;
- high-quality overweight;
- underweight/ADD;
- deterioration/EXIT-review;
- missing evidence;
- conflicting evidence;
- bank/financial;
- non-financial;
- pharma/specialized profile;
- ETF;
- partial-sale accounting;
- multi-broker/unknown attribution.

Selection rule: choose the smallest set of real Development holdings that covers the maximum number of scenarios, using persisted evidence only. If a scenario does not exist, use a labelled deterministic fixture and do not pretend a real holding exhibits it.

## 7. Coverage definitions

Frozen denominators:
- **Equity count denominator:** 239 open equities.
- **Priced equity-value denominator:** INR 2,087,118.51 at the measured snapshot.
- ETFs/non-equities: separate accounting/status coverage; not included in the equity-intelligence numerator or denominator.
- Unsupported and unresolved equity profiles remain in the 239 denominator.
- Unpriced equity treatment: no unpriced equities in this snapshot; future unpriced holdings remain in count denominator with value unknown and a separate price-coverage condition.

Minimum deterministic usable endpoint:
1. canonical identity;
2. approved applicable method;
3. mandatory current evidence and current-analysis history;
4. deterministic stock assessments;
5. Core/Satellite eligibility/role fit;
6. required valuation/market/risk context;
7. portfolio Fit/Sizing/Exit assessment or legitimate method-defined not-applicable state;
8. persisted advisory action with reproducible input/portfolio lineage.

Generic BLOCKED, missing mandatory prerequisites, unsupported routes, or unresolved conflicts do not count as usable intelligence.

**Measured current usable-intelligence baseline:** NOT YET COMPUTABLE because the route/readiness census and integrated action coverage are incomplete.

## 8. Proposed release-threshold method

No arbitrary percentage is frozen yet.

The final minimum release threshold must be derived after the route/readiness census by:
- measuring baseline usable count/value;
- grouping remediable holdings into bounded cohorts;
- estimating count/value gained by each cohort;
- separating engineering work from provider/evidence acquisition;
- proving the resulting target is achievable without weakening evidence standards.

Status coverage must be 100%: every one of the 248 open securities must have an explicit applicable/readiness state, even when equity intelligence is NOT_APPLICABLE or BLOCKED.

## 9. V1-2–V1-9 completion contracts

The ten-gate structure in `PortfolioAI_V1_OPERATIONAL_COMPLETION_PLAN_2026-10-05.md` remains frozen. No new hierarchy of sub-gates is introduced.

- **V1-2 Accounting Integrity:** verify hand-reconciled ledger fixtures, partial sales, close/reopen, multi-broker, corrections, exact decimals, valuation/P&L cross-surface consistency.
- **V1-3 Identity/Classification/Routing:** complete 239-equity route matrix; preserve classification versus research-profile separation; fail closed on ambiguity.
- **V1-4 Evidence/History Readiness:** prove mandatory metric/freshness/history/benchmark readiness per route; acquire only authorized missing/stale evidence.
- **V1-5 Deterministic Investment Engines:** generalize valid pilots and build only genuinely missing engines; preserve independent dimensions and versioned lineage.
- **V1-6 Core/Satellite Eligibility and Movement:** current eligibility first; temporal movement only with adequate prior observations and anti-churn policy.
- **V1-7 Portfolio Intelligence and Actions:** integrate Portfolio Fit, Position Sizing and Exit Risk; preserve trim/reduce versus exit distinction; final advisory actions are portfolio-aware.
- **V1-8 Thesis/AI/Owner Decisions:** minimal owner thesis, immutable recommendation snapshot, owner decision linked to reviewed recommendation; AI optional and downstream.
- **V1-9 Maintenance/Release Candidate:** invalidation/recompute, outage behavior, end-to-end authenticated browser verification, recovery rehearsal and release acceptance.

## 10. Reuse/build/preservation matrix

| Area | Decision |
|---|---|
| Transaction/accounting foundation | REUSE AS-IS unless V1-2 proves a defect |
| Identity/classification | REUSE WITH ROUTE RECONCILIATION |
| Roles/settings/themes | REUSE AS-IS |
| Latest price cache | REUSE WITH FRESHNESS QUALIFICATION |
| Research evidence architecture/provider controls | REUSE / EXTEND |
| Generic Research workspace | REUSE / EXTEND |
| HDFCBANK/reference scoring/recommendation work | GENERALISE PILOT; do not clone stock-specific code |
| Pharma/specialized methodologies | PRESERVE and route through approved contracts |
| Core Health / Exit Risk readiness UI | PRESERVE UI; build missing formal engines |
| Position-sizing contract | GENERALISE PILOT; preserve fail-closed states |
| News | REUSE AS-IS subject to V1-9 runtime validation |
| Optional AI | REUSE as optional explanation only |
| P8/R2 historical replay assets | PRESERVED FOR V2/P8 |
| Historical experiment/backtesting | PAUSED; no V1 expansion |

## 11. Exact V1 blocker/important lists

Source of truth:
`docs/PortfolioAI_V1_OPERATIONAL_BASELINE_AUDIT_2026-10-05.md`

Current classification:
- V1 BLOCKER: 24 capability rows
- V1 IMPORTANT: 21
- V1.1: 4
- NO CHANGE: 7

Key blockers are route/readiness coverage, evidence/history/benchmark sufficiency, generalization/missing deterministic engines, Fit/Sizing/Exit/action integration, maintenance/recovery, and authenticated end-to-end proof.

## 12. V1.1 / V2 / Later placement

V1.1:
- richer monitoring/target/stop alerting;
- temporal movement where current evidence cannot support V1;
- richer theme intelligence;
- broader optional AI enrichment.

V2/P8:
- point-in-time historical reconstruction;
- historical recommendation/strategy replay and evaluation;
- preserved P8 historical data/manifests and backtesting foundation.

Nothing is deleted solely because it is deferred.

## 13. Action-policy proposal

Headline actions:
- BUY: initiate a position only through an approved bounded candidate/watchlist/research path.
- ADD: increase an existing open holding.
- HOLD: maintain exposure under a supported policy; never a fallback for missing data.
- REDUCE: sizing/valuation/concentration/portfolio-fit reduction.
- EXIT: headline advisory action backed by detailed EXIT REVIEW / EXIT CANDIDATE semantics.
- WATCH: supported monitoring conclusion.
- BLOCKED: readiness state, not an investment opinion.

Precedence:
1. unresolved identity/method/mandatory evidence => BLOCKED;
2. explicit severe business/permanent-loss deterioration under approved Exit policy can create EXIT REVIEW/CANDIDATE;
3. portfolio concentration/sizing/valuation concerns can create REDUCE without implying thesis failure;
4. supported positive stock assessment plus portfolio capacity can create ADD;
5. HOLD only when required current evidence and context support maintaining exposure;
6. WATCH is for supported monitoring states where action prerequisites are not triggered.

Frozen holdings/owner constraints must be carried as portfolio context, not overwritten.

## 14. Minimal thesis and recommendation/decision snapshot contracts

Proposed minimal owner-thesis fields:
- thesis text or structured conditions;
- recorded_at;
- optional invalidation conditions;
- optional review date;
- owner identity;
- version/history.

Do not infer an owner's thesis. Missing thesis => THESIS_NOT_RECORDED / REVIEW_REQUIRED, not “thesis intact.”

Recommendation snapshot:
- immutable recommendation ID/version;
- security/portfolio;
- as-of timestamp;
- method/profile versions;
- input/evidence fingerprint;
- stock assessment;
- portfolio context;
- final action and reason codes;
- blocked/contradictory evidence;
- engine version.

Owner decision:
- references exact reviewed recommendation snapshot;
- owner action/decision;
- reason/note;
- decided_at;
- optional next review date;
- never overwrites the recommendation.

## 15. Maintenance/invalidation proposal

Manual and future scheduled refresh must remain cache-first and contract-driven.

Invalidate dependent outputs when accepted inputs materially change, including:
- transaction/accounting state;
- portfolio role/target/frozen settings;
- classification/profile assignment;
- mandatory fundamentals/ownership/valuation;
- accepted market history/benchmark data;
- methodology/policy version.

Provider outage behavior:
- retain last accepted evidence;
- mark stale/unavailable explicitly;
- do not manufacture fresh scores/actions;
- retries must remain bounded through existing budget/lease/usage controls.

Scheduler activation is not authorized by this proposal.

## 16. Effort ranges and dependencies

| Gate | Range | Dependencies |
|---|---|---|
| V1-2 | Small–Medium | Accounting fixtures/browser proof |
| V1-3 | Medium | 239-route census |
| V1-4 | Large | Route census; provider/evidence availability |
| V1-5 | Large | V1-4 readiness; pilot generalization |
| V1-6 | Medium | Current engine outputs; policy |
| V1-7 | Large | Fit/Sizing/Exit engines and action policy |
| V1-8 | Medium | Recommendation snapshot + owner-decision persistence |
| V1-9 | Medium–Large | Maintenance, Vercel/browser access, recovery rehearsal |

These are relative engineering ranges, not calendar commitments.

## 17. Risk register

Primary risks:
- mistaking classification for methodology readiness;
- treating evidence presence as sufficient lookback/freshness;
- turning reference-stock pilots into portfolio-wide claims;
- duplicating business logic across UI surfaces;
- recommendation/sizing dependency cycles;
- HOLD/EXIT generated from missing evidence;
- stale outputs surviving material input change;
- provider refreshes bypassing quota controls;
- loss of P8/R2 work through unnecessary rebuild;
- unproven backup/restore or deployment mismatch;
- committing owner-private holding identities to repository documentation.

## 18. Recovery/rollback requirements

Before release acceptance:
- verify exact deployed Preview SHA;
- verify live Development storage bindings;
- establish code/schema/storage compatibility;
- perform an explicitly authorized isolated restore rehearsal;
- document rollback/migration compatibility;
- prove application starts and reads expected canonical facts after recovery.

No recovery mutation is authorized by this proposal.

## 19. Owner-facing release acceptance

The owner must be able to open the same PortfolioAI application, without technical tools, and determine:
- what is owned;
- honestly qualified value;
- supported assessments and Core/Satellite suitability;
- portfolio risk/concentration;
- recommended action and why;
- missing/conflicting evidence;
- and record a different owner decision against the reviewed recommendation.

## 20. Approval boundary and exact next decisions

**Scope Freeze B is NOT READY FOR APPROVAL yet.**

Before approval, complete:
1. verified Development Preview deployment/ref/SHA;
2. authenticated browser baseline verification;
3. live R2/runtime storage verification sufficient for recovery mapping;
4. 239-equity methodology-route/readiness census;
5. measured baseline usable-intelligence count/value and remediation-cohort projection;
6. private real-security acceptance cohort with persisted scenario evidence;
7. explicit owner review of the resulting release thresholds.

After those are supplied, amend this same file to **PROPOSED / OWNER REVIEW REQUIRED**. Only explicit owner approval after that amendment may authorize V1-2–V1-9 implementation.

No application code, database migration, provider execution, scheduler activation, storage write, main/Production change, or V1 implementation is authorized by this document.


## 21. Evidence-gap closure update — 5 October 2026

**Status remains: INCOMPLETE PROPOSAL / OWNER REVIEW NOT READY.**  
**V1 IMPLEMENTATION remains NOT AUTHORIZED.**

### Closed or materially improved evidence gaps

1. **R2 target/runtime mapping:** verified read-only. `portfolioai-history-dev-api` is bound to `portfolioai-history-dev`; preserved P8 objects/manifests and hashes are present.
2. **Existing Development backup integrity:** verified from live R2 metadata plus the repository workflow contract. The 2026-10-03 encrypted backup exists with manifest, SHA file and PASS completion marker; the workflow performed upload/read-back/decrypt/SHA/`pg_restore --list` validation.
3. **Full current methodology census:** completed. 239/239 held equities have one current P7 IC1 methodology assignment across 45 profile codes.
4. **Current evidence/readiness totals:** completed. 128 INSUFFICIENT, 109 REVIEW_REQUIRED, 2 STALE, 0 READY.
5. **Current usable-intelligence baseline:** measured as **0/239 equities and INR 0 / INR 2,087,118.51 priced equity value** under the frozen minimum V1 endpoint.
6. **Private real-case availability:** measured without publishing identities. Core, ETF, bank/financial, pharma/specialized, non-financial, missing/review evidence, partial-sale and multi-broker cases exist; no owner SATELLITE role was measured and no current READY equity exists.

### Newly proven deployment blocker

Current repository HEAD `224c2889372cb1a8dbecb1f32babf03e6fee064c` maps to Vercel deployment `dpl_3ViT5naRqprmzHxwBfiRrD1LjLXW`, which is **ERROR**:
- error code: `lint_or_type_error`;
- build command: `npm run build`;
- exit code: 2.

The stable Development alias currently resolves to an older READY deployment at SHA `52fb8929bbaa3991256cb4386f4c716c137c0634`.

Therefore current HEAD cannot yet pass authenticated browser acceptance, and the older runtime must not be represented as verification of current HEAD.

### Remediation cohorts and threshold consequence

The current 239-equity denominator divides into evidence cohorts:
- 128 INSUFFICIENT / INR 761,261.55;
- 109 REVIEW_REQUIRED / INR 1,240,361.16;
- 2 STALE / INR 85,495.80.

Common downstream work affects the entire denominator: current V1 engines/actions are not portfolio-wide and no current snapshot is READY.

Therefore no honest non-zero release threshold can yet be derived solely from read-only evidence. A percentage chosen now would be arbitrary. The correct owner-facing conclusion is:

> Current usable-intelligence coverage is 0%. Before a numerical V1 release threshold is proposed, V1-4/V1-5/V1-7 remediation must establish a bounded set of securities that actually reaches the minimum endpoint; the threshold must then be derived from the measured count/value produced by those remediation cohorts.

The denominator remains 239 equities and INR 2,087,118.51 priced equity value at the dated snapshot. It must not be reduced to make the percentage look better.

### Remaining conditions before Scope Freeze B can become review-ready

1. fix or otherwise separately resolve the current Development build/deployment failure and positively verify the resulting exact SHA;
2. perform authenticated browser verification on that exact current Development deployment;
3. establish an explicitly authorized isolated live restore rehearsal, or owner-accept a documented recovery limitation if the release standard is amended;
4. after bounded V1 remediation evidence exists, derive a non-arbitrary minimum usable-intelligence release threshold;
5. finalize private acceptance fixtures for scenarios that do not currently exist as real READY holdings.

The deployment fix is application/runtime work and is **not authorized by this audit task**. The isolated restore is a mutable operation and is **not authorized**. Both require separate owner authorization.

### Revised blocker/reuse position

Current audit priorities are now:
- 23 V1 BLOCKER;
- 21 V1 IMPORTANT;
- 4 V1.1;
- 8 NO CHANGE.

The methodology-assignment census itself is no longer a blocker and should be **REUSE AS-IS**, subject to V1-3 compatibility verification. Evidence readiness remains a V1-4 blocker. Existing P8/R2 assets remain preserved and are not rebuilt.

### Gate effort refinement

- V1-2: optimistic Small; likely Small–Medium; pessimistic Medium.
- V1-3: optimistic Small; likely Medium; pessimistic Medium. The 239/239 assignment census can be reused.
- V1-4: optimistic Medium; likely Large; pessimistic Large+, driven by 128 INSUFFICIENT + 109 REVIEW_REQUIRED + 2 STALE snapshots and 9 equities below 252 daily history rows.
- V1-5: optimistic Medium; likely Large; pessimistic Large+, driven by engine generalization/missing engines.
- V1-6: optimistic Small–Medium; likely Medium; pessimistic Medium–Large.
- V1-7: optimistic Medium; likely Large; pessimistic Large+, driven by Fit/Sizing/Exit/action integration.
- V1-8: optimistic Small–Medium; likely Medium; pessimistic Medium–Large.
- V1-9: optimistic Medium; likely Medium–Large; pessimistic Large, driven by deployment/browser/recovery/invalidation proof.

External provider/evidence delays are not included in engineering effort and remain separately authorization/budget dependent.


## 22. Development build recovery reconciliation — 5 October 2026

Current capability totals are **22 V1 BLOCKER / 23 V1 IMPORTANT / 3 V1.1 / 8 NO CHANGE** across 56 capabilities. They supersede previous totals in this document.

Remote HEAD `94be7ace03f6669edcf98da18b393cd41258e12b` passes the locally reproduced TypeScript/Vite build. Exact-SHA Development Preview and authenticated browser acceptance remain NOT PROVEN; see `PortfolioAI_DEVELOPMENT_BUILD_RECOVERY_2026-10-05.md`. Status remains **INCOMPLETE PROPOSAL / OWNER REVIEW NOT READY**, and V1 implementation remains **NOT AUTHORIZED**.

The earlier statement requiring V1-4/V1-5/V1-7 remediation before proposing release coverage creates a circular approval dependency and is superseded: a review-ready proposal must describe bounded remediation cohorts, count/value estimates, prerequisites and measurable acceptance. Only after owner approval may those gates implement and measure the proposed outcomes. No arbitrary target or forecast is recorded as verified readiness.

Deferral of the isolated restore rehearsal to V1-9 requires an explicit owner decision. Baseline Freeze remains PARTIAL until its outstanding evidence is satisfied; strong backup integrity is not completed restore proof.


### Exact Preview recovery outcome

Development Preview deployment `dpl_5p9Daac7UqGSL8y6qP3dawqF1Hzx` is **READY** at Git SHA `ba8c9e9ddbc0e2658a213af178f0f8922e86639d`, branch `PortfolioAI-Development`, Preview (`target: null`). The stable Development alias resolves to that exact deployment/SHA. This closes the current-branch build/deployment failure; the preserved source at `94be7ace...` required no further application change.

Authenticated hosted browser acceptance is still NOT PROVEN. The local login screen/LOCAL marker renders without page errors but does not establish protected Preview workflow acceptance. A permitted authenticated Development session is the exact missing evidence. Scope Freeze B remains INCOMPLETE / OWNER REVIEW NOT READY until its remaining proposal/acceptance conditions are evidenced. V1 implementation is NOT AUTHORIZED.
