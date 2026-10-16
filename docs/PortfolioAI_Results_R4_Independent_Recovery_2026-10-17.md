# R4 independent historical recovery — 17 October 2026 (IST)

The owner authorized continuing through every unresolved company-quarter after individual failures, with the approved Results UI fixed. This is an ingestion/controller change on PortfolioAI-Development only.

## Behavior

- NSE errors are isolated by filing and catalog year. A missing original, invalid XML, rejected identity, failed storage read or failed DB write does not skip later originals/quarters. The failed transaction is rolled back; prior commits and originals remain.
- BSE isolates every attachment retrieval/extraction failure. OCR isolates each retained original and quarterly slot. Native OCR runs in a child process with a 180-second per-original timeout; timeout/worker errors return the original to review/retry and the parent queue continues.
- Stable security/request hashes assign NSE, BSE, OCR and Trendlyne work independently of the shrinking cohort. Successful evidence is reused; missing data is never fabricated.
- Trendlyne attempts every assigned request, records failures and finishes the batch before reporting partial failure. The fresh-call bound is 40 per shard/run; cached successful requests do not consume that bound. Provider controls continue to enforce the owner's 1,000/day and 10,000/month limits. Captures are review evidence, not automatically selected financial results.
- The controller checks every ten minutes and rotates NSE, BSE, OCR and Trendlyne. A no-gain pass does not end monitoring. Normal repeat cooldowns are six hours for original-source paths and 24 hours for successful Trendlyne captures. Partial failed passes retry after 30 minutes for the first three failures, then back off six hours; failed dispatches defer 30 minutes while other sources remain eligible.
- Per-source workflow queries prevent unrelated CI runs hiding a collector. Active collectors are not duplicated. Checkpoints and retry state carry across bounded five-hour controller cycles, for at most 28 cycles; completion requires zero verified historical gaps, while the 18 deferred R3 gaps remain separate.
- OCR resolves the latest successful BSE artifact inventory rather than a hard-coded first run. New push revisions replace old monitor/OCR runs; scheduled continuations retain workflow concurrency locks.

## Canonical ownership and security

Canonical financial observations remain in fundamental_observations, and existing protected decisions in fundamental_source_decisions remain authoritative. The existing independent R4 verifier checks original R2 hashes, issuer identity, dates, scope, units, full source trios and conflicts before selecting any new source. No financial formulas, UI files, Production/main, RLS policies, schema or migrations changed.

Development discover-trendlyne-capabilities version 14 is deployed. The R4 route still verifies the native GitHub OIDC RS256 signature, exact repository ID/name, Development ref, workflow path, audience, issuer and JWT lifetime; only signed push and workflow_dispatch events from that exact workflow are allowed. Retry operation IDs include run_attempt. Native user-session/portfolio ownership authentication remains unchanged. The gateway's existing verify_jwt=false setting is now recorded in config.toml because both routes authenticate internally. Provider requests have bounded timeouts and retain usage/budget accounting.

An initial deployment attempt was not executed because automatic approval review hit a usage limit. After its stated retry time, the same deployment passed review and succeeded; no alternate deployment bypass was used.

## Files

Collectors: scripts/results/r4-nse-lineage-batch.py, r4-bse-historical-batch.py, r4-ocr-retained-batch.py and r4-trendlyne-history.py. Controller: r4-recovery-monitor.py and shared r4_recovery_queue.py. Tests: test_r4_recovery_queue.py, test_r4_nse_failure_isolation.py and test_r4_workflow_identity.mjs. Workflows: results-r4-nse-lineage-recovery.yml, results-r4-retained-ocr-recovery.yml, results-r4-trendlyne-history.yml, results-r4-recovery-monitor.yml and results-r4-retry-validation.yml. Edge: _shared/results-r4-trendlyne-history.ts, _shared/r4-workflow-claims.ts and supabase/config.toml. Development Status records the implemented state.

## Validation and remaining work

Twenty queue/controller/timeout regressions, six collector-loop integration regressions and two workflow-claim tests pass locally (28 total). Integration tests replace transport/storage/DB boundaries; financial qualification rules are not weakened. Syntax, workflow-output-reference, whitespace and changed Edge lint checks pass. Development validation run 38966656223 passed architecture, TypeScript, application lint, Edge lint, production build and the then-current retry regressions. Run 38966944840 also passed with bounded OCR. Final cooldown-inclusive validation run 38967199873 passed all 28 retry/authentication regressions, architecture, TypeScript, application lint, Edge lint, production build and whitespace checks.

