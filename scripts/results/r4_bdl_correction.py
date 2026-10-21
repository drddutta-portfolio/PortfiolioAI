"""Reconcile BDL's March 2025 XML tax-sign discrepancy to its signed results.

This is a closed original-content proof, never a filing-date preference. Immutable
observations remain intact. The original audited statement page was independently
inspected: INR lakh, standalone, quarter ended 31 March 2025; revenue 177697.64,
PBT 37817.50, total tax 10540.31, total PAT 27277.19, diluted EPS 7.44.
"""
from collections import defaultdict
from decimal import Decimal
from hashlib import sha256
import fitz

PREFIX='portfolioai-results/development/v1/quarterly/'
BUCKET='portfolioai-history-dev'
PDF_SHA='b0fb2f3219b779817f533c03f1635d9fa5834cb647c3029a831670a76b3f76ec'
IMAGE_SHA='b3a622310215932412f7bcb49953651d0e51cf43169ed2c883d71f66eac3c5e8'
STATEMENT_URL='https://www.bseindia.com/xml-data/corpfiling/AttachHis/8d67cbdc-f47a-4f49-a1bf-bc871fc947d7.pdf'
OLD={'4042f9e5-f946-4c28-b648-ab1d4f7fa56f','781081d5-e1ac-4a8f-a100-18d40ab03ed6'}
NEW={'59195a01-8245-46ce-99f4-a1269a228473','e53498b8-92b2-44ba-86e7-d5e81cea10f6'}
OLD_BRIDGE='781081d5-e1ac-4a8f-a100-18d40ab03ed6'
NEW_BRIDGE='e53498b8-92b2-44ba-86e7-d5e81cea10f6'
OLD_SHA='ac188f557b91487662d880069c5842807fa3f3aa8866b566bffddd517976cc54'
NEW_SHA='bbdac59e17cc820eac950eb1fd86ef972d2e0c44ca345d8a94c175a9640170dd'
OLD_URL='https://nsearchives.nseindia.com/corporate/xbrl/INTEGRATED_FILING_INDAS_1453824_27052025101051_WEB.xml'
NEW_URL='https://nsearchives.nseindia.com/corporate/xbrl/INTEGRATED_FILING_INDAS_1499830_01082025100913_WEB.xml'
CORRECT={'OPERATING_REVENUE_QUARTER':Decimal('1776.9764'),'NET_PROFIT_QUARTER':Decimal('272.7719'),'EPS_DILUTED':Decimal('7.44')}
ORIGINAL={**CORRECT,'NET_PROFIT_QUARTER':Decimal('217.6969')}

def validate_statement(raw):
    if not raw.startswith(b'%PDF') or sha256(raw).hexdigest()!=PDF_SHA:
        raise ValueError('BDL_SIGNED_ORIGINAL_HASH_MISMATCH')
    with fitz.open(stream=raw,filetype='pdf') as pdf:
        if not 2<=len(pdf)<=40:raise ValueError('BDL_SIGNED_PAGE_BOUND')
        image=pdf[1].get_pixmap(dpi=110,alpha=False).tobytes('jpeg',jpg_quality=65)
        if sha256(image).hexdigest()!=IMAGE_SHA:raise ValueError('BDL_INSPECTED_STATEMENT_IMAGE_CHANGED')

def qualify(facts,client):
    relevant=[r for r in facts if r['symbol']=='BDL' and str(r['period_end'])=='2025-03-31'
              and r['consolidation_scope']=='STANDALONE' and str(r['source_record_id']) in OLD|NEW]
    groups=defaultdict(dict)
    for row in relevant:
        sid=str(row['source_record_id']);old=sid in OLD
        if (row['isin']!='INE171Z01026' or str(row['period_start'])!='2025-01-01'
            or row['currency']!='INR' or row['source_url']!=(OLD_URL if old else NEW_URL)
            or row['unit']!=('INR_PER_SHARE' if row['metric_code']=='EPS_DILUTED' else 'INR_CRORE')):
            return facts,False
        payload=row['raw_payload'];digest=payload.get('original_sha256_retained',payload.get('original_sha256_unretained'))
        if digest!=(OLD_SHA if old else NEW_SHA):return facts,False
        metric=row['metric_code']
        if metric in groups[sid]:return facts,False
        groups[sid][metric]=Decimal(str(row['numeric_value']))
    if not {OLD_BRIDGE,NEW_BRIDGE}.issubset(groups):return facts,False
    if any(values!=(ORIGINAL if sid in OLD else CORRECT) for sid,values in groups.items()):return facts,False
    try:
        for digest in (OLD_SHA,NEW_SHA):
            raw=client.get_object(Bucket=BUCKET,Key=PREFIX+'evidence/original_version='+digest+'/original-xbrl.xml')['Body'].read()
            if sha256(raw).hexdigest()!=digest or b'<!DOCTYPE' in raw.upper():return facts,False
        raw=client.get_object(Bucket=BUCKET,Key=PREFIX+'evidence/original_version='+PDF_SHA+'/issuer-original.pdf')['Body'].read()
        validate_statement(raw)
    except Exception:return facts,False
    # Both exact XML originals and the exact inspected signed statement must
    # still be accessible. The old PAT disagrees with the signed total-tax/PAT
    # cells; the corrected complete trio agrees. No source vote or recency rule.
    excluded={id(row) for row in relevant if str(row['source_record_id']) in OLD}
    return [row for row in facts if id(row) not in excluded],True
