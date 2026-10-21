"""Original issuer-hosted historical statements, independently replayed.

One acquisition adapter for the unresolved cohort. URLs discover evidence; they
never supply numbers. Canonical observations and protected decisions stay the
financial authority. No annual/YTD reconstruction or share adjustment.
"""
import hashlib,json,re,html
from decimal import Decimal
from collections import Counter
from html.parser import HTMLParser
from urllib.parse import urlparse,urljoin
import fitz
from r4_issuer_name import exact_legal_identity
from r4_pdf_geometry import extract_page

CONTRACT='RESULTS_R4_OFFICIAL_ISSUER_DATED_ORIGINAL_V1'
KIND='RESULTS_R4_OFFICIAL_ISSUER_DATED_ORIGINAL_V1'
PREFIX='portfolioai-results/development/v1/quarterly/'
BUCKET='portfolioai-history-dev'
PERIODS={'2024-09-30':'2024-07-01','2024-12-31':'2024-10-01','2025-03-31':'2025-01-01','2025-06-30':'2025-04-01'}

def canonical(value):return json.dumps(value,sort_keys=True,separators=(',',':')).encode()
def sha(raw):return hashlib.sha256(raw).hexdigest()

# Closed official discovery pages, never arbitrary provider-returned hosts.
# More issuer pages may be added after checking the issuer's own disclosures.
ISSUERS={
 'UTLSOLAR':{'legal':'FUJIYAMA POWER SYSTEMS LIMITED','hosts':['www.utlsolarfujiyama.com','utlsolarfujiyama.com'],
             'pages':['https://www.utlsolarfujiyama.com/investor-relations/financials/'],'originals':[]},
 'GROWW':{'legal':'BILLIONBRAINS GARAGE VENTURES LIMITED','hosts':['groww.in','resources.groww.in'],
          'pages':['https://groww.in/investor-relations'],'originals':[]},
 'HEXT':{'legal':'HEXAWARE TECHNOLOGIES LIMITED','hosts':['hexaware.com','www.hexaware.com','cdn.hexaware.com'],
         'pages':['https://hexaware.com/investors/quarterly-results/','https://hexaware.com/financials-reports/'],'originals':[]},
 'SANSERA':{'legal':'SANSERA ENGINEERING LIMITED','hosts':['sansera.in','www.sansera.in'],
            'pages':['https://sansera.in/all_years/2024-2025','https://sansera.in/all_quarters/q4'],'originals':[]},
 'SYRMA':{'legal':'SYRMA SGS TECHNOLOGY LIMITED','hosts':['syrmasgs.com','www.syrmasgs.com'],
          'pages':['https://www.syrmasgs.com/investor-relations/43-2/','https://syrmasgs.com/financial-information/'],'originals':[]},
 'SSWL':{'legal':'STEEL STRIPS WHEELS LIMITED','hosts':['sswlindia.com','www.sswlindia.com','sswlindia.in','www.sswlindia.in'],
         'pages':['https://sswlindia.com/investors/quarterly-annual-financial-results'],'originals':[]},
 'STARHEALTH':{'legal':'STAR HEALTH AND ALLIED INSURANCE COMPANY LIMITED','hosts':['www.starhealth.in','starhealth.in'],
               'pages':['https://www.starhealth.in/investors/disclosures/'],'originals':[]},
 'TATACAP':{'legal':'TATA CAPITAL LIMITED','hosts':['www.tatacapital.com','tatacapital.com'],
            'pages':['https://www.tatacapital.com/about-us/investor-information-and-financials.html'],'originals':[]},
 'VENTIVE':{'legal':'VENTIVE HOSPITALITY LIMITED','hosts':['www.ventivehospitality.com','ventivehospitality.com'],
            'pages':['https://www.ventivehospitality.com/financial-results/','https://www.ventivehospitality.com/investor-relations/'],'originals':[]},
 # Post-demerger names are intentionally exact: the predecessor group's
 # financials cannot automatically become the successor entity's history.
 'TMCV':{'legal':'TATA MOTORS LIMITED','hosts':['cv.tatamotors.com'],
         'pages':['https://cv.tatamotors.com/investors'],'originals':[]},
 'TMPV':{'legal':'TATA MOTORS PASSENGER VEHICLES LIMITED','hosts':['www.tatamotors.com','tatamotors.com'],
         'pages':['https://www.tatamotors.com/investors/'],'originals':[]},
 'VAML':{'legal':'VEDANTA ALUMINIUM METAL LIMITED','hosts':['vedantaaluminium.com','www.vedantaaluminium.com'],
         'pages':['https://vedantaaluminium.com/investors/results-and-reports/'],'originals':[]},
 'AWHCL':{'legal':'ANTONY WASTE HANDLING CELL LIMITED','hosts':['www.antony-waste.com','antony-waste.com'],
          'pages':['https://www.antony-waste.com/investors/financial/quarterly-financial-report/'],'originals':[]},
 'BLUSPRING':{'legal':'BLUSPRING ENTERPRISES LIMITED','hosts':['www.bluspring.com','bluspring.com'],
              'pages':['https://www.bluspring.com/for-investors/'],'originals':[]},
 'COFORGE':{'legal':'COFORGE LIMITED','hosts':['investors.coforge.com','www.coforge.com'],
            'pages':['https://investors.coforge.com/quarter-reports'],'originals':[]},
 'CPPLUS':{'legal':'ADITYA INFOTECH LIMITED','hosts':['www.adityagroup.com','adityagroup.com'],
           'pages':['https://www.adityagroup.com/financial-results'],'originals':[]},
 'EBGNG':{'legal':'ELLENBARRIE INDUSTRIAL GASES LIMITED','hosts':['ellenbarrie.com','www.ellenbarrie.com'],
          'pages':['https://ellenbarrie.com/investors/'],'originals':[]},
 'IKS':{'legal':'INVENTURUS KNOWLEDGE SOLUTIONS LIMITED','hosts':['ikshealth.com','www.ikshealth.com'],
        'pages':['https://ikshealth.com/investor-relations/'],'originals':[]},
 'JASH':{'legal':'JASH ENGINEERING LIMITED','hosts':['jashindia.com','www.jashindia.com'],
         'pages':['https://jashindia.com/investors/'],
         'originals':['https://jashindia.com/wp-content/uploads/2025/02/Outcome-JASH-Q2.pdf','https://jashindia.com/wp-content/uploads/2025/02/Outcome-JASH-Q3.pdf']},
 'IGL':{'legal':'INDRAPRASTHA GAS LIMITED','hosts':['www.iglonline.net','tenders.iglonline.net','nsearchives.nseindia.com'],
        'pages':['https://www.iglonline.net/financial'],
        'originals':['https://nsearchives.nseindia.com/corporate/IGL1_27012025192310_IntegratedUFR31122024.pdf']},
 'DDEVPLSTIK':{'legal':'DDEV PLASTIKS INDUSTRIES LIMITED','hosts':['www.ddevgroup.in','ddevgroup.in'],
              'pages':['https://www.ddevgroup.in/financial-reporting'],'originals':[]},
 'MANKIND':{'legal':'MANKIND PHARMA LIMITED','hosts':['www.mankindpharma.com','mankindpharma.com'],
            'pages':['https://www.mankindpharma.com/investors-relations/financials/'],'originals':[]},
 'LGEINDIA':{'legal':'LG ELECTRONICS INDIA LIMITED','hosts':['www.lg.com'],
             'pages':[], 'originals':['https://www.lg.com/content/dam/lge/in/migration/lginvestorrelations/IRPdf/2026/QR/LGEIL-Q3FY26-Financials.pdf']},
 'LENSKART':{'legal':'LENSKART SOLUTIONS LIMITED','hosts':['www.lenskart.com','static.lenskart.com'],
             'pages':['https://www.lenskart.com/corporate/investorrelations'],'originals':[]},
 'PINELABS':{'legal':'PINE LABS LIMITED','hosts':['www.pinelabs.com','pinelabs.com'],
             'pages':['https://www.pinelabs.com/investor-relations/corporate-announcements'],'originals':[]},
 'ICICIAMC':{'legal':'ICICI PRUDENTIAL ASSET MANAGEMENT COMPANY LIMITED','hosts':['www.icicipruamc.com'],
             'pages':['https://www.icicipruamc.com/investor-relations'],'originals':[]},
}

