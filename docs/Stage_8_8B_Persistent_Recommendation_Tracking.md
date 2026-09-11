# Stage 8.8B — Persistent Upgrade / Downgrade Tracking

## Goal

PortfolioAI must not promote or demote a stock because of one transient observation. Recommendation changes are tracked across distinct evidence states and only become confirmed after persistence rules are satisfied.

## What is persisted

Read-only recommendation previews are recorded in `stock_recommendation_runs` only when the underlying scoring evidence changes. An `evaluation_key` deduplicates ordinary page reloads so refreshing the browser cannot manufacture persistence.

Each preview retains:

- sector/scoring profile and recommendation policy version;
- deterministic overall score and score-ready coverage;
- suggested role;
- user-selected role at evaluation time;
- directional change signal (`UPGRADE`, `DOWNGRADE`, `UNCHANGED`, `INITIAL`);
- transition status;
- consecutive qualifying evaluation count;
- deterministic rationale and cautions.

No preview can alter the user's portfolio role, holdings, target weight, target price or stop loss.

## Anti-churn policy

Persistence is profile-specific through `recommendation_profile_policies.persistence_rules`.

BANK/NBFC v1 currently requires:

- 2 distinct qualifying evaluations to confirm an upgrade;
- 2 distinct qualifying evaluations to confirm a downgrade.

The two evaluations must represent distinct scoring/evidence states. Reloading the same evidence does not increment the counter.

## Transition states

- `INITIAL` — first tracked recommendation baseline.
- `STABLE` — same recommendation under a new evidence state.
- `PENDING_UPGRADE` — improved role candidate, not yet persistent enough.
- `CONFIRMED_UPGRADE` — upgrade persisted for the required evaluations.
- `PENDING_DOWNGRADE` — weaker role candidate under review.
- `CONFIRMED_DOWNGRADE` — downgrade persisted for the required evaluations.
- `EVIDENCE_PENDING` — recommendation evidence is incomplete.

## Color language

The UI uses a consistent semantic color scheme:

- confirmed upgrade: green;
- pending upgrade: light green;
- stable: green/teal;
- initial baseline: blue;
- pending downgrade: amber;
- confirmed downgrade: red;
- evidence pending: grey.

A compact expandable history is shown inside the PortfolioAI suggestion card.

## Authority boundary

This stage records only `PREVIEW` recommendation runs. It does not activate official recommendation runs, AI-generated portfolio actions, suggested weights, or automatic portfolio mutations.

## Next stage

Stage 8.8C will add sector- and portfolio-aware suggested weight ranges. The later AI synthesis layer will explain the deterministic recommendation and weight rationale, but will not override the underlying scoring or user decision.
