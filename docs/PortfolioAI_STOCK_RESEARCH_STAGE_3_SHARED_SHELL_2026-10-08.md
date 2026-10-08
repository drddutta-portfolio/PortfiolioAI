# PortfolioAI stock research — Stage 3 shared shell

Date: 8 October 2026

## Implementation and decision

Stage 3 implements the Industry-first identity presentation in the common
ResearchPage shell, for every stock using that page. It consumes Stage 2's selected
canonical scoring/evidence context; it does not select or reassign methodologies.
**Decision: Stage 3 implementation and hosted visual acceptance PASS.** The
final spacing correction is included in the verified hosted build. All 118
read-only checks passed across seven representative stocks. This accepts the
Stage 3 common shell; it does not certify C1/C8 classification, specialist result
expansion, research evidence qualification or an all-stock final rollout.

## Sub-stages

| Sub-stage | Implemented behavior |
|---|---|
| 3.1 Identity | Compact, fully wrapping company names retained; symbol, exchange, instrument and asset class explicit. Industry is the first research identity field. |
| 3.2 Classification | Basic Industry has its own field, Sector is contextual. Missing official levels and verification remain explicitly unavailable. No subprofile becomes an official classification level. |
| 3.3 Assignment | Methodology/profile and primary subprofile are separate. All five canonical Pharma primary codes use their approved display names. Other supplied resolved primary codes remain visible; missing optionality metadata is labelled not supplied, never guessed to be not applicable. |
| 3.4 States and continuity | Classification verification, research assignment, evidence and assessment engine states are separate. Terminal read failures no longer leave loading labels in the decision summary or insights. Sticky navigation, owner plan editing and independent Core/Satellite role controls retained. |

## Authority and known data gaps

Sector/Industry continue to consume the shared research/portfolio classification
projection. Methodology, primary business model, assignment lineage and research
states consume the selected canonical research context. Disclosure preserves
methodology authority/version, assignment authority/version/ID and snapshot/date.
The assignment's classification version is not claimed as a verified taxonomy
source version.

The current projection does not expose Macro-Economic Sector, Basic Industry,
official taxonomy node IDs/source version or a hierarchy validation result. These
are visibly unavailable. Therefore classification conflicts cannot be certified
or dismissed from display labels. Completing that projection and C1/C8 validation
remains separate work. No new database reads, migrations, provider refreshes,
classification inferences, financial calculations or recommendation rules are
introduced by Stage 3.

## Verification and release boundary

Focused shell and canonical flow suite: 93 tests passed across nine files before
the additional terminal-error regression. The final three-file shell suite passed
all 55 tests, including that regression. Full lint, TypeScript/build and the
architecture data-boundary guard passed. Hosted build status is recorded in the
review pull request. A dedicated shared identity suite covers all
five Pharma profiles, unresolved primary assignments, missing official refinement,
independent evidence/engine states and suppression of retained assignment data
during loading/error. Existing navigation and owner-control regressions remain.
React review confirms a pure presentation component with no fetches, new hooks,
mutable shared state or competing authority.

Review: https://github.com/drddutta-portfolio/PortfiolioAI/pull/116

Stage 4 specialist result expansion is outside this change. The reviewed branch
was subsequently merged to `PortfolioAI-Development` through PR #116 as merge
commit `00a0dfe5621450354c7e6027820870becc5f9f11`. This merge is repository state,
not a Production deployment. Hosted acceptance remains anchored to the exact
reviewed commit/deployment evidence below; local rendering or an older preview
cannot substitute for that evidence.

## Initial hosted evidence — 8 October 2026 (superseded by final acceptance)

Authenticated, read-only Chromium verification against deployment
`dpl_3dD2iX5q1bkKcJHit1G2fxLP3Q2E`, application commit
`bfbc00d15c25a86919d69dcb2325b3920447e6c5`, passed all 115 checks.
The seven stocks were HDFCBANK, TORNTPHARM, ALIVUS, AUROPHARMA, BIOCON,
AKUMS and ABCAPITAL. Each selected one canonical snapshot with no live legacy
assignment read; header, specialist requirements and Evidence retained matching
assignment/snapshot lineage. All five Pharma primary labels matched their deep
frameworks. Industry-first identity, unavailable Basic Industry/verification,
independent owner role, desktop name containment and mobile page containment
passed. Runtime errors, provider refresh attempts and research writes: zero.
Desktop HDFCBANK and mobile AKUMS screenshots were inspected privately; screenshots
containing portfolio data are not committed.

Visual inspection found excessive paragraph spacing. Application commit
`506ffbd91808bc70fa01be9c07395febda5b3e40` reduces the shared identity paragraph
spacing/font size while retaining full wrapping. Its TypeScript/build passed,
but Vercel rejected its preview with **Deployment rate limited — retry in 24
hours**. The 115-check report is evidence for the earlier commit, not the final
spacing correction. Final desktop/mobile visual acceptance, including the added
mobile sticky-menu interaction check, remains pending. No quota/protection changes
or alternate local application screenshots were used.

Sanitized evidence: [hosted verification report](research-ui-sector-review-evidence/stock-research-stage-3-verification-2026-10-08.json).

## Final hosted visual acceptance — PASS, 8 October 2026

The retry built the exact final repository commit
`9e736abc80d87b551e5c15f045d69ab2c74d31e3`, including application spacing fix
`506ffbd91808bc70fa01be9c07395febda5b3e40`. Deployment
`dpl_5EdyfbpZpmw339krsZ3nznSQWPUn` is READY at
https://portfiolio-2wkchcs2g-dibyendu-dutta.vercel.app.
This is a review preview, not the Development branch alias.

Authenticated Chromium checked HDFCBANK, TORNTPHARM, ALIVUS, AUROPHARMA,
BIOCON, AKUMS and ABCAPITAL at desktop width 1440 and AKUMS at mobile width
390. **All 118 checks passed**: compact full-name containment, Industry-led
classification presentation, explicit missing Basic Industry/verification,
independent owner role, all five Pharma primary models matching their deep
frameworks, one canonical snapshot selection and consistent assignment/evidence
lineage, mobile page containment, sticky section-menu position and Summary link
navigation. No live legacy assignment reads, runtime errors, provider refresh
attempts, research writes or REST read failures occurred.

HDFCBANK and TORNTPHARM desktop screenshots and AKUMS mobile screenshot were
visually inspected from the hosted build. The excessive identity-row spacing is
resolved and no identity labels or company names are cropped. Screenshots and
browser authentication remain private. The sanitized report below now records
this final deployment rather than the earlier first-pass build.

The application commit's Architecture Guard CI passed:
https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/37734884062.
The later documentation-only commit's CI job did not start: GitHub reported
failed recent account payments or a spending limit requiring adjustment. This is
an independent CI infrastructure blocker, not a failed visual or application
check. No billing changes were made. Development merge/release remains separate.

No application code changed during this acceptance retry. Only acceptance records
and sanitized verification evidence are updated after the hosted PASS.
