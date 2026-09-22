-- PortfolioAI import and transaction foundation.
-- Transactions are the accounting source of truth; imported source rows remain immutable evidence.

create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios (id) on delete restrict,
  broker_account_id uuid,
  source_type text not null check (source_type ~ '^[A-Z0-9_]+$'),
  source_provider text check (source_provider is null or source_provider ~ '^[A-Z0-9_]+$'),
  file_name text check (file_name is null or (file_name = btrim(file_name) and file_name <> '')),
  file_sha256 text check (file_sha256 is null or file_sha256 ~ '^[0-9a-f]{64}$'),
  duplicate_of_import_batch_id uuid,
  file_format text check (file_format is null or file_format in ('XLSX', 'XLS', 'CSV', 'API', 'MANUAL')),
  mapping_version text check (
    mapping_version is null
    or (mapping_version = btrim(mapping_version) and mapping_version <> '')
  ),
  mapping_config jsonb check (mapping_config is null or jsonb_typeof(mapping_config) = 'object'),
  snapshot_as_of_date date,
  status text not null default 'UPLOADED' check (
    status in (
      'UPLOADED',
      'PREVIEWED',
      'VALIDATED',
      'AWAITING_CONFIRMATION',
      'COMMITTING',
      'COMMITTED',
      'REJECTED',
      'FAILED'
    )
  ),
  total_row_count integer not null default 0 check (total_row_count >= 0),
  valid_row_count integer not null default 0 check (valid_row_count >= 0),
  invalid_row_count integer not null default 0 check (invalid_row_count >= 0),
  ambiguous_row_count integer not null default 0 check (ambiguous_row_count >= 0),
  duplicate_row_count integer not null default 0 check (duplicate_row_count >= 0),
  confirmed_at timestamptz,
  committed_at timestamptz,
  failure_details jsonb check (failure_details is null or jsonb_typeof(failure_details) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint import_batches_id_portfolio_key unique (id, portfolio_id),
  constraint import_batches_duplicate_portfolio_fkey
    foreign key (duplicate_of_import_batch_id, portfolio_id)
    references public.import_batches (id, portfolio_id)
    on delete restrict,
  constraint import_batches_broker_account_portfolio_fkey
    foreign key (broker_account_id, portfolio_id)
    references public.broker_accounts (id, portfolio_id)
    on delete restrict,
  constraint import_batches_duplicate_not_self_check check (
    duplicate_of_import_batch_id is null or duplicate_of_import_batch_id <> id
  ),
  constraint import_batches_commit_state_check check (
    (status = 'COMMITTED' and committed_at is not null)
    or (status <> 'COMMITTED' and committed_at is null)
  )
);

comment on table public.import_batches is
  'Metadata and workflow state for XLSX, CSV, API, or manual imports; source binaries are not stored here.';
comment on column public.import_batches.file_sha256 is
  'Lowercase SHA-256 of the original file, used for exact-file re-import detection.';
comment on column public.import_batches.duplicate_of_import_batch_id is
  'Optional same-portfolio link to an earlier attempt with identical source content; every attempt retains its own row.';

create index import_batches_file_identity_idx
  on public.import_batches (portfolio_id, source_type, file_sha256)
  where file_sha256 is not null;

create index import_batches_portfolio_status_idx
  on public.import_batches (portfolio_id, status);

create index import_batches_broker_account_id_idx
  on public.import_batches (broker_account_id)
  where broker_account_id is not null;

create function public.portfolioai_protect_committed_import_batch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'COMMITTED' then
    raise exception 'committed import batches are immutable';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke execute on function public.portfolioai_protect_committed_import_batch()
from public, anon, authenticated;

create trigger import_batches_protect_committed_state
before update or delete on public.import_batches
for each row execute function public.portfolioai_protect_committed_import_batch();

