# PortfolioAI P8-B Recovery Plan — Single Bounded Remediation to B-FINAL PASS

Date: 3 October 2026  
Environment: PortfolioAI Development only  
Branch: `PortfolioAI-Development`  
Target experiment: `P8_EXP_NSE_MONTHLY_6M_V1`  
Purpose: recover P8-B from the current B-FINAL blocked state without creating another owner-facing tree of sub-gates.

## 1. Executive decision

P8-B recovery will be executed as ONE bounded recovery operation.

Owner-facing sequence:

```text
P8-B RECOVERY
    ↓
re-materialize corrected B5
    ↓
re-materialize corrected B6
    ↓
re-run B-FINAL
    ↓
PASS → P8-C becomes eligible for owner authorization
BLOCKED → stop with irreducible-source evidence; do not create another nested recovery program
```

Internal checkpoints are implementation controls only. They are not new PortfolioAI stages or owner-facing gates.

No P8-C, performance calculation, holdout evaluation, Production change, or main-branch change is permitted during recovery.

---

## 2. Root-cause diagnosis

The current 100% B6 exclusion surface is not purely a missing-data problem. It contains implementation/modeling constraints that diverge from the original Codex architecture.

### 2.1 Historical identity dependency is wrong

B2 V3 explicitly froze this rule:

> An identity may be a valid historical universe member with `canonical_security_id = NULL`; live PortfolioAI security identity is not required for historical eligibility.

Current B5 instead requires an exact current canonical security link before classification can resolve.

That converts all 4,262 historical-only identities into:

```text
4,262 × 32 = 136,384 NO_CANONICAL_LINK exclusions
```

This is inconsistent with the survivor-free historical-universe design and must be corrected.

### 2.2 B4 provider scope is too narrow

B4 dry-run proved:

```text
historical identities = 4,524
exact Trendlyne identities = 239
blocked provider identities = 4,285
```

Trendlyne/current-security identity is therefore unsuitable as the primary historical evidence authority for the P8 universe.

Official exchange filings must be keyed to P8 historical identity through dated ISIN/symbol/name evidence, not through current PortfolioAI security identity.

### 2.3 B5 conflates historical input availability with backtest-policy existence

The frozen experiment contract defines:

```text
methodology_version = P8_R6_R10_REPLAY_V1
classification_version = P8_HISTORICAL_CLASSIFICATION_V1
```

The purpose of P8 is to replay that frozen 2026 methodology against historical point-in-time company information.

Therefore:

- company evidence/classification inputs MUST have been available before the historical decision instant;
- the frozen P8 methodology and thresholds DO NOT need to have existed in the historical year;
- a current/manual company methodology assignment must not be backdated;
- instead, the frozen P8 methodology router must deterministically assign the profile from historical point-in-time company attributes.

The current B5 rule requiring `assigned_at < decision_at`, `reviewed_at < decision_at`, and approved policy `created_at < decision_at` makes a retrospective experiment impossible by construction and must be replaced.

### 2.4 Coverage denominator must distinguish universe-ineligible rows

B2 produced 144,768 identity/date membership dispositions but B3 identifies 121,956 eligible security/date pairs.

Recovery must distinguish:

- all historical identity/date dispositions;
- B2 universe-ineligible pairs;
- B2 eligible experiment candidates.

B-FINAL research coverage must be measured against B2 ELIGIBLE pairs, not treat a legitimate universe-ineligible row as a failed signal snapshot.

---

## 3. Source hierarchy

Recovery will use source authorities in this order.

### Tier 1 — NSE official corporate filings

Primary authority for NSE-listed historical companies.

Use:

- financial-result filings;
- integrated financial filings / XBRL where available;
- annual reports and corporate announcements;
- board-result announcements;
- exchange broadcast / received / dissemination timestamps.

The exchange broadcast/dissemination time is the point-in-time availability authority.

NSE official financial-results pages expose historical period, audited/unaudited status, standalone/consolidated status and broadcast date/time. Historical examples are available for 2024/2025 results, and the interface supports custom date ranges and XBRL/CSV.

### Tier 2 — BSE official corporate filings

Fallback for cross-listed companies or missing NSE filing history.

Use exact ISIN / dated company identity where possible.

BSE financial-result history exposes filing date/time, revision status and XBRL for historical quarterly/annual results.

### Tier 3 — Official company/regulatory documents

