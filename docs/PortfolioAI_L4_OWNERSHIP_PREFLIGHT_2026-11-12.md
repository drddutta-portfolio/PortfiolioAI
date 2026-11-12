# L4 — Ownership qualification preflight (Development, 12 November 2026)

Status: **implemented and executed, read-only; NOT evidence admission or L4 acceptance**.

Run `scripts/l4/ownership-qualification-preflight.sql` only against the verified Development Supabase project `lrgpjimipfkyoqbpsqzz`. The SQL obtains the newest canonical selected snapshot per portfolio/security, joins the immutable `research_evidence_snapshot_items` and `data_source_records` records, and checks identity, raw result retention, period label shape, finite percent range (0–100), at least four **distinct** quarters in Promoter and Institutional series, retained source quarter labels, and fail-closed statuses.

## Actual database verification

| Requirement family | Candidates | Normalized observations | Invalid | Out of range | Source metadata/identity | Four distinct quarters | Source quarter labels | Publication timestamp known | Fail closed |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| OWNERSHIP_GOVERNANCE | 63 | 2,256 | 0 | 0 | 63 | 63 | 63 | 0 | 63 |
| OWNERSHIP_TREND_4Q | 61 | 2,178 | 0 | 0 | 61 | 61 | 61 | 0 | 61 |
| **Total** | **124** | **4,434** | **0** | **0** | **124** | **124** | **124** | **0** | **124** |

Important: A well-formed payload hash is not a cryptographic replay of the raw source; raw text containing a quarter label is not exact field-value reproduction. The earlier v7 package reported full source-value reconciliation, but that package is not available in this execution environment. No new admission assertion has been made.

The 124 items remain `NORMALIZED_INPUT_CONTRACT_NOT_PROVEN` / `FAIL_CLOSED` / `NO_SELECTION` in the canonical snapshots. They must not be promoted to `FRESH` merely because their stored normalized percentages are structurally valid. `OWNERSHIP_GOVERNANCE` additionally requires independent governance-event/documentary evidence where prescribed. Do not forge `reviewed_by` or silently extend banking delegation to unrelated equities.

## Acceptance and execution boundary

1. Re-run source-original numerical replay (all 4,434 observations), quarter ordering, source-authority, timestamp/freshness and company-identity checks using original v7 manifest or reconstituted retained responses.
2. Formally establish the approved review/delegation contract and deterministic admission route; do not use direct snapshot updates.
3. Admit only accepted evidence through the canonical ledger, with source-bound audit details.
4. Re-materialize under an authorized execution grant and read back results against the fixed 238-equity L4 manifest, not the 239-selections global census.
5. Investigate the separate 369 remaining source-linked requirements (plus any additional blockers, if revealed by the full-cohort census).

No DB writes, migrations, Production changes, source downloads or new provider calls were made by this preflight. The repository script is a diagnostic, not a separate readiness engine.
