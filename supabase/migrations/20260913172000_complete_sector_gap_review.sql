with mappings(symbol, sector, evidence_note, evidence_url) as (
  values
    ('BLUSPRING','Services','Bluspring is an integrated infrastructure/business services enterprise after Quess demerger.','https://www.bluspring.com/for-investors/'),
    ('CIEINDIA','Automobile and Auto Components','NSE filing identifies the company as CIE Automotive India; single segment Automotive.','https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_INDAS_177081_22072026200157_iXBRL_WEB.html'),
    ('EBGNG','Information Technology','GNG Electronics is classified as technology services / information technology services.','https://in.tradingview.com/symbols/NSE-EBGNG/'),
    ('EPL','Capital Goods','Current NSE-derived classification places EPL in Capital Goods; basic industry Packaging.','https://patternsradar.com/s/EPL'),
    ('GNFC','Chemicals','Current NSE-derived classification: Chemicals; basic industry Commodity Chemicals.','https://patternsradar.com/s/GNFC'),
    ('GOODLUCK','Capital Goods','Current NSE-derived classification: Capital Goods; basic industry Iron & Steel Products.','https://patternsradar.com/s/GOODLUCK'),
    ('ICICIAMC','Financial Services','NSE basic industry: Asset Management Company.','https://www.nseindia.com/get-quote/equity/ICICIAMC/ICICI-Prudential-Asset-Management-Company-Limited'),
    ('IONEXCHANG','Waste Managment','Owner STOCK MASTER contains Ion Exchange under Waste Managment using alternate symbol IONEXCHANGE.','owner-upload:PortFolio-1 (1)(3).xlsx'),
    ('IPL','Chemicals','India Pesticides is a pesticides/agrochemicals producer; mapped to portfolio Chemicals sector.','https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_INDAS_126188_11112025191545_iXBRL_WEB.html'),
    ('JTLIND','Metals & Mining','NSE basic industry: Iron & Steel Products.','https://www.nseindia.com/get-quote/equity/JTLIND/JTL-INDUSTRIES-LIMITED'),
    ('PANAMAPET','Oil Gas & Consumable Fuels','Current NSE-derived classification: Oil, Gas & Consumable Fuels; industry Petroleum Products.','https://stockint.com/nse/stock-history/PANAMAPET/'),
    ('PENIND','Capital Goods','Pennar Industries is specialty industrial machinery / industrial components.','https://stockanalysis.com/quote/nse/PENIND/company/'),
    ('PRIVISCL','Chemicals','Current NSE-derived classification: Chemicals; basic industry Specialty Chemicals.','https://patternsradar.com/s/PRIVISCL'),
    ('QUESS','Services','Quess provides staffing and workforce/business services; mapped to portfolio Services sector.','https://www.nseindia.com/get-quote/equity/QUESS/Quess-Corp-Limited'),
    ('SANGAMIND','Textiles','Current NSE-derived classification: Textiles; industry Textiles & Apparels.','https://patternsradar.com/s/SANGAMIND'),
    ('SBCL','Capital Goods','Shivalik Bimetal Controls listing sector is Electric Equipment; mapped to portfolio Capital Goods.','https://www.moneycontrol.com/company-facts/shivalikbimeta/listing/SBC01'),
    ('SHAILY','Consumer Durables','Current NSE-derived classification: Consumer Durables; basic industry Plastic Products - Consumer.','https://patternsradar.com/s/SHAILY'),
    ('SHAKTIPUMP','Capital Goods','Current NSE-derived classification: Capital Goods; basic industry Compressors Pumps & Diesel Engines.','https://patternsradar.com/s/SHAKTIPUMP'),
    ('SHARDAMOTR','Automobile and Auto Components','Current NSE-derived classification: Automobile and Auto Components.','https://patternsradar.com/s/SHARDAMOTR'),
    ('SOLARA','Pharma','NSE basic industry Pharmaceuticals; company segment Active Pharmaceutical Ingredients.','https://www.nseindia.com/get-quote/equity/SOLARA/Solara-Active-Pharma-Sciences-Limited'),
    ('TATACAP','Financial Services','NSE basic industry: Non Banking Financial Company (NBFC).','https://www.nseindia.com/get-quote/equity/TATACAP/Tata-Capital-Limited'),
    ('TATVA','Chemicals','NSE basic industry Specialty Chemicals; filing describes single segment Specialty Chemicals.','https://www.nseindia.com/get-quote/equity/TATVA/Tatva-Chintan-Pharma-Chem-Limited'),
    ('TI','Fast Moving Consumer Goods','BSE/NSE classification places Tilaknagar Industries in alcoholic beverages / FMCG universe.','https://www.moneycontrol.com/company-facts/tilaknagarindustries/listing/TI09'),
    ('UTLSOLAR','Renewable Energy','Fujiyama Power Systems is a rooftop solar solutions provider; listing sector Renewables.','https://www.moneycontrol.com/company-facts/fujiyamapowersystems/listing/FPS01'),
    ('V2RETAIL','Consumer Services','Current NSE-derived classification: Consumer Services; industry Retailing.','https://patternsradar.com/s/V2RETAIL'),
    ('VAML','Metals & Mining','Vedanta Aluminium Metal listing sector: Aluminium & Aluminium Products.','https://www.moneycontrol.com/company-facts/vedantaaluminiummetalltd/listing/VAM'),
    ('VINATIORGA','Chemicals','Vinati Organics listing sector: Speciality Chemicals.','https://www.moneycontrol.com/company-facts/vinatiorganics/listing/VO01'),
    ('YATRA','Consumer Services','Yatra Online provides travel services; current market classification is Consumer Services.','https://in.tradingview.com/symbols/NSE-YATRA/')
),
source_upsert as (
  insert into public.data_sources(code,name,source_kind,evidence_priority,is_active,entitlement_verified,retention_rights_verified,capabilities,configuration)
  values ('OWNER_REVIEWED_CLASSIFICATION','Owner-reviewed classification master','MANUAL',12,true,true,true,'{"security_classification":true}'::jsonb,'{"basis":"owner spreadsheet plus reviewed public exchange/company evidence"}'::jsonb)
  on conflict (code) do update set updated_at=now()
  returning code
),
payload as (
  select jsonb_build_object(
    'reviewed_at', now(),
    'purpose','Close remaining sector-classification gaps after owner STOCK MASTER normalization',
    'mappings', jsonb_agg(jsonb_build_object('symbol',symbol,'sector',sector,'evidence_note',evidence_note,'evidence_url',evidence_url) order by symbol)
  ) as raw_payload
  from mappings
),
record as (
  insert into public.data_source_records(source_code,record_kind,external_record_id,retrieved_at,payload_hash,raw_payload,source_url,terms_snapshot)
  select 'OWNER_REVIEWED_CLASSIFICATION','SECTOR_GAP_REVIEW','sector-gap-review-2026-09-13',now(),encode(digest(raw_payload::text,'sha256'),'hex'),raw_payload,null,'{"retention":"internal reviewed classification evidence"}'::jsonb
  from payload
  on conflict (source_code,record_kind,external_record_id,payload_hash) do update set retrieved_at=excluded.retrieved_at
  returning id
),
inserted as (
  insert into public.security_attribute_observations(security_id,source_record_id,source_code,attribute_code,text_value,normalized_value,retrieved_at,fresh_until,evidence_status)
  select s.id,r.id,'OWNER_REVIEWED_CLASSIFICATION','SECTOR',m.sector,m.sector,now(),now()+interval '365 days','AVAILABLE'
  from mappings m
  join public.securities s on upper(s.symbol)=m.symbol
  cross join record r
  where not exists (
    select 1 from public.current_security_classification_v1 c where c.security_id=s.id and c.sector is not null
  )
  on conflict (source_record_id,security_id,attribute_code) do nothing
  returning id,security_id
)
insert into public.security_attribute_decisions(security_id,attribute_code,selected_observation_id,decision_basis,decided_at,notes)
select i.security_id,'SECTOR',i.id,'MANUAL_REVIEW',now(),'Owner-approved sector-gap completion using uploaded STOCK MASTER taxonomy plus reviewed current exchange/company evidence; no ticker-name-only guessing.'
from inserted i
on conflict (security_id,attribute_code) do update
set selected_observation_id=excluded.selected_observation_id,
    decision_basis=excluded.decision_basis,
    decided_at=excluded.decided_at,
    notes=excluded.notes;