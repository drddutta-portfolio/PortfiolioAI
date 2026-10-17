"""Full-cohort OCR recovery from immutable originals; each failure is isolated."""
import argparse,importlib.util,json,os,re
from collections import Counter,defaultdict
from pathlib import Path
import psycopg
from r4_ocr_dated_geometry import audit_document,extract_dated_periods,REVISION
from r4_issuer_name import exact_legal_identity
from r4_recovery_queue import task_id,run_with_timeout
spec=importlib.util.spec_from_file_location('batch',Path(__file__).with_name('r4-bse-historical-batch.py'));batch=importlib.util.module_from_spec(spec);spec.loader.exec_module(batch)

def cached(client,key,compute):
    try:return json.loads(client.get_object(Bucket=batch.BUCKET,Key=key)['Body'].read())
    except Exception as error:
        if getattr(error,'response',{}).get('Error',{}).get('Code') not in ('404','NoSuchKey','NotFound'):raise
    try:value={'result':compute()}
    except ValueError as error:value={'rejection':str(error).split(':')[0]}
    batch.immutable_put(client,key,batch.canonical(value));return value

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--shard',type=int,required=True);args=parser.parse_args()
    if not 0<=args.shard<8:raise RuntimeError('INVALID_SHARD')
    if os.environ.get('RESULTS_R4_DATED_PDF_ACK')!='EXPLICIT_QUARTER_ORIGINAL_REPLAY':raise RuntimeError('WRITES_NOT_AUTHORIZED')
    url=os.environ['SUPABASE_DB_URL']
    if batch.REF not in url or os.environ.get('CLOUDFLARE_R2_BUCKET')!=batch.BUCKET:raise RuntimeError('DEVELOPMENT_ONLY')
    # Negative page proofs are valid only for the parser that produced them.
    # A code repair must retry them, while unchanged runs reuse their evidence.
    engine=batch.sha(b"\0".join(Path(__file__).with_name(name).read_bytes() for name in ('r4_pdf_geometry.py','r4_ocr_geometry.py','r4_ocr_dated_geometry.py','r4_ocr_cli.py')))
    client=batch.r2_client();counts=Counter()
    with psycopg.connect(url) as db:
        cohort=batch.candidates(db);db.rollback()
        for symbol,isin,sid,_name,periods in cohort:
            if int(task_id(sid,'DATED_OCR',None,{}),16)%8!=args.shard:continue
            groups={p:defaultdict(list) for p in periods};rejects=Counter();originals_checked=0
            try:
                with db.cursor() as cur:
                    cur.execute("""SELECT raw_payload,payload_hash FROM data_source_records WHERE record_kind='RESULTS_R4_BSE_DATED_PDF_REVIEW_V1' AND raw_payload->>'security_id'=%s ORDER BY retrieved_at DESC LIMIT 1""",(str(sid),));row=cur.fetchone()
                db.rollback()
                if not row:raise ValueError('PRIVATE_SOURCE_INVENTORY_MISSING')
                review,digest=row
                if batch.sha(batch.canonical(review))!=digest:raise ValueError('REVIEW_HASH_MISMATCH')
                identity=review.get('bse_identity')
                if not isinstance(identity,dict):raise ValueError('CANONICAL_BSE_IDENTITY_UNAVAILABLE')
                legal=identity['issuer_name']
                originals={s['original_sha256']:s for s in review.get('all_sources',[])}
                for digest,source in originals.items():
                    try:
                        raw=client.get_object(Bucket=batch.BUCKET,Key=source['original_r2_key'])['Body'].read()
                        if batch.sha(raw)!=digest:raise ValueError('ORIGINAL_HASH_MISMATCH')
                        originals_checked+=1;counts['originals_checked']+=1
                        auditkey=batch.PREFIX+'ocr-dated-document-v1/original_version='+digest+'/audit.json'
                        stored=cached(client,auditkey,lambda:run_with_timeout(audit_document,(raw,),240))
                        if 'result' not in stored:raise ValueError(stored['rejection'])
                        audit=stored['result']
                        if audit['original_sha256']!=digest:raise ValueError('AUDIT_ORIGINAL_MISMATCH')
                        text=' '.join(audit['pages'])
                        if re.search(r'\b(?:pro[ -]?forma|carve[ -]?out)\b',text,re.I):raise ValueError('PROFORMA_OR_CARVEOUT_REVIEW_REQUIRED')
                        for page_no,page_text in enumerate(audit['pages'],1):
                            if not re.search(r'diluted',page_text,re.I) or not re.search(r'revenue|interest earned|premium',page_text,re.I):continue
                            key=batch.PREFIX+'ocr-dated-page-batch-v5/original_version='+digest+'/engine_version='+engine+'/page='+str(page_no)+'/proof.json'
                            proof=cached(client,key,lambda:run_with_timeout(extract_dated_periods,(raw,page_no,tuple(batch.WINDOWS),symbol in batch.BANKS,symbol in batch.INSURERS),240))
                            if 'result' not in proof:raise ValueError(proof['rejection'])
                            for period in periods:
                                try:
                                    response=proof['result'][period]
                                    if response.get('rejection'):raise ValueError(response['rejection'])
                                    parsed,checks=response['parsed'],response['checks']
                                    if not all(exact_legal_identity(legal,checks[k]) for k in ('issuer_text_first','issuer_text_second')):raise ValueError('DOUBLE_LEGAL_NAME_UNPROVEN')
                                    if parsed['first_column_period']!=period and re.search(r'\b(?:restated|recast)\b',text,re.I):raise ValueError('RESTATED_COMPARATIVE_REVIEW_REQUIRED')
                                    vector=tuple(sorted((k,v['value'],v['unit']) for k,v in parsed['facts'].items()))
                                    parsed.update(original_r2_key=source['original_r2_key'],selected_column_index=parsed['column_index'],ocr_document_audit_r2_key=auditkey,ocr_document_text_sha256=audit['text_sha256'],source_reporting_basis='AS_FILED_OWN_QUARTER' if parsed['first_column_period']==period else 'LATER_FILING_REPORTED_COMPARATIVE')
                                    groups[period][parsed['scope']].append((vector,parsed,source,raw))
                                except Exception as error:
                                    rejects[str(error).split(':')[0] if isinstance(error,ValueError) else type(error).__name__]+=1
                    except Exception as error:
                        rejects[str(error).split(':')[0] if isinstance(error,ValueError) else type(error).__name__]+=1
                    finally:
                        counts['originals_finished']=counts.get('originals_finished',0)+1
                        print('R4_DATED_OCR_ORIGINAL_PROGRESS',json.dumps(dict(counts)),flush=True)
            except Exception as error:
                db.rollback();rejects['COMPANY_'+(str(error).split(':')[0] if isinstance(error,ValueError) else type(error).__name__)]+=1
            for period in periods:
                inserted=0
                for scope,options in groups[period].items():
                    try:
                        if len({x[0] for x in options})!=1:raise ValueError('CONFLICTING_OCR_ORIGINAL_FULL_TRIOS')
                        vector,parsed,source,raw=sorted(options,key=lambda x:(x[1]['source_reporting_basis']!='AS_FILED_OWN_QUARTER',x[2]['original_sha256'],x[1]['page']))[0]
                        proof={**identity,'original_sha256':source['original_sha256'],'source_url':source['source_url']}
                        proofraw=batch.canonical(proof);digest=batch.sha(proofraw);key=batch.PREFIX+'bse-dated-identity/sha256='+digest+'/proof.json';batch.immutable_put(client,key,proofraw)
                        parsed.update(issuer_identity_evidence_r2_key=key,issuer_identity_evidence_sha256=digest)
                        inserted+=batch.persist(db,client,(symbol,isin,sid,legal,identity['bse_scrip_code']),period,source,raw,parsed,None)
                        counts['trios_ingested']+=1
                    except Exception as error:
                        db.rollback();rejects[str(error).split(':')[0] if isinstance(error,ValueError) else type(error).__name__]+=1
                outcome={'contract':'RESULTS_R4_DATED_OCR_AUDIT_V1','symbol':symbol,'isin':isin,'security_id':str(sid),'period_end':period,'originals_checked':originals_checked,'observations_inserted':inserted,'rejections':dict(rejects),'workflow_run_id':os.getenv('GITHUB_RUN_ID'),'workflow_run_attempt':os.getenv('GITHUB_RUN_ATTEMPT'),'source_commit':os.getenv('GITHUB_SHA'),'parser_engine':engine}
                encoded=batch.canonical(outcome);digest=batch.sha(encoded)
                batch.immutable_put(client,batch.PREFIX+'dated-ocr-audits/sha256='+digest+'/audit.json',encoded)
                with db.cursor() as cur:
                    cur.execute("""INSERT INTO data_source_records(source_code,record_kind,external_record_id,payload_hash,raw_payload,terms_snapshot) VALUES('COMPANY_EXCHANGE_FILING','RESULTS_R4_DATED_OCR_AUDIT_V1',%s,%s,%s::jsonb,'{"retention":"PRIVATE_STRUCTURED_REPLAY_AUDIT"}'::jsonb) ON CONFLICT(source_code,record_kind,external_record_id,payload_hash) DO NOTHING""",(str(sid)+':'+period,digest,encoded.decode()))
                db.commit();counts['slots_attempted']+=1;counts['observations_inserted']+=inserted
                print('R4_DATED_OCR_PROGRESS',json.dumps(dict(counts)),flush=True)
    print('R4_DATED_OCR_FINAL',json.dumps({'shard':args.shard,'counts':dict(counts)}),flush=True)
if __name__=='__main__':main()
