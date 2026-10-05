# PortfolioAI Versioned Build and Baseline Preservation Plan

**Date:** 5 October 2026
**Repository:** drddutta-portfolio/PortfiolioAI
**Target branch:** PortfolioAI-Development
**Status:** FINAL PROPOSED VERSIONED DEVELOPMENT PLAN / OWNER REVIEW REQUIRED
**Current Development Baseline Freeze:** REQUIRED / NOT YET EXECUTED
**Next readiness:** baseline freeze + V1-1 audit after owner authorization and applicable target verification
**Scope Freeze B:** PENDING
**V1 implementation / Production:** NOT AUTHORIZED

## 1. One PortfolioAI, cumulative upgrades

Later PortfolioAI versions are cumulative upgrades of the frozen Development baseline and earlier approved versions. Existing completed work must be reused, extended or preserved wherever valid. A capability must not be deleted, replaced, duplicated or rebuilt merely because it belongs to a later product version.

The roadmap is:

CURRENT DEVELOPMENT BASELINE FREEZE → V1 → V1.1 → POST-V1.1 OWNER REVIEW → V2/P8 RESUMPTION → LATER VERSIONS.

This is one product, application shell, canonical authority model and evolving storage architecture. Version labels select delivery/acceptance scope; they do not create separate applications, duplicate financial engines, competing research workspaces or independent truths.

A preserved baseline is a recoverable reference, not a new product branch and not a ban on approved subsequent Development changes. Normal development continues through reviewable, compatible upgrades.

## 2. Document ownership and limits

This umbrella document owns the proposed baseline-preservation policy and cumulative version sequencing. The [V1 Operational Completion Plan](PortfolioAI_V1_OPERATIONAL_COMPLETION_PLAN_2026-10-05.md) owns the detailed ten V1 gates, audit register, coverage proposal, action/thesis contracts, maintenance and release checks.

Both are subordinate to [Scope Freeze A](PortfolioAI_V1_V2_PRODUCT_SCOPE_FREEZE_2026-10-05.md) and the exact AGENTS.md canonical authority order. This plan cannot override Blueprint, Research, SSOT, Database, Development Rules or Product/UI specifications.

Do not duplicate the ten gate contracts here. The baseline inventory and recovery evidence are one prerequisite/reference package used by V1-0 and V1-1, not a new hierarchy of delivery sub-gates.

This amendment changes planning only. No baseline capture, tag, backup, restore, runtime inspection, provider execution or implementation is performed by creating this document.

## 3. Current Development Baseline Freeze contract

### Purpose and completion

Establish the authoritative recoverable PortfolioAI state immediately before V1 implementation. Preserve what exists—including later-version assets—and identify what is immediately reusable.

**Current status: NOT YET EXECUTED.** A previously inspected commit, historical completion label, existing backup name or unverified bucket is not a completed freeze.

Maintain one baseline manifest with:
- unique baseline identifier, capture time and source commit;
- code, deployment, database and storage references, each with its own timestamp;
- checksum/version identifiers and evidence links;
- explicit available, missing, partial and unverified components;
- current capability preservation matrix;
- recovery instructions and verification results;
- target/environment mapping and known blockers;
- owner acceptance and any approved exclusions.

Capture after positive target verification and before implementation. Record source/data cutoffs and any changes during capture; a non-atomic snapshot must disclose consistency limitations. Reconcile the manifest before claiming a coherent baseline.

Completion requires: exact code reference is recoverable; relevant schema/data/assets are recoverable to the extent required by accepted scope; status and ownership are inventoried; code/schema/storage compatibility is recorded; recovery has adequate verified evidence. Mark PARTIAL when evidence exists but required recovery/inventory items remain open. Owner review cannot turn an unverified asset into verified evidence.

A new backup, tag, snapshot export or isolated restore is an operation requiring its own applicable authorization. Existing immutable backups/manifests may be referenced if verified adequate. Never create or copy secrets into the manifest.

### A. Repository and deployed build

Record:
- exact remote PortfolioAI-Development SHA and authoritative branch;
- existing relevant tags and release refs; do not invent or move tags;
- separately verified Development Preview deployment ID/ref/SHA;
- current modules/services/components and canonical repository access paths;
- tests/contracts and known build/deployment limitations;
- working, pilot, partial, blocked, readiness-only and incomplete capabilities.