Use for classification/business-model evidence when structured exchange financials are insufficient:

- annual reports;
- RHP / information memorandum for newly listed companies;
- merger/demerger regulatory filings;
- official company investor filings already disseminated through NSE/BSE.

### Tier 4 — Trendlyne

Trendlyne becomes secondary enrichment only.

Trendlyne data may be used when:

1. exact P8 historical identity is proven;
2. reporting period matches an official filing;
3. the value can be reconciled to the official filing or a deterministic transformation;
4. publication/availability time comes from official exchange evidence, not provider retrieval/update time.

Trendlyne identity is never a prerequisite for historical eligibility.

---

## 4. Historical identity model

P8 historical identity remains the canonical historical key.

Primary key:

```text
historical_identity_id
historical_isin
```

Dated aliases:

```text
symbol
company_name
series
exchange
valid_from / source_date
valid_to / next observed change
source archive
```

Optional links:

```text
current canonical_security_id
Trendlyne stock ID
BSE security code
other provider IDs
```

These are mappings, not the historical identity itself.

### Identity acceptance rule

A filing belongs to a P8 historical identity only when the match is deterministic from one of:

1. exact ISIN;
2. exact dated NSE symbol + company-name evidence within the historical listing validity interval;
3. exact BSE cross-list mapping anchored to ISIN;
4. explicit corporate-action/symbol-change lineage already proven by B2/B3.

Ambiguous matches fail closed.

### Required result

No B2-eligible pair may be excluded merely because `canonical_security_id IS NULL`.

---

## 5. Point-in-time classification reconstruction

Do not backdate the September-2026 `security_attribute_observations`.

Instead generate a P8-local historical analytical classification from contemporaneous filings.

### Frozen classification rule

Use the NSE Indices four-tier structure:

```text
Macro-Economic Sector
→ Sector
→ Industry
→ Basic Industry
```

The frozen classifier follows the NSE methodology:

- prime source: audited consolidated annual financials;
- primary basis: segment revenue;
- single line of business → corresponding basic industry;
- one segment >50% revenue → classify to that segment;
- no >50% segment and qualifying multi-segment structure → Diversified;
- insufficient revenue detail → use contemporaneous annual-report business description;
- newly listed company → RHP / information memorandum / regulatory filing;
- merger/demerger or material business change → start a new classification validity interval.

### Important distinction

This is a P8 analytical historical classification produced by the frozen experiment classifier from point-in-time evidence.

It is NOT a claim that NSE itself assigned that exact label on that historical date.

### Validity rule

For decision date D:

- select only evidence with exchange dissemination time strictly before D;
- classification remains effective until superseded by a later eligible classification event;
- no future annual report may be used to classify an earlier decision;
- changes create append-only intervals;
- overlapping contradictory classifications block that identity/date until reconciled.

---

## 6. Point-in-time fundamental/document evidence

### Availability timestamp

For each filing use:

```text
exchange dissemination timestamp
```

as the conservative market-availability time.

Do not substitute:

- provider retrieval time;
- provider update time;
- report period end;
- board-meeting date without dissemination evidence.

### Financial statement hierarchy

Prefer:

1. consolidated audited annual result;
2. consolidated quarterly result;
3. standalone result only when consolidated is genuinely unavailable / inapplicable under the frozen metric contract.

Original and revised filings remain separate observations. A revision becomes usable only from its own dissemination timestamp onward.

### Evidence persistence

Large raw XBRL/PDF/CSV content goes to R2.

Supabase stores compact authority metadata:

- historical_identity_id;
- source exchange;
- source filing ID/reference;
- period end;
- filing type;
- received/disseminated time;
- original/revised state;
- content hash;
- R2 object key;
- parsed metric-set hash;
- transformation version.

This avoids rebuilding the 1.5 GB database problem.

---

## 7. Methodology/profile/threshold replay correction

This is the most important B5 semantic correction.

### Historical inputs

Must be point-in-time:

- historical classification;
- business-model/subprofile evidence;
- financial/document metrics.

### Experiment policy

Must be frozen, deterministic, and unchanged after outcome inspection:

```text
P8_R6_R10_REPLAY_V1
```

The policy may be applied to 2024 evidence even though the policy was designed in 2026. That is the definition of retrospective backtesting.

### Assignment logic

For each historical identity/date:

