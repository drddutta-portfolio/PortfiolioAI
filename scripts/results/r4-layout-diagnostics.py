"""Private retained-original layout evidence; never emits financial amounts."""
import argparse,hashlib,importlib.util,json,os,re
from collections import Counter
from pathlib import Path
import fitz
from r4_pdf_geometry import rows_for,row_text,dated_headers,extract_page,clean_label

def label_without_amounts(text):
    return re.sub(r'\s+',' ',re.sub(r'[0-9][0-9,.()+%/\-]*',' ',text)).strip()[:240]

def header_words(rows,index,header_index,header_y,dates):
    out=[]
    for word in rows[index][1]:
        text=str(word[4]);center=(word[0]+word[2])/2
        in_date=(abs(rows[index][0]-header_y)<=28 and any(x0-1<=center<=x2+1 for _,x0,x2 in dates))
        if re.search(r'[0-9]',text) and not in_date:continue
        out.append([round(word[0],2),round(word[2],2),text[:80]])
    return out

def page_layout(page,page_no,periods):
    rows=rows_for(page);headers=list(dated_headers(rows))
    financial=[i for i,(_,ws) in enumerate(rows) if re.search(r'revenue\s+from\s+operations|diluted',row_text(ws),re.I)]
    if not financial or not headers:return None
    index,yy,dates=headers[0];first=(dates[0][1]+dates[0][2])/2;second=(dates[1][1]+dates[1][2])/2
    left=first-(second-first)/2
    labels=[]
    for y,words in rows[index+1:]:
        label=clean_label(row_text([w for w in words if (w[0]+w[2])/2<left]))
        if re.search(r'revenue|profit|tax|diluted|financial|standalone|consolidated',label,re.I):
            labels.append({'y':round(y,2),'label':label_without_amounts(label)})
    statuses={}
    for period in periods:
        try:
            parsed=extract_page(page,page_no,period,allow_comparative=True)
            statuses[period]={'status':'NATIVE_TRIO_LOCATED','scope':parsed['scope'],'column':parsed['column_index']}
        except ValueError as error:
            code=str(error).split(':')[0]
            metric=str(error).split(':')[1] if code=='CONFLICTING_GEOMETRIC_ROWS' else None
            statuses[period]={'status':code,'metric':metric}
    return {'page':page_no,'width':round(page.rect.width,2),'height':round(page.rect.height,2),
        'header_periods':[item[0] for item in dates],
        'headers':[{'y':round(rows[i][0],2),'words':header_words(rows,i,index,yy,dates)} for i in range(max(0,index-14),index+1)],
        'labels':labels[:45],'parse_status':statuses}

