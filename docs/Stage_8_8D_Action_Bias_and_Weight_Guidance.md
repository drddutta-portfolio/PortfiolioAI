# Stage 8.8D — Action Bias + Portfolio Weight Guidance

## Goal

Turn the existing sector-specific role recommendation and suggested weight range into a deterministic, read-only action bias without giving PortfolioAI authority to trade, alter holdings or overwrite the user's selected role/target weight.

Pipeline:

`validated research -> sector score -> role recommendation -> persistent upgrade/downgrade state -> suggested weight range -> action bias -> later AI explanation -> user decision`

## Supported action biases

- `ACCUMULATE`
- `HOLD`
- `REDUCE`
- `EXIT_CANDIDATE`
- `WAIT`

These are research/advisory states only. No transaction is generated.

## Deterministic rules

The action engine combines:

- sector-specific role recommendation;
- current portfolio weight versus the suggested range;
- persistent upgrade/downgrade status;
- role cautions such as weak momentum;
- portfolio-aware sizing constraints from Stage 8.8C.

Examples:

- Core/Satellite candidate + below range -> Accumulate toward range.
- Below range + weak momentum -> Accumulate gradually; weak momentum remains visible as a caution.
- Within range -> Hold.
- Above range -> Reduce toward range.
- Pending downgrade -> Hold / downgrade watch; do not increase while the downgrade is unconfirmed.
- Confirmed downgrade + above range -> Reduce.
- Watch -> Wait/watch unless current exposure exceeds the Watch range, then Reduce.
- Avoid with an existing position -> Exit candidate; without an existing position -> Do not add / Wait.

## Persistence

`record_recommendation_preview_v2` stores the action bias and the suggested weight range on the same recommendation record used by the persistent role-tracking system. Existing evaluation-key deduplication remains intact; revisiting the same evidence state does not create a new recommendation evaluation.

Tracking History now retains the role recommendation, action bias, suggested weight range, transition status and date.

## HDFCBANK reference-stock expectation

With the current BANK/NBFC pilot evidence:

- Role: Core candidate
- Current weight: about 0.53%
- Suggested range: about 3–4%
- Momentum: weak
- Expected action bias: `Accumulate gradually`

The weak Momentum state deliberately moderates the wording; it does not erase the stronger long-term bank-quality evidence.

## Safety / authority

PortfolioAI does not:

- place orders;
- change portfolio holdings;
- change the user's selected Core/Satellite role;
- alter target weight, target price or stop loss;
- convert the DRAFT recommendation policy into an official score or official portfolio mandate.

The next layer may use AI to explain these deterministic outputs, but AI must not invent new evidence or override the deterministic recommendation state.