```text
point-in-time classification/business evidence
        ↓
frozen methodology router
        ↓
methodology profile/subprofile
        ↓
frozen scoring thresholds / R7 policy
```

Do NOT require a historical database row whose `assigned_at` or policy `created_at` predates the simulated date.

Do require:

- deterministic mapping;
- one profile/path only;
- frozen mapping/version hash;
- no outcome-dependent override;
- no manual current assignment projected backward.

This separates **historical facts** from **experiment algorithm** correctly.

---

## 8. Recovery feasibility census BEFORE expensive acquisition

This prevents another long build ending at B-FINAL with zero usable coverage.

Before bulk downloads/provider calls, run a metadata-only census for all 4,524 historical identities and all 32 decision dates.

Measure:

1. B2 eligible pair count by date;
2. historical identity resolvability independent of current securities;
3. NSE filing presence by identity and period;
4. BSE fallback availability;
5. dissemination timestamp availability;
6. annual-report / segment-data availability for historical classification;
7. projected fundamental metric availability;
8. projected classification validity by date;
9. projected replay-ready coverage by date, sector and listing cohort.

No outcomes/forward returns may be inspected.

### Hard feasibility stop

Do not launch full acquisition until this census proves a realistic path to the frozen exclusion ceiling.

If the source metadata cannot support the minimum experiment, stop immediately and redesign the experiment version before spending quota or rebuilding B5/B6.

---

## 9. Exclusion ceiling to freeze BEFORE replay

The original contract says B-FINAL requires gaps to be within an approved exclusion ceiling, but no numeric ceiling was frozen.

This must be corrected before recovery acquisition and before any P8-C outcome is calculated.

Recommended conservative first-experiment ceiling:

- at least 24 proven decision dates;
- identity resolution: 100% of B2-eligible pairs through P8 historical identity (current canonical link not required);
- replay-ready canonical coverage: at least 80% of B2-eligible pairs overall;
- every retained decision date: at least 70% replay-ready coverage;
- no major methodology sector below 60% replay-ready coverage across retained dates;
- missingness concentration by sector/listing-age/market-cap cohort must be disclosed;
- no cohort may be silently removed because it performs badly or lacks current canonical identity;
- all exclusions remain explicit.

These percentages are a recommended research-governance choice, not a claim of a universal statistical law. They must be owner-approved and frozen before P8-C.

If the metadata census suggests these thresholds are unrealistic, change the experiment version before outcome inspection rather than weaken the thresholds after backtest results exist.

---

## 10. Single recovery execution workflow

### Workstream A — Contract/implementation correction

No provider calls.

1. Remove current-`canonical_security_id` dependency from B5 historical eligibility.
2. Separate historical facts from frozen experiment-policy availability.
3. Change B-FINAL coverage denominator to B2-eligible pairs.
4. Freeze recovery amendment and exclusion ceiling.
5. Preserve current V1 B5/B6/B-FINAL artifacts unchanged for audit comparison.

### Workstream B — Historical identity/source adapter

No broad provider campaign.

1. Build dated alias resolver from existing B2 historical listing evidence/R2.
2. Add NSE filing identity adapter.
3. Add BSE fallback adapter.
4. Prove symbol-change/delisting cases.
5. Generate the full metadata-only source census.

### Workstream C — Official filing acquisition

Only after feasibility census passes.

1. Acquire NSE filing metadata first.
2. Acquire required XBRL/PDF/CSV raw files into R2.
3. Use BSE only for deterministically mapped gaps.
4. Hash every raw source.
5. Resume idempotently.
6. Never refetch an already verified object.
7. Trendlyne calls only for residual value enrichment anchored to official filings.

### Workstream D — Historical classification + evidence materialization

1. Parse contemporaneous annual/quarterly results.
2. Build classification validity intervals from frozen classifier.
3. Build point-in-time fundamental/document observations.
4. Maintain amendment/revision lineage.
5. Produce coverage matrices before B5 rebuild.

### Workstream E — One B5/B6/B-FINAL rerun

1. Re-materialize corrected B5.
2. Require one deterministic methodology path or explicit blocker for every B2-eligible pair.
3. Re-materialize corrected B6.
4. Verify deterministic replay and zero future evidence.
5. Re-run B-FINAL ONCE against the frozen recovery ceiling.

No additional nested remediation loop is authorized automatically.

---

## 11. Required canaries before full acquisition