create table public.import_source_rows (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid not null,
  portfolio_id uuid not null,
  row_number integer not null check (row_number > 0),
  raw_data jsonb not null check (jsonb_typeof(raw_data) = 'object'),
  raw_row_hash text check (raw_row_hash is null or raw_row_hash ~ '^[0-9a-f]{64}$'),
  normalized_data jsonb check (normalized_data is null or jsonb_typeof(normalized_data) = 'object'),
  resolved_security_id uuid references public.securities (id) on delete restrict,
  validation_status text not null default 'PENDING' check (
    validation_status in ('PENDING', 'VALID', 'INVALID', 'AMBIGUOUS', 'DUPLICATE', 'IGNORED')
  ),
  validation_errors jsonb not null default '[]'::jsonb
    check (jsonb_typeof(validation_errors) = 'array'),
  validation_warnings jsonb not null default '[]'::jsonb
    check (jsonb_typeof(validation_warnings) = 'array'),
  duplicate_status text check (
    duplicate_status is null
    or duplicate_status in ('NOT_DUPLICATE', 'POSSIBLE_DUPLICATE', 'CONFIRMED_DUPLICATE')
  ),
  duplicate_of_transaction_id uuid,
  created_at timestamptz not null default now(),
  constraint import_source_rows_batch_row_key unique (import_batch_id, row_number),
  constraint import_source_rows_id_batch_portfolio_key unique (id, import_batch_id, portfolio_id),
  constraint import_source_rows_batch_portfolio_fkey
    foreign key (import_batch_id, portfolio_id)
    references public.import_batches (id, portfolio_id)
    on delete restrict
);

comment on table public.import_source_rows is
  'Immutable row-level import evidence, including invalid, ambiguous, duplicate, and ignored source rows.';
comment on column public.import_source_rows.raw_data is
  'Original source column names and values captured before normalization.';
comment on column public.import_source_rows.normalized_data is
  'Untrusted staging output. A future trusted commit operation must revalidate it and all resolution/duplicate fields server-side.';

create function public.portfolioai_protect_import_source_row()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if exists (
      select 1
      from public.import_batches
      where import_batches.id = new.import_batch_id
        and import_batches.portfolio_id = new.portfolio_id
        and import_batches.status = 'COMMITTED'
    ) then
      raise exception 'committed import source rows are immutable';
    end if;

    new.created_at := pg_catalog.now();
  elsif tg_op = 'DELETE' then
    if exists (
      select 1
      from public.import_batches
      where import_batches.id = old.import_batch_id
        and import_batches.portfolio_id = old.portfolio_id
        and import_batches.status = 'COMMITTED'
    ) then
      raise exception 'committed import source rows are immutable';
    end if;

    return old;
  else
    if exists (
      select 1
      from public.import_batches
      where import_batches.id = old.import_batch_id
        and import_batches.portfolio_id = old.portfolio_id
        and import_batches.status = 'COMMITTED'
    ) then
      raise exception 'committed import source rows are immutable';
    end if;

    if new.import_batch_id is distinct from old.import_batch_id
      or new.portfolio_id is distinct from old.portfolio_id
      or new.row_number is distinct from old.row_number
      or new.raw_data is distinct from old.raw_data
      or new.raw_row_hash is distinct from old.raw_row_hash
    then
      raise exception 'original import source row fields are immutable';
    end if;

    new.created_at := old.created_at;
  end if;

  return new;
end;
$$;

revoke execute on function public.portfolioai_protect_import_source_row()
from public, anon, authenticated;

create trigger import_source_rows_protect_original
before insert or update or delete on public.import_source_rows
for each row execute function public.portfolioai_protect_import_source_row();

