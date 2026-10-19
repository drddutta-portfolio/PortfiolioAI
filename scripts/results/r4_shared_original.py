"""Replay existing issuer-original observations without creating duplicate facts.

R5 review labels alone confer no R4 authority. Exact retained PDF bytes, issuer
identity, dated native columns and every existing core observation must replay.
"""
import hashlib,json,re
from collections import defaultdict
from decimal import Decimal
from datetime import date
import fitz
from r4_pdf_geometry import extract_page
from r4_issuer_name import exact_legal_identity

CONTRACT='RESULTS_R4_SHARED_ISSUER_ORIGINAL_REPLAY_V1'
PREFIX='portfolioai-results/development/v1/quarterly/'
PROFILES={
 'R5_FEDERAL_CONSOLIDATED_PREVIOUS_QUARTERS_V1':{
  'symbol':'FEDERALBNK','isin':'INE171A01029','legal':'THE FEDERAL BANK LIMITED',
  'identity_marker':'L65191KL1931PLC000368',
  'originals':{'2024-12-31':('602e0ce12375f7c4ecee8403d4c194aeb48010933d1b39fd099ee298d2c3a16d','https://www.federal.bank.in/documents/10180/1124357561/Financial%2BResults%2B-%2BQ3%2BFY%2B25.pdf/b1e1c935-02cc-55eb-07bf-c4edd3b47123?t=1738032984384')},
  'periods':{'2024-09-30':'2024-07-01','2024-12-31':'2024-10-01'},'bank':True},
 'R5_TATAPOWER_SOURCE_LOCKED_MANUAL_VISUAL_CONSOLIDATED_V1':{
  'symbol':'TATAPOWER','isin':'INE245A01021','legal':'THE TATA POWER COMPANY LIMITED',
  'identity_marker':'500400',
  'originals':{
   '2024-09-30':('d04f36345f5ee6d94a19ba99385bf30a5937e5d37f862c019903681c4ba1c4bc','https://www.tatapower.com/company-financials/quarterly-reports/fy2024---2025/consolidated-and-standalone-financial-results-for-the-quarter-and-half-year-ended-30th-september-2024.pdf'),
   '2024-12-31':('eadab3f13b927c614814c1cb2ee4b4f9e0b13fe73268f0646cc6a9efc420bc33','https://www.tatapower.com/company-financials/quarterly-reports/fy2024---2025/consolidated-and-standalone-financial-results-for-the-quarter-and-nine-months-ended-31st-december-2024.pdf')},
  'periods':{'2024-09-30':'2024-07-01','2024-12-31':'2024-10-01'},'bank':False},
}

def context(source):
    payload=source['raw_payload'];profile=PROFILES.get(payload.get('contract'))
    if profile is None:raise ValueError('SHARED_ORIGINAL_CONTRACT_UNSUPPORTED')
    if (payload.get('issuer')!=profile['symbol'] or payload.get('isin')!=profile['isin']
        or payload.get('scope')!='CONSOLIDATED'):
        raise ValueError('SHARED_ORIGINAL_CONTEXT_MISMATCH')
    matches=[(period,digest,url) for period,(digest,url) in profile['originals'].items() if source['source_url']==url and payload.get('sourceUrl')==url]
    if len(matches)!=1:raise ValueError('SHARED_ORIGINAL_URL_UNPROVEN')
    original_period,digest,url=matches[0]
    claimed=payload.get('originalR2SHA256',payload.get('sourceOriginalSHA256'))
    key=PREFIX+'security_id='+profile['isin']+'/period_end='+original_period+'/original_version='+digest+'/issuer-original.pdf'
    if claimed!=digest or payload.get('originalR2Key',key)!=key:raise ValueError('SHARED_ORIGINAL_REFERENCE_MISMATCH')
    if hashlib.sha256(json.dumps(payload,separators=(',',':'),sort_keys=True).encode()).hexdigest()!=source['payload_hash']:
        raise ValueError('SHARED_ORIGINAL_PAYLOAD_HASH_MISMATCH')
    return profile,digest,key

def qualify(raw,source,observations):
    profile,digest,_=context(source)
    if not raw.startswith(b'%PDF') or hashlib.sha256(raw).hexdigest()!=digest:raise ValueError('SHARED_ORIGINAL_HASH_MISMATCH')
    groups=defaultdict(list)
    for row in observations:
        if row['symbol']!=profile['symbol'] or row['isin']!=profile['isin'] or str(row['source_record_id'])!=str(source['source_record_id']):
            raise ValueError('SHARED_ORIGINAL_SECURITY_OR_SOURCE_MISMATCH')
        period=str(row['period_end'])
        if period not in profile['periods'] or str(row['period_start'])!=profile['periods'][period]:raise ValueError('SHARED_ORIGINAL_QUARTER_MISMATCH')
        if row['currency']!='INR' or row['consolidation_scope']!='CONSOLIDATED' or row['evidence_status']!='AVAILABLE':raise ValueError('SHARED_ORIGINAL_OBSERVATION_CONTEXT_MISMATCH')
        groups[period].append(row)
    eligible=[]
    with fitz.open(stream=raw,filetype='pdf') as pdf:
        if len(pdf)>40:raise ValueError('SHARED_ORIGINAL_PAGE_BOUND')
        cover=' '.join(p.get_text('text') for p in list(pdf)[:3])
        if not exact_legal_identity(profile['legal'],cover) or profile['identity_marker'] not in cover:raise ValueError('SHARED_ORIGINAL_ISSUER_UNPROVEN')
        text=' '.join(p.get_text('text') for p in pdf)
        if re.search(r'\b(?:pro[ -]?forma|carve[ -]?out)\b',text,re.I):raise ValueError('SHARED_ORIGINAL_BUSINESS_BASIS_UNPROVEN')
        for period,rows in groups.items():
            required={'NET_INTEREST_INCOME_QUARTER' if profile['bank'] else 'OPERATING_REVENUE_QUARTER','NET_PROFIT_QUARTER','EPS_DILUTED'}
            if len(rows)!=3 or {r['metric_code'] for r in rows}!=required:continue
            vectors=[]
            for i,page in enumerate(pdf):
                try:parsed=extract_page(page,i+1,period,bank=profile['bank'],allow_comparative=True)
                except ValueError:continue
                if parsed['scope']!='CONSOLIDATED':continue
                if parsed['first_column_period']!=period and re.search(r'\b(?:restated|recast)\b',text,re.I):continue
                vectors.append(parsed['facts'])
            distinct={tuple(sorted((k,v['value'],v['unit']) for k,v in facts.items())) for facts in vectors}
            if len(distinct)!=1:continue
            facts=vectors[0]
            if any(r['unit']!=facts[r['metric_code']]['unit'] or Decimal(str(r['numeric_value']))!=Decimal(facts[r['metric_code']]['value']) for r in rows):continue
            eligible.extend(str(r['id']) for r in rows)
    return {'contract':CONTRACT,'eligible_observation_ids':sorted(eligible),'original_sha256':digest}

def replay(source,observations,client,bucket):
    _,_,key=context(source)
    raw=client.get_object(Bucket=bucket,Key=key)['Body'].read()
    return qualify(raw,source,observations)
