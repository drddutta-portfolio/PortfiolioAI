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
from r4_issuer_name import exact_legal_identity,words as issuer_name_words,BSE_DISPLAY_ALIASES,bse_display_alias_matches
from r4_pdf_geometry import extract_page

CONTRACT='RESULTS_R4_OFFICIAL_ISSUER_DATED_ORIGINAL_V1'
KIND='RESULTS_R4_OFFICIAL_ISSUER_DATED_ORIGINAL_V1'
CURRENT_DISPLAY_POLICY='ISSUER_RESTATED_CURRENT_DISPLAY_20261104_V1'
PREFIX='portfolioai-results/development/v1/quarterly/'
BUCKET='portfolioai-history-dev'
PERIODS={'2024-09-30':'2024-07-01','2024-12-31':'2024-10-01','2025-03-31':'2025-01-01','2025-06-30':'2025-04-01'}
SPLIT_AUTHORITIES={'COFORGE':{'url':'https://www.msei.in/SX-Content/Circulars/2025/June/Circular-17281.pdf',
    'old_isin':'INE591G01017','current_isin':'INE591G01025','ex_date':'2025-06-04',
    'circular':'MSE/LIST/17281/2025','date_text':'JUNE 04, 2025',
    'row':'COFORGE COFORGE LIMITED INE591G01017 INE591G01025 SUB-DIVISION FROM RS. 10/- TO RS. 2/-'}}

def canonical(value):return json.dumps(value,sort_keys=True,separators=(',',':')).encode()
def sha(raw):return hashlib.sha256(raw).hexdigest()

def resume_issuer_order(items,last_symbol):
    """A resumed shard gives the issuer after its last checkpoint first turn."""
    ordered=list(items)
    positions=[i for i,row in enumerate(ordered) if row[0]==last_symbol]
    if len(positions)!=1:return ordered
    start=positions[0]+1
    return ordered[start:]+ordered[:start]