The existing V1 plan's SHA is dated planning evidence, not the future frozen SHA. Remote HEAD and deployed Preview must remain separate fields. Store a secure recoverable source reference; do not assume a movable branch is sufficient archival protection.

### B. Completed history

Index existing authoritative records for Programs A–D, P0–P7/P7-IC, completed P8/P8-B/universe work, NIFTY 500 TRI, corporate actions, market history, R2/storage remediation, identity/classification/taxonomy, methodology/profiles, evidence/readiness, engines/pilots/Stage 8 and UI/research/intelligence.

For each record preserve original scope, completion terminology, evidence ref and date. A new operational gap is recorded alongside historical completion; it does not rewrite the past. Missing records remain AUDIT_PENDING.

### C. Development database and facts

Verify the Development Supabase identity and record:
- applied migration inventory, repository migration refs and differences;
- schema/table/view/function/index/RLS metadata relevant to the product;
- canonical data owner/access contracts;
- ledger/accounting and immutable import/correction structures;
- financial/research/raw/normalized evidence structures;
- assessment/recommendation/version lineage;
- owner settings/role/theme/decision structures;
- historical/P8 identity, universe, evidence and market metadata.

Separate schema preservation from data preservation. Use approved private backup references; checksums/counts are not substitutes for a restorable backup. Do not place personal portfolio rows, tokens, password hashes or credentials in repository documentation.

### D. R2 and historical storage

Verify safe bucket/binding/account identifiers, fixed namespaces, manifests/catalogues, dataset inventory and coverage/as-of metadata, immutable source hashes, backup assets, runtime readers/writers and recovery procedures.

Preserve all valid already-acquired historical datasets and P8 artifacts. V1 non-use is not grounds for deletion. Record whether storage is isolated or shared; shared access needs explicit namespace/permission/write-path evidence. Do not claim a bucket name proves credential isolation.

No new acquisition, R2 write or data cleanup is authorized by planning.

### E. Methodology and research

Index classification and routing authorities separately. Preserve sector/industry/Basic Industry architecture, research profiles/subprofiles, approved methodology/scoring versions, evidence/period/lookback contracts, eligibility, recommendation/action and Core/Satellite/Thematic logic.

Explicitly retain pharma and other specialized business-model work. Method approval, reference-engine completion and held-security evidence readiness are different facts. DRAFT/pilot work remains DRAFT/pilot until approved; preservation does not promote it to production policy.

### F. Providers and integrations

Record provider relationships using non-secret identifiers, runtime targets, budget/usage controls, cache-first readers, leases, idempotency, kill switches, retry/failure behavior, News and market-data integrations.

Project-specific accounting does not prove separate upstream quota. Preserve both the control implementation and unresolved provider-account boundaries. No paid/live provider call is needed to document code/configuration.

### G. Existing UI

Inventory Dashboard, Holdings, Portfolio Structure, Research/stock workspace, Intelligence, Transactions, Import and Settings, with current routes/cards and working versus placeholder/readiness-only behavior.

The application shell, navigation and Research workspace remain the shared base. Later features integrate through existing canonical repositories/view models; they must not create another UI merely because their release is V2.

### H. Operations and recovery

Record backup mechanism/retention/identifiers, recovery compatibility, restore verification, code-to-schema/storage relationships, Preview status, environment isolation, migration/rollback conventions and unresolved blockers.

A code freeze alone cannot restore a database or R2 dataset. A backup listing alone does not prove restoration. Verify recovery through already adequate evidence or a separately approved isolated rehearsal.

## 4. Current Capability Preservation Matrix

Each audited capability/workstream receives one disposition:
ACTIVE IN V1 / REUSED / EXTENDED IN V1 / ACTIVE OR EXTENDED IN V1.1 / PRESERVED FOR V2/P8 / PRESERVED FOR LATER / OBSOLETE / REPLACE ONLY WITH OWNER APPROVAL / AUDIT_PENDING.

The initial rows below are a planning inventory, not an operational audit. Scope-derived future placement may be shown while the final disposition remains AUDIT_PENDING. Split rows where distinct capabilities have different evidence or preservation actions.

