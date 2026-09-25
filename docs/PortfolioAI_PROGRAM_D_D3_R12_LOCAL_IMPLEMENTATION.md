# PortfolioAI — Program D D3 Optional R12 Local Implementation

**Status:** COMPLETE / PASS / CLOSED  
**Date:** 25 September 2026  
**Branch:** `program-d-operations-optional-ai`  
**Authority:** D3 only  
**Inherited state:** D0/D1/D2 = CLOSED; R11 = CLOSED

## 1. D3 purpose

D3 implements bounded, on-demand R12 locally without activating a real AI
provider.

D3 provider/cost ceiling:

```text
mode = LOCAL_MOCK_ONLY
external AI calls per run = 0
external daily calls = 0
external weekly calls = 0
external cost per run = 0
external daily cost = 0
external weekly cost = 0
maximum concurrent local generations = 1
maximum transient retries = 1
scheduled generation = false
portfolio-wide event-driven generation = false
```

A real cost-bearing AI call remains separately gated for D4 or later.

## 2. Deterministic fact packet

D3 adds `PROGRAM_D_R12_FACT_PACKET_V1`.

The packet is immutable after construction and carries:

- packet identity/version;
- portfolio/security identity;
- requested narrative type;
- as-of timestamp;
- typed deterministic fields;
- evidence/citation references;
- R6 state and lineage;
- R7 state and lineage;
- R8 state and lineage;
- R9 state and lineage;
- R10 state and lineage;
- blockers;
- uncertainties;
- contradictions.

Packet identity is SHA-256 over the canonical packet payload.

## 3. Typed inputs

Every fact-packet field is explicitly typed as one of:

```text
FACT
DETERMINISTIC_STATE
OWNER_CONTEXT
UNCERTAINTY
SOURCE_EXCERPT
```

SOURCE_EXCERPT fields require provenance.

AI output remains interpretation only and is never typed as deterministic state.

## 4. Output contract

Local R12 output carries:

- narrative id;
- input packet hash;
- prompt version;
- provider/model;
- generated timestamp;
- deterministic state summary;
- supporting evidence;
- contradictory evidence;
- uncertainties;
- blocked questions;
- AI interpretation;
- monitoring questions;
- citations;
- validation status;
- estimated token usage;
- external cost;
- cache state.

Provider/model are fixed in D3 to:

```text
provider = LOCAL_MOCK
model = PROGRAM_D_R12_LOCAL_MOCK_V1
```

## 5. Strict validation

The D3 validator fails closed for:

```text
REJECTED_SCHEMA
REJECTED_UNSUPPORTED_FACT
REJECTED_UNSUPPORTED_CITATION
REJECTED_AUTHORITY_CONFLICT
```

Validation rules include:

- packet version and SHA-style packet identity;
- unique typed-field ids;
- allowed input types only;
- SOURCE_EXCERPT provenance required;
- unique citation ids;
- provenance required for evidence references;
- every output citation must resolve inside the packet;
- every numeric figure in output must be present in typed packet numeric fields;
- forbidden action/priority/sizing/trade keys reject the output as authority conflict.

Invalid output is not cached as valid output.

## 6. Authority boundary

R12 cannot emit or own authoritative:

- score;
- recommendation;
- materiality;
- Action Center action;
- Action Center priority;
- quantity;
- target/minimum/maximum weight;
- exact add/trim percentage;
- buy/sell/add/trim/exit instruction;
- order;
- trade instruction.

R10 remains the sole canonical Action Center authority.

R12 has no feedback path into R6–R10.

## 7. Local cache

D3 cache identity:

```text
packetId + PROGRAM_D_R12_PROMPT_V1
```

Browser-local cache key:

```text
portfolioai.program-d.r12.local-cache.v1
```

An unchanged packet + prompt version reuses the cached valid result.

The cache is:

- browser-local;
- disposable;
- non-authoritative;
- not Supabase persistence;
- not production state.

No migration is created.

## 8. Local generation runtime

D3 local generation:

- accepts only a complete fact packet;
- checks cache first;
- permits one active local generation;
- uses no external network/provider;
- constructs a bounded mock narrative from supplied packet state only;
- validates output before cache insertion;
- records external cost = 0;
- returns cached same-input output on repeat.

