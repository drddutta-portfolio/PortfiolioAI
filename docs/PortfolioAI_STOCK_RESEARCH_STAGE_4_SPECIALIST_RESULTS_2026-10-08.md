# PortfolioAI stock research — Stage 4 specialist results

Date: 8 October 2026

## Scope and authority

Stage 4 implements the Industry-first plan's stock-specific research presentation
under the Stage 3 common shell. It consumes the selected canonical P7 snapshot,
immutable requirement items and approved Pharma subprofile contracts. It does not
classify a company, reassign a methodology, normalize source values, qualify a
score or approve operational V1-4/V1-5 evidence gates.

| Sub-stage | Implementation |
|---|---|
| 4.1 Framework summary | Industry, unavailable Basic Industry, Sector context, selected methodology/primary subprofile, assignment and engine state shown separately; effective authority/version and snapshot lineage remain accessible. |
| 4.2 Contract-selected result tabs | Financials, Quality & Growth and Valuation show retained items whose exact canonical IC1 requirement codes have matching declared dimensions. Overview/Evidence retain every item; missing dimension mappings never borrow bank/default layouts. Shared Ownership/Documents authorities remain intact. |
| 4.3 Pharma specialisation | Each of the five approved primary contracts exposes its own effective metrics, applicability, required history/periods, source and freshness requirements in expandable dimension groups. Results require exact selected-snapshot requirement/metric-code binding. Parent Pharma evidence cannot imply specialised completeness. Earlier reviewed research remains separately labelled and lazy-mounted. |
| 4.4 Readable results and safeguards | Source observation tables preserve exact values, zero, unit/currency, individual period/scope/source/publication. Incomplete value bases are unavailable; complete original payloads remain in disclosure. Mixed observations are never pooled into a trend. Qualification remains separate from score/advice. Cross-snapshot items fail closed. |

The shared IC1 metadata (signal interfaces and existing Pharma fallback signal
list) is moved without semantic changes into a dependency-free module used by
both canonical materialization and presentation. No calculation or evidence
selection rule changes. The frontend imports the canonical profile definitions,
not a duplicated industry classifier or independent methodology table.

## Coverage and limits

The [presentation coverage manifest](research-ui-sector-review-evidence/stock-research-stage-4-presentation-coverage-2026-10-08.json)
enumerates all 47 current canonical profile definitions and all five Pharma
primary contracts. This is a registry observation, not a permanent ceiling.
Unknown profiles still retain selected requirements. Engine availability is read
from selected canonical state, not inferred from presentation coverage.

Contracts without declared dimensions retain their items in Overview/Evidence;
the tab explicitly explains the missing mapping. Specialised requirements without
an exact immutable-snapshot binding show qualification unproven. This UI cannot
repair those upstream data/contract gaps or infer secondary exposure review.

Existing financial/quality/valuation source observations remain accessible in
collapsed disclosures, separately from the selected contract's result view.
No new database query, schema/migration, provider call, stored evidence write,
classification, financial formula, recommendation or owner-plan change is added.

## Verification and acceptance

Initial focused verification: 147 tests across six files passed, covering all
47 profile definitions, all five Pharma primary labels, exact contract tab
selection, unknown-profile fallback, snapshot mismatch, zero/precision, unsafe
currency bases, preserved original payloads and unchanged canonical normalization.
TypeScript/build, full lint and architecture data-boundary checks passed.

Hosted visual acceptance must verify this exact Stage 4 application commit on
Vercel against the approved Development backend; local screenshots cannot replace
that evidence. Final hosted results and review link will be recorded here after
verification. Stage 4 has not been merged to Development.
