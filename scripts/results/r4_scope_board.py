"""Bind one signed statement to issuer-declared NSE scope, without changing amounts.

V2 is separate from the unchanged V1 shared-note contract. Exact issuer/ISIN,
board date, start/end clocks, one financial statement and the current trio at
its printed precision identify the same filing. Historical cells come only
from the PDF. Missing scope is never inferred from corporate structure.
"""
import base64,hashlib,re,subprocess
from datetime import datetime
from decimal import Decimal
import fitz
from r4_dated_columns import parse_html,extract_tables,unique,dateval
from r4_scope_bridge import original_origin,CURRENT,HISTORICAL,has_phrase,date_phrases
from r4_pdf_geometry import extract_page,rows_for,row_text
from r4_issuer_name import exact_legal_identity

CONTRACT='NSE_ORIGINAL_SAME_BOARD_SINGLE_STATEMENT_SCOPE_V2'
REVISION='PDF_WORD_COORDINATES_NSE_BOARD_SCOPE_V2'
DIVISORS={'INR_CRORE':Decimal(1),'INR_LAKH':Decimal(100),'INR_MILLION':Decimal(10),'INR_PER_SHARE':Decimal(1)}
CORE={'OPERATING_REVENUE_QUARTER','NET_PROFIT_QUARTER','EPS_DILUTED'}

def sha(raw):return hashlib.sha256(raw).hexdigest()

def make_bridge(raw,url,current_period):
    if not original_origin(url) or current_period not in CURRENT or not 1<=len(raw)<=5_000_000:
        raise ValueError('BOARD_SCOPE_PRIMARY_ORIGIN_OR_PERIOD_UNPROVEN')
    return {'contract':CONTRACT,'nse_original_url':url,'current_period':current_period,
        'nse_original_sha256':sha(raw),'nse_original_base64':base64.b64encode(raw).decode('ascii')}

def read_bridge(bridge,symbol,isin,legal):
    if bridge.get('contract')!=CONTRACT or not original_origin(bridge.get('nse_original_url','')) or bridge.get('current_period') not in CURRENT:
        raise ValueError('BOARD_SCOPE_CONTRACT_OR_PRIMARY_ORIGIN_UNPROVEN')
    encoded=bridge.get('nse_original_base64','')
    if not isinstance(encoded,str) or len(encoded)>6_666_672:raise ValueError('BOARD_SCOPE_PRIMARY_SIZE_BOUND')
    raw=base64.b64decode(encoded,validate=True)
    if not raw or sha(raw)!=bridge.get('nse_original_sha256'):raise ValueError('BOARD_SCOPE_PRIMARY_HASH_MISMATCH')
    text,tables=parse_html(raw.decode('utf-8-sig'))
    if unique(tables,'description of presentation currency')!='INR' or not exact_legal_identity(legal,unique(tables,'name of company') or ''):
        raise ValueError('BOARD_SCOPE_PRIMARY_LEGAL_IDENTITY_OR_CURRENCY_UNPROVEN')
    current=extract_tables(tables,symbol,isin,bridge['current_period'])
    board=dateval(unique(tables,'date of board meeting when results were approved') or '')
    try:
        start=datetime.strptime(unique(tables,'start date and time of board meeting') or '','%d-%m-%Y %H:%M:%S')
        end=datetime.strptime(unique(tables,'end date and time of board meeting') or '','%d-%m-%Y %H:%M:%S')
    except ValueError:raise ValueError('BOARD_SCOPE_BOTH_PRIMARY_CLOCKS_REQUIRED') from None
    if not board or str(start.date())!=board or str(end.date())!=board or not start<end:
        raise ValueError('BOARD_SCOPE_PRIMARY_MEETING_EVENT_UNPROVEN')
    return current,board,start.time(),end.time()

CLOCK=r'(\d{1,2}[:.]\d{2}(?::\d{2})?)\s*([ap]\s*\.?\s*m\s*\.?)?'
MEETING=re.compile(r'\bcommenced\b.{0,12}?'+CLOCK+r'.{0,100}?\bconcluded\b.{0,12}?'+CLOCK,re.I)

