-- Stage 6: user-controlled portfolio themes and portfolio-safe theme membership.
-- Portfolio roles and position settings continue to use portfolio_security_settings.

create table public.themes (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios (id) on delete restrict,
  name text not null check (name = btrim(name) and name <> ''),
  description text check (description is null or description = btrim(description)),
  max_allocation numeric(9, 6) check (max_allocation is null or max_allocation between 0 and 100),
  priority integer check (priority is null or priority >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint themes_id_portfolio_key unique (id, portfolio_id)
);

create unique index themes_portfolio_name_key
  on public.themes (portfolio_id, lower(name));

create table public.theme_securities (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null,
  theme_id uuid not null,
  security_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint theme_securities_theme_portfolio_fkey
    foreign key (theme_id, portfolio_id)
    references public.themes (id, portfolio_id)
    on delete restrict,
  constraint theme_securities_security_fkey
    foreign key (security_id)
    references public.securities (id)
    on delete restrict,
  constraint theme_securities_theme_security_key unique (theme_id, security_id)
);

create index theme_securities_portfolio_security_idx
  on public.theme_securities (portfolio_id, security_id);

comment on table public.themes is
  'User-controlled portfolio themes. These are classifications, not analytical scores or recommendations.';
comment on table public.theme_securities is
  'Portfolio-safe many-to-many theme membership for transaction-derived open holdings; independent of primary portfolio role.';

create function public.portfolioai_validate_theme_security_holding()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.current_holdings holding
    where holding.portfolio_id = new.portfolio_id
      and holding.security_id = new.security_id
      and holding.current_quantity <> 0
  ) then
    raise exception using
      errcode = '23503',
      message = 'Theme membership requires an open holding in the same portfolio.';
  end if;
  return new;
end;
$$;

revoke execute on function public.portfolioai_validate_theme_security_holding()
from public, anon, authenticated;

create trigger theme_securities_validate_open_holding
before insert or update of portfolio_id, security_id on public.theme_securities
for each row execute function public.portfolioai_validate_theme_security_holding();

create trigger themes_set_audit_timestamps
before insert or update on public.themes
for each row execute function public.portfolioai_set_audit_timestamps();

create trigger theme_securities_set_audit_timestamps
before insert or update on public.theme_securities
for each row execute function public.portfolioai_set_audit_timestamps();

alter table public.themes enable row level security;
alter table public.theme_securities enable row level security;

revoke all privileges on table public.themes from anon, authenticated;
revoke all privileges on table public.theme_securities from anon, authenticated;

grant select, insert, update on table public.themes to authenticated;
grant select, insert, update, delete on table public.theme_securities to authenticated;

create policy "Users can read themes in their portfolios"
on public.themes for select to authenticated
using (
  exists (
    select 1 from public.portfolios
    where portfolios.id = themes.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
);

create policy "Users can create themes in their portfolios"
on public.themes for insert to authenticated
with check (
  exists (
    select 1 from public.portfolios
    where portfolios.id = themes.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
);

create policy "Users can update themes in their portfolios"
on public.themes for update to authenticated
using (
  exists (
    select 1 from public.portfolios
    where portfolios.id = themes.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.portfolios
    where portfolios.id = themes.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
);

create policy "Users can read theme memberships in their portfolios"
on public.theme_securities for select to authenticated
using (
  exists (
    select 1 from public.portfolios
    where portfolios.id = theme_securities.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
);

create policy "Users can create theme memberships in their portfolios"
on public.theme_securities for insert to authenticated
with check (
  exists (
    select 1 from public.portfolios
    where portfolios.id = theme_securities.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
);

create policy "Users can update theme memberships in their portfolios"
on public.theme_securities for update to authenticated
using (
  exists (
    select 1 from public.portfolios
    where portfolios.id = theme_securities.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.portfolios
    where portfolios.id = theme_securities.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
);

create policy "Users can remove theme memberships in their portfolios"
on public.theme_securities for delete to authenticated
using (
  exists (
    select 1 from public.portfolios
    where portfolios.id = theme_securities.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
);

revoke all privileges on table public.themes from anon;
revoke all privileges on table public.theme_securities from anon;