# Closed official discovery pages, never arbitrary provider-returned hosts.
# More issuer pages may be added after checking the issuer's own disclosures.
ISSUERS={
 'UTLSOLAR':{'legal':'FUJIYAMA POWER SYSTEMS LIMITED','hosts':['www.utlsolarfujiyama.com','utlsolarfujiyama.com'],
             'pages':['https://www.utlsolarfujiyama.com/investor-relations/','https://www.utlsolarfujiyama.com/investor-relations/financials/'],
             'originals':['https://www.utlsolarfujiyama.com/wp-content/uploads/Investor%20Relations/financials/Financial%20Results_Q2.pdf']},
 'GROWW':{'legal':'BILLIONBRAINS GARAGE VENTURES LIMITED','hosts':['groww.in','resources.groww.in'],
          'pages':['https://groww.in/investor-relations/performance/quarterly-results','https://groww.in/investor-relations/announcements'],
          'originals':['https://resources.groww.in/web-assets/media-library/2025/11/Q2%20FY26%20Financial%20Results.pdf','https://resources.groww.in/web-assets/media-library/2026/4/Q4%20FY26%20Financial%20Results.pdf']},
 'HEXT':{'legal':'HEXAWARE TECHNOLOGIES LIMITED','hosts':['hexaware.com','www.hexaware.com','cdn.hexaware.com','www.bseindia.com'],
         'pages':['https://hexaware.com/investors/quarterly-results/','https://hexaware.com/financials-reports/'],
         'originals':['https://www.bseindia.com/xml-data/corpfiling/AttachHis/2e5e187a-25a8-422a-98f9-ec55074852dd.pdf',
                      'https://www.bseindia.com/xml-data/corpfiling/AttachHis/2c4df461-9b0f-426d-8f60-d257761facd0.pdf']},
 'SANSERA':{'legal':'SANSERA ENGINEERING LIMITED','hosts':['sansera.in','www.sansera.in'],
            'verified_originals':['https://sansera.in/wp-content/uploads/2025/08/Outcome-of-Board-meeting-with-results-of-Q1FY26-and-AGM-date.pdf'],
            'pages':['https://sansera.in/financial_reports','https://sansera.in/all_years/2024-2025','https://sansera.in/all_quarters/q4'],
            'originals':['https://sansera.in/wp-content/uploads/2026/05/Outcome-of-Board-meeting-Q4FY26.pdf',
                         'https://sansera.in/wp-content/uploads/2025/08/Outcome-of-Board-meeting-with-results-of-Q1FY26-and-AGM-date.pdf',
                         'https://sansera.in/wp-content/uploads/2025/05/Outcome-of-Board-meeting-Q4FY25.pdf','https://sansera.in/wp-content/uploads/2024/11/Outcome-of-Board-Meeting-Q2FY25.pdf']},
 'SYRMA':{'legal':'SYRMA SGS TECHNOLOGY LIMITED','hosts':['syrmasgs.com','www.syrmasgs.com'],
          'pages':['https://www.syrmasgs.com/investor-relations/43-2/','https://syrmasgs.com/financial-information/'],
          'originals':['https://www.syrmasgs.com/investor-relations/wp-content/uploads/2025/05/Financial-Results.pdf']},
 'SSWL':{'legal':'STEEL STRIPS WHEELS LIMITED','hosts':['sswlindia.com','www.sswlindia.com','sswlindia.in','www.sswlindia.in'],
         'verified_originals':['https://sswlindia.com/investor-docs/FR_SSWL_30_09_2024.pdf'],
         'pages':['https://sswlindia.com/investors/quarterly-annual-financial-results'],
         'originals':['https://sswlindia.com/investor-docs/FR_SSWL_30_09_2024.pdf',
                      'https://sswlindia.com/investor-docs/FR_SSWL_30_09_2025.pdf']},
 'STARHEALTH':{'legal':'STAR HEALTH AND ALLIED INSURANCE COMPANY LIMITED','hosts':['www.starhealth.in','starhealth.in','nsearchives.nseindia.com','www.bseindia.com'],
               'pages':['https://www.starhealth.in/investors/disclosures/'],
               'originals':['https://nsearchives.nseindia.com/corporate/BoardMeetingoutcome29102024_29102024183837.pdf',
                            'https://www.bseindia.com/xml-data/corpfiling/AttachHis/38b751f3-1e7e-412c-9680-a3b80d0fcb27.pdf']},
 'TATACAP':{'legal':'TATA CAPITAL LIMITED','hosts':['www.tatacapital.com','tatacapital.com','nsearchives.nseindia.com'],
            'pages':['https://www.tatacapital.com/about-us/investor-information-and-financials.html'],
            'verified_originals':['https://nsearchives.nseindia.com/corporate/TATACAPITAL_19012026163254_TCLFinancialsLODRsigned.pdf',
                                  'https://nsearchives.nseindia.com/corporate/TATACAPITAL_23042026165109_FinancialsMarch2026signed.pdf'],
            'originals':['https://nsearchives.nseindia.com/corporate/TATACAPITAL_19012026163254_TCLFinancialsLODRsigned.pdf',
                         'https://nsearchives.nseindia.com/corporate/TATACAPITAL_23042026165109_FinancialsMarch2026signed.pdf',
                         'https://www.tatacapital.com/content/dam/tata-capital/pdf/investors-and-financial-reports/stock-exchange/stock-exchange-intimation-financial-results-submission-december-11-2025.pdf',
                         'https://www.tatacapital.com/content/dam/tata-capital/pdf/investors-and-financial-reports/financials/tcl/TCLFinancialsLODRsigned.pdf',
                         'https://www.tatacapital.com/content/dam/tata-capital/pdf/investors-and-financial-reports/stock-exchange/results-sep-2024-2-signed.pdf',
                         'https://www.tatacapital.com/content/dam/tata-capital/pdf/investors-and-financial-reports/stock-exchange/tcl-outcome-of-board-meeting-06-02-2025-signed.pdf',
                         'https://www.tatacapital.com/content/dam/tata-capital/pdf/investors-and-financial-reports/stock-exchange/financials-march-2025-signed.pdf',
                         'https://www.tatacapital.com/content/dam/tata-capital/pdf/investors-and-financial-reports/stock-exchange/audited-standalone-and-consolidated-financial-results-for-the-quarter-ended-june-30-2025.pdf']},
 'VENTIVE':{'legal':'VENTIVE HOSPITALITY LIMITED','hosts':['www.ventivehospitality.com','ventivehospitality.com'],
            'pages':['https://www.ventivehospitality.com/financial-results/','https://www.ventivehospitality.com/investor-relations/'],
            'originals':['https://www.ventivehospitality.com/wp-content/uploads/2024/07/Board-Meeting-outcome-13.11.2025.pdf']},
 # Post-demerger names are intentionally exact: the predecessor group's
 # financials cannot automatically become the successor entity's history.
 'TMCV':{'legal':'TATA MOTORS LIMITED','cin':'L29102MH2024PLC427506','hosts':['cv.tatamotors.com','nsearchives.nseindia.com','www.bseindia.com'],
         'pages':['https://cv.tatamotors.com/investors'],
         'verified_originals':['https://www.bseindia.com/xml-data/corpfiling/AttachHis/fae994f5-307f-42b1-af81-ca9d9484b361.pdf',
                               'https://nsearchives.nseindia.com/corporate/TMLCOMMERCIAL_13052026161728_Final.pdf',
                               'https://nsearchives.nseindia.com/corporate/TMLCOMMERCIAL_12082026154213_Final.pdf'],
         'originals':['https://www.bseindia.com/xml-data/corpfiling/AttachHis/fae994f5-307f-42b1-af81-ca9d9484b361.pdf',
                      'https://nsearchives.nseindia.com/corporate/TMLCOMMERCIAL_13112025171536_NSEBSELETTERFINAL.pdf',
                      'https://nsearchives.nseindia.com/corporate/TMLCOMMERCIAL_13052026161728_Final.pdf',
                      'https://nsearchives.nseindia.com/corporate/TMLCOMMERCIAL_12082026154213_Final.pdf',
                      'https://nsearchives.nseindia.com/corporate/TMLCOMMERCIAL_29012026162752_NSEBSELETTERFINAL.pdf',
                      'https://cv.tatamotors.com/assets/cv/files/2026-01/TML%20conso%20final%20results_Dec%202025.pdf']},
 'TMPV':{'legal':'TATA MOTORS PASSENGER VEHICLES LIMITED','cin':'L28920MH1945PLC004520','hosts':['www.tatamotors.com','tatamotors.com'],
         'pages':['https://www.tatamotors.com/investors/'],'originals':[]},
 'VAML':{'legal':'VEDANTA ALUMINIUM METAL LIMITED','hosts':['vedantaaluminium.com','www.vedantaaluminium.com','d1rbiogke1jwo5.cloudfront.net'],
         'pages':['https://vedantaaluminium.com/investors/results-and-reports/'],
         'originals':['https://d1rbiogke1jwo5.cloudfront.net/wp-content/uploads/2026/07/Consolidated-Financials.pdf','https://d1rbiogke1jwo5.cloudfront.net/wp-content/uploads/2026/10/Consolidated-Financials.pdf']},
 'AWHCL':{'legal':'ANTONY WASTE HANDLING CELL LIMITED','hosts':['www.antony-waste.com','antony-waste.com'],
          'pages':['https://www.antony-waste.com/investors/financial/','https://www.antony-waste.com/investors/financial/quarterly-financial-report/'],
          'originals':['https://www.antony-waste.com/docs/investors/financial_reports/FinancialResults/2024_25/AWHCLFRQ4%26FY25.pdf']},
 'BLUSPRING':{'legal':'BLUSPRING ENTERPRISES LIMITED','hosts':['www.bluspring.com','bluspring.com'],
              'pages':['https://www.bluspring.com/for-investors/'],'originals':[]},
 'COFORGE':{'legal':'COFORGE LIMITED','hosts':['investors.coforge.com','www.coforge.com'],
            'pages':['https://investors.coforge.com/quarter-reports'],
            'originals':['https://investors.coforge.com/hubfs/Result-Q4FY2025.pdf?hsLang=en']},
 'CPPLUS':{'legal':'ADITYA INFOTECH LIMITED','hosts':['www.adityagroup.com','adityagroup.com'],
           'pages':['https://www.adityagroup.com/financial-results','https://www.adityagroup.com/stock-exchange-submissions'],
           'originals':['https://www.adityagroup.com/assets_web/images/result_and_reports/financial_results/Financial_Results_as_on_September_30_2025.pdf',
                        'https://www.adityagroup.com/assets_web/images/stock_exchange_submissions/Board_Meeting_Outcome_February_12_2026.pdf',
                        'https://www.adityagroup.com/assets_web/images/result_and_reports/financial_results/Financial_Results_for_quarter_and_financial_year_ended_March_31_2026.pdf']},
 'EBGNG':{'legal':'GNG ELECTRONICS LIMITED','hosts':['www.electronicsbazaar.com','electronicsbazaar.com','nsearchives.nseindia.com'],
          'verified_originals':['https://nsearchives.nseindia.com/corporate/GNGNSE_27112025105923_Intimation_of_Financial_Results_Q2FY26_in_machine_readble_form.pdf'],
          'pages':['https://www.electronicsbazaar.com/investor'],
          'originals':['https://www.electronicsbazaar.com/media/investor/j/BM_Outcome.pdf',
                       'https://nsearchives.nseindia.com/corporate/GNGNSE_27112025105923_Intimation_of_Financial_Results_Q2FY26_in_machine_readble_form.pdf',
                       'https://nsearchives.nseindia.com/corporate/GNGNSE_05052026160027_BM_Outcome_Final.pdf']},
 'IKS':{'legal':'INVENTURUS KNOWLEDGE SOLUTIONS LIMITED','hosts':['ikshealth.com','www.ikshealth.com'],
        'pages':['https://ikshealth.com/investor-relations/'],'originals':[]},
 'JASH':{'legal':'JASH ENGINEERING LIMITED','hosts':['jashindia.com','www.jashindia.com'],
         'pages':['https://jashindia.com/investors/'],
         'originals':['https://jashindia.com/wp-content/uploads/2025/02/Outcome-JASH-Q2.pdf','https://jashindia.com/wp-content/uploads/2025/02/Outcome-JASH-Q3.pdf']},
 'IGL':{'legal':'INDRAPRASTHA GAS LIMITED','hosts':['www.iglonline.net','tenders.iglonline.net','nsearchives.nseindia.com'],
        'pages':['https://www.iglonline.net/financial'],
        'originals':['https://nsearchives.nseindia.com/corporate/IGL1_27012025192310_IntegratedUFR31122024.pdf']},
 'DDEVPLSTIK':{'legal':'DDEV PLASTIKS INDUSTRIES LIMITED','hosts':['www.ddevgroup.in','ddevgroup.in'],
              'pages':['https://www.ddevgroup.in/financial-reporting'],
              'originals':['https://www.ddevgroup.in/public/assets/pdf/Investor/Financial-Reporting/Quarterly-Results/Results/Q2-FY-2024-25.pdf',
                           'https://www.ddevgroup.in/assets/pdf/Investor/Financial-Reporting/Quarterly-Results/Results/Q2-FY-2024-25.pdf']},
 'MANKIND':{'legal':'MANKIND PHARMA LIMITED','hosts':['www.mankindpharma.com','mankindpharma.com'],
            'pages':['https://www.mankindpharma.com/investors-relations/financials/'],'originals':[]},
 'LGEINDIA':{'legal':'LG ELECTRONICS INDIA LIMITED','hosts':['www.lg.com'],
             'pages':[], 'originals':['https://www.lg.com/content/dam/lge/in/migration/lginvestorrelations/IRPdf/2026/QR/LGEIL-Q3FY26-Financials.pdf']},
 'LENSKART':{'legal':'LENSKART SOLUTIONS LIMITED','hosts':['www.lenskart.com','static.lenskart.com','assets.lenskart.com'],
             'pages':['https://www.lenskart.com/corporate/investorrelations'],
             'originals':['https://assets.lenskart.com/documents/2026/02/11/Reg30-SEIntimation.pdf']},
 'PINELABS':{'legal':'PINE LABS LIMITED','hosts':['www.pinelabs.com','pinelabs.com','plcorp-cdn.pinelabs.com'],
             'pages':['https://www.pinelabs.com/investor-relations/corporate-announcements'],'originals':[]},
 'ICICIAMC':{'legal':'ICICI PRUDENTIAL ASSET MANAGEMENT COMPANY LIMITED','hosts':['www.icicipruamc.com'],
             'pages':['https://www.icicipruamc.com/blob/investor-relations/Disclosures.html'],
             'originals':['https://www.icicipruamc.com/blob/investor-relations/IR_Documents/Outcome%20of%20Board%20Meeting%20held%20on%20January%2014,%202026.pdf',
                          'https://www.icicipruamc.com/blob/investor-relations/IR_Documents/Unaudited_financial_results_for_the_quarter_ended_June_30_2026.pdf']},
}

