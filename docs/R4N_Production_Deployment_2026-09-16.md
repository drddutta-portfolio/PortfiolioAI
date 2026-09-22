# R4N production deployment — 16 September 2026

Status: **COMPLETE AND VALIDATED**

## Authorized scope

Only these checksum-pinned forward migrations were authorized and applied, in
this order:

1. `20260915190026_reconcile_r4n_research_subprofiles.sql` —
   `17bae04bd9bc613ad3e6a746526b24af5c7998343c0a7e0a490fb3d591104e3d`;
2. `20260915193011_reconcile_news_policy_final_state.sql` —
   `4d2bb5128764f4f40bf93b8ce93ca7c85dd449cb422e5ba65c563b07bf6b295c`;
3. `20260915193024_reconcile_portfolio_weight_context.sql` —
   `11fbe76699fdaa23d06ca7d84f07626cc4d92632eaac08bcb1ab5e31947d497d`.

No provider was executed. No research-subprofile assignment or secondary
exposure was created. No evidence was ingested. No scoring, recommendation or
sizing write occurred. No cron schedule, Edge Function or application business
record was changed by the deployment.

## Preflight and recovery baseline

The manual production-backup workflow completed successfully before deployment.
The final preflight found 492 transactions rather than the earlier 489-row
snapshot. The owner confirmed that the three additional rows were intentional
transactions entered that day and authorized their inclusion. Their production
creation timestamps were 08:51:20, 08:52:07 and 08:53:30 UTC, before the completed
backup run. The final preservation baseline therefore became:

| Relation | Rows |
| --- | ---: |
| `portfolios` | 1 |
| `transactions` | 492 |
| `securities` | 273 |
| `fundamental_observations` | 458 |
| `stock_recommendation_runs` | 4 |

The final live pre-state otherwise matched the reviewed package: all three R4N
relations were absent; NEWS V6 was closed but still enabled with elapsed-time
freshness; NEWS V7 was current; the two cron definitions and fingerprint
`e72c6af66a314a277e1e48f6d386fc9c` matched; and the weight-context function still
had the known ambiguous alias and anonymous execute access.

## Isolated deployment mechanism

`scripts/buildR4NProductionDeploymentBundle.mjs` parsed the current linked remote
ledger, verified all three source checksums, refused already-applied target
versions, and built a fresh temporary workdir containing 93 comment-only
remote-ledger compatibility markers plus only the three approved migrations.

The final `supabase db push --dry-run` selected exactly the three approved files
in order. The same unchanged workdir was then applied with `supabase db push
--yes`; no `--include-all`, migration repair or ordinary-repository push was used.

## Post-deployment validation

- the remote ledger contains exactly the three expected new versions and names;
- `research_subprofile_contracts` contains five rows;
- `research_subprofile_assignments` contains zero rows;
- `research_subprofile_secondary_exposures` contains zero rows;
- RLS is enabled on all three R4N tables;
- NEWS V6 is disabled, closed and uses `DISABLED` freshness;
- NEWS V7 remains enabled, current and uses `ELAPSED_TIME` freshness;
- both cron rows remain byte-for-byte unchanged and the fingerprint remains
  `e72c6af66a314a277e1e48f6d386fc9c`;
- the weight-context ambiguity is removed;
- authenticated execute remains granted and anonymous execute is revoked;
- the function remains `SECURITY DEFINER` with `search_path=public`;
- all five business-row counts exactly match the authorized baseline above; and
- linked database lint completed without errors. The inherited
  `get_portfolio_coverage_registry_v1` STABLE/volatile warning remains.

## Remaining gates

Production now has the profile/subprofile schema and five immutable PHARMA_V1
subprofile contract rows. Security assignments, secondary exposures, evidence
ingestion, provider execution, scoring and recommendations remain separately
gated and were not enabled by this deployment.
