# PortfolioAI Current Development Baseline Freeze — 5 October 2026

**Repository:** drddutta-portfolio/PortfiolioAI  
**Branch:** PortfolioAI-Development  
**Capture date:** 2026-10-05  
**Status:** PARTIAL  
**Source commit:** a116cec4ab0939238c02a5480d283a09186b274b  
**Purpose:** Preserve the current Development build as a recoverable reference before any V1 implementation.

## 1. Authorization and boundaries

This report was produced under the owner-authorized Current Development Baseline Freeze + V1-1 Operational Audit task. Inspection was read-only except for documentation commits to PortfolioAI-Development. No application code, migration, scheduler, provider campaign, Production/main, runtime configuration, backup creation/restore, or storage write is authorized or performed.

Canonical authority remains the order in AGENTS.md. Scope Freeze A remains frozen. The Versioned Build and Baseline Preservation Plan owns preservation/cumulative version sequencing; the V1 Operational Completion Plan owns the ten V1 gates.

## 2. Verified environment context

| Target | Verified state | Evidence / limitation |
|---|---|---|
| Git repository | VERIFIED | drddutta-portfolio/PortfiolioAI, branch PortfolioAI-Development |
| Remote Development source SHA | VERIFIED | Pre-audit HEAD: `a116cec4ab0939238c02a5480d283a09186b274b`; first audit documentation commit: `af4e367c17b6d009f9838fb8f6dd9130f93acaaf` |
| Supabase Development | VERIFIED | PortfolioAI Dev, ref `lrgpjimipfkyoqbpsqzz`, ACTIVE_HEALTHY |
| Other PortfolioAI Supabase project | SEPARATE / NOT USED | `uxiyufbsbgzzdujzcdxe` (Project-PortfolioAI) |
| Vercel Development Preview | NOT VERIFIED | Connected Vercel context returned no accessible teams/projects; no deployment ID/SHA is inferred |
| Cloudflare R2 | PARTIALLY VERIFIED FROM REPOSITORY/HISTORICAL RECORDS | Runtime bucket/binding and prior backup/storage remediation are documented, but this audit has no live Cloudflare connector inspection |
| Authenticated browser | NOT VERIFIED | No positively verified authenticated Development Preview target was available to this audit |

A branch name is not treated as environment isolation. Live Development database inspection below used only the positively verified PortfolioAI Dev project.

## 3. Dated Development inventory

Read-only Development snapshot on 2026-10-05:

- 248 consolidated open securities / 248 distinct open holdings.
- 239 equities.
- 9 ETFs.
- 0 other open asset classes in the measured snapshot.
- 248/248 holdings have a cached latest price.
- Priced market-value subtotal: **INR 2,217,451.55**.
- Oldest latest-price observation among the currently selected cache rows: 2026-09-22 15:50:00+00.
- Newest latest-price observation: 2026-10-05 13:57:17+00.
- Latest retrieval timestamp: 2026-10-05 08:27:17.615+00.
- 248/248 open holdings are quantity-complete.
- 46 current-holding rows carry missing broker attribution.

Because all 248 open holdings were priced in this snapshot, the measured priced subtotal is not reduced by an unpriced holding. This does not by itself prove every accounting/P&L field or every price is equally fresh.

## 4. Repository/code preservation state

The repository contains one application with shared canonical-authority contracts and cumulative historical work. Current Development includes:

- transaction-ledger and accounting foundations;
- canonical securities/identity/classification and enrichment;
- owner portfolio roles/settings/themes;
- cached latest-market data and market-history structures;
- research raw/normalized evidence structures and provider-control plane;
- research workspace and Dashboard/Intelligence consumer surfaces;
- deterministic scoring/recommendation reference implementations;
- D35 position-sizing contract/storage structure;
- NSE News pipeline;
- P7 evidence snapshot structures;
- P8 historical identity/universe/evidence/data-foundation artifacts;
- Cloudflare/R2 historical-data runtime work;
- extensive deterministic tests, architecture guard and stage-specific verification records.

The repository is preserved in place. No completed work is retired merely because its release target is later.

## 5. Completed-history preservation

