"""Fail-closed original-PDF replay for explicitly dated historical columns.

This extends the existing BSE original source contract, not financial authority.
Current-display facts only; no point-in-time or cross-share-basis authority.
"""
import hashlib,re
from decimal import Decimal
import fitz
from r4_pdf_geometry import extract_page
from r4_issuer_name import exact_legal_identity

REVISION='PDF_WORD_COORDINATES_DATED_COLUMN_V1'
FIELDS=('value','unit','original_unit','original_value','column_period','page','column_index','column_bounds','row_y','evidence_line','extraction_method')
BANKS=set('AUBANK AXISBANK BANDHANBNK BANKBARODA BANKINDIA CANBK FEDERALBNK HDFCBANK ICICIBANK IDBI IDFCFIRSTB INDIANB KARURVYSYA KOTAKBANK RBLBANK SBIN UNIONBANK'.split())

def validate_original(raw,manifest,identity):
    if hashlib.sha256(raw).hexdigest()!=manifest['original_sha256_retained'] or not raw.startswith(b'%PDF'):
        raise ValueError('DATED_PDF_ORIGINAL_HASH_MISMATCH')
    code=manifest['bse_scrip_code'];isin=manifest['isin'];legal=manifest['issuer_name']
    header=identity['header'];listing=identity['listing']
    if (str(header.get('SecurityCode'))!=code or header.get('ISIN')!=isin
        or str(listing.get('SCRIP_CD'))!=code or listing.get('ISIN_NUMBER')!=isin
        or not exact_legal_identity(legal,listing.get('Issuer_Name',''))
        or identity.get('issuer_name')!=legal or identity.get('bse_scrip_code')!=code):
        raise ValueError('DATED_PDF_CANONICAL_BSE_IDENTITY_UNPROVEN')
    if (identity.get('original_sha256')!=manifest['original_sha256_retained']
        or identity.get('source_url')!=manifest['issuer_filing_url']):
        raise ValueError('DATED_PDF_IDENTITY_ORIGINAL_LINK_MISMATCH')
    if manifest.get('scope_evidence_basis') is not None and manifest.get('parser_revision')!=REVISION:
        raise ValueError('DATED_PDF_SCOPE_BRIDGE_PROOF_UNPROVEN')
    page=manifest['financial_page'];period=manifest['period_end']
    with fitz.open(stream=raw,filetype='pdf') as pdf:
        if not 1<=page<=min(40,len(pdf)):raise ValueError('DATED_PDF_PAGE_INVALID')
        text=' '.join(p.get_text('text') for p in list(pdf)[:40])
        if manifest.get('parser_revision')=='PDF_OCR_EXPLICIT_DATED_COLUMN_V1':
            from r4_ocr_dated_geometry import audit_document,extract_dated_page
            audit=audit_document(raw)
            if audit['text_sha256']!=manifest.get('ocr_document_text_sha256'):
                raise ValueError('DATED_OCR_FULL_DOCUMENT_REPLAY_MISMATCH')
            parsed,checks=extract_dated_page(raw,page,period,manifest['symbol'] in BANKS,manifest['symbol']=='STARHEALTH',manifest.get('ocr_render_dpi',(300,450)),manifest.get('ocr_segmentation_mode',3))
            if not all(exact_legal_identity(legal,checks[k]) for k in ('issuer_text_first','issuer_text_second')):
                raise ValueError('DATED_OCR_DOUBLE_LEGAL_NAME_UNPROVEN')
            text+=' '+' '.join(audit['pages'])
        else:
            if not exact_legal_identity(legal,' '.join(p.get_text('text') for p in list(pdf)[:3])):
                raise ValueError('DATED_PDF_COMPLETE_LEGAL_NAME_UNPROVEN')
            if manifest.get('scope_evidence_basis') is not None:
                from r4_scope_bridge import CONTRACT,extract_with_scope_bridge
                if manifest['scope_evidence_basis']!=CONTRACT or not isinstance(identity.get('scope_bridge'),dict):
                    raise ValueError('DATED_PDF_SCOPE_BRIDGE_PROOF_UNPROVEN')
                parsed,_=extract_with_scope_bridge(pdf,page,period,manifest['symbol'],isin,legal,identity['scope_bridge'],manifest['symbol'] in BANKS,manifest['symbol']=='STARHEALTH')
            else:
                if identity.get('scope_bridge') is not None:raise ValueError('DATED_PDF_UNDECLARED_SCOPE_BRIDGE')
                parsed=extract_page(pdf[page-1],page,period,manifest['symbol'] in BANKS,manifest['symbol']=='STARHEALTH',allow_comparative=True)
        # A restated comparative may describe a different business perimeter.
        # Those statements remain review evidence, never an automatic gap fill.
        if re.search(r'\b(?:pro[ -]?forma|carve[ -]?out)\b',text,re.I):
            raise ValueError('DATED_PDF_PROFORMA_OR_CARVEOUT_REVIEW_REQUIRED')
        if parsed['first_column_period']!=period and re.search(r'\b(?:restated|recast)\b',text,re.I):
            raise ValueError('DATED_PDF_RESTATED_COMPARATIVE_REVIEW_REQUIRED')
    for field,key in [('scope','consolidation_scope'),('unit','original_unit'),('first_column_period','first_column_period'),('selected_column_period','selected_column_period'),('column_index','selected_column_index')]:
        if parsed[field]!=manifest[key]:raise ValueError('DATED_PDF_REPLAY_CONTEXT_MISMATCH:'+field)
    if set(parsed['facts'])!=set(manifest['facts']):raise ValueError('DATED_PDF_REPLAY_METRICS_MISMATCH')
    for metric,fact in parsed['facts'].items():
        for field in FIELDS:
            if fact.get(field)!=manifest['facts'][metric].get(field):raise ValueError('DATED_PDF_REPLAY_FACT_MISMATCH:'+metric+':'+field)
        if not Decimal(fact['value']).is_finite():raise ValueError('DATED_PDF_NONFINITE')
    expected='AS_FILED_OWN_QUARTER' if parsed['first_column_period']==period else 'LATER_FILING_REPORTED_COMPARATIVE'
    if manifest['source_reporting_basis']!=expected:raise ValueError('DATED_PDF_REPORTING_BASIS_MISMATCH')
    return parsed