def approved_url(symbol,url):
    profile=ISSUERS.get(symbol)
    if profile is None:raise ValueError('OFFICIAL_ISSUER_NOT_CONFIGURED')
    u=urlparse(url)
    if (u.scheme!='https' or u.hostname not in profile['hosts'] or u.username or u.password
        or u.port not in (None,443) or u.fragment):raise ValueError('OFFICIAL_ISSUER_URL_UNAPPROVED')
    if u.hostname=='nsearchives.nseindia.com' and url not in profile['originals']:
        raise ValueError('UNLISTED_NSE_ISSUER_ORIGINAL')
    if u.hostname=='www.bseindia.com':
        if (not re.fullmatch(r'/xml-data/corpfiling/(?:AttachHis|AttachLive)/[0-9a-f-]{36}\.pdf',u.path,re.I)
            or u.query or not any(urlparse(seed).path.rsplit('/',1)[-1]==u.path.rsplit('/',1)[-1] for seed in profile['originals'])):
            raise ValueError('UNLISTED_BSE_ISSUER_ORIGINAL')
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

def statutory_annexure_pages(symbol,texts,audit_pages,basis_policy):
    """Closed Lenskart filing format: statutory Annexure I, proforma Annexure II.

    Both native text and full-original OCR must independently locate the same
    standalone Annexure II divider. No proforma/carveout page enters the scope.
    """
    if basis_policy!=CURRENT_DISPLAY_POLICY or symbol!='LENSKART':
        raise ValueError('OFFICIAL_PROFORMA_OR_CARVEOUT_REVIEW_REQUIRED')
    cover=texts[0]
    if re.search(r'\bcarve[ -]?out\b',cover,re.I):
        raise ValueError('OFFICIAL_PROFORMA_OR_CARVEOUT_REVIEW_REQUIRED')
    if not (re.search(r'financial\s+results.*?enclosed\s+as\s+Annexure\s*[-–]?\s*I\b',cover,re.I|re.S)
        and re.search(r'proforma\s+financial\s+information.*?enclosed\s+as\s+Annexure\s*[-–]?\s*II\b',cover,re.I|re.S)):
        raise ValueError('OFFICIAL_STATUTORY_ANNEXURE_COVER_UNPROVEN')
    def dividers(pages):
        return [i for i,t in enumerate(pages) if i>0 and re.match(
            r'^\s*Annexure\s*[-–]?\s*II\b\s*Statement\s+of\s+Proforma\s+Financial\s+Information',t,re.I)]
    native=dividers(texts);rendered=dividers(audit_pages)
    if len(native)!=1 or native!=rendered or native[0]<2:
        raise ValueError('OFFICIAL_STATUTORY_ANNEXURE_BOUNDARY_UNPROVEN')
    boundary=native[0];section=' '.join(texts[1:boundary]+audit_pages[1:boundary])
    if (not exact_legal_identity(ISSUERS[symbol]['legal'],section)
        or not re.search(r'independent\s+auditor',section,re.I)
        or re.search(r'\b(?:pro[ -]?forma|carve[ -]?out)\b',section,re.I)):
        raise ValueError('OFFICIAL_STATUTORY_ANNEXURE_CONTENT_UNPROVEN')
    return set(range(2,boundary+1)),section


