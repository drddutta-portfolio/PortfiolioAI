alter table public.portfolio_security_settings
  add column if not exists target_price numeric,
  add column if not exists stop_loss_price numeric,
  add column if not exists target_price_alert_enabled boolean not null default true,
  add column if not exists stop_loss_alert_enabled boolean not null default true;

alter table public.portfolio_security_settings
  drop constraint if exists portfolio_security_settings_target_price_check,
  add constraint portfolio_security_settings_target_price_check check (target_price is null or target_price > 0),
  drop constraint if exists portfolio_security_settings_stop_loss_price_check,
  add constraint portfolio_security_settings_stop_loss_price_check check (stop_loss_price is null or stop_loss_price > 0);

comment on column public.portfolio_security_settings.target_price is
  'User-controlled target price for this portfolio/security. Advisory automation may suggest but must not overwrite without user action.';
comment on column public.portfolio_security_settings.stop_loss_price is
  'User-controlled stop-loss/reference risk price for this portfolio/security.';
comment on column public.portfolio_security_settings.target_price_alert_enabled is
  'Reserved for future target-price notification workflow.';
comment on column public.portfolio_security_settings.stop_loss_alert_enabled is
  'Reserved for future stop-loss notification workflow.';