| Capability/workstream | Current evidence/status | Owner / source of truth to verify | Earliest use | Disposition now | Preservation/reuse action | Dependencies | Risk if altered | Migration/approval |
|---|---|---|---|---|---|---|---|---|
| Programs A–D; P0–P7/P7-IC | Authoritative records not reconciled in this amendment | Development Status and program records | V1 or later by component | AUDIT_PENDING | Index completed scope and reuse constituent modules | Code/schema/data references | Rewriting completion history | No migration authorized; replacement needs owner approval |
| Ledger/import/correction/accounting | Prior plan identifies reusable foundation; current behavior not re-audited | Effective transactions, accounting owner and shared repositories | V1 | AUDIT_PENDING | Reuse validated formulas and audit history | Chronology, charges, identities | Financial integrity/provenance loss | Additive changes only when separately approved |
| Holdings/prices/value/weights/broker facts | Current coverage unmeasured | Canonical holdings/price/accounting authorities | V1 | AUDIT_PENDING | Preserve consistent view models | Price/as-of and accounting coverage | Conflicting facts across pages | No migration authorized |
| Roles/settings/themes | Reusable paths identified; live state unverified | Owner settings/theme authorities | V1 | AUDIT_PENDING | Preserve owner control and audit | Holdings identity and ownership | Silent settings mutation | Replacement requires owner approval |
| Identity/classification/taxonomy | Existing architecture; current inventory pending | Canonical security/classification and reviewed routing | V1; historical use V2 | AUDIT_PENDING | Reuse authorities; preserve historical identities | Source contracts and versions | Competing taxonomies/misrouting | Explicit versioned evolution only |
| Specialized profiles including pharma | Profile architecture exists; current approval/support inventory pending | Sector/profile and scoring contracts | V1 where supported | AUDIT_PENDING | Preserve and extend each approved profile | Mandatory evidence/history | Generic scoring replacing specialization | No policy retirement without evidence/approval |
| Stage 8/current engines and pilots | Prior reference/pilot paths; current status pending | Approved deterministic engines and score/recommendation lineage | V1 | AUDIT_PENDING | Reuse valid engine/schema; generalize pilots | Approved methods/input readiness | False completion or duplicate engine | Preserve old versions/snapshots |
| Fit/Sizing/Core Health/Exit UI and engines | UI/readiness versus engine distinction pending | Owning engine and shared consumer models | V1 | AUDIT_PENDING | Reuse UI and valid contracts; build only missing pieces | Scores/context/lineage | Fabricated results/settings overwrite | No migration authorized |
| Research workspace/evidence/readiness | Existing workspace/control paths; live completeness pending | Research repositories and evidence authorities | V1 | AUDIT_PENDING | Extend the same workspace | Source/period/conflict contracts | Duplicate evidence or parallel workspace | Backwards-compatible changes only |
| Provider/News/market integrations | Existing controls; current target/credential evidence partial | Project-specific controls and source owners | V1 | AUDIT_PENDING | Retain cache/budget/failure safeguards | Target and upstream quota verification | Production spending or source drift | Runtime changes require separate approval |
| P8 Step 1/Step 2 | Prior remote records: technical gates closed; Step 2 feasibility NO-GO | Frozen P8 contracts and census artifacts | V2/P8 | PRESERVED FOR V2/P8 | Preserve code, reports, frozen inputs and failed-feasibility evidence | Artifact/manifest reconciliation | Loss of research evidence or inflated readiness | No expansion/replacement authorized |
| P8-B/historical universe | Artifacts not fully reconciled here | Historical identity/universe contracts | V2/P8 | AUDIT_PENDING | Preserve and index existing work | Historical identities/decision dates | Lost point-in-time lineage | No data removal or migration authorized |
| NIFTY 500 TRI/benchmarks | Completion/coverage not verified here | Existing benchmark contracts/source evidence | V1 if valid current dependency; otherwise V2 | AUDIT_PENDING | Reuse valid series; preserve research assets | Identity/date/TRI semantics | Invalid relative strength/backtest | No authority replacement without approval |
| Corporate actions/historical market data | Work referenced; current version/coverage pending | Source/corporate-action/adjustment authorities | V1 current-analysis needs; V2 replay | AUDIT_PENDING | Preserve raw/adjusted evidence and methods | Identity/action/version linkage | Corrupted prices or replay | Additive compatible changes only |
| R2/storage remediation/runtime gateway | Prior isolated binding/read-path evidence; complete freeze pending | Storage contracts, bucket manifests, runtime configuration | V1 where legitimate; V2/P8 | AUDIT_PENDING | Preserve datasets/catalogues/backups/access paths | Credential and recovery verification | Irrecoverable data/namespace crossover | No writes/deletion authorized |
| AI/thesis/owner-decision lineage | Current existence/completeness not verified | Optional context builder and owner records | V1 | AUDIT_PENDING | Reuse current valid snapshot/explanation paths | Recommendation identity/version | Lost decisions/invented thesis | Preserve earlier records |
| Unified UI/cards/navigation | Existing application; deployed versus HEAD gap recorded previously | Shared view models/UI workflow | V1 onward | AUDIT_PENDING | Extend same shell/workspace | Canonical facts and deployment evidence | Parallel UI/rebuild | Replacement needs evidence/owner approval |
| Monitoring/Calendar/thematic/credit/consensus/discovery | Existing pilots/partials not inventoried | Existing domain contracts to identify | V1.1; retain working safe features in V1 | AUDIT_PENDING | Reuse any valid current pilot/capability | Evidence/provider/policy readiness | Rebuilding deferred work | No removal merely due release scope |
| Cross-asset/tax/scenario/optimization assets | Existence not verified; do not assume implemented | Future approved domain contracts | Later | AUDIT_PENDING | Preserve any valid discovered assets | Owner priority and architecture | Premature duplicate build | Owner approval before replacement |
| Operations/backups/recovery | Previous evidence partial | Private backup manifest and operations procedures | Before implementation/release | AUDIT_PENDING | Verify recoverable references and compatibility | Positive targets and isolated restore evidence | Unrecoverable upgrade | Backup/restore operations separately authorized |

