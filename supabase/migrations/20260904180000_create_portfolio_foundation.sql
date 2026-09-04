-- PortfolioAI foundation: identity, broker, and security master data only.
-- This migration intentionally excludes transactions, holdings, imports, and scoring.

create function public.portfolioai_set_audit_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := pg_catalog.now();
    new.updated_at := new.created_at;
  elsif tg_op = 'UPDATE' then
    new.created_at := old.created_at;
    new.updated_at := pg_catalog.statement_timestamp();
  end if;

  return new;
end;
$$;

revoke execute on function public.portfolioai_set_audit_timestamps() from public, anon, authenticated;

-- User-owned portfolio container. Financial records should be archived, not hard-deleted.
create table public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete restrict,
  name text not null check (name = btrim(name) and name <> ''),
  base_currency text not null default 'INR'
    check (base_currency ~ '^[A-Z]{3}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index portfolios_user_name_key
  on public.portfolios (user_id, lower(name));

-- Trusted reference master. Browser-authenticated users receive read-only access below.
create table public.brokers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (name = btrim(name) and name <> ''),
  code text not null check (code ~ '^[A-Z0-9_]+$'),
  api_provider text check (api_provider is null or api_provider ~ '^[A-Z0-9_]+$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brokers_code_key unique (code)
);

create unique index brokers_name_key on public.brokers (lower(name));

-- Ownership is derived through portfolio_id; broker relationships are not duplicated elsewhere.
create table public.broker_accounts (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios (id) on delete restrict,
  broker_id uuid not null references public.brokers (id) on delete restrict,
  account_name text not null check (account_name = btrim(account_name) and account_name <> ''),
  external_account_id text check (
    external_account_id is null
    or (external_account_id = btrim(external_account_id) and external_account_id <> '')
  ),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint broker_accounts_id_portfolio_key unique (id, portfolio_id)
);

create unique index broker_accounts_portfolio_name_key
  on public.broker_accounts (portfolio_id, lower(account_name));

create unique index broker_accounts_external_id_key
  on public.broker_accounts (portfolio_id, broker_id, external_account_id)
  where external_account_id is not null;

-- Trusted sector reference master.
create table public.sectors (
  id uuid primary key default gen_random_uuid(),
  name text not null check (name = btrim(name) and name <> ''),
  code text not null check (code ~ '^[A-Z0-9_]+$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sectors_code_key unique (code)
);

create unique index sectors_name_key on public.sectors (lower(name));

-- Trusted industry reference master. Each industry belongs to exactly one sector.
create table public.industries (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid not null references public.sectors (id) on delete restrict,
  name text not null check (name = btrim(name) and name <> ''),
  code text not null check (code ~ '^[A-Z0-9_]+$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint industries_id_sector_key unique (id, sector_id),
  constraint industries_code_key unique (code)
);

create unique index industries_sector_name_key
  on public.industries (sector_id, lower(name));

-- Canonical security master. Asset class is independent of any portfolio role.
create table public.securities (
  id uuid primary key default gen_random_uuid(),
  symbol text not null check (symbol = btrim(symbol) and symbol = upper(symbol) and symbol <> ''),
  exchange text not null check (exchange ~ '^[A-Z0-9_]+$'),
  -- ISIN is canonical here and must not be repeated in security_identifiers.
  isin text unique check (isin is null or isin ~ '^[A-Z]{2}[A-Z0-9]{9}[0-9]$'),
  name text not null check (name = btrim(name) and name <> ''),
  asset_class text not null check (
    asset_class in ('EQUITY', 'ETF', 'MUTUAL_FUND', 'GOLD', 'SILVER', 'BOND', 'CASH', 'OTHER')
  ),
  instrument_type text not null check (
    instrument_type = btrim(instrument_type)
    and instrument_type = upper(instrument_type)
    and instrument_type <> ''
  ),
  sector_id uuid references public.sectors (id) on delete restrict,
  industry_id uuid,
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint securities_exchange_symbol_key unique (exchange, symbol),
  constraint securities_industry_requires_sector check (industry_id is null or sector_id is not null),
  constraint securities_industry_sector_fkey
    foreign key (industry_id, sector_id)
    references public.industries (id, sector_id)
    on delete restrict
);

-- Alternate exchange/provider identifiers only. ISIN remains canonical on securities.isin.
create table public.security_identifiers (
  id uuid primary key default gen_random_uuid(),
  security_id uuid not null references public.securities (id) on delete restrict,
  identifier_type text not null check (
    identifier_type ~ '^[A-Z0-9_]+$'
    and identifier_type <> 'ISIN'
  ),
  identifier_value text not null check (
    identifier_value = btrim(identifier_value)
    and identifier_value <> ''
  ),
  provider_code text not null check (provider_code ~ '^[A-Z0-9_]+$'),
  exchange text check (exchange is null or exchange ~ '^[A-Z0-9_]+$'),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint security_identifiers_identity_key
    unique nulls not distinct (provider_code, identifier_type, identifier_value, exchange)
);

create index broker_accounts_broker_id_idx on public.broker_accounts (broker_id);
create index securities_sector_id_idx on public.securities (sector_id);
create index securities_industry_id_idx on public.securities (industry_id);
create index security_identifiers_security_id_idx on public.security_identifiers (security_id);

create unique index security_identifiers_one_primary_key
  on public.security_identifiers (security_id, provider_code, identifier_type)
  where is_primary;

comment on column public.securities.isin is
  'Canonical ISIN. ISIN values are prohibited in security_identifiers.';
comment on column public.security_identifiers.provider_code is
  'Normalized code for the exchange, broker, or data provider that issued the identifier.';
comment on table public.security_identifiers is
  'Alternate/provider identifiers only; reference-master writes use trusted ingestion or server-side processes.';

create trigger portfolios_set_audit_timestamps
before insert or update on public.portfolios
for each row execute function public.portfolioai_set_audit_timestamps();

create trigger brokers_set_audit_timestamps
before insert or update on public.brokers
for each row execute function public.portfolioai_set_audit_timestamps();

create trigger broker_accounts_set_audit_timestamps
before insert or update on public.broker_accounts
for each row execute function public.portfolioai_set_audit_timestamps();

create trigger sectors_set_audit_timestamps
before insert or update on public.sectors
for each row execute function public.portfolioai_set_audit_timestamps();

create trigger industries_set_audit_timestamps
before insert or update on public.industries
for each row execute function public.portfolioai_set_audit_timestamps();

create trigger securities_set_audit_timestamps
before insert or update on public.securities
for each row execute function public.portfolioai_set_audit_timestamps();

create trigger security_identifiers_set_audit_timestamps
before insert or update on public.security_identifiers
for each row execute function public.portfolioai_set_audit_timestamps();

alter table public.portfolios enable row level security;
alter table public.broker_accounts enable row level security;
alter table public.brokers enable row level security;
alter table public.sectors enable row level security;
alter table public.industries enable row level security;
alter table public.securities enable row level security;
alter table public.security_identifiers enable row level security;

create policy "Users can read their own portfolios"
on public.portfolios
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own portfolios"
on public.portfolios
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own portfolios"
on public.portfolios
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can read broker accounts in their portfolios"
on public.broker_accounts
for select
to authenticated
using (
  exists (
    select 1
    from public.portfolios
    where portfolios.id = broker_accounts.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
);

create policy "Users can create broker accounts in their portfolios"
on public.broker_accounts
for insert
to authenticated
with check (
  exists (
    select 1
    from public.portfolios
    where portfolios.id = broker_accounts.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
);

create policy "Users can update broker accounts in their portfolios"
on public.broker_accounts
for update
to authenticated
using (
  exists (
    select 1
    from public.portfolios
    where portfolios.id = broker_accounts.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.portfolios
    where portfolios.id = broker_accounts.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
);

-- Reference masters are intentionally read-only for browser-authenticated users.
-- Future writes must use reviewed trusted ingestion or server-side processes.
create policy "Authenticated users can read brokers"
on public.brokers
for select
to authenticated
using (true);

create policy "Authenticated users can read sectors"
on public.sectors
for select
to authenticated
using (true);

create policy "Authenticated users can read industries"
on public.industries
for select
to authenticated
using (true);

create policy "Authenticated users can read securities"
on public.securities
for select
to authenticated
using (true);

create policy "Authenticated users can read security identifiers"
on public.security_identifiers
for select
to authenticated
using (true);