The following are preserved, not reopened or rewritten by the V1 roadmap:

- Programs A-D: historical completion records preserved.
- P0-P7 and P7-IC: historical completion records preserved.
- P8/P8-B work: preserved for future V2/P8 resumption.
- P8 Step 1: COMPLETE / PASS / CLOSED.
- P8 Step 2 full historical feasibility census: COMPLETE / PASS / CLOSED; research feasibility NO-GO; 121,956 historical identity/date pairs, 4,524 historical identities, 32 decision dates, 29 supported routed pairs, 0 complete-input pairs.
- NIFTY 500 TRI, corporate-action, historical market-data, R2/storage-remediation, taxonomy/classification, methodology/profile, readiness and replay artifacts remain retained.
- P8 historical replay blockers are not converted into unrelated V1 blockers.

## 6. Development database inventory

The verified Development project contains current-application and preserved historical structures including:

- `transactions`, `current_holdings`, accounting correction/event structures;
- `securities`, `security_listings`, identity/classification/reconciliation structures;
- `portfolio_security_settings`, `themes`, `theme_securities`;
- `market_price_latest`, `market_price_history`, market-data mapping/provider controls;
- `fundamental_observations`, `research_documents`, raw/evidence/freshness structures;
- scoring/recommendation/profile structures;
- `position_sizing_assessments`;
- P7 evidence snapshot tables;
- P8 historical-universe, identity, archive, B3/B4/B5/B6 structures.

Migration history was inspected read-only and includes the September baseline/reconciliation migrations plus P7/P8 migrations through 2026-10-03. No migration was generated or applied by this audit.

Current held-equity evidence breadth measured from Development:
- fundamental observations: 114 / 239 held equities;
- research-document records: 111 / 239;
- legacy/current `market_price_history` security coverage: 239 / 239, but required lookback/benchmark sufficiency is not established merely by presence;
- persisted stock recommendation runs: 1 / 239;
- persisted position-sizing assessments: 0 / 239;
- persisted stock-score runs in `stock_score_runs`: 0 / 239 at this snapshot;
- current application classification: 239 / 239;
- explicit reviewed/active/verified scoring-profile assignment rows: 4 held equities; this is not equivalent to all application routing because some routing is code/classification-derived.

## 7. Storage and recovery

Preserved repository history documents the R2 storage remediation and completed database backup workflow. P8 bulk historical data is intentionally externalized from PostgreSQL where the approved R2 architecture requires it.

Recovery status remains **PARTIAL** because:
- this audit did not create a new backup;
- no isolated restore rehearsal was authorized or performed;
- a backup listing is not restoration proof;
- Vercel deployment SHA and live Cloudflare bucket/binding metadata were not independently verified in this audit;
- code, database and storage were not captured atomically.

A separate mutable approval is required before creating a fresh backup, tag, export, or restore rehearsal.

## 8. Methodology/research preservation

Preserve separation of:
1. application classification;
2. research/scoring profile authority;
3. specialized subprofiles;
4. evidence readiness;
5. deterministic scoring/action policy.

Approved/specialized methodology work, including PHARMA_V1 and its subprofiles, is retained. An approved methodology does not make every routed holding evidence-ready. Portfolio-wide current-profile readiness remains incomplete and is addressed in the V1-1 audit.

## 9. Integrations preservation

Preserved controls include cache-first reads, provider usage accounting, reservations, leases/cooldowns/kill-switch concepts, identity checks and fail-closed evidence handling. Normal application browsing must not silently trigger provider quota use.

No Trendlyne, Angel One, paid AI, NSE acquisition, or other provider refresh/campaign was executed by this audit.

## 10. UI preservation

The existing shell/navigation and the Dashboard, Holdings, Portfolio Structure, Research, Intelligence, Transactions, Import and Settings surfaces are preserved. Existing readiness-only cards are preserved as UI assets and must not be misclassified as completed engines.

Deployment/browser behavior is separately unverified because a positively verified accessible Development Preview target was unavailable.

## 11. Capability Preservation Matrix