def extract_statutory_continuation(pdf,symbol,period,start,allowed_pages=None,page_views=None):
    """Two adjacent issuer pages must each independently prove their columns."""
    if symbol!='TATACAP' or not 1<=start<len(pdf):
        raise ValueError('OFFICIAL_CONTINUATION_NOT_APPROVED')
    parts=[]
    for n,metrics in ((start,('OPERATING_REVENUE_QUARTER','NET_PROFIT_QUARTER')),
                      (start+1,('EPS_DILUTED',))):
        if allowed_pages is not None and n not in allowed_pages:
            raise ValueError('OFFICIAL_CONTINUATION_OUTSIDE_STATUTORY_SECTION')
        page=page_views[n] if page_views is not None else pdf[n-1]
        if not exact_legal_identity(ISSUERS[symbol]['legal'],page.get_text('text')):
            raise ValueError('OFFICIAL_CONTINUATION_ISSUER_UNPROVEN')
        parts.append(extract_page(page,n,period,allow_comparative=True,required_metrics=metrics))
    first,second=parts
    for field in ('scope','unit','first_column_period','header_periods','column_index','selected_column_period'):
        if first.get(field)!=second.get(field) or first.get(field) is None:
            raise ValueError('OFFICIAL_CONTINUATION_HEADER_MISMATCH')
    return {**first,'facts':{**first['facts'],**second['facts']},
        'continuation_pages':[start,start+1],
        'continuation_header_evidence':second['header_evidence'],
        'parser_revision':'PDF_ADJACENT_EXPLICIT_HEADER_CONTINUATION_V1'}


