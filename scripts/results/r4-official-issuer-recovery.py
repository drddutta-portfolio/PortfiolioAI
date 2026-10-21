"""Development-only official issuer collection; isolated original failures."""
import argparse,importlib.util,json,os,re,html,time
from collections import Counter
from datetime import datetime,timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin,urlparse
from r4_official_issuer import CONTRACT,KIND,ISSUERS,PERIODS,approved_url,extract_original,canonical,sha,discover,get
from r4_recovery_queue import run_with_timeout

def load_runtime():
    spec=importlib.util.spec_from_file_location('batch',Path(__file__).with_name('r4-bse-historical-batch.py'))
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    return module

def download_original(session,symbol,url):
    raw,final_url=get(session,symbol,url,32_000_000)
    if not raw.startswith(b'%PDF'):raise ValueError('OFFICIAL_ORIGINAL_NOT_PDF')
    return raw,final_url

def extract_all(raw,symbol,periods):
    from r4_ocr_dated_geometry import audit_document,extract_dated_periods
    audit=audit_document(raw);out={p:[] for p in periods};rejects=Counter()
    for period in periods:
        try:out[period]=extract_original(raw,symbol,period,document_audit=audit)
        except ValueError as error:rejects[str(error).split(':')[0]]+=1
    pending=[p for p in periods if not out[p]]
    for n,text in enumerate(audit['pages'],1):
        if not pending:break
        if not re.search('diluted',text,re.I) or not re.search(r'revenue|premium.*earned',text,re.I):continue
        proofs=extract_dated_periods(raw,n,pending,False,symbol=='STARHEALTH')
        for period in pending[:]:
            proof=proofs[period]
            if proof.get('rejection'):rejects[proof['rejection']]+=1;continue
            parsed=proof['parsed']
            try:
                out[period]=extract_original(raw,symbol,period,'OCR',n,parsed['ocr_render_dpi'],parsed['ocr_segmentation_mode'],audit)
                if out[period]:pending.remove(period)
            except ValueError as error:rejects[str(error).split(':')[0]]+=1
    return {'periods':out,'rejections':dict(rejects)}

def persist(db,client,row,period,url,raw,parsed):
    symbol,isin,sid,_name,_periods=row;digest=sha(raw)
    original_key=batch.PREFIX+'evidence/original_version='+digest+'/issuer-original.pdf'
    batch.immutable_put(client,original_key,raw)
    payload={'contract':CONTRACT,'symbol':symbol,'isin':isin,'sourceUrl':url,'original_sha256':digest,
        'original_r2_key':original_key,'period_end':period,'parsed':parsed,
        'authority':'CURRENT_DISPLAY_ONLY; NO_POINT_IN_TIME_OR_SHARE_REBASING_AUTHORITY'}
    encoded=canonical(payload);version=sha(encoded);external=':'.join((symbol,period,parsed['scope'],digest))
    batch.immutable_put(client,batch.PREFIX+'official-issuer-manifests/sha256='+version+'/manifest.json',encoded)
    with db.cursor() as cur:
        cur.execute("""INSERT INTO data_source_records(source_code,record_kind,external_record_id,source_url,payload_hash,raw_payload,terms_snapshot)
            VALUES('COMPANY_EXCHANGE_FILING',%s,%s,%s,%s,%s::jsonb,'{"retention":"ORIGINAL_ISSUER_PDF_PRIVATE_R2; INDEPENDENT_SELECTION_REQUIRED"}'::jsonb)
            ON CONFLICT(source_code,record_kind,external_record_id,payload_hash) DO NOTHING RETURNING id""",(KIND,external,url,version,encoded.decode()))
        found=cur.fetchone()
        if not found:
            cur.execute("SELECT id FROM data_source_records WHERE source_code='COMPANY_EXCHANGE_FILING' AND record_kind=%s AND external_record_id=%s AND payload_hash=%s",(KIND,external,version));found=cur.fetchone()
        if not found:raise ValueError('OFFICIAL_SOURCE_READBACK_MISSING')
        source_id=found[0];inserted=0
        for metric,fact in parsed['facts'].items():
            cur.execute("""INSERT INTO fundamental_observations(security_id,metric_code,source_record_id,source_code,numeric_value,currency,unit,
                period_start,period_end,period_type,consolidation_scope,retrieved_at,fresh_until,evidence_status)
                VALUES(%s,%s,%s,'COMPANY_EXCHANGE_FILING',%s,'INR',%s,%s,%s,'QUARTER',%s,now(),now()+interval '120 days','AVAILABLE')
                ON CONFLICT(security_id,metric_code,source_code,period_end,period_type,consolidation_scope,source_record_id) DO NOTHING RETURNING id""",
                (sid,metric,source_id,fact['value'],fact['unit'],PERIODS[period],period,parsed['scope']))
            inserted+=int(cur.fetchone() is not None)
    db.commit();return inserted

