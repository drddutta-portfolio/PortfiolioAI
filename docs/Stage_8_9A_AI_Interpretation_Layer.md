# Stage 8.9A — Evidence-Grounded AI Interpretation Layer

## Purpose

PortfolioAI now has a deterministic research-to-recommendation chain:

`evidence -> score -> sector-aware role -> action bias -> suggested weight -> persistence tracking`

Stage 8.9A adds an optional AI interpretation layer **above** that chain. The AI is not an authority for scoring, role selection, weight calculation or portfolio mutation. Its job is to explain the already-computed recommendation in plain investment language.

## Authority boundary

The AI may explain:

- why the deterministic role fits the current evidence;
- why the action bias is cautious or constructive;
- how to interpret the suggested weight range;
- what supports the thesis;
- what needs caution;
- what evidence changes could strengthen or weaken the view;
- what evidence limitations remain.

The AI may **not**:

- change the deterministic score;
- change Core/Satellite/Watch/Avoid status;
- change action bias;
- change suggested weight range;
- change the user's selected role, target weight, target price or stop loss;
- invent financial metrics, news, forecasts, prices or sector facts;
- place trades or mutate holdings.

## Input provenance

The Edge Function reads the latest persisted `stock_recommendation_runs` row for the authenticated owner. The prompt receives only an audited recommendation context:

- security symbol/name;
- scoring profile and policy version;
- overall score, score-ready coverage and evidence confidence;
- deterministic role and action bias;
- current and suggested portfolio weight;
- transition state and persistence count;
- persisted deterministic rationale;
- dimension summaries retained in recommendation rationale.

An SHA-256 input hash binds the AI interpretation to that exact evidence/recommendation state. If the recommendation changes, the previous interpretation is not treated as current.

## Storage

`stock_recommendation_runs` now retains:

- `ai_summary`;
- structured `ai_interpretation` JSON;
- input hash;
- provider/model;
- generated timestamp;
- READY/FAILED status;
- provider usage metadata.

This keeps the AI explanation auditable alongside the deterministic recommendation that it explains.

## Provider and cost control

Generation is owner-controlled from the Research page. Loading the page performs only a zero-cost PLAN check. AI is called only when the user selects **Generate AI interpretation** (or explicitly refreshes it).

The deployed Edge Function expects:

- `OPENAI_API_KEY` in Supabase Edge Function secrets;
- optional `OPENAI_INTERPRETATION_MODEL` (defaults to `gpt-5.6-luna`).

No Trendlyne or Angel One calls are consumed by AI interpretation.

## HDFCBANK reference implementation

HDFCBANK is the first reference stock. Its interpretation must preserve the current BANK/NBFC deterministic view. For example, if the deterministic engine says `CORE_CANDIDATE`, `ACCUMULATE`, `3–4%`, with weak momentum as a caution, AI may explain the tension between long-term quality and weak near-term momentum but cannot alter any of those outputs.

## Next gates

1. Configure the AI provider secret and generate the first HDFCBANK interpretation.
2. Review the generated explanation for faithfulness to the deterministic evidence.
3. Add explicit stale-interpretation messaging when a newer recommendation state exists.
4. Add AI interpretation history to the recommendation timeline if useful.
5. Validate the same pattern on reference stocks from other scoring profiles before broad rollout.