def extract_ocr_statutory_continuation(pdf,symbol,period,start,pair,segmentation_mode,allowed_pages=None):
    from r4_ocr_dated_geometry import RENDER_PAIRS,render_page,validate_page_layout
    from r4_ocr_geometry import agree
    pair=tuple(pair)
    if pair not in RENDER_PAIRS or segmentation_mode not in (3,6,11):
        raise ValueError('OFFICIAL_CONTINUATION_RENDER_UNAPPROVED')
    if symbol!='TATACAP' or not 1<=start<len(pdf):
        raise ValueError('OFFICIAL_CONTINUATION_NOT_APPROVED')
    proofs=[]
    for dpi in pair:
        views={}
        for n in (start,start+1):
            validate_page_layout(pdf[n-1]);views[n]=render_page(pdf[n-1],dpi,segmentation_mode)
        proofs.append(extract_statutory_continuation(pdf,symbol,period,start,allowed_pages,views))
    first,second=proofs
    if any(first[k]!=second[k] for k in ('header_periods','first_column_period','column_index','selected_column_period')):
        raise ValueError('OFFICIAL_CONTINUATION_RENDER_HEADER_MISMATCH')
    agree(first,second) # Complete trio AND independent PBT-minus-tax reconciliation.
    for fact in first['facts'].values():
        fact['extraction_method']='OCR_DOUBLE_RENDER_ADJACENT_STATUTORY_TABLE_V1'
    first.update(ocr_render_dpi=list(pair),ocr_segmentation_mode=segmentation_mode,
        parser_revision='PDF_OCR_ADJACENT_EXPLICIT_HEADER_CONTINUATION_V1')
    return first