def main():
    import psycopg,requests
    from r4_official_issuer import bse_inventory_sources,ISSUERS,get
    parser=argparse.ArgumentParser();parser.add_argument('--symbol');parser.add_argument('--issuer-seeds',action='store_true');args=parser.parse_args()
    spec=importlib.util.spec_from_file_location('batch',Path(__file__).with_name('r4-bse-historical-batch.py'))
    batch=importlib.util.module_from_spec(spec);spec.loader.exec_module(batch)
    if (os.environ.get('GITHUB_REPOSITORY')!='drddutta-portfolio/PortfiolioAI'
        or os.environ.get('GITHUB_REF')!='refs/heads/PortfolioAI-Development'
        or batch.REF not in os.environ['SUPABASE_DB_URL'] or os.environ.get('CLOUDFLARE_R2_BUCKET')!=batch.BUCKET):
        raise RuntimeError('DEVELOPMENT_ONLY')
    counts=Counter();client=batch.r2_client();engine=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    with psycopg.connect(os.environ['SUPABASE_DB_URL']) as db:
        cohort=batch.candidates(db);db.rollback()
        if args.symbol:cohort=[row for row in cohort if row[0]==args.symbol]
        for symbol,isin,sid,_name,periods in cohort:
            with db.cursor() as cur:
                cur.execute("""SELECT raw_payload,payload_hash FROM data_source_records
                    WHERE record_kind='RESULTS_R4_BSE_DATED_PDF_REVIEW_V1' AND raw_payload->>'security_id'=%s
                      AND jsonb_typeof(raw_payload->'bse_identity')='object'
                      AND CASE WHEN jsonb_typeof(raw_payload->'all_sources')='array'
                          THEN jsonb_array_length(raw_payload->'all_sources') ELSE 0 END>0
                    ORDER BY retrieved_at DESC LIMIT 16""",(str(sid),));reviews=cur.fetchall()
            db.rollback();sources={}
            for review,digest in reviews:
                try:
                    for url,source in bse_inventory_sources(review,digest,symbol,isin,str(sid)).items():
                        if url not in sources or source['candidate_priority']<sources[url]['candidate_priority']:sources[url]=source
                except (ValueError,KeyError,TypeError):counts['identity_inventories_rejected']+=1
            if args.issuer_seeds:
                session=requests.Session();session.headers['User-Agent']='Mozilla/5.0'
                for url in ISSUERS.get(symbol,{}).get('originals',[])[:2]:
                    try:
                        raw,final=get(session,symbol,url,32_000_000)
                        if not raw.startswith(b'%PDF'):raise ValueError('ORIGINAL_PDF_REQUIRED')
                        digest=batch.sha(raw);key=batch.PREFIX+'evidence/original_version='+digest+'/issuer-original.pdf'
                        batch.immutable_put(client,key,raw)
                        sources[final]={'source_url':final,'original_sha256':digest,'original_r2_key':key,'candidate_priority':-1}
                    except Exception as error:counts['seed_failure_'+type(error).__name__]+=1
                session.close()
            ordered=sorted(sources,key=lambda url:(sources[url]['candidate_priority'],url))[:6]
            for url in ordered:
                source=sources[url]
                try:
                    raw=client.get_object(Bucket=batch.BUCKET,Key=source['original_r2_key'])['Body'].read(32_000_001)
                    if len(raw)>32_000_000 or batch.sha(raw)!=source['original_sha256']:raise ValueError('ORIGINAL_HASH_OR_SIZE_UNPROVEN')
                    with fitz.open(stream=raw,filetype='pdf') as pdf:
                        if len(pdf)>120:raise ValueError('ORIGINAL_PAGE_BOUND')
                        texts=[p.get_text('text') for p in pdf]
                        scopes=sorted({word.upper() for word in re.findall(r'\b(?:standalone|consolidated)\b',' '.join(texts),re.I)})
                        layouts=[]
                        for n in range(min(40,len(pdf))):
                            text=texts[n]
                            if not re.search(r'revenue\s+from\s+operations|diluted',text,re.I):continue
                            layout=page_layout(pdf[n],n+1,periods)
                            if layout:layouts.append(layout)
                            if len(layouts)>=2:break
                    payload={'contract':'RESULTS_R4_NATIVE_LAYOUT_DIAGNOSTIC_V1','symbol':symbol,'isin':isin,
                        'security_id':str(sid),'source_url':url,'original_sha256':source['original_sha256'],
                        'original_r2_key':source['original_r2_key'],'document_scope_words':scopes,
                        'layouts':layouts,'diagnostic_engine':engine,'financial_promotion_performed':False}
                    encoded=batch.canonical(payload);digest=batch.sha(encoded)
                    if len(encoded)>48_000:raise ValueError('LAYOUT_METADATA_SIZE_BOUND')
                    batch.immutable_put(client,batch.PREFIX+'native-layout-diagnostics/sha256='+digest+'/diagnostic.json',encoded)
                    with db.cursor() as cur:
                        cur.execute("""INSERT INTO data_source_records(source_code,record_kind,external_record_id,payload_hash,raw_payload,terms_snapshot)
                            VALUES('COMPANY_EXCHANGE_FILING','RESULTS_R4_NATIVE_LAYOUT_DIAGNOSTIC_V1',%s,%s,%s::jsonb,
                              '{"retention":"COMPACT_LAYOUT_METADATA; ORIGINAL_PRIVATE_R2; NO_FINANCIAL_PROMOTION"}'::jsonb)
                            ON CONFLICT(source_code,record_kind,external_record_id,payload_hash) DO NOTHING""",
                            (str(sid)+':'+source['original_sha256']+':'+engine,digest,encoded.decode()))
                    db.commit();counts['originals_inspected']+=1;counts['layouts_recorded']+=len(layouts)
                except Exception as error:
                    db.rollback();counts['failure_'+type(error).__name__]+=1
            counts['issuers_attempted']+=1
            print('R4_PRIVATE_LAYOUT_PROGRESS',json.dumps(dict(counts)),flush=True)
    print('R4_PRIVATE_LAYOUT_FINAL',json.dumps(dict(counts)),flush=True)

if __name__=='__main__':main()
