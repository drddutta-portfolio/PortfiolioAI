"""R4-local adapter for the explicitly identified legacy NSE insurance catalog."""
from urllib.parse import urlencode,urlparse
import re

API='https://www.nseindia.com/api/corporates-financial-results'
DATES={'30-Sep-2024','31-Dec-2024'}

def normalize(records,symbol):
    if symbol!='STARHEALTH':raise ValueError('UNAPPROVED_LEGACY_INSURANCE_ISSUER')
    if not isinstance(records,list):raise ValueError('INSURANCE_CATALOG_SCHEMA_UNKNOWN')
    out=[]
    for item in records:
        if not isinstance(item,dict) or item.get('symbol')!=symbol:continue
        end=item.get('periodEnd')
        if (end not in DATES or item.get('period')!='Quarterly'
            or item.get('cumulative')!='Non-cumulative'
            or item.get('insuranceType')!='General-Insurance'
            or item.get('consolidated') not in ('Consolidated','Non-Consolidated')):continue
        u=urlparse(item.get('xbrl',''))
        if (u.scheme!='https' or u.hostname!='nsearchives.nseindia.com' or u.query or u.fragment
            or not re.fullmatch(r'/corporate/xbrl/GI_[A-Za-z0-9_]+\.xml',u.path)):continue
        if 'toDate' in item and item['toDate']!=end:raise ValueError('CONFLICTING_INSURANCE_CATALOG_PERIOD')
        # Keep the complete returned row; the alias is only a parser input.
        out.append({**item,'toDate':end,'source_insurance_catalog_record':dict(item)})
    return out

def list_filings(session,symbol,ordinary):
    if symbol!='STARHEALTH':return ordinary(session,symbol)
    url=API+'?'+urlencode({'index':'insurance','symbol':symbol,'period':'Quarterly',
        'from_date':'01-10-2024','to_date':'01-03-2025'})
    response=session.get(url,timeout=30,headers={'Accept':'application/json',
        'Referer':'https://www.nseindia.com/companies-listing/corporate-filings-financial-results'})
    response.raise_for_status()
    if 'json' not in response.headers.get('content-type','').lower():raise ValueError('INSURANCE_CATALOG_NOT_JSON')
    return normalize(response.json(),symbol)

def verify_record(metadata,symbol):
    original=metadata.get('source_insurance_catalog_record')
    if not isinstance(original,dict) or normalize([original],symbol)!=[metadata]:
        raise ValueError('UNPROVEN_ORIGINAL_INSURANCE_CATALOG_RECORD')
