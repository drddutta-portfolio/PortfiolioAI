"""Reconcile one explicit issuer EPS correction; never prefer a newer date.

The original and revised exchange XML and the complete issuer correction PDF
are immutable content authorities. Only the proven superseded source is omitted
from selection; observations, other issuers/scopes/quarters and prior decisions
remain intact. EPS remains as reported, without a share-basis conversion.
"""
from collections import defaultdict
from decimal import Decimal
from hashlib import sha256
import re
import xml.etree.ElementTree as ET
import fitz
from r4_pdf_geometry import rows_for,row_text,dated_headers,CELL
from r4_issuer_name import exact_legal_identity

PREFIX='portfolioai-results/development/v1/quarterly/'
BUCKET='portfolioai-history-dev'
SYMBOL='AVANTIFEED';ISIN='INE871C01038';PERIOD='2025-12-31';START='2025-10-01'
SCOPE='CONSOLIDATED';CORE={'OPERATING_REVENUE_QUARTER','NET_PROFIT_QUARTER','EPS_DILUTED'}
OLD_URL='https://nsearchives.nseindia.com/corporate/xbrl/INTEGRATED_FILING_INDAS_1623305_11022026044628_WEB.xml'
NEW_URL='https://nsearchives.nseindia.com/corporate/xbrl/INTEGRATED_FILING_INDAS_1624523_12022026072549_WEB.xml'
NOTICE='https://nsearchives.nseindia.com/corporate/AVANTIFEEDS_12022026182807_BM_Revision_12022025.pdf'
OLD_SHA='a87d4548a89a975acae864b57a86dcfe908f8258d2a4f4885d9c5fc8ab4385ab'
NEW_SHA='651e0ce5ccc0e44f9dc0dc2fcb74d6fd24c87f5252bea7aca657cab65a199c21'
NOTICE_SHA='735387cc8b7d578089e980ed086ad12d4f5cc457145b66c2de6f71bd6715423b'


def digest(raw):return sha256(raw).hexdigest()
def local(tag):return tag.rsplit('}',1)[-1]
def key(digest,notice=False):return PREFIX+'evidence/original_version='+digest+('/issuer-correction.pdf' if notice else '/original-xbrl.xml')

def original_trio(raw,expected_hash):
    if (len(raw)>5_000_000 or digest(raw)!=expected_hash or b'<!DOCTYPE' in raw.upper() or b'<!ENTITY' in raw.upper()):
        raise ValueError('AVANTI_XML_ORIGINAL_UNPROVEN')
    root=ET.fromstring(raw)
    if local(root.tag)!='xbrl':raise ValueError('AVANTI_NOT_XBRL')
    def unique(name):
        values={(e.text or '').strip() for e in root if local(e.tag)==name and e.text}
        return next(iter(values)) if len(values)==1 else None
    if (unique('Symbol')!=SYMBOL or unique('ISIN')!=ISIN or unique('ScripCode')!='512573'
        or unique('NatureOfReportStandaloneConsolidated')!='Consolidated'
        or not exact_legal_identity('AVANTI FEEDS LIMITED',unique('NameOfTheCompany') or '')):
        raise ValueError('AVANTI_XML_IDENTITY_OR_SCOPE_UNPROVEN')
    contexts=[e for e in root if local(e.tag)=='context' and e.attrib.get('id')=='OneD']
    if len(contexts)!=1:raise ValueError('AVANTI_EXACT_QUARTER_CONTEXT_UNPROVEN')
    context=contexts[0]
    if (any(local(e.tag) in ('scenario','segment') for e in context.iter())
        or [(e.text or '').strip() for e in context.iter() if local(e.tag)=='startDate']!=[START]
        or [(e.text or '').strip() for e in context.iter() if local(e.tag)=='endDate']!=[PERIOD]
        or [(e.text or '').strip() for e in context.iter() if local(e.tag)=='identifier']!=['512573']):
        raise ValueError('AVANTI_QUARTER_DURATION_OR_ENTITY_UNPROVEN')
    units={e.attrib.get('id'):[x.text.strip() for x in e.iter() if local(x.tag)=='measure' and x.text] for e in root if local(e.tag)=='unit'}
    tags={'OPERATING_REVENUE_QUARTER':'RevenueFromOperations','NET_PROFIT_QUARTER':'ProfitLossForPeriod','EPS_DILUTED':'DilutedEarningsLossPerShareFromContinuingAndDiscontinuedOperations'}
    result={}
    for metric,tag in tags.items():
        values=set()
        for node in root:
            if local(node.tag)!=tag or node.attrib.get('contextRef')!='OneD':continue
            measures=units.get(node.attrib.get('unitRef'));eps=metric=='EPS_DILUTED'
            if measures not in ([['iso4217:INR','xbrli:shares'],['INR','shares']] if eps else [['iso4217:INR'],['INR']]):continue
            text=(node.text or '').strip()
            if not re.fullmatch(r'-?\d+(?:\.\d+)?',text):raise ValueError('AVANTI_ORIGINAL_DECIMAL_UNPROVEN')
            value=Decimal(text)/(1 if eps else Decimal(10000000))
            if not value.is_finite():raise ValueError('AVANTI_ORIGINAL_NONFINITE')
            values.add(value)
        if len(values)!=1:raise ValueError('AVANTI_EXACT_CORE_TRIO_UNPROVEN')
        result[metric]=values.pop()
    return result