def clock(value,meridiem):
    parts=value.replace('.',':').split(':')
    h,m=int(parts[0]),int(parts[1]);s=int(parts[2]) if len(parts)==3 else 0
    if meridiem:
        if not 1<=h<=12:raise ValueError('BOARD_SCOPE_PRINTED_CLOCK_INVALID')
        h=h%12+(12 if re.sub(r'[^apm]','',meridiem.lower())=='pm' else 0)
    from datetime import time
    try:return time(h,m,s)
    except ValueError:raise ValueError('BOARD_SCOPE_PRINTED_CLOCK_INVALID') from None

def match_board(cover,board,start,end):
    if not any(has_phrase(cover,p) for p in date_phrases(board)):
        raise ValueError('BOARD_SCOPE_SAME_BOARD_DATE_UNPROVEN')
    matches=[]
    for m in MEETING.finditer(cover):
        if (clock(m[1],m[2]),clock(m[3],m[4]))==(start,end):matches.append(m.group())
    if len(matches)!=1:raise ValueError('BOARD_SCOPE_EXACT_START_AND_END_CLOCKS_UNPROVEN')
    return matches[0]

def printed_precision_match(pdf_fact,primary_fact):
    if pdf_fact['unit']!=primary_fact['unit']:return False
    raw=pdf_fact['original_value'].strip().replace(',','').replace('(','-').replace(')','')
    if not re.fullmatch(r'-?\d+(?:\.\d+)?',raw):return False
    places=len(raw.split('.')[1]) if '.' in raw else 0
    quantum=Decimal(1).scaleb(-places)/DIVISORS[pdf_fact['original_unit']]
    # Strict interior of the rounding interval; ties are not guessed.
    return abs(Decimal(pdf_fact['value'])-Decimal(primary_fact['value']))<quantum/2

class CaptionView:
    """Supplement only an independently reread original currency/unit caption."""
    def __init__(self,page):
        self.page=page;self.words=page.get_text('words');self.evidence=None
        rows=rows_for(page)
        choices=[ws for y,ws in rows if re.search(r'\bIndian\b.*\bRupees?\b',row_text(ws),re.I)]
        if len(choices)!=1:return
        ws=choices[0]
        rect=fitz.Rect(min(w[0] for w in ws)-3,min(w[1] for w in ws)-3,max(w[2] for w in ws)+3,max(w[3] for w in ws)+3)
        reads=[];units=[]
        for dpi in (300,450):
            png=page.get_pixmap(dpi=dpi,alpha=False,clip=rect).tobytes('png')
            try:
                run=subprocess.run(['tesseract','stdin','stdout','-l','eng','--psm','7'],input=png,
                    stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=20,check=True)
            except (OSError,subprocess.SubprocessError) as error:raise ValueError('BOARD_SCOPE_UNIT_CAPTION_RENDER_FAILED') from error
            text=run.stdout.decode('utf-8').strip()
            match=re.search(r'\bIndian\s+Rupees?\s+in\s+(Million|Lakhs?|Lacs?|Crores?)\b',text,re.I)
            if not match:return
            units.append(match[1].lower());reads.append({'dpi':dpi,'text':text,'render_sha256':sha(png)})
        if units[0]!=units[1]:raise ValueError('BOARD_SCOPE_UNIT_CAPTION_RENDERS_DISAGREE')
        # No native amount, sign, decimal point, date or metric label is edited.
        self.words=self.words+[(*rect,units[0])]
        self.evidence={'contract':'DOUBLE_RENDER_ORIGINAL_INDIAN_RUPEE_UNIT_CAPTION_V1',
            'bounds':list(rect),'reads':reads,'financial_words_changed':False}
    def get_text(self,kind='text',**kwargs):
        return list(self.words) if kind=='words' else self.page.get_text(kind,**kwargs)

def parse_page(view,page_no,period,scope):
    result=extract_page(view,page_no,period,allow_comparative=True,scope_hint=scope,
        statement_layout=True,advanced_statement_layout=True,footnoted_quarter_headers=True,initial_issuer_layout=True)
    if set(result['facts'])!=CORE or not result.get('arithmetic_validation'):
        raise ValueError('BOARD_SCOPE_INDEPENDENT_PBT_TAX_RECONCILIATION_REQUIRED')
    return result

