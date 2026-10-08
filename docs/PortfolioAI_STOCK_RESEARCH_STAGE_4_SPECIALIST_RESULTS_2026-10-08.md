# PortfolioAI stock research — Stage 4 specialist results

Date: 8 October 2026

**Decision: Stage 4.1–4.4 implementation and hosted visual acceptance PASS.**

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
TypeScript/build, full application lint, changed shared Edge-module lint and
architecture data-boundary checks passed. Canonical normalization regressions
passed in Vitest; Deno integration was not rerun locally because Deno is unavailable.

Final hosted visual acceptance used application commit
`20d47fd82fde6fd16b2d6f3754334089a81d83a8` (including the mobile contract-reference
wrapping fix), deployment `dpl_FdYvpLHHFLjP4C9ZcmCdG5Rrqspo`, at
https://portfiolio-cn9k0ebe0-dibyendu-dutta.vercel.app.

All **216 authenticated, read-only Chromium checks PASS**. Desktop width 1440
covered HDFCBANK, TORNTPHARM, ALIVUS, AUROPHARMA, BIOCON, AKUMS and ABCAPITAL;
mobile width 390 covered HDFCBANK, TORNTPHARM and AKUMS. Checks included all five
Pharma primary frameworks, specialised contract disclosures/unproven bindings,
the three selected-result tabs, stable snapshot/assignment lineage, one snapshot
selection across tab navigation, expanded mobile grid containment, tab/page
containment and sticky-menu Summary navigation. Runtime errors, provider refresh
attempts, research writes and REST read failures were all zero.

Desktop HDFCBANK Financials, TORNTPHARM expanded specialised requirements, and
mobile TORNTPHARM/AKUMS screenshots were visually inspected privately. The first
mobile run found long contract-version strings overflowing; the final application
commit wraps those references and the full hosted run above verifies the fix.
No localhost application or screenshot was used. Browser auth and portfolio
screenshots are not committed.

[Sanitized final hosted evidence](research-ui-sector-review-evidence/stock-research-stage-4-verification-2026-10-08.json)
and the coverage manifest are committed. Review:
https://github.com/drddutta-portfolio/PortfiolioAI/pull/117.

GitHub Actions could not start the architecture job: account payments/spending
limits blocked runner startup (empty steps). This is not a green CI claim or a
failed application check. Local checks above passed; no billing/protection changes
were made. Stage 4 has not been merged to Development. C1/C8 classification and
operational evidence-gate acceptance remain separate and unproven where recorded.
