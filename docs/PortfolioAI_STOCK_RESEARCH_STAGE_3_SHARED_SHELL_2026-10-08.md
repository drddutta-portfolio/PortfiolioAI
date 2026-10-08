# PortfolioAI stock research — Stage 3 shared shell

Date: 8 October 2026

## Implementation and decision

Stage 3 implements the Industry-first identity presentation in the common
ResearchPage shell, for every stock using that page. It consumes Stage 2's selected
canonical scoring/evidence context; it does not select or reassign methodologies.
Implementation is ready for review. Hosted visual acceptance is pending a new
Vercel preview; this record does not approve an all-stock final rollout.

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