def extract_with_scope_board(raw,page_no,period,symbol,isin,legal,bridge,bank=False,insurer=False,document_audit=None):
    if period not in HISTORICAL or bank or insurer:raise ValueError('BOARD_SCOPE_HISTORICAL_NONBANK_ONLY')
    current,board,start,end=read_bridge(bridge,symbol,isin,legal)
    if current['scope']!='STANDALONE' or any(Decimal(f['value'])==0 for f in current['facts'].values()):
        raise ValueError('BOARD_SCOPE_NONZERO_SINGLE_COMPANY_STANDALONE_ONLY')
    with fitz.open(stream=raw,filetype='pdf') as pdf:
        if not 1<=len(pdf)<=40:raise ValueError('BOARD_SCOPE_ORIGINAL_PAGE_BOUND')
        native=[p.get_text('text') for p in pdf];cover=' '.join(native[:3])
        if not exact_legal_identity(legal,cover):raise ValueError('BOARD_SCOPE_EXACT_PDF_LEGAL_IDENTITY_UNPROVEN')
        clocks=match_board(cover,board,start,end)
        scopes={x.upper() for x in re.findall(r'\bstandalone\b|\bconsolidated\b',' '.join(native),re.I)}
        if scopes-{current['scope']}:raise ValueError('BOARD_SCOPE_OTHER_DOCUMENT_SCOPE_PRESENT')
        candidates=[]
        for i,page in enumerate(pdf,1):
            text=native[i-1]
            if not re.search(r'revenue',text,re.I) or not re.search(r'diluted',text,re.I):continue
            view=CaptionView(page)
            try:parsed=parse_page(view,i,bridge['current_period'],current['scope'])
            except ValueError:continue
            if parsed['column_index']==0 and parsed['first_column_period']==bridge['current_period']:
                candidates.append((i,view,parsed))
        if len(candidates)!=1 or candidates[0][0]!=page_no:
            raise ValueError('BOARD_SCOPE_ONE_IDENTIFIED_CURRENT_FINANCIAL_STATEMENT_REQUIRED')
        _,view,first=candidates[0]
        if any(not printed_precision_match(first['facts'][k],current['facts'][k]) for k in CORE):
            raise ValueError('BOARD_SCOPE_CURRENT_PDF_TRIO_DISAGREES_WITH_PRIMARY')
        historical=parse_page(view,page_no,period,current['scope'])
        from r4_ocr_dated_geometry import audit_document
        audit=document_audit if document_audit is not None else audit_document(raw)
        if (audit.get('original_sha256')!=sha(raw) or len(audit.get('pages',[]))!=len(pdf)
            or audit.get('text_sha256')!=sha('\n'.join(audit['pages']).encode())):
            raise ValueError('BOARD_SCOPE_FULL_ORIGINAL_AUDIT_UNPROVEN')
        all_text=' '.join(native+audit['pages'])
        if re.search(r'\b(?:restated|recast|pro[ -]?forma|carve[ -]?out|demerger|demerged|common[ -]control)\b',all_text,re.I):
            raise ValueError('BOARD_SCOPE_BUSINESS_PERIMETER_REVIEW_REQUIRED')
        if re.search(r'\bgroup\b|subsidiar|joint[ -]?venture',all_text,re.I):
            raise ValueError('BOARD_SCOPE_GROUP_CONTEXT_REVIEW_REQUIRED')
        audited_scopes={x.upper() for x in re.findall(r'\bstandalone\b|\bconsolidated\b',all_text,re.I)}
        if audited_scopes-{current['scope']}:raise ValueError('BOARD_SCOPE_AUDITED_OTHER_SCOPE_PRESENT')
        evidence={'contract':CONTRACT,'scope':current['scope'],'current_period':bridge['current_period'],
            'board_date':board,'board_start':str(start),'board_end':str(end),'printed_meeting':clocks,
            'current_pdf_facts':first['facts'],'primary_current_facts':current['facts'],
            'unit_caption_evidence':view.evidence,'document_audit_text_sha256':audit['text_sha256'],
            'scope_hint_used':historical.get('scope_hint_used',False),'historical_values_from_pdf_only':True,
            'comparison_basis_unproven':True}
        return historical,evidence