NSE recovery run 38965745908 completed all eight shards and independent verification: 1,959/2,096 qualified; 119 historical gaps plus 18 deferred R3 gaps remain. No gain is claimed from merely captured or rejected candidates. Trendlyne run 38965763063 is progressing through all 16 shards, and its completed shard 1 attempted all five planned requests successfully. The current monitor is run 38967183009; collection and readback continue asynchronously.

The broader repository run 38965607687 passed architecture/typecheck/lint/Edge lint, then recorded 2,344 passing tests and the same nine previously known Results UI/registry failures. Its test failure prevented that workflow's later build, so the separate successful retry-validation build is the build evidence. Fixing those UI assertions is outside this fixed-UI recovery change.

R4 remains PARTIAL. Repeated collection does not itself repair missing issuer lineage, unsupported source formats or conflicting originals; those remain explicit review/engineering work. The queue must never count unavailable or review-only data as a verified result.


## 2026-10-17 IST — verified R4 source-schema and issuer-rename repair

R4 remains PARTIAL, but real verified data has advanced: the historical backlog decreased from 119 to 83 (36 company-quarters recovered). Independent Development readback run 38973141578 verifies 1,995 / 2,096 slots (95.2%): QUALIFIED 1,995, MISSING 90, CONFLICT 10, REVIEW_REQUIRED 1. The 101 unresolved slots comprise 83 historical R4 slots and the unchanged 18 deferred R3 slots. Candidate captures are not counted as qualified results.

The principal acquisition bug was the NSE integrated catalog's legal-name field: integrated records use smName, whereas legacy records use companyName. The R4 bridge now selects the field by explicit schema, rejects conflicting identity fields and still proves the canonical ISIN/BSE code against both BSE endpoints and the retained original XML. R4 discovery now includes explicit INDAS, BANKING, NBFC_INDAS and GI originals and uses a versioned catalog cache to avoid replaying prior empty filtered catalogs. This first verified pass recovered 30 quarters (run 38971314437).

The exact-quarter parser now recognizes original ProfitLossForPeriodBeforeMinorityInterest as an explicit reported PAT label, rejecting contradictory PAT labels. STARHEALTH uses the original earned-premium, after-tax profit and combined after-extraordinary diluted EPS fields, without substituting written premiums or pre-extraordinary EPS. Independent original-source replay uses the same supported labels. This recovered five additional quarters (run 38972182355).

Source-pinned official rename evidence supports historical/current issuer linkage only before the documented effective date. The typed proof binds old/new legal names and tickers, exact BSE identity and the retained authority PDF hash. The verifier independently reopens the private original authority PDF, validates the identity/date and replays original financial facts before selection. One additional quarter passed (run 38973141578). Unavailable/non-PDF authority responses are rejected; no aliases, missing values, EPS adjustments or financial facts are inferred. Validated authority PDFs are retained immutably in private Development R2 for idempotent retries. Follow-up replay run 38974576073 is in progress; no further gain is claimed pending readback.

Detailed source/issuer recovery traces and original documents remain in private Development R2 and canonical DB provenance. Public workflow output is restricted to anonymous aggregate categories/counts, with no per-company financial artifact uploads. Failed companies/sources remain isolated so other slots continue. Existing ten-minute monitor 38967183009 remains bounded, with source cooldowns and Trendlyne budget controls; monitoring alone does not fix parser or identity-proof failures.

Validation run 38973235964 passed 62 targeted tests, architecture, TypeScript, application lint, Edge lint, production build and whitespace checks. Local changed Python modules also compile. The broader repository workflow still has nine pre-existing Results UI/registry test failures (2,344 other tests pass); these have not been hidden or altered.

Scope: PortfolioAI-Development, Development Supabase and Development R2 only. No UI, main/Production, schema, migrations, RLS, holdings/accounting formulas or investment-action behavior changed. Original facts remain immutable; accepted protected decisions are preserved. R4 is not complete, and unresolved source conflicts/identity/quarter/scope cases remain explicit.
