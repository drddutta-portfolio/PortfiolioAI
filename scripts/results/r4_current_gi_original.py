"""Retained current-quarter legacy general-insurance XML originals.

Uses explicit reported net premium earned, PAT and after-extraordinary basic/diluted EPS from
OneD only. No annual/YTD substitution, inferred identity or calculated EPS.
"""
import json,re
from decimal import Decimal
from urllib.parse import urlparse
import xml.etree.ElementTree as ET
from r4_nse_catalog_revision import xml_facts,canonical,sha,PERIODS,local,unit_kinds

CONTRACT='PORTFOLIOAI_RESULTS_NSE_CURRENT_GI_RETAINED_XML_V1'
KIND='RESULTS_R4_CURRENT_GI_ORIGINAL_XBRL_V1'
PREFIX='portfolioai-results/development/v1/quarterly/';BUCKET='portfolioai-history-dev'
TAGS={'NET_PREMIUM_EARNED_QUARTER':'PremiumEarned','NET_PROFIT_QUARTER':'ProfitLossAfterTax','EPS_DILUTED':'BasicAndDilutedEPSAfterExtraordinaryItemsNetOfTaxExpenseForThePeriodNotToBeAnnualized'}
CORE=set(TAGS)

def origin(url):
    u=urlparse(url)
    return (u.scheme=='https' and u.hostname=='nsearchives.nseindia.com' and not u.username and not u.password
        and not u.query and not u.fragment and u.port in (None,443)
        and bool(re.fullmatch(r'/corporate/xbrl/INTEGRATED_FILING_GI_[A-Za-z0-9_]+\.xml',u.path,re.I)))

def extract(raw,symbol,isin,period,scope,legal):
    if period not in PERIODS or scope not in ('STANDALONE','CONSOLIDATED'):raise ValueError('CURRENT_GI_QUARTER_OR_SCOPE_UNPROVEN')
    if symbol!='STARHEALTH' or isin!='INE575P01011' or scope!='STANDALONE':raise ValueError('CURRENT_GI_EXACT_APPROVED_INSURER_REQUIRED')
    values=xml_facts(raw,{'symbol':symbol,'isin':isin,'period_end':period,'scope':scope,'issuer_name':legal},TAGS)
    root=ET.fromstring(raw);facts={};units=unit_kinds(root)
    for metric,tag in TAGS.items():
        nodes=[x for x in root if local(x.tag)==tag and x.attrib.get('contextRef')=='OneD'
            and units.get(x.attrib.get('unitRef'))==('eps' if metric=='EPS_DILUTED' else 'money')]
        originals=sorted({(x.text or '').strip() for x in nodes})
        facts[metric]={'value':str(values[metric]),'unit':'INR_PER_SHARE' if metric=='EPS_DILUTED' else 'INR_CRORE',
            'original_unit':'INR_PER_SHARE' if metric=='EPS_DILUTED' else 'INR','original_values':originals,
            'context_ids':['OneD'],'source_tag':tag}
    return facts

def qualify(source,observations,client):
    payload=source['raw_payload'];period=payload.get('period_end');digest=payload.get('original_sha256_retained','')
    if (payload.get('contract')!=CONTRACT or payload.get('issuer_filing_url')!=source['source_url']
        or not origin(source['source_url']) or sha(canonical(payload))!=source['payload_hash']
        or period not in PERIODS or payload.get('period_start')!=PERIODS[period]
        or payload.get('raw_nse_bytes_retained') is not True or payload.get('original_xbrl_retained') is not True
        or payload.get('reporting_currency')!='INR' or not re.fullmatch(r'[a-f0-9]{64}',digest)
        or payload.get('original_r2_key')!=PREFIX+'evidence/original_version='+digest+'/original-xbrl.xml'):
        raise ValueError('CURRENT_GI_RETAINED_ORIGINAL_CONTRACT_UNPROVEN')
    mh=payload.get('r2_manifest_sha256','')
    expected=PREFIX+'security_id='+payload['isin']+'/period_end='+period+'/source_version='+mh+'/manifest.json'
    if not re.fullmatch(r'[a-f0-9]{64}',mh) or payload.get('r2_key')!=expected:raise ValueError('CURRENT_GI_MANIFEST_REFERENCE_UNPROVEN')
    encoded=client.get_object(Bucket=BUCKET,Key=expected)['Body'].read()
    manifest={k:v for k,v in payload.items() if k not in ('r2_key','r2_manifest_sha256')}
    if sha(encoded)!=mh or json.loads(encoded)!=manifest:raise ValueError('CURRENT_GI_MANIFEST_BYTES_MISMATCH')
    raw=client.get_object(Bucket=BUCKET,Key=payload['original_r2_key'])['Body'].read()
    if sha(raw)!=digest:raise ValueError('CURRENT_GI_ORIGINAL_BYTES_MISMATCH')
    facts=extract(raw,payload['symbol'],payload['isin'],period,payload['consolidation_scope'],payload['issuer_name'])
    if facts!=payload['facts'] or set(facts)!=CORE or len(observations)!=3:raise ValueError('CURRENT_GI_ORIGINAL_CORE_REPLAY_MISMATCH')
    if {r['metric_code'] for r in observations}!=CORE:raise ValueError('CURRENT_GI_COMPLETE_CORE_TRIO_REQUIRED')
    for r in observations:
        if (r['symbol']!=payload['symbol'] or r['isin']!=payload['isin'] or str(r['security_id'])!=payload['security_id']
            or str(r['period_end'])!=period or str(r['period_start'])!=PERIODS[period]
            or r['consolidation_scope']!=payload['consolidation_scope'] or r['source_code']!='COMPANY_EXCHANGE_FILING'
            or r['currency']!='INR' or r['evidence_status']!='AVAILABLE' or str(r['source_record_id'])!=str(source['source_record_id'])
            or r['unit']!=facts[r['metric_code']]['unit'] or Decimal(str(r['numeric_value']))!=Decimal(facts[r['metric_code']]['value'])):
            raise ValueError('CURRENT_GI_CANONICAL_FACT_MISMATCH')
    return manifest