def checkpoint(db,client,outcome,counts,shard):
    report={'contract':'RESULTS_R4_OFFICIAL_ISSUER_COLLECTION_AUDIT_V1','workflow_run_id':os.environ['GITHUB_RUN_ID'],
        'source_commit':os.environ['GITHUB_SHA'],'counts':dict(counts),'issuers':[outcome]}
    encoded=canonical(report);digest=sha(encoded)
    batch.immutable_put(client,batch.PREFIX+'official-issuer-audits/sha256='+digest+'/audit.json',encoded)
    external=':'.join((os.environ['GITHUB_RUN_ID'],str(shard),outcome['symbol'],str(outcome.get('original_urls_attempted',0))))
    with db.cursor() as cur:
        cur.execute("""INSERT INTO data_source_records(source_code,record_kind,external_record_id,payload_hash,raw_payload,terms_snapshot)
            VALUES('COMPANY_EXCHANGE_FILING','RESULTS_R4_OFFICIAL_ISSUER_COLLECTION_AUDIT_V1',%s,%s,%s::jsonb,'{"retention":"STRUCTURED_OPERATIONAL_AUDIT; ORIGINALS_PRIVATE_R2"}'::jsonb)
            ON CONFLICT(source_code,record_kind,external_record_id,payload_hash) DO NOTHING""",(external,digest,encoded.decode()))
    db.commit()

