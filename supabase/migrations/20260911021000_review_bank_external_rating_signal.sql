update scoring_model_metric_rules
set rule_state = 'REVIEWED',
    provider_field_contract = 'Official instrument-level long-term senior/deposit rating; exclude Tier I and Tier II capital instruments from this signal',
    normalization_rule = jsonb_build_object(
      'type','rating_ordinal',
      'scale', jsonb_build_object(
        'AAA',100,'AA+',90,'AA',80,'AA-',70,
        'A+',60,'A',50,'A-',40,
        'BBB+',30,'BBB',20,'BBB-',10,
        'BELOW_BBB_MINUS',0
      ),
      'outlook_modifier', jsonb_build_object(
        'POSITIVE',3,'STABLE',0,'NEGATIVE',-5,
        'WATCH_POSITIVE',3,'WATCH_NEGATIVE',-10
      ),
      'clamp', jsonb_build_array(0,100),
      'eligible_instrument_types', jsonb_build_array('FIXED_DEPOSIT','INFRASTRUCTURE_BOND','NON_CONVERTIBLE_DEBENTURE'),
      'selection_policy','LATEST_DATE_THEN_WORST_ELIGIBLE_SCORE'
    )
where scoring_profile = 'BANK_NBFC'
  and dimension_code = 'BALANCE_SHEET_CREDIT'
  and input_code = 'EXTERNAL_LONG_TERM_RATING';
