"""Review unlabelled PDF scopes against immutable accepted current-quarter trios.
No financial observations or selections are created by this review.
"""
import argparse,importlib.util,json,os,re
from collections import Counter,defaultdict
from decimal import Decimal
from pathlib import Path
import fitz,psycopg
from r4_pdf_geometry import extract_page
from r4_recovery_queue import task_id
spec=importlib.util.spec_from_file_location('batch',Path(__file__).with_name('r4-bse-historical-batch.py'));batch=importlib.util.module_from_spec(spec);spec.loader.exec_module(batch)
CURRENT={'2025-09-30','2025-12-31','2026-03-31','2026-06-30'}

def main():
    p=argparse.ArgumentParser();p.add_argument('--shard',type=int,required=True);a=p.parse_args()
    if not 0<=a.shard<4:raise RuntimeError('INVALID_SHARD')
    url=os.environ['SUPABASE_DB_URL']
    if batch.REF not in url or os.environ.get('CLOUDFLARE_R2_BUCKET')!=batch.BUCKET:raise RuntimeError('DEVELOPMENT_ONLY')
    client=batch.r2_client();counts=Counter()
    with psycopg.connect(url) as db:
        cohort=batch.candidates(db);db.rollback()
        for symbol,isin,sid,_name,periods in cohort:
            if int(task_id(sid,'SCOPE_ANCHOR_REVIEW',None,{}),16)%4!=a.shard:continue
            core={'EPS_DILUTED','NET_PROFIT_QUARTER','NET_INTEREST_INCOME_QUARTER' if symbol in batch.BANKS else 'NET_PREMIUM_EARNED_QUARTER' if symbol in batch.INSURERS else 'OPERATING_REVENUE_QUARTER'}
            results={p:[] for p in periods};rejects=Counter();anchors=[]
            try:
                with db.cursor() as cur:
                    cur.execute("""SELECT d.id::text,d.payload_hash,d.raw_payload,
                      jsonb_object_agg(o.metric_code,jsonb_build_object('value',o.numeric_value::text,'unit',o.unit,'observation_id',o.id::text))
                      FROM fundamental_observation_decisions x JOIN fundamental_observations o ON o.id=x.selected_observation_id
                      JOIN data_source_records d ON d.id=o.source_record_id
                      WHERE x.security_id=%s AND x.period_type='QUARTER' AND x.period_end=ANY(%s::date[])
                        AND o.source_code='COMPANY_EXCHANGE_FILING' AND o.currency='INR'
                        AND d.raw_payload->>'contract' IN ('PORTFOLIOAI_RESULTS_PUBLIC_FILING_V1','PORTFOLIOAI_RESULTS_VERIFIED_NSE_INTEGRATED_CURRENT_XBRL_V1')
                        AND o.metric_code=ANY(%s::text[])
                      GROUP BY d.id HAVING count(DISTINCT o.metric_code)=3 ORDER BY d.id LIMIT 16""",(sid,sorted(CURRENT),sorted(core)))
                    rows=cur.fetchall()
                    cur.execute("""SELECT raw_payload,payload_hash FROM data_source_records WHERE record_kind='RESULTS_R4_BSE_DATED_PDF_REVIEW_V1' AND raw_payload->>'security_id'=%s ORDER BY retrieved_at DESC LIMIT 1""",(str(sid),));review_row=cur.fetchone()
                db.rollback()
                for aid,digest,metadata,facts in rows:
                    if batch.sha(batch.canonical(metadata))!=digest:raise ValueError('CURRENT_ANCHOR_RECORD_HASH_MISMATCH')
                    if metadata.get('isin')!=isin or metadata.get('symbol')!=symbol or metadata.get('period_end') not in CURRENT:continue
                    if not re.fullmatch(r'https://nsearchives\.nseindia\.com/corporate/(?:ixbrl|xbrl)/[^?#]+',str(metadata.get('issuer_filing_url',''))):continue
                    raw=client.get_object(Bucket=batch.BUCKET,Key=metadata['r2_key'])['Body'].read()
                    if batch.sha(raw)!=metadata['r2_manifest_sha256'] or json.loads(raw)!={k:v for k,v in metadata.items() if k not in ('r2_key','r2_manifest_sha256')}:raise ValueError('CURRENT_ANCHOR_MANIFEST_MISMATCH')
                    if set(facts)!=core or any(Decimal(str(metadata['facts'][m]['value']))!=Decimal(facts[m]['value']) or metadata['facts'][m]['unit']!=facts[m]['unit'] for m in core):raise ValueError('CURRENT_ANCHOR_OBSERVATION_MISMATCH')
                    anchors.append({'source_record_id':aid,'payload_hash':digest,'metadata':metadata,'facts':facts})
                if not review_row:raise ValueError('PRIVATE_SOURCE_INVENTORY_MISSING')
                review,digest=review_row
                if batch.sha(batch.canonical(review))!=digest:raise ValueError('SOURCE_INVENTORY_HASH_MISMATCH')
                identity=review.get('bse_identity')
                if not identity or identity['header']['ISIN']!=isin or identity['listing']['ISIN_NUMBER']!=isin:raise ValueError('BSE_IDENTITY_UNAVAILABLE')
                for source in {s['original_sha256']:s for s in review.get('all_sources',[])}.values():
                    try:
                        raw=client.get_object(Bucket=batch.BUCKET,Key=source['original_r2_key'])['Body'].read()
                        if batch.sha(raw)!=source['original_sha256']:raise ValueError('ORIGINAL_HASH_MISMATCH')
                        with fitz.open(stream=raw,filetype='pdf') as pdf:
                            if not batch.issuer_identity(identity['issuer_name'],' '.join(p.get_text('text') for p in list(pdf)[:3])):raise ValueError('EXACT_LEGAL_NAME_UNPROVEN')
                            flags=sorted(set(re.findall(r'\b(?:restated|recast|pro[ -]?forma|carve[ -]?out)\b',' '.join(p.get_text('text') for p in list(pdf)[:40]),re.I)))
                            for page_no,page in enumerate(list(pdf)[:40],1):
                                matched=[]
                                for anchor in anchors:
                                    try:
                                        m=anchor['metadata'];first=extract_page(page,page_no,m['period_end'],symbol in batch.BANKS,symbol in batch.INSURERS,allow_comparative=True,scope_hint=m['consolidation_scope'])
                                        if not first.get('scope_hint_used') or first['column_index']!=0 or first['first_column_period']!=m['period_end']:continue
                                        if set(first['facts'])!=core or any(Decimal(first['facts'][k]['value'])!=Decimal(anchor['facts'][k]['value']) or first['facts'][k]['unit']!=anchor['facts'][k]['unit'] for k in core):continue
                                        revenue=next(k for k in core if k not in ('EPS_DILUTED','NET_PROFIT_QUARTER'))
                                        if Decimal(first['facts'][revenue]['value'])==0:continue
                                        matched.append((anchor,first))
                                    except ValueError:pass
                                scopes={x[0]['metadata']['consolidation_scope'] for x in matched}
                                if len(scopes)!=1:
                                    if len(scopes)>1:rejects['AMBIGUOUS_CURRENT_SCOPE_FINGERPRINT']+=1
                                    continue
                                anchor,first=matched[0];scope=anchor['metadata']['consolidation_scope']
                                for period in periods:
                                    try:
                                        historical=extract_page(page,page_no,period,symbol in batch.BANKS,symbol in batch.INSURERS,allow_comparative=True,scope_hint=scope)
                                        results[period].append({'parsed':historical,'current_pdf_trio':first,'current_anchor':anchor,'original_sha256':source['original_sha256'],'original_r2_key':source['original_r2_key'],'source_url':source['source_url'],'review_basis_flags':flags,'page_layout_review_required':page.rect.width>1000 or page.rect.height>1500,'document_scope_excerpts':[{'page':pi+1,'text':txt[max(0,match.start()-100):match.end()+220]} for pi,pdfpage in enumerate(list(pdf)[:40]) for txt in [pdfpage.get_text('text')] for match in list(re.finditer(r'\b(?:standalone|consolidated)\b',txt,re.I))[:4]][:16]})
                                        counts['matched_historical_candidates']+=1
                                    except ValueError as e:rejects[str(e).split(':')[0]]+=1
                    except Exception as e:rejects[str(e).split(':')[0] if isinstance(e,ValueError) else type(e).__name__]+=1
            except Exception as e:
                db.rollback();rejects['COMPANY_'+(str(e).split(':')[0] if isinstance(e,ValueError) else type(e).__name__)]+=1
            for period,candidates in results.items():
                value={'contract':'RESULTS_R4_SCOPE_ANCHOR_PDF_REVIEW_V1','diagnostic_only':True,'canonical_promotion_performed':False,'symbol':symbol,'isin':isin,'security_id':str(sid),'period_end':period,'anchors_checked':len(anchors),'candidates':candidates,'rejections':dict(rejects)}
                encoded=batch.canonical(value);digest=batch.sha(encoded);batch.immutable_put(client,batch.PREFIX+'scope-anchor-review/sha256='+digest+'/review.json',encoded)
                with db.cursor() as cur:
                    cur.execute("""INSERT INTO data_source_records(source_code,record_kind,external_record_id,payload_hash,raw_payload,terms_snapshot) VALUES('COMPANY_EXCHANGE_FILING','RESULTS_R4_SCOPE_ANCHOR_PDF_REVIEW_V1',%s,%s,%s::jsonb,'{"review_only":true,"retention":"PRIVATE_DEVELOPMENT_R2"}'::jsonb) ON CONFLICT(source_code,record_kind,external_record_id,payload_hash) DO NOTHING""",(str(sid)+':'+period,digest,encoded.decode()))
                db.commit();counts['slots_reviewed']+=1
            print('R4_SCOPE_ANCHOR_REVIEW_PROGRESS',json.dumps(dict(counts)),flush=True)
    print('R4_SCOPE_ANCHOR_REVIEW_FINAL',json.dumps(dict(counts)),flush=True)
if __name__=='__main__':main()