create index import_source_rows_resolved_security_id_idx
  on public.import_source_rows (resolved_security_id)
  where resolved_security_id is not null;

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios (id) on delete restrict,
  broker_account_id uuid,
  security_id uuid not null references public.securities (id) on delete restrict,
  transaction_type text not null check (
    transaction_type in (
      'BUY',
      'SELL',
      'OPENING_POSITION',
      'TRANSFER_IN',
      'TRANSFER_OUT',
      'BONUS',
      'SPLIT',
      'REVERSAL',
      'ADJUSTMENT'
    )
  ),
  transaction_date date,
  executed_at timestamptz,
  source_sequence integer check (source_sequence is null or source_sequence >= 0),
  quantity numeric(38, 18) check (quantity is null or quantity > 0),
  unit_price numeric(38, 18) check (unit_price is null or unit_price >= 0),
  gross_amount numeric(38, 18),
  charges numeric(38, 18),
  taxes numeric(38, 18),
  net_amount numeric(38, 18),
  currency_code text not null default 'INR' check (currency_code ~ '^[A-Z]{3}$'),
  source_average_cost numeric(38, 18) check (
    source_average_cost is null or source_average_cost >= 0
  ),
  source_cost_basis numeric(38, 18) check (
    source_cost_basis is null or source_cost_basis >= 0
  ),
  source_type text not null check (source_type ~ '^[A-Z0-9_]+$'),
  source_provider text check (source_provider is null or source_provider ~ '^[A-Z0-9_]+$'),
  external_transaction_id text check (
    external_transaction_id is null
    or (external_transaction_id = btrim(external_transaction_id) and external_transaction_id <> '')
  ),
  external_order_id text check (
    external_order_id is null
    or (external_order_id = btrim(external_order_id) and external_order_id <> '')
  ),
  external_trade_id text check (
    external_trade_id is null
    or (external_trade_id = btrim(external_trade_id) and external_trade_id <> '')
  ),
  import_batch_id uuid,
  import_source_row_id uuid,
  deduplication_key text check (
    deduplication_key is null
    or (deduplication_key = btrim(deduplication_key) and deduplication_key <> '')
  ),
  data_quality_status text not null check (
    data_quality_status in (
      'COMPLETE',
      'MISSING_DATE',
      'MISSING_BROKER',
      'MISSING_DATE_AND_BROKER',
      'NEEDS_REVIEW'
    )
  ),
  accounting_status text not null default 'ACTIVE' check (
    accounting_status in ('ACTIVE', 'SUPERSEDED', 'REVERSED')
  ),
  reversal_of_transaction_id uuid,
  superseded_at timestamptz,
  superseded_by_import_batch_id uuid,
  supersession_reason text check (
    supersession_reason is null
    or (supersession_reason = btrim(supersession_reason) and supersession_reason <> '')
  ),
  notes text check (notes is null or notes = btrim(notes)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_id_portfolio_key unique (id, portfolio_id),
  constraint transactions_reversal_portfolio_fkey
    foreign key (reversal_of_transaction_id, portfolio_id)
    references public.transactions (id, portfolio_id)
    on delete restrict,
  constraint transactions_broker_account_portfolio_fkey
    foreign key (broker_account_id, portfolio_id)
    references public.broker_accounts (id, portfolio_id)
    on delete restrict,
  constraint transactions_import_batch_portfolio_fkey
    foreign key (import_batch_id, portfolio_id)
    references public.import_batches (id, portfolio_id)
    on delete restrict,
  constraint transactions_superseded_batch_portfolio_fkey
    foreign key (superseded_by_import_batch_id, portfolio_id)
    references public.import_batches (id, portfolio_id)
    on delete restrict,
  constraint transactions_import_source_row_batch_portfolio_fkey
    foreign key (import_source_row_id, import_batch_id, portfolio_id)
    references public.import_source_rows (id, import_batch_id, portfolio_id)
    on delete restrict,
  constraint transactions_quantity_required_check check (
    transaction_type not in ('BUY', 'SELL', 'OPENING_POSITION', 'TRANSFER_IN', 'TRANSFER_OUT', 'BONUS')
    or quantity is not null
  ),
  constraint transactions_data_quality_check check (
    data_quality_status = 'NEEDS_REVIEW'
    or (
      data_quality_status = 'COMPLETE'
      and transaction_date is not null
      and broker_account_id is not null
    )
    or (
      data_quality_status = 'MISSING_DATE'
      and transaction_date is null
      and broker_account_id is not null
    )
    or (
      data_quality_status = 'MISSING_BROKER'
      and transaction_date is not null
      and broker_account_id is null
    )
    or (
      data_quality_status = 'MISSING_DATE_AND_BROKER'
      and transaction_date is null
      and broker_account_id is null
    )
  ),
  constraint transactions_import_lineage_check check (
    import_source_row_id is null or import_batch_id is not null
  ),
  constraint transactions_supersession_state_check check (
    (
      accounting_status = 'SUPERSEDED'
      and superseded_at is not null
      and supersession_reason is not null
    )
    or (
      accounting_status <> 'SUPERSEDED'
      and superseded_at is null
      and superseded_by_import_batch_id is null
      and supersession_reason is null
    )
  ),
  constraint transactions_reversal_link_check check (
    (transaction_type = 'REVERSAL' and reversal_of_transaction_id is not null)
    or (transaction_type <> 'REVERSAL' and reversal_of_transaction_id is null)
  )
);

