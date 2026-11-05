"""Dated comparative OCR: full-document basis scan plus two financial renders."""
import hashlib,re,copy
from functools import lru_cache
import fitz
from r4_ocr_geometry import OCRPage,agree
from r4_ocr_cli import TableOCRPage
from r4_pdf_geometry import extract_page,rows_for,row_text,date_cells,dated_headers
REVISION='PDF_OCR_EXPLICIT_DATED_COLUMN_V1'
RENDER_PAIRS=((300,450),(200,400),(350,500))

def audit_document(raw,max_pages=40):
    if max_pages not in (40,120):raise ValueError('UNAPPROVED_DOCUMENT_AUDIT_PAGE_BOUND')
    # Repeated receipts for the same immutable original need the same audit.
    # Cache only within this process, keyed by exact bytes AND page bound.
    # A fresh copy prevents a receipt consumer from changing cached evidence.
    return copy.deepcopy(_cached_document_audit(bytes(raw),max_pages))

@lru_cache(maxsize=8)
def _cached_document_audit(raw,max_pages):
    with fitz.open(stream=raw,filetype='pdf') as pdf:
        if not 1<=len(pdf)<=max_pages:raise ValueError('OCR_DATED_DOCUMENT_PAGE_BOUND')
        pages=[OCRPage(page,150).get_text('text') for page in pdf]
    text='\n'.join(pages)
    return {'original_sha256':hashlib.sha256(raw).hexdigest(),'dpi':150,'pages':pages,'text_sha256':hashlib.sha256(text.encode()).hexdigest()}

class GroupHeaderOCRPage(OCRPage):
    """Keep original native group labels when ruling lines hide them from OCR.

    No native date, amount, profit, tax or EPS cells enter the rendered table.
    Explicit currency and unit words also retain their original coordinates.
    Quarter/annual labels are replayed from their original page coordinates.
    """
    def get_text(self,kind="text",**kwargs):
        result=super().get_text(kind,**kwargs)
        if kind!="words":return result
        return native_metadata(self.page,result)

class SegmentedGroupHeaderOCRPage(TableOCRPage):
    def get_text(self,kind="text",**kwargs):
        result=super().get_text(kind,**kwargs)
        return native_metadata(self.page,result) if kind=="words" else result

def financial_location(base,native_coordinates=False):
    pattern=r'revenue\s+from\s+operations|premiums?\s+earned|interest\s+earned'
    rows=rows_for(base)
    match=next(((y,ws) for y,ws in rows if re.search(pattern,row_text(ws),re.I)),None)
    if match is not None:return match,None
    if native_coordinates:
        native=rows_for(base.page)
        match=next(((y,ws) for y,ws in native if re.search(pattern,row_text(ws),re.I)),None)
        if match is not None:
            y,_=match
            # Use only a conservative coordinate boundary. Every supplemental
            # word is still read from the actual original render, never native
            # financial text. Include nearby glyphs so the header ends above
            # a number whose font box precedes its label.
            return (y,[w for yy,ws in native if abs(yy-y)<=5 for w in ws]),'ORIGINAL_NATIVE_COORDINATES_ONLY'
    return None,None

class HeaderRegionOCRPage:
    """Read the printed header separately; keep full-page financial words intact.

    The clip ends above the first revenue/premium/interest row's glyphs. No
    financial amount is imported from the supplemental header render.
    """
    def __init__(self,base,dpi,named_abbreviations=False,compact_named_dates=False):
        self.base=base;self.page=base.page;self.words=base.get_text('words');self.header_region_evidence=None
        rows=rows_for(base)
        financial,locator=financial_location(base)
        if financial is None:return
        y,financial_words=financial
        groups=[(yy,ws) for yy,ws in rows if 0<y-yy<=100
            and not re.search(r'financial|statement|results',row_text(ws),re.I)
            and re.search(r'\bquarters?\b|\b(?:3|three)\s+months?\b',row_text(ws),re.I)]
        if not groups:return
        # Wrapped headings can put "corresponding" above "months ended".
        # Keep the entire bounded group, rather than clipping its qualifier.
        _,heading=min(groups,key=lambda item:item[0])
        top=max(0,min(w[1] for w in heading)-2)
        bottom=min(w[1] for w in financial_words)-2
        if not 12<=bottom-top<=100:return
        clip=fitz.Rect(self.page.rect.x0,top,self.page.rect.x1,bottom)
        region=TableOCRPage(self.page,dpi,6,clip=clip)
        if not complete_header_dates(region,named_abbreviations,compact_named_dates):return
        self.words=[w for w in self.words if not clip.y0<=(w[1]+w[3])/2<clip.y1]+region.get_text('words')
        self.header_region_evidence={'contract':'ORIGINAL_HEADER_REGION_WITH_UNCHANGED_FULL_PAGE_FINANCIAL_WORDS_V1',
            'clip':[clip.x0,clip.y0,clip.x1,clip.y1],'render_dpi':dpi,
            'financial_words_changed':False,'financial_row_glyph_top':min(w[1] for w in financial_words)}
        if locator:self.header_region_evidence['locator_basis']=locator
    def get_text(self,kind='text',**kwargs):
        return list(self.words) if kind=='words' else self.base.get_text(kind,**kwargs)

