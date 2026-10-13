-- Banking V1-4 / KVB point-in-time month-level eligibility inventory (READ ONLY).
-- This intentionally does not infer historical EPS/BVPS from 2026 retrievals,
-- does not accept any evidence, and does not materialize a selection.
with bounds as (
 select generate_series(date '2021-10-01',date '2026-09-01',interval '1 month')::date month_start
), captured as (
 select d.id source_record_id,
        to_date(d.raw_payload->>'month','YYYY-MM') month_start,
        (d.raw_payload->>'trade_date')::date trade_date,
        (j->>'close')::numeric close_price,
        j->>'isin' historical_isin,
        d.raw_payload->>'archive_sha256' archive_sha256
 from public.data_source_records d
 cross join lateral jsonb_array_elements(d.raw_payload->'rows') j
 where d.source_code='NSE_OFFICIAL'
   and d.record_kind='V1_4_BANK_VALUATION_MONTH_END_PRICE_CAPTURE'
   and j->>'security_id'='be55b3cc-0400-45af-84aa-2a95e2c361c5'
   and j->>'isin'='INE036D01028'
), monthly as (
 select b.month_start, count(c.source_record_id) raw_price_candidates,
        max(c.trade_date) captured_trade_date,
        max(c.close_price) raw_close, max(c.archive_sha256) source_archive_sha256
 from bounds b left join captured c on c.month_start=b.month_start
 group by b.month_start
)
select to_char(month_start,'YYYY-MM') month,
       captured_trade_date,raw_close,raw_price_candidates,source_archive_sha256,
       -- A month is not PIT-admissible without point-in-time financial and share-basis evidence.
       false as pb_pit_qualified,false as pe_pit_qualified,
       case when raw_price_candidates=0 then 'PRICE_NOT_CAPTURED_IN_MONTH_END_SOURCE'
            when raw_price_candidates>1 then 'DUPLICATE_PRICE_SOURCE_CONFLICT'
            else 'PIT_BVPS_EPS_AND_CORPORATE_ACTION_PROOF_REQUIRED' end qualification_gap
from monthly order by month_start;
