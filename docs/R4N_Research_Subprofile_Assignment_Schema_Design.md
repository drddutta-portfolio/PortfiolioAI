# R4N — Research Subprofile Assignment Schema Design

**Status:** repository migrations created and verified locally; production unapplied

**Migrations:** baseline contract `20260915094042_create_research_subprofile_assignments.sql`; production-compatible forward reconciliation `20260915190026_reconcile_r4n_research_subprofiles.sql`; and the separately bounded NEWS/function repairs listed in `docs/R4N_Production_Forward_Deployment_Package.md`

## Authority boundary

`current_security_enrichment_v1` remains the sole application-wide authority for sector, industry and market-cap classification. Research subprofile assignment is a separate methodology fact whose proposed canonical authority is an append-only assignment relation keyed by security id. UI code consumes only the resolved effective research contract and never infers a subprofile from symbol, sector labels or company text.

## Proposed relations

### `research_subprofile_assignments`

- immutable assignment id (`uuid`);
- security id FK;
- parent profile code and version;
- primary subprofile code and contract version;
- lifecycle state: `PROVISIONAL`, `REVIEWED`, `DISPUTED`, `RETIRED`;
- confidence state and reviewer rationale;
- effective-from and optional effective-to timestamps;
- reviewed-by user id and reviewed-at timestamp;
- source/evidence reference metadata;
- created-at timestamp.

Rows are never updated to rewrite history. A correction closes the prior effective interval and creates a successor row. Only a reviewed, non-conflicting row can resolve as authoritative.

### `research_subprofile_secondary_exposures`

- assignment id FK;
- secondary subprofile code;
- evidence/rationale;
- optional materiality state;
- stable uniqueness on assignment plus secondary code.

Secondary exposures provide overlays and review context. They do not blend score curves or replace the primary effective contract.

## Required constraints

1. profile/subprofile codes and versions must reference registered immutable contracts;
2. `effective_to` must be later than `effective_from`;
3. overlapping reviewed primary assignments for the same security/profile are prohibited;
4. reviewed state requires reviewer, review timestamp and rationale;
5. a secondary exposure cannot duplicate the primary subprofile;
6. deletion and in-place mutation of reviewed history are prohibited through the application write path;
7. symbols are never stored as assignment identity.

## Resolution behavior

The shared resolver returns one of `RESOLVED`, `MISSING`, `PROVISIONAL`, `DISPUTED` or `CONFLICTING`. Only `RESOLVED` may activate subprofile readiness. Every other state may display parent PHARMA_V1 evidence but must block readiness, scoring and recommendation and expose the reason.

## RLS and access design

- Authenticated portfolio users may read assignments needed for securities visible through their portfolio access path.
- Assignment writes are owner-controlled administrative/research-review actions, not ordinary client writes.
- Service-role access is not exposed to the browser.
- Reviewer identity and historical rows remain auditable.
- No policy may broaden access to user-owned portfolio, transaction or research evidence data.

## Application preconditions

The owner approved global canonical assignments, service/admin-only writes, append-only reviewed history, database-enforced non-overlap and fail-closed unresolved states. Before applying the migration, run it in an approved local database, execute `r4n_research_subprofile_assignments_test.sql`, inspect the schema diff and security advisors, regenerate database types, and review the resulting resolver/repository implementation. Production application remains separately gated.