def approved_url(symbol,url):
    profile=ISSUERS.get(symbol)
    if profile is None:raise ValueError('OFFICIAL_ISSUER_NOT_CONFIGURED')
    u=urlparse(url)
    if (u.scheme!='https' or u.hostname not in profile['hosts'] or u.username or u.password
        or u.port not in (None,443) or u.fragment):raise ValueError('OFFICIAL_ISSUER_URL_UNAPPROVED')
    if u.hostname=='nsearchives.nseindia.com' and url not in profile['originals']:
        raise ValueError('UNLISTED_NSE_ISSUER_ORIGINAL')
    return profile

class Links(HTMLParser):
    def __init__(self):super().__init__();self.links=[];self.current=None
    def handle_starttag(self,tag,attrs):
        if tag=='a':self.current=[dict(attrs).get('href',''),'']
    def handle_data(self,data):
        if self.current:self.current[1]+=data+' '
    def handle_endtag(self,tag):
        if tag=='a' and self.current:self.links.append(tuple(self.current));self.current=None

def get(session,symbol,url,limit):
    # Validate every redirect before issuing its request; do not follow an
    # issuer page into a provider, external object host or unrelated document.
    for _ in range(5):
        approved_url(symbol,url)
        with session.get(url,timeout=(15,45),allow_redirects=False,stream=True) as response:
            if response.status_code in (301,302,303,307,308):
                url=urljoin(url,response.headers['Location']);continue
            response.raise_for_status();parts=[];size=0
            for part in response.iter_content(65536):
                size+=len(part)
                if size>limit:raise ValueError('OFFICIAL_RESPONSE_SIZE_BOUND')
                parts.append(part)
            return b''.join(parts),url
    raise ValueError('OFFICIAL_REDIRECT_BOUND')

