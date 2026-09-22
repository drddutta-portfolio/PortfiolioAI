-- Stage 7 local hardening: aggregate views must not reveal canonical security rows outside portfolio history.

create or replace view public.current_security_identity_v1 with (security_invoker=true) as
select s.id as security_id,s.name,s.isin,s.asset_class,s.instrument_type,l.id as listing_id,l.exchange,l.trading_symbol,l.series,l.currency
from public.securities s
left join lateral(select sl.* from public.security_listings sl where sl.security_id=s.id and sl.is_active order by sl.is_primary desc,sl.created_at asc limit 1) l on true
where current_user in ('postgres','service_role') or exists(
  select 1 from public.transactions t join public.portfolios p on p.id=t.portfolio_id
  where t.security_id=s.id and p.user_id=(select auth.uid())
);

comment on view public.current_security_identity_v1 is 'Canonical identity projection limited to securities in the authenticated user transaction history; trusted server roles retain universe access.';
