# Banking V1-4 — bounded source-admission architecture decision

**PROPOSAL ONLY — not activated or an owner ACCEPT attestation.**

The owner's provider-call authorization has been executed. The remaining issue is admitting facts through the canonical review contract, not permission to acquire more data.

## Governing boundaries

`AGENTS.md` requires: "If proposed work conflicts with the Master Blueprint, Research & Intelligence Architecture, Single Source of Truth Architecture, Database Architecture, or Development Rules, do not silently proceed. Report the conflict and identify the product or architecture decision requiring owner approval."

Research & Intelligence Architecture §4.3 defines Trendlyne as the primary structured source for fundamentals, ownership/shareholding and semantically reviewed valuation. Several metric definitions explicitly require TRENDLYNE_MCP. The existing V1-4 review record requires `reviewed_by` to equal the portfolio owner and notes that no previously approved deterministic owner-review policy exists. These constraints cannot be bypassed by labeling NSE facts Trendlyne or attributing an unperformed review to the owner.

## Recommended decision

Authorize a versioned **Development-only, thirteen-frozen-bank primary-filing fallback** for factual numeric evidence and documentary review, through existing canonical admission modules. Permit official issuer/NSE filings as a separately identified fallback source where the approved primary provider lacks qualified evidence. Preserve Trendlyne's primary role, source identity and all original observations. Do not merge different authorities within one calculation or ownership series.

Authorize preparation and application of source-backed review decisions on the owner's behalf under a named delegation policy, with explicit executor attribution and policy identity. Do not spoof an owner session or silently populate `reviewed_by` as though the owner personally reviewed the filing. If the present schema cannot preserve that distinction, prepare the narrowly scoped schema/authentication amendment for separate review before activation; do not bypass constraints. Genuine owner sign-off through the existing session remains an alternative.

## Mandatory admission controls

- Scope remains exactly the thirteen frozen BANK members and Development project. No Production, other industries, cohort changes, source-priority changes outside this scope or V1-5 work.
- Each fact binds exact security identity, authoritative URL, original-byte hash, source fragment, retrieval/publication dates, reporting start/end, unit, denominator and consolidation scope. Unknown metadata remains blocked. Currency and percent/fraction conversions require the existing metric contract.
- Financial fallback applies only to already-defined metrics and semantically equivalent source facts. No invented valuation, NIM, growth, annualization or PB/ROE methodology.
- Ownership still uses the selected direct Promoter or direct Institutional series over four consecutive quarters, with the total-equity denominator proven. Do not sum FII/DII into Institutional. Primary category tables are corroboration until direct-series equivalence is explicitly established. Governance remains separately reviewed.
- Contradictory filings/revisions/ISINs and corporate-action return-basis evidence require explicit reconciliation; retrieval recency alone cannot resolve them.
- Reviews preserve append-only audit lineage and actual executor attribution. ACCEPT requires a proven source-bound fact; acquisition or a plausible number is insufficient. Unqualified or ambiguous evidence remains REVIEW_REQUIRED/CONFLICTING.
- Only stocks passing every required canonical check may be materialized under bounded authorization, followed by independent persisted selection readback. No readiness guarantees or minimum READY count are asserted by approving this proposal.

## Effect of approval

Approval authorizes implementing and testing the scoped source-admission/delegation contract. It does not itself admit captured facts, approve unreviewed candidate values, alter RLS, authorize a migration automatically, or complete Banking V1-4. Any necessary migration will be concrete and separately identified before execution. Existing owner-authenticated review can avoid a delegation-schema change.