class LabelRegionOCRPage:
    """Read only the label column separately; preserve every amount word.

    The right edge comes from the explicitly dated first two column centres.
    A crossing numeric word aborts supplementation. Numeric-only region tokens
    are never imported, and no full-page word in an amount column is replaced.
    """
    def __init__(self,base,dpi,preserve_unread_rows=False,named_abbreviations=False,native_coordinates=False,compact_named_dates=False):
        self.base=base;self.page=base.page;self.words=base.get_text('words');self.label_region_evidence=None
        rows=rows_for(base)
        financial,locator=financial_location(base,native_coordinates)
        if financial is None:return
        y,financial_words=financial
        headers=[(yy,dates) for _,yy,dates in dated_headers(rows,named_abbreviations,compact_named_dates) if yy<y and len(dates)>=3 and all(d[0] for d in dates)]
        if not headers:return
        _,dates=max(headers,key=lambda item:item[0])
        centres=[(d[1]+d[2])/2 for d in dates]
        if any(b<=a for a,b in zip(centres,centres[1:])):return
        right=centres[0]-(centres[1]-centres[0])/2
        eps=next((ws for yy,ws in rows if yy>y and re.search(r'\bdiluted\b',row_text(ws),re.I)),None)
        if eps is None:return
        top=min(w[1] for w in financial_words)-2;bottom=max(w[3] for w in eps)+2
        if not 30<right<self.page.rect.width*.7 or not 50<bottom-top<1000:return
        from r4_pdf_geometry import CELL
        if any(top<=(w[1]+w[3])/2<=bottom and w[0]<right<w[2] and CELL.fullmatch(str(w[4])) for w in self.words):return
        clip=fitz.Rect(self.page.rect.x0,top,right,bottom)
        region=TableOCRPage(self.page,dpi,6,clip=clip)
        labels=[w for w in region.get_text('words') if re.search(r'[A-Za-z]',str(w[4])) and not CELL.fullmatch(str(w[4]))]
        if not labels:return
        readable=[]
        if preserve_unread_rows:
            from r4_pdf_geometry import statement_layout_label
            for yy,ws in rows_for(region):
                label=statement_layout_label(row_text(ws))
                if re.match(r'^(?:revenue|profit|(?:\(?loss\)?\s*/\s*)profit|net\s+profit|total\s+(?:profit|tax)|current\s+tax|deferred\s+tax|tax\s+expense|diluted|basic|earnings|operations|discontinued\s+operations|items\s*\()',label,re.I):
                    readable.append(yy)
            labels=[w for w in labels if any(abs((w[1]+w[3])/2-yy)<=2.5 for yy in readable)]
            if not labels:return
        self.words=[w for w in self.words if not (w[0]>=clip.x0 and w[2]<=clip.x1 and clip.y0<=(w[1]+w[3])/2<=clip.y1
                    and (not preserve_unread_rows or any(abs((w[1]+w[3])/2-yy)<=3 for yy in readable)))]+labels
        self.label_region_evidence={'contract':'ORIGINAL_LABEL_REGION_WITH_UNCHANGED_FULL_PAGE_AMOUNT_WORDS_V1',
            'clip':list(clip),'render_dpi':dpi,'amount_words_changed':False,'numeric_region_tokens_imported':False}
        if preserve_unread_rows:
            self.label_region_evidence['contract']='ORIGINAL_READABLE_LABEL_ROWS_WITH_UNCHANGED_FULL_PAGE_AMOUNT_WORDS_V2'
            self.label_region_evidence['unread_supplemental_label_rows_preserved']=True
        if locator:self.label_region_evidence['locator_basis']=locator
    def get_text(self,kind='text',**kwargs):
        return list(self.words) if kind=='words' else self.base.get_text(kind,**kwargs)

