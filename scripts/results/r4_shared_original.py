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
  'periods':{'2024-09-30':'2024-07-01','2024-12-31':'2024-10-01'},'bank':False,'ocr_page':8,
  # Independent visual review of the original page, 19-Oct-2026. This is
  # an image-pinned human review, never a claim of successful OCR.
  'visual_reviews':{'2024-09-30':{
   'page':8,'dpi':110,'jpeg_quality':65,
   'image_sha256':'6672443c954eab3071a48c4f3f10b2a1aedd69256a8bb686e8ecb712bc1f597f',
   'scope':'CONSOLIDATED','unit':'INR_CRORE',
   'quarter_group':'Quarter ended','column':'30-Sep-24',
   'eps_basis':'AFTER_NET_MOVEMENT_IN_REGULATORY_DEFERRAL_BALANCES',
   'facts':{'OPERATING_REVENUE_QUARTER':{'value':'15697.67','unit':'INR_CRORE'},
            'NET_PROFIT_QUARTER':{'value':'1093.08','unit':'INR_CRORE'},
            'EPS_DILUTED':{'value':'2.90','unit':'INR_PER_SHARE'}}},
   '2024-12-31':{
   'page':8,'dpi':110,'jpeg_quality':65,
   'image_sha256':'b6f28e9ae9107fd55039899a1467e5c39e51fad7878497705df6c6da3e7c807c',
   'scope':'CONSOLIDATED','unit':'INR_CRORE',
   'quarter_group':'Quarter ended','column':'31-Dec-24',
   'eps_basis':'AFTER_NET_MOVEMENT_IN_REGULATORY_DEFERRAL_BALANCES',
   'facts':{'OPERATING_REVENUE_QUARTER':{'value':'15391.06','unit':'INR_CRORE'},
            'NET_PROFIT_QUARTER':{'value':'1187.54','unit':'INR_CRORE'},
            'EPS_DILUTED':{'value':'3.22','unit':'INR_PER_SHARE'}}}}},
 'R5_SIGNED_SSWL_2024_ORIGINAL_COMPARATIVE_V1':{
  'symbol':'SSWL','isin':'INE802C01033','legal':'STEEL STRIPS WHEELS LIMITED',
  'identity_marker':'L27107PB1985PLC006159','ocr_page':3,
  'originals':{'2024-12-31':('558de3ec82d9c0a11a3f0e6be14e50ca21629ed7c53fc68f04e1e156439a0df9','https://sswlindia.com/investor-docs/FR_SSWL_31_12_2024.pdf')},
  'periods':{'2024-09-30':'2024-07-01','2024-12-31':'2024-10-01'},'bank':False},
 'R5_GMBREW_SIGNED_ISSUER_Q4FY25_VISUAL_ORIGINAL_V1':{
  'symbol':'GMBREW','isin':'INE075D01018','legal':'G M BREWERIES LIMITED',
  'identity_marker':'L15500MH1981PLC025809','ocr_page':3,'scope':'STANDALONE',
  'originals':{'2025-03-31':('a44eb86f04bf11939963e6d3325feb6b0f5045b6c9846bc4ea49495bce941ca3','https://gmbreweries.com/images/4th%20Quarterly%20Financial%20Statement%2024-25.pdf')},
  'periods':{'2025-03-31':'2025-01-01'},'bank':False},

}

def context(source):
    payload=source['raw_payload'];profile=PROFILES.get(payload.get('contract'))
    if profile is None:raise ValueError('SHARED_ORIGINAL_CONTRACT_UNSUPPORTED')
    if (payload.get('issuer',payload.get('symbol'))!=profile['symbol'] or payload.get('isin')!=profile['isin']
        or payload.get('scope',payload.get('reportingScope'))!=profile.get('scope','CONSOLIDATED')):
        raise ValueError('SHARED_ORIGINAL_CONTEXT_MISMATCH')
    matches=[(period,digest,url) for period,(digest,url) in profile['originals'].items() if source['source_url']==url and payload.get('sourceUrl')==url]
    if len(matches)!=1:raise ValueError('SHARED_ORIGINAL_URL_UNPROVEN')
    original_period,digest,url=matches[0]
    claimed=payload.get('originalR2SHA256',payload.get('sourceOriginalSHA256',payload.get('signedOriginalSHA256',payload.get('sha256'))))
    key=PREFIX+'security_id='+profile['isin']+'/period_end='+original_period+'/original_version='+digest+'/issuer-original.pdf'
    if claimed!=digest or payload.get('originalR2Key',payload.get('r2OriginalKey',key))!=key:raise ValueError('SHARED_ORIGINAL_REFERENCE_MISMATCH')
    if hashlib.sha256(json.dumps(payload,separators=(',',':'),sort_keys=True).encode()).hexdigest()!=source['payload_hash']:
        raise ValueError('SHARED_ORIGINAL_PAYLOAD_HASH_MISMATCH')
    return profile,digest,key

