# Stage 8.8C — Sector- and Portfolio-Aware Suggested Weight Range

## Purpose

PortfolioAI now separates the user's manually selected target weight from a deterministic, read-only suggested allocation range. The suggestion is advisory only and never changes holdings, target weight, role, target price or stop loss.

## Design principles

A suggested weight is not derived from the overall score alone. It is constrained by:

- sector/business scoring profile;
- PortfolioAI role suggestion;
- overall deterministic score;
- sector-specific Momentum and Risk cautions;
- single-stock maximum;
- current portfolio weight;
- current reviewed same-profile portfolio exposure;
- portfolio profile-classification coverage before concentration caps are trusted;
- the user's separately stored target weight for comparison only.

The output is intentionally a range rather than a false-precision point estimate.

## BANK/NBFC reference policy

The HDFCBANK pilot uses the BANK_NBFC v1 DRAFT policy:

- Core high conviction: 4–6%
- Core standard: 3–4.5%
- Core cautious: 2–3%
- Satellite standard: 1–2.5%
- Satellite cautious: 0.5–1.5%
- Watch: 0–1%
- Avoid: 0%
- single-stock maximum: 6%
- weak Momentum can cap the upper end at 4%
- weak Risk can cap the upper end at 3%
- profile concentration soft cap: 25%
- profile concentration hard cap: 35%

These remain DRAFT reference-stock parameters until validation is complete.

## Portfolio context

`get_portfolio_profile_weight_context_v1` calculates current portfolio weight from open quantities and the authoritative ANGEL_ONE latest-price cache. It also calculates same-profile exposure using only REVIEWED `security_scoring_profile_assignments`.

Portfolio concentration caps are applied only after at least 70% of portfolio weight has reviewed scoring-profile assignments. Until then, PortfolioAI explicitly says the concentration guard is pending classification rather than pretending the incomplete taxonomy is complete.

At implementation time, HDFCBANK is about 0.535% of portfolio value, while reviewed scoring-profile assignments cover only about 4.71% of portfolio weight (4 of 248 priced open positions). Therefore the BANK/NBFC concentration guard is correctly withheld for now.

## HDFCBANK expected preview

With the current HDFCBANK evidence:

- suggested role: Core candidate;
- overall preview score: about 80;
- Momentum: weak/risk state;
- base Core standard range: 3–4.5%;
- weak Momentum upper cap: 4%;
- expected suggested range: 3–4%;
- current weight: about 0.53%;
- user's current target: 1.5%;
- current and target weights are therefore both below the PortfolioAI range.

This is a research/advisory preview, not a trade instruction.

## UI

The PortfolioAI advisory card now displays:

- Suggested weight range;
- Current portfolio weight;
- User target weight;
- Known same-profile exposure;
- Below / Within / Above suggested range state;
- expandable `Why this range?` rationale;
- explicit read-only language.

## Next gates

1. Validate the HDFCBANK range against the BANK/NBFC reference model.
2. Complete sector/profile assignments before enabling portfolio concentration caps broadly.
3. Add sustained weight-change signals (increase / maintain / reduce) only after recommendation-policy validation.
4. Persist official suggested ranges only after the recommendation model leaves DRAFT.
5. Add AI narrative synthesis above these deterministic constraints; AI must not invent or silently change weights.
