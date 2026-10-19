"""Replay all missing historical slots from private original PDFs, then ingest.

Ingestion creates immutable observations. Only the separate independent full
cohort verifier may create selections. Failures never block the next slot.
"""
import argparse,importlib.util,json,os
from collections import Counter,defaultdict
from pathlib import Path
import fitz,psycopg
from r4_pdf_geometry import extract_page
from r4_bse_dated_proof import replay_document,REVISION
from r4_recovery_queue import run_with_timeout,native_shard_for
spec=importlib.util.spec_from_file_location('batch',Path(__file__).with_name('r4-bse-historical-batch.py'))
batch=importlib.util.module_from_spec(spec);spec.loader.exec_module(batch)

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--shard',type=int,default=0);parser.add_argument('--shards',type=int,default=1);args=parser.parse_args()
    if not 1<=args.shards<=16 or not 0<=args.shard<args.shards:raise RuntimeError('INVALID_NATIVE_SHARD')
    if os.environ.get('RESULTS_R4_DATED_PDF_ACK')!='EXPLICIT_QUARTER_ORIGINAL_REPLAY':raise RuntimeError('WRITES_NOT_AUTHORIZED')
    url=os.environ['SUPABASE_DB_URL']
    if batch.REF not in url or os.environ.get('CLOUDFLARE_R2_BUCKET')!=batch.BUCKET:raise RuntimeError('DEVELOPMENT_ONLY')
    engine=batch.sha(b"\0".join(Path(__file__).with_name(name).read_bytes() for name in ('r4_pdf_geometry.py','r4_bse_dated_proof.py','r4_issuer_name.py')))
    client=batch.r2_client();counts=Counter()
    with psycopg.connect(url) as db:
        cohort=batch.candidates(db);db.rollback()
        for symbol,isin,sid,_name,periods in cohort:
            if native_shard_for(sid,args.shards)!=args.shard:continue
            replayed={}
            for period in periods:
                outcome={'contract':'RESULTS_R4_BSE_DATED_PROMOTION_AUDIT_V1','shard':args.shard,'shards':args.shards,'symbol':symbol,'isin':isin,'security_id':str(sid),'period_end':period,'rejections':{},'originals_replayed':0,'observations_inserted':0,'workflow_run_id':os.getenv('GITHUB_RUN_ID'),'workflow_run_attempt':os.getenv('GITHUB_RUN_ATTEMPT'),'source_commit':os.getenv('GITHUB_SHA'),'parser_engine':engine}
                rejects=Counter();grouped=defaultdict(list)
                try:
                    with db.cursor() as cur:
                        cur.execute("""SELECT raw_payload,payload_hash FROM data_source_records WHERE record_kind='RESULTS_R4_BSE_DATED_PDF_REVIEW_V1' AND raw_payload->>'security_id'=%s AND raw_payload->>'period_end'=%s ORDER BY retrieved_at DESC LIMIT 1""",(str(sid),period));row=cur.fetchone()
                    db.rollback()
                    if not row:raise ValueError('PRIVATE_SOURCE_INVENTORY_NOT_AVAILABLE')
                    review,reviewhash=row
                    if batch.sha(batch.canonical(review))!=reviewhash:raise ValueError('PRIVATE_REVIEW_HASH_MISMATCH')
                    identity=review.get('bse_identity')
                    if not identity:raise ValueError('CANONICAL_BSE_IDENTITY_UNAVAILABLE')
                    originals={s['original_sha256']:s for s in review.get('all_sources',[])}
                    for digest,source in originals.items():
                        try:
                            if digest not in replayed:
                                stable_identity={'issuer_name':identity['issuer_name'],'bse_scrip_code':identity['bse_scrip_code'],'header':{k:identity['header'][k] for k in ('SecurityCode','ISIN')},'listing':{k:identity['listing'][k] for k in ('SCRIP_CD','ISIN_NUMBER','Issuer_Name')}}
                                context={'symbol':symbol,'original_sha256':digest,'identity':stable_identity,'source_url':source['source_url'],'periods':sorted(periods),'parser_engine':engine}
                                cachehash=batch.sha(batch.canonical(context))
                                cachekey=batch.PREFIX+'native-dated-replay-v1/sha256='+cachehash+'/proof.json'
                                raw=None;stored=None
                                try:
                                    stored=json.loads(client.get_object(Bucket=batch.BUCKET,Key=cachekey)['Body'].read())
                                    if stored.get('context')!=context:raise ValueError('NATIVE_REPLAY_CACHE_CONTEXT_MISMATCH')
                                except Exception as error:
                                    if getattr(error,'response',{}).get('Error',{}).get('Code') not in ('404','NoSuchKey','NotFound'):raise
                                try:
                                    if stored is None:
                                        raw=client.get_object(Bucket=batch.BUCKET,Key=source['original_r2_key'])['Body'].read()
                                        parsed_all=run_with_timeout(replay_document,(raw,symbol,tuple(periods),identity,source),90)
                                        stored={'context':context,'result':parsed_all}
                                        batch.immutable_put(client,cachekey,batch.canonical(stored))
                                        counts['originals_processed']+=1
                                    else:counts['original_replays_reused']+=1
                                    if any(entry['options'] for entry in stored['result'].values()) and raw is None:
                                        raw=client.get_object(Bucket=batch.BUCKET,Key=source['original_r2_key'])['Body'].read()
                                    if raw is not None and batch.sha(raw)!=digest:raise ValueError('ORIGINAL_HASH_MISMATCH')
                                    replayed[digest]={'raw':raw,'result':stored['result']}
                                except Exception as error:
                                    # Transient timeouts are not durably cached.
                                    replayed[digest]={'error':type(error).__name__}
                                print('R4_DATED_ORIGINAL_PROGRESS',json.dumps(dict(counts)),flush=True)
                            cached=replayed[digest]
                            if 'error' in cached:
                                rejects['SOURCE_'+cached['error']]+=1;continue
                            raw=cached['raw'];response=cached['result'][period]
                            outcome['originals_replayed']+=1;rejects.update(response['rejections'])
                            for entry in response['options']:
                                parsed=entry['parsed'];proof=entry['proof'];basis=entry['basis']
                                vector=tuple(sorted((k,v['value'],v['unit']) for k,v in parsed['facts'].items()))
                                grouped[parsed['scope']].append((vector,parsed,source,raw,proof,basis))
                        except Exception as error:rejects['SOURCE_'+type(error).__name__]+=1
                    for scope,options in sorted(grouped.items()):
                        if len({x[0] for x in options})!=1:
                            rejects['CONFLICTING_DATED_ORIGINAL_FULL_TRIOS']+=1;continue
                        vector,parsed,source,raw,proof,basis=sorted(options,key=lambda x:(x[5]!='AS_FILED_OWN_QUARTER',x[2]['original_sha256'],x[1]['page']))[0]
                        proofraw=batch.canonical(proof);proofhash=batch.sha(proofraw)
                        key=batch.PREFIX+'bse-dated-identity/sha256='+proofhash+'/proof.json';batch.immutable_put(client,key,proofraw)
                        parsed.update(original_r2_key=source['original_r2_key'],selected_column_index=parsed['column_index'],issuer_identity_evidence_r2_key=key,issuer_identity_evidence_sha256=proofhash,source_reporting_basis=basis)
                        n=batch.persist(db,client,(symbol,isin,sid,identity['issuer_name'],identity['bse_scrip_code']),period,source,raw,parsed,None)
                        outcome['observations_inserted']+=n;counts['source_qualified_trios_ingested']+=1;counts['observations_inserted']+=n
                except Exception as error:
                    db.rollback();rejects['SLOT_'+(str(error).split(':')[0] if isinstance(error,ValueError) else type(error).__name__)]+=1
                outcome['rejections']=dict(rejects)
                encoded=batch.canonical(outcome);digest=batch.sha(encoded);key=batch.PREFIX+'bse-dated-promotion-audit/sha256='+digest+'/audit.json';batch.immutable_put(client,key,encoded)
                with db.cursor() as cur:
                    cur.execute("""INSERT INTO data_source_records(source_code,record_kind,external_record_id,payload_hash,raw_payload,terms_snapshot) VALUES('COMPANY_EXCHANGE_FILING','RESULTS_R4_BSE_DATED_PROMOTION_AUDIT_V1',%s,%s,%s::jsonb,'{"retention":"PRIVATE_STRUCTURED_REPLAY_AUDIT"}'::jsonb) ON CONFLICT(source_code,record_kind,external_record_id,payload_hash) DO NOTHING""",(str(sid)+':'+period,digest,encoded.decode()))
                db.commit();counts['slots_attempted']+=1
                print('R4_DATED_PDF_REPLAY_PROGRESS',json.dumps(dict(counts)),flush=True)
    print('R4_DATED_PDF_REPLAY_FINAL',json.dumps(dict(counts)),flush=True)
if __name__=='__main__':main()
