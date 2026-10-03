# PortfolioAI P8-B Recovery — New Chat Handoff

Date: 3 October 2026
Repository: drddutta-portfolio/PortfiolioAI
Branch: PortfolioAI-Development
Production branch: main — DO NOT MODIFY
Supabase Dev project: PortfolioAI Dev
Project ref: lrgpjimipfkyoqbpsqzz
Cloudflare R2 bucket: portfolioai-history-dev

## Controlling authorities

1. docs/p8/PortfolioAI_P8_COMPLETION_BUILD_HANDOFF_PLAN_2026-09-30.md
2. docs/p8/PortfolioAI_P8_B_SINGLE_RECOVERY_PLAN_2026-10-03.md
3. docs/p8/PortfolioAI_P8_B_RECOVERY_WORKSTREAM_A_SEMANTIC_AUDIT_2026-10-03.md
4. docs/p8/PortfolioAI_P8_B1_EXPERIMENT_BIAS_CONTROL_CONTRACT_2026-09-30.md

## Current top-level state

P7 / P7-IC = COMPLETE / PASS / CLOSED
P8-0 = COMPLETE / PASS
P8-A = COMPLETE / PASS
P8-B2 = COMPLETE / PASS / CLOSED
P8-B3 = COMPLETE / PASS / CLOSED
P8-B4 = COMPLETE / PASS / CLOSED structurally
P8-B5 = COMPLETE / PASS / CLOSED structurally
P8-B6 = COMPLETE / PASS / CLOSED structurally
P8-B-FINAL = COMPLETE / BLOCKED / CLOSED
P8-B = BLOCKED — DATA FOUNDATION INSUFFICIENT FOR FROZEN EXPERIMENT
P8-C = NOT AUTHORIZED
Production/main = UNCHANGED

## Current database/storage state

PortfolioAI Dev DB = approximately 188 MB / 500 MB.
Large historical B2/B3 datasets are intentionally stored in Cloudflare R2.
Do not move them back to Supabase merely to satisfy B recovery.

## Why P8-B is blocked today

B6 V1 logical snapshot surface:
- 144,768 identity/date dispositions
- 0 replay-ready
- 144,768 excluded

Current B5 blocker census:
- 136,384 B5_NO_CANONICAL_LINK
- 8,145 B5_NO_CLASSIFICATION_EVIDENCE_BEFORE_DECISION
- 239 B5_CLASSIFICATION_VALIDITY_UNPROVEN

B4 V1:
- FUNDAMENTAL selected = 0 / 144,768
- DOCUMENT selected = 0 / 144,768

## Critical recovery findings already proven

### 1. Historical-only identities must not require current security linkage

B2 V3 explicitly states that a historical identity may be a valid historical universe member with canonical_security_id = NULL.

B5 V1 later made current canonical security linkage a prerequisite. This conflicts with the survivor-free B2 design and is the source of 136,384 exclusions.

Recovery must use p8_historical_security_identities.id + historical_isin + dated listing evidence as the historical authority.

### 2. Frozen methodology is experiment policy, not a historical fact

The experiment freezes:
- methodologyVersion = P8_R6_R10_REPLAY_V1
- classificationVersion = P8_HISTORICAL_CLASSIFICATION_V1

Historical company facts must be available before the decision date.

But the frozen 2026 replay algorithm/threshold version does NOT need to have existed in 2024. B5 V1 incorrectly required methodology assignments/recommendation policies themselves to pre-date each decision.

Recovery must route historical facts through the frozen methodology router, while prohibiting backdating of present-day manual company assignments.

### 3. B-FINAL denominator must be B2-eligible pairs

B6 audit surface is 144,768 identity/date dispositions.

B3 frozen decision ledger identifies 121,956 B2-eligible security/date candidate pairs.

Universe-ineligible rows remain auditable but must not count as failed research signals.

### 4. Trendlyne is not the historical identity authority

B4 dry-run:
- 4,524 historical identities
- only 239 exact Trendlyne identities
- 4,285 unresolved provider identities

Official NSE/BSE filings must be keyed directly to P8 historical identity. Trendlyne is supplemental enrichment only.

## Recovery execution status

P8-B Recovery = STARTED

Workstream A — Contract / implementation correction:
- semantic audit = COMPLETE
- commit = db8b79bfe71b7b5acbe75713ba80c4d873efe3e1
- no hosted DB mutation
- no provider call
- no NSE/BSE acquisition
- no P8-C work

Recovery master plan commit:
- 24e86bfa5440d0ac519dcbd7244dca899aaa6ce8

## Exact next action for the new chat

Continue Workstream A.

Implement a separately versioned recovery contract and tests/fixtures that encode:

1. historical_identity_id is mandatory historical key;
2. canonical_security_id is optional;
3. historical company facts require strict-before-decision publication/availability;
4. frozen P8 methodology router can be applied retrospectively;
5. present-day manual company assignment may NOT be projected backward;
6. coverage denominator distinguishes full 144,768 audit surface from 121,956 B2-eligible candidate pairs;
7. recovery exclusion ceiling remains unfrozen until explicit owner approval.

Do NOT mutate hosted B5/B6 data yet.
Do NOT call providers.
Do NOT begin NSE/BSE bulk acquisition.
Do NOT begin P8-C.
Do NOT inspect outcomes/returns/holdout.
Do NOT modify Production/main.

After recovery contract/tests pass, proceed to Workstream B:
- historical identity/source adapter
- NSE filing adapter
- BSE fallback adapter
- metadata-only feasibility census BEFORE expensive acquisition.

## Owner-facing recovery sequence

P8-B RECOVERY
→ metadata feasibility proven
→ official filing acquisition
→ historical classification/evidence materialization
→ corrected B5
→ corrected B6
→ B-FINAL once
→ PASS => P8-C eligible for separate owner authorization
→ BLOCKED => stop; do not create another nested recovery tree

## Non-negotiable rules

- fail closed
- no guessing
- no destructive cleanup
- no current-state backdating
- no cross-security imputation
- no unknown-to-zero
- no future evidence
- no Production/main mutation
- no P8-C before B-FINAL PASS
- preserve all current B5/B6/B-FINAL artifacts as immutable V1 history
