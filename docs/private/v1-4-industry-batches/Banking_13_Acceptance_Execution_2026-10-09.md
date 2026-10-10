# Banking V1-4 acceptance execution — 9 October 2026

> Historical read-only checkpoint. Later authorized acquisition, Development deployments and history qualification are recorded in [Banking_13_Acquisition_And_Admission_Result_2026-10-09.md](Banking_13_Acquisition_And_Admission_Result_2026-10-09.md). Zero-write/no-provider statements below apply only to this earlier checkpoint.

## Current disposition

NOT PROVEN. Actual owner replay accounts for 13 securities / 299 requirement items: 15 FRESH, 284 blocked, zero prospective READY. Fresh Development readback at 2026-10-09T01:30:38.489233Z confirms persisted 11 REVIEW_REQUIRED / 2 CONFLICTING / 0 READY. No database, provider, R2, deployment or grant mutation was performed in this continuation.

The original replay is retained by SHA-256 and all 299 items are linked to stock, requirement, source/candidate IDs, slice, run and cutoff in the remediation worklist. Missing evidence is not silently equated to missing raw captures.

## Independently established evidence

- All 13 stock Angel One mappings VERIFIED; exact tokens/mapping IDs in inventory.
- NIFTY_BANK mapping VERIFIED, Angel One token 99926009, NSE; latest stored ONE_DAY session October 7.
- 10 banks latest October 7. SBIN/KARURVYSYA/KOTAKBANK latest October 6.
- 470 retained fundamental observations; 53 missing period_type, 318 missing period_end and 468 UNKNOWN/null consolidation_scope. These totals describe all retained observations, not the count of replay failures.
- Retained COMPLETE_RESEARCH_OWNERSHIP records exist for 12 banks; none with matching security_id for SBIN. HDFCBANK has multiple captures, so conflict review must include all eligible sources.
- All 13 current persisted selection UUIDs equal the previous census snapshot choices; last selections predate the October 8 browser replay. This current readback is consistent with no selected snapshot replacement during that replay; it is not a contemporaneous before/after database audit of every table.
- No active unconsumed P4 execution grant for the portfolio. All 616 provider reservations found are SETTLED; no active Trendlyne budget reservation was found.
- Managed runtime has no provider secrets, owner session or outbound credential identity. Available tools have no Angel One/Trendlyne callable provider methods. Supabase connector can read evidence and deploy functions, but is not a genuine owner session.

## Actual runtime/code findings

Existing stock incremental handler fixes CUTOFF=2026-10-07; existing benchmark incremental handler fixes TO=2026-10-07. Neither can acquire the October 8 gap unchanged.

The old stock handler requests from the last existing date and upserts the overlap. That is unsuitable for the proposed strictly append-only remediation. Do not simply alter its date constant and run it: prepare a scope-validated tail path with conflict quarantine and fresh one-time grants.

Existing ownership re-projection already parses uncached histories. The actual replay now reports 12 OWNERSHIP_SOURCE_SEMANTICS_NOT_PROVEN and one OWNERSHIP_SERIES_MISSING. Re-projecting again alone cannot prove denominator or make READY; substantive source-backed admission is still required.

Retained KARURVYSYA/KOTAKBANK treatment records contain pre/ex prices, claimed ratios, action-source IDs and the label PROVIDER_HISTORY_ALREADY_CONTINUITY_ADJUSTED_NO_LOCAL_PRICE_REWRITE. They do not themselves provide independently qualified return-basis and continuity-test authority. The later COMPLETE proof allows the current validator to reach freshness; this is not independent proof of treatment correctness.

No financial validator was weakened, no dates/scopes were invented, and no unsupported candidate was marked admitted.

## Reviewable execution packages

1. History tail package: 13 stock requests plus exactly one NIFTY_BANK request. 16 missing stock sessions and one benchmark session to October 8. Maximum 14 history calls, one authentication attempt, zero automatic retries. Skip targets already current at execution. No existing-session overwrite. This is the proposed scope, not an executed or newly approved operation.
2. All-item worklist: 299 original prospective items, including every source/candidate ID supplied by the export, with investigation/admission routes.
3. Live source inventory: 253 grouped fundamental contracts, ownership source references/hashes/keys and all verified stock mappings.
4. Persisted readback: 13 exact selection/snapshot IDs and timestamps, history tails and grant availability.

No deployment, acquisition or materialization authority is inferred from a generic completion request where the governing session explicitly requires scoped authority. A history acquisition approval cannot authorize documentary ACCEPT or canonical snapshot materialization.

## Required continuation

Prepare and test an append-only tail execution adapter using the existing AngelOneProvider and P4 control plane; deploy only with specific approval. The deployed runtime may have provider credentials; their values must remain server-side. Its provider execution must validate exact scope/grants and return sanitized transport outcomes.

After approved tail/raw writes, qualify new calendar/session/history proof records from actual sources, revalidate corporate-action treatment and current market freshness, then rerun the four owner-authenticated slices. The October 8 cutoff is an historical acquisition bound; it is not permission to backdate future validation. Include later completed sessions in a separately verified scope if execution occurs after another close.

For numeric/ownership/documentary work, establish original period/denominator/scope/document identity proof from source evidence before preparing exact append-only admission payloads. No safe bulk admission can be claimed from current null/UNKNOWN fields.

Finally materialize only proven candidates with scoped grants and independently read back all 13 canonical selections. Preserve frozen ₹2,05,138.62 banking value and all 111 cohort members / release thresholds.

## Verification of this continuation

Documentation/evidence package only; no runtime implementation changed. Artifact generation verified 13 exact bank IDs, all four zero-write/provider replay totals, exactly 299 items, 284 non-FRESH items and 14 bounded targets. Whitespace checks pass. Application tests were not rerun for documentation-only changes.

The available execution capability cannot presently complete provider acquisition or authoritative admission. Persisted READY remains 0/13; completion is not claimed.
