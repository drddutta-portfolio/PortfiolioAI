# PortfolioAI Operational V1-4 — Ownership Methodology Selection and Versioned Implementation Contract

**Contract proposal ID:** `PORTFOLIOAI_V1_4_OWNERSHIP_METHOD_SELECTION_V1_PROPOSED_2026_10_08`  
**Repository/branch:** `drddutta-portfolio/PortfiolioAI` / `PortfolioAI-Development`  
**Reviewed baseline HEAD:** `a9dcfbe8c893a41febf4592e980da8fc8150051a`  
**Canonical evidence run:** `c0b7f1c4-3e36-4d5c-b79a-19e44fe74e83`  
**Status:** **OWNER SELECTIONS RECORDED / VERSIONED CONTRACT PROPOSED / NOT YET CANONICALLY ACTIVATED**  
**Operational stage:** V1-4 NOT PROVEN. V1-5 remains unauthorized.

## 1. Owner selections recorded verbatim

Owner message, 8 October 2026:

- `OWNERSHIP_TREND_4Q = Promoter / total equity`
- `INSTITUTIONAL_OWNERSHIP_TREND_4Q = Institutional / total equity`
- `OWNERSHIP_GOVERNANCE = Separate ownership and governance evidence`

These are owner selections **for review against the governing canonical architecture**, not an approval to infer undocumented provider semantics, record factual ACCEPT, acquire paid data, write R2 or Supabase, deploy, or materialize. This file may be approved as a versioned methodological rule after review of the source-field/denominator and governance conjunction below. Do not treat its creation as approval.

## 2. Authority and fit

Read in AGENTS.md precedence: Master Blueprint, Research and Intelligence Architecture, Single Source of Truth Architecture, Database Architecture, Development Rules, Product UI/Decision Workflow, Development Status, Requirements Register, and existing V1-4 execution/review contracts. No higher-authority document inspected establishes a conflicting exact four-quarter provider series for the three named requirement codes. The chosen meanings are compatible with keeping canonical facts, provenance and deterministic calculations separate from advisory AI. This compatibility does **not** demonstrate numerical source validity or imply a scoring weight.

**Do not create a parallel calculation authority.** The existing requirement registry/validator and the canonical research-evidence materializer remain the only admission owners. The present contract is the proposed versioned rule they would consume once accepted.

## 3. Exact proposed meanings