def main():
    global batch
    import requests,psycopg
    batch=load_runtime()
    parser=argparse.ArgumentParser();parser.add_argument('--shard',type=int,required=True);args=parser.parse_args()
    if args.shard not in range(4):raise RuntimeError('INVALID_SHARD')
    if os.getenv('GITHUB_REPOSITORY')!='drddutta-portfolio/PortfiolioAI' or os.getenv('GITHUB_REF')!='refs/heads/PortfolioAI-Development':
        raise RuntimeError('DEVELOPMENT_BRANCH_REQUIRED')
    if batch.REF not in os.environ['SUPABASE_DB_URL'] or os.environ.get('CLOUDFLARE_R2_BUCKET')!=batch.BUCKET:raise RuntimeError('DEVELOPMENT_ONLY')
    client=batch.r2_client();counts=Counter();audit_rows=[]
    engine=sha(b'\0'.join(Path(__file__).with_name(n).read_bytes() for n in ('r4_official_issuer.py','r4_pdf_geometry.py','r4_ocr_dated_geometry.py','r4_ocr_geometry.py','r4_ocr_cli.py')))
    with psycopg.connect(os.environ['SUPABASE_DB_URL']) as db,requests.Session() as session:
        session.headers['User-Agent']='Mozilla/5.0'
        cohort=batch.candidates(db);db.rollback()
        for row in cohort:
            symbol,isin,sid,_name,periods=row
            if int(sid.int)%4!=args.shard:continue
            outcome={'symbol':symbol,'security_id':str(sid),'periods':periods,'counts':{},'rejections':{}}
            rejects=Counter()
            if symbol not in ISSUERS:
                outcome['rejections']={'OFFICIAL_DISCOVERY_PAGE_NOT_CONFIGURED':1};audit_rows.append(outcome);continue
            urls,discovery_errors=discover(session,symbol);rejects.update(discovery_errors)
            with db.cursor() as cur:
                cur.execute("""SELECT x->>'next_offset' FROM data_source_records d CROSS JOIN LATERAL jsonb_array_elements(d.raw_payload->'issuers') x
                    WHERE d.record_kind='RESULTS_R4_OFFICIAL_ISSUER_COLLECTION_AUDIT_V1' AND x->>'symbol'=%s
                    ORDER BY d.retrieved_at DESC LIMIT 1""",(symbol,));previous=cur.fetchone()
            db.rollback();offset=int(previous[0] or 0)%len(urls) if previous and urls else 0
            ordered=urls[offset:]+urls[:offset];started=time.monotonic();attempted=0
            for url in ordered:
                if time.monotonic()-started>=480:
                    rejects['ISSUER_TIME_BUDGET_RESUME_NEXT_PASS']+=1
                    break
                try:
                    raw,final_url=download_original(session,symbol,url)
                    digest=sha(raw);batch.immutable_put(client,batch.PREFIX+'evidence/original_version='+digest+'/issuer-original.pdf',raw)
                    counts['originals_retained']+=1
                    cachekey=batch.PREFIX+'official-issuer-replays/symbol='+symbol+'/engine='+engine+'/original='+digest+'/periods='+sha(canonical(periods))+'/proof.json'
                    try:proof=json.loads(client.get_object(Bucket=batch.BUCKET,Key=cachekey)['Body'].read())
                    except Exception as error:
                        if getattr(error,'response',{}).get('Error',{}).get('Code') not in ('404','NoSuchKey','NotFound'):raise
                        proof=run_with_timeout(extract_all,(raw,symbol,periods),180)
                        batch.immutable_put(client,cachekey,canonical(proof))
                    rejects.update(proof['rejections'])
                    for period,parsed_options in proof['periods'].items():
                        for parsed in parsed_options:counts['observations_inserted']+=persist(db,client,row,period,final_url,raw,parsed)
                except Exception as error:
                    db.rollback();rejects[str(error).split(':')[0] if isinstance(error,ValueError) else type(error).__name__]+=1
                    if isinstance(error,(NameError,AttributeError,TypeError)):counts['programming_failures']+=1
                finally:
                    counts['originals_attempted']+=1
                    attempted+=1
                    outcome.update(rejections=dict(rejects),original_urls_attempted=attempted,
                        original_urls_discovered=len(urls),next_offset=(offset+attempted)%len(urls) if urls else 0)
                    checkpoint(db,client,outcome,counts,args.shard)
                    print('R4_OFFICIAL_ORIGINAL_PROGRESS',json.dumps(dict(counts)),flush=True)
            outcome['rejections']=dict(rejects);outcome['original_urls_attempted']=attempted
            outcome['original_urls_discovered']=len(urls);outcome['next_offset']=(offset+attempted)%len(urls) if urls else 0
            audit_rows.append(outcome);counts['issuers_attempted']+=1
        report={'contract':'RESULTS_R4_OFFICIAL_ISSUER_COLLECTION_AUDIT_V1','workflow_run_id':os.environ['GITHUB_RUN_ID'],'source_commit':os.environ['GITHUB_SHA'],'counts':dict(counts),'issuers':audit_rows}
        encoded=canonical(report);digest=sha(encoded);key=batch.PREFIX+'official-issuer-audits/sha256='+digest+'/audit.json';batch.immutable_put(client,key,encoded)
        with db.cursor() as cur:
            cur.execute("""INSERT INTO data_source_records(source_code,record_kind,external_record_id,payload_hash,raw_payload,terms_snapshot)
                VALUES('COMPANY_EXCHANGE_FILING','RESULTS_R4_OFFICIAL_ISSUER_COLLECTION_AUDIT_V1',%s,%s,%s::jsonb,'{"retention":"STRUCTURED_OPERATIONAL_AUDIT; ORIGINALS_PRIVATE_R2"}'::jsonb)
                ON CONFLICT(source_code,record_kind,external_record_id,payload_hash) DO NOTHING""",(os.environ['GITHUB_RUN_ID']+':'+str(args.shard),digest,encoded.decode()))
        db.commit()
    print('R4_OFFICIAL_ORIGINAL_FINAL',json.dumps(dict(counts)),flush=True)
    if counts.get('programming_failures'):raise RuntimeError('OFFICIAL_COLLECTOR_PROGRAMMING_ERRORS_CHECKPOINTED')

if __name__=='__main__':main()

