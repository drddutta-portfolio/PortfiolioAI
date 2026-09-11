# Stage 8.8A — Sector-Aware Recommendation Foundation

## Purpose

PortfolioAI recommendations must be sector/business-profile specific. A bank cannot be judged by the same recommendation gates as an IT services company, a commodity producer or a capital-goods company.

This stage creates the recommendation control plane without activating automatic portfolio actions.

## Architecture

`Research evidence -> sector/profile-specific deterministic score -> sector-specific recommendation policy -> PortfolioAI role preview -> later AI synthesis -> user decision`

The deterministic layer remains the source of truth. AI will explain, compare, summarize thesis changes and produce evidence-grounded recommendations; it must not invent facts or silently change a portfolio role.

## Recommendation policy table

`recommendation_profile_policies` is keyed by scoring profile and policy version. It stores:

- minimum score-ready coverage;
- role thresholds;
- mandatory dimension floors;
- caution rules;
- sector-specific primary/context dimensions;
- lifecycle status (`DRAFT`, `REVIEWED`, `ACTIVE`, `RETIRED`).

All 12 scoring profiles now have a sector-focus scaffold. Only `BANK_NBFC` has pilot thresholds because HDFCBANK is the first reference stock. The other profiles intentionally keep role thresholds unset until each sector has a validated reference implementation.

## HDFCBANK / BANK_NBFC pilot

The BANK/NBFC recommendation policy is DRAFT and read-only. It explicitly prioritizes:

- Quality
- Growth
- Balance Sheet / Credit
- Valuation
- Risk

Capital Efficiency, Momentum and Ownership/Governance remain contextual inputs. Cash Flow is not applicable to the BANK/NBFC scoring profile.

The policy includes a momentum caution rule so a high-quality bank can remain a Core candidate while still surfacing weak market momentum rather than hiding that disagreement.

## Recommendation history foundation

`stock_recommendation_runs` is created for future persisted recommendation history. It is designed to retain:

- suggested role;
- action bias;
- current user role and portfolio weight at evaluation time;
- future suggested weight range;
- upgrade/downgrade/unchanged signal;
- persistence count;
- deterministic rationale;
- optional later AI summary.

Stage 8.8A does not write recommendation runs yet. This prevents a DRAFT policy from becoming an official recommendation history accidentally.

## UI behavior

The `PortfolioAI suggestion` card now reads the current sector/profile-specific DRAFT policy and computes a read-only preview. It remains visually and functionally separate from `Your selected role`.

No suggestion can overwrite the user's role, target weight, target price or stop loss.

## Next gates

1. Validate HDFCBANK BANK/NBFC role thresholds and mandatory floors.
2. Resolve HDFCBANK canonical sector/industry and finish evidence/document cleanup.
3. Promote the BANK/NBFC policy from DRAFT only after review.
4. Add persisted recommendation runs and sustained upgrade/downgrade logic.
5. Add portfolio-aware weight ranges and sector concentration constraints.
6. Add AI synthesis on top of deterministic recommendation outputs.
7. Validate one reference stock per remaining scoring profile before enabling that sector's recommendation thresholds.