def native_metadata(page,result):
    native=rows_for(page)
    boundary=next((y for y,ws in native if re.search(r"revenue|interest\s*earned|premium",row_text(ws),re.I)),None)
    if boundary is None:boundary=next((y for y,ws in native if len(date_cells(ws))>=3),0)
    for y,ws in native:
        text=row_text(ws)
        if y<boundary and boundary-y<180 and re.search(r"\b(?:INR|RS[.,]?|RUPEES?)\b|₹",text,re.I) and re.search(r"\b(?:lakhs?|lacs?|crores?|millions?|Mn)\b",text,re.I):
            for w in ws:
                token=str(w[4]).strip("()[]<>,.")
                if re.fullmatch(r"(?:INR|Rs|Rupees?|Indian|in|lakhs?|lacs?|crores?|millions?|Mn|₹)",token,re.I):result.append(w)
        if y>=boundary or re.search(r"financial|statement|results",text,re.I):continue
        if not re.search(r"\b(?:quarters?|qtrs?|years?|half|nine|six|three|months?)\b",text,re.I):continue
        if not re.search(r"ended|months?",text,re.I):continue
        for w in ws:
            if re.fullmatch(r"(?:quarters?|qtrs?|years?|half|nine|six|three|months?|ended|annual|ytd|3)(?:ended)?",str(w[4]),re.I):result.append(w)
    return result

def validate_page_layout(page):
    if page.rect.width>1000 or page.rect.height>1500:
        raise ValueError('LARGE_OR_MULTI_REPORT_LAYOUT_REQUIRES_REVIEW')

def checked(first,second,one,two,pair,segmentation_mode=3,statement_layout=False,advanced_statement_layout=False):
    fingerprint=agree(first,second)
    for fact in first['facts'].values():fact['extraction_method']='OCR_DOUBLE_RENDER_DATED_WORD_COORDINATES_V1'
    first['ocr_segmentation_mode']=segmentation_mode;first['parser_revision']=REVISION;first['ocr_render_dpi']=list(pair);first['ocr_header_basis']='ORIGINAL_NATIVE_GROUP_AND_UNIT_LABELS_WITH_RENDERED_FACT_CELLS'
    if isinstance(one,HeaderRegionOCRPage) or isinstance(two,HeaderRegionOCRPage):
        first['parser_revision']='PDF_OCR_HEADER_REGION_EXPLICIT_DATED_COLUMN_V2'
        first['ocr_header_region_evidence']=[one.header_region_evidence,two.header_region_evidence]
        first['ocr_header_basis']='ORIGINAL_HEADER_REGION_WITH_UNCHANGED_FULL_PAGE_FINANCIAL_WORDS_V1'
    if isinstance(one,LabelRegionOCRPage) or isinstance(two,LabelRegionOCRPage):
        for fact in first['facts'].values():fact['extraction_method']='OCR_DOUBLE_RENDER_SEPARATE_REGIONS_V3'
        first['parser_revision']='PDF_OCR_SEPARATE_LABEL_AND_HEADER_REGIONS_V3'
        first['ocr_label_region_evidence']=[one.label_region_evidence,two.label_region_evidence]
        first['ocr_header_region_evidence']=[getattr(one.base,'header_region_evidence',None),getattr(two.base,'header_region_evidence',None)]
        first['ocr_header_basis']='ORIGINAL_HEADER_AND_LABEL_REGIONS_WITH_UNCHANGED_FULL_PAGE_AMOUNT_WORDS_V1'
    if statement_layout:
        first['parser_revision']='PDF_OCR_EXPLICIT_STATEMENT_ROW_LAYOUT_V4'
        first['statement_row_layout_contract']='PRINTED_TOTAL_PAT_WITH_OPTIONAL_EXPLICIT_CONTINUING_DISCONTINUED_RECONCILIATION_V1'
        for fact in first['facts'].values():fact['extraction_method']='OCR_DOUBLE_RENDER_EXPLICIT_STATEMENT_ROW_LAYOUT_V4'
    if advanced_statement_layout:
        first['parser_revision']='PDF_OCR_EXPLICIT_STATEMENT_ROW_LAYOUT_V5'
        first['statement_row_layout_contract']='EXPLICIT_NAMED_DATES_PRINTED_TOTAL_PAT_AND_FINANCIAL_EPS_ROWS_V2'
        for fact in first['facts'].values():fact['extraction_method']='OCR_DOUBLE_RENDER_EXPLICIT_STATEMENT_ROW_LAYOUT_V5'
    return first,{'fingerprint':fingerprint,'render_dpi':list(pair),'segmentation_mode':segmentation_mode,'issuer_text_first':one.get_text('text'),'issuer_text_second':two.get_text('text')}

