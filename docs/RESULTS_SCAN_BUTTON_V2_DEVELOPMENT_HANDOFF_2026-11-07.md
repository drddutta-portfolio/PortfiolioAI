# Results Scan Now V2 — Development integration checkpoint (7 November 2026)

## Verified original-source financials
- RELIANCE Q2 FY27: independently selected three consolidated NSE originals, ₹332,861 Cr Revenue, ₹29,550 Cr total PAT, ₹18.88 diluted EPS. Independent pilot PASS: https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/42359813629. Authenticated Development Results readback showed Q2 FY27 Strong company-trend grade, but NOT as the result of a button click.
- ADANIPORTS Q2 FY27: independently selected three consolidated NSE observations, ₹11,340.40 Cr Revenue, ₹3,682.44 Cr total PAT, ₹15.72 diluted EPS. Repeated source acquisition inserted ZERO duplicates. Pilot PASS: https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/42360570230.

## Feature implementation: isolated branch, not live
- Owner-authenticated Supabase scanner V2 prepares transaction-derived cohort, durable job and per-stock progress, secured GitHub push-request dispatch to an isolated Development-only branch.
- Browser Run Scan Now now invokes START and polls STATUS rather than running legacy cached STEP loops. Successful completion reloads selected financial observations and existing R5 analysis without altering the approved UI.
- Development worker consumes an opaque run ID; existing official-source collector and independent R4 verifier supply source acquisition and canonical source selection. Four rolling completed quarters; unchanged/rejected/failed states preserved.
- BSEIndiaApi is still a separate review-only discovery adapter, not the live V2 source path. Never claim the live scan is BSE-primary until explicitly integrated and verified.

## Blocking release conditions
1. Supabase Development has exactly 100 deployed functions; attempt to deploy an additional results-quarterly-scan-v2 slug failed at quota with PaymentRequiredException. The branch has been switched to the *existing* results-quarterly-scan slug so an in-place deployment is possible without increasing count.
2. Verify a restricted GitHub Contents token exists as a server-side Supabase Edge Function secret named RESULTS_SCAN_GITHUB_CONTENTS_TOKEN, scoped to the Development request marker only. Do not expose tokens to frontend or logs. Without this the live dispatcher returns 503, and must not replace the currently deployed scanner.
3. Do not deploy until reviewed frontend, protected worker branch, worker dispatch credentials and robust concurrency are ready. The worker must have no ability to rewrite production workflow code or core financial facts except via existing qualified selectors.
4. Complete an authenticated real button click on the deployed Development page, prove it triggers the GitHub worker, verify a new official-source company result, R5 analysis and visible UI change, then click again and independently prove zero duplicate financial rows or source selections.

## Testing and status
- Simulated React click, queued status, partial/failed error surfacing, completed-refresh and R5 presentation tests passed locally in isolated GitHub CI; typecheck, architecture guard, Python parser regressions, syntax and bundle checks passed.
- Separate live Adani original-source ingestion + repeat-run and Reliance verification passed, but the complete Run Scan Now button acceptance remains NOT DONE.
- No Production/main deployment, schema change, data deletion, or existing Edge Function replacement.