The mock runtime exists to validate the R12 boundary before any real AI-provider
pilot.

## 9. Investment Committee workspace

New authenticated route:

```text
/app/investment-committee
```

Primary navigation exposes **Investment Committee**.

The page deliberately separates:

### Deterministic fact packet

Displays:

- packet identity;
- R6–R10 deterministic states;
- typed input fields.

### AI interpretation · non-authoritative

Displays:

- validation status;
- cache state;
- deterministic-state summary;
- local mock interpretation;
- supporting evidence;
- contradictions;
- uncertainties;
- blocked questions;
- monitoring questions;
- citations;
- zero external cost.

The workspace explicitly states:

```text
Real AI provider = Not authorized
Numeric sizing = None
Trade/order path = Prohibited
```

## 10. Local reference packet

D3 includes a bounded local TORNTPHARM reference fixture for contract/UI
validation.

It is not a new live recommendation or investment decision.

The fixture includes:

- deterministic R6 score field;
- R7 recommendation state;
- R8 current state;
- R9 no-meaningful-change state;
- R10 MONITOR state;
- owner role context;
- evidence freshness;
- one display-safe source excerpt;
- explicit uncertainty that numeric sizing authority is absent.

## 11. D3 tests

The local D3 suite validates:

- deterministic packet identity;
- packet immutability;
- packet schema;
- zero external calls/cost;
- local mock provider only;
- same-input cache reuse;
- unsupported citation rejection;
- unsupported numeric claim rejection;
- competing action rejection;
- trade-instruction rejection;
- malformed source provenance rejection;
- absence of numeric sizing and trading fields in valid output.

D4 remains the checkpoint for the broader grounding, prompt-injection, cost,
failure and adversarial suite.

## 12. Files added

```text
src/features/operations/programD3R12Contract.ts
src/features/operations/programD3R12Validator.ts
src/features/operations/programD3R12Cache.ts
src/features/operations/programD3R12Runtime.ts
src/features/operations/programD3R12Fixtures.ts
src/features/operations/programD3R12Runtime.test.ts
src/features/operations/programD3R12.css
src/pages/InvestmentCommitteePage.tsx
docs/PortfolioAI_PROGRAM_D_D3_R12_LOCAL_IMPLEMENTATION.md
```

Modified:

```text
src/routes/AppRoutes.tsx
src/components/AppShell.tsx
```

## 13. Required local validation

Before D3 may close:

- pull exact D3 branch HEAD;
- local Supabase and Vite healthy;
- open `/app/investment-committee`;
- verify LOCAL MOCK / ON DEMAND state;
- verify external calls/cost = 0;
- generate the local interpretation;
- verify VALID;
- generate again and verify CACHE REUSED;
- confirm deterministic packet and AI interpretation are visually separate;
- D3 tests pass;
- D2/D1/D0/Program C regressions pass;
- targeted D3 lint passes;
- typecheck passes;
- architecture guard passes;
- production build passes;
- `git diff --check` passes;
- local working-tree audit shows no D3 drift.

D3 closure does not authorize D4 or a real AI-provider pilot.

## 14. Current checkpoint

```text
D0 = COMPLETE / PASS / CLOSED
D1 = COMPLETE / PASS / CLOSED
D2 = COMPLETE / PASS / CLOSED
R11 = COMPLETE / PASS / CLOSED
D3 = COMPLETE / PASS / CLOSED

real R11 provider pilot = NOT RUN / NOT AUTHORIZED
real AI provider = NOT AUTHORIZED
external AI calls = 0
external AI cost = 0
scheduled AI = NOT AUTHORIZED
D4 = AUTHORIZED
D-FINAL = NOT AUTHORIZED
trading = NOT AUTHORIZED
```


## 15. Validation result

```text
D3 = COMPLETE / PASS / CLOSED
R12 local implementation = COMPLETE / PASS / AWAITING D4 VALIDATION
real AI provider pilot = NOT RUN / NOT AUTHORIZED
D4 = AUTHORIZED
```
