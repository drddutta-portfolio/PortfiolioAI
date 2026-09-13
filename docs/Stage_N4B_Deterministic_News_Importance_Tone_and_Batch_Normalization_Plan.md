# Stage N4B — Deterministic News Importance, Tone, and Batch Normalization Plan

## Objective

Extend the proven Stage N4A NSE normalization path from one matched item to a small, bounded batch while adding conservative deterministic `importance_state` and `tone_*` provenance.

N4B remains a controlled pilot. It introduces no scheduler, no AI, no linked-document fetches, and no external network calls during normalization.

## Safety boundaries

- Source remains previously captured official NSE RSS evidence (`COMPANY_EXCHANGE_FILING`).
- Security matching remains exact stored-identity matching only.
- Fuzzy company matching remains disabled.
- Batch size is capped at 20 matched items per invocation.
- Existing URL-hash canonical keys and `(source_code, dedupe_key)` source-appearance uniqueness remain the idempotency boundary.
- Publication timestamps are parsed from NSE and never replaced by retrieval time.
- Tone is event tone only; it is not a BUY/SELL recommendation.
- Ambiguous items remain `UNCLASSIFIED` rather than being forced into positive/negative.

## Deterministic importance rules

Importance is separate from tone.

- `IMPORTANT`
  - financial results
  - fund raise
  - acquisition / merger / investment
  - explicit downgrade/default/fraud/insolvency/liquidation/penalty/fine language
  - senior-management events explicitly naming CEO, MD, Managing Director, CFO, Chairman, or Whole-time Director
- `NOTABLE`
  - corporate action
  - management changes not captured as IMPORTANT
  - order/contract/letter of award
  - credit rating
  - litigation/governance
- `ROUTINE`
  - shareholding / insider-trading disclosures
- `UNCLASSIFIED`
  - everything else

## Deterministic tone rules

Tone is deliberately conservative.

### NEGATIVE
Only when explicit negative language is present, including:
- downgrade
- default
- penalty / fine
- fraud
- insolvency / liquidation
- cancellation / termination
- adverse order

### POSITIVE
Only when explicit positive language is present, including:
- rating upgrade
- order received / contract awarded / letter of award
- dividend declared / recommended

### NEUTRAL
Only for clearly administrative or informational events, including:
- record date
- shareholding pattern
- board meeting
- analyst / investor meet
- change in directors/KMP/SMP/auditor/RTA when no explicit positive/negative phrase is present

### UNCLASSIFIED
Used for results, fund raising, M&A, generic disclosures, and any event where direction cannot be established from the RSS subject/description alone.

## Provenance

For deterministic classifications:

- `tone_method = DETERMINISTIC`
- `tone_confidence` is fixed by rule class:
  - explicit positive/negative keyword: `0.95`
  - explicit administrative neutral: `0.90`
- `tone_reason` stores the matched deterministic rule.

For unclassified tone:

- `tone_state = UNCLASSIFIED`
- `tone_method = UNCLASSIFIED`
- `tone_confidence = null`
- `tone_reason = null`

## Batch behavior

1. Read exactly one reviewed NSE RSS capture from `data_source_records`.
2. Parse all valid NSE announcement items.
3. Filter by exact stored identity for the selected held equity.
4. Sort newest-first.
5. Process at most 20 matched items.
6. For each item:
   - compute deterministic category, importance, and tone
   - use URL-derived canonical key
   - insert or update `news_items`
   - insert source appearance only when unseen
7. Return inserted/updated/duplicate counts.

## Production gate

Repository preparation and local tests may proceed without production changes.

Before production deployment, require explicit approval to:

1. activate the N4B NEWS policy,
2. deploy the N4B batch-normalization Edge Function,
3. run a bounded HDFCBANK pilot against the existing reviewed NSE capture.

No scheduler should be enabled during N4B validation.
