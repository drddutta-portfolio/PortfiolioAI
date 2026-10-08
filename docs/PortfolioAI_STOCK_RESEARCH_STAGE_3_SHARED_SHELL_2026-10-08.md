# PortfolioAI stock research — Stage 3 shared shell

Date: 8 October 2026

## Implementation and decision

Stage 3 implements the Industry-first identity presentation in the common
ResearchPage shell, for every stock using that page. It consumes Stage 2's selected
canonical scoring/evidence context; it does not select or reassign methodologies.
Implementation is ready for review. The first hosted implementation passed 115 checks; final visual acceptance of
the subsequent spacing correction is blocked by Vercel's deployment rate limit.
This record does not approve an all-stock final rollout.

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

Stage 4 specialist result expansion is outside this change. This branch has not
been merged or deployed to Development. Hosted acceptance must use the exact new
commit on Vercel with the approved Development backend, including desktop/mobile
name wrapping, section navigation and representative bank/Pharma pages; local
rendering or an older preview cannot substitute for that evidence.

## Hosted evidence — 8 October 2026

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