def extract_original(raw,symbol,period,method=None,page_no=None,render_pair=None,segmentation_mode=None,document_audit=None,basis_policy=None):
    """Replays explicit dated cells, with document-wide business-basis checks."""
    profile=ISSUERS[symbol]
    historical_cin=historical_cin_original(symbol,method,sha(raw))
    if basis_policy not in (None,CURRENT_DISPLAY_POLICY):raise ValueError('OFFICIAL_REPORTING_BASIS_POLICY_UNAPPROVED')
    if period not in PERIODS or not raw.startswith(b'%PDF'):raise ValueError('OFFICIAL_QUARTER_OR_PDF_UNPROVEN')
    bank=False;insurer=symbol=='STARHEALTH';candidates=[]
    with fitz.open(stream=raw,filetype='pdf') as pdf:
        if not 1<=len(pdf)<=120:raise ValueError('OFFICIAL_DOCUMENT_PAGE_BOUND')
        texts=[p.get_text('text') for p in pdf]
        native=' '.join(texts)
        # Always scan the complete retained original independently at 150 DPI.
        # Notes and demerger warnings can be image-backed even in a native table.
        from r4_ocr_dated_geometry import audit_document,extract_dated_page
        audit=document_audit if document_audit is not None else audit_document(raw,max_pages=120)
        if audit['original_sha256']!=sha(raw):raise ValueError('OFFICIAL_DOCUMENT_AUDIT_ORIGINAL_MISMATCH')
        if (not exact_legal_identity(profile['legal'],' '.join(texts[:3]))
            and not exact_legal_identity(profile['legal'],' '.join(audit['pages'][:3]))):
            raise ValueError('OFFICIAL_COMPLETE_ISSUER_IDENTITY_UNPROVEN')
        text=native+' '+' '.join(audit['pages'])
        section_pages=None
        if re.search(r'\b(?:pro[ -]?forma|carve[ -]?out)\b',text,re.I):
            section_pages,text=statutory_annexure_pages(symbol,texts,audit['pages'],basis_policy)
        restated=bool(re.search(r'\b(?:restated|recast)\b',text,re.I)
            or (re.search(r'retrospective',text,re.I) and re.search(r'share\s+split|split\s+and\s+bonus|bonus\s+shares',text,re.I))
            or (re.search(r'regrouped|reclassifi',text,re.I) and re.search(r'from\s+["“]?Revenue\s+from\s+Operations["”]?\s+to\s+["“]?Other\s+Income',text,re.I)))
        reorganized=bool(re.search(r'\b(?:demerger|demerged|common[ -]control)\b',text,re.I))
        pages=[page_no] if page_no else range(1,len(pdf)+1)
        for n in pages:
            if not 1<=n<=len(pdf):raise ValueError('OFFICIAL_FINANCIAL_PAGE_UNPROVEN')
            if section_pages is not None and n not in section_pages:continue
            try:
                if method in ('OCR','OCR_HEADER_REGION','OCR_REGIONS','OCR_STATEMENT_LAYOUT','OCR_STATEMENT_LAYOUT_V5'):
                    if method=='OCR_STATEMENT_LAYOUT_V5':
                        parsed,checks=extract_dated_page(raw,n,period,bank,insurer,tuple(render_pair),segmentation_mode,header_region=True,label_region=True,statement_layout=True,advanced_statement_layout=True)
                    elif method=='OCR_STATEMENT_LAYOUT':
                        parsed,checks=extract_dated_page(raw,n,period,bank,insurer,tuple(render_pair),segmentation_mode,header_region=True,label_region=True,statement_layout=True)
                    elif method=='OCR_REGIONS':
                        parsed,checks=extract_dated_page(raw,n,period,bank,insurer,tuple(render_pair),segmentation_mode,header_region=True,label_region=True)
                    elif method=='OCR_HEADER_REGION':
                        parsed,checks=extract_dated_page(raw,n,period,bank,insurer,tuple(render_pair),segmentation_mode,header_region=True)
                    else:parsed,checks=extract_dated_page(raw,n,period,bank,insurer,tuple(render_pair),segmentation_mode)
                    if not all(exact_legal_identity(profile['legal'],checks[k]) for k in ('issuer_text_first','issuer_text_second')):
                        raise ValueError('OFFICIAL_RENDERED_ISSUER_IDENTITY_UNPROVEN')
                    if profile.get('cin') and not all(exact_cin(profile['cin'],checks[k]) for k in ('issuer_text_first','issuer_text_second')):
                        raise ValueError('OFFICIAL_RENDERED_LEGAL_ENTITY_CIN_UNPROVEN')
                elif method=='OCR_CONTINUATION':
                    if basis_policy!=CURRENT_DISPLAY_POLICY:continue
                    parsed=extract_ocr_statutory_continuation(pdf,symbol,period,n,render_pair,segmentation_mode,section_pages)
                elif method=='NATIVE_CONTINUATION':
                    if basis_policy!=CURRENT_DISPLAY_POLICY:continue
                    parsed=extract_statutory_continuation(pdf,symbol,period,n,section_pages)
                else:
                    if not exact_legal_identity(profile['legal'],texts[n-1]):continue
                    if profile.get('cin') and not (exact_cin(profile['cin'],texts[n-1])
                        or historical_cin and exact_cin('U29102MH2024PLC427506',texts[n-1])):continue
                    try:
                        options={'statement_layout':True} if method in ('NATIVE_STATEMENT_LAYOUT','NATIVE_STATEMENT_LAYOUT_V5','NATIVE_FOOTNOTED_HEADERS_V6','NATIVE_INITIAL_ISSUER_LAYOUT_V7') else {}
                        if method in ('NATIVE_STATEMENT_LAYOUT_V5','NATIVE_FOOTNOTED_HEADERS_V6','NATIVE_INITIAL_ISSUER_LAYOUT_V7'):options['advanced_statement_layout']=True
                        if method in ('NATIVE_FOOTNOTED_HEADERS_V6','NATIVE_INITIAL_ISSUER_LAYOUT_V7'):options['footnoted_quarter_headers']=True
                        if method=='NATIVE_INITIAL_ISSUER_LAYOUT_V7':options['initial_issuer_layout']=True
                        parsed=extract_page(pdf[n-1],n,period,bank,insurer,allow_comparative=True,**options)
                    except ValueError:
                        if basis_policy!=CURRENT_DISPLAY_POLICY or symbol!='TATACAP':raise
                        parsed=extract_statutory_continuation(pdf,symbol,period,n,section_pages)
                if restated and parsed['first_column_period']!=period and basis_policy is None:continue
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
            result={**parsed,'document_audit_text_sha256':audit['text_sha256'],
                'method':('OCR_CONTINUATION' if parsed.get('ocr_render_dpi') else 'NATIVE_CONTINUATION') if parsed.get('continuation_pages') else method or 'NATIVE','source_reporting_basis':'AS_FILED_OWN_QUARTER' if parsed['first_column_period']==period else 'LATER_FILING_REPORTED_COMPARATIVE'}
            if historical_cin:
                result['historical_cin_authority']={'contract':'EXACT_ORIGINAL_AND_BSE_ISSUER_BOUND_CIN_LISTING_STATUS_V1',
                    'canonical_cin':profile['cin'],'original_cin':'U29102MH2024PLC427506',
                    'original_sha256':sha(raw),'bse_inventory_binding_required':True}
            if basis_policy is not None:
                result.update(basis_policy=basis_policy,comparison_basis_unproven=restated or reorganized)
                if section_pages is not None:
                    result.update(statutory_section_pages=sorted(section_pages),comparison_basis_unproven=True)
                if (restated or reorganized) and parsed['first_column_period']!=period:
                    result['source_reporting_basis']='ISSUER_RESTATED_COMPARATIVE'
            out.append(result)
        return out

