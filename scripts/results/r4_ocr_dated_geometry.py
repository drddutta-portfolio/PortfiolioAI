"""Dated comparative OCR: full-document basis scan plus two financial renders."""
import hashlib,re
import fitz
from r4_ocr_geometry import OCRPage,agree
from r4_ocr_cli import TableOCRPage
from r4_pdf_geometry import extract_page,rows_for,row_text,date_cells
REVISION='PDF_OCR_EXPLICIT_DATED_COLUMN_V1'
RENDER_PAIRS=((300,450),(200,400),(350,500))

def audit_document(raw):
    with fitz.open(stream=raw,filetype='pdf') as pdf:
        if not 1<=len(pdf)<=40:raise ValueError('OCR_DATED_DOCUMENT_PAGE_BOUND')
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

def checked(first,second,one,two,pair,segmentation_mode=3):
    fingerprint=agree(first,second)
    for fact in first['facts'].values():fact['extraction_method']='OCR_DOUBLE_RENDER_DATED_WORD_COORDINATES_V1'
    first['ocr_segmentation_mode']=segmentation_mode;first['parser_revision']=REVISION;first['ocr_render_dpi']=list(pair);first['ocr_header_basis']='ORIGINAL_NATIVE_GROUP_AND_UNIT_LABELS_WITH_RENDERED_FACT_CELLS'
    return first,{'fingerprint':fingerprint,'render_dpi':list(pair),'segmentation_mode':segmentation_mode,'issuer_text_first':one.get_text('text'),'issuer_text_second':two.get_text('text')}

def extract_dated_page(raw,page_no,period,bank=False,insurer=False,render_dpi=(300,450),segmentation_mode=3):
    pair=tuple(render_dpi)
    if pair not in RENDER_PAIRS:raise ValueError('UNAPPROVED_INDEPENDENT_RENDER_PAIR')
    if segmentation_mode not in (3,6,11):raise ValueError('UNAPPROVED_TABLE_SEGMENTATION_MODE')
    with fitz.open(stream=raw,filetype='pdf') as pdf:
        page=pdf[page_no-1];validate_page_layout(page)
        one=render_page(page,pair[0],segmentation_mode);two=render_page(page,pair[1],segmentation_mode)
        first=extract_page(one,page_no,period,bank,insurer,allow_comparative=True)
        second=extract_page(two,page_no,period,bank,insurer,allow_comparative=True)
        return checked(first,second,one,two,pair,segmentation_mode)

def extract_dated_periods(raw,page_no,periods,bank=False,insurer=False):
    """Render each page once per approved pair, then inspect all target quarters.

    A complete explicit header proves absent quarters without extra OCR work.
    Alternate resolutions remain subject to the same exact-cell/arithmetic gate.
    """
    results={};pending=set(periods)
    with fitz.open(stream=raw,filetype='pdf') as pdf:
        page=pdf[page_no-1];validate_page_layout(page)
        for segmentation_mode in (3,6,11):
            if not pending:break
            for pair in RENDER_PAIRS:
                if not pending:break
                try:
                    one=render_page(page,pair[0],segmentation_mode);two=render_page(page,pair[1],segmentation_mode)
                except ValueError as error:
                    for period in pending:results[period]={'rejection':str(error).split(':')[0]}
                    continue
                known_columns=None
                for period in sorted(pending):
                    try:
                        first=extract_page(one,page_no,period,bank,insurer,allow_comparative=True)
                        second=extract_page(two,page_no,period,bank,insurer,allow_comparative=True)
                        parsed,checks=checked(first,second,one,two,pair,segmentation_mode)
                        results[period]={'parsed':parsed,'checks':checks};pending.remove(period)
                        columns=parsed.get('header_periods',[])
                        if len(columns)==3 and all(columns):known_columns=set(columns)
                    except ValueError as error:results[period]={'rejection':str(error).split(':')[0]}
                if known_columns is not None:
                    for period in list(pending-known_columns):
                        results[period]={'rejection':'PERIOD_NOT_PRESENT_IN_PROVEN_QUARTER_COLUMNS'};pending.remove(period)
    return results

def render_page(page,dpi,segmentation_mode):
    return GroupHeaderOCRPage(page,dpi) if segmentation_mode==3 else SegmentedGroupHeaderOCRPage(page,dpi,segmentation_mode)
