"""Review-only proof of a scope omitted from a signed PDF table heading.

The independent NSE original must identify the same issuer, explicitly include
the requested historical quarter in the same statement, reproduce its dated
current-quarter trio, and share the statement note and board date with the PDF.
Financial historical cells are still extracted solely from the original PDF.
"""
import base64
import hashlib
import re
from datetime import date
from decimal import Decimal
from urllib.parse import urlparse

from r4_dated_columns import extract_tables, parse_html, unique, dateval
from r4_issuer_name import exact_legal_identity
from r4_pdf_geometry import extract_page

CONTRACT = 'NSE_ORIGINAL_SAME_STATEMENT_SCOPE_V1'
HISTORICAL = frozenset(('2024-09-30','2024-12-31','2025-03-31','2025-06-30'))
CURRENT = frozenset(('2025-09-30','2025-12-31','2026-03-31','2026-06-30'))

def original_origin(url):
    u = urlparse(url)
    return (u.scheme == 'https' and u.hostname == 'nsearchives.nseindia.com'
            and not u.query and not u.fragment and not u.username and not u.password
            and bool(re.fullmatch(r'/corporate/ixbrl/INTEGRATED_FILING_(?:INDAS|BANKING|NBFC_INDAS|GI)_[A-Za-z0-9_]+\.html',u.path,re.I)))

def words(text):
    return ' '.join(re.findall(r'[a-z0-9]+', text.lower()))

def has_phrase(text,phrase):
    return ' '+phrase+' ' in ' '+words(text)+' '

def date_phrases(period):
    d = date.fromisoformat(period)
    return [words(value) for value in (
        f'{d:%B} {d.day} {d.year}', f'{d.day} {d:%B} {d.year}',
        f'{d:%b} {d.day} {d.year}', f'{d.day} {d:%b} {d.year}',
        f'{d:%d-%m-%Y}', f'{d:%d.%m.%Y}')]

def common_statement_note(nse_text, pdf_text, period):
    # A date elsewhere in an annual report or a generic scope label is not proof.
    # The same positive statement may explicitly list two historical quarters.
    # The requested date must occur inside that shared closed statement phrase.
    for qualifier in ('','unaudited ','audited '):
        for plural in ('quarter','quarters'):
            prefix='statement of '+qualifier+'financial results includes results for the '+plural+' ended '
            for phrase in date_phrases(period)[:4]:
                note=prefix+phrase
                if has_phrase(nse_text,note) and has_phrase(pdf_text,note):return note
                for other in sorted(HISTORICAL-{period}):
                    for earlier in date_phrases(other)[:4]:
                        note=prefix+earlier+' and '+phrase
                        if has_phrase(nse_text,note) and has_phrase(pdf_text,note):return note
    raise ValueError('SCOPE_BRIDGE_SAME_STATEMENT_HISTORICAL_NOTE_UNPROVEN')

def make_bridge(raw, url, current_period):
    if not original_origin(url) or current_period not in CURRENT:
        raise ValueError('SCOPE_BRIDGE_UNAPPROVED_CURRENT_ORIGIN')
    if not 1 <= len(raw) <= 5_000_000:
        raise ValueError('SCOPE_BRIDGE_NSE_ORIGINAL_SIZE_BOUND')
    return {'contract':CONTRACT,'nse_original_url':url,'current_period':current_period,
            'nse_original_sha256':hashlib.sha256(raw).hexdigest(),
            'nse_original_base64':base64.b64encode(raw).decode('ascii')}

def extract_with_scope_bridge(pdf, page_no, period, symbol, isin, legal, bridge, bank=False, insurer=False):
    if bridge.get('contract') != CONTRACT or period not in HISTORICAL:
        raise ValueError('SCOPE_BRIDGE_CONTRACT_OR_HISTORICAL_PERIOD_UNPROVEN')
    if not original_origin(bridge.get('nse_original_url','')) or bridge.get('current_period') not in CURRENT:
        raise ValueError('SCOPE_BRIDGE_UNAPPROVED_CURRENT_ORIGIN')
    encoded = bridge.get('nse_original_base64','')
    if not isinstance(encoded,str) or len(encoded) > 6_666_672:
        raise ValueError('SCOPE_BRIDGE_NSE_ORIGINAL_SIZE_BOUND')
    raw = base64.b64decode(encoded,validate=True)
    if not raw or hashlib.sha256(raw).hexdigest() != bridge.get('nse_original_sha256'):
        raise ValueError('SCOPE_BRIDGE_NSE_ORIGINAL_HASH_MISMATCH')
    html = raw.decode('utf-8-sig')
    nse_text,tables = parse_html(html)
    if (unique(tables,'description of presentation currency') != 'INR'
            or not exact_legal_identity(legal,unique(tables,'name of company') or '')):
        raise ValueError('SCOPE_BRIDGE_EXACT_ISSUER_OR_CURRENCY_UNPROVEN')
    nse = extract_tables(tables,symbol,isin,bridge['current_period'],bank,insurer)
    pdf_text = ' '.join(page.get_text('text') for page in list(pdf)[:40])
    if not exact_legal_identity(legal,' '.join(page.get_text('text') for page in list(pdf)[:3])):
        raise ValueError('SCOPE_BRIDGE_PDF_EXACT_ISSUER_UNPROVEN')
    if re.search(r'\b(?:restated|recast|pro[ -]?forma|carve[ -]?out)\b',nse_text+' '+pdf_text,re.I):
        raise ValueError('SCOPE_BRIDGE_BUSINESS_BASIS_REVIEW_REQUIRED')
    declared = {x.upper() for x in re.findall(r'\b(?:standalone|consolidated)\b',pdf_text,re.I)}
    if declared - {nse['scope']}:
        raise ValueError('SCOPE_BRIDGE_OTHER_DOCUMENT_SCOPE_PRESENT')
    note = common_statement_note(nse_text,pdf_text,period)
    board = dateval(unique(tables,'date of board meeting when results were approved') or '')
    if not board or not any(has_phrase(pdf_text,phrase) for phrase in date_phrases(board)):
        raise ValueError('SCOPE_BRIDGE_SAME_BOARD_DATE_UNPROVEN')
    page = pdf[page_no-1]
    first = extract_page(page,page_no,bridge['current_period'],bank,insurer,allow_comparative=True,scope_hint=nse['scope'])
    if (not first.get('scope_hint_used') or first['column_index'] != 0
            or first['first_column_period'] != bridge['current_period']
            or set(first['facts']) != set(nse['facts'])
            or any(Decimal(first['facts'][k]['value']) != Decimal(nse['facts'][k]['value'])
                   or first['facts'][k]['unit'] != nse['facts'][k]['unit'] for k in nse['facts'])):
        raise ValueError('SCOPE_BRIDGE_DATED_CURRENT_TRIO_MISMATCH')
    historical = extract_page(page,page_no,period,bank,insurer,allow_comparative=True,scope_hint=nse['scope'])
    if not historical.get('scope_hint_used'):
        raise ValueError('SCOPE_BRIDGE_NOT_AN_UNLABELLED_TABLE')
    return historical, {'contract':CONTRACT,'scope':nse['scope'],'historical_note':note,
                         'board_date':board,'current_period':bridge['current_period'],
                         'nse_original_url':bridge['nse_original_url'],
                         'nse_original_sha256':bridge['nse_original_sha256']}