def extract_dated_page(raw,page_no,period,bank=False,insurer=False,render_dpi=(300,450),segmentation_mode=3,header_region=False,label_region=False,statement_layout=False,advanced_statement_layout=False):
    pair=tuple(render_dpi)
    if pair not in RENDER_PAIRS:raise ValueError('UNAPPROVED_INDEPENDENT_RENDER_PAIR')
    if segmentation_mode not in (3,6,11):raise ValueError('UNAPPROVED_TABLE_SEGMENTATION_MODE')
    with fitz.open(stream=raw,filetype='pdf') as pdf:
        page=pdf[page_no-1];validate_page_layout(page)
        one=render_page(page,pair[0],segmentation_mode);two=render_page(page,pair[1],segmentation_mode)
        if header_region:one=HeaderRegionOCRPage(one,pair[0],statement_layout,advanced_statement_layout);two=HeaderRegionOCRPage(two,pair[1],statement_layout,advanced_statement_layout)
        if label_region:one=LabelRegionOCRPage(one,pair[0],statement_layout,statement_layout,advanced_statement_layout,advanced_statement_layout);two=LabelRegionOCRPage(two,pair[1],statement_layout,statement_layout,advanced_statement_layout,advanced_statement_layout)
        options={'statement_layout':True} if statement_layout else {}
        if advanced_statement_layout:options['advanced_statement_layout']=True
        first=extract_page(one,page_no,period,bank,insurer,allow_comparative=True,**options)
        second=extract_page(two,page_no,period,bank,insurer,allow_comparative=True,**options)
        return checked(first,second,one,two,pair,segmentation_mode,statement_layout,advanced_statement_layout)

def extract_dated_periods(raw,page_no,periods,bank=False,insurer=False,header_region=False,label_region=False,statement_layout=False,advanced_statement_layout=False):
    """Render each page once per approved pair, then inspect all target quarters.

    A complete explicit header proves absent quarters without extra OCR work.
    Alternate resolutions remain subject to the same exact-cell/arithmetic gate.
    """
    results={};pending=set(periods)
    with fitz.open(stream=raw,filetype='pdf') as pdf:
        page=pdf[page_no-1];validate_page_layout(page)
        native_headers=complete_header_dates(page)
        for segmentation_mode in (3,6,11):
            if not pending:break
            for pair in RENDER_PAIRS:
                if not pending:break
                try:
                    one=render_page(page,pair[0],segmentation_mode);two=render_page(page,pair[1],segmentation_mode)
                    if header_region:one=HeaderRegionOCRPage(one,pair[0],statement_layout,advanced_statement_layout);two=HeaderRegionOCRPage(two,pair[1],statement_layout,advanced_statement_layout)
                    if label_region:one=LabelRegionOCRPage(one,pair[0],statement_layout,statement_layout,advanced_statement_layout,advanced_statement_layout);two=LabelRegionOCRPage(two,pair[1],statement_layout,statement_layout,advanced_statement_layout,advanced_statement_layout)
                except ValueError as error:
                    for period in pending:results[period]={'rejection':str(error).split(':')[0]}
                    continue
                first_headers=complete_header_dates(one);second_headers=complete_header_dates(two)
                # This is an absence check only, never financial admission.
                # Require every complete native date group and both rendered
                # date groups to agree. Incomplete or disagreeing headers keep
                # all alternate render attempts available.
                if native_headers and native_headers==first_headers==second_headers:
                    present={period for group in native_headers for period in group}
                    for period in list(pending-present):
                        results[period]={'rejection':'PERIOD_NOT_PRESENT_IN_THREE_WAY_REPLAYED_DATED_HEADERS'}
                        pending.remove(period)
                known_columns=None
                for period in sorted(pending):
                    try:
                        options={'statement_layout':True} if statement_layout else {}
                        if advanced_statement_layout:options['advanced_statement_layout']=True
                        first=extract_page(one,page_no,period,bank,insurer,allow_comparative=True,**options)
                        second=extract_page(two,page_no,period,bank,insurer,allow_comparative=True,**options)
                        parsed,checks=checked(first,second,one,two,pair,segmentation_mode,statement_layout,advanced_statement_layout)
                        results[period]={'parsed':parsed,'checks':checks};pending.remove(period)
                        columns=parsed.get('header_periods',[])
                        if len(columns)==3 and all(columns):known_columns=set(columns)
                    except ValueError as error:results[period]={'rejection':str(error).split(':')[0]}
                if known_columns is not None:
                    for period in list(pending-known_columns):
                        results[period]={'rejection':'PERIOD_NOT_PRESENT_IN_PROVEN_QUARTER_COLUMNS'};pending.remove(period)
    return results

def complete_header_dates(page,named_abbreviations=False,compact_named_dates=False):
    groups=set()
    for _,_,dates in dated_headers(rows_for(page),named_abbreviations,compact_named_dates):
        if len(dates)<3:continue
        if any(period is None for period,_,_ in dates):return None
        groups.add(tuple(period for period,_,_ in dates))
    return frozenset(groups) if groups else None

def render_page(page,dpi,segmentation_mode):
    return GroupHeaderOCRPage(page,dpi) if segmentation_mode==3 else SegmentedGroupHeaderOCRPage(page,dpi,segmentation_mode)