def discover(session,symbol):
    profile=ISSUERS[symbol];urls={u:100 for u in profile['originals']};errors=Counter()
    for page in profile['pages']:
        try:
            raw,origin=get(session,symbol,page,4_000_000);text=raw.decode('utf-8',errors='replace')
            parser=Links();parser.feed(text)
            links=parser.links+[(u,'') for u in re.findall(r'https?[^\s"<>]+?\.pdf(?:\?[^\s"<>]*)?',html.unescape(text).replace('\\/','/'),re.I)]
            for target,label in links:
                url=urljoin(origin,html.unescape(target)).split('#')[0];u=urlparse(url)
                if not u.path.lower().endswith('.pdf'):continue
                try:approved_url(symbol,url)
                except ValueError:
                    errors['UNAPPROVED_DISCOVERY_LINK_SKIPPED']+=1
                    continue
                hint=(url+' '+label).lower()
                if re.search(r'presentation|transcript|annual.report|press.release|newspaper|policy|governance|shareholding|credit.rating',hint):continue
                if not re.search(r'financial|result|outcome|quarter|q[1-4]|qr/|ufr',hint):continue
                score=10*bool(re.search(r'2024|2025|fy25|fy26|2024.25|2025.26',hint))+3*bool(re.search(r'financial|result|outcome',hint))
                urls[url]=max(score,urls.get(url,0))
        except Exception as error:errors['DISCOVERY_'+type(error).__name__]+=1
    return sorted(urls,key=lambda u:(-urls[u],u))[:20],errors


def extract_original(raw,symbol,period,method=None,page_no=None,render_pair=None,segmentation_mode=None,document_audit=None):
    """Replays explicit dated cells, with document-wide business-basis checks."""
    profile=ISSUERS[symbol]
    if period not in PERIODS or not raw.startswith(b'%PDF'):raise ValueError('OFFICIAL_QUARTER_OR_PDF_UNPROVEN')
    bank=False;insurer=symbol=='STARHEALTH';candidates=[]
    with fitz.open(stream=raw,filetype='pdf') as pdf:
        if not 1<=len(pdf)<=40:raise ValueError('OFFICIAL_DOCUMENT_PAGE_BOUND')
        texts=[p.get_text('text') for p in pdf]
        native=' '.join(texts)
        if not exact_legal_identity(profile['legal'],' '.join(texts[:3])):
            raise ValueError('OFFICIAL_COMPLETE_ISSUER_IDENTITY_UNPROVEN')
        # Always scan the complete retained original independently at 150 DPI.
        # Notes and demerger warnings can be image-backed even in a native table.
        from r4_ocr_dated_geometry import audit_document,extract_dated_page
        audit=document_audit if document_audit is not None else audit_document(raw)
        if audit['original_sha256']!=sha(raw):raise ValueError('OFFICIAL_DOCUMENT_AUDIT_ORIGINAL_MISMATCH')
        text=native+' '+' '.join(audit['pages'])
        if re.search(r'\b(?:pro[ -]?forma|carve[ -]?out)\b',text,re.I):
            raise ValueError('OFFICIAL_PROFORMA_OR_CARVEOUT_REVIEW_REQUIRED')
        restated=bool(re.search(r'\b(?:restated|recast)\b',text,re.I))
        pages=[page_no] if page_no else range(1,len(pdf)+1)
        for n in pages:
            if not 1<=n<=len(pdf):raise ValueError('OFFICIAL_FINANCIAL_PAGE_UNPROVEN')
            try:
                if method=='OCR':
                    parsed,checks=extract_dated_page(raw,n,period,bank,insurer,tuple(render_pair),segmentation_mode)
                    if not all(exact_legal_identity(profile['legal'],checks[k]) for k in ('issuer_text_first','issuer_text_second')):
                        raise ValueError('OFFICIAL_RENDERED_ISSUER_IDENTITY_UNPROVEN')
                else:
                    if not exact_legal_identity(profile['legal'],texts[n-1]):continue
                    parsed=extract_page(pdf[n-1],n,period,bank,insurer,allow_comparative=True)
                if restated and parsed['first_column_period']!=period:continue
                candidates.append(parsed)
            except ValueError:continue
        if not candidates:raise ValueError('OFFICIAL_EXPLICIT_QUARTER_TRIO_UNPROVEN')
        # One scope may have multiple identical renderings; differing core facts
        # in the same original scope require review instead of a first-row pick.
        groups={}
        for item in candidates:groups.setdefault(item['scope'],[]).append(item)
        out=[]
        for scope,items in groups.items():
            vectors={tuple(sorted((k,Decimal(v['value']),v['unit']) for k,v in x['facts'].items())) for x in items}
            if len(vectors)!=1:raise ValueError('OFFICIAL_CONFLICTING_SAME_SCOPE_TABLES')
            parsed=sorted(items,key=lambda x:x['page'])[0]
            out.append({**parsed,'document_audit_text_sha256':audit['text_sha256'],
                'method':method or 'NATIVE','source_reporting_basis':'AS_FILED_OWN_QUARTER' if parsed['first_column_period']==period else 'LATER_FILING_REPORTED_COMPARATIVE'})
        return out

