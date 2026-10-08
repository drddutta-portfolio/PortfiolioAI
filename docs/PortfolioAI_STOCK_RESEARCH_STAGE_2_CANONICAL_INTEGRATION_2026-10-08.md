# Stock Research Stage 2 — Canonical Page Data Integration

**Date:** 8 October 2026 (Asia/Kolkata)
**Status:** IMPLEMENTED / VERIFIED / MERGED TO DEVELOPMENT VIA PR #116. Production deployment remains separate.
**Authority:** [Stage 1 contract](PortfolioAI_STOCK_RESEARCH_INDUSTRY_FIRST_STAGE_1_CONTRACT_2026-10-08.md) and [stock-page design plan](PortfolioAI_STOCK_RESEARCH_PAGE_DESIGN_PLAN_2026-10-06.md).

| Sub-stage | Result |
|---|---|
| 2.1 Trace consumers | Scoring already used the approved P7 route. Readiness and specialist requirements independently selected current snapshots; Pharma header, workspace and R6 also used legacy assignment resolution. |
| 2.2 Share canonical projection | `useStockResearchContext` selects evidence once and passes the exact snapshot to scoring. All current-page evidence panels receive that result. Portfolio/security ownership and explicit-null semantics are enforced at the scoring repository boundary. |
| 2.3 Remove contradictory assignment selection | Header, live Pharma framework and R6 consume the resolved canonical route. Original reviewed research remains accessible as earlier-review detail; its legacy read is deferred until opened and cannot override current assignment/readiness. |
| 2.4 Preserve lineage and safeguards | Assignment identity/version, methodology authority/version, actual classification version and evidence snapshot/date remain distinct. Missing official hierarchy and secondary/reviewer metadata stay unavailable. Unbound Pharma parent scores cannot be promoted to qualified current scores. |

## Verification scope

Regression coverage includes all five Pharma primary models, blocked/review states,
no legacy-only specialist activation, exact snapshot injection without reselection,
wrong portfolio/security rejection, canonical read errors, portfolio navigation,
reload with changed or unchanged snapshot identity, shared evidence consumption,
lineage preservation and score suppression. Existing classification remains
contextual; company assignments and methodology contracts are not rewritten.

This is data-flow integration. Stage 3's Industry-led visual identity layout,
Stage 4's full specialised result presentation, taxonomy remediation C1/C8 and
methodology/evidence qualification retain their separate gates. No migrations,
research/database writes, provider execution or Development merge are part of this change.

## Verification results and release decision

- **264 focused tests / 21 files passed** after the selection-revision fix. Coverage includes all five Pharma primary models, ownership rejection, canonical/legacy disagreement, exact snapshot injection, blocked score display and navigation/reload races.
- **TypeScript and production build passed.** The build retains the existing large-chunk warning; no code splitting was introduced in this bounded integration.
- **Full repository lint and architecture guard passed.** Relative documentation references, credential-pattern scan and the complete diff against Development pass; no schema or financial calculation changes exist.
- GitHub CI at application revision `18cca189e08ba34dd58b4570cef6dc9d817622af` passed Stage 2 tests, retained shell tests, authority/Pharma safeguards, TypeScript, lint and build. Its final whitespace check identified Markdown header trailing spaces in the new contracts. Those spaces were removed in `ddae8c89`; the [corrected CI run](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/37732538454) passed. The Vercel preview check remains independently blocked.
- An authenticated **read-only Development backend query passed** for HDFCBANK, TORNTPHARM, ALIVUS, AUROPHARMA, BIOCON, AKUMS and ABCAPITAL: seven canonical snapshots and all five Pharma primary codes. No research writes or provider calls were performed. This verifies the approved backend data, not a new hosted-page build.

### Hosted acceptance blockers and repair

The available hosted Stage 2 preview is deployment
`dpl_CuRoyBnLrMoSaVMsGgtPjPgcPyg7` at
`fbe27b4092bc47a94c075d398d8ddcc3f7bb3d70`, before the final selection-revision
safeguard. Native Chromium inspection reached the authenticated HDFCBANK page;
its canonical read failed with PGRST205 because the preview backend did not
expose `current_research_evidence_snapshot_lineage_v1`. The shell rendered
unavailable/blocked research rather than guessing another assignment. No browser
runtime errors, provider execution attempts or research writes were observed.
This inspection is **not** seven-stock visual acceptance or final-head acceptance.

Vercel's Development branch has public Supabase URL/publishable-key overrides
that this review branch did not inherit. Both public client settings were added
for **Preview / research-pharma-sector-display-review only**, copied from the
approved Development overrides and read back to confirm exact matches. No
Production/Development settings, service credentials, backend schema or RLS were
changed. Existing compiled deployments are unaffected by environment changes.

Vercel rejects newer builds with **“Deployment rate limited — retry in 24 hours.”**
No protection settings, quotas or billing configuration were changed. A rebuild
against the corrected Preview settings and exact reviewed commit is required
before hosted acceptance. Then check HDFCBANK, all five Pharma representatives,
ABCAPITAL and blocked cases: header/framework/R6/requirements must agree on their
assignment and snapshot, tab changes must not reselect, and mobile layout and
read-only browsing must remain intact.

**Decision:** Stage 2.1–2.4 implementation is complete and reviewable in PR #116;
its release acceptance remains blocked by the hosted rebuild. Do not describe it
as deployed to Development or close C1/C8, Stage 3/4 or all-stock visual acceptance.
