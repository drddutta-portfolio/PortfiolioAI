create or replace function public.reclassify_unclassified_news_from_stored_evidence_v1(
  p_limit integer default 100
)
returns table(scanned_count integer, updated_count integer, remaining_unclassified integer)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  r record;
  v_scanned integer := 0;
  v_updated integer := 0;
  v_category text;
  v_importance text;
  v_tone text;
  v_tone_confidence numeric;
  v_tone_reason text;
begin
  if p_limit < 1 or p_limit > 500 then
    raise exception using errcode='22023', message='Invalid classification batch limit.';
  end if;

  for r in
    select
      n.id,
      n.headline,
      n.summary,
      n.category,
      n.importance_state,
      n.tone_state,
      n.tone_method,
      n.tone_confidence,
      n.tone_reason,
      e.id as evidence_record_id,
      upper(concat_ws(' ', n.headline, n.summary, e.extracted_text)) as evidence_text
    from public.news_items n
    join lateral (
      select
        dsr.id,
        dsr.raw_payload->>'extracted_text' as extracted_text
      from public.data_source_records dsr
      where dsr.record_kind in (
        'NSE_NEWS_LINKED_DOCUMENT_TEXT_EXTRACTION',
        'NSE_NEWS_LINKED_DOCUMENT_TEXT_EXTRACTION_PILOT'
      )
        and dsr.raw_payload->>'news_item_id' = n.id::text
        and nullif(btrim(dsr.raw_payload->>'extracted_text'), '') is not null
      order by dsr.retrieved_at desc
      limit 1
    ) e on true
    where n.is_active
      and (
        n.category = 'UNCLASSIFIED'
        or n.importance_state = 'UNCLASSIFIED'
        or n.tone_state = 'UNCLASSIFIED'
      )
    order by coalesce(n.published_at, n.first_seen_at) desc
    limit p_limit
  loop
    v_scanned := v_scanned + 1;
    v_category := r.category;
    v_importance := r.importance_state;
    v_tone := r.tone_state;
    v_tone_confidence := r.tone_confidence;
    v_tone_reason := r.tone_reason;

    if v_category = 'UNCLASSIFIED' then
      if r.evidence_text ~ '(PENALTY|\mFINE\M|TAX AUDIT|REGULATORY ACTION|SHOW CAUSE|VIOLATION|CONTRAVENTION|ORDER PASSED BY|ORDER FROM.*(AUTHORITY|DEPARTMENT|REGULATOR)|SEBI ORDER|RBI ORDER|GST DEMAND|TAX DEMAND)' then
        v_category := 'REGULATORY';
      elsif r.evidence_text ~ '(MANAGING DIRECTOR|CHIEF EXECUTIVE OFFICER|\mCEO\M|WHOLE[- ]TIME DIRECTOR|EXECUTIVE DIRECTOR|CHIEF FINANCIAL OFFICER|\mCFO\M|CHANGE IN DIRECTORS|APPOINTMENT OF.*DIRECTOR|RE[- ]APPOINTMENT OF.*DIRECTOR|KEY MANAGERIAL PERSONNEL|\mKMP\M)' then
        v_category := 'MANAGEMENT';
      elsif r.evidence_text ~ '(FINANCIAL RESULTS|QUARTERLY RESULTS|ANNUAL RESULTS|AUDITED RESULTS|UNAUDITED RESULTS)' then
        v_category := 'RESULTS';
      elsif r.evidence_text ~ '(DIVIDEND|RECORD DATE|BONUS ISSUE|STOCK SPLIT|RIGHTS ISSUE|BUYBACK)' then
        v_category := 'CORPORATE_ACTION';
      elsif r.evidence_text ~ '(CREDIT RATING|RATING UPGRADE|RATING DOWNGRADE|RATING REAFFIRMED)' then
        v_category := 'CREDIT_RATING';
      elsif r.evidence_text ~ '(LETTER OF AWARD|WORK ORDER|PURCHASE ORDER|CONTRACT AWARDED|AWARDED.*CONTRACT|ORDER RECEIVED FROM.*(CUSTOMER|CLIENT)|RECEIVED.*(WORK ORDER|PURCHASE ORDER))' then
        v_category := 'ORDER_CONTRACT';
      elsif r.evidence_text ~ '(FUND RAIS|QUALIFIED INSTITUTIONAL PLACEMENT|\mQIP\M|PREFERENTIAL ISSUE|DEBENTURE ISSUE|BOND ISSUE)' then
        v_category := 'FUND_RAISE';
      elsif r.evidence_text ~ '(ACQUISITION|MERGER|AMALGAMATION|STRATEGIC INVESTMENT|STAKE ACQUISITION)' then
        v_category := 'MA_INVESTMENT';
      elsif r.evidence_text ~ '(SHAREHOLDING PATTERN|INSIDER TRADING|PROMOTER SHAREHOLDING)' then
        v_category := 'SHAREHOLDING_INSIDER';
      elsif r.evidence_text ~ '(LITIGATION|COURT ORDER|ARBITRATION|LEGAL PROCEEDING)' then
        v_category := 'LITIGATION_GOVERNANCE';
      elsif r.evidence_text ~ '(REGULATION 30|GENERAL UPDATE|GENERAL UPDATES|OTHER INFORMATION|DISCLOSURE)' then
        v_category := 'GENERAL';
      end if;
    end if;

    if v_importance = 'UNCLASSIFIED' then
      if r.evidence_text ~ '(REPORTED FRAUD|FRAUD (ALLEGATION|ALLEGED|INVESTIGATION|DETECTED|DISCOVERED)|DEFAULT|INSOLVENC|LIQUIDATION|BANKRUPTCY|TERMINATION OF.*MATERIAL|ADVERSE ORDER.*MATERIAL)' then
        v_importance := 'IMPORTANT';
      elsif v_category = 'MANAGEMENT' and r.evidence_text ~ '(MANAGING DIRECTOR|CHIEF EXECUTIVE OFFICER|\mCEO\M|CHIEF FINANCIAL OFFICER|\mCFO\M|WHOLE[- ]TIME DIRECTOR)' then
        v_importance := 'IMPORTANT';
      elsif v_category in ('RESULTS','FUND_RAISE','MA_INVESTMENT') then
        v_importance := 'IMPORTANT';
      elsif v_category = 'REGULATORY' and r.evidence_text ~ '(NO MATERIAL IMPACT|NO MATERIAL ADVERSE IMPACT|NOT MATERIAL)' then
        v_importance := 'NOTABLE';
      elsif v_category in ('REGULATORY','MANAGEMENT','CORPORATE_ACTION','ORDER_CONTRACT','CREDIT_RATING','LITIGATION_GOVERNANCE') then
        v_importance := 'NOTABLE';
      elsif v_category in ('SHAREHOLDING_INSIDER','GENERAL') then
        v_importance := 'ROUTINE';
      end if;
    end if;

    if v_tone = 'UNCLASSIFIED' then
      if r.evidence_text ~ '(PENALTY|\mFINE\M|DOWNGRADE|DEFAULT|REPORTED FRAUD|FRAUD (ALLEGATION|ALLEGED|INVESTIGATION|DETECTED|DISCOVERED)|INSOLVENC|LIQUIDATION|CANCELLATION|TERMINATION|ADVERSE ORDER|TAX DEMAND|GST DEMAND|SHORT PAYMENT OF TAX|VIOLATION|CONTRAVENTION)' then
        v_tone := 'NEGATIVE';
        v_tone_confidence := 0.95;
        v_tone_reason := 'Stored official filing contains an explicit adverse event such as a penalty, default, downgrade, termination, regulatory demand or reported fraud.';
      elsif r.evidence_text ~ '(RATING UPGRADE|UPGRADED.*RATING|LETTER OF AWARD|WORK ORDER.*RECEIVED|PURCHASE ORDER.*RECEIVED|CONTRACT AWARDED|AWARDED.*CONTRACT|DIVIDEND DECLARED|DIVIDEND RECOMMENDED|RECOMMENDED.*DIVIDEND)' then
        v_tone := 'POSITIVE';
        v_tone_confidence := 0.95;
        v_tone_reason := 'Stored official filing contains explicit favorable award, upgrade, order or dividend language.';
      elsif v_category = 'MANAGEMENT' and r.evidence_text ~ '(APPOINTMENT|RE[- ]APPOINTMENT|APPROVED.*APPOINTMENT|SUCCESSION|BOARD OF DIRECTORS)' then
        v_tone := 'NEUTRAL';
        v_tone_confidence := 0.90;
        v_tone_reason := 'Stored official filing describes a management or succession action without an explicit favorable or adverse event.';
      elsif r.evidence_text ~ '(RECORD DATE|SHAREHOLDING PATTERN|BOARD MEETING|ANALYST.*MEET|INVESTOR.*MEET|GENERAL UPDATE|GENERAL UPDATES)' and r.evidence_text !~ '(PENALTY|\mFINE\M|DOWNGRADE|DEFAULT|REPORTED FRAUD|TERMINATION|ADVERSE ORDER)' then
        v_tone := 'NEUTRAL';
        v_tone_confidence := 0.85;
        v_tone_reason := 'Stored official filing is administrative or informational and contains no explicit favorable or adverse event.';
      end if;
    end if;

    if v_category <> r.category or v_importance <> r.importance_state or v_tone <> r.tone_state then
      update public.news_items
      set
        category = v_category,
        importance_state = v_importance,
        tone_state = v_tone,
        tone_method = case when v_tone <> r.tone_state then 'DETERMINISTIC' else tone_method end,
        tone_confidence = case when v_tone <> r.tone_state then v_tone_confidence else tone_confidence end,
        tone_reason = case when v_tone <> r.tone_state then v_tone_reason else tone_reason end,
        updated_at = now()
      where id = r.id;

      insert into public.news_classification_events (
        news_item_id, classifier_version, evidence_record_id,
        previous_category, new_category,
        previous_importance_state, new_importance_state,
        previous_tone_state, new_tone_state, reason
      ) values (
        r.id, 'stored-evidence-v2.1', r.evidence_record_id,
        r.category, v_category,
        r.importance_state, v_importance,
        r.tone_state, v_tone,
        'Stored linked-document deterministic evidence classifier v2.1.'
      );
      v_updated := v_updated + 1;
    end if;
  end loop;

  return query
  select v_scanned, v_updated, (
    select count(*)::integer from public.news_items n
    where n.is_active and (
      n.category='UNCLASSIFIED' or n.importance_state='UNCLASSIFIED' or n.tone_state='UNCLASSIFIED'
    )
  );
