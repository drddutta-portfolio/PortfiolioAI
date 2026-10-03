# PortfolioAI P8-B4 — Point-in-Time Fundamentals and Document History Entry Plan

Date: 3 October 2026  
Environment: PortfolioAI Development only  
Repository: `drddutta-portfolio/PortfiolioAI`  
Branch: `PortfolioAI-Development`  
Authority: owner instruction to start P8-B4  
Upstream: P8-B3 COMPLETE / PASS / CLOSED

## Status

```text
P8-B4 = ACTIVE
P8-B4 cache-first baseline = COMPLETE / PASS
P8-B4 hosted schema migration = NOT YET AUTHORIZED / NOT APPLIED
P8-B4 provider acquisition campaign = NOT YET EXECUTED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## 1. Canonical B4 contract

Source handoff:
`docs/p8/PortfolioAI_P8_COMPLETION_BUILD_HANDOFF_PLAN_2026-09-30.md`

B4 must build point-in-time fundamentals and document history for the frozen experiment:

- experiment: `P8_EXP_NSE_MONTHLY_6M_V1`;
- window: 2023-10-01 through 2026-09-30;
- decision cadence: monthly, after market close, Asia/Kolkata;
- every input becomes eligible only at the first decision instant strictly after provable publication and availability;
- unknown publication time is ineligible;
- provider `updated_at` / retrieval time is not publication time;
- no backfilling current values into historical decision dates;
- no cross-security imputation;
- original/revised/restated evidence remains immutable and linked;
- repeated acquisition/materialization must be idempotent.

Approved authority direction from the B0 owner memo:

- fundamentals: Trendlyne structured history where licensed/available, cross-checked or publication-dated by official exchange/company evidence;
- documents: official NSE/BSE/company filings with provable publication time and immutable source identity;
- proposed Trendlyne ceiling: 320 planned internal attempts/day, 80 additional attempts reserved for bounded retries/diagnostics;
- provider-backed execution remains fail-closed and quota-accounted.

## 2. Cache-first Development baseline

Read-only measurement on PortfolioAI Dev `lrgpjimipfkyoqbpsqzz`:

### Historical identity surface

```text
historical identities = 4,524
historical identities linked to current canonical security_id = 262
historical identities without canonical current-security mapping = 4,262
```

Therefore B4 cannot use live/current `security_id`-keyed fundamental/document tables as the historical authority.

### Existing fundamental cache

```text
fundamental_observations rows = 2,458
distinct securities = 116
rows with published_at = 4
rows with observed_at = 4
rows with retrieved_at = 2,458
period range = 2021-03-31 through 2026-06-30
```

Source split:

```text
TRENDLYNE_MCP = 2,454 rows / 114 securities / 0 rows with published_at
COMPANY_EXCHANGE_FILING = 2 rows / 1 security / 2 rows with published_at
STAGE5_FIXTURE = 2 rows / 2 securities / 2 rows with published_at
```

Historical-identity overlap:

```text
identities with any current-table fundamental evidence = 114 / 4,524
identities with publication-dated fundamentals = 1 / 4,524
identities with >=8 distinct fundamental periods = 1 / 4,524
```

The existing Trendlyne rows are useful as cache/reference evidence but are not point-in-time eligible for P8 replay without provable publication timing.

### Existing document cache

```text
research_documents = 140
distinct securities = 112
published documents = 140
documents with canonical_content_hash = 1
reporting-period range = 2026-03-31 only
publication range = 2026-04-17 through 2026-09-25