def notice_eps(raw):
    """Read only the total-operation diluted EPS in the first dated quarter."""
    with fitz.open(stream=raw,filetype='pdf') as doc:
        if not 1<=len(doc)<=40:raise ValueError('AVANTI_NOTICE_PAGE_BOUND')
        page=doc[0];text=' '.join(page.get_text().split()).upper()
        required=('FEBRUARY 12, 2026','BSE CODE: 512573','NSE SYMBOL: AVANTIFEED',
            'MINOR CORRECTION IN THE CONSOLIDATED','DECEMBER 31, 2025',
            'SUBMITTED ON FEBRUARY 11, 2026','INADVERTENT ERROR CREPT IN EARNINGS PER SHARE',
            'OTHER THAN THE ABOVE, THE FINANCIAL RESULTS STAND UNCHANGED')
        if not all(x in text for x in required) or not exact_legal_identity('AVANTI FEEDS LIMITED',' '.join(p.get_text() for p in doc)):
            raise ValueError('AVANTI_EXPLICIT_EPS_CORRECTION_UNPROVEN')
        rows=rows_for(page);headers=[(y,d) for _,y,d in dated_headers(rows,True,True,True,True) if [x[0] for x in d[:3]]==[PERIOD,'2025-09-30','2024-12-31']]
        if len(headers)!=1:raise ValueError('AVANTI_NOTICE_QUARTER_COLUMNS_UNPROVEN')
        y,dates=headers[0];centres=[(a+b)/2 for _,a,b in dates]
        left=centres[0]-(centres[1]-centres[0])/2;right=(centres[0]+centres[1])/2
        if not any(0<y-yy<80 and re.search(r'\bquarter\s+ended\b',row_text(ws),re.I) for yy,ws in rows):
            raise ValueError('AVANTI_NOTICE_QUARTER_GROUP_UNPROVEN')
        labels=[];found=[]
        for yy,ws in rows:
            if yy<=y:continue
            label=row_text([w for w in ws if (w[0]+w[2])/2<left]);labels.append(label)
            context=' '.join(labels[-4:])
            if not re.search(r'\(b\)\s*Diluted\s*\(in\s*Rs\.?\)',label,re.I):continue
            if not re.search(r'For continuing\s*&\s*discontinued operations',context,re.I):continue
            cells=[str(w[4]) for w in ws if left<(w[0]+w[2])/2<right]
            if len(cells)!=1 or not CELL.fullmatch(cells[0]):raise ValueError('AVANTI_LITERAL_EPS_CELL_UNPROVEN')
            found.append(Decimal(cells[0].replace(',','').replace('(','-').replace(')','')))
        if len(found)!=1:raise ValueError('AVANTI_TOTAL_OPERATION_DILUTED_EPS_UNPROVEN')
        return found[0]


def validate_originals(old,new,notice):
    if not notice.startswith(b'%PDF') or digest(notice)!=NOTICE_SHA:raise ValueError('AVANTI_CORRECTION_ORIGINAL_HASH_MISMATCH')
    a,b=original_trio(old,OLD_SHA),original_trio(new,NEW_SHA);eps=notice_eps(notice)
    if (a['EPS_DILUTED']==b['EPS_DILUTED'] or eps!=b['EPS_DILUTED']
        or any(a[k]!=b[k] for k in CORE-{'EPS_DILUTED'})):
        raise ValueError('AVANTI_NOTICE_AND_ORIGINALS_DO_NOT_RECONCILE')
    return a,b


def qualify(facts,client):
    relevant=[r for r in facts if r['symbol']==SYMBOL and str(r['period_end'])==PERIOD
        and r['consolidation_scope']==SCOPE and r['source_url'] in (OLD_URL,NEW_URL)]
    if not relevant:return facts,False
    try:
        originals=[client.get_object(Bucket=BUCKET,Key=key(d,n))['Body'].read() for d,n in ((OLD_SHA,False),(NEW_SHA,False),(NOTICE_SHA,True))]
        old,new=validate_originals(*originals)
        groups=defaultdict(dict);source_urls={}
        for row in relevant:
            if (row['isin']!=ISIN or str(row['period_start'])!=START or row['currency']!='INR'
                or row['metric_code'] not in CORE or row['unit']!=('INR_PER_SHARE' if row['metric_code']=='EPS_DILUTED' else 'INR_CRORE')
                or row['raw_payload'].get('contract')!='PORTFOLIOAI_RESULTS_VERIFIED_NSE_INTEGRATED_CURRENT_XBRL_V1'
                or row['raw_payload'].get('original_sha256_unretained')!=(OLD_SHA if row['source_url']==OLD_URL else NEW_SHA)):
                return facts,False
            sid=str(row['source_record_id']);metric=row['metric_code']
            if metric in groups[sid]:return facts,False
            source_urls[sid]=row['source_url'];groups[sid][metric]=Decimal(str(row['numeric_value']))
        if set(source_urls.values())!={OLD_URL,NEW_URL}:return facts,False
        if any(values!=(old if source_urls[sid]==OLD_URL else new) for sid,values in groups.items()):return facts,False
    except Exception:return facts,False
    omitted={id(r) for r in relevant if r['source_url']==OLD_URL}
    return [r for r in facts if id(r) not in omitted],True


def retain(batch,client):
    import requests
    for url,expected,notice in ((OLD_URL,OLD_SHA,False),(NEW_URL,NEW_SHA,False),(NOTICE,NOTICE_SHA,True)):
        response=requests.get(url,timeout=45,allow_redirects=False,headers={'User-Agent':'Mozilla/5.0'});response.raise_for_status()
        if response.status_code!=200 or digest(response.content)!=expected:raise ValueError('AVANTI_FETCHED_ORIGINAL_VERSION_MISMATCH')
        batch.immutable_put(client,key(expected,notice),response.content)
    values=[client.get_object(Bucket=BUCKET,Key=key(d,n))['Body'].read() for d,n in ((OLD_SHA,False),(NEW_SHA,False),(NOTICE_SHA,True))]
    validate_originals(*values)