def replay_document(raw,symbol,periods,identity,source):
    """Pure per-original replay, suitable for a hard process deadline."""
    from collections import Counter
    digest=hashlib.sha256(raw).hexdigest()
    if digest!=source['original_sha256']:raise ValueError('ORIGINAL_HASH_MISMATCH')
    proof={**identity,'original_sha256':digest,'source_url':source['source_url']}
    results={p:{'options':[],'rejections':Counter()} for p in periods}
    with fitz.open(stream=raw,filetype='pdf') as pdf:
        for i in range(min(len(pdf),40)):
            for period,outcome in results.items():
                try:
                    parsed=extract_page(pdf[i],i+1,period,symbol in BANKS,symbol=='STARHEALTH',allow_comparative=True)
                    basis='AS_FILED_OWN_QUARTER' if parsed['first_column_period']==period else 'LATER_FILING_REPORTED_COMPARATIVE'
                    manifest={'symbol':symbol,'isin':identity['header']['ISIN'],'issuer_name':identity['issuer_name'],'bse_scrip_code':identity['bse_scrip_code'],'original_sha256_retained':digest,'issuer_filing_url':source['source_url'],'financial_page':i+1,'period_end':period,'consolidation_scope':parsed['scope'],'original_unit':parsed['unit'],'first_column_period':parsed['first_column_period'],'selected_column_period':period,'selected_column_index':parsed['column_index'],'source_reporting_basis':basis,'facts':parsed['facts']}
                    validate_original(raw,manifest,proof)
                    outcome['options'].append({'parsed':parsed,'proof':proof,'basis':basis})
                except ValueError as error:outcome['rejections'][str(error).split(':')[0]]+=1
    return results
