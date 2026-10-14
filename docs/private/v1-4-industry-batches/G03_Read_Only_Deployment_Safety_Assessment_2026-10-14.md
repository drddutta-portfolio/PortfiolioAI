# G03 read-only canonical validation — deployment safety assessment

Owner request: “Please complete G03 and make the stocks READY.” This package is a necessary read-only validation capability, not permission to manufacture readiness or alter another industry's evidence.

## Automatic review rejection and subsequent evidence

Automatic review rejected the attempted shared canonical materializer deployment because its potential blast radius includes G02/BANK validation and database writes. No rejected operation was executed through another mechanism.

The candidate was subsequently compared against the independently fetched **live v67** bundle, SHA `df7cdfd95707f95cb788ce3b9d00283eadc6dc24271cb8fd8c96e5d607755924`:

- **43/44 existing files are byte-for-byte unchanged.**
- The entrypoint has exactly two changes: a G03 authorization import and an additional authorization alternative **inside the existing `if(dryRun)` branch**. Removing those two additions reproduces the original entrypoint exactly.
- Three added files contain the separate G03 policy, request predicate and JWT verifier. They contain no database writes, provider invocation, review admission, grant issuance or consumption.
- G02's authorization is still evaluated first, unmodified. Its three-security policy is unchanged. The new predicate accepts only the seven approved G03 IDs, the exact portfolio and owner directive hash, and the read-only action; it rejects grants, targeting/write routes, duplicates and cross-group IDs.
- Portfolio ownership is still independently checked by the original handler. Gateway JWT verification remains **enabled**. GitHub OIDC must match the exact repository ID, branch, protected Development environment and G03 workflow; issuer/audience/algorithm/token-age checks are retained.
- The existing mutating handler, grant controls, source selection, financial evaluation, freshness rules, BANK code and scheduler are unchanged. No migration or configuration relaxation is proposed.

## Executed verification

Implementation head `30a0f26cabbf43203e9355682bd9c9072b143f10`:

- G03 scope tests: 4 PASS, covering permitted scope, foreign/duplicate IDs, write/grant rejection and exact executor identity.
- Full Edge suite: **405 PASS**.
- Full application suite: **2,345 PASS**.
- Architecture, type checks, application/Edge lint and production build: PASS locally.
- The candidate **live** bundle, preserving the 43 unchanged files, passed `deno check` using a writable isolated cache.
- GitHub Full Repository Verification **38544922954: SUCCESS**.
- GitHub Architecture Guard **38544926963: SUCCESS**.
- Python source acquisition/comparison checks: 6 PASS; whitespace check: PASS.

The first deployment attempt failed because an inherited absolute import-map path referenced the prior bundle. The valid relative path is the existing `supabase/functions/p7-ic2-materialize-readiness/deno.json`; changing that deployment argument does not change its contents.

## Bounded proposed action and rollback

Deploy only this surgically patched live bundle to Development `lrgpjimipfkyoqbpsqzz`, function `p7-ic2-materialize-readiness`, with JWT enabled and the existing import map. Independently inspect deployed version/hash and replay the read-only G03 request. Its response must show zero provider calls, empty snapshot/selection arrays and all zero write counters; independently compare persisted selections before/after.

Rollback is the captured unmodified v67 bundle, including its original import map and JWT setting. No source records, accepted reviews, snapshots or selections need deletion or alteration. Production/main and Banking scheduler remain outside scope.

If automatic review still rejects this exact tested change, preserve the rejection, do not execute it indirectly, and request narrowly scoped approval for this deployment only. Continue official-source qualification meanwhile. No live replay or READY result is claimed by this assessment.
