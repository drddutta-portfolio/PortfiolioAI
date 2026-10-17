"""Private, hash-checked transport for original-page review; no financial writes."""
import base64, importlib.util, json, os
from pathlib import Path
from collections import Counter
import psycopg

spec=importlib.util.spec_from_file_location('batch',Path(__file__).with_name('r4-bse-historical-batch.py'))
batch=importlib.util.module_from_spec(spec);spec.loader.exec_module(batch)

def main():
    url=os.environ['SUPABASE_DB_URL']
    if batch.REF not in url or os.environ.get('CLOUDFLARE_R2_BUCKET')!=batch.BUCKET:
        raise RuntimeError('DEVELOPMENT_ONLY')
    client=batch.r2_client();counts=Counter();index=[]
    with psycopg.connect(url) as db:
        cohort=batch.candidates(db);db.rollback()
        for symbol,isin,sid,_name,periods in cohort:
            entry={'symbol':symbol,'isin':isin,'security_id':str(sid),'periods':periods,'sources':[]}
            with db.cursor() as cur:
                cur.execute("SELECT DISTINCT ON(raw_payload->>'period_end') raw_payload,payload_hash FROM data_source_records WHERE record_kind='RESULTS_R4_BSE_DATED_PDF_REVIEW_V1' AND raw_payload->>'security_id'=%s ORDER BY raw_payload->>'period_end',retrieved_at DESC",(str(sid),))
                reviews=cur.fetchall()
            db.rollback();sources={}
            for review,digest in reviews:
                if batch.sha(batch.canonical(review))!=digest:raise ValueError('PRIVATE_INVENTORY_HASH_MISMATCH')
                for source in review.get('all_sources',[]):sources[source['original_sha256']]=source
            for digest,source in sources.items():
                outcome={'original_sha256':digest,'source_url':source['source_url']}
                try:
                    raw=client.get_object(Bucket=batch.BUCKET,Key=source['original_r2_key'])['Body'].read()
                    if batch.sha(raw)!=digest or not raw.startswith(b'%PDF'):raise ValueError('ORIGINAL_HASH_MISMATCH')
                    if len(raw)>32_000_000:raise ValueError('ORIGINAL_REVIEW_SIZE_BOUND')
                    encoded=batch.canonical({'contract':'PRIVATE_ORIGINAL_REVIEW_TRANSPORT_V1','original_sha256':digest,'original_base64':base64.b64encode(raw).decode('ascii')})
                    key=batch.PREFIX+'private-original-review/sha256='+digest+'/original.json'
                    batch.immutable_put(client,key,encoded)
                    outcome.update(review_r2_key=key,review_sha256=batch.sha(encoded),original_bytes=len(raw));counts['originals_available']+=1
                except Exception as error:
                    outcome['rejection']=str(error).split(':')[0] if isinstance(error,ValueError) else type(error).__name__;counts['originals_rejected']+=1
                entry['sources'].append(outcome)
            index.append(entry);counts['issuers_attempted']+=1
            print('R4_PRIVATE_ORIGINAL_REVIEW_PROGRESS',json.dumps(dict(counts)),flush=True)
        payload={'contract':'RESULTS_R4_PRIVATE_ORIGINAL_REVIEW_INDEX_V1','workflow_run_id':os.getenv('GITHUB_RUN_ID'),'source_commit':os.getenv('GITHUB_SHA'),'counts':dict(counts),'issuers':index}
        raw=batch.canonical(payload);digest=batch.sha(raw);key=batch.PREFIX+'private-original-review/index/sha256='+digest+'/index.json'
        batch.immutable_put(client,key,raw)
        metadata=batch.canonical({'contract':payload['contract'],'workflow_run_id':payload['workflow_run_id'],'source_commit':payload['source_commit'],'counts':dict(counts),'r2_key':key,'sha256':digest})
        with db.cursor() as cur:
            cur.execute("INSERT INTO data_source_records(source_code,record_kind,external_record_id,payload_hash,raw_payload,terms_snapshot) VALUES('COMPANY_EXCHANGE_FILING','RESULTS_R4_PRIVATE_ORIGINAL_REVIEW_INDEX_V1',%s,%s,%s::jsonb,'{\"retention\":\"PRIVATE_DEVELOPMENT_REVIEW_ONLY\"}'::jsonb) ON CONFLICT(source_code,record_kind,external_record_id,payload_hash) DO NOTHING",(payload['workflow_run_id'],batch.sha(metadata),metadata.decode()))
        db.commit()
    print('R4_PRIVATE_ORIGINAL_REVIEW_FINAL',json.dumps(dict(counts)),flush=True)

if __name__=='__main__':main()