research_document_sources = 139
source = TRENDLYNE_MCP
rows with source_published_at = 139
rows with retrieved_at = 139
rows with content_hash = 0
```

Historical-identity overlap:

```text
identities with any documents = 111 / 4,524
identities with publication-dated documents = 111 / 4,524
identities with hashed canonical documents = 0 / 4,524
```

The document cache is far too shallow for the frozen 2023-2026 experiment and lacks durable content hashes for almost all source rows.

## 3. Architecture decision

P8-B4 requires a separate append-only historical evidence layer keyed to:

- `portfolio_id`;
- `experiment_id`;
- `historical_identity_id`;
- exact historical ISIN;
- evidence domain/type;
- provider/source identity;
- reporting period/fiscal basis;
- source publication time;
- provider observation time where available;
- retrieval time;
- raw/normalized value, unit, currency and scale;
- transformation/version identity;
- immutable source/document identity and content hash when lawful/available;
- amendment/restatement/supersession links;
- deterministic point-in-time eligibility state.

The live `fundamental_observations`, `research_documents` and `research_document_sources` tables remain untouched and can only seed cache candidates when exact identity and timestamp provenance are proven.

No present-day `canonical_security_id` mapping may be used to infer a historical identity for the 4,262 unmapped historical identities.

## 4. Proposed additive B4 schema package

Repository/local design target only until hosted migration is separately approved.

### `p8_b4_fundamental_observations`

Append-only historical fundamental evidence keyed by `historical_identity_id`.

Minimum fields:

- id
- portfolio_id
- experiment_id
- historical_identity_id
- historical_isin
- metric_code
- source_code
- provider_entity_id / source identity
- source_record_id / provider record identity
- reporting_period_start / end / type
- fiscal_basis
- accounting_standard
- consolidation_scope
- raw_value
- raw_unit
- raw_currency
- raw_scale
- normalized_value
- normalized_unit
- normalized_currency
- transformation_version
- published_at
- observed_at
- retrieved_at
- availability_state
- evidence_status
- source_hash
- row_hash
- created_at

### `p8_b4_research_documents`

Append-only document identity/provenance:

- id
- portfolio_id
- experiment_id
- historical_identity_id
- historical_isin
- document_type
- reporting_period_start/end/type
- source_code
- source_url/reference
- provider_document_id
- published_at
- retrieved_at
- canonical_content_hash
- metadata_identity_hash
- version_label
- amendment_of_document_id
- source_status
- created_at

### `p8_b4_decision_evidence_eligibility`

Deterministic security/decision/domain eligibility projection:

- historical_identity_id
- decision_at
- evidence_domain
- required
- eligible evidence IDs
- selected evidence ID
- exclusion reason
- source cutoff
- materializer version
- selection fingerprint

No performance or replay output belongs in B4.

## 5. Mandatory fail-closed rules

1. Historical identity is exact; symbol inference alone is prohibited.
2. Unknown `published_at` => evidence is not point-in-time eligible.
3. Retrieval/observation time cannot substitute for publication time.
4. Later restatement cannot overwrite the original.
5. Current live evidence is never projected backward without dated provenance.
6. Cache reuse requires exact historical identity + source identity + reporting period + immutable provenance.
7. Provider calls must be quota-reserved before execution and reconciled after execution.
8. One campaign ID, fixed cutoff and fixed evaluation timestamp per run.
9. Repeated materialization must create zero duplicate content.
10. Any mismatch in source identity, period semantics, publication timing or units fails closed.

## 6. B4 acquisition sequence

### B4-0 — baseline freeze
Status: COMPLETE / PASS.

- measured historical identity surface;
- measured existing fundamental/document cache;
- proved existing live tables cannot serve as full historical authority;
- zero provider calls;
- zero database writes.

### B4-1 — schema + identity contract
Next atomic build step.

- create repository/local additive migration proposal;
- create deterministic identity, period, publication-time and restatement contracts;
- create tests for append-only/idempotency and unknown-publication fail-closed behavior;
- do not apply hosted migration until separately approved.

### B4-2 — dry-run acquisition manifest

For every target historical identity:

- exact ISIN/provider identity resolution state;
- cache hit/miss by required domain;
- required periods/documents;
- estimated provider attempts;
- publication-time remediation requirement;
- deterministic exclusion if no lawful/provable source exists.

No provider call occurs during manifest generation.

### B4-3 — canary campaign

Only after schema persistence and provider path are ready:

- small deterministic cohort;
- cache-first;
- fixed provider-call budget;
- exact identity validation before each provider request;
- immutable raw capture;
- publication-time validation;
- stop on first schema/identity/time-provenance divergence.

### B4-4 — bounded full campaign

- maximum 320 planned internal Trendlyne attempts/day;
- 80 reserved attempts for retries/diagnostics;
- resumable deterministic slices;
- provider and internal usage reconciled separately;
- official filing evidence used where publication-time cross-check is required.

### B4-5 — decision-date eligibility materialization

For all approved B2 historical identity / decision-date pairs:

- select only evidence available strictly before the decision instant;
- produce one eligible evidence selection or explicit exclusion;
- preserve source cutoff and lineage;
- no current-state fallback.

### B4-6 — idempotency and coverage audit

Gate B4 passes only when:

- required domain/date coverage satisfies the frozen experiment contract; or
- every uncovered security/date/domain has a deterministic explicit exclusion;
- no unknown publication time was treated as eligible;
- repeated campaign/materialization creates no duplicate observations or changed fingerprints;
- all provider-call accounting reconciles;
- P8-B5 remains locked until B4 closure.

## 7. Entry conclusion

```text
P8-B4 = ACTIVE
B4-0 = COMPLETE / PASS
B4-1 = READY TO BUILD
provider calls made during entry = 0
Supabase writes during entry = 0
Production changes = 0
main changes = 0
```

P8-B4 cannot be closed from the existing cache. The next action is B4-1 repository/local schema-and-contract implementation followed by a B4-2 dry-run manifest. Hosted schema application and provider acquisition must remain independently auditable and fail-closed.
