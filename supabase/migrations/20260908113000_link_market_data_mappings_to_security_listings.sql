-- Stage 7D: connect existing provider mappings to canonical listings without changing price semantics.

alter table public.market_data_instrument_mappings add column listing_id uuid references public.security_listings(id) on delete restrict;

update public.market_data_instrument_mappings m set listing_id=l.id
from public.security_listings l
where l.security_id=m.security_id and l.exchange=m.exchange and l.trading_symbol=m.trading_symbol and l.is_active and m.listing_id is null;

create index market_data_instrument_mappings_listing_idx on public.market_data_instrument_mappings(listing_id) where listing_id is not null;

comment on column public.market_data_instrument_mappings.listing_id is 'Optional canonical-listing link. Existing security/provider mapping identity and historical prices remain unchanged.';