def qualify(raw,source,observations):
    payload=source['raw_payload'];symbol=payload.get('symbol');approved_url(symbol,source['source_url'])
    if (payload.get('contract')!=CONTRACT or payload.get('sourceUrl')!=source['source_url']
        or sha(canonical(payload))!=source['payload_hash']):raise ValueError('OFFICIAL_SOURCE_PAYLOAD_UNPROVEN')
    digest=payload.get('original_sha256')
    if not re.fullmatch(r'[0-9a-f]{64}',str(digest)) or sha(raw)!=digest:raise ValueError('OFFICIAL_ORIGINAL_HASH_MISMATCH')
    if payload.get('original_r2_key')!=PREFIX+'evidence/original_version='+digest+'/issuer-original.pdf':
        raise ValueError('OFFICIAL_ORIGINAL_REFERENCE_UNPROVEN')
    period=payload['period_end'];recorded=payload['parsed']
    options=extract_original(raw,symbol,period,recorded['method'],recorded['page'],recorded.get('ocr_render_dpi'),recorded.get('ocr_segmentation_mode'))
    matching=[x for x in options if x['scope']==recorded['scope']]
    if len(matching)!=1 or matching[0]!=recorded:raise ValueError('OFFICIAL_ORIGINAL_REPLAY_CHANGED')
    facts=recorded['facts'];required={'NET_PREMIUM_EARNED_QUARTER' if symbol=='STARHEALTH' else 'OPERATING_REVENUE_QUARTER','NET_PROFIT_QUARTER','EPS_DILUTED'}
    if set(facts)!=required or len(observations)!=3:raise ValueError('OFFICIAL_COMPLETE_CORE_TRIO_REQUIRED')
    if {r['metric_code'] for r in observations}!=required:raise ValueError('OFFICIAL_CORE_METRICS_UNPROVEN')
    for row in observations:
        if (row['symbol']!=symbol or row['isin']!=payload['isin'] or str(row['source_record_id'])!=str(source['source_record_id'])
            or str(row['period_end'])!=period or str(row['period_start'])!=PERIODS[period]
            or row['consolidation_scope']!=recorded['scope'] or row['currency']!='INR'
            or row['source_code']!='COMPANY_EXCHANGE_FILING' or row['evidence_status']!='AVAILABLE'
            or row['unit']!=facts[row['metric_code']]['unit']
            or Decimal(str(row['numeric_value']))!=Decimal(facts[row['metric_code']]['value'])):
            raise ValueError('OFFICIAL_OBSERVATION_CONTEXT_OR_VALUE_MISMATCH')
    return {'contract':'RESULTS_R4_SHARED_ISSUER_ORIGINAL_REPLAY_V1','eligible_observation_ids':sorted(str(r['id']) for r in observations)}
