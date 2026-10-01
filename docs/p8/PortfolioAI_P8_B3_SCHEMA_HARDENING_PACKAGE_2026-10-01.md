# PortfolioAI P8-B3 schema hardening package

Date: 1 October 2026  
Environment: Development repository/local only  
Upstream: B3 hosted foundation schema applied with zero B3 data rows  
Status: **LOCAL HARDENING PACKAGE CREATED / REPLAY + TEST PENDING / HOSTED HARDENING NOT AUTHORIZED**

## Trigger

The exact reviewed B3 foundation migration applied successfully to hosted PortfolioAI Dev and preserved all existing live/B2 fingerprints.

The mandatory post-migration advisor comparison then found B3-attributable deltas:

```text
authenticated GraphQL exposure WARN = +9
unindexed foreign keys INFO = +12
unused indexes INFO = +9
```

The build stopped before any B3 data acquisition.

## Hardening decision

While B3 remains a backend data-foundation stage, its base evidence relations and coverage views do not need direct authenticated client access.

Therefore the remediation package:

1. revokes authenticated SELECT from all seven B3 tables;
2. revokes authenticated SELECT from the two B3 coverage views;
3. preserves RLS policies as defense-in-depth for any later explicitly approved exposure;
4. preserves service-role read/write access;
5. adds exact leading covering indexes for every B3 foreign-key path;
6. changes no data and does not touch live market/B2 relations.

Any future UI exposure must be separately designed and approved through dedicated read models rather than reopening all B3 base relations implicitly.

## Additive migration

`supabase/migrations/20261001131500_harden_p8_b3_access_and_foreign_key_indexes.sql`

Static audit:

```text
new indexes = 12
authenticated SELECT revocations = 9
DROP = 0
UPDATE = 0
DELETE = 0
INSERT = 0
ALTER TABLE = 0
```

The twelve added indexes correspond exactly to the advisor-reported FK paths:

- source archive creator;
- raw-price historical identity;
- raw-price source archive;
- corporate-action source archive;
- corporate-action historical identity;
- normalization observation;
- normalization historical identity;
- adjustment-factor historical identity;
- adjustment-factor normalization;
- adjusted-series historical identity;
- adjusted-series raw-price observation;
- benchmark source archive.

Existing analytical/date indexes remain untouched.

## Tests

New:

`supabase/tests/p8_b3_schema_hardening.sql`

It proves:

- RLS remains enabled on every B3 table;
- anon and authenticated roles cannot SELECT/write B3 tables;
- anon and authenticated roles cannot SELECT B3 coverage views;
- service role retains required access;
- coverage views remain `security_invoker=true`;
- every B3 foreign key has a valid, ready, non-partial covering index whose leading columns exactly match the referencing FK column order;
- mutation-rejection function remains service-role-only;
- B3 tables remain empty after clean local replay.

The cumulative foundation test was also updated to require the new hardened authenticated-access state.

## Local verification runner

`scripts/p8/run-p8-b3-hardening-local-verification.sh`

It runs:

1. clean local reset;
2. cumulative B3 foundation SQL contract;
3. B3 hardening SQL contract;
4. deterministic financial fixtures;
5. TypeScript, architecture and scoped lint;
6. production build;
7. DB lint, local migration ledger and generated types;
8. post-replay schema diff;
9. repository hygiene / credential-pattern scan.

Expected terminal marker:

```text
P8_B3_HARDENING_LOCAL_VERIFICATION_PASS
```

## Boundary

Not authorized by this package:

- hosted hardening migration application;
- B3 raw-data acquisition;
- corporate-action materialization;
- adjustment-factor/adjusted-series materialization;
- P8-B4 or P8-C.

The previously identified B3 arithmetic precision/rounding contract remains a separate hard blocker before any adjustment materialization.