comment on table public.transactions is
  'Accounting source of truth. Missing legacy dates and broker accounts remain null and are disclosed by data_quality_status. Financial numeric values must cross application/API boundaries as decimal strings or another exact-decimal representation, never JavaScript floating point.';
comment on column public.transactions.quantity is
  'Positive magnitude with direction determined by transaction_type; stored as numeric(38,18).';
comment on column public.transactions.source_average_cost is
  'Average cost reported by an opening-position source; it is not a fabricated historical purchase price.';
comment on column public.transactions.accounting_status is
  'Only ACTIVE rows affect current_holdings. Future state changes, replacement lineage, import-row linkage, and batch changes must be atomic.';

alter table public.import_source_rows
  add constraint import_source_rows_duplicate_transaction_fkey
    foreign key (duplicate_of_transaction_id, portfolio_id)
    references public.transactions (id, portfolio_id)
    on delete restrict;

create unique index transactions_import_source_row_key
  on public.transactions (import_source_row_id)
  where import_source_row_id is not null;

create unique index transactions_provider_transaction_key
  on public.transactions (broker_account_id, source_provider, external_transaction_id)
  where broker_account_id is not null
    and source_provider is not null
    and external_transaction_id is not null;

create unique index transactions_provider_trade_key
  on public.transactions (broker_account_id, source_provider, external_trade_id)
  where broker_account_id is not null
    and source_provider is not null
    and external_trade_id is not null;

create unique index transactions_deduplication_key
  on public.transactions (portfolio_id, source_provider, deduplication_key)
  where source_provider is not null and deduplication_key is not null;

create unique index transactions_one_reversal_key
  on public.transactions (reversal_of_transaction_id)
  where reversal_of_transaction_id is not null;

create index transactions_portfolio_security_active_idx
  on public.transactions (portfolio_id, security_id)
  where accounting_status = 'ACTIVE';

create index transactions_portfolio_id_idx
  on public.transactions (portfolio_id);

create index transactions_broker_account_id_idx
  on public.transactions (broker_account_id)
  where broker_account_id is not null;

create index transactions_security_id_idx on public.transactions (security_id);

create index transactions_portfolio_date_idx
  on public.transactions (portfolio_id, transaction_date)
  where transaction_date is not null;

create index transactions_import_batch_id_idx
  on public.transactions (import_batch_id)
  where import_batch_id is not null;

create index transactions_superseded_by_import_batch_id_idx
  on public.transactions (superseded_by_import_batch_id)
  where superseded_by_import_batch_id is not null;

create index import_source_rows_duplicate_transaction_id_idx
  on public.import_source_rows (duplicate_of_transaction_id)
  where duplicate_of_transaction_id is not null;

