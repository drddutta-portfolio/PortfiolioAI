# PortfolioAI — P3 Acceptance Dataset Refresh / Rebuild Procedure

**Version:** P3_ACCEPTANCE_REFRESH_PROCEDURE_V1  
**Scope:** Private Development acceptance data only  
**Production:** Read-only source only  
**Development:** Only permitted hosted write target

## Purpose

This procedure makes the Stage 5 acceptance-data process repeatable without treating the temporary Stage 5 copy tooling as canonical software and without rebuilding the Development environment during P3.

P3 does **not** execute a refresh merely to prove that a refresh is repeatable.

## Permanent identities

- Production source: `Project-PortfolioAI` — `uxiyufbsbgzzdujzcdxe`.
- Development target: `PortfolioAI Dev` — `lrgpjimipfkyoqbpsqzz`.
- Development acceptance portfolio: `6193a4aa-3235-4057-bddc-209fcf443fc2` — `Consolidated Portfolio`.
- Local deterministic regression fixture: `10000000-0000-4000-8000-000000000001` — `LOCAL UI Research Review` — local-only, expected six open holdings.

The local fixture is not an acceptance-data source and must not be copied into Development as a portfolio.

## Required flow

1. Capture a read-only Production inventory and a Development target inventory.
2. Verify Production is the source and is explicitly read-only.
3. Verify Development is the only write target and the local fixture portfolio has zero rows there.
4. Review the machine-readable field-treatment policy in `PortfolioAI_P3_ACCEPTANCE_DATA_POLICY_V1.json`.
5. Generate the deterministic refresh plan with:
   `node scripts/p3-acceptance-refresh-plan.mjs <source-inventory.json> <target-inventory.json>`
6. Export only approved business/application data families. Exclude Auth credentials/sessions, Vault/secrets, provider credentials, scheduler tokens and AI credentials.
7. Resolve a controlled Development Auth identity and remap Production ownership identifiers only at ownership boundaries.
8. Load reference/parent rows before dependent rows while preserving canonical IDs/provenance where safe.
9. Keep provider ingestion, scheduler, paid AI, notifications, score/recommendation/sizing execution and trading inactive.
10. Verify row counts, FK integrity, ownership remap, RLS, canonical price path and fixture separation.
11. Run authenticated browser acceptance on the existing Development Preview.
12. Record a refresh manifest and delete temporary transfer artifacts.

## Stop conditions

Stop before any write if:

- the target project ref is Production;
- Production access is not demonstrably read-only;
- the local regression fixture portfolio appears in Development;
- a required ownership remap cannot be resolved deterministically;
- an export requires a credential/secret or an unapproved external provider call;
- the source schema and Development schema cannot be reconciled without a separately approved migration.

## Licensing / redistribution boundary

The acceptance dataset is a private internal Development copy used to validate PortfolioAI behavior. Copying Production-held provider or market evidence into this private environment does not imply a right to redistribute, republish, sell or expose that data. External document bodies remain subject to their original source rights and are not introduced by P3.

## P3 execution decision

No refresh is required for P3 because Stage 5 already established the current operational acceptance dataset. This procedure is the permanent repeatable path for a later owner-approved refresh when freshness or reconstruction actually requires one.
