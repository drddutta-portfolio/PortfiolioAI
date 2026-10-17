"""Dated comparative OCR: full-document basis scan plus two financial renders."""
import hashlib
import fitz
from r4_ocr_geometry import OCRPage,agree
from r4_pdf_geometry import extract_page
REVISION='PDF_OCR_EXPLICIT_DATED_COLUMN_V1'

def audit_document(raw):
    with fitz.open(stream=raw,filetype='pdf') as pdf:
        if not 1<=len(pdf)<=40:raise ValueError('OCR_DATED_DOCUMENT_PAGE_BOUND')
        pages=[OCRPage(page,150).get_text('text') for page in pdf]
    text='\n'.join(pages)
    return {'original_sha256':hashlib.sha256(raw).hexdigest(),'dpi':150,'pages':pages,'text_sha256':hashlib.sha256(text.encode()).hexdigest()}

def extract_dated_page(raw,page_no,period,bank=False,insurer=False):
    with fitz.open(stream=raw,filetype='pdf') as pdf:
        page=pdf[page_no-1]
        one=OCRPage(page,300);two=OCRPage(page,450)
        first=extract_page(one,page_no,period,bank,insurer,allow_comparative=True)
        second=extract_page(two,page_no,period,bank,insurer,allow_comparative=True)
        fingerprint=agree(first,second)
        for fact in first["facts"].values():fact["extraction_method"]="OCR_DOUBLE_RENDER_DATED_WORD_COORDINATES_V1"
        first["parser_revision"]=REVISION
        return first,{'fingerprint':fingerprint,'issuer_text_300':one.get_text('text'),'issuer_text_450':two.get_text('text')}