create table public.portfolio_security_settings (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios (id) on delete restrict,
  security_id uuid not null references public.securities (id) on delete restrict,
  portfolio_role text not null default 'OTHER' check (
    portfolio_role in ('CORE', 'SATELLITE', 'THEMATIC', 'ETF', 'OTHER')
  ),
  target_weight numeric(9, 6) check (target_weight is null or target_weight between 0 and 100),
  minimum_weight numeric(9, 6) check (minimum_weight is null or minimum_weight between 0 and 100),
  maximum_weight numeric(9, 6) check (maximum_weight is null or maximum_weight between 0 and 100),
  priority integer check (priority is null or priority >= 0),
  is_watchlisted boolean not null default false,
  is_frozen boolean not null default false,
  investment_horizon text check (
    investment_horizon is null
    or (investment_horizon = btrim(investment_horizon) and investment_horizon <> '')
  ),
  notes text check (notes is null or notes = btrim(notes)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portfolio_security_settings_portfolio_security_key unique (portfolio_id, security_id),
  constraint portfolio_security_settings_weight_order_check check (
    (minimum_weight is null or target_weight is null or minimum_weight <= target_weight)
    and (target_weight is null or maximum_weight is null or target_weight <= maximum_weight)
    and (minimum_weight is null or maximum_weight is null or minimum_weight <= maximum_weight)
  )
);

comment on table public.portfolio_security_settings is
  'Portfolio-specific role and sizing preferences; portfolio_role is independent of securities.asset_class.';
comment on column public.portfolio_security_settings.target_weight is
  'Percentage weight stored as numeric(9,6), where 100 represents one hundred percent.';

create index portfolio_security_settings_security_id_idx
  on public.portfolio_security_settings (security_id);

create trigger import_batches_set_audit_timestamps
before insert or update on public.import_batches
for each row execute function public.portfolioai_set_audit_timestamps();

create trigger transactions_set_audit_timestamps
before insert or update on public.transactions
for each row execute function public.portfolioai_set_audit_timestamps();

create trigger portfolio_security_settings_set_audit_timestamps
before insert or update on public.portfolio_security_settings
for each row execute function public.portfolioai_set_audit_timestamps();

alter table public.import_batches enable row level security;
alter table public.import_source_rows enable row level security;
alter table public.transactions enable row level security;
alter table public.portfolio_security_settings enable row level security;

revoke all privileges on table public.import_batches from anon, authenticated;
revoke all privileges on table public.import_source_rows from anon, authenticated;
revoke all privileges on table public.transactions from anon, authenticated;
revoke all privileges on table public.portfolio_security_settings from anon, authenticated;

grant select, insert, update on table public.import_batches to authenticated;
grant select, insert, update on table public.import_source_rows to authenticated;
grant select on table public.transactions to authenticated;
grant select, insert, update on table public.portfolio_security_settings to authenticated;

create policy "Users can read their own import batches"
on public.import_batches
for select
to authenticated
using (
  exists (
    select 1
    from public.portfolios
    where portfolios.id = import_batches.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
);

create policy "Users can create import batches in their portfolios"
on public.import_batches
for insert
to authenticated
with check (
  status = 'UPLOADED'
  and exists (
    select 1
    from public.portfolios
    where portfolios.id = import_batches.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
);

create policy "Users can update uncommitted import batches"
on public.import_batches
for update
to authenticated
using (
  status not in ('COMMITTING', 'COMMITTED')
  and exists (
    select 1
    from public.portfolios
    where portfolios.id = import_batches.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
)
with check (
  status not in ('COMMITTING', 'COMMITTED')
  and exists (
    select 1
    from public.portfolios
    where portfolios.id = import_batches.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
);

create policy "Users can read their own import source rows"
on public.import_source_rows
for select
to authenticated
using (
  exists (
    select 1
    from public.import_batches
    join public.portfolios on portfolios.id = import_batches.portfolio_id
    where import_batches.id = import_source_rows.import_batch_id
      and portfolios.user_id = (select auth.uid())
  )
);

create policy "Users can create rows in uncommitted import batches"
on public.import_source_rows
for insert
to authenticated
with check (
  exists (
    select 1
    from public.import_batches
    join public.portfolios on portfolios.id = import_batches.portfolio_id
    where import_batches.id = import_source_rows.import_batch_id
      and import_batches.status not in ('COMMITTING', 'COMMITTED')
      and portfolios.user_id = (select auth.uid())
  )
);

create policy "Users can update rows in uncommitted import batches"
on public.import_source_rows
for update
to authenticated
using (
  exists (
    select 1
    from public.import_batches
    join public.portfolios on portfolios.id = import_batches.portfolio_id
    where import_batches.id = import_source_rows.import_batch_id
      and import_batches.status not in ('COMMITTING', 'COMMITTED')
      and portfolios.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.import_batches
    join public.portfolios on portfolios.id = import_batches.portfolio_id
    where import_batches.id = import_source_rows.import_batch_id
      and import_batches.status not in ('COMMITTING', 'COMMITTED')
      and portfolios.user_id = (select auth.uid())
  )
);

-- Browser clients can read committed accounting history but cannot insert, update, or delete it.
-- A future reviewed trusted commit operation will validate and atomically create transactions.
create policy "Users can read their own transactions"
on public.transactions
for select
to authenticated
using (
  exists (
    select 1
    from public.portfolios
    where portfolios.id = transactions.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
);

create policy "Users can read their own portfolio security settings"
on public.portfolio_security_settings
for select
to authenticated
using (
  exists (
    select 1
    from public.portfolios
    where portfolios.id = portfolio_security_settings.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
);

create policy "Users can create their own portfolio security settings"
on public.portfolio_security_settings
for insert
to authenticated
with check (
  exists (
    select 1
    from public.portfolios
    where portfolios.id = portfolio_security_settings.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
);

create policy "Users can update their own portfolio security settings"
on public.portfolio_security_settings
for update
to authenticated
using (
  exists (
    select 1
    from public.portfolios
    where portfolios.id = portfolio_security_settings.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.portfolios
    where portfolios.id = portfolio_security_settings.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
);

create view public.current_holdings
with (security_invoker = true)
as
select
  transactions.portfolio_id,
  transactions.security_id,
  sum(
    case transactions.transaction_type
      when 'BUY' then transactions.quantity
      when 'SELL' then -transactions.quantity
      when 'OPENING_POSITION' then transactions.quantity
      when 'TRANSFER_IN' then transactions.quantity
      when 'TRANSFER_OUT' then -transactions.quantity
      when 'BONUS' then transactions.quantity
      else 0::numeric
    end
  ) as current_quantity,
  count(*) as active_transaction_count,
  count(*) filter (where transactions.data_quality_status <> 'COMPLETE')
    as incomplete_transaction_count,
  bool_or(transactions.transaction_date is null) as has_missing_dates,
  bool_or(transactions.broker_account_id is null) as has_missing_broker,
  count(*) filter (
    where transactions.transaction_type in ('SPLIT', 'REVERSAL', 'ADJUSTMENT')
  ) as unresolved_quantity_event_count,
  count(*) filter (
    where transactions.transaction_type in ('SPLIT', 'REVERSAL', 'ADJUSTMENT')
  ) = 0 as is_quantity_complete
from public.transactions
where transactions.accounting_status = 'ACTIVE'
group by transactions.portfolio_id, transactions.security_id
having
  sum(
    case transactions.transaction_type
      when 'BUY' then transactions.quantity
      when 'SELL' then -transactions.quantity
      when 'OPENING_POSITION' then transactions.quantity
      when 'TRANSFER_IN' then transactions.quantity
      when 'TRANSFER_OUT' then -transactions.quantity
      when 'BONUS' then transactions.quantity
      else 0::numeric
    end
  ) <> 0
  or count(*) filter (
    where transactions.transaction_type in ('SPLIT', 'REVERSAL', 'ADJUSTMENT')
  ) > 0;

comment on view public.current_holdings is
  'Live quantity projection from ACTIVE transactions. It intentionally excludes FIFO, P&L, holding period, and unsupported SPLIT/ADJUSTMENT semantics.';

revoke all privileges on table public.current_holdings from anon, authenticated;
grant select on table public.current_holdings to authenticated;
