-- R1 / D35B: deterministic Position Sizing Engine persistence contract.
-- This migration is additive. It is committed for review only and must not be
-- applied to any production Supabase project without explicit owner approval.

create table if not exists public.position_sizing_assessments (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete restrict,
  security_id uuid not null references public.securities(id) on delete restrict,
  engine_version text not null check (length(btrim(engine_version)) > 0),
  evaluation_key text not null check (length(btrim(evaluation_key)) >= 16),
  as_of_at timestamptz not null,
  assessment_state text not null check (
    assessment_state in ('READY','INSUFFICIENT_EVIDENCE','BLOCKED_PREREQUISITE','NOT_APPLICABLE')
  ),
  current_weight numeric(9,6) null check (current_weight between 0 and 100),
  suggested_target_weight numeric(9,6) null check (suggested_target_weight between 0 and 100),
  suggested_minimum_weight numeric(9,6) null check (suggested_minimum_weight between 0 and 100),
  suggested_maximum_weight numeric(9,6) null check (suggested_maximum_weight between 0 and 100),
  recommended_action text null check (
    recommended_action is null or recommended_action in (
      'ADD','HOLD','ADD_ON_WEAKNESS','REDUCE','TRIM_INTO_STRENGTH','FREEZE','EXIT_REVIEW'
    )
  ),
  evidence_coverage numeric(7,6) null check (evidence_coverage between 0 and 1),
  evidence_confidence numeric(9,6) null check (evidence_confidence between 0 and 100),
  reason_codes text[] not null default '{}'::text[],
  rationale jsonb not null default '[]'::jsonb check (jsonb_typeof(rationale) = 'array'),
  input_snapshot jsonb not null check (jsonb_typeof(input_snapshot) = 'object'),
  source_score_run_id uuid null references public.stock_score_runs(id) on delete set null,
  source_recommendation_run_id uuid null references public.stock_recommendation_runs(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint position_sizing_assessments_range_order check (
    suggested_minimum_weight is null
    or suggested_maximum_weight is null
    or suggested_minimum_weight <= suggested_maximum_weight
  ),
  constraint position_sizing_assessments_target_in_range check (
    suggested_target_weight is null
    or suggested_minimum_weight is null
    or suggested_maximum_weight is null
    or suggested_target_weight between suggested_minimum_weight and suggested_maximum_weight
  ),
  constraint position_sizing_assessments_ready_shape check (
    (assessment_state = 'READY'
      and current_weight is not null
      and suggested_target_weight is not null
      and suggested_minimum_weight is not null
      and suggested_maximum_weight is not null
      and recommended_action is not null
      and source_score_run_id is not null
      and source_recommendation_run_id is not null)
    or
    (assessment_state <> 'READY'
      and suggested_target_weight is null
      and suggested_minimum_weight is null
      and suggested_maximum_weight is null
      and recommended_action is null)
  )
);

comment on table public.position_sizing_assessments is
  'Append-only deterministic D35B position-sizing assessments. Engine output is separate from owner-controlled portfolio_security_settings.';
comment on column public.position_sizing_assessments.evaluation_key is
  'Stable SHA-256-style fingerprint/idempotency key derived from the canonical sizing input snapshot by trusted orchestration.';
comment on column public.position_sizing_assessments.input_snapshot is
  'Canonical structured inputs used by the deterministic engine, retained for reproducibility; never an AI-generated payload.';
comment on column public.position_sizing_assessments.recommended_action is
  'Sizing advisory action only. D35B intentionally has EXIT_REVIEW but no automatic EXIT action.';

create unique index if not exists position_sizing_assessments_idempotency_uq
  on public.position_sizing_assessments(portfolio_id, security_id, engine_version, evaluation_key);

create index if not exists position_sizing_assessments_latest_idx
  on public.position_sizing_assessments(portfolio_id, security_id, as_of_at desc, created_at desc);

alter table public.position_sizing_assessments enable row level security;

revoke all privileges on table public.position_sizing_assessments from public, anon, authenticated, service_role;
grant select on table public.position_sizing_assessments to authenticated;
grant select, insert on table public.position_sizing_assessments to service_role;

drop policy if exists position_sizing_assessments_owner_read on public.position_sizing_assessments;
create policy position_sizing_assessments_owner_read
  on public.position_sizing_assessments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.portfolios p
      where p.id = position_sizing_assessments.portfolio_id
        and p.user_id = (select auth.uid())
    )
  );