| Capability/workstream | Current evidence/status | Canonical owner | Earliest need | Disposition | Reuse/preservation action | Risk if altered |
|---|---|---|---|---|---|---|
| Transaction ledger/accounting | Implemented; current_holdings 248 | Transactions/accounting services | V1 | ACTIVE IN V1 | Reuse; verify edge fixtures in V1-2 | Financial correctness |
| Security identity | Canonical security master and reconciliation structures | Security identity authority | V1 | ACTIVE IN V1 | Reuse | Cross-app identity drift |
| Current classification/enrichment | 239/239 equities classified in current view | Shared classification authority | V1 | ACTIVE IN V1 | Reuse; audit route semantics | Taxonomy drift |
| Roles/settings/themes | Implemented owner controls | Portfolio settings/theme authorities | V1 | ACTIVE IN V1 | Reuse | Owner intent mutation |
| Latest market price | 248/248 open holdings priced | Market-data cache | V1 | ACTIVE IN V1 | Reuse; qualify freshness | Misvaluation |
| Research evidence architecture | 114/239 fundamentals; 111/239 docs | Canonical evidence repositories | V1 | REUSED / EXTENDED IN V1 | Expand only approved current evidence | Unsupported recommendations |
| Scoring/recommendation pilots | Reference implementation; recommendation persisted for 1 equity | Versioned deterministic engines | V1 | REUSED / EXTENDED IN V1 | Generalise valid pilot; do not clone stock-specific logic | False portfolio-wide completion |
| Position sizing | Contract/storage present, 0 persisted assessments | Deterministic sizing engine | V1 | REUSED / EXTENDED IN V1 | Generalise pilot/contract after readiness | Fabricated advisory output |
| Core Health / Exit Risk surfaces | UI/readiness exists; formal engines incomplete | Future deterministic engines | V1 | REUSED / EXTENDED IN V1 | Preserve UI, build missing engine only | UI impersonating engine |
| News | Automated/cached architecture preserved | News repository/pipeline | V1 | ACTIVE IN V1 | Reuse cache-first | Provider/runtime coupling |
| Optional AI interpretation | Reference/pilot evidence | Explanation layer | V1 | REUSED / EXTENDED IN V1 | Keep optional and downstream | AI overriding calculations |
| Alerts/target-stop enhancements | Deferred | Monitoring contracts | V1.1 | ACTIVE OR EXTENDED IN V1.1 | Preserve hooks/settings | Scope creep |
| P8 historical universe/replay | Extensive preserved assets; current replay feasibility NO-GO | P8 historical authorities | V2 | PRESERVED FOR V2/P8 | Freeze in place; no expansion | Loss of expensive historical work |
| R2 historical storage architecture | Preserved | R2 manifests/runtime | V2/current dependencies where approved | PRESERVED FOR V2/P8 | Reuse only genuine current dependencies | Data loss/duplication |
| Historical backtesting/strategy evaluation | Paused | P8 | V2 | PRESERVED FOR V2/P8 | Resume only after post-V1.1 owner review | Distracts V1 critical path |

No capability is classified obsolete solely because it is deferred.

## 12. Recoverability assessment

**Baseline status: PARTIAL.**

What is recoverable/evidenced:
- current source branch and repository content;
- verified Development Supabase project;
- current schema/migration inventory;
- measured holdings/pricing/evidence inventory;
- preserved P8/R2 historical documentation and structures;
- existing backup workflow/history references.

What prevents COMPLETE:
1. Development Preview deployment ID/SHA is unverified;
2. live R2 bucket/binding/catalog state was not independently inspected;
3. no authorized restore rehearsal proves database/storage recovery;
4. authenticated browser end-to-end behavior is unverified;
5. code/database/storage captures are not atomic.

## 13. Baseline rule going forward

V1, V1.1, V2/P8 and later versions are cumulative upgrades of this preserved Development line. Valid existing work must be reused, extended or preserved. Replacement/retirement requires evidence, migration/recovery implications and owner approval.


## 14. Evidence-gap closure update — 5 October 2026

### Development deployment

Repository HEAD was reverified as `224c2889372cb1a8dbecb1f32babf03e6fee064c`.

