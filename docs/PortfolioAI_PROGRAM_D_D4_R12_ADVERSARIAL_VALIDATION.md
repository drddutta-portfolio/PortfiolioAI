# PortfolioAI — Program D D4 R12 Grounding & Adversarial Validation

**Status:** COMPLETE / PASS / CLOSED (independent-audit remediation validated)
**Date:** 25 September 2026  
**Branch:** `program-d-operations-optional-ai`  
**Authority:** D4 only  
**Inherited state:** D0/D1/D2/D3 = CLOSED; R11 = CLOSED

**Remediation closure:** The executable D4 matrix now contains 16 non-vacuous local
checks, including four unsupported textual claims, injected generation failure,
owner-context before/after comparison and structural rejection of every frozen
trade/order output key. The prompt-injection result is explicitly limited to the
`LOCAL_MOCK_ONLY` implementation and is not presented as real-model evidence. All
16 checks passed in the local Investment Committee UI on 25 September 2026.

## 1. Purpose

D4 validates the bounded local R12 interpretation layer against the frozen
grounding, authority, failure and abuse matrix.

D4 is local/mock only unless a separate real-AI pilot is explicitly authorized.

## 2. Frozen D4 validation matrix

The implemented D4 harness validates:

1. exact packet grounding;
2. numeric claim verification;
3. citation resolution;
4. unsupported-fact rejection;
5. deterministic-state preservation;
6. contradictory evidence preservation;
7. prompt-injection resistance;
8. malformed-output rejection;
9. AI timeout/unavailability fail-safe behavior;
10. cache/idempotency;
11. cost limits;
12. authority-conflict rejection;
13. no owner mutation;
14. no R10 override;
15. deterministic system remains available when AI fails;
16. trade/order output keys are structurally rejected.

## 3. Runtime schema validation

D4 adds runtime parsing for unknown narrative payloads.

Malformed output fails closed as:

```text
REJECTED_SCHEMA
```

The parser requires all frozen R12 output fields and exact array/string shapes
before authority or grounding validation proceeds.

## 4. Exact grounding

The local reference narrative must remain bound to:

- exact packet SHA-256 identity;
- supplied R9 state;
- supplied R10 state;
- supplied evidence/citation ids.

The narrative cannot substitute a different deterministic state.

## 5. Numeric claims

D4 validates both sides:

- a number exactly present in the typed packet may be used;
- an unsupported standalone number is rejected.

Digits embedded inside identifiers such as `R10` and `R12` are not treated
as financial numeric claims.

## 6. Citations

Every output citation id must resolve to the supplied packet evidence list.

Unknown citation ids produce:

```text
REJECTED_UNSUPPORTED_CITATION
```

## 7. Contradictions

Contradictory evidence supplied by the packet remains visible in narrative
output.

R12 may explain contradictions but cannot suppress or resolve them into a new
deterministic conclusion.

## 8. Prompt injection

D4 includes an untrusted SOURCE_EXCERPT fixture containing instructions to:

- ignore system rules;
- recommend BUY;
- override R10;
- invent a target weight;
- reveal hidden prompts.

The local R12 runtime treats the source excerpt as data. It is not used as an
instruction source and does not change authority or output policy. This evidence
is explicitly **LOCAL_MOCK_ONLY prompt-injection resistance** and is not evidence
of real-model safety.

## 9. Malformed output

Unknown/malformed provider-style output is rejected before it can become a valid
Investment Committee narrative.

## 10. AI unavailable / timeout boundary

D4 validates:

```text
AI available = false
deterministic packet available = true
AI narrative = null
```

AI unavailability does not block, stale, delete or alter deterministic
R6-R10 state.

## 11. Cache / idempotency

Same:

```text
packet hash + prompt version
```

reuses the already validated narrative identity.

No duplicate semantic narrative generation is required locally.

## 12. Cost boundary

D4 inherits the D3 cost ceiling:

```text
provider = LOCAL_MOCK_ONLY
external AI calls = 0
external cost/run = 0
daily external cost = 0
weekly external cost = 0
scheduled AI = false
```

Real AI-provider execution remains separately unauthorized.

## 13. Authority conflict

Outputs containing a competing canonical action or priority are rejected as:

```text
REJECTED_AUTHORITY_CONFLICT
```

R12 cannot override:

- R6 score;
- R7 recommendation;
- R8 decision context;
- R9 materiality/change state;
- R10 action/priority;
- owner role/weight settings;
- sizing authority;
- trade/order authority.

## 14. Owner / R10 preservation

The adversarial harness validates that:

- owner-controlled role/min/max/target fields remain unchanged;
- R10 remains the sole canonical Action Center state;
- AI priority/action fields are rejected;
- deterministic packet state remains usable if AI fails.

## 15. Investment Committee UI

The existing authenticated route:

```text
/app/investment-committee
```

now includes a D4 adversarial-validation section with per-check PASS/FAIL cards.

The D3 bounded reference packet/generation UI remains available below it.

## 16. Files added / changed

Added:

```text
src/features/operations/programD4R12Validation.ts
src/features/operations/programD4R12Validation.test.ts
docs/PortfolioAI_PROGRAM_D_D4_R12_ADVERSARIAL_VALIDATION.md
```

Changed:

```text
src/features/operations/programD3R12Validator.ts
src/pages/InvestmentCommitteePage.tsx
src/features/operations/programD3R12.css
```

## 17. Required local validation

Before D4/R12 may close:

- pull exact D4 branch HEAD;
- local Supabase/Vite healthy;
- open `/app/investment-committee`;
- run D4 adversarial validation;
- all 15 cards PASS;
- external AI calls remain 0;
- external cost remains 0;
- deterministic packet remains visible/usable;
- D4 tests pass;
- D3/D2/D1/D0/Program C regressions pass;
- targeted D4 lint passes;
- typecheck passes;
- architecture guard passes;
- production build passes;
- `git diff --check` passes;
- local working-tree audit shows no D4 drift.

## 18. Current checkpoint

```text
D0 = COMPLETE / PASS / CLOSED
D1 = COMPLETE / PASS / CLOSED
D2 = COMPLETE / PASS / CLOSED
R11 = COMPLETE / PASS / CLOSED
D3 = COMPLETE / PASS / CLOSED
D4 = COMPLETE / PASS / CLOSED

R12 = COMPLETE / PASS / CLOSED
real AI provider pilot = NOT RUN / NOT AUTHORIZED
D-FINAL = AUTHORIZED
```


## 19. Validation result

```text
D4 = COMPLETE / PASS / CLOSED
R12 = COMPLETE / PASS / CLOSED
real AI provider pilot = NOT RUN / NOT AUTHORIZED
D-FINAL = AUTHORIZED
```