Use a small canary cohort spanning difficult identity classes:

- current exact-ISIN security;
- historical-only / delisted identity with `canonical_security_id=NULL`;
- symbol-change identity;
- merger/demerger identity;
- bank/NBFC;
- industrial/manufacturing company with segment reporting;
- diversified company;
- newly listed company;
- NSE filing gap with BSE fallback.

For each canary prove end-to-end:

```text
B2 historical identity
→ official filing
→ exchange dissemination timestamp
→ historical classification
→ point-in-time metrics
→ frozen methodology route
→ B5 resolved path
→ B6 replay-ready snapshot
```

If historical-only canaries cannot become replay-ready without current-security linkage, recovery implementation is still wrong and bulk acquisition must not begin.

---

## 12. Data/storage architecture

Keep the current hybrid architecture.

### Supabase

Store:

- control plane;
- compact metadata;
- identity mappings;
- filing index;
- validity intervals;
- canonical selections;
- hashes/fingerprints;
- B5/B6 compact vectors;
- audit state.

### Cloudflare R2

Store:

- official exchange source files;
- XBRL;
- PDFs;
- CSV extracts;
- large parsed historical datasets;
- immutable manifests.

Target:

```text
PortfolioAI Dev database < 250 MB during recovery
hard stop before 400 MB
never approach 500 MB without separate storage remediation
```

R2 location is not a blocker; server-side PortfolioAI functions read the required slices.

---

## 13. Security and reproducibility

Every recovery object must satisfy:

- append-only raw evidence;
- immutable hashes;
- deterministic selection;
- RLS on exposed-schema tables;
- no anon access;
- authenticated owner access only where UI requires it;
- service-only writes;
- `security_invoker` views;
- no current-state fallback;
- no cross-security imputation;
- no unknown-to-zero;
- no future filing;
- repeated materialization creates zero changed content;
- deterministic aggregate fingerprint.

---

## 14. Final B-FINAL PASS checklist

P8-B Recovery is complete only when ALL are true:

### Universe

- >=24 decision dates;
- survivor-free B2 universe preserved;
- historical-only identities remain eligible when evidence supports them;
- no dependency on current holdings/current-security existence.

### Market history

- B3 adjusted-price / corporate-action / benchmark contracts remain unchanged and PASS.

### Point-in-time evidence

- every replay-ready input has official availability timestamp strictly before decision;
- original/revised filing lineage preserved;
- no provider retrieval/update timestamp substituted as publication time.

### Classification

- classification comes from contemporaneous evidence plus frozen classifier;
- one non-overlapping classification path per replay-ready pair;
- no September-2026 current assignment backdated.

### Methodology

- frozen `P8_R6_R10_REPLAY_V1` route applied deterministically;
- current manual methodology assignment not backdated;
- historical existence of the 2026 policy is NOT required;
- policy/version fingerprint constant across replay.

### Coverage

- coverage denominator = B2 eligible pairs;
- owner-approved exclusion ceiling met;
- coverage by date/sector/cohort reported;
- exclusions explicit.

### Canonical snapshots

- exactly one B6 disposition per expected pair;
- no duplicate fingerprint;
- no future evidence;
- replay-ready snapshots > 0 and above frozen coverage floor;
- source replay = materialized replay.

### Holdout

- no P8-C calculation before B-FINAL PASS;
- 20% holdout remains untouched.

### Governance

- B-FINAL PASS;
- owner separately authorizes P8-C;
- Production/main unchanged.

---

## 15. Irreducible failure rule

No plan can guarantee that historical source data exists.

This plan guarantees that absence is discovered early rather than after another long nested build.

If the metadata-only census proves that official filing/classification history cannot meet the frozen coverage floor, recovery stops BEFORE full acquisition.

At that point only two legitimate options exist:

1. create a separately versioned narrower experiment before seeing performance; or
2. declare P8 historical validation infeasible for the desired universe/period.

Never lower coverage thresholds after seeing backtest outcomes.

---

## 16. Definition of success

The recovery does NOT succeed merely because B5/B6 tables are structurally complete.

It succeeds only when:

```text
P8-B-FINAL = PASS
AND
replay-ready canonical coverage satisfies the frozen ceiling
AND
holdout remains untouched
```

Then and only then:

```text
P8-C = ELIGIBLE FOR SEPARATE OWNER AUTHORIZATION
```
