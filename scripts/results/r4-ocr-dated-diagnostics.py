"""Private OCR header geometry for already rejected pages; no financial writes."""
import argparse,importlib.util,json,os,re
from collections import Counter
from pathlib import Path
import fitz,psycopg
from r4_ocr_geometry import OCRPage
from r4_pdf_geometry import rows_for,row_text,dated_headers
from r4_recovery_queue import task_id
spec=importlib.util.spec_from_file_location('batch',Path(__file__).with_name('r4-bse-historical-batch.py'));batch=importlib.util.module_from_spec(spec);spec.loader.exec_module(batch)

def main():
    p=argparse.ArgumentParser();p.add_argument('--shard',type=int,required=True);a=p.parse_args()
    if not 0<=a.shard<4:raise RuntimeError('INVALID_SHARD')
    url=os.environ['SUPABASE_DB_URL']
    if batch.REF not in url or os.environ.get('CLOUDFLARE_R2_BUCKET')!=batch.BUCKET:raise RuntimeError('DEVELOPMENT_ONLY')
    client=batch.r2_client();counts=Counter()
    with psycopg.connect(url) as db:
        cohort=batch.candidates(db);db.rollback()
        for symbol,isin,sid,_name,periods in cohort:
            if int(task_id(sid,'OCR_HEADER_REVIEW',None,{}),16)%4!=a.shard:continue
            with db.cursor() as cur:
                cur.execute("""SELECT raw_payload FROM data_source_records WHERE record_kind='RESULTS_R4_BSE_DATED_PDF_REVIEW_V1' AND raw_payload->>'security_id'=%s ORDER BY retrieved_at DESC LIMIT 1""",(str(sid),));row=cur.fetchone()
            db.rollback()
            if not row:continue
            for source in {s['original_sha256']:s for s in row[0].get('all_sources',[])}.values():
                digest=source['original_sha256'];prefix=batch.PREFIX+'ocr-dated-page-v1/original_version='+digest+'/'
                try:
                    listed=client.list_objects_v2(Bucket=batch.BUCKET,Prefix=prefix,MaxKeys=200)
                    pages={}
                    for obj in listed.get('Contents',[]):
                        m=re.search(r'/page=(\d+)/period_end=([\d-]+)/proof.json$',obj['Key'])
                        if not m or m[2] not in periods:continue
                        proof=json.loads(client.get_object(Bucket=batch.BUCKET,Key=obj['Key'])['Body'].read())
                        if not proof.get('rejection'):continue
                        pages.setdefault(int(m[1]),{})[m[2]]=proof['rejection']
                    if not pages:continue
                    raw=client.get_object(Bucket=batch.BUCKET,Key=source['original_r2_key'])['Body'].read()
                    if batch.sha(raw)!=digest:raise ValueError('ORIGINAL_HASH_MISMATCH')
                    with fitz.open(stream=raw,filetype='pdf') as pdf:
                        for page_no,rejections in pages.items():
                            page=OCRPage(pdf[page_no-1],300);rows=rows_for(page)
                            revenue=next((i for i,(_,ws) in enumerate(rows) if re.search(r'revenue|interest earned|premium',row_text(ws),re.I)),None)
                            if revenue is None:
                                headers=[(y,ws) for y,ws in rows if re.search(r'quarter|ended|year|month|lakhs?|crores?|millions?|INR|Rs\b|₹|financial|standalone|consolidated|20\d{2}',row_text(ws),re.I)][:24]
                            else:headers=rows[max(0,revenue-24):revenue]
                            value={'contract':'RESULTS_R4_DATED_OCR_HEADER_DIAGNOSTIC_V1','diagnostic_only':True,'symbol':symbol,'isin':isin,'security_id':str(sid),'page':page_no,'source_url':source['source_url'],'original_sha256':digest,'rejections':rejections,'date_header_candidates':[{'row':i,'y':y,'dates':d} for i,y,d in dated_headers(rows)],'rows':[{'y':y,'words':[[w[0],w[2],w[4]] for w in ws]} for y,ws in headers],'labels_without_amounts':[re.sub(r'[\d.,()+−-]+',' ',row_text(ws))[:220] for _,ws in rows[(revenue or 0):] if re.search(r'profit|tax|diluted|revenue|interest|premium',row_text(ws),re.I)][:32]}
                            encoded=batch.canonical(value);sha=batch.sha(encoded)
                            batch.immutable_put(client,batch.PREFIX+'ocr-header-diagnostics/sha256='+sha+'/diagnostic.json',encoded)
                            with db.cursor() as cur:
                                cur.execute("""INSERT INTO data_source_records(source_code,record_kind,external_record_id,payload_hash,raw_payload,terms_snapshot) VALUES('COMPANY_EXCHANGE_FILING','RESULTS_R4_DATED_OCR_HEADER_DIAGNOSTIC_V1',%s,%s,%s::jsonb,'{"diagnostic_only":true,"retention":"PRIVATE_DEVELOPMENT_R2"}'::jsonb) ON CONFLICT(source_code,record_kind,external_record_id,payload_hash) DO NOTHING""",(str(sid)+':'+digest+':'+str(page_no),sha,encoded.decode()))
                            db.commit();counts['pages_diagnosed']+=1
                except Exception as error:
                    db.rollback();counts['source_error_'+type(error).__name__]+=1
            counts['companies_checked']+=1
            print('R4_OCR_HEADER_DIAGNOSTIC_PROGRESS',json.dumps(dict(counts)),flush=True)
    print('R4_OCR_HEADER_DIAGNOSTIC_FINAL',json.dumps(dict(counts)),flush=True)
if __name__=='__main__':main()