def historical_cin_original(symbol,method,original_digest):
    # Exact BSE/NSE-identical original. The alias additionally requires replay
    # of the retained BSE code/ISIN inventory during independent qualification.
    return (symbol=='TMCV' and method=='NATIVE_INITIAL_ISSUER_LAYOUT_V7'
        and original_digest=='d9c5ae2fd7afe79708a026dfc0eeb8fe31ea8654c87b40023f7a614b524ab0c4')

def exact_cin(cin,text):
    """Names reused across Tata legal entities cannot substitute for their CIN.

    Whitespace in a printed identifier may wrap; no character is corrected.
    """
    return bool(re.search(r'(?<![A-Z0-9])'+r'\s*'.join(re.escape(c) for c in cin)+r'(?![A-Z0-9])',text.upper()))

def split_reference(raw,symbol):
    authority=SPLIT_AUTHORITIES.get(symbol)
    if authority is None or not raw.startswith(b'%PDF') or len(raw)>2_000_000:raise ValueError('OFFICIAL_SPLIT_AUTHORITY_UNPROVEN')
    with fitz.open(stream=raw,filetype='pdf') as pdf:
        if not 1<=len(pdf)<=3:raise ValueError('OFFICIAL_SPLIT_AUTHORITY_PAGE_BOUND')
        text=' '.join(p.get_text('text') for p in pdf)
    compact=lambda value:re.sub(r'[^A-Z0-9]','',value.upper())
    text=compact(text)
    if not all(compact(value) in text for value in (authority['circular'],authority['date_text'],authority['row'],'METROPOLITAN STOCK EXCHANGE OF INDIA LIMITED')):
        raise ValueError('OFFICIAL_SPLIT_AUTHORITY_CONTEXT_UNPROVEN')
    digest=sha(raw)
    return {'contract':'RESULTS_R4_OFFICIAL_EXCHANGE_SHARE_IDENTITY_V1','symbol':symbol,
        'old_isin':authority['old_isin'],'current_isin':authority['current_isin'],'ex_date':authority['ex_date'],
        'source_url':authority['url'],'sha256':digest,'r2_key':PREFIX+'issuer-identity/sha256='+digest+'/split.pdf'}

def bse_display_identity(symbol,isin,code,name):
    if exact_legal_identity(ISSUERS[symbol]['legal'],name):return True
    return bse_display_alias_matches(symbol,isin,code,name)


def bse_inventory_sources(review,review_hash,symbol,isin,security_id):
    """Bind retained exchange originals to an exact, hash-checked issuer review.

    The inventory supplies discovery/identity only. Quarter amounts still come
    exclusively from independently replaying the complete retained original.
    """
    if sha(canonical(review))!=review_hash:raise ValueError('OFFICIAL_BSE_REVIEW_HASH_UNPROVEN')
    profile=ISSUERS.get(symbol)
    if (profile is None or not re.fullmatch(r'[0-9a-f-]{36}',str(security_id),re.I)
        or review.get('contract')!='RESULTS_R4_BSE_DATED_PDF_REVIEW_V1'
        or review.get('symbol')!=symbol or review.get('isin')!=isin
        or str(review.get('security_id'))!=str(security_id) or review.get('period_end') not in PERIODS):
        raise ValueError('OFFICIAL_BSE_REVIEW_CONTEXT_UNPROVEN')
    identity=review.get('bse_identity') or {};header=identity.get('header') or {};listing=identity.get('listing') or {}
    code=str(identity.get('bse_scrip_code',''))
    if (not re.fullmatch(r'[0-9]{6}',code) or str(header.get('SecurityCode'))!=code
        or str(listing.get('SCRIP_CD'))!=code or header.get('ISIN')!=isin or listing.get('ISIN_NUMBER')!=isin
        or not bse_display_identity(symbol,isin,code,identity.get('issuer_name',''))
        or not bse_display_identity(symbol,isin,code,listing.get('Issuer_Name',''))):
        raise ValueError('OFFICIAL_BSE_CANONICAL_IDENTITY_UNPROVEN')
    reference={'sha256':review_hash,'r2_key':PREFIX+'bse-dated-pdf-review/sha256='+review_hash+'/capture.json'}
    candidate_hashes={item.get('original_sha256') for item in review.get('candidates',[]) if isinstance(item,dict)}
    sources={}
    for source in review.get('all_sources',[]):
        url=source.get('source_url','');u=urlparse(url);digest=source.get('original_sha256','')
        if (u.scheme!='https' or u.hostname!='www.bseindia.com' or u.username or u.password
            or u.port not in (None,443) or u.query or u.fragment
            or not re.fullmatch(r'/xml-data/corpfiling/(?:AttachHis|AttachLive)/[0-9a-f-]{36}\.pdf',u.path,re.I)
            or not re.fullmatch(r'[0-9a-f]{64}',digest)
            or source.get('original_r2_key')!=PREFIX+'evidence/original_version='+digest+'/issuer-original.pdf'):
            continue
        sources[url]={'source_url':url,'original_sha256':digest,'original_r2_key':source['original_r2_key'],
            'bse_identity_reference':reference,'candidate_priority':0 if digest in candidate_hashes else 1}
    return sources