end;
$function$;

revoke all on function public.reclassify_unclassified_news_from_stored_evidence_v1(integer) from public, anon, authenticated;
grant execute on function public.reclassify_unclassified_news_from_stored_evidence_v1(integer) to service_role;

-- Roll back only the fields that the first v2 evidence pass changed from UNCLASSIFIED,
-- then re-run them through the tightened v2.1 rules. This preserves any classifications
-- that existed before the evidence pass.
do $$
declare
  r record;
begin
  for r in
    select distinct on (e.news_item_id)
      e.news_item_id,
      e.previous_category,
      e.previous_importance_state,
      e.previous_tone_state
    from public.news_classification_events e
    where e.classifier_version = 'stored-evidence-v2'
    order by e.news_item_id, e.created_at desc
  loop
    update public.news_items n
    set
      category = case when r.previous_category='UNCLASSIFIED' then 'UNCLASSIFIED' else n.category end,
      importance_state = case when r.previous_importance_state='UNCLASSIFIED' then 'UNCLASSIFIED' else n.importance_state end,
      tone_state = case when r.previous_tone_state='UNCLASSIFIED' then 'UNCLASSIFIED' else n.tone_state end,
      tone_method = case when r.previous_tone_state='UNCLASSIFIED' then 'UNCLASSIFIED' else n.tone_method end,
      tone_confidence = case when r.previous_tone_state='UNCLASSIFIED' then null else n.tone_confidence end,
      tone_reason = case when r.previous_tone_state='UNCLASSIFIED' then null else n.tone_reason end,
      updated_at = now()
    where n.id = r.news_item_id;
  end loop;

  perform * from public.reclassify_unclassified_news_from_stored_evidence_v1(500);
end $$;
