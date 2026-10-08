# Stock research Stages 4 and 5 — Development release

Date: 8 October 2026

**Decision: Stages 4 and 5 merged, published to Development and hosted display verification PASS.**

The owner explicitly requested GitHub publication, Development release and online
display verification after Stage 5 acceptance. PR #117 merged normally into
`PortfolioAI-Development` at `2026-10-08T12:17:40Z`, merge commit
`1db4eed499c4920c60c0abc4e6a50c9628e2accb`.

Development URL:
https://portfiolio-ai-git-portfolioai-development-dibyendu-dutta.vercel.app

## Published artifact and source equivalence

The automatic merge build and one normal API build request were rejected by
Vercel's daily free deployment limit (`api-deployments-free-per-day`, more than
100; retry after 24 hours). An existing READY Preview build already contained the
exact merged source: deployment `dpl_6v1mxijEWaoky6jAG3YniiVB1e25`, URL
https://portfiolio-ohi5sgiue-dibyendu-dutta.vercel.app, source commit
`1b47a5df59e34989c83aff5ba55af9e9d8a68dcf`.

That source commit and the Development merge have identical full Git file trees:
`81e952ed503fef9371450590c1835e3e67a439b2`. `git diff` between them is empty.
The source build is in the existing PortfolioAI project
`prj_Vp1QUuF63cnfuAl8ULYuHW44EbXU`, remains a Preview deployment, and uses the
review branch's approved Development-equivalent public Supabase configuration.
The Development alias was assigned normally to that existing build. The former
alias deployment was `dpl_C7RXQNHLnZ77KNdEyTY2X5cZ2u5t`, retained for rollback.
The deployed metadata still names the review source commit; it is not described
as a fresh build of the merge SHA. No new build quota, billing, project,
authentication/protection or Production setting was changed.

## Integrated checks

Before merge, current Development changes were integrated into the review branch.
One Development Status documentation conflict was resolved by preserving both
stock-page and operational ownership records. The newer ownership validator and
canonical materializer remained intact with Stage 4's shared metadata refactor.

- **171 tests / 9 files PASS** on the integrated branch, including the page/context/result guards and current ownership/normalization tests.
- Production TypeScript/build, architecture boundary guard, changed application lint, changed shared Edge/materializer lint and whitespace checks **PASS**.
- Earlier Stage 5 acceptance: 224 relevant tests and 1,424 hosted checks passed; those remain separately scoped in the Stage 5 record.
- GitHub job `113304578396` had no runner and no steps; its billing/spending-limit failure supplies no code verdict. No required check or branch protection was disabled and no administrative merge override was used.
- Full repository suite acceptance remains incomplete; Deno integration remains unrun because Deno is unavailable locally. These limits are retained rather than relabelled passing.

## Hosted Development verification

Authenticated read-only Chromium verification ran at the Development alias after
publication. **216 checks PASS** across HDFCBANK, TORNTPHARM, ALIVUS, AUROPHARMA,
BIOCON, AKUMS and ABCAPITAL at desktop width 1440; HDFCBANK, TORNTPHARM and AKUMS
were checked at mobile width 390. Checks cover all five Pharma primary contracts,
exact snapshot/assignment lineage across result tabs/Evidence, source qualification,
expanded specialist grids, complete name/result wrapping and sticky Summary
navigation. Runtime errors, provider refresh attempts, research writes and ordinary
REST read failures were all zero. HDFCBANK desktop and TORNTPHARM mobile screenshots
were inspected privately. No localhost rendering, private screenshot or browser
authentication artifact is committed.

[Sanitized Development verification](research-ui-sector-review-evidence/stock-research-stages-4-5-development-release-2026-10-08.json)
records the alias, published deployment, build source and merge/tree equivalence.
The release-record follow-up changes documentation only; it does not change the
published application or require a new build.

## Release boundaries

This publishes the common Industry-first shell and contract-bound specialist
results for stock research. It does not certify official classification parentage,
Basic Industry mappings, specialised evidence completeness or qualified scores
and advice. Those C1/C8 and research gates remain open. Owner settings and original
research/assignment history remain intact.

No migration, Supabase Edge-function deployment, provider refresh/ingestion,
research data write, scheduler activation, Auth/RLS change or Production release
was performed. Operational V1-4 ownership runtime activation remains separate;
committing its already-merged Development source is not deploying or executing
that materializer.