def validate_bse_inventory_reference(payload,source_url,observations,review_raw):
    reference=payload.get('bse_identity_reference') or {};digest=reference.get('sha256','')
    if (not re.fullmatch(r'[0-9a-f]{64}',digest) or review_raw is None or sha(review_raw)!=digest
        or reference.get('r2_key')!=PREFIX+'bse-dated-pdf-review/sha256='+digest+'/capture.json'):
        raise ValueError('OFFICIAL_BSE_IDENTITY_REFERENCE_UNPROVEN')
    review=json.loads(review_raw)
    sources=bse_inventory_sources(review,digest,payload['symbol'],payload['isin'],payload.get('security_id'))
    original=sources.get(source_url)
    if (original is None or original['original_sha256']!=payload['original_sha256']
        or original['original_r2_key']!=payload['original_r2_key']
        or any(str(row.get('security_id'))!=str(payload.get('security_id')) for row in observations)):
        raise ValueError('OFFICIAL_BSE_ORIGINAL_BINDING_UNPROVEN')


def qualify(raw,source,observations,identity_raw=None,bse_identity_raw=None,document_audit=None):
    payload=source['raw_payload'];symbol=payload.get('symbol')
    if (payload.get('contract')!=CONTRACT or payload.get('sourceUrl')!=source['source_url']
        or sha(canonical(payload))!=source['payload_hash']):raise ValueError('OFFICIAL_SOURCE_PAYLOAD_UNPROVEN')
    digest=payload.get('original_sha256')
    if not re.fullmatch(r'[0-9a-f]{64}',str(digest)) or sha(raw)!=digest:raise ValueError('OFFICIAL_ORIGINAL_HASH_MISMATCH')
    if payload.get('original_r2_key')!=PREFIX+'evidence/original_version='+digest+'/issuer-original.pdf':
        raise ValueError('OFFICIAL_ORIGINAL_REFERENCE_UNPROVEN')
    if payload.get('bse_identity_reference') is not None:
        if payload.get('parsed',{}).get('basis_policy')!=CURRENT_DISPLAY_POLICY:
            raise ValueError('OFFICIAL_BSE_REPORTING_POLICY_UNPROVEN')
        validate_bse_inventory_reference(payload,source['source_url'],observations,bse_identity_raw)
    else:
        approved_url(symbol,source['source_url'])
    with fitz.open(stream=raw,filetype='pdf') as pdf:
        cover=' '.join(p.get_text('text') for p in list(pdf)[:3])
        reported=set(re.findall(r'\bISIN(?:\s+(?:CODE|NO\.?))?\s*[:\-]?\s*(IN[A-Z0-9]{10})\b',cover,re.I))
        reported={x.upper() for x in reported}
        bridge=payload.get('isin_bridge')
        if bridge is not None:
            if identity_raw is None or bridge!=split_reference(identity_raw,symbol):raise ValueError('OFFICIAL_SPLIT_ORIGINAL_REPLAY_UNPROVEN')
        if reported-{payload['isin']}:
            if (bridge is None or reported!={bridge['old_isin']} or payload['isin']!=bridge['current_isin']
                or payload['period_end']>=bridge['ex_date']):
                raise ValueError('OFFICIAL_CHANGED_SOURCE_ISIN_REQUIRES_EXPLICIT_BRIDGE')
    period=payload['period_end'];recorded=payload['parsed']
    if recorded.get('historical_cin_authority') and payload.get('bse_identity_reference') is None:
        raise ValueError('HISTORICAL_CIN_REQUIRES_EXACT_BSE_ISSUER_BINDING')
    options=extract_original(raw,symbol,period,recorded['method'],recorded['page'],recorded.get('ocr_render_dpi'),recorded.get('ocr_segmentation_mode'),document_audit=document_audit,basis_policy=recorded.get('basis_policy'))
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
