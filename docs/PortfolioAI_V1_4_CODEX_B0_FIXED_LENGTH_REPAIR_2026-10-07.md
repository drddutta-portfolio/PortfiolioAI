# V1-4 B0 fixed-length capture repair

Development only. V1-4 remains IN PROGRESS / NOT PROVEN; V1-5 is unauthorized.

The owner authorizes the Angel One and Trendlyne calls needed for V1-4. Calls remain scoped, deduplicated and accounted, with no automatic retries or invented evidence. This does not authorize Production/main, P8, scheduler activation, Auth/RLS changes or migrations.

## Actual failure and repair

Grant `0bd038e6-71fd-4307-b0d0-689cbf6697cd` was consumed once. The single Angel instrument-master GET returned HTTP 200; BODY_COMPLETE records 34,101,944 decoded bytes and SHA-256 `6676b303812f3969c098b8efa794c5d32b99e3e206db55e3e9b13f219fd746a6`. R2 upload failed; no successful retained-master preflight is claimed. Neither prior consumed grant is reset or reused.

The gateway supplied R2 an ordinary transformed stream without a known length. The prior small R2 test used the object API rather than this gateway. The repaired Node capture stages bounded raw bytes in a private ephemeral file, calculates their hash and exact decoded length, uploads with Content-Length, and removes the file in finally. It does not parse or store the large payload in Supabase. The gateway uses Cloudflare FixedLengthStream, enforces the exact length and 64 MiB limit, preserves create-only writes and the existing Development bucket/prefix/auth scope. Permanent captures cannot be deleted through the gateway; cleanup remains restricted to synthetic test keys.

SELF_TEST now also stages and reads back its 40 MiB synthetic artifact with byte/hash verification. Regression tests verify chunked byte preservation, size rejection, authentication, protected prefixes, required length, upload/readback, overwrite prevention, short-body rejection and synthetic cleanup. Source is retained in `cloudflare/portfolioai-b0-r2-gateway-dev/worker.js`.

## Validation

- `node scripts/test-b0-spool-gateway.mjs`: PASS, no provider requests.
- `node scripts/test-b0-control-append-only.mjs`: 3/3 PASS.
- `npm run check:architecture`: PASS.
- `npm run build`: PASS; existing chunk-size advisory remains.
- Development gateway deployment: `215ee591f5d44d59b489d3fd124028c7`.
- Hosted runtime verification and replacement acquisition are recorded separately after actual execution; this preparation record does not claim them complete.
