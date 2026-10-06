# PortfolioAI — Supabase 500 MB Capacity Policy — 2026-10-06

## Owner-confirmed quota

PortfolioAI Development Supabase Postgres quota for application planning is:

- Supabase platform documentation labels the Free-plan database-size threshold as **500 MB**.
- Supabase documents `pg_database_size(...)` as the authoritative database-size measurement.
- The platform documentation does **not** publish an exact decimal-vs-binary byte conversion for the displayed 500 MB label.
- The owner therefore defines the PortfolioAI application quota conservatively as **500,000,000 bytes**.

This replaces the obsolete 200,000,000-byte acquisition restriction.

Large binary/raw/history artifacts remain R2-first even when Supabase has more theoretical storage capacity.

## Current verified usage

Authoritative query:

`pg_database_size('postgres')`

Verified at 2026-10-06 17:37:14 UTC:

- current usage: **202,812,563 bytes**
- quota used: **40.56%**
- quota headroom: **297,187,437 bytes**

Status: **NORMAL**

## Capacity bands

- **NORMAL:** < 400,000,000 bytes
- **WARNING:** >= 400,000,000 and < 450,000,000 bytes
- **ACTION:** >= 450,000,000 and < 475,000,000 bytes
- **HARD STOP:** >= 475,000,000 bytes
- **ABSOLUTE QUOTA:** 500,000,000 bytes

### NORMAL
Normal compact Supabase writes are allowed. Large raw/history payloads remain R2-first.

### WARNING
No new unbounded Postgres datasets. Review largest relations and growth rates before enabling new materializations.

### ACTION
Freeze nonessential Postgres growth. Require an explicit offload/remediation plan for any feature expected to grow materially. Prefer R2-backed reads for history/raw evidence.

### HARD STOP
Do not start B0 acquisition or any other noncritical write workflow. Only bounded operational/repair writes may proceed if an authoritative pre-write estimate proves the projected database remains below 500,000,000 bytes.

## B0 capacity check

B0 compact-control write budget:

- conservative allowance: **100,000 bytes**
- master JSON body in Postgres: **0 bytes**
- master object: Cloudflare R2 only

The B0 control function must use a recent authoritative capacity snapshot before any mutating action.

Current implementation:
- capacity snapshot max age: **30 minutes**
- projected B0 control increment: **100,000 bytes**
- refuses writes if projected size reaches the 475,000,000-byte hard-stop threshold
- absolute owner quota remains 500,000,000 bytes

A fresh authoritative `pg_database_size('postgres')` measurement is required before creating the replacement B0 acquisition grant.

## Storage policy

Supabase Postgres is reserved for:
- current operational state
- relational mappings and identities
- grants and compact audit/control rows
- compact research outputs and selections
- metadata and hashes pointing to external artifacts

Cloudflare R2 is preferred for:
- provider master files
- raw historical market data
- archives/bhavcopies
- large replay/backtest material
- large source payloads that do not require row-level relational querying

No existing dataset is migrated or deleted by this policy document.