No row is classified OBSOLETE solely because its release is deferred. Every final row records exact evidence ref/date, owner/access path, dependency versions, risk, migration allowance and approval requirement. APPROVED migration design does not imply permission to apply it.

## 5. Cumulative versions

### A. Current Development Baseline Freeze

Preserve and map everything already built through the contract above. After capture, approved Development changes extend the baseline and retain lineage. Record upgrade deltas so later reviewers can recover the baseline and explain subsequent versions.

### B. V1

Use the existing ten gates unchanged in structure. V1 remains operational current-portfolio intelligence, including accounting, roles/themes, identity, evidence/current-history readiness, approved stock and portfolio engines, eligibility/movement, advisory actions, minimal thesis, optional AI, decisions and maintenance.

Every gate first identifies and proves the existing implementation. Reuse valid work; fix defects; generalize reference paths. Build only a demonstrated missing capability. Do not reduce V1 to a tracker or destroy deferred assets to shorten delivery.

### C. V1.1

Upgrade the same V1 application with approved monitoring/alerts, Calendar, Why Stocks Moved, thematic/credit/consensus/revisions, watchlist/discovery/screeners, re-entry/replacement and notifications.

Prior partial implementations and pilots are inputs to the work, not a reason to start again. Preserve already working safe capabilities in V1 where applicable; release placement defines blockers, not deletion.

### D. Post-V1.1 Owner Review

Mandatory before major V2/P8 implementation resumes. Assess product usability, actual count/value coverage, profile breadth, provider/data costs, correctness/reproducibility, UI usefulness, maintenance burden, preserved P8 readiness and advanced-research priorities.

Produce an owner-reviewed go/no-go, bounded next research scope, dependencies, cost limits and success criteria. V1.1 closure alone grants no V2 authorization. Preservation indexing and read-only review are distinct from historical expansion.

### E. V2/P8 Resumption

Resume from valid preserved historical/P8 work and earlier operational versions. Existing P8 code/data/docs/contracts/census/manifests are V2 inputs.

Extend point-in-time identity/universe/classification/evidence, historical methodology routing, scoring/eligibility/action/portfolio replay, benchmark/TRI comparison, risk/performance evaluation, bias controls, walk-forward testing and calibration only under the reviewed scope.

