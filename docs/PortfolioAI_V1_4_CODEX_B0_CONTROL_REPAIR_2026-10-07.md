# V1-4 Codex takeover: B0 append-only accounting repair

V1-4 remains IN PROGRESS / NOT PROVEN. V1-5 remains unauthorized.

Starting Development HEAD: `30b7420cb500c20099e912d4c31734cfe82d0360`.

The owner requested Codex to complete V1-4. Codex verified the existing private
Development execution credential, refreshed the expired capacity attestation, and
issued one fresh B0 grant: `f1695d89-462c-43df-bfb7-ea6bd4d33fde`.
Database measurement was 202,812,563 bytes at 2026-10-06T19:05:07.246310Z.
No secret is included in this record.

## Actual execution

One master GET reached Angel One. The append-only RESPONSE_RECEIVED record proves
HTTP 200 at 2026-10-06T19:07:58.365Z. The capture invocation then returned
`B0_CONTROL_USAGE_UPDATE_FAILED` before BODY_COMPLETE or CAPTURE_PERSISTED.
No retry was made. No durable master exists and no benchmark identity was evaluated.
The grant was consumed once and must not be reused.

## Proven cause and repair

The deployed control attempted UPDATE on `provider_usage_events` after HTTP headers.
The existing `provider_usage_events_immutable` trigger rejects every UPDATE/DELETE
with SQLSTATE 55000: "Provider accounting and audit events are append-only."

The repair removes the UPDATE. The initial immutable usage attempt remains UNKNOWN;
the append-only stage provides its independently observed transport outcome. It
does not represent a second billable attempt. HTTP success is distinct from durable
capture and valid acquisition. No trigger, schema, RLS or authentication change was made.

Control v6 is ACTIVE; bundle SHA-256:
`a216b998a0f425eb670207abc6632b2f14764cbdd6c1031ffc50dcfb53eb45c7`.

## Verification

The regression harness executes the actual control entrypoint with a mock client
that enforces the real append-only guard. Before repair, both successful and failed
HTTP-response cases returned 409. After repair, both return 200 using only an append.
Invalid authentication produces no writes. Three of three tests pass.

Commands passed: `node scripts/test-b0-control-append-only.mjs`,
`npm run check:architecture`, changed Edge-file ESLint, `npm run build` (TypeScript
and Vite), and `git diff --check`. Supabase compiled/deployed the repaired entrypoint.
No whole-repository lint or unrelated regression rerun is claimed.

## Remaining V1-4 work

Live current readiness remains 231 REVIEW_REQUIRED / 8 INSUFFICIENT / 0 READY.
The frozen manifest still hashes to
`79f551558333adc1f37d6a26298d8088ee02db3161f03c6d6e59f9a19a93fc27`.
The existing 1,608-job worklist includes missing financial-period/scope evidence,
documentary and ownership factual reviews, history/calendar/adjustment qualification
and exact benchmark identities. The repair alone does not remove those blockers.

A new separately bounded capture can now use the repaired control; no further GET
has been made. Later history execution still requires exact real identities.
Owner factual-review and ambiguous methodology/series decisions must not be invented.

No Production/main changes, history/mapping writes, materialization, migrations,
Auth/RLS changes, schedulers, R2 writes, P8 or V1-5 execution occurred.