| Requirement | Proposed source series | Percentage basis requirement | Purpose | Admission rule |
|---|---|---|---|---|
| `OWNERSHIP_TREND_4Q` | `Promoter` (exact retained provider field) | `TOTAL_EQUITY_PERCENT` **subject to source proof** | Four-quarter change/continuity of promoter shareholding | Exactly four chronological consecutive exchange-reported ownership quarters, one issuer/security, same source series, same proved denominator and percentage basis; no inferred missing quarter |
| `INSTITUTIONAL_OWNERSHIP_TREND_4Q` | `Institutional` (provider's own aggregate field) | `TOTAL_EQUITY_PERCENT` **subject to source proof** | Four-quarter trend of aggregate institutional shareholding as provider explicitly defines it | Same four-quarter identity/basis rule; use Institutional directly; never add FII, MF or DII to it |
| `OWNERSHIP_GOVERNANCE` | **Two independently evaluated evidence components**: (1) ownership provenance and trend where required by the profile; (2) original, source-reviewed governance filings/events | Ownership subcomponent requires proved percentage basis; governance events are **not percentages** | Ownership alignment AND governance-event oversight | Do not mark accepted unless independently valid ownership evidence **and** separately source-bound governance evidence meet the canonical requirement; no promoter-only governance pass or undocumented composite score |

### Provider-field semantics are a hard precondition, not an assumption

Before admitting `TOTAL_EQUITY_PERCENT`, preserve an original provider/exchange/issuer field definition explicitly demonstrating numerator and denominator, date/quarter, ordinary-vs-fully-diluted basis if relevant, and whether the issuer has multiple share classes. A UI field labelled “Promoter” or “Institutional” does not itself prove the denominator is total equity. If the source does not prove the same denominator and reporting basis across all four quarters, return `REVIEW_REQUIRED` (or the established invalid/contract-missing state), never READY.

Promoter / Institutional / FII / MF / DII / Public remain distinct, potentially overlapping source series. Do not derive Institutional by summing subseries; do not assume Institutional is disjoint from FII, MF or DII. No shareholdings arithmetic is authorized by this contract.

## 4. Reporting window and provenance requirements

The phrase `4Q` means exactly **four consecutive disclosed reporting quarters**, rather than any four available records or four arbitrary months. Preserve each period's exact quarter end, publication/availability timestamp, provider field path, source object ID/hash, percentage string and reviewed semantic metadata. Reject missing quarters, malformed/duplicate periods, mixed bases, changed source definitions, mixed issuers, nonnumeric or out-of-range percentages, contradictory same-period values, post-cutoff disclosures and stale series. Do not invent period end dates from retrieval time, “1Y ago,” array order or the evaluation date.

Calculate any percentage-point delta only with the application's existing precise-decimal owner after the series passes semantic admission, not with UI floating-point arithmetic. No new scoring thresholds, valuation conclusions, weights, HOLD or READY status are introduced here.

## 5. Governance evidence contract

The governance component requires **original verifiable documents/events** relevant to the security and assessment cutoff, with issuer or official exchange/source identity, original document type, published/event dates, stable content SHA-256, source location and private-R2 object/readback where required, page/section or extract citation, and an explicit reviewer decision tied to the exact requirement. Potential items include governance disclosures, related-party transactions, auditor qualifications, pledges, material regulatory events, board/governance changes, or other requirement-specified events. These are candidate documentary categories, **not an invented universal mandatory list**.

Ownership trend alone cannot imply good governance; an absence of known adverse events cannot substitute for a reviewed complete governance-source window. When the exact profile-specific minimum, timeframe or adverse-event decision rule is not specified by an approved governing method, **DEFER** the governance component and preserve the blocker. Neither an AI summary nor a keyword match may count as human ACCEPT.

## 6. Implementation change set — gated, minimal, reviewable

1. **Canonical registry revision**: introduce a new immutable `OWNERSHIP_METHOD_SELECTION_V1` rule version associated with these three requirement codes, with explicit series, basis, four-quarter requirement, semantics-proof references, cutoff/freshness and conflict policy. Keep old registries and historical evidence untouched.
2. **Existing normalizer/validator owner**: bind provider series via exact field paths only after proof of source semantics. Emit typed period-end and percentage-string observations with source identity/hash; fail closed if period or denominator evidence absent.
3. **Governance validator**: model `OWNERSHIP_GOVERNANCE` as two separately traceable evidentiary dimensions (ownership and documents/events), without declaring any numerical composite or silently rewriting the existing scoring algorithm. If the existing canonical schema cannot express this conjunction, stop for explicit architecture/migration review rather than introducing a hidden parallel calculation.
4. **Immutable canonical evidence materialization**: after specifically scoped approval, append candidates and reviewer decisions through existing canonical handlers; preserve supersession and source lineage, and re-evaluate only targeted fixed-115 stocks. Never update historical observations in place.
5. **Read-only consumer**: surface series name, basis, four periods, source IDs, governance review state and explicit blockers from canonical snapshots; UI never recomputes or substitutes another series.

**No runtime source file, database schema or materializer was changed by preparing this proposal.** Production/main, deployment, paid acquisition, R2 and database writes are not authorized.

## 7. Targeted regression test contract (required before runtime activation)

- Exactly 4 distinct consecutive quarter ends with proven common series/basis: eligible for further freshness and review checks.
- 3 periods, a missing middle quarter, duplicate quarter with conflicting percentages, or mixed source series: reject.
- Mixed percentage denominators, unspecified percentage basis, or mixed standalone/consolidated security scope: reject.
- Invalid/non-calendar reporting dates, relative-date labels only, disclosure timestamp later than cutoff: reject.
- Non-numeric/negative/>100 percentage or rounded fabricated source value: reject.
- `Institutional` plus FII/MF/DII data does not result in summation; the single aggregate field remains independent.
- Valid Promoter 4Q evidence with absent governance review remains `OWNERSHIP_GOVERNANCE` DEFER.
- Governance document without verifiable original URL/content hash/cited source remains DEFER.
- Duplicate source capture with same identity/hash is idempotent; same identity with conflicting hashes/value is quarantined.
- Unchanged frozen 111, fixed 115, old snapshot lineage and release minima; no unrelated methodology or historical R1–R4 behavior changes.

Before declaring repository completion: run architecture guard, TS, app and Edge lint, targeted and full tests, Deno workflow tests, production build and whitespace verification on the **actual current code HEAD**. A historical green workflow is not current approval or operational acceptance.

## 8. Approval boundary and next steps

**Owner's three selections have been captured accurately, but the final operational admission contract remains conditional** on proof of exact provider field definitions/percentage denominator and a canonical governance-evidence conjunction rule. The owner may separately approve this method after reviewing these qualifications; such approval will **not** authorize provider calls or writes.

Then, in dependency order: identify exact source field definitions and retained captures; implement/verify the existing canonical validator path; obtain bounded source/write grants if missing; gather or normalize strictly sourced evidence; submit genuine requirement-level documentary review; run approved scoped materialization; re-read all 115 and frozen-111 coverage. V1-4 remains NOT PROVEN until those later canonical checks pass.
