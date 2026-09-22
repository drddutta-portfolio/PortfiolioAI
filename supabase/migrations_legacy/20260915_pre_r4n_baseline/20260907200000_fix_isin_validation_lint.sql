-- Stage 5.1 follow-up: remove a PL/pgSQL shadowed/unused variable warning.
-- Behaviour is unchanged.
create or replace function public.portfolioai_is_valid_isin(p_isin text)
returns boolean language plpgsql immutable set search_path = '' as $$
declare
  v_digits text := '';
  v_char text;
  v_sum integer := 0;
  v_digit integer;
  v_double boolean := false;
begin
  if p_isin is null or p_isin !~ '^[A-Z]{2}[A-Z0-9]{9}[0-9]$' then return false; end if;
  for i in 1..length(p_isin) loop
    v_char := substr(p_isin, i, 1);
    if v_char ~ '[0-9]' then v_digits := v_digits || v_char;
    else v_digits := v_digits || (ascii(v_char) - 55)::text; end if;
  end loop;
  for i in reverse length(v_digits)..1 loop
    v_digit := substr(v_digits, i, 1)::integer;
    if v_double then v_digit := v_digit * 2; end if;
    v_sum := v_sum + (v_digit / 10) + (v_digit % 10);
    v_double := not v_double;
  end loop;
  return v_sum % 10 = 0;
end;
$$;

revoke all on function public.portfolioai_is_valid_isin(text) from public, anon, authenticated;
