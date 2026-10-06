# PortfolioAI — Supabase Database Capacity Policy V2 — 2026-10-06

## Owner-confirmed quota

Development Supabase Postgres quota for PortfolioAI operational planning:

- quota: **500,000,000 bytes**
- warning threshold: **400,000,000 bytes** (80%)
- action threshold: **450,000,000 bytes** (90%)
- hard write-stop threshold: **475,000,000 bytes** (95%)
- emergency reserve below quota: **25,000,000 bytes**

The hard stop is deliberately below the owner quota so page/index growth, maintenance, and unexpected small operational writes have room without crossing 500,000,000 bytes.

## Current verified usage

Measured from Supabase Dev `lrgpjimipfkyoqbpsqzz` on 2026-10-06:

- database size: **202,812,563 bytes**
- quota utilization: **40.56%**
- quota headroom: **297,187,437 bytes**
- warning-threshold headroom: **197,187,437 bytes**
- action-threshold headroom: **247,187,437 bytes**
- hard-stop headroom: **272,187,437 bytes**

Current state: **NORMAL**.

## Write-gate contract

All B0 control writes remain capacity-gated.

Current deployed control contract:

- authoritative capacity snapshot: **202,812,563 bytes**
- snapshot timestamp: **2026-10-06T17:18:28.940896Z**
- maximum accepted snapshot age before a mutating B0 action: **24 hours**
- conservative expected complete B0 control increment: **100,000 bytes**
- mutating B0 action fails closed if:
  - capacity snapshot is stale; or
  - verified bytes + 100,000 bytes would reach/exceed 475,000,000 bytes.

The capacity snapshot must be refreshed provider-free immediately before any future acquisition grant/GET authorization.

## Threshold actions

### NORMAL — <400,000,000 bytes

- ordinary compact operational/control writes permitted;
- large payloads remain R2-first;
- monitor size before bounded acquisition/write campaigns.

### WARNING — >=400,000,000 and <450,000,000 bytes

- no new large Postgres datasets;
- review top relations and growth rate;
- schedule approved offload work;
- B0 compact control writes may proceed only if the projected increment remains below the hard stop.

### ACTION — >=450,000,000 and <475,000,000 bytes

- freeze nonessential data-growth features;
- execute an owner-approved offload/remediation plan before new data campaigns;
- require an explicit capacity review for any bounded write batch;
- continue only small essential operational writes with verified headroom.

### HARD STOP — >=475,000,000 bytes

- B0 and other nonessential write campaigns fail closed;
- no acquisition grant should be consumed;
- remediate/offload before reopening writes.

### QUOTA — 500,000,000 bytes

This is the owner-confirmed absolute operating quota, not the normal operating target.

## B0 storage rule

The Angel One instrument-master body is never stored in Postgres.

Large B0 object:
- Cloudflare R2 bucket: `portfolioai-history-dev`
- prefix: `portfolioai-capture/development/v1/b0/angel-one/instrument-master/`

Supabase stores compact:
- object key;
- SHA-256;
- byte size;
- timestamps/status;
- provider accounting;
- grant/audit state;
- twelve-code preflight result.

Recent sampled row sizes:
- `data_source_records`: average ~602 bytes, max sampled 864 bytes;
- `provider_usage_events`: average ~316 bytes, max sampled 328 bytes.

A 100 KB B0 control allowance is therefore intentionally conservative.

## Policy status

The obsolete 200,000,000-byte B0 acquisition restriction is retired.

This policy supersedes that temporary restriction while preserving a fail-closed capacity check before writes.