Vercel project `portfiolio-ai` / `prj_Vp1QUuF63cnfuAl8ULYuHW44EbXU` is the intended Vite project. The current Development deployment for repository HEAD is:

- deployment: `dpl_3ViT5naRqprmzHxwBfiRrD1LjLXW`
- branch: `PortfolioAI-Development`
- SHA: `224c2889372cb1a8dbecb1f32babf03e6fee064c`
- state: **ERROR**
- error: `lint_or_type_error`
- build message: `npm run build` exited with 2.

The stable Development branch alias `portfiolio-ai-git-portfolioai-development-dibyendu-dutta.vercel.app` is associated with an older READY deployment `dpl_5hAVfPT5XrSojEH9wnRLkqAMP8i6` at SHA `52fb8929bbaa3991256cb4386f4c716c137c0634`.

Therefore:
- REPOSITORY VERIFIED: yes;
- DEPLOYED CONFIGURATION VERIFIED: yes, including the mismatch;
- BROWSER VERIFIED: no;
- repository HEAD is **not** the currently working Development runtime.

No deployment or runtime change was authorized or made.

### Cloudflare R2 / storage

Read-only Cloudflare inspection verified:

- Cloudflare account: one authorized standard account;
- Development bucket: `portfolioai-history-dev`, APAC, Standard;
- runtime Worker: `portfolioai-history-dev-api`;
- runtime Worker R2 binding: `HISTORY_BUCKET -> portfolioai-history-dev`;
- Worker allowed Development origin includes the stable PortfolioAI Development Vercel alias;
- backup Worker binding: `BUCKET -> portfolioai-history-dev`;
- preserved P8 B2 Parquet partitions/manifests and hashes are present in the bucket;
- current Development backup prefix exists under `portfolioai-backups/development/database/manual/2026-10-03T14-42-12Z/`;
- encrypted backup object size: 43,118,448 bytes;
- backup version metadata: `PORTFOLIOAI_DEV_FULL_DB_R2_V1`;
- encrypted object SHA-256 metadata: `f1990ea4efc3f88566d28d413decbc3bb53f28bc54cdf2039bdf7b6d6f0bf9ec`;
- `manifest.json`, encrypted SHA file and `COMPLETE.json` are present.

Repository backup workflow evidence proves that this backup process:
1. targets Development ref `lrgpjimipfkyoqbpsqzz`;
2. refuses a different R2 bucket;
3. creates a PostgreSQL custom dump;
4. verifies `pg_restore --list`;
5. encrypts with AES-256-CBC/PBKDF2;
6. uploads to R2;
7. performs full encrypted read-back with SHA-256 and size verification;
8. decrypts the R2 read-back;
9. verifies the plaintext dump SHA-256;
10. re-runs `pg_restore --list`;
11. writes a PASS completion marker.

This is strong backup-integrity evidence, but it is still not a full restore into an isolated live PostgreSQL target.

### Recovery conclusion

Baseline status remains **PARTIAL** because:
- current Development Preview HEAD does not deploy successfully;
- authenticated browser acceptance against HEAD is impossible while that deployment is broken;
- no isolated live restore rehearsal has been authorized/performed;
- the preserved database backup predates the present documentation HEAD and code/database/storage were not captured atomically.

### Separate isolated-restore proposal — NOT EXECUTED

If separately authorized, restore validation should use a disposable Development-only Supabase/PostgreSQL target with no Production binding.

Proposed operation:
1. positively identify the disposable project/ref;
2. retrieve the exact encrypted backup `PORTFOLIOAI_DEV_FULL_DB_R2_V1` from the verified R2 key;
3. verify encrypted SHA-256 and manifest;
4. decrypt locally in the authorized runner;
5. verify plaintext dump SHA-256 and `pg_restore --list`;
6. restore into the disposable target only;
7. verify migrations/schema, row-count invariants, canonical views/functions and a bounded read-only application smoke check;
8. record recovery evidence;
9. destroy/retire the disposable target only under its separate cleanup authorization.

Expected effects: creation/restoration of a disposable database only; no Production effect. Cost depends on the selected disposable Supabase target/branch and must be obtained/approved before creation. Rollback is deletion/retirement of that disposable target. This proposal is documentation only.