P8 technical gate completion does not imply scientific feasibility. Retain NO-GO findings and their source/contract versions. Close the evidenced dependency gap rather than rebuilding completed foundations or silently relaxing historical standards.

### F. Later Versions

Extend the same PortfolioAI for owner-approved cross-asset, tax, scenario and portfolio optimization capabilities. Preserve useful assets already discovered. Autonomous trading and silent financial mutations remain outside normal behavior unless the owner explicitly changes product philosophy.

## 6. P8 preservation without blocking V1

**Delivery policy: P8 PRESERVED / PAUSED FOR FUTURE V2 during V1/V1.1.**
**Evidence-capture status: NOT YET EXECUTED.**

Do not delete P8 code/data/docs, undo completed work or expand historical campaigns during V1. Reuse a preserved component only when an approved current-analysis dependency genuinely needs it, preserving source semantics and normal authorization boundaries.

Historical replay feasibility blockers do not block operational V1 unless a specific current-analysis prerequisite independently depends on the same missing evidence. Record that dependency explicitly; do not smuggle a new P8 acquisition/research program into V1.

This planning policy neither disables existing jobs nor changes historical status records. Verify runtime state before claiming the pause is operationally enforced.

## 7. Retirement, migration and lineage protection

A proposal to retire or replace completed work must include:
1. evidence that it is obsolete, incorrect, unsafe or incompatible;
2. exact affected module/contracts/data/readers and baseline refs;
3. alternatives to replacement and why reuse/fix is inadequate;
4. preservation/export/backwards-compatibility and migration implications;
5. regression acceptance and rollback/recovery;
6. owner approval before retirement/replacement.

Preserve transaction history, raw source evidence, historic observations, assessment/recommendation snapshots, owner decisions, methodology/profile versions, P8 evidence/manifests and audit relationships. Fixes append/link/version where appropriate; they do not erase prior evidence.

Schema changes prefer additive/backwards-compatible evolution. Never solve schema/migration conflicts by deleting valid historical or research data. Account for storage compatibility, not just database tables.

Security defects may require a separately authorized containment action; preserving code/history does not require leaving an unsafe endpoint active. This plan performs no containment, rotation, deletion or runtime change.

## 8. Environment and product acceptance clarifications

- Read-only repository/document inspection is allowed before full isolation.
- Live Development runtime/backend/browser/storage/provider-connected inspection requires positive Development-target verification for that specific path.
- All mutation, provider execution, scheduler and migration work requires full isolation and separate authorization; read-only configuration inspection is not provider execution.
- EXIT remains the headline; EXIT REVIEW / EXIT CANDIDATE is the detailed advisory state. REDUCE is distinct. Neither executes trades.
- V1 BUY uses an approved bounded candidate/watchlist/research path. A test fixture is not market-wide discovery authorization.
- Owner acceptance must work without technical tools: see ownership/value, supported assessments/Core-Satellite suitability, risk/concentration, advisory action and reasons, missing/conflicting evidence, and record a different owner decision.

Full policy and gate tests remain in the V1 plan.

## 9. Minimal documentation alignment after authorized capture/audit

When evidence is available:
- Development Status: record baseline identifier/status and links to these two plans; retain all historical records.
- Integration/Execution Plan: reference cumulative sequence and these owning documents instead of introducing another competing roadmap.
- Requirements Register: add a release/preservation overlay using existing IDs and evidence; do not replace original completion history.

No wholesale rewrite of Blueprint, Database, SSOT, Research or Product/UI architecture is required. Add only a narrowly necessary reference if an actual conflict warrants it.

These related repository documents are not changed by this local amendment; no factual baseline closure is asserted.

## 10. Next safe step and stop

Owner authorizes baseline-freeze evidence assembly and V1-1 audit. Begin with repository/document inspection; resolve target verification before live paths, and obtain separate authorization for any capture/restore operation that writes. Assemble the one manifest/matrix, complete recovery evidence, and prepare measured Scope Freeze B for owner review.

Do not start V1 implementation, approve Scope Freeze B, resume major P8/V2 expansion, modify main/Production or trigger providers/schedulers/migrations from this plan.