def rendered_facts(raw,page_no,period):
    """Two independent renders must prove the same dated core cells."""
    from r4_ocr_dated_geometry import extract_dated_page
    for mode in (6,3,11):
        try:parsed,checks=extract_dated_page(raw,page_no,period,render_dpi=(300,450),segmentation_mode=mode)
        except ValueError:continue
        parsed['_rendered_issuer_texts']=[checks['issuer_text_first'],checks['issuer_text_second']]
        return parsed
    raise ValueError('SHARED_ORIGINAL_APPROVED_RENDER_MODES_UNPROVEN')

def reviewed_original_facts(pdf,review,period):
    """Reopen exactly the independently inspected signed statement image.

    Exact PDF SHA is checked by the caller. The full original-page image must
    also reproduce the independently viewed image byte for byte. Date, scope,
    crore units and the after-regulatory EPS row were visually inspected.
    """
    if not 1<=review['page']<=len(pdf):raise ValueError('VISUAL_REVIEW_PAGE_UNPROVEN')
    preview=pdf[review['page']-1].get_pixmap(dpi=review['dpi'],alpha=False).tobytes('jpeg',jpg_quality=review['jpeg_quality'])
    if hashlib.sha256(preview).hexdigest()!=review['image_sha256']:raise ValueError('VISUAL_REVIEW_IMAGE_CHANGED')
    return {'scope':review['scope'],'first_column_period':period,'facts':review['facts']}

def qualify(raw,source,observations):
    profile,digest,_=context(source)
    if not raw.startswith(b'%PDF') or hashlib.sha256(raw).hexdigest()!=digest:raise ValueError('SHARED_ORIGINAL_HASH_MISMATCH')
    groups=defaultdict(list)
    for row in observations:
        if row['symbol']!=profile['symbol'] or row['isin']!=profile['isin'] or str(row['source_record_id'])!=str(source['source_record_id']):
            raise ValueError('SHARED_ORIGINAL_SECURITY_OR_SOURCE_MISMATCH')
        period=str(row['period_end'])
        if period not in profile['periods'] or str(row['period_start'])!=profile['periods'][period]:raise ValueError('SHARED_ORIGINAL_QUARTER_MISMATCH')
        if row['currency']!='INR' or row['consolidation_scope']!=profile.get('scope','CONSOLIDATED') or row['evidence_status']!='AVAILABLE':raise ValueError('SHARED_ORIGINAL_OBSERVATION_CONTEXT_MISMATCH')
        groups[period].append(row)
    eligible=[];rendered_cache={}
    with fitz.open(stream=raw,filetype='pdf') as pdf:
        if len(pdf)>40:raise ValueError('SHARED_ORIGINAL_PAGE_BOUND')
        cover=' '.join(p.get_text('text') for p in list(pdf)[:3])
        identity_ok=exact_legal_identity(profile['legal'],cover) and profile['identity_marker'] in cover
        if not identity_ok and profile.get('ocr_page') and groups:
            first_period=sorted(groups)[-1]
            rendered_cache[first_period]=rendered_facts(raw,profile['ocr_page'],first_period)
            texts=rendered_cache[first_period].get('_rendered_issuer_texts',[])
            identity_ok=len(texts)==2 and all(exact_legal_identity(profile['legal'],t) and profile['identity_marker'] in re.sub(r'[^A-Z0-9]','',t.upper()) for t in texts)
        if not identity_ok:raise ValueError('SHARED_ORIGINAL_ISSUER_UNPROVEN')
        text=' '.join(p.get_text('text') for p in pdf)
        if re.search(r'\b(?:pro[ -]?forma|carve[ -]?out)\b',text,re.I):raise ValueError('SHARED_ORIGINAL_BUSINESS_BASIS_UNPROVEN')
        for period,rows in groups.items():
            required={'NET_INTEREST_INCOME_QUARTER' if profile['bank'] else 'OPERATING_REVENUE_QUARTER','NET_PROFIT_QUARTER','EPS_DILUTED'}
            if len(rows)!=3 or {r['metric_code'] for r in rows}!=required:continue
            vectors=[]
            visual_review=profile.get('visual_reviews',{}).get(period)
            for i,page in enumerate(pdf):
                try:parsed=extract_page(page,i+1,period,bank=profile['bank'],allow_comparative=True)
                except ValueError:continue
                if parsed['scope']!=profile.get('scope','CONSOLIDATED'):continue
                if parsed['first_column_period']!=period and re.search(r'\b(?:restated|recast)\b',text,re.I):continue
                vectors.append(parsed['facts'])
            if not vectors and profile.get('ocr_page'):
                try:
                    rendered=rendered_cache.get(period)
                    if rendered is None:rendered=rendered_facts(raw,profile['ocr_page'],period)
                    if rendered['scope']==profile.get('scope','CONSOLIDATED') and (rendered['first_column_period']==period or not re.search(r'\\b(?:restated|recast)\\b',text,re.I)):
                        vectors.append(rendered['facts'])
                except ValueError:pass
            if visual_review:
                reviewed=reviewed_original_facts(pdf,visual_review,period)
                if reviewed['scope']!=profile.get('scope','CONSOLIDATED'):raise ValueError('VISUAL_REVIEW_SCOPE_MISMATCH')
                vectors=[reviewed['facts']]
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
