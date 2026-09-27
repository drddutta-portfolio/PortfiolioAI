-- PortfolioAI Post-D P5 deterministic closure audit.
-- Development only: PortfolioAI Dev / lrgpjimipfkyoqbpsqzz
-- Read-only. Verifies persisted P5 terminal dispositions and P5 safety boundaries.

begin transaction read only;

with latest as (
  select distinct on (external_record_id)
         external_record_id,
         raw_payload,
         payload_hash,
         retrieved_at
  from public.data_source_records
  where record_kind = 'P5_TERMINAL_DISPOSITION_V1'
  order by external_record_id, retrieved_at desc
),
summary as (
  select jsonb_build_object(
    'terminal_records', count(*),
    'equities', count(*) filter (where raw_payload->>'asset_class' = 'EQUITY'),
    'etfs', count(*) filter (where raw_payload->>'asset_class' = 'ETF'),
    'null_r6', count(*) filter (where raw_payload#>>'{r6,disposition}' is null),
    'null_r7', count(*) filter (where raw_payload#>>'{r7,disposition}' is null),
    'null_sizing', count(*) filter (where raw_payload#>>'{sizing,disposition}' is null),
    'reference_outputs_promoted', count(*) filter (
      where coalesce((raw_payload#>>'{r6,reference_outputs_promoted}')::boolean, false)
    ),
    'p6_authorized', count(*) filter (
      where coalesce((raw_payload->>'p6_authorized')::boolean, false)
    ),
    'methodology', (
      select jsonb_object_agg(state, n)
      from (
        select raw_payload#>>'{methodology,state}' state, count(*) n
        from latest group by 1
      ) x
    ),
    'r6', (
      select jsonb_object_agg(state, n)
      from (
        select raw_payload#>>'{r6,disposition}' state, count(*) n
        from latest group by 1
      ) x
    ),
    'r7', (
      select jsonb_object_agg(state, n)
      from (
        select raw_payload#>>'{r7,disposition}' state, count(*) n
        from latest group by 1
      ) x
    ),
    'sizing', (
      select jsonb_object_agg(state, n)
      from (
        select raw_payload#>>'{sizing,disposition}' state, count(*) n
        from latest group by 1
      ) x
    )
  ) result
  from latest
)
select result from summary;

select encode(
  digest(
    coalesce((
      select jsonb_agg(to_jsonb(x) order by x.security_id)::text
      from (
        select security_id,
               portfolio_role,
               target_weight,
               minimum_weight,
               maximum_weight,
               stop_loss_price,
               stop_loss_alert_enabled
        from public.portfolio_security_settings
        where portfolio_id = '6193a4aa-3235-4057-bddc-209fcf443fc2'
      ) x
    ), '[]'),
    'sha256'
  ),
  'hex'
) as owner_settings_hash;

select jsonb_build_object(
  'score_runs_since_p5_authorization', (
    select count(*) from public.stock_score_runs
    where created_at >= '2026-09-27T08:00:00+00'
  ),
  'recommendation_runs_since_p5_authorization', (
    select count(*) from public.stock_recommendation_runs
    where created_at >= '2026-09-27T08:00:00+00'
  ),
  'sizing_assessments_since_p5_authorization', (
    select count(*) from public.position_sizing_assessments
    where created_at >= '2026-09-27T08:00:00+00'
  )
) as side_effects;

with latest as (
  select distinct on (external_record_id)
         external_record_id,
         raw_payload,
         retrieved_at
  from public.data_source_records
  where record_kind = 'P5_TERMINAL_DISPOSITION_V1'
  order by external_record_id, retrieved_at desc
),
reasons as (
  select jsonb_array_elements_text(raw_payload#>'{r6,reason_codes}') reason
  from latest
)
select reason, count(*) holdings
from reasons
group by reason
order by holdings desc, reason;

commit;
